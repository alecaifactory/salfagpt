import type { APIRoute } from 'astro';
import {
  updateConversation,
  deleteConversation,
} from '../../../lib/firestore';

// PUT /api/conversations/:id - Update conversation
export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const conversationId = params.id;
    const body = await request.json();

    if (!conversationId) {
      return new Response(
        JSON.stringify({ error: 'conversationId is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
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
export const DELETE: APIRoute = async ({ params }) => {
  try {
    const conversationId = params.id;

    if (!conversationId) {
      return new Response(
        JSON.stringify({ error: 'conversationId is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
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

