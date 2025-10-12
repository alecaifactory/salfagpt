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
    // Mock model performance metrics
    // In production, these would come from actual usage data
    const models = [
      {
        model: 'gemini-2.5-pro',
        avgLatency: 450,
        totalRequests: 8934,
        successRate: 99.5,
        avgCost: 0.12,
        avgQuality: 4.7,
        tokenUsage: {
          input: 5_234_567,
          output: 8_456_123,
          total: 13_690_690,
        },
        costBreakdown: {
          inputCost: 0.0012,
          outputCost: 0.0024,
          total: 0.12,
        },
        usageByType: {
          chat: 7234,
          analysis: 1200,
          creative: 500,
        },
      },
      {
        model: 'gemini-1.5-pro',
        avgLatency: 320,
        totalRequests: 5678,
        successRate: 99.2,
        avgCost: 0.08,
        avgQuality: 4.5,
        tokenUsage: {
          input: 3_123_456,
          output: 5_234_567,
          total: 8_358_023,
        },
        costBreakdown: {
          inputCost: 0.0008,
          outputCost: 0.0016,
          total: 0.08,
        },
        usageByType: {
          chat: 4234,
          analysis: 944,
          creative: 500,
        },
      },
      {
        model: 'gemini-1.5-flash',
        avgLatency: 180,
        totalRequests: 12456,
        successRate: 98.8,
        avgCost: 0.04,
        avgQuality: 4.2,
        tokenUsage: {
          input: 4_567_890,
          output: 6_789_012,
          total: 11_356_902,
        },
        costBreakdown: {
          inputCost: 0.0004,
          outputCost: 0.0008,
          total: 0.04,
        },
        usageByType: {
          chat: 9856,
          analysis: 1800,
          creative: 800,
        },
      },
    ];

    // Calculate overall statistics
    const totalRequests = models.reduce((sum, m) => sum + m.totalRequests, 0);
    const totalCost = models.reduce(
      (sum, m) => sum + m.avgCost * m.totalRequests,
      0
    );
    const avgSuccessRate =
      models.reduce((sum, m) => sum + m.successRate, 0) / models.length;

    const summary = {
      totalModels: models.length,
      totalRequests,
      totalCost: totalCost.toFixed(2),
      avgSuccessRate: avgSuccessRate.toFixed(2),
      avgLatency: Math.round(
        models.reduce((sum, m) => sum + m.avgLatency, 0) / models.length
      ),
      totalTokens: models.reduce(
        (sum, m) => sum + m.tokenUsage.total,
        0
      ),
      timeRange: '24 hours',
      generatedAt: new Date().toISOString(),
    };

    // Model efficiency ranking
    const efficiency = models.map((m) => ({
      model: m.model,
      tokensPerDollar: m.tokenUsage.total / (m.avgCost * m.totalRequests),
      qualityPerDollar: m.avgQuality / m.avgCost,
      latencyScore: 1000 / m.avgLatency, // Higher is better
    }));

    return new Response(
      JSON.stringify({
        models,
        summary,
        efficiency,
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
    console.error('Error fetching model metrics:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: 'Failed to fetch model metrics',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

