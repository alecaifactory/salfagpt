import type { APIRoute } from 'astro';
import { getSession } from '../../../../lib/auth';
import { firestore, COLLECTIONS } from '../../../../lib/firestore';

/**
 * GET /api/context-sources/:id/extracted-data
 * Get ONLY the extractedData field for a specific context source
 * 
 * PERFORMANCE: This endpoint loads the large extractedData field on-demand
 * when user selects a document for detailed viewing.
 * 
 * Security: Only accessible by alec@getaifactory.com
 */
export const GET: APIRoute = async (context) => {
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
      console.warn('🚨 Unauthorized access attempt to extracted data:', session.email);
      return new Response(
        JSON.stringify({ error: 'Forbidden - Superadmin access only' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. Get source ID from params
    const { id } = context.params;
    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Source ID required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('📄 Loading extracted data for source:', id);

    // 4. Fetch ONLY extractedData field (single field access is fast even for large docs)
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

    const data = sourceDoc.data();
    const extractedData = data?.extractedData || null;

    console.log('✅ Extracted data loaded:', extractedData ? 
      `${extractedData.length} characters` : 
      'No data available');

    return new Response(
      JSON.stringify({
        extractedData,
        name: data?.name,
        charactersExtracted: extractedData?.length || 0,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Error fetching extracted data:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch extracted data',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

