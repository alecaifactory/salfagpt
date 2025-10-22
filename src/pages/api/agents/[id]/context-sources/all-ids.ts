import type { APIRoute } from 'astro';
import { getSession } from '../../../../../lib/auth';
import { firestore, COLLECTIONS } from '../../../../../lib/firestore';

/**
 * GET /api/agents/:id/context-sources/all-ids
 * Get ALL source IDs assigned to a specific agent (for bulk operations)
 * 
 * Returns only IDs, not full documents - very fast
 * Used for auto-enabling all sources
 */
export const GET: APIRoute = async (context) => {
  try {
    // 1. Verify authentication
    const session = getSession(context);
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { params } = context;
    const agentId = params.id;
    
    if (!agentId) {
      return new Response(
        JSON.stringify({ error: 'Agent ID required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📋 Fetching ALL source IDs for agent: ${agentId}`);

    // 2. Query for all source IDs (efficient - only IDs)
    const snapshot = await firestore
      .collection(COLLECTIONS.CONTEXT_SOURCES)
      .where('assignedToAgents', 'array-contains', agentId)
      .select('__name__') // Only fetch document IDs
      .get();

    const sourceIds = snapshot.docs.map(doc => doc.id);

    console.log(`✅ Found ${sourceIds.length} source IDs for agent ${agentId}`);

    return new Response(
      JSON.stringify({
        sourceIds,
        count: sourceIds.length,
        agentId,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Error fetching agent source IDs:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch source IDs',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

