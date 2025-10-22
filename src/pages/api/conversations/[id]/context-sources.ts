import type { APIRoute } from 'astro';
import {
  saveConversationContext,
  loadConversationContext,
} from '../../../../lib/firestore';
import { syncAgentAssignments } from '../../../../lib/bigquery-agent-sync';
import { getSession } from '../../../../lib/auth';

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
export const POST: APIRoute = async ({ params, request, cookies }) => {
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

    // Get user session for BigQuery sync
    const session = getSession({ cookies } as any);
    const userId = session?.id || '';

    // 1. Save to Firestore (primary persistence)
    await saveConversationContext(conversationId, activeContextSourceIds);

    // 2. Sync to BigQuery (for agent-based search)
    // This runs async - don't wait for it (non-blocking)
    if (userId && activeContextSourceIds.length > 0) {
      syncAgentAssignments(conversationId, activeContextSourceIds, userId, 'assign')
        .catch(err => console.warn('⚠️ BigQuery sync failed (non-critical):', err));
      
      console.log(`💾 Saved context for conversation: ${conversationId}`, activeContextSourceIds);
    }

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

