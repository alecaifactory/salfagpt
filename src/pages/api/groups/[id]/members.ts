import type { APIRoute } from 'astro';
import { addGroupMember, removeGroupMember } from '../../../../lib/firestore';

/**
 * POST /api/groups/:id/members
 * Add a member to a group
 */
export const POST: APIRoute = async ({ params, request }) => {
  try {
    const { id } = params;
    const body = await request.json();
    const { userId } = body;

    if (!id || !userId) {
      return new Response(
        JSON.stringify({ error: 'Group ID and userId are required' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    await addGroupMember(id, userId);

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error adding group member:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to add group member',
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
 * DELETE /api/groups/:id/members/:userId
 * Remove a member from a group
 */
export const DELETE: APIRoute = async ({ params }) => {
  try {
    const { id } = params;
    const url = new URL(params.request?.url || '');
    const userId = url.searchParams.get('userId');

    if (!id || !userId) {
      return new Response(
        JSON.stringify({ error: 'Group ID and userId are required' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    await removeGroupMember(id, userId);

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error removing group member:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to remove group member',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

