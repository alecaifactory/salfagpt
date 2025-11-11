import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { 
  trackFunnelStage, 
  calculateConversionRates, 
  identifyFunnelBottlenecks,
  getAverageMilestoneTimes
} from '../../../lib/expert-review/funnel-tracking-service';

/**
 * Expert Review Funnel Tracking API
 * 
 * POST /api/expert-review/funnel - Track funnel event
 * GET /api/expert-review/funnel/conversions - Get conversion rates
 * GET /api/expert-review/funnel/bottlenecks - Get bottlenecks
 * GET /api/expert-review/funnel/milestones - Get milestone times
 */

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Verify authentication
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const body = await request.json();
    const { action, userId, messageId, conversationId, metadata } = body;

    // Validate required fields
    if (!action || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: action, userId' }),
        { status: 400 }
      );
    }

    // Track funnel event
    await trackFunnelStage({
      action: action as any,
      userId,
      messageId,
      conversationId,
      metadata,
    });

    return new Response(
      JSON.stringify({ success: true }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('❌ Error tracking funnel event:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to track funnel event',
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
    const type = url.searchParams.get('type'); // conversions | bottlenecks | milestones
    const userId = url.searchParams.get('userId');
    const domainId = url.searchParams.get('domainId');

    if (!type) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: type' }),
        { status: 400 }
      );
    }

    let result;

    switch (type) {
      case 'conversions':
        if (!domainId) {
          return new Response(
            JSON.stringify({ error: 'domainId required for conversions' }),
            { status: 400 }
          );
        }
        result = await calculateConversionRates(domainId);
        break;

      case 'bottlenecks':
        if (!domainId) {
          return new Response(
            JSON.stringify({ error: 'domainId required for bottlenecks' }),
            { status: 400 }
          );
        }
        result = await identifyFunnelBottlenecks(domainId);
        break;

      case 'milestones':
        if (!userId) {
          return new Response(
            JSON.stringify({ error: 'userId required for milestones' }),
            { status: 400 }
          );
        }
        result = await getAverageMilestoneTimes(userId);
        break;

      default:
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
    console.error('❌ Error getting funnel data:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to get funnel data',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500 }
    );
  }
};

