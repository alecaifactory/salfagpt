import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { 
  getUserBadges,
  checkAndAwardBadges,
  getRecentAchievements
} from '../../../lib/expert-review/gamification-service';

/**
 * Expert Review Gamification/Badges API
 * 
 * GET /api/expert-review/badges?userId={id} - Get user badges
 * POST /api/expert-review/badges/check - Check and award badges
 * GET /api/expert-review/badges/recent?userId={id} - Get recent achievements
 */

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    // Verify authentication
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const type = url.searchParams.get('type') || 'badges'; // badges | recent

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: userId' }),
        { status: 400 }
      );
    }

    // Verify ownership (can only view own badges)
    if (session.id !== userId) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - can only view own badges' }),
        { status: 403 }
      );
    }

    let result;

    if (type === 'recent') {
      result = await getRecentAchievements(userId);
    } else {
      result = await getUserBadges(userId);
    }

    return new Response(
      JSON.stringify(result),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('❌ Error getting badges:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to get badges',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500 }
    );
  }
};

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Verify authentication
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: userId' }),
        { status: 400 }
      );
    }

    // Verify ownership
    if (session.id !== userId) {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403 }
      );
    }

    // Check and award badges
    const newBadges = await checkAndAwardBadges(userId);

    return new Response(
      JSON.stringify({ success: true, newBadges }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('❌ Error checking badges:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to check badges',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500 }
    );
  }
};

