/**
 * Mark Feedback as Read API
 * 
 * Marks a feedback ticket as read by the current admin.
 * 
 * POST /api/stella/mark-feedback-read
 */

import type { APIRoute } from 'astro';
import { firestore, getEnvironmentSource } from '../../../lib/firestore';
import { getSession } from '../../../lib/auth';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const { ticketId, userId } = await request.json();
    
    // Verify admin
    const userDoc = await firestore.collection('users').doc(session.id).get();
    const userRole = userDoc.data()?.role || 'user';
    
    if (!['admin', 'superadmin'].includes(userRole)) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Create or update read status
    const readStatusId = `${session.id}_${ticketId}`;
    await firestore.collection('feedback_read_status').doc(readStatusId).set({
      adminId: session.id,
      ticketId,
      readAt: new Date(),
      source: getEnvironmentSource(),
    });
    
    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Error marking feedback as read:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to mark as read' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

