/**
 * Queue Metrics API
 * GET /api/queue/metrics?conversationId={id} - Get queue performance metrics
 */

import type { APIRoute } from 'astro';
import { firestore } from '../../../lib/firestore';
import type { QueueMetrics } from '../../../types/queue';

const QUEUE_COLLECTION = 'message_queue';
const METRICS_COLLECTION = 'queue_metrics';

/**
 * Calculate queue metrics from queue items
 */
async function calculateQueueMetrics(conversationId: string): Promise<QueueMetrics> {
  const snapshot = await firestore
    .collection(QUEUE_COLLECTION)
    .where('conversationId', '==', conversationId)
    .get();
  
  const items = snapshot.docs.map(doc => doc.data());
  
  const pending = items.filter(i => i.status === 'pending');
  const completed = items.filter(i => i.status === 'completed');
  const failed = items.filter(i => i.status === 'failed');
  const cancelled = items.filter(i => i.status === 'cancelled');
  
  // Calculate average execution time (only completed items)
  const completedWithTime = completed.filter(i => i.executionTimeMs);
  const avgExecutionTime = completedWithTime.length > 0
    ? completedWithTime.reduce((sum, i) => sum + (i.executionTimeMs || 0), 0) / completedWithTime.length
    : 0;
  
  // Calculate average wait time (time from creation to execution start)
  const completedWithDates = completed.filter(i => i.startedAt && i.createdAt);
  const avgWaitTime = completedWithDates.length > 0
    ? completedWithDates.reduce((sum, i) => {
        const waitMs = i.startedAt!.getTime() - i.createdAt!.getTime();
        return sum + waitMs;
      }, 0) / completedWithDates.length
    : 0;
  
  // Success rate
  const totalExecuted = completed.length + failed.length;
  const successRate = totalExecuted > 0
    ? (completed.length / totalExecuted) * 100
    : 100;
  
  // Peak queue depth (stored separately or calculated)
  const metricsDoc = await firestore
    .collection(METRICS_COLLECTION)
    .doc(conversationId)
    .get();
  
  const storedMetrics = metricsDoc.exists ? metricsDoc.data() : {};
  const currentDepth = pending.length;
  const peakDepth = Math.max(currentDepth, storedMetrics?.peakQueueDepth || 0);
  
  // Last executed
  const lastExecuted = completed
    .filter(i => i.completedAt)
    .sort((a, b) => b.completedAt!.getTime() - a.completedAt!.getTime())[0];
  
  const metrics: QueueMetrics = {
    conversationId,
    totalItemsQueued: items.length,
    completedItems: completed.length,
    failedItems: failed.length,
    cancelledItems: cancelled.length,
    averageExecutionTime: Math.round(avgExecutionTime),
    averageWaitTime: Math.round(avgWaitTime),
    successRate: Math.round(successRate * 100) / 100, // 2 decimal places
    currentQueueDepth: currentDepth,
    peakQueueDepth: peakDepth,
    lastExecutedAt: lastExecuted?.completedAt,
    createdAt: storedMetrics?.createdAt || new Date(),
    updatedAt: new Date(),
  };
  
  // Save updated metrics
  await firestore
    .collection(METRICS_COLLECTION)
    .doc(conversationId)
    .set(metrics, { merge: true });
  
  return metrics;
}

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const conversationId = url.searchParams.get('conversationId');
    const userId = url.searchParams.get('userId');
    
    if (!conversationId || !userId) {
      return new Response(
        JSON.stringify({ error: 'conversationId and userId required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('📊 Calculating queue metrics:', conversationId);
    
    // Verify user owns conversation
    const convDoc = await firestore
      .collection('conversations')
      .doc(conversationId)
      .get();
    
    if (!convDoc.exists || convDoc.data()?.userId !== userId) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - not your conversation' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Calculate metrics
    const metrics = await calculateQueueMetrics(conversationId);
    
    console.log('✅ Queue metrics calculated:', {
      total: metrics.totalItemsQueued,
      completed: metrics.completedItems,
      successRate: metrics.successRate,
    });
    
    return new Response(
      JSON.stringify(metrics),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('❌ Error calculating queue metrics:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to calculate queue metrics',
        details: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};





