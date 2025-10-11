import type { APIRoute } from 'astro';
import { verifyAccess, createAccessDeniedResponse, createUnauthorizedResponse, UserRole } from '../../../lib/access-control';

export const GET: APIRoute = async ({ request }) => {
  // Verify Analytics access or higher
  const userAccess = await verifyAccess(request, UserRole.ANALYTICS);
  
  if (!userAccess) {
    return createUnauthorizedResponse();
  }
  
  // Check if user has at least Analytics role
  const allowedRoles = [UserRole.ANALYTICS, UserRole.ADMIN, UserRole.SUPERADMIN];
  if (!allowedRoles.includes(userAccess.role)) {
    return createAccessDeniedResponse('Analytics access required');
  }

  try {
    const url = new URL(request.url);
    const days = parseInt(url.searchParams.get('days') || '30');

    // Mock quality metrics data
    // In production, this would aggregate from Firestore expert_evaluations and user_feedback
    
    const qualityMetrics = {
      overall: {
        avgUserRating: 4.3,
        avgExpertScore: 4.6,
        totalEvaluations: 1234,
        totalUserRatings: 5678,
        positiveRatio: 0.85, // 85% positive feedback
      },
      byAgent: [
        {
          agent: 'gemini-2.5-pro',
          avgUserRating: 4.7,
          avgExpertScore: 4.8,
          conversations: 5234,
          evaluations: 892,
          distribution: {
            5: 654,
            4: 198,
            3: 32,
            2: 6,
            1: 2,
          },
        },
        {
          agent: 'gemini-1.5-pro',
          avgUserRating: 4.5,
          avgExpertScore: 4.6,
          conversations: 3456,
          evaluations: 567,
          distribution: {
            5: 423,
            4: 112,
            3: 26,
            2: 4,
            1: 2,
          },
        },
        {
          agent: 'gemini-1.5-flash',
          avgUserRating: 4.2,
          avgExpertScore: 4.4,
          conversations: 6789,
          evaluations: 1123,
          distribution: {
            5: 789,
            4: 256,
            3: 64,
            2: 10,
            1: 4,
          },
        },
      ],
      byType: [
        {
          type: 'support',
          avgQuality: 4.6,
          conversations: 6234,
          evaluations: 1024,
        },
        {
          type: 'technical',
          avgQuality: 4.7,
          conversations: 4567,
          evaluations: 789,
        },
        {
          type: 'creative',
          avgQuality: 4.4,
          conversations: 3456,
          evaluations: 567,
        },
        {
          type: 'analysis',
          avgQuality: 4.5,
          conversations: 2345,
          evaluations: 412,
        },
      ],
      dimensions: {
        accuracy: {
          avg: 4.7,
          trend: 0.2, // +0.2 from previous period
        },
        helpfulness: {
          avg: 4.6,
          trend: 0.1,
        },
        coherence: {
          avg: 4.8,
          trend: 0.0,
        },
        safety: {
          avg: 4.9,
          trend: 0.0,
        },
        efficiency: {
          avg: 4.4,
          trend: -0.1, // -0.1 from previous period
        },
      },
      trends: Array.from({ length: days }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (days - 1 - i));
        return {
          date: date.toISOString().split('T')[0],
          avgQuality: 4.3 + Math.random() * 0.6,
          evaluations: Math.floor(Math.random() * 50) + 20,
          positiveRatio: 0.80 + Math.random() * 0.15,
        };
      }),
    };

    return new Response(JSON.stringify(qualityMetrics), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      },
    });
  } catch (error) {
    console.error('Error fetching quality metrics:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: 'Failed to fetch quality metrics',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

