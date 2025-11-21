/**
 * Send Group Invitation API
 * 
 * POST /api/groups/invite
 * 
 * Sends invitation to join a community group
 * 
 * Created: 2025-11-18
 */

import type { APIRoute } from 'astro';
import { sendGroupInvitation } from '../../../lib/subscriptions.js';
import { getSession } from '../../../lib/auth.js';

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
    const body = await request.json();
    const { groupId, recipientEmail, message } = body;

    if (!groupId || !recipientEmail) {
      return new Response(JSON.stringify({ 
        error: 'Validation failed',
        details: 'groupId and recipientEmail are required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 3. Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      return new Response(JSON.stringify({ 
        error: 'Validation failed',
        details: 'Invalid email format'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 4. Send invitation
    const invitation = await sendGroupInvitation(
      groupId,
      session.id,
      session.email,
      recipientEmail,
      message
    );

    // 5. Return invitation
    return new Response(JSON.stringify({
      invitation,
      message: `Invitation sent to ${recipientEmail}`,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error sending group invitation:', error);
    
    return new Response(JSON.stringify({
      error: 'Failed to send invitation',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};


