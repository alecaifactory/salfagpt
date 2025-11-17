/**
 * API: Create Digital Twin
 * POST /api/tim/create
 * 
 * Creates a digital twin for testing user issues
 */

import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { createDigitalTwin } from '../../../lib/tim';
import type { CreateTimRequest } from '../../../types/tim';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // 1. Authenticate
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. Parse request
    const body: CreateTimRequest = await request.json();
    const { userId, ticketId, ticketDetails } = body;

    // 3. Validate input
    if (!userId || !ticketId || !ticketDetails) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields',
          required: ['userId', 'ticketId', 'ticketDetails']
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 4. Verify permission
    // Only the user themselves, admins, or superadmins can create twins
    const canCreateTwin = 
      session.id === userId || 
      session.role === 'admin' ||
      session.role === 'superadmin';

    if (!canCreateTwin) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - Insufficient permissions' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 5. Create digital twin
    console.log('🤖 Creating digital twin for user:', userId);
    
    const result = await createDigitalTwin({
      userId,
      ticketId,
      ticketDetails
    });

    // 6. Return response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Tim creation error:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Failed to create digital twin',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

