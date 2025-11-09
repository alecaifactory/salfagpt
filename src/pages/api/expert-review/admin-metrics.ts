// Admin Metrics API
// Created: 2025-11-09

import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import type { AdminDomainMetrics } from '../../../types/analytics';

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const domainId = url.searchParams.get('domainId');

    // Sample data
    const metrics: AdminDomainMetrics = {
      userId: userId || session.id,
      domainId: domainId || 'maqsa.cl',
      period: new Date().toISOString().substring(0, 7),
      proposalsReceived: 25,
      proposalsReviewed: 25,
      approvalRate: 0.79,
      avgReviewTime: 4.2,
      batchApprovalsCount: 8,
      avgBatchSize: 3.2,
      batchTimeSaved: 6.5,
      dqsStart: 89,
      dqsEnd: 92.2,
      dqsChange: 3.2,
      roiEstimate: 12.3,
      domainRankByDQS: 2,
      trendDirection: 'up',
      updatedAt: new Date()
    };

    return new Response(JSON.stringify(metrics), { status: 200 });

  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to get metrics' }), { status: 500 });
  }
};
