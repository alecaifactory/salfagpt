/**
 * API: Get Test Session
 * GET /api/tim/sessions/:id
 * 
 * Retrieves a specific test session with results
 */

import type { APIRoute } from 'astro';
import { getSession } from '../../../../lib/auth';
import { getTestSession } from '../../../../lib/tim';

export const GET: APIRoute = async ({ params, cookies }) => {
  try {
    // 1. Authenticate
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. Get session ID from params
    const { id: sessionId } = params;
    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: 'Session ID required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 3. Retrieve test session
    const testSession = await getTestSession(sessionId);
    
    if (!testSession) {
      return new Response(
        JSON.stringify({ error: 'Test session not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 4. Verify permission
    const canView = 
      session.id === testSession.userId ||
      session.role === 'admin' ||
      session.role === 'superadmin';

    if (!canView) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - Cannot view this session' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 5. Return session data
    return new Response(JSON.stringify(testSession), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error fetching test session:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch test session',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

