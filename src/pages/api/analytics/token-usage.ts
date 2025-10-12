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

    // Mock token usage data
    // In production, this would query Firestore conversations and aggregate token usage
    
    const tokenUsage = {
      summary: {
        totalTokens: 45_234_567,
        inputTokens: 18_234_123,
        outputTokens: 27_000_444,
        totalCost: 1_234.56,
        avgTokensPerConversation: 3_245,
        avgCostPerConversation: 0.089,
      },
      byAgent: [
        {
          agent: 'gemini-2.5-pro',
          conversations: 5_234,
          inputTokens: 8_234_567,
          outputTokens: 12_345_678,
          totalTokens: 20_580_245,
          totalCost: 742.89,
          avgCost: 0.142,
          efficiency: 4_493, // tokens per quality point (totalTokens / avgQuality)
          costPerQualityPoint: 0.158, // cost per quality point
        },
        {
          agent: 'gemini-1.5-pro',
          conversations: 3_456,
          inputTokens: 5_123_456,
          outputTokens: 7_234_567,
          totalTokens: 12_358_023,
          totalCost: 321.45,
          avgCost: 0.093,
          efficiency: 2_746,
          costPerQualityPoint: 0.070,
        },
        {
          agent: 'gemini-1.5-flash',
          conversations: 6_789,
          inputTokens: 4_876_100,
          outputTokens: 7_420_299,
          totalTokens: 12_296_399,
          totalCost: 170.22,
          avgCost: 0.025,
          efficiency: 2_928,
          costPerQualityPoint: 0.040,
        },
      ],
      byType: [
        {
          type: 'support',
          conversations: 6_234,
          avgTokens: 2_890,
          avgCost: 0.067,
        },
        {
          type: 'technical',
          conversations: 4_567,
          avgTokens: 3_567,
          avgCost: 0.089,
        },
        {
          type: 'creative',
          conversations: 3_456,
          avgTokens: 4_234,
          avgCost: 0.112,
        },
        {
          type: 'analysis',
          conversations: 2_345,
          avgTokens: 3_123,
          avgCost: 0.078,
        },
      ],
      trends: Array.from({ length: days }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (days - 1 - i));
        const baseTokens = 1_200_000 + Math.random() * 300_000;
        return {
          date: date.toISOString().split('T')[0],
          totalTokens: Math.floor(baseTokens),
          inputTokens: Math.floor(baseTokens * 0.4),
          outputTokens: Math.floor(baseTokens * 0.6),
          cost: (baseTokens / 1_000_000) * 25.5,
          conversations: Math.floor(Math.random() * 200) + 300,
        };
      }),
      efficiency: {
        bestPerformers: [
          {
            conversationId: 'conv-best-001',
            tokensPerQualityPoint: 1_234,
            quality: 5.0,
            totalTokens: 6_170,
            cost: 0.089,
          },
          {
            conversationId: 'conv-best-002',
            tokensPerQualityPoint: 1_567,
            quality: 4.9,
            totalTokens: 7_678,
            cost: 0.095,
          },
        ],
        worstPerformers: [
          {
            conversationId: 'conv-worst-001',
            tokensPerQualityPoint: 8_234,
            quality: 3.2,
            totalTokens: 26_349,
            cost: 0.412,
          },
          {
            conversationId: 'conv-worst-002',
            tokensPerQualityPoint: 7_891,
            quality: 3.5,
            totalTokens: 27_618,
            cost: 0.398,
          },
        ],
      },
      costProjection: {
        daily: 41.15,
        monthly: 1_234.56,
        yearly: 14_814.72,
        trend: 0.05, // 5% increase from previous period
      },
    };

    return new Response(JSON.stringify(tokenUsage), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      },
    });
  } catch (error) {
    console.error('Error fetching token usage:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: 'Failed to fetch token usage data',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

