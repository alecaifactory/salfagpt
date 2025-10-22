import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { firestore, COLLECTIONS } from '../../../lib/firestore';

/**
 * GET /api/context-sources/folder-structure
 * Get folder structure with counts (super fast - no documents loaded)
 * 
 * PERFORMANCE: Returns only TAG names and document counts per folder
 * This allows UI to render folders immediately while documents load progressively
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

    console.log('📊 Fetching folder structure for superadmin:', session.email);

    // 3. Get total count (fast - just count)
    const totalCountSnapshot = await firestore
      .collection(COLLECTIONS.CONTEXT_SOURCES)
      .count()
      .get();
    
    const totalCount = totalCountSnapshot.data().count;

    // 4. Fetch only minimal data: id and labels (SUPER FAST)
    const sourcesSnapshot = await firestore
      .collection(COLLECTIONS.CONTEXT_SOURCES)
      .select('labels') // ⚡ Only fetch labels field
      .get();

    // 5. Build folder structure with counts
    const folderCounts = new Map<string, number>();
    
    sourcesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const labels = data.labels || [];
      
      if (labels.length === 0) {
        // No tags → General folder
        folderCounts.set('General', (folderCounts.get('General') || 0) + 1);
      } else {
        // Add to each tag's folder
        labels.forEach((tag: string) => {
          folderCounts.set(tag, (folderCounts.get(tag) || 0) + 1);
        });
      }
    });

    // 6. Sort folders: General first, then alphabetically
    const sortedFolders = Array.from(folderCounts.entries()).sort(([a], [b]) => {
      if (a === 'General') return -1;
      if (b === 'General') return 1;
      return a.localeCompare(b);
    });

    const folders = sortedFolders.map(([name, count]) => ({
      name,
      count,
    }));

    const elapsed = Date.now() - startTime;
    console.log(`✅ Returned folder structure (${folders.length} folders, ${totalCount} total docs) in ${elapsed}ms`);

    return new Response(
      JSON.stringify({
        folders,
        totalCount,
        responseTime: elapsed,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Error fetching folder structure:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch folder structure',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

