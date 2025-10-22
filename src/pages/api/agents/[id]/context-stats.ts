/**
 * GET /api/agents/:id/context-stats
 * 
 * Returns minimal context statistics for an agent (count only, no metadata)
 * 
 * Performance: < 500ms (just count queries)
 * 
 * This is all the frontend needs for RAG with BigQuery:
 * - Total sources assigned
 * - Active sources enabled
 * 
 * BigQuery handles finding relevant chunks, so we don't need to load
 * full source metadata upfront!
 */

import type { APIRoute } from 'astro';
import { getSession } from '../../../../lib/auth';
import { firestore, COLLECTIONS } from '../../../../lib/firestore';

export const GET: APIRoute = async ({ params, cookies }) => {
  const startTime = Date.now();
  
  try {
    const agentId = params.id;
    
    if (!agentId) {
      return new Response(
        JSON.stringify({ error: 'Agent ID required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 1. Verify authentication
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📊 Getting context stats for agent/conversation: ${agentId}`);

    // 2. Check if this is a chat (has parent agent) or direct agent
    const conversationDoc = await firestore
      .collection(COLLECTIONS.CONVERSATIONS)
      .doc(agentId)
      .get();

    const conversation = conversationDoc.data();
    const isChat = !!conversation?.agentId;
    const effectiveAgentId = isChat ? conversation.agentId : agentId;

    if (isChat) {
      console.log(`  🔗 Chat detected - inheriting from parent agent: ${effectiveAgentId}`);
    }

    // 3. Count sources assigned to the effective agent (fast count query)
    const assignedCountSnapshot = await firestore
      .collection(COLLECTIONS.CONTEXT_SOURCES)
      .where('userId', '==', session.id)
      .where('assignedToAgents', 'array-contains', effectiveAgentId)
      .count()
      .get();

    const totalCount = assignedCountSnapshot.data().count;

    // 4. Get active source IDs from conversation_context (tiny document)
    // For chats, check parent agent's context
    const contextDoc = await firestore
      .collection('conversation_context')
      .doc(effectiveAgentId)
      .get();

    const activeContextSourceIds = contextDoc.exists 
      ? (contextDoc.data()?.activeContextSourceIds || [])
      : [];

    const activeCount = activeContextSourceIds.length;

    const elapsed = Date.now() - startTime;

    console.log(`✅ Context stats for ${isChat ? 'chat' : 'agent'} ${agentId}:`, {
      totalCount,
      activeCount,
      effectiveAgentId: isChat ? effectiveAgentId : undefined,
      elapsed: `${elapsed}ms`
    });

    return new Response(
      JSON.stringify({
        totalCount,
        activeCount,
        activeContextSourceIds, // Return IDs for toggling if needed
        agentId,
        effectiveAgentId: isChat ? effectiveAgentId : agentId, // Return effective agent for reference
        isChat,
        loadTime: elapsed
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Error getting context stats:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to get context stats',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

