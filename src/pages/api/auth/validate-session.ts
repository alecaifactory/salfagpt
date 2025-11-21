/**
 * API: Validate Session
 * GET /api/auth/validate-session
 * 
 * Checks if current session is valid and not expired
 */

import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';

export const GET: APIRoute = async ({ cookies }) => {
  try {
    // Check session
    const session = getSession({ cookies } as any);
    
    if (!session || !session.id) {
      return new Response(JSON.stringify({ 
        valid: false,
        error: 'No session found'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Session exists and is valid
    return new Response(JSON.stringify({ 
      valid: true,
      userId: session.id,
      expiresIn: '7 days' // JWT expiration
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ Session validation error:', error);
    
    return new Response(JSON.stringify({ 
      valid: false,
      error: 'Session validation failed'
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};





