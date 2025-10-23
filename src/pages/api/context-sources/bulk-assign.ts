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

    const { request } = context;

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
    console.log('📋 Source ID:', sourceId);
    console.log('📋 Agent IDs:', agentIds);

    // 4. Update the source document - ONLY this specific sourceId
    const sourceRef = firestore.collection(COLLECTIONS.CONTEXT_SOURCES).doc(sourceId);
    
    // Verify source exists
    const sourceDoc = await sourceRef.get();
    if (!sourceDoc.exists) {
      console.error('❌ Source not found:', sourceId);
      return new Response(
        JSON.stringify({ error: 'Context source not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const sourceData = sourceDoc.data();
    console.log('📄 Source to update:', sourceData?.name);
    console.log('   Document ID:', sourceId);
    console.log('   Current assignedToAgents:', sourceData?.assignedToAgents);
    console.log('   NEW assignedToAgents:', agentIds);

    // 🚨 CRITICAL: Update assignedToAgents field - ONLY for this specific document by ID
    const updateData = {
      assignedToAgents: agentIds,
      updatedAt: new Date(),
    };
    
    console.log('💾 Firestore update operation:');
    console.log('   Collection: context_sources');
    console.log('   Document ID:', sourceId);
    console.log('   Update data:', JSON.stringify(updateData, null, 2));
    
    await sourceRef.update(updateData);

    // Verify the update
    const updatedDoc = await sourceRef.get();
    const updatedData = updatedDoc.data();
    console.log('✅ Source', sourceId, '(', sourceData?.name, ') assigned to', agentIds.length, 'agents');
    console.log('   Updated document ID:', sourceId);
    console.log('   Verified assignedToAgents after update:', updatedData?.assignedToAgents);
    
    // 🔍 VERIFICATION: Query to confirm no other documents were affected
    const otherDocsQuery = await firestore
      .collection(COLLECTIONS.CONTEXT_SOURCES)
      .where('metadata.uploadedVia', '==', 'cli')
      .limit(5)
      .get();
    
    console.log('🔍 Sample of other CLI documents after update:');
    otherDocsQuery.docs.slice(0, 3).forEach(doc => {
      if (doc.id !== sourceId) {
        console.log(`   - ${doc.data().name}: assignedToAgents =`, doc.data().assignedToAgents);
      }
    });

    // 5. ✅ AUTO-ACTIVATE: When assigning to agents, activate by default
    console.log('⚡ Auto-activating source for assigned agents...');
    let activatedCount = 0;
    
    for (const agentId of agentIds) {
      try {
        // Get current active sources for this agent
        const contextRef = firestore.collection(COLLECTIONS.CONVERSATION_CONTEXT).doc(agentId);
        const contextDoc = await contextRef.get();
        
        const currentActiveIds = contextDoc.exists
          ? (contextDoc.data()?.activeContextSourceIds || [])
          : [];
        
        // Add this source if not already active
        if (!currentActiveIds.includes(sourceId)) {
          const newActiveIds = [...currentActiveIds, sourceId];
          
          await contextRef.set({
            conversationId: agentId,
            activeContextSourceIds: newActiveIds,
            lastUsedAt: new Date(),
            updatedAt: new Date(),
          }, { merge: true });
          
          activatedCount++;
          console.log(`   ✅ Activated for agent ${agentId}`);
        } else {
          console.log(`   ℹ️ Already active for agent ${agentId}`);
        }
      } catch (error) {
        console.warn(`   ⚠️ Failed to activate for agent ${agentId}:`, error);
      }
    }
    
    console.log(`✅ Auto-activated source for ${activatedCount} agents`);

    // 6. Return success
    return new Response(
      JSON.stringify({
        success: true,
        sourceId,
        assignedCount: agentIds.length,
        activatedCount,
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

