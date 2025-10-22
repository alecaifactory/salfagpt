import type { APIRoute } from 'astro';
import { getSharedAgents } from '../../../lib/firestore';

/**
 * GET /api/agents/shared?userId={userId}&userEmail={userEmail}
 * Get all agents shared with a user (via direct shares or group membership)
 */
export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const userEmail = url.searchParams.get('userEmail'); // ✅ NEW: For ID format conversion

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // ✅ Pass userEmail for backward compatibility with both ID formats
    const agents = await getSharedAgents(userId, userEmail || undefined);

    return new Response(JSON.stringify({ agents }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching shared agents:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch shared agents',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

