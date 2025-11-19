/**
 * Join Community Group API
 * 
 * POST /api/groups/join
 * 
 * User joins a community group
 * Updates user's domainId
 * 
 * Created: 2025-11-18
 */

import type { APIRoute } from 'astro';
import { joinCommunityGroup } from '../../../lib/subscriptions.js';
import { getSession } from '../../../lib/auth.js';

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
    const { groupId } = body;

    if (!groupId) {
      return new Response(JSON.stringify({ 
        error: 'Validation failed',
        details: 'groupId is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 3. Join group
    await joinCommunityGroup(session.id, groupId);

    // 4. Return success
    return new Response(JSON.stringify({
      message: 'Successfully joined community group',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error joining community group:', error);
    
    return new Response(JSON.stringify({
      error: 'Failed to join community group',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

