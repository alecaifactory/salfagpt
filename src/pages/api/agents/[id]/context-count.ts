import type { APIRoute } from 'astro';
import { getSession } from '../../../../lib/auth';
import { firestore, COLLECTIONS, getEffectiveOwnerForContext } from '../../../../lib/firestore';

/**
 * GET /api/agents/:id/context-count
 * Get ONLY the count of context sources for an agent - NO documents loaded
 * 
 * PERFORMANCE: Ultra-fast metadata query
 * - Returns count only
 * - No document data loaded
 * - Minimal Firestore read
 */
export const GET: APIRoute = async (context) => {
  const startTime = Date.now();
  
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

    console.log(`📊 Counting context sources for agent ${agentId}`);
    
    // 🔑 Get effective owner (handles shared agents)
    const effectiveUserId = await getEffectiveOwnerForContext(agentId, session.id);
    console.log(`   🔑 Effective owner: ${effectiveUserId}`);

    // 🔑 CRITICAL FIX: Get user's Google OAuth ID for legacy context sources
    // Context sources were created with numeric Google ID, but users now use hash format
    const { getUserById } = await import('../../../../lib/firestore.js');
    const ownerUser = await getUserById(effectiveUserId);
    const googleUserId = ownerUser?.googleUserId || effectiveUserId;
    
    if (googleUserId !== effectiveUserId) {
      console.log(`   🔑 Using Google ID for legacy sources: ${effectiveUserId} → ${googleUserId}`);
    }

    // 2. Count documents (minimal query) - use Google ID for backward compatibility
    const countSnapshot = await firestore
      .collection(COLLECTIONS.CONTEXT_SOURCES)
      .where('userId', '==', googleUserId) // ✅ Use Google ID for legacy compatibility
      .where('assignedToAgents', 'array-contains', agentId)
      .select('name') // Minimal field selection
      .get();

    const total = countSnapshot.size;
    const elapsed = Date.now() - startTime;

    console.log(`✅ Agent ${agentId}: ${total} documents in ${elapsed}ms (using googleUserId: ${googleUserId})`);

    return new Response(
      JSON.stringify({
        total,
        agentId,
        responseTime: elapsed,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Error counting agent context sources:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to count agent context sources',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};










