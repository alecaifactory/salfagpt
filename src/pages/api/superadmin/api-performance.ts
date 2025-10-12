import type { APIRoute } from 'astro';
import { verifyAccess, createAccessDeniedResponse, createUnauthorizedResponse, UserRole } from '../../../lib/access-control';

export const GET: APIRoute = async ({ request }) => {
  // Verify SuperAdmin access
  const userAccess = await verifyAccess(request, UserRole.SUPERADMIN);
  
  if (!userAccess) {
    return createUnauthorizedResponse();
  }
  
  if (userAccess.role !== UserRole.SUPERADMIN) {
    return createAccessDeniedResponse('SuperAdmin access required');
  }

  try {
    // Mock API performance metrics
    // In production, these would come from Cloud Monitoring/Logging
    const metrics = [
      {
        endpoint: '/api/chat',
        p50: 120,
        p95: 450,
        p99: 890,
        errorRate: 0.5,
        requestCount: 15420,
        avgResponseSize: 2048, // bytes
        method: 'POST',
      },
      {
        endpoint: '/api/conversations',
        p50: 45,
        p95: 120,
        p99: 230,
        errorRate: 0.2,
        requestCount: 8934,
        avgResponseSize: 1024,
        method: 'GET',
      },
      {
        endpoint: '/api/analytics/summary',
        p50: 78,
        p95: 180,
        p99: 340,
        errorRate: 0.1,
        requestCount: 1245,
        avgResponseSize: 4096,
        method: 'GET',
      },
      {
        endpoint: '/api/conversations/[id]/messages',
        p50: 65,
        p95: 150,
        p99: 280,
        errorRate: 0.3,
        requestCount: 12567,
        avgResponseSize: 1536,
        method: 'GET',
      },
      {
        endpoint: '/api/conversations/[id]/context',
        p50: 35,
        p95: 95,
        p99: 175,
        errorRate: 0.1,
        requestCount: 5678,
        avgResponseSize: 512,
        method: 'GET',
      },
      {
        endpoint: '/api/expertos/conversations',
        p50: 89,
        p95: 210,
        p99: 420,
        errorRate: 0.4,
        requestCount: 892,
        avgResponseSize: 3072,
        method: 'GET',
      },
      {
        endpoint: '/api/superadmin/system-health',
        p50: 25,
        p95: 60,
        p99: 110,
        errorRate: 0.0,
        requestCount: 234,
        avgResponseSize: 256,
        method: 'GET',
      },
    ];

    const summary = {
      totalRequests: metrics.reduce((sum, m) => sum + m.requestCount, 0),
      avgErrorRate: metrics.reduce((sum, m) => sum + m.errorRate, 0) / metrics.length,
      avgP50: Math.round(metrics.reduce((sum, m) => sum + m.p50, 0) / metrics.length),
      avgP95: Math.round(metrics.reduce((sum, m) => sum + m.p95, 0) / metrics.length),
      avgP99: Math.round(metrics.reduce((sum, m) => sum + m.p99, 0) / metrics.length),
      timeRange: '24 hours',
      generatedAt: new Date().toISOString(),
    };

    return new Response(
      JSON.stringify({
        metrics,
        summary,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching API performance:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: 'Failed to fetch API performance metrics',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

