// Specialist Metrics API
// Created: 2025-11-09

import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import type { SpecialistPerformanceMetrics } from '../../../types/analytics';

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const specialty = url.searchParams.get('specialty') || 'legal';

    // Sample data
    const metrics: SpecialistPerformanceMetrics = {
      userId: userId || session.id,
      domainId: 'maqsa.cl',
      specialty: specialty,
      period: new Date().toISOString().substring(0, 7),
      assignmentsReceived: 12,
      assignmentsCompleted: 11,
      avgMatchScore: 0.94,
      avgCompletionTime: 18,
      approvalRateInSpecialty: 0.96,
      expertiseScore: 92,
      specialtyRank: 1,
      crossDomainRank: 5,
      updatedAt: new Date()
    };

    return new Response(JSON.stringify(metrics), { status: 200 });

  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to get metrics' }), { status: 500 });
  }
};
