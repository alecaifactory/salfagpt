/**
 * API: Submit feedback session
 * POST /api/feedback/sessions/:id/submit - Mark session as submitted
 */

import type { APIRoute } from 'astro';
import { firestore } from '../../../../../lib/firestore';

export const POST: APIRoute = async ({ params, request }) => {
  try {
    const { id: sessionId } = params;
    const body = await request.json();
    const { title, description } = body;
    
    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: 'sessionId required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Update session
    await firestore.collection('feedback_sessions').doc(sessionId).update({
      title: title || 'Feedback sin título',
      description,
      status: 'submitted',
      submittedAt: new Date(),
      updatedAt: new Date(),
    });
    
    console.log('✅ Feedback submitted:', sessionId);
    
    // TODO: Send notification to admins
    // await notifyAdminsOfNewFeedback(sessionId);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        sessionId,
        message: 'Feedback submitted successfully'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('❌ Error submitting feedback:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to submit feedback',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

