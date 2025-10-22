import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { firestore, COLLECTIONS } from '../../../lib/firestore';

/**
 * GET /api/context-sources/paginated?page=0&limit=10&tag=M001
 * Get context sources with pagination (MINIMAL metadata only)
 * 
 * PERFORMANCE STRATEGY:
 * - Returns only 10 documents per request
 * - Only ID, name, type, labels (no extractedData, no full metadata)
 * - Filters by tag if provided (indexed query)
 * - Returns IDs of all matching documents for indexing
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
    const page = parseInt(url.searchParams.get('page') || '0');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const tag = url.searchParams.get('tag'); // Optional filter
    const indexOnly = url.searchParams.get('indexOnly') === 'true'; // Only return IDs for indexing

    console.log('📄 Paginated request: page', page, 'limit', limit, tag ? `tag=${tag}` : 'all', indexOnly ? '(index only)' : '');

    // 3. Build query
    let query: any = firestore.collection(COLLECTIONS.CONTEXT_SOURCES);
    
    // Apply tag filter if provided
    // ⚠️ TEMPORARY: Load all and filter client-side while indexes build
    // TODO: After indexes are READY, use optimized queries
    query = query.orderBy('addedAt', 'desc');

    // 4. If indexOnly, just get IDs (SUPER FAST)
    if (indexOnly) {
      const snapshot = await query.select('labels').get();
      
      let matchingIds: string[] = [];
      
      if (tag === 'General') {
        // Filter for docs without labels
        matchingIds = snapshot.docs
          .filter((doc: any) => {
            const data = doc.data();
            return !data.labels || data.labels.length === 0;
          })
          .map((doc: any) => doc.id);
      } else if (tag) {
        matchingIds = snapshot.docs.map((doc: any) => doc.id);
      } else {
        matchingIds = snapshot.docs.map((doc: any) => doc.id);
      }
      
      const elapsed = Date.now() - startTime;
      console.log(`⚡ Indexed ${matchingIds.length} documents in ${elapsed}ms`);
      
      return new Response(
        JSON.stringify({
          documentIds: matchingIds,
          total: matchingIds.length,
          responseTime: elapsed,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 5. Apply pagination
    if (page > 0) {
      const offset = page * limit;
      const offsetSnapshot = await query.limit(offset).get();
      if (!offsetSnapshot.empty) {
        const lastDoc = offsetSnapshot.docs[offsetSnapshot.docs.length - 1];
        query = query.startAfter(lastDoc);
      }
    }
    
    query = query.limit(limit);

    // 6. Execute query
    const snapshot = await query.get();
    
    // 7. Filter by tag CLIENT-SIDE (temporary while indexes build)
    let docs = snapshot.docs;
    if (tag) {
      if (tag === 'General') {
        docs = docs.filter((doc: any) => {
          const data = doc.data();
          return !data.labels || data.labels.length === 0;
        });
      } else {
        docs = docs.filter((doc: any) => {
          const data = doc.data();
          return data.labels && data.labels.includes(tag);
        });
      }
    }

    // 8. Build MINIMAL source objects (just references)
    const sources = docs.map((doc: any) => {
      const data = doc.data();
      
      return {
        id: doc.id,
        name: data.name,
        type: data.type,
        labels: data.labels || [],
        status: data.status || 'active',
        
        // ❌ EXCLUDED (load on-demand when user clicks):
        // - metadata (pageCount, tokens, etc.)
        // - assignedToAgents
        // - extractedData
        // - ragEnabled
        // - uploaderEmail
      };
    });

    const hasMore = snapshot.docs.length === limit;
    const elapsed = Date.now() - startTime;
    
    console.log(`✅ Page ${page}: Returned ${sources.length} sources in ${elapsed}ms`);

    return new Response(
      JSON.stringify({
        sources,
        page,
        limit,
        hasMore,
        responseTime: elapsed,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Error in paginated query:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch paginated sources',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

