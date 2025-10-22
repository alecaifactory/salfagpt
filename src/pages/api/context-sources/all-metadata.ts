import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { firestore, COLLECTIONS } from '../../../lib/firestore';

/**
 * GET /api/context-sources/all-metadata
 * Get ALL context sources metadata from the system (superadmin only)
 * 
 * PERFORMANCE OPTIMIZATIONS:
 * - Does NOT include extractedData for fast loading
 * - Caches conversations and users maps (1 minute TTL)
 * - Returns actual total count
 * - Minimal data for list view (assignedAgents loaded on-demand)
 * 
 * For full data including extractedData, use /api/context-sources/[id]
 * 
 * Security: Only accessible by alec@getaifactory.com
 */

// ⚡ CACHE: Prevent re-loading conversations/users on every request
let conversationsCache: Map<string, any> | null = null;
let usersCache: Map<string, string> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60000; // 1 minute

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
      console.warn('🚨 Unauthorized access attempt to /api/context-sources/all-metadata:', session.email);
      return new Response(
        JSON.stringify({ error: 'Forbidden - Superadmin access only' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('📊 Fetching all context sources metadata for superadmin:', session.email);

    const now = Date.now();
    const cacheAge = now - cacheTimestamp;
    const usingCache = conversationsCache && usersCache && cacheAge < CACHE_TTL;

    // 3. Get TOTAL count (efficient - just count, no data)
    const totalCountSnapshot = await firestore
      .collection(COLLECTIONS.CONTEXT_SOURCES)
      .count()
      .get();
    
    const totalCount = totalCountSnapshot.data().count;
    console.log('📊 Total context sources in system:', totalCount);

    // 4. Fetch ALL context sources (no limit - we need all for filtering)
    // This is acceptable because we're NOT loading extractedData
    const sourcesSnapshot = await firestore
      .collection(COLLECTIONS.CONTEXT_SOURCES)
      .orderBy('addedAt', 'desc')
      .get();

    console.log('📥 Loaded', sourcesSnapshot.size, 'source documents');

    // 5. Load or use cached conversations map
    let conversationsMap: Map<string, any>;
    
    if (usingCache) {
      console.log('⚡ Using cached conversations & users (age:', Math.round(cacheAge / 1000), 's)');
      conversationsMap = conversationsCache!;
    } else {
      console.log('📥 Loading conversations & users (cache miss)');
      const conversationsSnapshot = await firestore
        .collection(COLLECTIONS.CONVERSATIONS)
        .get();

      conversationsMap = new Map();
      conversationsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        conversationsMap.set(doc.id, {
          id: doc.id,
          title: data.title,
          userId: data.userId,
        });
      });
      
      // Update cache
      conversationsCache = conversationsMap;
      console.log('💾 Cached', conversationsMap.size, 'conversations');
    }

    // 6. Load or use cached users map
    let usersMap: Map<string, string>;
    
    if (usingCache) {
      usersMap = usersCache!;
    } else {
      const usersSnapshot = await firestore
        .collection(COLLECTIONS.USERS)
        .get();

      usersMap = new Map<string, string>();
      usersSnapshot.docs.forEach(doc => {
        const data = doc.data();
        usersMap.set(doc.id, data.email || doc.id);
        if (data.userId) {
          usersMap.set(data.userId, data.email || doc.id);
        }
      });

      if (session.id && session.email) {
        usersMap.set(session.id, session.email);
      }
      
      // Update cache
      usersCache = usersMap;
      cacheTimestamp = now;
      console.log('💾 Cached', usersMap.size, 'users');
    }

    // 7. Build minimal sources for list view (assignedAgents computed on-demand)
    const enrichedSources = sourcesSnapshot.docs.map(doc => {
      const data = doc.data();
      const sourceId = doc.id;
      
      const uploaderEmail = usersMap.get(data.userId) || data.userId;
      const assignedToAgents = data.assignedToAgents || [];
      
      // ⚡ PERFORMANCE: Only compute assignedAgents count, not full objects
      // Full agent details loaded on-demand when source is selected
      const assignedAgentsCount = assignedToAgents.filter((agentId: string) => 
        conversationsMap.has(agentId)
      ).length;

      return {
        id: sourceId,
        // Core fields (minimal for list view)
        userId: data.userId,
        name: data.name,
        type: data.type,
        enabled: data.enabled || false,
        status: data.status || 'active',
        addedAt: data.addedAt?.toDate?.() || data.addedAt,
        
        // Assignments (minimal - just IDs and count)
        assignedToAgents,
        assignedAgentsCount, // ⚡ NEW: Just count for list view
        uploaderEmail,
        
        // Metadata (minimal - only what's needed for list view)
        metadata: data.metadata ? {
          pageCount: data.metadata.pageCount,
          tokensEstimate: data.metadata.tokensEstimate,
          validated: data.metadata.validated,
          ragEnabled: data.ragEnabled, // Move up from nested
        } : undefined,
        
        // Labels (for filtering)
        labels: data.labels || [],
        tags: data.tags || [],
        
        // RAG status (minimal)
        ragEnabled: data.ragEnabled,
        
        // ❌ EXCLUDED for performance (load on-demand):
        // - extractedData
        // - assignedAgents (full objects)
        // - Full metadata details
        // - RAG chunks
        // - Quality notes
      };
    });

    const elapsed = Date.now() - startTime;
    console.log(`✅ Returned ${enrichedSources.length} of ${totalCount} sources in ${elapsed}ms ${usingCache ? '(cached)' : '(fresh)'}`);

    return new Response(
      JSON.stringify({
        sources: enrichedSources,
        total: totalCount, // ✅ Real total count
        cached: usingCache,
        responseTime: elapsed,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Error fetching context sources metadata:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch context sources metadata',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

