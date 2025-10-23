import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { firestore, COLLECTIONS } from '../../../lib/firestore';

/**
 * POST /api/context-sources/bulk-assign-multiple
 * Assign MULTIPLE context sources to agents in a SINGLE batch operation
 * 
 * Body: {
 *   sourceIds: string[],      // Array of source IDs (e.g., 538 documents)
 *   agentIds: string[]        // Array of agent IDs to assign to
 * }
 * 
 * PERFORMANCE: Uses Firestore batch write (up to 500 docs per batch)
 * Much faster than individual requests
 * 
 * Security: Only superadmin can bulk assign
 */
export const POST: APIRoute = async (context) => {
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

    // 2. SECURITY: Only superadmin can bulk assign
    if (session.email !== 'alec@getaifactory.com') {
      console.warn('🚨 Unauthorized bulk assign attempt:', session.email);
      return new Response(
        JSON.stringify({ error: 'Forbidden - Superadmin access only' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. Parse request body
    const body = await context.request.json();
    const { sourceIds, agentIds } = body;

    if (!Array.isArray(sourceIds) || sourceIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'sourceIds must be a non-empty array' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!Array.isArray(agentIds) || agentIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'agentIds must be a non-empty array' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('🚀 BULK ASSIGN MULTIPLE:');
    console.log('   Sources:', sourceIds.length);
    console.log('   Source IDs (first 5):', sourceIds.slice(0, 5));
    console.log('   Agents:', agentIds.length);
    console.log('   Agent IDs:', agentIds);
    console.log('   Total assignments:', sourceIds.length * agentIds.length);

    // 4. Use Firestore batch for efficient bulk update
    // Firestore batch limit: 500 operations
    const BATCH_SIZE = 500;
    const batches: any[] = [];
    let currentBatch = firestore.batch();
    let operationCount = 0;

    for (const sourceId of sourceIds) {
      const sourceRef = firestore.collection(COLLECTIONS.CONTEXT_SOURCES).doc(sourceId);
      
      // Update assignedToAgents field
      currentBatch.update(sourceRef, {
        assignedToAgents: agentIds,
        updatedAt: new Date(),
      });
      
      operationCount++;
      
      // If batch is full, start a new one
      if (operationCount >= BATCH_SIZE) {
        batches.push(currentBatch);
        currentBatch = firestore.batch();
        operationCount = 0;
      }
    }
    
    // Add remaining operations
    if (operationCount > 0) {
      batches.push(currentBatch);
    }

    console.log('📦 Created', batches.length, 'batch(es) for', sourceIds.length, 'sources');

    // 5. Commit all batches in parallel
    const batchStartTime = Date.now();
    await Promise.all(batches.map(batch => batch.commit()));
    const batchElapsed = Date.now() - batchStartTime;

    const totalElapsed = Date.now() - startTime;

    console.log('✅ BULK ASSIGN COMPLETE:');
    console.log('   Sources updated:', sourceIds.length);
    console.log('   Agents assigned:', agentIds.length);
    console.log('   Batch operations:', batches.length);
    console.log('   Batch time:', batchElapsed, 'ms');
    console.log('   Total time:', totalElapsed, 'ms');
    console.log('   Avg per source:', Math.round(totalElapsed / sourceIds.length), 'ms');
    
    // Verify a sample document was actually updated
    if (sourceIds.length > 0) {
      const sampleId = sourceIds[0];
      const sampleDoc = await firestore.collection(COLLECTIONS.CONTEXT_SOURCES).doc(sampleId).get();
      const sampleData = sampleDoc.data();
      console.log('🔍 VERIFICATION - Sample document after update:');
      console.log('   ID:', sampleId);
      console.log('   Name:', sampleData?.name);
      console.log('   assignedToAgents:', sampleData?.assignedToAgents);
      console.log('   Expected agentIds:', agentIds);
      console.log('   Match:', JSON.stringify(sampleData?.assignedToAgents) === JSON.stringify(agentIds));
    }

    // 5.5. ✅ AUTO-ACTIVATE: When assigning to agents, activate by default
    console.log('⚡ Auto-activating sources for assigned agents...');
    let totalActivations = 0;
    
    for (const agentId of agentIds) {
      try {
        // Get current active sources for this agent
        const contextRef = firestore.collection(COLLECTIONS.CONVERSATION_CONTEXT).doc(agentId);
        const contextDoc = await contextRef.get();
        
        const currentActiveIds = contextDoc.exists
          ? (contextDoc.data()?.activeContextSourceIds || [])
          : [];
        
        // Add all newly assigned sources that aren't already active
        const newSourcesToActivate = sourceIds.filter((id: string) => !currentActiveIds.includes(id));
        
        if (newSourcesToActivate.length > 0) {
          const allActiveIds = [...currentActiveIds, ...newSourcesToActivate];
          
          await contextRef.set({
            conversationId: agentId,
            activeContextSourceIds: allActiveIds,
            lastUsedAt: new Date(),
            updatedAt: new Date(),
          }, { merge: true });
          
          totalActivations += newSourcesToActivate.length;
          console.log(`   ✅ Activated ${newSourcesToActivate.length} sources for agent ${agentId}`);
        } else {
          console.log(`   ℹ️ All ${sourceIds.length} sources already active for agent ${agentId}`);
        }
      } catch (error) {
        console.warn(`   ⚠️ Failed to activate sources for agent ${agentId}:`, error);
      }
    }
    
    console.log(`✅ Auto-activated ${totalActivations} total source assignments`);

    // 6. Return success
    return new Response(
      JSON.stringify({
        success: true,
        sourcesUpdated: sourceIds.length,
        agentsAssigned: agentIds.length,
        batches: batches.length,
        responseTime: totalElapsed,
        avgPerSource: Math.round(totalElapsed / sourceIds.length),
        activatedCount: totalActivations,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Error in bulk-assign-multiple:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to bulk assign',
        details: error instanceof Error ? error.stack : undefined,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

