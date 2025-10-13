import type { APIRoute } from 'astro';
import { getConversationContext, saveConversationContextState } from '../../lib/firestore';

// GET /api/conversation-context?conversationId=xxx - Get conversation context
export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const conversationId = url.searchParams.get('conversationId');

    if (!conversationId) {
      return new Response(
        JSON.stringify({ error: 'conversationId is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const context = await getConversationContext(conversationId);

    if (!context) {
      // Return default empty context if none exists
      return new Response(
        JSON.stringify({
          conversationId,
          activeContextSourceIds: [],
          contextWindowUsage: 0,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify(context), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error getting conversation context:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to get conversation context' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// POST /api/conversation-context - Save conversation context
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { conversationId, userId, activeContextSourceIds, contextWindowUsage } = body;

    if (!conversationId || !userId) {
      return new Response(
        JSON.stringify({ error: 'conversationId and userId are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const context = await saveConversationContextState(
      conversationId,
      userId,
      activeContextSourceIds || [],
      contextWindowUsage || 0
    );

    console.log('✅ Conversation context saved:', conversationId);

    return new Response(JSON.stringify(context), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error saving conversation context:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to save conversation context' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

