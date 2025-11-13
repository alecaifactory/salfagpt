import type { APIRoute } from 'astro';
import {
  updateConversation,
  deleteConversation,
  getConversation,
} from '../../../lib/firestore';
import { getSession } from '../../../lib/auth';

// GET /api/conversations/:id - Get single conversation
export const GET: APIRoute = async ({ params, cookies }) => {
  try {
    // Verify authentication
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Please login' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const conversationId = params.id;

    if (!conversationId) {
      return new Response(
        JSON.stringify({ error: 'conversationId is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get conversation
    const conversation = await getConversation(conversationId);
    if (!conversation) {
      return new Response(
        JSON.stringify({ error: 'Conversation not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // SECURITY: Verify user owns this conversation
    if (conversation.userId !== session.id) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - Cannot access other user conversations' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(conversation),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error fetching conversation:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to fetch conversation' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// PUT /api/conversations/:id - Update conversation
export const PUT: APIRoute = async ({ params, request, cookies }) => {
  try {
    // Verify authentication
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Please login' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const conversationId = params.id;
    const body = await request.json();

    if (!conversationId) {
      return new Response(
        JSON.stringify({ error: 'conversationId is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // SECURITY: Verify user owns this conversation
    const conversation = await getConversation(conversationId);
    if (!conversation) {
      return new Response(
        JSON.stringify({ error: 'Conversation not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (conversation.userId !== session.id) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - Cannot modify other user conversations' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await updateConversation(conversationId, body);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error updating conversation:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to update conversation' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// DELETE /api/conversations/:id - Delete conversation
export const DELETE: APIRoute = async ({ params, cookies }) => {
  try {
    // Verify authentication
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Please login' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const conversationId = params.id;

    if (!conversationId) {
      return new Response(
        JSON.stringify({ error: 'conversationId is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // SECURITY: Verify user owns this conversation
    const conversation = await getConversation(conversationId);
    if (!conversation) {
      return new Response(
        JSON.stringify({ error: 'Conversation not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (conversation.userId !== session.id) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - Cannot delete other user conversations' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await deleteConversation(conversationId);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error deleting conversation:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to delete conversation' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

