import type { APIRoute } from 'astro';
import { getSession } from '../../../../lib/auth';
import { firestore, COLLECTIONS } from '../../../../lib/firestore';
import { invalidateAgentSourcesCache } from '../../../../lib/agent-sources-cache';

/**
 * POST /api/context-sources/:id/assign-agent
 * Assign a context source to an agent (add to assignedToAgents array)
 * 
 * Body: {
 *   agentId: string  // Conversation ID to assign to
 * }
 * 
 * Security: User must own the source
 */
export const POST: APIRoute = async (context) => {
  try {
    // 1. Verify authentication
    const session = getSession(context);
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Please login' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { params, request } = context;
    const sourceId = params.id;

    if (!sourceId) {
      return new Response(
        JSON.stringify({ error: 'Source ID required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Parse request body
    const body = await request.json();
    const { agentId } = body;

    if (!agentId) {
      return new Response(
        JSON.stringify({ error: 'Agent ID required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. Get source document
    const sourceRef = firestore.collection(COLLECTIONS.CONTEXT_SOURCES).doc(sourceId);
    const sourceDoc = await sourceRef.get();

    if (!sourceDoc.exists) {
      return new Response(
        JSON.stringify({ error: 'Context source not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const sourceData = sourceDoc.data();

    // 4. Verify ownership
    if (sourceData?.userId !== session.id) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - Cannot modify other user sources' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 5. Get current assignments
    const currentAssignments = sourceData?.assignedToAgents || [];

    // 6. Add agent if not already assigned
    if (!currentAssignments.includes(agentId)) {
      const updatedAssignments = [...currentAssignments, agentId];
      
      await sourceRef.update({
        assignedToAgents: updatedAssignments,
        updatedAt: new Date(),
      });

      // ⚡ Invalidate cache for this agent (so next search will reflect new source)
      invalidateAgentSourcesCache(agentId, session.id);

      console.log(`✅ Agent ${agentId} assigned to source ${sourceId}`);
      console.log(`   Total agents: ${updatedAssignments.length}`);
      console.log(`⚡ Invalidated agent sources cache for agent ${agentId}`);

      return new Response(
        JSON.stringify({
          success: true,
          assignedToAgents: updatedAssignments,
          message: `Fuente asignada al agente`
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } else {
      // Already assigned
      return new Response(
        JSON.stringify({
          success: true,
          assignedToAgents: currentAssignments,
          message: `Fuente ya está asignada al agente`
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('❌ Error assigning agent to source:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

