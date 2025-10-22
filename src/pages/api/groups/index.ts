import type { APIRoute } from 'astro';
import { getAllGroups, createGroup } from '../../../lib/firestore';
import type { Group } from '../../../lib/firestore';

/**
 * GET /api/groups
 * Get all groups (admin only)
 */
export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    const groups = await getAllGroups();
    
    return new Response(JSON.stringify({ groups }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching groups:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch groups',
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
 * POST /api/groups
 * Create a new group
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const { name, description, type, createdBy, members } = body;

    // Validation
    if (!name || !createdBy) {
      return new Response(
        JSON.stringify({ error: 'Name and createdBy are required' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const group = await createGroup(
      name,
      description || '',
      type || 'custom',
      createdBy,
      members || []
    );

    return new Response(JSON.stringify({ group }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating group:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to create group',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

