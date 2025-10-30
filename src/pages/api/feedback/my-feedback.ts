import type { APIRoute } from 'astro';
import { firestore } from '../../../lib/firestore';
import { getSession } from '../../../lib/auth';

/**
 * GET /api/feedback/my-feedback
 * 
 * Get user's own feedback submissions
 * Users can only see their own feedback
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

    // 3. Verify ownership (users can only see their own feedback)
    if (session.id !== userId) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - Can only view your own feedback' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 4. Query user's feedback (without orderBy to avoid index requirement for MVP)
    const snapshot = await firestore
      .collection('message_feedback')
      .where('userId', '==', userId)
      .limit(100)
      .get();

    const feedback = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp || Date.now()),
      };
    });

    // Sort in memory
    feedback.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    console.log(`✅ Loaded ${feedback.length} feedback items for user ${userId.substring(0, 8)}...`);

    // 5. Return feedback
    return new Response(
      JSON.stringify({ feedback }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Error loading user feedback:', error);
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

