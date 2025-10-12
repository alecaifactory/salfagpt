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

    // Mock user feedback data
    // In production, this would query Firestore user_feedback collection
    
    const feedbackData = {
      summary: {
        totalFeedback: 5_678,
        positive: 4_831,
        negative: 847,
        positiveRatio: 0.851,
        avgResponseTime: 24, // hours
        resolvedCount: 742,
        pendingCount: 105,
      },
      byType: {
        thumbs: {
          up: 4_234,
          down: 567,
          ratio: 0.882,
        },
        ratings: {
          total: 1_234,
          avg: 4.3,
          distribution: {
            5: 754,
            4: 342,
            3: 98,
            2: 28,
            1: 12,
          },
        },
        detailed: {
          total: 245,
          avgLength: 87, // characters
        },
      },
      topIssues: [
        {
          issue: 'Response too long',
          count: 127,
          percentage: 15.0,
          avgSeverity: 'low',
          trend: -0.05, // 5% decrease
        },
        {
          issue: 'Unclear explanation',
          count: 89,
          percentage: 10.5,
          avgSeverity: 'medium',
          trend: 0.03,
        },
        {
          issue: 'Factual inaccuracy',
          count: 67,
          percentage: 7.9,
          avgSeverity: 'high',
          trend: -0.12, // 12% decrease
        },
        {
          issue: 'Missing context',
          count: 54,
          percentage: 6.4,
          avgSeverity: 'medium',
          trend: 0.01,
        },
        {
          issue: 'Off topic',
          count: 43,
          percentage: 5.1,
          avgSeverity: 'medium',
          trend: -0.08,
        },
      ],
      byAgent: [
        {
          agent: 'gemini-2.5-pro',
          positiveRatio: 0.88,
          totalFeedback: 2_345,
          positive: 2_064,
          negative: 281,
          avgRating: 4.7,
        },
        {
          agent: 'gemini-1.5-pro',
          positiveRatio: 0.84,
          totalFeedback: 1_567,
          positive: 1_316,
          negative: 251,
          avgRating: 4.5,
        },
        {
          agent: 'gemini-1.5-flash',
          positiveRatio: 0.82,
          totalFeedback: 1_766,
          positive: 1_448,
          negative: 318,
          avgRating: 4.2,
        },
      ],
      trends: Array.from({ length: days }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (days - 1 - i));
        const totalFeedback = Math.floor(Math.random() * 100) + 150;
        const positive = Math.floor(totalFeedback * (0.80 + Math.random() * 0.15));
        return {
          date: date.toISOString().split('T')[0],
          totalFeedback,
          positive,
          negative: totalFeedback - positive,
          positiveRatio: positive / totalFeedback,
          avgRating: 4.0 + Math.random() * 0.8,
        };
      }),
      recentFeedback: [
        {
          id: 'fb-001',
          conversationId: 'conv-123',
          type: 'thumbs_down',
          issue: 'Response too long',
          comment: 'The explanation was correct but unnecessarily verbose',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          resolved: false,
          agent: 'gemini-2.5-pro',
        },
        {
          id: 'fb-002',
          conversationId: 'conv-124',
          type: 'rating',
          value: 5,
          comment: 'Perfect! Exactly what I needed',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          resolved: true,
          agent: 'gemini-2.5-pro',
        },
        {
          id: 'fb-003',
          conversationId: 'conv-125',
          type: 'detailed',
          issue: 'Factual inaccuracy',
          comment: 'The code example had a syntax error that would prevent compilation',
          timestamp: new Date(Date.now() - 10800000).toISOString(),
          resolved: true,
          severity: 'high',
          agent: 'gemini-1.5-pro',
        },
        {
          id: 'fb-004',
          conversationId: 'conv-126',
          type: 'thumbs_up',
          comment: 'Very helpful, thank you!',
          timestamp: new Date(Date.now() - 14400000).toISOString(),
          resolved: true,
          agent: 'gemini-1.5-flash',
        },
      ],
      correlation: {
        // Correlation between expert scores and user feedback
        agreement: 0.78, // 78% agreement between expert and user ratings
        expertHighUserLow: 45, // Cases where expert rated high but user rated low
        expertLowUserHigh: 32, // Cases where expert rated low but user rated high
      },
    };

    return new Response(JSON.stringify(feedbackData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      },
    });
  } catch (error) {
    console.error('Error fetching user feedback:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: 'Failed to fetch user feedback data',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

