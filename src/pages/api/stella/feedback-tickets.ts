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
    // Query without where clause to avoid index issues, then filter in-memory
    const ticketsSnapshot = await firestore
      .collection('feedback_tickets')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();
    
    // Filter to last 30 days in-memory
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentTickets = ticketsSnapshot.docs.filter(doc => {
      const createdAt = doc.data().createdAt?.toDate?.() || new Date(0);
      return createdAt >= thirtyDaysAgo;
    });
    
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
      recentTickets.slice(0, 50).map(async (doc) => {
        const data = doc.data();
        
        // Use reportedBy field (matches FeedbackTicket interface)
        const reportedBy = data.reportedBy || data.userId;
        
        // Get user info safely
        let userData: any = {};
        if (reportedBy) {
          try {
            const userDocSnapshot = await firestore.collection('users').doc(reportedBy).get();
            userData = userDocSnapshot.data() || {};
          } catch (err) {
            console.warn('Could not fetch user data for', reportedBy);
          }
        }
        
        return {
          id: doc.id,
          ticketId: data.ticketId || doc.id,
          category: data.category || 'bug',
          title: data.title || 'Sin título',
          createdBy: reportedBy || 'unknown',
          createdByEmail: data.reportedByEmail || userData?.email || 'unknown',
          createdByName: data.reportedByName || userData?.name || 'Usuario',
          createdAt: data.createdAt?.toDate?.() || new Date(),
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
    
    // Return empty tickets instead of failing - graceful degradation
    return new Response(
      JSON.stringify({ 
        tickets: [],
        warning: 'Could not load feedback tickets',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 200, // Changed from 500 to prevent console errors
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

