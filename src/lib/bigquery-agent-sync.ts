/**
 * BigQuery Agent-Context Synchronization
 * 
 * Ensures agent-source assignments are synced to BigQuery for optimal agent search
 * 
 * When to sync:
 * 1. Chat created - inherit assignments from parent agent
 * 2. Source assigned/unassigned to agent
 * 3. Bulk assignment operations
 */

import { BigQuery } from '@google-cloud/bigquery';
import { CURRENT_PROJECT_ID } from './firestore';

const PROJECT_ID = CURRENT_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || 'salfagpt';

const bigquery = new BigQuery({
  projectId: PROJECT_ID,
});

const DATASET_ID = 'flow_analytics';
const ASSIGNMENTS_TABLE = 'agent_source_assignments';

console.log('🔗 BigQuery Agent Sync initialized');
console.log(`  Project: ${PROJECT_ID}`);

export interface AgentSourceAssignment {
  agentId: string;
  sourceId: string;
  userId: string;
  assignedAt: Date;
  isActive: boolean; // false when unassigned
  source: 'localhost' | 'production';
}

/**
 * Sync agent-source assignments to BigQuery
 * This enables agent-based search without querying Firestore first
 */
export async function syncAgentAssignments(
  agentId: string,
  sourceIds: string[],
  userId: string,
  operation: 'assign' | 'unassign' = 'assign'
): Promise<void> {
  try {
    const source = process.env.NODE_ENV === 'production' ? 'production' : 'localhost';
    const timestamp = new Date();
    
    console.log(`🔗 Syncing ${sourceIds.length} source assignments for agent ${agentId}...`);
    
    // Build rows for BigQuery
    const rows = sourceIds.map(sourceId => ({
      agentId,
      sourceId,
      userId,
      assignedAt: timestamp.toISOString(),
      isActive: operation === 'assign',
      source,
      // Add timestamp for deduplication
      syncedAt: timestamp.toISOString(),
    }));

    // Insert into BigQuery (non-blocking in dev)
    if (process.env.NODE_ENV === 'development') {
      console.log(`📝 [DEV] Would sync ${rows.length} assignments to BigQuery:`, {
        agentId,
        sourceCount: sourceIds.length,
        operation
      });
      return;
    }

    // Production: Actually insert
    await bigquery
      .dataset(DATASET_ID)
      .table(ASSIGNMENTS_TABLE)
      .insert(rows);

    console.log(`✅ Synced ${rows.length} assignments to BigQuery (${Date.now() - timestamp.getTime()}ms)`);
    
  } catch (error) {
    // Non-blocking error - don't crash the app
    console.warn('⚠️ Failed to sync assignments to BigQuery (non-critical):', error);
  }
}

/**
 * Bulk sync all assignments for an agent
 * Used when creating a chat that inherits from parent agent
 */
export async function bulkSyncAgentAssignments(
  agentId: string,
  sourceIds: string[],
  userId: string
): Promise<void> {
  // Same as syncAgentAssignments but with bulk optimization
  return syncAgentAssignments(agentId, sourceIds, userId, 'assign');
}

/**
 * Remove all assignments for an agent
 * Used when deleting an agent or removing all context
 */
export async function removeAllAgentAssignments(
  agentId: string
): Promise<void> {
  try {
    const source = process.env.NODE_ENV === 'production' ? 'production' : 'localhost';
    
    console.log(`🗑️ Removing all assignments for agent ${agentId}...`);

    if (process.env.NODE_ENV === 'development') {
      console.log(`📝 [DEV] Would delete assignments for agent: ${agentId}`);
      return;
    }

    // Mark all as inactive (soft delete for audit trail)
    const query = `
      UPDATE \`${PROJECT_ID}.${DATASET_ID}.${ASSIGNMENTS_TABLE}\`
      SET isActive = false,
          unassignedAt = CURRENT_TIMESTAMP()
      WHERE agentId = @agentId
        AND isActive = true
    `;

    const options = {
      query,
      params: { agentId },
    };

    await bigquery.query(options);
    console.log(`✅ Removed assignments for agent ${agentId}`);
    
  } catch (error) {
    console.warn('⚠️ Failed to remove assignments (non-critical):', error);
  }
}

/**
 * Get active source IDs for an agent from BigQuery
 * Faster than Firestore for large agent datasets
 */
export async function getAgentSourceIds(
  agentId: string,
  userId: string
): Promise<string[]> {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log(`📝 [DEV] Would query assignments for agent: ${agentId}`);
      return [];
    }

    const query = `
      SELECT DISTINCT sourceId
      FROM \`${PROJECT_ID}.${DATASET_ID}.${ASSIGNMENTS_TABLE}\`
      WHERE agentId = @agentId
        AND userId = @userId
        AND isActive = true
      ORDER BY assignedAt DESC
    `;

    const options = {
      query,
      params: { agentId, userId },
    };

    const [rows] = await bigquery.query(options);
    const sourceIds = rows.map((row: any) => row.sourceId);
    
    console.log(`✅ Found ${sourceIds.length} active sources for agent from BigQuery`);
    return sourceIds;
    
  } catch (error) {
    console.warn('⚠️ Failed to get agent sources from BigQuery:', error);
    return [];
  }
}

