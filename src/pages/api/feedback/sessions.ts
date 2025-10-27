/**
 * API: Create and manage feedback sessions
 * POST /api/feedback/sessions - Create new session
 * GET /api/feedback/sessions - List user's sessions
 */

import type { APIRoute } from 'astro';
import { firestore, getEnvironmentSource } from '../../../lib/firestore';
import type { FeedbackSession, FeedbackSessionType } from '../../../types/feedback';

// Create new feedback session
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { userId, companyId, sessionType, initialMessage } = body;
    
    // Validate required fields
    if (!userId || !companyId) {
      return new Response(
        JSON.stringify({ error: 'userId and companyId required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Create session document
    const sessionData: Omit<FeedbackSession, 'id'> = {
      userId,
      companyId,
      sessionType: sessionType || 'general_feedback',
      status: 'active',
      priority: 'medium',
      messages: [],
      screenshots: [],
      annotations: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      source: getEnvironmentSource(),
    };
    
    const sessionRef = await firestore.collection('feedback_sessions').add(sessionData);
    
    const session: FeedbackSession = {
      id: sessionRef.id,
      ...sessionData,
    };
    
    console.log('✅ Feedback session created:', sessionRef.id);
    
    return new Response(
      JSON.stringify(session),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('❌ Error creating feedback session:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to create session',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// Get user's feedback sessions
export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const status = url.searchParams.get('status');
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    let query = firestore
      .collection('feedback_sessions')
      .where('userId', '==', userId);
    
    if (status) {
      query = query.where('status', '==', status);
    }
    
    const snapshot = await query
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();
    
    const sessions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate(),
      submittedAt: doc.data().submittedAt?.toDate(),
      reviewedAt: doc.data().reviewedAt?.toDate(),
    })) as FeedbackSession[];
    
    return new Response(
      JSON.stringify(sessions),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('❌ Error fetching sessions:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch sessions',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

