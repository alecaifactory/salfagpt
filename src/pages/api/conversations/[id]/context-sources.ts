import type { APIRoute } from 'astro';
import {
  saveConversationContext,
  loadConversationContext,
} from '../../../../lib/firestore';

// GET /api/conversations/:id/context-sources - Load conversation context sources
export const GET: APIRoute = async ({ params }) => {
  try {
    const conversationId = params.id;

    if (!conversationId) {
      return new Response(
        JSON.stringify({ error: 'conversationId is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const activeContextSourceIds = await loadConversationContext(conversationId);

    return new Response(
      JSON.stringify({ activeContextSourceIds }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error loading conversation context sources:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to load context sources' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// POST /api/conversations/:id/context-sources - Save conversation context sources
export const POST: APIRoute = async ({ params, request }) => {
  try {
    const conversationId = params.id;
    const body = await request.json();
    const { activeContextSourceIds } = body;

    if (!conversationId) {
      return new Response(
        JSON.stringify({ error: 'conversationId is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!Array.isArray(activeContextSourceIds)) {
      return new Response(
        JSON.stringify({ error: 'activeContextSourceIds must be an array' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await saveConversationContext(conversationId, activeContextSourceIds);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error saving conversation context sources:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to save context sources' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// PUT /api/conversations/:id/context-sources - Save conversation context sources (alias for POST)
export const PUT: APIRoute = POST;

