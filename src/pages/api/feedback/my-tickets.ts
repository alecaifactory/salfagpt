import type { APIRoute } from 'astro';
import { firestore } from '../../../lib/firestore';
import { getSession } from '../../../lib/auth';

/**
 * GET /api/feedback/my-tickets
 * 
 * Get user's own feedback tickets
 * Shows tickets created from their feedback
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

    // 2. Get userId from query
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. Verify ownership
    if (session.id !== userId) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - Can only view your own tickets' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 4. Query user's tickets (without orderBy to avoid index requirement for MVP)
    const snapshot = await firestore
      .collection('feedback_tickets')
      .where('reportedBy', '==', userId)
      .limit(100)
      .get();

    const tickets = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt || Date.now()),
        resolvedAt: data.resolvedAt?.toDate ? data.resolvedAt.toDate() : null,
        assignedAt: data.assignedAt?.toDate ? data.assignedAt.toDate() : null,
      };
    });

    // Sort in memory
    tickets.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    console.log(`✅ Loaded ${tickets.length} tickets for user ${userId.substring(0, 8)}...`);

    // 5. Return tickets
    return new Response(
      JSON.stringify({ tickets }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Error loading user tickets:', error);
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

