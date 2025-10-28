/**
 * API: Agent Testing Configuration
 * 
 * GET /api/agents/:id/testing-config - Get agent's testing configuration
 * PUT /api/agents/:id/testing-config - Update testing configuration
 */

import type { APIRoute } from 'astro';
import { firestore, COLLECTIONS } from '../../../../lib/firestore';
import { getSession } from '../../../../lib/auth';

export const GET: APIRoute = async ({ params, cookies }) => {
  try {
    const session = getSession({ cookies } as any);
    const agentId = params.id;
    
    if (!agentId) {
      return new Response(
        JSON.stringify({ error: 'Agent ID required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Load testing config
    const configDoc = await firestore
      .collection('agent_testing_config')
      .doc(agentId)
      .get();
    
    if (!configDoc.exists) {
      // Return default config
      return new Response(
        JSON.stringify({
          testingEnabled: false,
          questions: [],
          examples: [],
          executions: [],
          stats: null
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const config = configDoc.data();
    
    // Load questions
    const questionsSnapshot = await firestore
      .collection('test_questions')
      .where('agentId', '==', agentId)
      .where('enabled', '==', true)
      .orderBy('createdAt', 'desc')
      .get();
    
    const questions = questionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()
    }));
    
    // Load examples
    const examplesSnapshot = await firestore
      .collection('response_examples')
      .where('agentId', '==', agentId)
      .orderBy('quality', 'desc')
      .get();
    
    const examples = examplesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()
    }));
    
    // Load recent executions
    const executionsSnapshot = await firestore
      .collection('test_executions')
      .where('agentId', '==', agentId)
      .orderBy('executedAt', 'desc')
      .limit(50)
      .get();
    
    const executions = executionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      executedAt: doc.data().executedAt?.toDate()
    }));
    
    return new Response(
      JSON.stringify({
        testingEnabled: config.testingEnabled || false,
        questions,
        examples,
        executions,
        stats: {
          totalExecutions: config.totalExecutions || 0,
          avgQualityScore: config.avgQualityScore || 0,
          passRate: config.passRate || 0,
          lastExecutionAt: config.lastExecutionAt?.toDate()
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error loading testing config:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to load testing config' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const PUT: APIRoute = async ({ params, request, cookies }) => {
  try {
    const session = getSession({ cookies } as any);
    const agentId = params.id;
    const body = await request.json();
    
    if (!agentId) {
      return new Response(
        JSON.stringify({ error: 'Agent ID required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const { testingEnabled } = body;
    
    // Update or create config
    await firestore
      .collection('agent_testing_config')
      .doc(agentId)
      .set({
        agentId,
        testingEnabled: testingEnabled !== undefined ? testingEnabled : false,
        updatedAt: new Date(),
        updatedBy: session?.id || 'system'
      }, { merge: true });
    
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error updating testing config:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to update testing config' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

