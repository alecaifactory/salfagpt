/**
 * List Community Groups API
 * 
 * GET /api/groups/list
 * 
 * Returns list of all community groups
 * Can filter by organization or industry
 * 
 * Created: 2025-11-18
 */

import type { APIRoute } from 'astro';
import { listCommunityGroups } from '../../../lib/subscriptions.js';
import { getSession } from '../../../lib/auth.js';

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    // 1. Authenticate
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. Parse query parameters
    const url = new URL(request.url);
    const organizationId = url.searchParams.get('organizationId') || 'latamlab-ai';
    const industry = url.searchParams.get('industry') || undefined;
    const limit = parseInt(url.searchParams.get('limit') || '50');

    // 3. List groups
    const groups = await listCommunityGroups({
      organizationId,
      industry,
      limit,
    });

    // 4. Return groups
    return new Response(JSON.stringify({ 
      groups,
      count: groups.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error listing community groups:', error);
    
    return new Response(JSON.stringify({
      error: 'Failed to list community groups',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

