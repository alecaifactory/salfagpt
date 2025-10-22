import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { firestore, COLLECTIONS } from '../../../lib/firestore';

/**
 * GET /api/context-sources/search?q=DDU-398&limit=10
 * Search context sources by name (MINIMAL metadata for fast results)
 * 
 * PERFORMANCE:
 * - Returns only: id, name, type, labels
 * - No extractedData, no chunks, no full metadata
 * - Fast partial match on name field
 * 
 * For full details, use /api/context-sources/[id]
 * 
 * Security: Superadmin only
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

    // 2. SECURITY: Only superadmin
    if (session.email !== 'alec@getaifactory.com') {
      return new Response(
        JSON.stringify({ error: 'Forbidden - Superadmin access only' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(context.request.url);
    const searchQuery = url.searchParams.get('q') || '';
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const agentId = url.searchParams.get('agentId'); // Optional: filter by agent

    if (!searchQuery || searchQuery.length < 2) {
      return new Response(
        JSON.stringify({ 
          results: [],
          message: 'Query must be at least 2 characters'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔍 Searching for:', searchQuery, agentId ? `(agent: ${agentId})` : '');

    // 3. Query ALL sources (we need to filter by name client-side)
    // Firestore doesn't have LIKE/contains for strings, so we load and filter
    let query: any = firestore
      .collection(COLLECTIONS.CONTEXT_SOURCES)
      .orderBy('name', 'asc')
      .limit(500); // Reasonable limit for search

    // Optional: filter by agent
    if (agentId) {
      query = firestore
        .collection(COLLECTIONS.CONTEXT_SOURCES)
        .where('assignedToAgents', 'array-contains', agentId)
        .orderBy('name', 'asc')
        .limit(500);
    }

    const snapshot = await query.get();

    // 4. Filter by search query (case-insensitive partial match)
    const searchLower = searchQuery.toLowerCase();
    const matchingDocs = snapshot.docs
      .filter((doc: any) => {
        const name = doc.data().name || '';
        return name.toLowerCase().includes(searchLower);
      })
      .slice(0, limit); // Limit results

    // 5. Build MINIMAL results
    const results = matchingDocs.map((doc: any) => {
      const data = doc.data();
      
      return {
        id: doc.id,
        name: data.name,
        type: data.type,
        labels: data.labels || [],
        ragEnabled: data.ragEnabled || false,
        assignedToAgents: data.assignedToAgents || [],
        
        // Ultra-minimal metadata
        metadata: {
          pageCount: data.metadata?.pageCount,
        },
        
        // ❌ EXCLUDED:
        // - extractedData
        // - chunks
        // - full metadata
        // - embeddings
      };
    });

    const elapsed = Date.now() - startTime;
    console.log(`✅ Search "${searchQuery}": ${results.length} results in ${elapsed}ms`);

    return new Response(
      JSON.stringify({
        results,
        query: searchQuery,
        total: results.length,
        responseTime: elapsed,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Error in search:', error);
    return new Response(
      JSON.stringify({
        error: 'Search failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

