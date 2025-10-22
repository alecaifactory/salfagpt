import type { APIRoute } from 'astro';
import { firestore } from '../../../lib/firestore';
import { getSession } from '../../../lib/auth';

/**
 * GET /api/context-sources/ids-by-tags?tags=tag1,tag2
 * 
 * Returns ALL source IDs that match any of the specified tags.
 * Used for "Select All" functionality when tag filters are active.
 * 
 * Query Parameters:
 * - tags: Comma-separated list of tags to filter by
 * 
 * Response:
 * {
 *   sourceIds: string[],
 *   count: number,
 *   tags: string[]
 * }
 */
export const GET: APIRoute = async (context) => {
  const { request, cookies } = context;
  
  try {
    // 1. Verify authentication
    const session = getSession(context);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. Parse query parameters
    const url = new URL(request.url);
    const tagsParam = url.searchParams.get('tags');
    
    if (!tagsParam) {
      return new Response(
        JSON.stringify({ error: 'Missing tags parameter' }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const tags = tagsParam.split(',').map(t => t.trim()).filter(Boolean);
    
    if (tags.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No valid tags provided' }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('🔍 Loading all source IDs for tags:', tags);
    console.log('👤 User:', session.id);

    // 3. Query Firestore for ALL sources matching tags
    // Note: Using array-contains-any which supports up to 10 values
    // If you need more than 10 tags, we'd need to batch the queries
    const sourcesSnapshot = await firestore
      .collection('context_sources')
      .where('userId', '==', session.id) // ✅ User isolation
      .where('labels', 'array-contains-any', tags.slice(0, 10)) // Max 10 tags
      .select('__name__') // Only select document ID (more efficient)
      .get();

    // 4. Extract all IDs
    const sourceIds = sourcesSnapshot.docs.map(doc => doc.id);

    console.log(`✅ Found ${sourceIds.length} sources matching tags:`, tags);

    // 5. Return results
    return new Response(
      JSON.stringify({
        sourceIds,
        count: sourceIds.length,
        tags,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Error loading source IDs by tags:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to load source IDs',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

