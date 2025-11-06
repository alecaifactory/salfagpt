/**
 * Agent Sharing Approvals API
 * 
 * Purpose: Manage approval requests for sharing agents
 */

import type { APIRoute } from 'astro';
import { firestore } from '../../lib/firestore';
import { getSession } from '../../lib/auth';
import { EVALUATION_COLLECTIONS } from '../../types/evaluations';
import type { AgentSharingApproval } from '../../types/evaluations';

/**
 * POST /api/agent-sharing-approvals
 * Create new approval request
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const session = getSession({ cookies });
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { userId, approval } = body;

    if (!userId || !approval) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
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

    // Validate sample questions (require 3)
    if (!approval.sampleQuestions || approval.sampleQuestions.length < 3) {
      return new Response(JSON.stringify({ 
        error: 'Se requieren al menos 3 ejemplos de preguntas (mala, razonable, sobresaliente)' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create approval request
    const approvalData: AgentSharingApproval = {
      ...approval,
      id: `approval-${Date.now()}`,
      requestedAt: new Date(),
    };

    const cleanData = Object.fromEntries(
      Object.entries(approvalData).filter(([_, v]) => v !== undefined)
    );

    await firestore
      .collection(EVALUATION_COLLECTIONS.AGENT_SHARING_APPROVALS)
      .doc(approvalData.id)
      .set(cleanData);

    console.log('✅ Sharing approval request created:', approvalData.id);

    // Notify experts (future: email notification)
    console.log('📧 TODO: Notify experts of new approval request');

    return new Response(JSON.stringify({ 
      id: approvalData.id,
      approval: cleanData,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating approval request:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

/**
 * GET /api/agent-sharing-approvals
 * List approval requests (experts/admins see all, users see own)
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
    const userId = url.searchParams.get('userId');

    if (!userId || session.id !== userId) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check user role
    const userDoc = await firestore.collection('users').doc(userId).get();
    const user = userDoc.data();

    let query = firestore.collection(EVALUATION_COLLECTIONS.AGENT_SHARING_APPROVALS);

    // Users see only their own requests
    // Experts/Admins see all
    if (!user || !['admin', 'expert', 'superadmin'].includes(user.role)) {
      query = query.where('requestedBy', '==', userId) as any;
    }

    const snapshot = await query.orderBy('requestedAt', 'desc').get();

    const approvals = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      requestedAt: doc.data().requestedAt?.toDate?.() || doc.data().requestedAt,
      reviewedAt: doc.data().reviewedAt?.toDate?.() || doc.data().reviewedAt,
    }));

    return new Response(JSON.stringify({ approvals }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error loading approvals:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

/**
 * PATCH /api/agent-sharing-approvals/:id
 * Approve or reject an approval request (Experts/Admins only)
 */
export const PATCH: APIRoute = async ({ params, request, cookies }) => {
  try {
    const session = getSession({ cookies });
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { id } = params;
    const body = await request.json();
    const { userId, action, reviewNotes } = body;

    if (!userId || !id || !action) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
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

    // Check if user is expert/admin
    const userDoc = await firestore.collection('users').doc(userId).get();
    const user = userDoc.data();

    if (!user || !['admin', 'expert', 'superadmin'].includes(user.role)) {
      return new Response(JSON.stringify({ 
        error: 'Forbidden - Only experts and admins can review approval requests' 
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Update approval
    await firestore
      .collection(EVALUATION_COLLECTIONS.AGENT_SHARING_APPROVALS)
      .doc(id)
      .update({
        status: action === 'approve' ? 'approved' : 'rejected',
        reviewedBy: userId,
        reviewedByEmail: user.email,
        reviewedAt: new Date(),
        reviewNotes: reviewNotes || '',
      });

    console.log(`✅ Approval ${action}ed:`, id);

    // TODO: Notify requester via email

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating approval:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};










