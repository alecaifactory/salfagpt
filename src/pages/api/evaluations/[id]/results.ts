/**
 * Evaluation Results API
 * 
 * Purpose: CRUD for test results within an evaluation
 */

import type { APIRoute } from 'astro';
import { firestore } from '../../../../lib/firestore';
import { getSession } from '../../../../lib/auth';
import { EVALUATION_COLLECTIONS } from '../../../../types/evaluations';

/**
 * GET /api/evaluations/:id/results
 * Get all test results for an evaluation
 */
export const GET: APIRoute = async ({ params, request, cookies }) => {
  try {
    const session = getSession({ cookies });
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: 'Evaluation ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Load results
    const snapshot = await firestore
      .collection(EVALUATION_COLLECTIONS.TEST_RESULTS)
      .where('evaluationId', '==', id)
      .orderBy('testedAt', 'desc')
      .get();

    const results = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      testedAt: doc.data().testedAt?.toDate?.() || doc.data().testedAt,
    }));

    return new Response(JSON.stringify({ results }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error loading results:', error);
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
 * POST /api/evaluations/:id/results
 * Save a test result
 */
export const POST: APIRoute = async ({ params, request, cookies }) => {
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
    const { userId, result } = body;

    if (!userId || !id || !result) {
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

    // Save result
    const resultData = {
      ...result,
      testedAt: new Date(),
    };

    // Filter undefined
    const cleanData = Object.fromEntries(
      Object.entries(resultData).filter(([_, v]) => v !== undefined)
    );

    const resultDoc = await firestore
      .collection(EVALUATION_COLLECTIONS.TEST_RESULTS)
      .add(cleanData);

    // Update evaluation stats
    await updateEvaluationStats(id);

    console.log('✅ Test result saved:', resultDoc.id);

    return new Response(JSON.stringify({ 
      id: resultDoc.id,
      result: cleanData,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error saving result:', error);
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
 * Helper: Update evaluation statistics
 */
async function updateEvaluationStats(evaluationId: string) {
  try {
    // Get all results for this evaluation
    const resultsSnapshot = await firestore
      .collection(EVALUATION_COLLECTIONS.TEST_RESULTS)
      .where('evaluationId', '==', evaluationId)
      .get();

    if (resultsSnapshot.empty) {
      return;
    }

    const results = resultsSnapshot.docs.map(doc => doc.data());
    
    // Calculate stats
    const questionsTested = new Set(results.map(r => r.questionId)).size;
    const averageQuality = results.reduce((sum, r) => sum + (r.quality || 0), 0) / results.length;
    const phantomRefsDetected = results.filter(r => r.phantomRefs).length;
    const questionsPassedQuality = results.filter(r => r.passedCriteria).length;
    
    // Calculate average similarity
    const similarities = results
      .flatMap(r => r.references?.map((ref: any) => ref.similarity) || [])
      .filter(s => s !== undefined && s !== null);
    
    const avgSimilarity = similarities.length > 0
      ? similarities.reduce((sum, s) => sum + s, 0) / similarities.length
      : undefined;

    // Determine status
    let status = 'in_progress';
    
    // Get evaluation to check total questions
    const evalDoc = await firestore
      .collection(EVALUATION_COLLECTIONS.EVALUATIONS)
      .doc(evaluationId)
      .get();
    
    const evaluation = evalDoc.data();
    
    if (evaluation && questionsTested >= evaluation.totalQuestions) {
      status = 'completed';
    }

    // Update evaluation
    await firestore
      .collection(EVALUATION_COLLECTIONS.EVALUATIONS)
      .doc(evaluationId)
      .update({
        questionsTested,
        averageQuality,
        phantomRefsDetected,
        questionsPassedQuality,
        avgSimilarity: avgSimilarity || 0,
        status,
        updatedAt: new Date(),
      });

    console.log('✅ Evaluation stats updated:', evaluationId);
  } catch (error) {
    console.error('Error updating evaluation stats:', error);
    // Don't throw - this is non-critical
  }
}











