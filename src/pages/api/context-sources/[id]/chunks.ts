/**
 * API endpoints for RAG chunks
 * 
 * GET /api/context-sources/:id/chunks
 * - Retrieves all chunks for a context source
 * 
 * POST /api/context-sources/:id/chunks
 * - Stores chunks with embeddings in Firestore
 */

import type { APIRoute } from 'astro';
import { firestore } from '../../../../lib/firestore';

/**
 * GET - Retrieve chunks for a context source
 */
export const GET: APIRoute = async ({ params, url }) => {
  try {
    const sourceId = params.id;
    const userId = url.searchParams.get('userId');

    if (!sourceId || !userId) {
      return new Response(
        JSON.stringify({ error: 'sourceId and userId are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📖 Loading chunks for source ${sourceId}...`);

    // Load chunks from Firestore
    const chunksSnapshot = await firestore
      .collection('document_chunks')
      .where('sourceId', '==', sourceId)
      .where('userId', '==', userId)
      .orderBy('chunkIndex', 'asc')
      .get();

    const chunks = chunksSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        chunkIndex: data.chunkIndex,
        text: data.text,
        embedding: data.embedding,
        metadata: data.metadata,
      };
    });

    console.log(`✅ Loaded ${chunks.length} chunks`);

    return new Response(
      JSON.stringify({
        success: true,
        chunks,
        count: chunks.length,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error loading chunks:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Failed to load chunks',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

/**
 * POST - Store chunks for a context source
 */
export const POST: APIRoute = async ({ params, request }) => {
  try {
    const sourceId = params.id;
    const body = await request.json();
    const { userId, chunks } = body;

    if (!sourceId || !userId || !chunks) {
      return new Response(
        JSON.stringify({ error: 'sourceId, userId, and chunks are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`💾 Storing ${chunks.length} chunks for source ${sourceId}...`);

    // Store chunks in batches (Firestore supports 500 writes per batch)
    const batchSize = 500;
    let totalStored = 0;

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = firestore.batch();
      const batchChunks = chunks.slice(i, i + batchSize);

      for (const chunk of batchChunks) {
        const chunkDoc = firestore.collection('document_chunks').doc();
        batch.set(chunkDoc, {
          sourceId,
          userId,
          chunkIndex: chunk.chunkIndex,
          text: chunk.text,
          embedding: chunk.embedding,
          metadata: chunk.metadata || {},
          createdAt: new Date()
        });
      }

      await batch.commit();
      totalStored += batchChunks.length;
      console.log(`  ✓ Stored batch ${Math.floor(i/batchSize) + 1}: ${totalStored}/${chunks.length} chunks`);
    }

    console.log(`✅ All ${totalStored} chunks stored successfully`);

    return new Response(
      JSON.stringify({
        success: true,
        chunksStored: totalStored
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error storing chunks:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Failed to store chunks',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

