import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';

/**
 * DEBUG ENDPOINT: Verificar datos de sesión actual
 * GET /api/debug/session
 */
export const GET: APIRoute = async ({ cookies }) => {
  try {
    const session = getSession({ cookies } as any);
    
    if (!session) {
      return new Response(JSON.stringify({ 
        error: 'No session found',
        hasCookie: !!cookies.get('flow_session')
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Return session data for debugging
    return new Response(JSON.stringify({
      session: {
        id: session.id,
        googleUserId: session.googleUserId,
        email: session.email,
        name: session.name,
        role: session.role,
        roles: session.roles,
        domain: session.domain,
      },
      jwt: {
        iat: session.iat,
        exp: session.exp,
        iss: session.iss,
        aud: session.aud,
      },
      analysis: {
        idFormat: session.id?.startsWith('usr_') ? 'NEW (usr_hash)' : 
                  /^\d+$/.test(session.id) ? 'OLD (Google OAuth)' : 'UNKNOWN',
        hasGoogleUserId: !!session.googleUserId,
        timestamp: new Date().toISOString(),
      }
    }, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('❌ Debug session error:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
