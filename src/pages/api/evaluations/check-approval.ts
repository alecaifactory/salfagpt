/**
 * Check Agent Approval Status API
 * 
 * Purpose: Check if agent has an approved evaluation
 * Used by: Agent sharing workflow
 */

import type { APIRoute } from 'astro';
import { firestore } from '../../../lib/firestore';
import { getSession } from '../../../lib/auth';
import { EVALUATION_COLLECTIONS } from '../../../types/evaluations';

/**
 * GET /api/evaluations/check-approval?agentId=xxx&userId=xxx
 * Check if agent has approved evaluation
 */
export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    const session = getSession({ cookies });
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(request.url);
    const agentId = url.searchParams.get('agentId');
    const userId = url.searchParams.get('userId');

    if (!agentId || !userId) {
      return new Response(JSON.stringify({ error: 'agentId and userId required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify ownership
    if (session.id !== userId) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check for approved evaluation
    const snapshot = await firestore
      .collection(EVALUATION_COLLECTIONS.EVALUATIONS)
      .where('agentId', '==', agentId)
      .where('status', '==', 'approved')
      .limit(1)
      .get();

    const hasApprovedEvaluation = !snapshot.empty;
    const evaluationId = snapshot.empty ? null : snapshot.docs[0].id;

    return new Response(JSON.stringify({
      hasApprovedEvaluation,
      evaluationId,
      agentId,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error checking approval:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

