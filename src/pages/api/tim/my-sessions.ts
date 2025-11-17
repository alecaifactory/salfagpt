/**
 * API: Get User's Tim Sessions
 * GET /api/tim/my-sessions?userId={userId}
 * 
 * Returns all Tim test sessions for a user (privacy ledger)
 */

import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { getUserTestSessions } from '../../../lib/tim';
import type { TimLedgerEntry } from '../../../types/tim';

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    // 1. Authenticate
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. Get userId from query
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId parameter required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 3. Verify ownership (users can only see their own sessions)
    if (session.id !== userId && session.role !== 'admin' && session.role !== 'superadmin') {
      return new Response(
        JSON.stringify({ error: 'Forbidden - Can only view your own sessions' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 4. Get all test sessions for user
    const sessions = await getUserTestSessions(userId);

    // 5. Build privacy ledger
    const ledger: TimLedgerEntry[] = sessions.map(session => ({
      sessionId: session.id,
      ticketId: session.ticketId,
      createdAt: session.createdAt.toISOString(),
      status: session.status,
      dataShared: {
        profile: 'anonymized',
        messages: 'encrypted',
        contextSources: 'encrypted + anonymized',
        screenshots: 'UI only - no sensitive data',
        consoleLogs: 'redacted PII'
      },
      accessedBy: [
        ...(session.routedTo.ally ? [{ 
          agent: 'ally' as const, 
          timestamp: session.updatedAt.toISOString(),
          purpose: 'Personal agent context update'
        }] : []),
        ...(session.routedTo.stella ? [{ 
          agent: 'stella' as const, 
          timestamp: session.updatedAt.toISOString(),
          purpose: 'Product improvement insights'
        }] : []),
        ...(session.routedTo.rudy ? [{ 
          agent: 'rudy' as const, 
          timestamp: session.updatedAt.toISOString(),
          purpose: 'Roadmap prioritization'
        }] : []),
        { 
          agent: 'tim' as const, 
          timestamp: session.createdAt.toISOString(),
          purpose: 'Issue reproduction and analysis'
        }
      ],
      complianceScore: session.privacyLedger.complianceChecks.length > 0
        ? session.privacyLedger.complianceChecks[0].score
        : 0,
      compliancePassed: session.privacyLedger.complianceChecks.length > 0
        ? session.privacyLedger.complianceChecks[0].passed
        : false,
      downloadUrl: `/api/tim/download/${session.id}`
    }));

    // 6. Return ledger
    return new Response(JSON.stringify({ ledger }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error fetching Tim sessions:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch Tim sessions',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

