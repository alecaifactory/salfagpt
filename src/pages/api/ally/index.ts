/**
 * Ally API - Main Endpoint
 * 
 * GET /api/ally - Get or create user's Ally conversation
 * 
 * Query params:
 * - userId: string (required)
 * - userEmail: string (required)
 * - userDomain: string (required)
 * - organizationId?: string (optional)
 * 
 * Returns:
 * - allyId: string (Ally conversation ID)
 * - isNew: boolean (Whether Ally was just created)
 * - success: boolean
 */

import type { APIRoute } from 'astro';
import { getOrCreateAlly, getAllyConversation } from '../../../lib/ally';
import { getUserFeatureFlags } from '../../../lib/feature-flags';
import { verifyJWT } from '../../../lib/auth';

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    console.log('🤖 [API] GET /api/ally');
    
    // 1. Verify authentication
    const session = verifyJWT(cookies.get('flow_session')?.value);
    if (!session) {
      console.warn('  ❌ No authentication');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log(`  ✅ Authenticated: ${session.email}`);
    
    // 2. Parse query params
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const userEmail = url.searchParams.get('userEmail');
    const userDomain = url.searchParams.get('userDomain');
    const organizationId = url.searchParams.get('organizationId') || undefined;
    
    // 3. Validate required params
    if (!userId || !userEmail || !userDomain) {
      console.warn('  ❌ Missing required parameters');
      return new Response(JSON.stringify({ 
        error: 'Missing required parameters: userId, userEmail, userDomain' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 4. Verify ownership
    if (session.id !== userId) {
      console.warn(`  ❌ Forbidden: session.id (${session.id}) !== userId (${userId})`);
      return new Response(JSON.stringify({ error: 'Forbidden - Can only access your own Ally' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 5. Check Ally beta access
    const featureFlags = await getUserFeatureFlags(userId, userEmail);
    if (!featureFlags.allyBetaAccess) {
      console.warn(`  ❌ No Ally beta access for: ${userEmail}`);
      return new Response(JSON.stringify({ 
        error: 'Ally beta access not granted',
        message: 'Contact SuperAdmin to request access'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log('  ✅ Ally beta access verified');
    
    // 6. Get or create Ally
    const allyId = await getOrCreateAlly(userId, userEmail, userDomain, organizationId);
    
    // 7. Check if newly created
    const allyConversation = await getAllyConversation(allyId);
    const isNew = allyConversation ? (allyConversation.messageCount <= 1) : false;
    
    console.log(`  ✅ Ally ID: ${allyId} (${isNew ? 'NEW' : 'EXISTING'})`);
    
    // 8. Return response
    return new Response(JSON.stringify({
      allyId,
      isNew,
      conversation: allyConversation,
      success: true,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ [API] Error in GET /api/ally:', error);
    
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      success: false,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

