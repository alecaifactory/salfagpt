/**
 * Create Community Group API
 * 
 * POST /api/groups/create
 * 
 * Creates new community group (domain)
 * First user automatically becomes admin
 * 
 * Created: 2025-11-18
 */

import type { APIRoute } from 'astro';
import { createCommunityGroup } from '../../../lib/subscriptions.js';
import { getSession } from '../../../lib/auth.js';
import { getUserById } from '../../../lib/firestore.js';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // 1. Authenticate
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. Parse request
    const body = await request.json();
    const { name, description, industry, inviteOnly } = body;

    if (!name || name.trim().length === 0) {
      return new Response(JSON.stringify({ 
        error: 'Validation failed',
        details: 'Group name is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 3. Get user details
    const user = await getUserById(session.id);
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 4. Create community group
    const group = await createCommunityGroup(
      name,
      session.id,
      session.email,
      {
        description,
        industry,
        inviteOnly: inviteOnly || false,
      }
    );

    // 5. Return group
    return new Response(JSON.stringify({
      group,
      message: `Community group "${name}" created! You are the admin.`,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error creating community group:', error);
    
    return new Response(JSON.stringify({
      error: 'Failed to create community group',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

