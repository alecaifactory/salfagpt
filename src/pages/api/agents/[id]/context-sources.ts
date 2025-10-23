import type { APIRoute } from 'astro';
import { getSession } from '../../../../lib/auth';
import { firestore, COLLECTIONS, getEffectiveOwnerForContext } from '../../../../lib/firestore';

/**
 * GET /api/agents/:id/context-sources?page=0&limit=10
 * Get context sources assigned to a specific agent (PAGINATED & MINIMAL)
 * 
 * PERFORMANCE:
 * - Pagination (10 docs at a time)
 * - Minimal metadata (no extractedData, no chunks)
 * - Fast query using assignedToAgents index
 * 
 * SHARED AGENTS:
 * - Uses owner's context sources (not current user's)
 * - Maintains privacy (each user's conversations are separate)
 * 
 * For full source details, use /api/context-sources/[sourceId]
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

    const url = new URL(context.request.url);
    const page = parseInt(url.searchParams.get('page') || '0');
    const limit = parseInt(url.searchParams.get('limit') || '10');

    console.log(`📄 Loading context sources for agent ${agentId}: page ${page}, limit ${limit}`);
    console.log(`   Current user: ${session.id}`);
    
    // 🔑 CRITICAL: Get effective owner (original owner if shared, else current user)
    const effectiveUserId = await getEffectiveOwnerForContext(agentId, session.id);
    console.log(`   🔑 Effective owner for context: ${effectiveUserId}${effectiveUserId !== session.id ? ' (shared agent)' : ' (own agent)'}`);
    console.log('   Query: assignedToAgents array-contains', agentId);

    // 2. Query sources assigned to this agent (using owner's sources)
    let query: any = firestore
      .collection(COLLECTIONS.CONTEXT_SOURCES)
      .where('userId', '==', effectiveUserId) // ✅ Use effective owner
      .where('assignedToAgents', 'array-contains', agentId)
      .orderBy('addedAt', 'desc');

    // 3. Apply pagination
    if (page > 0) {
      const offset = page * limit;
      const offsetSnapshot = await query.limit(offset).get();
      if (!offsetSnapshot.empty) {
        const lastDoc = offsetSnapshot.docs[offsetSnapshot.docs.length - 1];
        query = query.startAfter(lastDoc);
      }
    }
    
    query = query.limit(limit);

    // 4. Execute query
    const snapshot = await query.get();
    
    // 4.5. Get accurate total count (only on first page)
    let totalCount: number | undefined = undefined;
    if (page === 0) {
      try {
        console.log('📊 Counting total sources for agent...');
        const countSnapshot = await firestore
          .collection(COLLECTIONS.CONTEXT_SOURCES)
          .where('userId', '==', effectiveUserId) // ✅ Use effective owner
          .where('assignedToAgents', 'array-contains', agentId)
          .select('name', 'assignedToAgents') // Fetch minimal fields for verification
          .get();
        totalCount = countSnapshot.size;
        console.log(`📊 Total sources for agent ${agentId}: ${totalCount}`);
        
        // Sample to verify data structure
        if (countSnapshot.size > 0) {
          const sampleDoc = countSnapshot.docs[0];
          const sampleData = sampleDoc.data();
          console.log('   ✅ Sample source:', sampleData.name);
          console.log('   - assignedToAgents:', sampleData.assignedToAgents);
          console.log('   - agentId in array:', sampleData.assignedToAgents?.includes(agentId));
        } else {
          console.warn('   ⚠️ Count query returned 0 documents');
          console.warn('   This could mean:');
          console.warn('   1. No sources are assigned to this agent yet');
          console.warn('   2. The bulk assignment did not save correctly');
          console.warn('   3. There is an index missing for assignedToAgents');
        }
      } catch (countError) {
        console.error('❌ Error counting sources:', countError);
        console.error('   This might be a missing Firestore index');
        totalCount = undefined; // Will use approximate count from query results
      }
    }

    // 5. Build MINIMAL source objects
    const sources = snapshot.docs.map((doc: any) => {
      const data = doc.data();
      
      return {
        id: doc.id,
        name: data.name,
        type: data.type,
        status: data.status || 'active',
        labels: data.labels || [],
        ragEnabled: data.ragEnabled || false,
        
        // Minimal metadata
        metadata: {
          pageCount: data.metadata?.pageCount,
          tokensEstimate: data.metadata?.tokensEstimate,
          charactersExtracted: data.metadata?.charactersExtracted,
          validated: data.metadata?.validated,
        },
        
        // RAG metadata (no embeddings)
        ragMetadata: data.ragMetadata ? {
          chunkCount: data.ragMetadata.chunkCount,
        } : undefined,
        
        // ❌ EXCLUDED (load on-demand):
        // - extractedData
        // - chunks
        // - embeddings
      };
    });

    const hasMore = snapshot.docs.length === limit;
    const elapsed = Date.now() - startTime;

    console.log(`✅ Agent ${agentId}: Returned ${sources.length} sources (page ${page}) in ${elapsed}ms`);

    return new Response(
      JSON.stringify({
        sources,
        page,
        limit,
        hasMore,
        total: totalCount, // ✅ Accurate total count (from count query on page 0)
        responseTime: elapsed,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Error fetching agent context sources:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch agent context sources',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

