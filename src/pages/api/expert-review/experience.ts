import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { 
  trackCSATRating,
  trackNPSScore,
  trackSocialShare,
  getCSATMetrics,
  getNPSMetrics,
  getSocialMetrics,
  getLatestFeedback
} from '../../../lib/expert-review/experience-tracking-service';

/**
 * Expert Review Experience Tracking API
 * 
 * POST /api/expert-review/experience - Track experience event (CSAT/NPS/Social)
 * GET /api/expert-review/experience/metrics - Get metrics
 * GET /api/expert-review/experience/feedback - Get latest feedback
 */

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Verify authentication
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const body = await request.json();
    const { type, userId, ...data } = body;

    if (!type || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: type, userId' }),
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

    // Track based on type
    switch (type) {
      case 'csat':
        if (!data.messageId || data.rating === undefined) {
          return new Response(
            JSON.stringify({ error: 'Missing required fields for CSAT: messageId, rating' }),
            { status: 400 }
          );
        }
        await trackCSATRating({
          userId,
          messageId: data.messageId,
          conversationId: data.conversationId,
          rating: data.rating,
          feedback: data.feedback,
          category: data.category,
        });
        break;

      case 'nps':
        if (data.score === undefined) {
          return new Response(
            JSON.stringify({ error: 'Missing required field for NPS: score' }),
            { status: 400 }
          );
        }
        await trackNPSScore({
          userId,
          score: data.score,
          feedback: data.feedback,
          category: data.category,
        });
        break;

      case 'social':
        if (!data.platform || !data.action) {
          return new Response(
            JSON.stringify({ error: 'Missing required fields for social: platform, action' }),
            { status: 400 }
          );
        }
        await trackSocialShare({
          userId,
          platform: data.platform,
          action: data.action,
          messageId: data.messageId,
          metadata: data.metadata,
        });
        break;

      default:
        return new Response(
          JSON.stringify({ error: `Unknown experience type: ${type}` }),
          { status: 400 }
        );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('❌ Error tracking experience:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to track experience',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500 }
    );
  }
};

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    // Verify authentication
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const url = new URL(request.url);
    const type = url.searchParams.get('type'); // metrics | feedback
    const userId = url.searchParams.get('userId');
    const domainId = url.searchParams.get('domainId');
    const metricType = url.searchParams.get('metricType'); // csat | nps | social

    if (!type) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: type' }),
        { status: 400 }
      );
    }

    let result;

    if (type === 'metrics') {
      if (!domainId || !metricType) {
        return new Response(
          JSON.stringify({ error: 'domainId and metricType required for metrics' }),
          { status: 400 }
        );
      }

      switch (metricType) {
        case 'csat':
          result = await getCSATMetrics(domainId);
          break;
        case 'nps':
          result = await getNPSMetrics(domainId);
          break;
        case 'social':
          result = await getSocialMetrics(domainId);
          break;
        default:
          return new Response(
            JSON.stringify({ error: `Unknown metricType: ${metricType}` }),
            { status: 400 }
          );
      }
    } else if (type === 'feedback') {
      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'userId required for feedback' }),
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

      result = await getLatestFeedback(userId);
    } else {
      return new Response(
        JSON.stringify({ error: `Unknown type: ${type}` }),
        { status: 400 }
      );
    }

    return new Response(
      JSON.stringify(result),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('❌ Error getting experience data:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to get experience data',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500 }
    );
  }
};

