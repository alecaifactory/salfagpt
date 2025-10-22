import type { APIRoute } from 'astro';
import { getContextSourcesMetadata } from '../../lib/firestore';
import { getSession } from '../../lib/auth';

/**
 * GET /api/context-sources-metadata
 * List user's context sources (metadata only, no extractedData)
 * 
 * PERFORMANCE: This is 10-50x faster than /api/context-sources
 * Use this for list views where extractedData is not needed
 * 
 * For full data including extractedData, use /api/context-sources/[id]
 */
export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    // 1. Verify authentication
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Please login' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. SECURITY: Verify user can only access their own context sources
    if (session.id !== userId) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - Cannot access other user data' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. Fetch metadata only (FAST - no extractedData)
    const sources = await getContextSourcesMetadata(userId);

    console.log(`✅ Loaded ${sources.length} context sources (metadata only, optimized)`);

    return new Response(
      JSON.stringify({ sources }),
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

