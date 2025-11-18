// Changelog API - Single entry operations
// GET: Get specific changelog entry
// PUT: Update changelog entry (admin only)
// DELETE: Delete changelog entry (admin only)

import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { 
  getChangelogEntry, 
  updateChangelogEntry, 
  deleteChangelogEntry,
  trackChangelogView 
} from '../../../lib/changelog';

export const GET: APIRoute = async ({ params, cookies }) => {
  try {
    const { id } = params;
    
    if (!id) {
      return new Response(JSON.stringify({ error: 'Entry ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const entry = await getChangelogEntry(id);

    if (!entry) {
      return new Response(JSON.stringify({ error: 'Entry not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Track view (non-blocking)
    const session = getSession({ cookies } as any);
    if (session) {
      trackChangelogView(id, session.id).catch(console.warn);
    }

    return new Response(JSON.stringify({ entry }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Get changelog entry error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const PUT: APIRoute = async ({ params, request, cookies }) => {
  try {
    // Authentication required
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // TODO: Check if user is admin/superadmin

    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: 'Entry ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const updates = await request.json();
    await updateChangelogEntry(id, updates);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Update changelog entry error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to update entry' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const DELETE: APIRoute = async ({ params, cookies }) => {
  try {
    // Authentication required
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // TODO: Check if user is admin/superadmin

    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: 'Entry ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await deleteChangelogEntry(id);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Delete changelog entry error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to delete entry' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};






