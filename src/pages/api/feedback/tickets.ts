import type { APIRoute } from 'astro';
import { firestore } from '../../../lib/firestore';
import { getSession } from '../../../lib/auth';
import type { FeedbackTicket } from '../../../types/feedback';

/**
 * GET /api/feedback/tickets
 * 
 * List all feedback tickets (SuperAdmin/Admin only)
 * Supports filtering by status, priority, category
 */
export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    // 1. Authenticate
    const session = getSession({ cookies });
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Check permissions (admin, expert, or superadmin only)
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId || session.id !== userId) {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has admin permissions
    const userDoc = await firestore.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    if (!userData || !['admin', 'expert'].includes(userData.role)) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - Admin access required' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. Get filter parameters
    const status = url.searchParams.get('status');
    const priority = url.searchParams.get('priority');
    const category = url.searchParams.get('category');

    // 4. Build query
    let query = firestore.collection('feedback_tickets').orderBy('createdAt', 'desc');

    if (status && status !== 'all') {
      query = query.where('status', '==', status) as any;
    }
    if (priority && priority !== 'all') {
      query = query.where('priority', '==', priority) as any;
    }
    if (category && category !== 'all') {
      query = query.where('category', '==', category) as any;
    }

    // 5. Execute query
    const snapshot = await query.limit(100).get();

    const tickets: FeedbackTicket[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      resolvedAt: doc.data().resolvedAt?.toDate(),
    })) as FeedbackTicket[];

    console.log(`✅ Loaded ${tickets.length} tickets for user ${userId}`);

    // 6. Return tickets
    return new Response(
      JSON.stringify({ tickets }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Error loading tickets:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

