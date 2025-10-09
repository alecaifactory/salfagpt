import type { APIRoute } from 'astro';
import { calculateContextWindowUsage } from '../../../../lib/firestore';

// GET /api/conversations/:id/context - Get context window information
export const GET: APIRoute = async ({ params, request }) => {
  try {
    const conversationId = params.id;
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!conversationId || !userId) {
      return new Response(
        JSON.stringify({ error: 'conversationId and userId are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { usage, sections } = await calculateContextWindowUsage(conversationId, userId);

    return new Response(
      JSON.stringify({ usage, sections }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error calculating context:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to calculate context' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

