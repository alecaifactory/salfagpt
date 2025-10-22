/**
 * Backfill agent-source assignments to BigQuery
 * 
 * This script reads all existing assignments from Firestore and syncs them to BigQuery
 * Run this once after creating the agent_source_assignments table
 */

import { firestore, COLLECTIONS } from '../src/lib/firestore';
import { syncAgentAssignments } from '../src/lib/bigquery-agent-sync';

async function backfillAssignments() {
  try {
    console.log('🔄 Starting backfill of agent-source assignments to BigQuery...');
    console.log('');
    
    // 1. Get all context sources with assignments
    console.log('1/3 Loading context sources from Firestore...');
    const sourcesSnapshot = await firestore
      .collection(COLLECTIONS.CONTEXT_SOURCES)
      .get();
    
    const sourcesWithAssignments = sourcesSnapshot.docs
      .map(doc => ({
        id: doc.id,
        userId: doc.data().userId,
        assignedToAgents: doc.data().assignedToAgents || [],
      }))
      .filter(source => source.assignedToAgents.length > 0);
    
    console.log(`   ✓ Found ${sourcesWithAssignments.length} sources with assignments`);
    console.log('');
    
    // 2. Group by agent for efficient syncing
    console.log('2/3 Grouping assignments by agent...');
    const assignmentsByAgent = new Map<string, { userId: string; sourceIds: string[] }>();
    
    for (const source of sourcesWithAssignments) {
      for (const agentId of source.assignedToAgents) {
        if (!assignmentsByAgent.has(agentId)) {
          assignmentsByAgent.set(agentId, {
            userId: source.userId,
            sourceIds: []
          });
        }
        assignmentsByAgent.get(agentId)!.sourceIds.push(source.id);
      }
    }
    
    console.log(`   ✓ Found ${assignmentsByAgent.size} unique agents with assignments`);
    console.log('');
    
    // 3. Sync to BigQuery
    console.log('3/3 Syncing to BigQuery...');
    let successCount = 0;
    let errorCount = 0;
    
    for (const [agentId, { userId, sourceIds }] of assignmentsByAgent.entries()) {
      try {
        await syncAgentAssignments(agentId, sourceIds, userId, 'assign');
        successCount++;
        
        if (successCount % 10 === 0) {
          console.log(`   Progress: ${successCount}/${assignmentsByAgent.size} agents synced...`);
        }
      } catch (error) {
        errorCount++;
        console.error(`   ❌ Failed to sync agent ${agentId}:`, error);
      }
    }
    
    console.log('');
    console.log('✅ Backfill complete!');
    console.log(`   Success: ${successCount} agents`);
    console.log(`   Errors: ${errorCount} agents`);
    console.log(`   Total assignments: ${sourcesWithAssignments.reduce((sum, s) => sum + s.assignedToAgents.length, 0)}`);
    
  } catch (error) {
    console.error('❌ Backfill failed:', error);
    throw error;
  }
}

// Run backfill
backfillAssignments()
  .then(() => {
    console.log('');
    console.log('🎉 All done! Agent-based search should now work optimally.');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Backfill failed:', error);
    process.exit(1);
  });

