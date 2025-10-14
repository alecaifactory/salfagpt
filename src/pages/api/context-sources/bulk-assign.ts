import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { firestore, COLLECTIONS } from '../../../lib/firestore';

/**
 * POST /api/context-sources/bulk-assign
 * Assign a context source to multiple agents
 * 
 * Body: {
 *   sourceId: string,
 *   agentIds: string[]  // Array of conversation IDs
 * }
 * 
 * Security: Only superadmin can bulk assign
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // 1. Verify authentication
    const session = getSession({ cookies });
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Please login' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. SECURITY: Only superadmin can bulk assign
    if (session.email !== 'alec@getaifactory.com') {
      console.warn('🚨 Unauthorized bulk assign attempt:', session.email);
      return new Response(
        JSON.stringify({ error: 'Forbidden - Superadmin access only' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. Parse request body
    const body = await request.json();
    const { sourceId, agentIds } = body;

    if (!sourceId) {
      return new Response(
        JSON.stringify({ error: 'sourceId is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!Array.isArray(agentIds)) {
      return new Response(
        JSON.stringify({ error: 'agentIds must be an array' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔄 Bulk assigning source', sourceId, 'to', agentIds.length, 'agents');

    // 4. Update the source document
    const sourceRef = firestore.collection(COLLECTIONS.CONTEXT_SOURCES).doc(sourceId);
    
    // Verify source exists
    const sourceDoc = await sourceRef.get();
    if (!sourceDoc.exists) {
      return new Response(
        JSON.stringify({ error: 'Context source not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 5. Update assignedToAgents field
    await sourceRef.update({
      assignedToAgents: agentIds,
      updatedAt: new Date(),
    });

    console.log('✅ Source', sourceId, 'assigned to', agentIds.length, 'agents');

    // 6. Return success
    return new Response(
      JSON.stringify({
        success: true,
        sourceId,
        assignedCount: agentIds.length,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Error in bulk-assign:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to assign source',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

