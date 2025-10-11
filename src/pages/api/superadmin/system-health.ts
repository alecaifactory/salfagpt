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
    // In production, these would come from actual system monitoring
    // For now, we'll return mock data with realistic values
    
    const systemHealth = {
      status: 'healthy' as const,
      timestamp: new Date().toISOString(),
      api: {
        status: 'healthy',
        uptime: 168.5, // hours
        requestsPerMinute: 45,
        avgResponseTime: 234, // ms
      },
      database: {
        status: 'good',
        connections: 12,
        maxConnections: 100,
        queryLatency: 15, // ms
        activeQueries: 3,
      },
      memory: {
        used: 3072, // MB
        total: 8192, // MB
        percentage: Math.round((3072 / 8192) * 100),
        available: 5120, // MB
      },
      cpu: {
        usage: 32, // percentage
        cores: 4,
        loadAverage: [0.8, 0.7, 0.6],
      },
      disk: {
        used: 45, // GB
        total: 100, // GB
        percentage: 45,
      },
      network: {
        inbound: 125, // MB/s
        outbound: 98, // MB/s
        latency: 12, // ms
      },
    };

    // Determine overall status based on thresholds
    if (
      systemHealth.memory.percentage > 90 ||
      systemHealth.cpu.usage > 90 ||
      systemHealth.database.connections > 80
    ) {
      systemHealth.status = 'critical';
    } else if (
      systemHealth.memory.percentage > 75 ||
      systemHealth.cpu.usage > 75 ||
      systemHealth.database.connections > 60
    ) {
      systemHealth.status = 'warning';
    }

    return new Response(JSON.stringify(systemHealth), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error fetching system health:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: 'Failed to fetch system health metrics',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

