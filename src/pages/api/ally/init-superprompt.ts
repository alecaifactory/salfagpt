/**
 * Initialize Ally SuperPrompt
 * 
 * POST /api/ally/init-superprompt
 * 
 * Creates the default SuperPrompt for Ally system.
 * SuperAdmin only.
 */

import type { APIRoute } from 'astro';
import { initializeAllySuperPrompt } from '../../../lib/ally-init';
import { verifyJWT } from '../../../lib/auth';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    console.log('🎯 [API] POST /api/ally/init-superprompt');
    
    // 1. Verify authentication
  const cookieName = process.env.SESSION_COOKIE_NAME || 'flow_session';
    const session = verifyJWT(cookies.get(cookieName)?.value);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 2. Verify SuperAdmin only
    if (session.email !== 'alec@getaifactory.com') {
      return new Response(JSON.stringify({ 
        error: 'Forbidden - SuperAdmin only' 
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log('  ✅ SuperAdmin verified:', session.email);
    
    // 3. Initialize SuperPrompt
    const superPromptId = await initializeAllySuperPrompt(session.email);
    
    console.log('  ✅ SuperPrompt initialized:', superPromptId);
    
    return new Response(JSON.stringify({
      superPromptId,
      success: true,
      message: 'SuperPrompt initialized successfully',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ [API] Error initializing SuperPrompt:', error);
    
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

