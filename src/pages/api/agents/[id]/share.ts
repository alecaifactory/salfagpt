import type { APIRoute } from 'astro';
import { 
  shareAgent, 
  getAgentShares, 
  updateAgentShare, 
  deleteAgentShare,
  userHasAccessToAgent 
} from '../../../../lib/firestore';

/**
 * GET /api/agents/:id/share
 * Get all shares for an agent
 */
export const GET: APIRoute = async ({ params }) => {
  try {
    const { id } = params;
    
    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Agent ID is required' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const shares = await getAgentShares(id);

    return new Response(JSON.stringify({ shares }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching agent shares:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch agent shares',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

/**
 * POST /api/agents/:id/share
 * Share an agent with users or groups
 */
export const POST: APIRoute = async ({ params, request }) => {
  try {
    const { id } = params;
    const body = await request.json();
    const { ownerId, sharedWith, accessLevel, expiresAt } = body;

    if (!id || !ownerId || !sharedWith || !Array.isArray(sharedWith)) {
      return new Response(
        JSON.stringify({ 
          error: 'Agent ID, ownerId, and sharedWith array are required' 
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const share = await shareAgent(
      id,
      ownerId,
      sharedWith,
      accessLevel || 'view',
      expiresAt ? new Date(expiresAt) : undefined
    );

    return new Response(JSON.stringify({ share }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error sharing agent:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to share agent',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

/**
 * PUT /api/agents/:id/share
 * Update an existing share
 */
export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const body = await request.json();
    const { shareId, updates } = body;

    if (!shareId) {
      return new Response(
        JSON.stringify({ error: 'Share ID is required' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    await updateAgentShare(shareId, updates);

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error updating agent share:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to update agent share',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

/**
 * DELETE /api/agents/:id/share
 * Remove a share
 */
export const DELETE: APIRoute = async ({ params, request }) => {
  try {
    const url = new URL(request.url);
    const shareId = url.searchParams.get('shareId');

    if (!shareId) {
      return new Response(
        JSON.stringify({ error: 'Share ID is required' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    await deleteAgentShare(shareId);

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error deleting agent share:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to delete agent share',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

