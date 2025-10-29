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

    console.log('🔍 [BACKEND] PUT /api/conversations/:id/prompt');
    console.log('🔍 [BACKEND] Conversation ID:', id);
    console.log('🔍 [BACKEND] User ID:', userId);
    console.log('🔍 [BACKEND] Model:', model);
    console.log('🔍 [BACKEND] Agent prompt received length:', agentPrompt?.length);
    console.log('🔍 [BACKEND] Agent prompt received (first 200 chars):', agentPrompt?.substring(0, 200));
    console.log('🔍 [BACKEND] Full agent prompt received:', agentPrompt);

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
    console.log('🔍 [BACKEND] Existing config:', existingConfig);
    
    // Build config object, filtering out undefined values (Firestore doesn't accept them)
    const configToSave: any = {
      model: model || existingConfig?.model || 'gemini-2.5-flash',
      agentPrompt: agentPrompt || '',
    };
    
    // Only include temperature if defined
    if (existingConfig?.temperature !== undefined) {
      configToSave.temperature = existingConfig.temperature;
    }
    
    // Only include maxOutputTokens if defined
    if (existingConfig?.maxOutputTokens !== undefined) {
      configToSave.maxOutputTokens = existingConfig.maxOutputTokens;
    }
    
    console.log('🔍 [BACKEND] Config to save:', configToSave);
    console.log('🔍 [BACKEND] Config agentPrompt length:', configToSave.agentPrompt.length);
    
    const config = await saveAgentConfig(id, userId, configToSave);

    console.log('✅ [BACKEND] Agent prompt updated:', id);
    console.log('🔍 [BACKEND] Saved config from Firestore:', config);
    console.log('🔍 [BACKEND] Saved agentPrompt length:', config.agentPrompt?.length);
    console.log('🔍 [BACKEND] Saved agentPrompt:', config.agentPrompt);

    return new Response(JSON.stringify({
      agentPrompt: config.agentPrompt,
      model: config.model,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('❌ [BACKEND] Error updating agent prompt:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to update agent prompt' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

