import type { APIRoute } from 'astro';
import { getSession } from '../../../../lib/auth';
import { firestore, COLLECTIONS } from '../../../../lib/firestore';

/**
 * GET /api/conversations/:id/context-sources-metadata
 * Get context sources metadata for a specific agent (conversation)
 * 
 * PERFORMANCE: Lightweight endpoint - returns only:
 * - Source metadata (no extractedData)
 * - Assignment info (which agents have access)
 * - Toggle state (enabled/disabled for this agent)
 * 
 * Does NOT:
 * - Load extractedData (huge text content)
 * - Verify RAG chunks (multiple API calls)
 * - Load full source details
 * 
 * Use this for:
 * - Refreshing left panel after context management
 * - Quick updates after assignment changes
 * - Lightweight UI refreshes
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

    // 3. Get all user's context sources (metadata only)
    const sourcesSnapshot = await firestore
      .collection(COLLECTIONS.CONTEXT_SOURCES)
      .where('userId', '==', session.id)
      .orderBy('addedAt', 'desc')
      .get();

    const allSources = sourcesSnapshot.docs.map(doc => {
      const data = doc.data();
      
      // Return minimal metadata - NO extractedData
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

    // 4. Filter by assignment (PUBLIC or assigned to this agent)
    const filteredSources = allSources.filter((source: any) => {
      const hasPublicTag = source.labels?.includes('PUBLIC') || source.labels?.includes('public');
      const isAssignedToThisAgent = source.assignedToAgents?.includes(conversationId);
      
      return hasPublicTag || isAssignedToThisAgent;
    });

    // 5. Get toggle state (activeContextSourceIds)
    const contextDoc = await firestore
      .collection(COLLECTIONS.CONVERSATION_CONTEXT)
      .doc(conversationId)
      .get();

    const activeIds = contextDoc.exists 
      ? (contextDoc.data()?.activeContextSourceIds || [])
      : [];

    // 6. Add enabled flag based on active IDs
    const sourcesWithToggleState = filteredSources.map((source: any) => ({
      ...source,
      enabled: activeIds.includes(source.id),
    }));

    console.log(`⚡ Lightweight metadata loaded for agent ${conversationId}:`, sourcesWithToggleState.length, 'sources');

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

