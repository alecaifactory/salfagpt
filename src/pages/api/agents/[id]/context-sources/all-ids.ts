import type { APIRoute } from 'astro';
import { getSession } from '../../../../../lib/auth';
import { firestore, COLLECTIONS } from '../../../../../lib/firestore';

/**
 * GET /api/agents/:id/context-sources/all-ids
 * Get ALL context source IDs assigned to an agent (no pagination, IDs only)
 * 
 * Use this for:
 * - Bulk operations (enable all, disable all)
 * - Counting total sources
 * - Quick lookups
 * 
 * Does NOT return full source data - just IDs
 */
export const GET: APIRoute = async (context) => {
  try {
    // 1. Verify authentication
    const session = getSession(context);
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Please login' }),
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

    console.log(`📄 Loading ALL source IDs for agent ${agentId}`);

    // 2. Query all sources assigned to this agent (IDs only for performance)
    const snapshot = await firestore
      .collection(COLLECTIONS.CONTEXT_SOURCES)
      .where('assignedToAgents', 'array-contains', agentId)
      .select('__name__') // Only get document IDs, not full data
      .get();

    const sourceIds = snapshot.docs.map(doc => doc.id);

    console.log(`✅ Found ${sourceIds.length} sources assigned to agent ${agentId}`);

    return new Response(
      JSON.stringify({
        sourceIds,
        total: sourceIds.length
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Error loading source IDs:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
