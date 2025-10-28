/**
 * API: Agent Test Questions
 * 
 * GET /api/agents/:id/test-questions - List test questions
 * POST /api/agents/:id/test-questions - Create test question
 * DELETE /api/agents/:id/test-questions/:questionId - Delete test question
 */

import type { APIRoute } from 'astro';
import { firestore } from '../../../../lib/firestore';
import { getSession } from '../../../../lib/auth';
import type { TestQuestion } from '../../../../types/agent-testing';

export const GET: APIRoute = async ({ params }) => {
  try {
    const agentId = params.id;
    
    const snapshot = await firestore
      .collection('test_questions')
      .where('agentId', '==', agentId)
      .orderBy('createdAt', 'desc')
      .get();
    
    const questions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()
    }));
    
    return new Response(
      JSON.stringify({ questions }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error loading questions:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to load questions' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const POST: APIRoute = async ({ params, request, cookies }) => {
  try {
    const session = getSession({ cookies } as any);
    const agentId = params.id;
    const body = await request.json();
    
    const {
      question,
      category = 'other',
      difficulty = 'medium',
      expectedKeywords = [],
      expectedReferences,
      expectedSteps,
      enabled = true,
      createdBy
    } = body;
    
    if (!question) {
      return new Response(
        JSON.stringify({ error: 'Question is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const questionData: Omit<TestQuestion, 'id'> = {
      agentId,
      question,
      category,
      difficulty,
      expectedKeywords,
      expectedReferences,
      expectedSteps,
      enabled,
      createdAt: new Date(),
      createdBy: createdBy || session?.id || 'system'
    };
    
    const ref = await firestore.collection('test_questions').add(questionData);
    
    return new Response(
      JSON.stringify({
        success: true,
        question: {
          id: ref.id,
          ...questionData
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error creating question:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create question' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

