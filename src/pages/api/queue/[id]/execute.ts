/**
 * Queue Item Execution API
 * POST /api/queue/:id/execute - Execute a specific queue item
 */

import type { APIRoute } from 'astro';
import { firestore } from '../../../../lib/firestore';
import type { MessageQueueItem } from '../../../../types/queue';

const QUEUE_COLLECTION = 'message_queue';

// Helper to check if dependencies are met
async function checkDependencies(dependsOn: string[]): Promise<{
  allMet: boolean;
  unmet: string[];
}> {
  if (!dependsOn || dependsOn.length === 0) {
    return { allMet: true, unmet: [] };
  }
  
  const unmet: string[] = [];
  
  for (const depId of dependsOn) {
    const doc = await firestore
      .collection(QUEUE_COLLECTION)
      .doc(depId)
      .get();
    
    if (!doc.exists || doc.data()?.status !== 'completed') {
      unmet.push(depId);
    }
  }
  
  return {
    allMet: unmet.length === 0,
    unmet,
  };
}

// Helper to detect feedback request in AI response
function detectsFeedbackRequest(content: string): boolean {
  const feedbackKeywords = [
    'necesito más información',
    'por favor proporciona',
    'podrías aclarar',
    'podrías especificar',
    'could you provide',
    'please provide',
    'more information needed',
    'please clarify',
    'could you specify',
  ];
  
  const lowerContent = content.toLowerCase();
  return feedbackKeywords.some(keyword => lowerContent.includes(keyword));
}

export const POST: APIRoute = async ({ params, request }) => {
  try {
    const itemId = params.id;
    
    if (!itemId) {
      return new Response(
        JSON.stringify({ error: 'Item ID required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const body = await request.json();
    const { userId } = body;
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('⚙️ Executing queue item:', itemId);
    
    // Get queue item
    const doc = await firestore
      .collection(QUEUE_COLLECTION)
      .doc(itemId)
      .get();
    
    if (!doc.exists) {
      return new Response(
        JSON.stringify({ error: 'Queue item not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const item = { id: doc.id, ...doc.data() } as MessageQueueItem;
    
    // Verify ownership
    if (item.userId !== userId) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - not your queue item' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Check if already processing or completed
    if (item.status === 'processing') {
      return new Response(
        JSON.stringify({ error: 'Item already processing' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    if (item.status === 'completed') {
      return new Response(
        JSON.stringify({ 
          error: 'Item already completed',
          userMessageId: item.userMessageId,
          assistantMessageId: item.assistantMessageId,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Check dependencies
    if (item.dependsOn && item.dependsOn.length > 0) {
      const depCheck = await checkDependencies(item.dependsOn);
      
      if (!depCheck.allMet) {
        console.log('⏸️ Dependencies not met:', depCheck.unmet);
        return new Response(
          JSON.stringify({ 
            error: 'Dependencies not met',
            unmetDependencies: depCheck.unmet,
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
    
    // Mark as processing
    const startTime = Date.now();
    await firestore
      .collection(QUEUE_COLLECTION)
      .doc(itemId)
      .update({
        status: 'processing',
        startedAt: new Date(),
        updatedAt: new Date(),
      });
    
    try {
      // Use captured context or default to empty
      const contextToUse = item.contextSnapshot || {
        activeSourceIds: [],
        model: 'gemini-2.5-flash',
        systemPrompt: 'Eres un asistente de IA útil, preciso y amigable.',
      };
      
      // Send message to agent (reuse existing message API)
      const messageResponse = await fetch(
        `${request.url.split('/api')[0]}/api/conversations/${item.conversationId}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: item.userId,
            message: item.message,
            model: contextToUse.model,
            systemPrompt: contextToUse.systemPrompt,
            activeSourceIds: contextToUse.activeSourceIds,
            queueItemId: itemId, // Tag message as from queue
          }),
        }
      );
      
      if (!messageResponse.ok) {
        throw new Error(`Message API error: ${messageResponse.status}`);
      }
      
      const messageResult = await messageResponse.json();
      
      // Check if AI requested feedback
      const assistantContent = messageResult.assistantMessage?.content?.text || 
                             String(messageResult.assistantMessage?.content || '');
      const needsFeedback = detectsFeedbackRequest(assistantContent);
      
      // Mark as completed
      const executionTime = Date.now() - startTime;
      await firestore
        .collection(QUEUE_COLLECTION)
        .doc(itemId)
        .update({
          status: 'completed',
          completedAt: new Date(),
          executionTimeMs: executionTime,
          userMessageId: messageResult.userMessage?.id,
          assistantMessageId: messageResult.assistantMessage?.id,
          updatedAt: new Date(),
        });
      
      console.log(`✅ Queue item executed successfully: ${itemId} (${executionTime}ms)`);
      
      return new Response(
        JSON.stringify({ 
          success: true,
          executionTimeMs: executionTime,
          needsFeedback,
          userMessageId: messageResult.userMessage?.id,
          assistantMessageId: messageResult.assistantMessage?.id,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
      
    } catch (executionError) {
      // Mark as failed
      const errorMessage = executionError instanceof Error 
        ? executionError.message 
        : String(executionError);
      
      await firestore
        .collection(QUEUE_COLLECTION)
        .doc(itemId)
        .update({
          status: 'failed',
          completedAt: new Date(),
          errorMessage,
          retryCount: (item.retryCount || 0) + 1,
          lastError: errorMessage,
          updatedAt: new Date(),
        });
      
      console.error(`❌ Queue item execution failed: ${itemId}`, executionError);
      
      return new Response(
        JSON.stringify({ 
          error: 'Execution failed',
          details: errorMessage,
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
  } catch (error) {
    console.error('❌ Error in queue execution:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to execute queue item',
        details: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};










