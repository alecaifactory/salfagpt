/**
 * Cloud Function: Update Agent Metrics
 * 
 * Triggers: Firestore onCreate, onUpdate, onDelete for context_sources
 * Purpose: Maintain agent_metrics_cache in real-time
 * Target: <100ms execution time
 * 
 * Created: 2025-11-18
 */

import * as functions from '@google-cloud/functions-framework';
import { Firestore } from '@google-cloud/firestore';
import crypto from 'crypto';

// Initialize Firestore
const firestore = new Firestore({
  projectId: process.env.GOOGLE_CLOUD_PROJECT || 'salfagpt'
});

/**
 * Type definitions (minimal - avoid importing from src)
 */
type UpdateTrigger = 
  | 'document_added'
  | 'document_removed'
  | 'document_updated'
  | 'agent_created'
  | 'scheduled_refresh'
  | 'manual_refresh';

interface ContextSourceData {
  assignedToAgents?: string[];
  status?: string;
  type?: string;
  metadata?: {
    originalFileSize?: number;
    tokensEstimate?: number;
    ragEnabled?: boolean;
    validated?: boolean;
  };
}

/**
 * Sign metrics with HMAC-SHA256
 */
function signMetrics(
  agentId: string,
  count: number,
  timestamp: number
): string {
  const secret = process.env.METRICS_SIGNING_KEY || 
                process.env.JWT_SECRET || 
                'dev-signing-key';
  
  const data = `${agentId}:${count}:${timestamp}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('hex');
  
  return signature;
}

/**
 * Get environment source
 */
function getEnvironmentSource(): 'localhost' | 'production' {
  const env = process.env.NODE_ENV || 'production';
  return env === 'development' ? 'localhost' : 'production';
}

/**
 * Update metrics for a single agent
 * Core logic extracted for reuse
 */
async function updateAgentMetrics(
  agentId: string,
  trigger: UpdateTrigger
): Promise<void> {
  const startTime = Date.now();
  
  try {
    // 1. Get agent data
    const agentDoc = await firestore
      .collection('conversations')
      .doc(agentId)
      .get();
    
    if (!agentDoc.exists) {
      console.warn(`⚠️ Agent ${agentId} not found, skipping metrics update`);
      return;
    }
    
    const agentData = agentDoc.data() || {};
    
    // 2. Query documents assigned to this agent
    // OPTIMIZED: Only fetch needed fields
    const docsSnapshot = await firestore
      .collection('context_sources')
      .where('assignedToAgents', 'array-contains', agentId)
      .get();
    
    const documents = docsSnapshot.docs.map(doc => doc.data() as ContextSourceData);
    
    // 3. Calculate metrics
    const documentCount = documents.length;
    const activeCount = documents.filter(d => d.status === 'active').length;
    const ragEnabledCount = documents.filter(d => 
      d.metadata?.ragEnabled === true
    ).length;
    const validatedCount = documents.filter(d => 
      d.metadata?.validated === true
    ).length;
    
    // 4. Size calculations
    const totalSizeBytes = documents.reduce((sum, doc) => 
      sum + (doc.metadata?.originalFileSize || 0), 0
    );
    const totalSizeMB = totalSizeBytes / (1024 * 1024);
    const avgSizeMB = documentCount > 0 ? totalSizeMB / documentCount : 0;
    
    const totalTokensEstimate = documents.reduce((sum, doc) => 
      sum + (doc.metadata?.tokensEstimate || 0), 0
    );
    
    // 5. Type breakdown
    const documentsByType = {
      pdf: documents.filter(d => d.type === 'pdf').length,
      csv: documents.filter(d => d.type === 'csv').length,
      excel: documents.filter(d => d.type === 'excel').length,
      word: documents.filter(d => d.type === 'word').length,
      url: documents.filter(d => d.type === 'web-url').length,
      api: documents.filter(d => d.type === 'api').length,
      folder: documents.filter(d => d.type === 'folder').length,
    };
    
    // 6. Build metrics object
    const now = new Date();
    const nowTimestamp = now.getTime();
    
    const metricsData = {
      id: agentId,
      agentId,
      userId: agentData.userId,
      organizationId: agentData.organizationId || null,
      domainId: agentData.domainId || null,
      
      documentCount,
      activeCount,
      ragEnabledCount,
      validatedCount,
      
      totalSizeMB: Math.round(totalSizeMB * 100) / 100,
      avgSizeMB: Math.round(avgSizeMB * 100) / 100,
      totalTokensEstimate,
      
      lastMessageAt: agentData.lastMessageAt || now,
      messagesCount: agentData.messageCount || 0,
      lastActivityAt: now,
      
      documentsByType,
      
      lastUpdated: now,
      updateTrigger: trigger,
      updateDurationMs: Date.now() - startTime,
      
      _version: (agentData._version || 0) + 1,
      source: getEnvironmentSource(),
    };
    
    // 7. Sign the metrics
    const signature = signMetrics(agentId, documentCount, nowTimestamp);
    const signedMetrics = {
      ...metricsData,
      _signature: signature
    };
    
    // 8. Save to cache collection
    await firestore
      .collection('agent_metrics_cache')
      .doc(agentId)
      .set(signedMetrics, { merge: true });
    
    const totalDuration = Date.now() - startTime;
    console.log(`✅ Updated metrics for ${agentId} in ${totalDuration}ms (trigger: ${trigger})`);
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Failed to update metrics for ${agentId} (${duration}ms):`, error);
    throw error;
  }
}

/**
 * HTTP trigger for manual refresh
 * GET /updateAgentMetrics?agentId=xxx
 */
functions.http('updateAgentMetrics', async (req, res) => {
  const agentId = req.query.agentId as string;
  
  if (!agentId) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'agentId query parameter is required'
    });
    return;
  }
  
  try {
    await updateAgentMetrics(agentId, 'manual_refresh');
    
    res.status(200).json({
      success: true,
      message: `Metrics updated for agent ${agentId}`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ HTTP trigger error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Firestore onCreate trigger
 * Runs when a new context source is created
 */
functions.cloudEvent('onContextSourceCreate', async (cloudEvent: any) => {
  const data = cloudEvent.data?.value?.fields;
  
  if (!data) {
    console.warn('⚠️ No data in onCreate event');
    return;
  }
  
  // Extract assignedToAgents array
  const assignedToAgents = data.assignedToAgents?.arrayValue?.values?.map(
    (v: any) => v.stringValue
  ) || [];
  
  if (assignedToAgents.length === 0) {
    console.log('ℹ️ Document not assigned to any agents, skipping');
    return;
  }
  
  // Update metrics for all assigned agents
  console.log(`🔄 Updating metrics for ${assignedToAgents.length} agents...`);
  
  await Promise.all(
    assignedToAgents.map((agentId: string) => 
      updateAgentMetrics(agentId, 'document_added')
    )
  );
  
  console.log(`✅ Updated ${assignedToAgents.length} agents`);
});

/**
 * Firestore onDelete trigger
 * Runs when a context source is deleted
 */
functions.cloudEvent('onContextSourceDelete', async (cloudEvent: any) => {
  const data = cloudEvent.data?.oldValue?.fields;
  
  if (!data) {
    console.warn('⚠️ No data in onDelete event');
    return;
  }
  
  // Extract assignedToAgents array
  const assignedToAgents = data.assignedToAgents?.arrayValue?.values?.map(
    (v: any) => v.stringValue
  ) || [];
  
  if (assignedToAgents.length === 0) {
    console.log('ℹ️ Document was not assigned to any agents, skipping');
    return;
  }
  
  // Update metrics for all previously assigned agents
  console.log(`🔄 Updating metrics for ${assignedToAgents.length} agents (deletion)...`);
  
  await Promise.all(
    assignedToAgents.map((agentId: string) => 
      updateAgentMetrics(agentId, 'document_removed')
    )
  );
  
  console.log(`✅ Updated ${assignedToAgents.length} agents`);
});

/**
 * Firestore onUpdate trigger
 * Runs when a context source is updated
 */
functions.cloudEvent('onContextSourceUpdate', async (cloudEvent: any) => {
  const oldData = cloudEvent.data?.oldValue?.fields;
  const newData = cloudEvent.data?.value?.fields;
  
  if (!oldData || !newData) {
    console.warn('⚠️ Missing data in onUpdate event');
    return;
  }
  
  // Extract assigned agents (old and new)
  const oldAgents = oldData.assignedToAgents?.arrayValue?.values?.map(
    (v: any) => v.stringValue
  ) || [];
  
  const newAgents = newData.assignedToAgents?.arrayValue?.values?.map(
    (v: any) => v.stringValue
  ) || [];
  
  // Find agents that need updating (union of old and new)
  const allAgents = Array.from(new Set([...oldAgents, ...newAgents]));
  
  if (allAgents.length === 0) {
    console.log('ℹ️ No agents affected by update, skipping');
    return;
  }
  
  console.log(`🔄 Updating metrics for ${allAgents.length} agents (update)...`);
  
  await Promise.all(
    allAgents.map((agentId: string) => 
      updateAgentMetrics(agentId, 'document_updated')
    )
  );
  
  console.log(`✅ Updated ${allAgents.length} agents`);
});

/**
 * Scheduled function: Refresh stale metrics
 * Runs: Every 1 hour
 */
functions.http('refreshStaleMetrics', async (req, res) => {
  const maxAgeMinutes = parseInt(req.query.maxAge as string) || 60;
  
  try {
    const cutoffTime = new Date(Date.now() - maxAgeMinutes * 60 * 1000);
    
    // Find stale metrics
    const snapshot = await firestore
      .collection('agent_metrics_cache')
      .where('lastUpdated', '<', cutoffTime)
      .limit(100)
      .get();
    
    if (snapshot.empty) {
      res.status(200).json({
        message: 'No stale metrics found',
        refreshed: 0
      });
      return;
    }
    
    console.log(`🔄 Refreshing ${snapshot.size} stale metrics...`);
    
    // Update in parallel (chunks of 10)
    const agentIds = snapshot.docs.map(doc => doc.id);
    const chunks = chunkArray(agentIds, 10);
    
    for (const chunk of chunks) {
      await Promise.all(
        chunk.map(id => updateAgentMetrics(id, 'scheduled_refresh'))
      );
    }
    
    console.log(`✅ Refreshed ${snapshot.size} metrics`);
    
    res.status(200).json({
      message: 'Metrics refreshed successfully',
      refreshed: snapshot.size,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Failed to refresh stale metrics:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Utility: Chunk array
 */
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}


