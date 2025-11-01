import type { APIRoute } from 'astro';
import { firestore } from '../../../../lib/firestore';

// GET /api/agents/:id/prompt-versions - Get all prompt versions for an agent
export const GET: APIRoute = async ({ params }) => {
  try {
    const { id } = params;

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Agent ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('📚 [VERSIONING] Loading prompt versions for agent:', id);

    const versionsSnapshot = await firestore
      .collection('agent_prompt_versions')
      .where('agentId', '==', id)
      .orderBy('createdAt', 'desc')
      .limit(20) // Last 20 versions
      .get();

    const versions = versionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    }));

    console.log('📚 [VERSIONING] Found', versions.length, 'versions');

    return new Response(
      JSON.stringify({ versions }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('❌ Error loading prompt versions:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to load prompt versions' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// POST /api/agents/:id/prompt-versions - Revert to a specific version
export const POST: APIRoute = async ({ params, request }) => {
  try {
    const { id } = params;
    const body = await request.json();
    const { versionId, userId } = body;

    if (!id || !versionId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Agent ID, version ID, and user ID are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔄 [VERSIONING] Reverting agent', id, 'to version', versionId);

    // Get the version to revert to
    const versionDoc = await firestore
      .collection('agent_prompt_versions')
      .doc(versionId)
      .get();

    if (!versionDoc.exists) {
      return new Response(
        JSON.stringify({ error: 'Version not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const versionData = versionDoc.data();
    
    // Get current config
    const currentConfigDoc = await firestore
      .collection('agent_configs')
      .doc(id)
      .get();

    const currentConfig = currentConfigDoc.data();

    // Save current version before reverting
    if (currentConfig?.agentPrompt) {
      await firestore
        .collection('agent_prompt_versions')
        .add({
          agentId: id,
          userId,
          prompt: currentConfig.agentPrompt,
          model: currentConfig.model || 'gemini-2.5-flash',
          createdAt: Timestamp.now(),
          versionNumber: (currentConfig.promptVersion || 0),
          changeType: 'before_revert',
        });
    }

    // Update config with reverted prompt
    const revertedConfig = {
      ...currentConfig,
      agentPrompt: versionData?.prompt,
      model: versionData?.model || currentConfig?.model || 'gemini-2.5-flash',
      promptVersion: (currentConfig?.promptVersion || 0) + 1,
      lastPromptUpdate: Timestamp.now(),
      revertedFrom: versionId,
    };

    // Remove undefined values
    Object.keys(revertedConfig).forEach(key => {
      if (revertedConfig[key] === undefined) {
        delete revertedConfig[key];
      }
    });

    await firestore
      .collection('agent_configs')
      .doc(id)
      .set(revertedConfig, { merge: true });

    console.log('✅ [VERSIONING] Reverted to version', versionData?.versionNumber);

    return new Response(
      JSON.stringify({
        success: true,
        agentPrompt: revertedConfig.agentPrompt,
        model: revertedConfig.model,
        promptVersion: revertedConfig.promptVersion,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('❌ Error reverting prompt version:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to revert prompt version' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};


