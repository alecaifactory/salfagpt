import type { APIRoute } from 'astro';
import { getWorkflowConfig, saveWorkflowConfig, getUserWorkflowConfigs } from '../../lib/firestore';

// GET /api/workflow-config?workflowId=xxx&userId=xxx - Get workflow config
export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const workflowId = url.searchParams.get('workflowId');
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // If no workflowId, return all configs for user
    if (!workflowId) {
      const configs = await getUserWorkflowConfigs(userId);
      return new Response(JSON.stringify(configs), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get specific workflow config
    const config = await getWorkflowConfig(workflowId, userId);

    if (!config) {
      return new Response(
        JSON.stringify({ error: 'Workflow config not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify(config), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error getting workflow config:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to get workflow config' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// POST /api/workflow-config - Save workflow config
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { workflowId, userId, workflowType, config } = body;

    if (!workflowId || !userId || !workflowType) {
      return new Response(
        JSON.stringify({ error: 'workflowId, userId, and workflowType are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const savedConfig = await saveWorkflowConfig(workflowId, userId, {
      workflowType,
      config: config || {},
    });

    console.log('✅ Workflow config saved:', workflowId);

    return new Response(JSON.stringify(savedConfig), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error saving workflow config:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to save workflow config' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

