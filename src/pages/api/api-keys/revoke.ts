/**
 * Revoke API Key Endpoint
 * 
 * DELETE /api/api-keys/:id
 * 
 * Purpose: Revoke (deactivate) an API key
 * Security: User must own the key or be admin
 * Effect: Key immediately stops working
 * 
 * Created: 2025-11-18
 */

import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { revokeAPIKey } from '../../../lib/api-keys';

export const DELETE: APIRoute = async ({ params, request, cookies }) => {
  const startTime = Date.now();
  
  try {
    // 1. Verify authentication
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(JSON.stringify({
        error: 'Unauthorized',
        message: 'Please login to revoke API keys'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 2. Get key ID from params
    const keyId = new URL(request.url).searchParams.get('id');
    
    if (!keyId) {
      return new Response(JSON.stringify({
        error: 'Bad Request',
        message: 'API key ID is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 3. Revoke key (will verify ownership inside)
    await revokeAPIKey(keyId, session.id);
    
    const duration = Date.now() - startTime;
    
    console.log(`✅ Revoked API key ${keyId} in ${duration}ms`);
    
    // 4. Return success
    return new Response(JSON.stringify({
      success: true,
      message: 'API key revoked successfully',
      keyId,
      revokedAt: new Date().toISOString()
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Response-Time': `${duration}ms`
      }
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Failed to revoke API key (${duration}ms):`, error);
    
    const statusCode = error instanceof Error && error.message.includes('Unauthorized')
      ? 403
      : 500;
    
    return new Response(JSON.stringify({
      error: statusCode === 403 ? 'Forbidden' : 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};


