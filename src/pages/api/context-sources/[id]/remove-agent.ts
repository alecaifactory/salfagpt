import type { APIRoute } from 'astro';
import { getSession } from '../../../../lib/auth';
import { removeAgentFromContextSource } from '../../../../lib/firestore';

/**
 * Remove an agent from a context source's assignedToAgents array
 * POST /api/context-sources/:id/remove-agent
 * Body: { agentId: string }
 */
export const POST: APIRoute = async ({ params, request, cookies }) => {
  try {
    // 1. Authenticate
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. Get parameters
    const { id: sourceId } = params;
    if (!sourceId) {
      return new Response(JSON.stringify({ error: 'Source ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { agentId } = body;

    if (!agentId) {
      return new Response(JSON.stringify({ error: 'Agent ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 3. Remove agent from source
    console.log(`🔐 Removing agent ${agentId} from source ${sourceId} for user ${session.id}`);
    
    const result = await removeAgentFromContextSource(sourceId, agentId);

    // 4. Return result
    return new Response(JSON.stringify({
      success: true,
      deleted: result.deleted,
      remainingAgents: result.remainingAgents,
      message: result.deleted 
        ? 'Fuente eliminada completamente (sin agentes asignados)'
        : `Fuente removida del agente (${result.remainingAgents} agente(s) restante(s))`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error removing agent from context source:', error);
    return new Response(JSON.stringify({
      error: 'Failed to remove agent from context source',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

