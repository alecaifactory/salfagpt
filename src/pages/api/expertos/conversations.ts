import type { APIRoute } from 'astro';
import { verifyAccess, createAccessDeniedResponse, createUnauthorizedResponse, UserRole } from '../../../lib/access-control';

export const GET: APIRoute = async ({ request }) => {
  // Verify Expert access or higher
  const userAccess = await verifyAccess(request, UserRole.EXPERT);
  
  if (!userAccess) {
    return createUnauthorizedResponse();
  }
  
  // Check if user has at least Expert role
  const allowedRoles = [UserRole.EXPERT, UserRole.ADMIN, UserRole.SUPERADMIN];
  if (!allowedRoles.includes(userAccess.role)) {
    return createAccessDeniedResponse('Expert access required');
  }

  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'pending';
    const type = url.searchParams.get('type') || '';
    const dateRange = url.searchParams.get('dateRange') || '7days';
    const search = url.searchParams.get('search') || '';

    // Mock conversations data
    // In production, this would query Firestore
    const allConversations = [
      {
        id: 'conv-001',
        userId: 'user-001',
        userHash: 'user_a1b2c3',
        model: 'gemini-2.5-pro',
        messageCount: 12,
        createdAt: new Date(Date.now() - 86400000 * 1).toISOString(), // 1 day ago
        status: 'pending',
        type: 'support',
        title: 'How to set up authentication?',
        preview: 'User asking about OAuth 2.0 setup with Google...',
        tokenUsage: {
          input: 1234,
          output: 2345,
          total: 3579,
        },
      },
      {
        id: 'conv-002',
        userId: 'user-002',
        userHash: 'user_d4e5f6',
        model: 'gemini-1.5-pro',
        messageCount: 8,
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
        status: 'evaluated',
        type: 'technical',
        title: 'Code optimization query',
        preview: 'Discussion about React performance optimization...',
        tokenUsage: {
          input: 987,
          output: 1543,
          total: 2530,
        },
        existingEvaluation: {
          scores: { accuracy: 5, helpfulness: 4, coherence: 5, safety: 5, efficiency: 4, overall: 4.6 },
        },
      },
      {
        id: 'conv-003',
        userId: 'user-003',
        userHash: 'user_g7h8i9',
        model: 'gemini-2.5-pro',
        messageCount: 15,
        createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
        status: 'pending',
        type: 'creative',
        title: 'Story writing assistance',
        preview: 'Creative writing help for a sci-fi story...',
        tokenUsage: {
          input: 2345,
          output: 4567,
          total: 6912,
        },
      },
      {
        id: 'conv-004',
        userId: 'user-001',
        userHash: 'user_a1b2c3',
        model: 'gemini-1.5-flash',
        messageCount: 6,
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        status: 'flagged',
        type: 'support',
        title: 'Urgent deployment issue',
        preview: 'Production deployment failing with errors...',
        tokenUsage: {
          input: 543,
          output: 876,
          total: 1419,
        },
      },
      {
        id: 'conv-005',
        userId: 'user-004',
        userHash: 'user_j1k2l3',
        model: 'gemini-2.5-pro',
        messageCount: 20,
        createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
        status: 'pending',
        type: 'analysis',
        title: 'Data analysis request',
        preview: 'User requesting help analyzing CSV data...',
        tokenUsage: {
          input: 3456,
          output: 5678,
          total: 9134,
        },
      },
    ];

    // Filter conversations
    let filtered = allConversations;

    // Filter by status
    if (status !== 'all') {
      filtered = filtered.filter(c => c.status === status);
    }

    // Filter by type
    if (type && type !== 'all') {
      filtered = filtered.filter(c => c.type === type);
    }

    // Filter by date range
    const now = Date.now();
    const dateRangeMs: Record<string, number> = {
      '1day': 86400000,
      '7days': 86400000 * 7,
      '30days': 86400000 * 30,
      'all': Infinity,
    };
    const rangeMs = dateRangeMs[dateRange] || dateRangeMs['7days'];
    filtered = filtered.filter(c => now - new Date(c.createdAt).getTime() <= rangeMs);

    // Filter by search query
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        c =>
          c.title.toLowerCase().includes(searchLower) ||
          c.preview.toLowerCase().includes(searchLower) ||
          c.userHash.toLowerCase().includes(searchLower)
      );
    }

    // Calculate statistics
    const stats = {
      pending: allConversations.filter(c => c.status === 'pending').length,
      evaluated: allConversations.filter(c => c.status === 'evaluated').length,
      flagged: allConversations.filter(c => c.status === 'flagged').length,
      avgEvaluationTime: 5, // minutes - mock data
    };

    return new Response(
      JSON.stringify({
        conversations: filtered,
        stats,
        total: filtered.length,
        filters: {
          status,
          type,
          dateRange,
          search,
        },
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
    console.error('Error fetching conversations:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: 'Failed to fetch conversations',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

