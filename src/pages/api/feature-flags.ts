/**
 * Feature Flags API
 * 
 * Returns feature flags for authenticated users.
 * Used to control access to beta features like Ally.
 * 
 * GET /api/feature-flags?userId=xxx
 */

import type { APIRoute } from 'astro';
import { getUserFeatureFlags } from '../../lib/feature-flags';
import { verifyJWT } from '../../lib/auth';

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    // Verify authentication
    const session = verifyJWT(cookies.get('flow_session')?.value);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Parse query params
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return new Response(JSON.stringify({ 
        error: 'Missing required parameter: userId' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Verify ownership (users can only check their own flags)
    if (session.id !== userId) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get feature flags
    const flags = await getUserFeatureFlags(userId, session.email || '');
    
    return new Response(JSON.stringify(flags), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ [API] Error in GET /api/feature-flags:', error);
    
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

