import type { APIRoute } from 'astro';
import { getAgentConfig, saveAgentConfig, firestore } from '../../lib/firestore';

// GET /api/agent-config?conversationId=xxx - Get agent config for conversation
export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const conversationId = url.searchParams.get('conversationId');

    if (!conversationId) {
      return new Response(
        JSON.stringify({ error: 'conversationId is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const config = await getAgentConfig(conversationId);
    
    // Also load agent setup doc if exists
    let setupDoc = null;
    try {
      const setupDocSnap = await firestore
        .collection('agent_setup_docs')
        .doc(conversationId)
        .get();
      
      if (setupDocSnap.exists) {
        setupDoc = setupDocSnap.data();
      }
    } catch (error) {
      console.warn('Could not load setup doc:', error);
    }

    if (!config) {
      // Return default config if none exists
      return new Response(
        JSON.stringify({
          conversationId,
          model: 'gemini-2.5-flash',
          systemPrompt: 'Eres un asistente de IA útil, preciso y amigable. Proporciona respuestas claras y concisas mientras eres exhaustivo cuando sea necesario. Sé respetuoso y profesional en todas las interacciones.',
          temperature: 0.7,
          maxOutputTokens: 8192,
          testExamples: setupDoc?.inputExamples ? setupDoc.inputExamples.map((ex: any, idx: number) => ({
            input: ex.question,
            expectedOutput: setupDoc.correctOutputs?.[idx]?.example || 'Respuesta apropiada según configuración',
            category: ex.category || 'General'
          })) : []
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Merge config with setup doc examples
    const mergedConfig = {
      ...config,
      businessCase: setupDoc?.agentPurpose,
      acceptanceCriteria: setupDoc?.setupInstructions,
      testExamples: setupDoc?.inputExamples ? setupDoc.inputExamples.map((ex: any, idx: number) => ({
        input: ex.question,
        expectedOutput: setupDoc.correctOutputs?.[idx]?.example || 'Respuesta apropiada según configuración',
        category: ex.category || 'General'
      })) : []
    };

    return new Response(JSON.stringify(mergedConfig), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error getting agent config:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to get agent config' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// POST /api/agent-config - Save agent config for conversation
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { conversationId, userId, model, systemPrompt, temperature, maxOutputTokens } = body;

    if (!conversationId || !userId) {
      return new Response(
        JSON.stringify({ error: 'conversationId and userId are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const config = await saveAgentConfig(conversationId, userId, {
      model: model || 'gemini-2.5-flash',
      systemPrompt: systemPrompt || 'Eres un asistente de IA útil, preciso y amigable. Proporciona respuestas claras y concisas mientras eres exhaustivo cuando sea necesario. Sé respetuoso y profesional en todas las interacciones.',
      temperature: temperature ?? 0.7,
      maxOutputTokens: maxOutputTokens ?? 8192,
    });

    console.log('✅ Agent config saved:', conversationId);

    return new Response(JSON.stringify(config), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error saving agent config:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to save agent config' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

