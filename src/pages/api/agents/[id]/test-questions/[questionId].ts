/**
 * API: Delete Test Question
 * 
 * DELETE /api/agents/:id/test-questions/:questionId
 */

import type { APIRoute } from 'astro';
import { firestore } from '../../../../../lib/firestore';

export const DELETE: APIRoute = async ({ params }) => {
  try {
    const { id: agentId, questionId } = params;
    
    if (!agentId || !questionId) {
      return new Response(
        JSON.stringify({ error: 'Agent ID and Question ID required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Delete question
    await firestore.collection('test_questions').doc(questionId).delete();
    
    // Also delete related examples
    const examplesSnapshot = await firestore
      .collection('response_examples')
      .where('questionId', '==', questionId)
      .get();
    
    const batch = firestore.batch();
    examplesSnapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error deleting question:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to delete question' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

