// Expert Metrics API
// Created: 2025-11-09

import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import type { ExpertPerformanceMetrics } from '../../../types/analytics';

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const domainId = url.searchParams.get('domainId');

    // Sample data for now
    const metrics: ExpertPerformanceMetrics = {
      userId: userId || session.id,
      domainId: domainId || 'maqsa.cl',
      period: new Date().toISOString().substring(0, 7),
      queueSize: 15,
      evaluated: 42,
      aiAssisted: 32,
      aiAdoptionRate: 0.76,
      approvalRate: 0.92,
      avgEvaluationTime: 8.3,
      timeSavedWithAI: 10.7,
      evaluationsPerDay: 2.8,
      correctionAccuracy: 0.94,
      expertRatingAvg: 82,
      globalRank: 2,
      domainRank: 1,
      speedRank: 3,
      qualityRank: 2,
      updatedAt: new Date()
    };

    return new Response(JSON.stringify(metrics), { status: 200 });

  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to get metrics' }), { status: 500 });
  }
};
