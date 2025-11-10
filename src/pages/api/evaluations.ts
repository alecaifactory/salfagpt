/**
 * Evaluations API
 * 
 * Purpose: CRUD operations for agent evaluations
 * Access: Experts and Admins only
 */

import type { APIRoute } from 'astro';
import { firestore } from '../../lib/firestore';
import { getSession } from '../../lib/auth';
import { EVALUATION_COLLECTIONS } from '../../types/evaluations';
import type { Evaluation } from '../../types/evaluations';

/**
 * GET /api/evaluations
 * List all evaluations (filtered by user permissions)
 */
export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    // Authenticate
    const session = getSession({ cookies });
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get userId from query
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify user is authenticated and matches session
    if (session.id !== userId) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if user has permission (Expert or Admin)
    const userDoc = await firestore.collection('users').doc(userId).get();
    const user = userDoc.data();
    
    if (!user || !['admin', 'expert', 'superadmin'].includes(user.role)) {
      return new Response(JSON.stringify({ error: 'Forbidden - Experts and Admins only' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Load evaluations
    let query = firestore.collection(EVALUATION_COLLECTIONS.EVALUATIONS);

    // Admins see all, Experts see only theirs
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      query = query.where('createdBy', '==', userId) as any;
    }

    const snapshot = await query.orderBy('createdAt', 'desc').get();
    
    const evaluations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
      approvedAt: doc.data().approvedAt?.toDate?.() || doc.data().approvedAt,
    }));

    return new Response(JSON.stringify({ evaluations }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error loading evaluations:', error);
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
 * POST /api/evaluations
 * Create new evaluation
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Authenticate
    const session = getSession({ cookies });
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { userId, evaluation } = body;

    if (!userId || !evaluation) {
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

    // Check permissions
    const userDoc = await firestore.collection('users').doc(userId).get();
    const user = userDoc.data();
    
    if (!user || !['admin', 'expert', 'superadmin'].includes(user.role)) {
      return new Response(JSON.stringify({ error: 'Forbidden - Experts and Admins only' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generate evaluation ID
    const timestamp = new Date().toISOString().split('T')[0];
    const agentCode = evaluation.agentId.substring(0, 8);
    const evaluationId = `EVAL-${agentCode}-${timestamp}-${evaluation.version}`;

    // Create evaluation document
    const evaluationData: Evaluation = {
      ...evaluation,
      id: evaluationId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Filter undefined values
    const cleanData = Object.fromEntries(
      Object.entries(evaluationData).filter(([_, v]) => v !== undefined)
    );

    await firestore
      .collection(EVALUATION_COLLECTIONS.EVALUATIONS)
      .doc(evaluationId)
      .set(cleanData);

    console.log('✅ Evaluation created:', evaluationId);

    return new Response(JSON.stringify({ 
      id: evaluationId,
      evaluation: cleanData,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating evaluation:', error);
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
 * PATCH /api/evaluations/:id
 * Update evaluation
 */
export const PATCH: APIRoute = async ({ params, request, cookies }) => {
  try {
    // Authenticate
    const session = getSession({ cookies });
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { userId, updates } = body;
    const { id } = params;

    if (!userId || !id) {
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

    // Get evaluation
    const evalDoc = await firestore
      .collection(EVALUATION_COLLECTIONS.EVALUATIONS)
      .doc(id)
      .get();

    if (!evalDoc.exists) {
      return new Response(JSON.stringify({ error: 'Evaluation not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const evaluation = evalDoc.data();

    // Verify ownership or admin
    const userDoc = await firestore.collection('users').doc(userId).get();
    const user = userDoc.data();
    
    if (!user || (!['admin', 'superadmin'].includes(user.role) && evaluation?.createdBy !== userId)) {
      return new Response(JSON.stringify({ error: 'Forbidden - Not evaluation owner' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Update
    const updateData = {
      ...updates,
      updatedAt: new Date(),
    };

    // Filter undefined
    const cleanData = Object.fromEntries(
      Object.entries(updateData).filter(([_, v]) => v !== undefined)
    );

    await firestore
      .collection(EVALUATION_COLLECTIONS.EVALUATIONS)
      .doc(id)
      .update(cleanData);

    console.log('✅ Evaluation updated:', id);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating evaluation:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};











