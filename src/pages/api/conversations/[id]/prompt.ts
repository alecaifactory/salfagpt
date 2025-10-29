import type { APIRoute } from 'astro';
import { getAgentConfig, saveAgentConfig } from '../../../../lib/firestore';

// GET /api/conversations/:id/prompt - Get agent prompt for conversation
export const GET: APIRoute = async ({ params, request, cookies }) => {
  try {
    const { id } = params;
    
    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Conversation ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const config = await getAgentConfig(id);

    // Return empty prompt if no config exists (backward compatible)
    return new Response(JSON.stringify({
      agentPrompt: config?.agentPrompt || config?.systemPrompt || '',
      model: config?.model || null,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error getting agent prompt:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to get agent prompt' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// PUT /api/conversations/:id/prompt - Update agent prompt for conversation
export const PUT: APIRoute = async ({ params, request, cookies }) => {
  try {
    const { id } = params;
    const body = await request.json();
    const { agentPrompt, userId, model } = body;

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Conversation ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get existing config or create new
    const existingConfig = await getAgentConfig(id);
    
    const config = await saveAgentConfig(id, userId, {
      model: model || existingConfig?.model || 'gemini-2.5-flash',
      agentPrompt: agentPrompt || '',
      temperature: existingConfig?.temperature,
      maxOutputTokens: existingConfig?.maxOutputTokens,
    });

    console.log('✅ Agent prompt updated:', id);

    return new Response(JSON.stringify({
      agentPrompt: config.agentPrompt,
      model: config.model,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error updating agent prompt:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to update agent prompt' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

