/**
 * List API Keys Endpoint
 * 
 * GET /api/api-keys/list
 * 
 * Purpose: List user's API keys (without plaintext keys)
 * Security: User must be logged in
 * Returns: Safe representation of API keys
 * 
 * Created: 2025-11-18
 */

import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { listAPIKeys } from '../../../lib/api-keys';

export const GET: APIRoute = async ({ request, cookies }) => {
  const startTime = Date.now();
  
  try {
    // 1. Verify authentication
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(JSON.stringify({
        error: 'Unauthorized',
        message: 'Please login to view API keys'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 2. List keys
    const keys = await listAPIKeys(session.id);
    
    const duration = Date.now() - startTime;
    
    console.log(`✅ Listed ${keys.length} API keys for user ${session.id} in ${duration}ms`);
    
    // 3. Return list
    return new Response(JSON.stringify({
      keys,
      total: keys.length,
      metadata: {
        respondedIn: `${duration}ms`,
        timestamp: new Date().toISOString()
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Response-Time': `${duration}ms`
      }
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Failed to list API keys (${duration}ms):`, error);
    
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

