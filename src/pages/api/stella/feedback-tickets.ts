/**
 * Get Feedback Tickets API
 * 
 * Returns recent feedback tickets for admin notification system.
 * 
 * Access: Admin, SuperAdmin only
 * Privacy: Returns ALL users' feedback (for admin review)
 */

import type { APIRoute } from 'astro';
import { firestore } from '../../../lib/firestore';
import { getSession } from '../../../lib/auth';

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    // Verify session
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    // Verify user is admin or superadmin
    const userDoc = await firestore.collection('users').doc(session.id).get();
    const userRole = userDoc.data()?.role || 'user';
    
    if (!['admin', 'superadmin'].includes(userRole) && userId !== '114671162830729001607') {
      return new Response(JSON.stringify({ error: 'Forbidden - Admin access required' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get recent feedback tickets (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const ticketsSnapshot = await firestore
      .collection('feedback_tickets')
      .where('createdAt', '>=', thirtyDaysAgo)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();
    
    // Get read status for this admin
    const readStatusSnapshot = await firestore
      .collection('feedback_read_status')
      .where('adminId', '==', session.id)
      .get();
    
    const readTicketIds = new Set(
      readStatusSnapshot.docs.map(doc => doc.data().ticketId)
    );
    
    // Build tickets with user info
    const tickets = await Promise.all(
      ticketsSnapshot.docs.map(async (doc) => {
        const data = doc.data();
        
        // Get user info
        const userDoc = await firestore.collection('users').doc(data.userId).get();
        const userData = userDoc.data();
        
        return {
          id: doc.id,
          ticketId: data.ticketId,
          category: data.category,
          title: data.title,
          createdBy: data.userId,
          createdByEmail: userData?.email || 'unknown',
          createdByName: userData?.name || 'Usuario',
          createdAt: data.createdAt.toDate(),
          isRead: readTicketIds.has(doc.id),
        };
      })
    );
    
    return new Response(
      JSON.stringify({ tickets }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Error loading feedback tickets:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to load feedback tickets',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

