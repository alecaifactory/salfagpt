import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { 
  getUserContributionMetrics,
  getExpertPerformanceMetrics,
  getSpecialistPerformanceMetrics,
  getAdminDomainMetrics,
  calculateDomainQuality
} from '../../../lib/expert-review/metrics-service';

/**
 * Expert Review Metrics API
 * 
 * GET /api/expert-review/metrics?type={user|expert|specialist|admin}&id={userId|domainId}
 */

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    // Verify authentication
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const url = new URL(request.url);
    const type = url.searchParams.get('type');
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
      case 'user':
        if (!userId) {
          return new Response(
            JSON.stringify({ error: 'userId required for user metrics' }),
            { status: 400 }
          );
        }
        // Verify ownership (can only view own metrics unless admin)
        if (session.id !== userId && session.role !== 'admin') {
          return new Response(
            JSON.stringify({ error: 'Forbidden' }),
            { status: 403 }
          );
        }
        result = await getUserContributionMetrics(userId);
        break;

      case 'expert':
        if (!userId) {
          return new Response(
            JSON.stringify({ error: 'userId required for expert metrics' }),
            { status: 400 }
          );
        }
        result = await getExpertPerformanceMetrics(userId);
        break;

      case 'specialist':
        if (!userId) {
          return new Response(
            JSON.stringify({ error: 'userId required for specialist metrics' }),
            { status: 400 }
          );
        }
        result = await getSpecialistPerformanceMetrics(userId);
        break;

      case 'admin':
        if (!domainId) {
          return new Response(
            JSON.stringify({ error: 'domainId required for admin metrics' }),
            { status: 400 }
          );
        }
        result = await getAdminDomainMetrics(domainId);
        break;

      case 'domain-quality':
        if (!domainId) {
          return new Response(
            JSON.stringify({ error: 'domainId required for domain quality' }),
            { status: 400 }
          );
        }
        const period = url.searchParams.get('period') || 'Last 30 days';
        result = await calculateDomainQuality(domainId, period);
        break;

      default:
        return new Response(
          JSON.stringify({ error: `Unknown metrics type: ${type}` }),
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
    console.error('❌ Error getting metrics:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to get metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500 }
    );
  }
};

