import type { APIRoute } from 'astro';
import { firestore } from '../../../../lib/firestore';
import { getSession } from '../../../../lib/auth';

/**
 * GET /api/context-sources/:id/chunks
 * 
 * Retrieves all chunks and embeddings for a specific context source
 */
export const GET: APIRoute = async (context) => {
  try {
    const { params } = context;
    
    // 1. Authenticate
    const session = getSession(context);
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
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

    console.log(`📊 Fetching chunks for source: ${sourceId}`);

    // 2. Verify source exists and user has access
    const sourceDoc = await firestore
      .collection('context_sources')
      .doc(sourceId)
      .get();

    if (!sourceDoc.exists) {
      return new Response(
        JSON.stringify({ error: 'Source not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const sourceData = sourceDoc.data();
    if (!sourceData || sourceData.userId !== session.id) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - Cannot access other user data' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. Fetch all chunks for this source
    const chunksSnapshot = await firestore
      .collection('document_chunks')
      .where('sourceId', '==', sourceId)
      .orderBy('chunkIndex', 'asc')
      .get();

    const chunks = chunksSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        chunkIndex: data.chunkIndex,
        text: data.text,
        embedding: data.embedding, // Include full embedding vector
        metadata: {
          startChar: data.metadata?.startChar,
          endChar: data.metadata?.endChar,
          tokenCount: data.metadata?.tokenCount,
          startPage: data.metadata?.startPage,
          endPage: data.metadata?.endPage,
        },
        createdAt: data.createdAt?.toDate?.() || new Date(),
      };
    });

    console.log(`✅ Retrieved ${chunks.length} chunks for source ${sourceId}`);

    // 4. Calculate statistics
    const stats = {
      totalChunks: chunks.length,
      totalTokens: chunks.reduce((sum, c) => sum + (c.metadata.tokenCount || 0), 0),
      avgChunkSize: chunks.length > 0
        ? Math.round(chunks.reduce((sum, c) => sum + (c.metadata.tokenCount || 0), 0) / chunks.length)
        : 0,
      embeddingDimensions: chunks[0]?.embedding?.length || 0,
    };

    return new Response(
      JSON.stringify({
        chunks,
        stats,
        sourceId,
        sourceName: sourceData.name,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Error fetching chunks:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch chunks',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
