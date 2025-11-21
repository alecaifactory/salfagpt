import type { APIRoute } from 'astro';
import { firestore, COLLECTIONS } from '../../../../lib/firestore';
import { getSession } from '../../../../lib/auth';

/**
 * GET /api/context-sources/[id]/details
 * 
 * Load FULL details for a specific context source (on-demand)
 * 
 * This endpoint loads the complete source data including:
 * - extractedData (full text)
 * - RAG metadata (chunks, embeddings summary)
 * - Upload metadata (file size, extraction time, etc.)
 * - Assignment details (agents, validation status)
 * 
 * Only called when user clicks to view source details.
 */

const SUPERADMIN_EMAILS = [
  'alec@getaifactory.com',
  'aleclara@gmail.com'
];

export const GET: APIRoute = async ({ params, request, cookies }) => {
  const startTime = Date.now();
  
  try {
    const { id } = params;
    
    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Source ID required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 1. Authentication
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const userEmail = session.email?.toLowerCase() || '';
    const isSuperAdmin = SUPERADMIN_EMAILS.includes(userEmail);

    console.log(`📄 Loading full details for source: ${id}`);

    // 2. Load source document (full data)
    const sourceDoc = await firestore
      .collection(COLLECTIONS.CONTEXT_SOURCES)
      .doc(id)
      .get();

    if (!sourceDoc.exists) {
      return new Response(
        JSON.stringify({ error: 'Source not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const sourceData = sourceDoc.data();

    // 3. Authorization check
    const userDoc = await firestore.collection(COLLECTIONS.USERS).doc(session.id).get();
    const userData = userDoc.data();
    const userRole = userData?.role || 'user';
    const isAdmin = userRole === 'admin';

    // Check access:
    // - SuperAdmin: all sources
    // - Admin: sources in their org
    // - User: only their sources
    if (!isSuperAdmin) {
      if (isAdmin) {
        // Verify source belongs to admin's org
        const userOrgId = userData?.organizationId;
        if (sourceData?.organizationId !== userOrgId) {
          return new Response(
            JSON.stringify({ error: 'Forbidden - Source not in your organization' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
      } else {
        // Verify user owns this source
        if (sourceData?.userId !== session.id) {
          return new Response(
            JSON.stringify({ error: 'Forbidden - Not your source' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // 4. Format full source data
    const fullSource = {
      id: sourceDoc.id,
      name: sourceData?.name,
      type: sourceData?.type,
      status: sourceData?.status,
      labels: sourceData?.labels || [],
      userId: sourceData?.userId,
      organizationId: sourceData?.organizationId,
      domainId: sourceData?.domainId,
      addedAt: sourceData?.addedAt?.toDate?.() || new Date(sourceData?.addedAt),
      ragEnabled: sourceData?.ragEnabled || false,
      
      // ✅ FULL metadata (only loaded on-demand)
      metadata: {
        originalFileName: sourceData?.metadata?.originalFileName,
        originalFileSize: sourceData?.metadata?.originalFileSize,
        pageCount: sourceData?.metadata?.pageCount,
        model: sourceData?.metadata?.model,
        extractionDate: sourceData?.metadata?.extractionDate?.toDate?.(),
        extractionTime: sourceData?.metadata?.extractionTime,
        charactersExtracted: sourceData?.metadata?.charactersExtracted,
        tokensEstimate: sourceData?.metadata?.tokensEstimate,
        validated: sourceData?.metadata?.validated,
        validatedBy: sourceData?.metadata?.validatedBy,
        validatedAt: sourceData?.metadata?.validatedAt?.toDate?.(),
        uploaderEmail: sourceData?.metadata?.uploaderEmail,
      },
      
      // ✅ extractedData (full text - can be huge)
      extractedData: sourceData?.extractedData,
      
      // ✅ RAG metadata summary (not full chunks/embeddings)
      ragMetadata: sourceData?.ragMetadata ? {
        chunkCount: sourceData.ragMetadata.chunks?.length || 0,
        embeddingCount: sourceData.ragMetadata.embeddings?.length || 0,
        embeddingModel: sourceData.ragMetadata.embeddingModel,
        embeddingDate: sourceData.ragMetadata.embeddingDate?.toDate?.(),
        // Don't include actual chunks/embeddings (too large)
      } : null,
      
      // ✅ Assignment details
      assignedToAgents: sourceData?.assignedToAgents || [],
      
      // ✅ Error details (if any)
      error: sourceData?.error
    };

    // 5. Enrich with agent/org/domain names
    const enrichments: any = {};

    // Load assigned agent names
    if (fullSource.assignedToAgents && fullSource.assignedToAgents.length > 0) {
      const agentDocs = await Promise.all(
        fullSource.assignedToAgents.slice(0, 10).map((agentId: string) =>
          firestore.collection('conversations').doc(agentId).get()
        )
      );
      
      enrichments.assignedAgentNames = agentDocs
        .filter(doc => doc.exists)
        .map(doc => ({
          id: doc.id,
          title: doc.data()?.title || 'Unknown Agent'
        }));
    }

    // Load organization name
    if (fullSource.organizationId) {
      const orgDoc = await firestore
        .collection('organizations')
        .doc(fullSource.organizationId)
        .get();
      
      if (orgDoc.exists) {
        enrichments.organizationName = orgDoc.data()?.name;
      }
    }

    const duration = Date.now() - startTime;

    console.log(`✅ Loaded full details for ${id} in ${duration}ms`, {
      size: sourceData?.extractedData?.length || 0,
      chunks: fullSource.ragMetadata?.chunkCount || 0
    });

    return new Response(
      JSON.stringify({
        source: fullSource,
        enrichments,
        metadata: {
          durationMs: duration,
          dataSize: sourceData?.extractedData?.length || 0
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Error loading source details:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to load source details' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};


