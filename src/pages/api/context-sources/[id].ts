import type { APIRoute } from 'astro';
import { getContextSource } from '../../../lib/firestore';
import { getSession } from '../../../lib/auth';

/**
 * GET /api/context-sources/[id]
 * Get a single context source with FULL data (includes extractedData)
 * 
 * Use this when you need the actual content, not just metadata
 * For list views, use /api/context-sources-metadata instead
 */
export const GET: APIRoute = async ({ params, cookies }) => {
  try {
    // 1. Verify authentication
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Please login' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const sourceId = params.id;
    if (!sourceId) {
      return new Response(
        JSON.stringify({ error: 'Source ID required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Load FULL source including extractedData
    const source = await getContextSource(sourceId);
    
    if (!source) {
      return new Response(
        JSON.stringify({ error: 'Source not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. SECURITY: Verify ownership (unless superadmin)
    if (source.userId !== session.id && session.email !== 'alec@getaifactory.com') {
      return new Response(
        JSON.stringify({ error: 'Forbidden - Cannot access other user data' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Loaded full context source:', sourceId, `(${source.extractedData?.length || 0} chars)`);

    return new Response(
      JSON.stringify({ source }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error fetching context source:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to fetch source' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
