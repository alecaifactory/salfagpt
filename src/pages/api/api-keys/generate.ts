/**
 * Generate API Key Endpoint
 * 
 * POST /api/api-keys/generate
 * 
 * Purpose: Create new API key for authenticated user
 * Security: User must be logged in
 * Returns: Plaintext API key (ONLY TIME IT'S SHOWN)
 * 
 * Created: 2025-11-18
 */

import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { createAPIKey } from '../../../lib/api-keys';
import type { CreateAPIKeyRequest } from '../../../types/api-keys';

export const POST: APIRoute = async ({ request, cookies }) => {
  const startTime = Date.now();
  
  try {
    // 1. Verify authentication
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(JSON.stringify({
        error: 'Unauthorized',
        message: 'Please login to generate API keys'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 2. Parse request
    const body = await request.json() as CreateAPIKeyRequest;
    
    // 3. Validate request
    if (!body.name || !body.name.trim()) {
      return new Response(JSON.stringify({
        error: 'Bad Request',
        message: 'API key name is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (!body.permissions || body.permissions.length === 0) {
      return new Response(JSON.stringify({
        error: 'Bad Request',
        message: 'At least one permission is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 4. Create API key
    const result = await createAPIKey(session.id, body);
    
    const duration = Date.now() - startTime;
    
    console.log(`✅ Generated API key for user ${session.id} in ${duration}ms`);
    
    // 5. Return key (ONLY TIME plaintext key is shown)
    return new Response(JSON.stringify({
      ...result,
      warning: '⚠️ Save this key securely - you will not be able to see it again!'
    }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        'X-Response-Time': `${duration}ms`
      }
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Failed to generate API key (${duration}ms):`, error);
    
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

