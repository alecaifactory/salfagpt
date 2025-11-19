import type { APIRoute } from 'astro';
import { getSession } from '../../../../lib/auth';
import { firestore, COLLECTIONS, getEffectiveOwnerForContext } from '../../../../lib/firestore';

/**
 * GET /api/conversations/:id/context-sources-metadata
 * Get context sources metadata for a specific agent (conversation)
 * 
 * PERFORMANCE OPTIMIZED:
 * - Loads sources in batches (100 at a time)
 * - Stops early when enough assigned sources found
 * - Returns only metadata (no extractedData)
 * - Uses pagination to avoid loading all 628 sources
 */
export const GET: APIRoute = async ({ params, request, cookies }) => {
  try {
    // 1. Verify authentication
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Please login' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { id: conversationId } = params;

    if (!conversationId) {
      return new Response(
        JSON.stringify({ error: 'conversationId is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Verify conversation ownership
    const conversationDoc = await firestore
      .collection(COLLECTIONS.CONVERSATIONS)
      .doc(conversationId)
      .get();

    if (!conversationDoc.exists) {
      return new Response(
        JSON.stringify({ error: 'Conversation not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const conversation = conversationDoc.data();
    if (conversation?.userId !== session.id) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - Cannot access other user data' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. Determine effective agentId (for chat, use parent agent)
    const effectiveAgentId = conversation?.agentId || conversationId;
    const isChat = !!conversation?.agentId;
    
    if (isChat) {
      console.log(`🔗 Chat detected - using parent agent ${effectiveAgentId} for context`);
    }

    // 🔑 CRITICAL: Get effective owner (handles shared agents - uses OWNER's documents, not current user's)
    const effectiveUserId = await getEffectiveOwnerForContext(effectiveAgentId, session.id);
    console.log(`  🔑 Effective owner: ${effectiveUserId} (session user: ${session.id})`);
    
    // 4. OPTIMIZED: Load sources in batches, stop early when we have enough
    const startTime = Date.now();
    const BATCH_SIZE = 100; // Load 100 at a time
    const TARGET_ASSIGNED = 150; // Stop after finding this many assigned sources
    
    let allLoadedSources: any[] = [];
    let assignedSources: any[] = [];
    let lastDoc: any = null;
    let batchNumber = 0;
    
    // Load sources in batches until we have enough assigned sources OR reach end
    while (assignedSources.length < TARGET_ASSIGNED) {
      batchNumber++;
      
      let query = firestore
        .collection(COLLECTIONS.CONTEXT_SOURCES)
        .where('userId', '==', effectiveUserId)  // ✅ Use OWNER's userId for shared agents
        .orderBy('addedAt', 'desc')
        .limit(BATCH_SIZE);
      
      if (lastDoc) {
        query = query.startAfter(lastDoc);
      }
      
      const batchSnapshot = await query.get();
      
      if (batchSnapshot.empty) {
        console.log(`📭 No more sources - stopping at batch ${batchNumber}`);
        break;
      }
      
      lastDoc = batchSnapshot.docs[batchSnapshot.docs.length - 1];
      
      const batchSources = batchSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          type: data.type,
          enabled: data.enabled || false,
          status: data.status || 'active',
          addedAt: data.addedAt?.toDate?.() || new Date(data.addedAt),
          assignedToAgents: data.assignedToAgents || [],
          labels: data.labels || [],
          tags: data.tags || [],
          metadata: {
            pageCount: data.metadata?.pageCount,
            tokensEstimate: data.metadata?.tokensEstimate,
            model: data.metadata?.model,
            validated: data.metadata?.validated,
            validatedBy: data.metadata?.validatedBy,
            validatedAt: data.metadata?.validatedAt?.toDate?.(),
          },
          ragEnabled: data.ragEnabled || false,
          ragMetadata: data.ragMetadata ? {
            chunkCount: data.ragMetadata.chunkCount,
            avgChunkSize: data.ragMetadata.avgChunkSize,
            indexedAt: data.ragMetadata.indexedAt?.toDate?.(),
          } : undefined,
        };
      });
      
      allLoadedSources = [...allLoadedSources, ...batchSources];
      
      // Filter this batch for assigned sources
      // Note: We'll check agent_sources collection separately below
      const batchAssigned = batchSources.filter((source: any) => {
        const hasPublicTag = source.labels?.includes('PUBLIC') || source.labels?.includes('public');
        const isAssignedToAgent = source.assignedToAgents?.includes(effectiveAgentId);
        return hasPublicTag || isAssignedToAgent;
      });
      
      assignedSources = [...assignedSources, ...batchAssigned];
      
      console.log(`📦 Batch ${batchNumber}: loaded ${batchSnapshot.size}, found ${batchAssigned.length} assigned (total assigned: ${assignedSources.length})`);
      
      // Stop if we have enough assigned sources
      if (assignedSources.length >= TARGET_ASSIGNED) {
        console.log(`✅ Found enough assigned sources (${assignedSources.length}) - stopping early`);
        break;
      }
    }

    const queryTime = Date.now() - startTime;
    console.log(`📊 Query complete: ${assignedSources.length} assigned sources from ${allLoadedSources.length} total (${queryTime}ms, ${batchNumber} batches)`);

    // 4.5. ALSO check agent_sources collection for assignments
    const agentSourcesStartTime = Date.now();
    const agentSourcesSnapshot = await firestore
      .collection('agent_sources')
      .where('agentId', '==', effectiveAgentId)
      .where('userId', '==', effectiveUserId)  // ✅ Use OWNER's userId for shared agents
      .get();
    
    const assignedSourceIdsFromAgentSources = new Set(
      agentSourcesSnapshot.docs.map(doc => doc.data().sourceId)
    );
    
    console.log(`📊 agent_sources: ${assignedSourceIdsFromAgentSources.size} assignments (${Date.now() - agentSourcesStartTime}ms)`);
    
    // Add sources from agent_sources that aren't already in assignedSources
    const additionalAssignedSources = allLoadedSources.filter((source: any) => 
      assignedSourceIdsFromAgentSources.has(source.id) && 
      !assignedSources.some((s: any) => s.id === source.id)
    );
    
    if (additionalAssignedSources.length > 0) {
      assignedSources = [...assignedSources, ...additionalAssignedSources];
      console.log(`📦 Added ${additionalAssignedSources.length} sources from agent_sources collection`);
    }

    // 5. Get toggle state (activeContextSourceIds)
    const toggleStartTime = Date.now();
    const contextDoc = await firestore
      .collection(COLLECTIONS.CONVERSATION_CONTEXT)
      .doc(conversationId)
      .get();

    const activeIds = contextDoc.exists 
      ? (contextDoc.data()?.activeContextSourceIds || [])
      : [];
    console.log(`📥 Toggle state loaded: ${activeIds.length} active (${Date.now() - toggleStartTime}ms)`);

    // 6. Add enabled flag based on active IDs
    const sourcesWithToggleState = assignedSources.map((source: any) => ({
      ...source,
      enabled: activeIds.includes(source.id),
    }));

    const totalTime = Date.now() - startTime;
    console.log(`⚡ Complete: ${sourcesWithToggleState.length} sources in ${totalTime}ms`);

    return new Response(
      JSON.stringify({ 
        sources: sourcesWithToggleState,
        activeContextSourceIds: activeIds,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in context-sources-metadata API:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to fetch context sources metadata' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
