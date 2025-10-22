import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { firestore, COLLECTIONS } from '../../../lib/firestore';

/**
 * GET /api/context-sources/by-folder?folder=M001
 * Get documents for a specific folder/TAG (metadata only)
 * 
 * PERFORMANCE: Loads only documents with the specified tag
 * Used for progressive loading when folder is expanded
 * 
 * Security: Only accessible by alec@getaifactory.com
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

    // 2. SECURITY: Only superadmin can access
    if (session.email !== 'alec@getaifactory.com') {
      return new Response(
        JSON.stringify({ error: 'Forbidden - Superadmin access only' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(context.request.url);
    const folderName = url.searchParams.get('folder');

    if (!folderName) {
      return new Response(
        JSON.stringify({ error: 'folder parameter is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('📁 Fetching documents for folder:', folderName);

    // 3. Query sources for this folder
    let sourcesSnapshot;
    
    if (folderName === 'General') {
      // Special case: documents with no labels or empty labels array
      sourcesSnapshot = await firestore
        .collection(COLLECTIONS.CONTEXT_SOURCES)
        .where('labels', '==', []) // Empty array
        .orderBy('addedAt', 'desc')
        .get();
      
      // Also get documents without labels field at all
      const noLabelsSnapshot = await firestore
        .collection(COLLECTIONS.CONTEXT_SOURCES)
        .orderBy('addedAt', 'desc')
        .get();
      
      // Filter client-side for docs without labels field
      const docsWithoutLabels = noLabelsSnapshot.docs.filter(doc => {
        const data = doc.data();
        return !data.labels || data.labels.length === 0;
      });
      
      sourcesSnapshot = {
        docs: docsWithoutLabels,
        size: docsWithoutLabels.length,
      };
    } else {
      // Normal case: documents with this specific tag
      sourcesSnapshot = await firestore
        .collection(COLLECTIONS.CONTEXT_SOURCES)
        .where('labels', 'array-contains', folderName)
        .orderBy('addedAt', 'desc')
        .get();
    }

    // 4. Build minimal source objects
    const sources = sourcesSnapshot.docs.map(doc => {
      const data = doc.data();
      
      return {
        id: doc.id,
        name: data.name,
        type: data.type,
        status: data.status || 'active',
        addedAt: data.addedAt?.toDate?.() || data.addedAt,
        labels: data.labels || [],
        
        // Minimal metadata
        metadata: {
          pageCount: data.metadata?.pageCount,
          tokensEstimate: data.metadata?.tokensEstimate,
          validated: data.metadata?.validated,
        },
        
        // Assignment count (not full objects)
        assignedToAgents: data.assignedToAgents || [],
        assignedAgentsCount: (data.assignedToAgents || []).length,
        
        ragEnabled: data.ragEnabled,
      };
    });

    const elapsed = Date.now() - startTime;
    console.log(`✅ Loaded ${sources.length} documents for folder "${folderName}" in ${elapsed}ms`);

    return new Response(
      JSON.stringify({
        folder: folderName,
        sources,
        count: sources.length,
        responseTime: elapsed,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Error fetching folder documents:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch folder documents',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

