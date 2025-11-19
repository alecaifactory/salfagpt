/**
 * Agent Metrics Cache System
 * 
 * Purpose: High-performance derived view for agent metrics
 * Target: <50ms read time, <100ms update time
 * Pattern: Calculate once, use many times
 * 
 * Architecture:
 * 1. Cloud Function updates cache on context_sources changes
 * 2. API reads from cache (not raw data)
 * 3. Digital signature ensures integrity
 * 4. 3-layer caching (Browser → Edge → Firestore)
 * 
 * Created: 2025-11-18
 */

import { firestore } from './firestore';
import { signMetricsObject, verifyMetricsSignature } from './signature';
import type { 
  AgentMetricsCache, 
  UpdateTrigger,
  BulkAgentMetrics 
} from '../types/metrics-cache';

const COLLECTION_NAME = 'agent_metrics_cache';

/**
 * Get environment source
 */
function getEnvironmentSource(): 'localhost' | 'production' {
  const isDevelopment = process.env.NODE_ENV === 'development' ||
                       (typeof import.meta !== 'undefined' && import.meta.env?.DEV);
  return isDevelopment ? 'localhost' : 'production';
}

/**
 * Update agent metrics cache
 * Called by Cloud Function when context_sources change
 * 
 * @param agentId - Agent to update metrics for
 * @param trigger - What triggered this update
 * @returns Updated metrics
 * 
 * Target: <100ms execution time
 */
export async function updateAgentMetrics(
  agentId: string,
  trigger: UpdateTrigger = 'manual_refresh'
): Promise<AgentMetricsCache> {
  const startTime = Date.now();
  
  try {
    // 1. Get agent data (to extract userId, organizationId, etc.)
    const agentDoc = await firestore
      .collection('conversations')
      .doc(agentId)
      .get();
    
    if (!agentDoc.exists) {
      throw new Error(`Agent ${agentId} not found`);
    }
    
    const agentData = agentDoc.data();
    
    // 2. Count documents assigned to this agent
    // OPTIMIZED: Use select() to only fetch IDs, not full documents
    const docsSnapshot = await firestore
      .collection('context_sources')
      .where('assignedToAgents', 'array-contains', agentId)
      .select('status', 'type', 'metadata') // Only needed fields
      .get();
    
    const documents = docsSnapshot.docs.map(doc => doc.data());
    
    // 3. Calculate metrics
    const documentCount = documents.length;
    const activeCount = documents.filter(d => d.status === 'active').length;
    const ragEnabledCount = documents.filter(d => 
      d.metadata?.ragEnabled === true
    ).length;
    const validatedCount = documents.filter(d => 
      d.metadata?.validated === true
    ).length;
    
    // 4. Calculate size metrics
    const totalSizeBytes = documents.reduce((sum, doc) => 
      sum + (doc.metadata?.originalFileSize || 0), 0
    );
    const totalSizeMB = totalSizeBytes / (1024 * 1024);
    const avgSizeMB = documentCount > 0 ? totalSizeMB / documentCount : 0;
    
    const totalTokensEstimate = documents.reduce((sum, doc) => 
      sum + (doc.metadata?.tokensEstimate || 0), 0
    );
    
    // 5. Document type breakdown
    const documentsByType = {
      pdf: documents.filter(d => d.type === 'pdf').length,
      csv: documents.filter(d => d.type === 'csv').length,
      excel: documents.filter(d => d.type === 'excel').length,
      word: documents.filter(d => d.type === 'word').length,
      url: documents.filter(d => d.type === 'web-url').length,
      api: documents.filter(d => d.type === 'api').length,
      folder: documents.filter(d => d.type === 'folder').length,
    };
    
    // 6. Get message count (optional - can be expensive for large conversations)
    // For now, we'll use the cached count from the conversation document
    const messagesCount = agentData?.messageCount || 0;
    const lastMessageAt = agentData?.lastMessageAt || new Date();
    
    // 7. Build metrics object
    const now = new Date();
    const metricsData = {
      id: agentId,
      agentId,
      userId: agentData.userId,
      organizationId: agentData.organizationId,
      domainId: agentData.domainId,
      
      documentCount,
      activeCount,
      ragEnabledCount,
      validatedCount,
      
      totalSizeMB: Math.round(totalSizeMB * 100) / 100, // 2 decimals
      avgSizeMB: Math.round(avgSizeMB * 100) / 100,
      totalTokensEstimate,
      
      lastMessageAt,
      messagesCount,
      lastActivityAt: now,
      
      documentsByType,
      
      lastUpdated: now,
      updateTrigger: trigger,
      updateDurationMs: Date.now() - startTime,
      
      _version: (agentData._version || 0) + 1,
      source: getEnvironmentSource(),
    };
    
    // 8. Sign the metrics
    const signedMetrics = signMetricsObject(metricsData);
    
    // 9. Save to cache collection
    await firestore
      .collection(COLLECTION_NAME)
      .doc(agentId)
      .set(signedMetrics, { merge: true });
    
    const totalDuration = Date.now() - startTime;
    console.log(`✅ Updated metrics for ${agentId} in ${totalDuration}ms`);
    
    return signedMetrics as AgentMetricsCache;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Failed to update metrics for ${agentId} (${duration}ms):`, error);
    throw error;
  }
}

/**
 * Get agent metrics from cache
 * 
 * @param agentId - Agent ID
 * @param verifySignature - Whether to verify the signature (default: true)
 * @returns Cached metrics or null if not found
 * 
 * Target: <50ms execution time
 */
export async function getAgentMetrics(
  agentId: string,
  verifySignature = true
): Promise<AgentMetricsCache | null> {
  const startTime = Date.now();
  
  try {
    const doc = await firestore
      .collection(COLLECTION_NAME)
      .doc(agentId)
      .get();
    
    if (!doc.exists) {
      console.warn(`⚠️ No cached metrics for ${agentId}, triggering update`);
      // Trigger async update (don't wait)
      updateAgentMetrics(agentId, 'manual_refresh').catch(console.error);
      return null;
    }
    
    const metrics = doc.data() as AgentMetricsCache;
    
    // Verify signature if requested
    if (verifySignature) {
      const verification = verifyMetricsSignature(metrics);
      if (!verification.isValid) {
        console.warn(`⚠️ Invalid signature for ${agentId}, triggering recalc`);
        updateAgentMetrics(agentId, 'manual_refresh').catch(console.error);
        // Return the data anyway but log the issue
      }
    }
    
    const duration = Date.now() - startTime;
    console.log(`✅ Retrieved metrics for ${agentId} in ${duration}ms`);
    
    return metrics;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Failed to get metrics for ${agentId} (${duration}ms):`, error);
    return null;
  }
}

/**
 * Get metrics for multiple agents in bulk
 * More efficient than calling getAgentMetrics multiple times
 * 
 * @param agentIds - Array of agent IDs
 * @returns Map of agentId → metrics
 * 
 * Target: <100ms for up to 50 agents
 */
export async function getBulkAgentMetrics(
  agentIds: string[]
): Promise<BulkAgentMetrics> {
  const startTime = Date.now();
  
  try {
    // Firestore 'in' query limit is 10, so we need to chunk
    const chunks = chunkArray(agentIds, 10);
    const allDocs: any[] = [];
    
    for (const chunk of chunks) {
      const snapshot = await firestore
        .collection(COLLECTION_NAME)
        .where('agentId', 'in', chunk)
        .get();
      
      allDocs.push(...snapshot.docs);
    }
    
    // Build map
    const metricsMap = new Map<string, AgentMetricsCache>();
    allDocs.forEach(doc => {
      metricsMap.set(doc.id, doc.data() as AgentMetricsCache);
    });
    
    // For agents without cached metrics, trigger updates
    const missingAgentIds = agentIds.filter(id => !metricsMap.has(id));
    if (missingAgentIds.length > 0) {
      console.log(`⚠️ ${missingAgentIds.length} agents missing metrics, triggering updates`);
      Promise.all(
        missingAgentIds.map(id => updateAgentMetrics(id, 'manual_refresh'))
      ).catch(console.error);
    }
    
    const duration = Date.now() - startTime;
    
    return {
      metrics: metricsMap,
      metadata: {
        totalAgents: agentIds.length,
        respondedIn: `${duration}ms`,
        fromCache: true,
        timestamp: new Date().toISOString(),
      }
    };
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Failed to get bulk metrics (${duration}ms):`, error);
    throw error;
  }
}

/**
 * Refresh stale metrics
 * Updates metrics that haven't been updated recently
 * 
 * @param maxAgeMinutes - Max age before refresh (default: 60 minutes)
 * @returns Number of metrics refreshed
 */
export async function refreshStaleMetrics(
  maxAgeMinutes: number = 60
): Promise<number> {
  const startTime = Date.now();
  const cutoffTime = new Date(Date.now() - maxAgeMinutes * 60 * 1000);
  
  try {
    // Find stale metrics
    const snapshot = await firestore
      .collection(COLLECTION_NAME)
      .where('lastUpdated', '<', cutoffTime)
      .limit(100) // Process in batches
      .get();
    
    if (snapshot.empty) {
      console.log('✅ No stale metrics found');
      return 0;
    }
    
    console.log(`🔄 Refreshing ${snapshot.size} stale metrics...`);
    
    // Update in parallel (max 10 concurrent)
    const agentIds = snapshot.docs.map(doc => doc.id);
    const chunks = chunkArray(agentIds, 10);
    
    for (const chunk of chunks) {
      await Promise.all(
        chunk.map(id => updateAgentMetrics(id, 'scheduled_refresh'))
      );
    }
    
    const duration = Date.now() - startTime;
    console.log(`✅ Refreshed ${snapshot.size} metrics in ${duration}ms`);
    
    return snapshot.size;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Failed to refresh stale metrics (${duration}ms):`, error);
    throw error;
  }
}

/**
 * Delete metrics cache for an agent
 * Used when agent is deleted
 * 
 * @param agentId - Agent ID
 */
export async function deleteAgentMetrics(agentId: string): Promise<void> {
  try {
    await firestore
      .collection(COLLECTION_NAME)
      .doc(agentId)
      .delete();
    
    console.log(`✅ Deleted metrics cache for ${agentId}`);
  } catch (error) {
    console.error(`❌ Failed to delete metrics for ${agentId}:`, error);
    throw error;
  }
}

/**
 * Get cache statistics
 * For monitoring and dashboard
 * 
 * @returns Cache health metrics
 */
export async function getCacheStatistics() {
  try {
    const snapshot = await firestore
      .collection(COLLECTION_NAME)
      .select('lastUpdated', 'updateDurationMs')
      .limit(1000) // Sample
      .get();
    
    if (snapshot.empty) {
      return {
        totalCached: 0,
        avgUpdateTime: 0,
        staleCaches: 0,
      };
    }
    
    const now = Date.now();
    const fiveMinutesAgo = now - 5 * 60 * 1000;
    
    const metrics = snapshot.docs.map(doc => doc.data());
    const avgUpdateTime = metrics.reduce((sum, m) => 
      sum + (m.updateDurationMs || 0), 0
    ) / metrics.length;
    
    const staleCaches = metrics.filter(m => 
      m.lastUpdated.toMillis() < fiveMinutesAgo
    ).length;
    
    return {
      totalCached: snapshot.size,
      avgUpdateTime: Math.round(avgUpdateTime),
      staleCaches,
      cacheHitRate: ((snapshot.size - staleCaches) / snapshot.size * 100).toFixed(1),
    };
    
  } catch (error) {
    console.error('❌ Failed to get cache statistics:', error);
    throw error;
  }
}

/**
 * Utility: Chunk array into smaller arrays
 */
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Trigger metrics update for an agent
 * Non-blocking - returns immediately
 * 
 * @param agentId - Agent ID
 * @param trigger - Update trigger
 */
export function triggerMetricsUpdate(
  agentId: string,
  trigger: UpdateTrigger = 'manual_refresh'
): void {
  // Non-blocking update
  updateAgentMetrics(agentId, trigger)
    .then(() => console.log(`✅ Background update completed for ${agentId}`))
    .catch(err => console.error(`❌ Background update failed for ${agentId}:`, err));
}

/**
 * Check if metrics need refresh
 * Based on age threshold
 * 
 * @param metrics - Metrics to check
 * @param maxAgeMinutes - Maximum age in minutes (default: 5)
 * @returns True if refresh needed
 */
export function needsRefresh(
  metrics: AgentMetricsCache | null,
  maxAgeMinutes: number = 5
): boolean {
  if (!metrics) return true;
  
  const ageMs = Date.now() - (metrics.lastUpdated as any).toMillis();
  const ageMinutes = ageMs / (60 * 1000);
  
  return ageMinutes > maxAgeMinutes;
}

