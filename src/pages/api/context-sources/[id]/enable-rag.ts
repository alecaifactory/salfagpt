/**
 * Enable RAG for an existing context source
 * 
 * POST /api/context-sources/:id/enable-rag
 * 
 * Takes extractedData from source and:
 * 1. Chunks the text
 * 2. Generates embeddings
 * 3. Stores chunks in document_chunks collection
 * 4. Updates source with ragEnabled: true
 */

import type { APIRoute } from 'astro';
import { firestore } from '../../../../lib/firestore';

export const POST: APIRoute = async ({ params, request }) => {
  try {
    const sourceId = params.id;
    const body = await request.json();
    const { userId, chunkSize = 2000, overlap = 500 } = body;

    if (!sourceId || !userId) {
      return new Response(
        JSON.stringify({ error: 'sourceId and userId are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🔍 Enabling RAG for source ${sourceId}...`);

    // 1. Load source from Firestore
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
    
    if (!sourceData) {
      return new Response(
        JSON.stringify({ error: 'Source data not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify ownership
    if (sourceData.userId !== userId) {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const extractedText = sourceData.extractedData || '';

    if (!extractedText) {
      return new Response(
        JSON.stringify({ error: 'No extracted text available for this source' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`  Source: ${sourceData.name}`);
    console.log(`  Extracted text: ${extractedText.length} characters`);

    // Get existing pipeline logs or initialize new array
    const existingLogs = sourceData.pipelineLogs || [];
    const pipelineLogs = [...existingLogs];

    // 2. Chunk the text
    const { chunkText } = await import('../../../../lib/chunking.js');
    const startChunkTime = Date.now();
    
    pipelineLogs.push({
      step: 'chunk',
      status: 'in_progress',
      startTime: new Date(startChunkTime),
      message: 'Dividiendo documento en chunks...',
    });
    
    const chunks = chunkText(extractedText, chunkSize, overlap);
    const chunkTime = Date.now() - startChunkTime;
    
    pipelineLogs[pipelineLogs.length - 1] = {
      ...pipelineLogs[pipelineLogs.length - 1],
      status: 'success',
      endTime: new Date(Date.now()),
      duration: chunkTime,
      message: `Documento dividido en ${chunks.length} chunks`,
      details: {
        chunkCount: chunks.length,
        avgChunkSize: Math.round(chunks.reduce((sum, c) => sum + c.tokenCount, 0) / chunks.length),
      }
    };
    
    console.log(`  📄 Created ${chunks.length} chunks in ${chunkTime}ms`);

    // 3. Generate embeddings for each chunk
    const { generateEmbeddingsBatch } = await import('../../../../lib/embeddings.js');
    const startEmbedTime = Date.now();
    
    pipelineLogs.push({
      step: 'embed',
      status: 'in_progress',
      startTime: new Date(startEmbedTime),
      message: 'Generando embeddings vectoriales...',
    });
    
    const chunkTexts = chunks.map(c => c.text);
    const embeddings = await generateEmbeddingsBatch(chunkTexts, 5);
    const embedTime = Date.now() - startEmbedTime;
    
    pipelineLogs[pipelineLogs.length - 1] = {
      ...pipelineLogs[pipelineLogs.length - 1],
      status: 'success',
      endTime: new Date(Date.now()),
      duration: embedTime,
      message: `${embeddings.length} embeddings generados exitosamente`,
      details: {
        embeddingCount: embeddings.length,
        embeddingModel: 'embedding-001',
      }
    };
    
    console.log(`  🧮 Generated ${embeddings.length} embeddings in ${embedTime}ms`);

    // 4. Store chunks in Firestore (in batches of 500)
    const startStoreTime = Date.now();
    const batchSize = 500;
    let totalStored = 0;

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = firestore.batch();
      const batchChunks = chunks.slice(i, i + batchSize);

      for (let j = 0; j < batchChunks.length; j++) {
        const chunk = batchChunks[j];
        const globalIndex = i + j;
        
        const chunkDoc = firestore.collection('document_chunks').doc();
        batch.set(chunkDoc, {
          sourceId,
          userId,
          chunkIndex: globalIndex,
          text: chunk.text,
          embedding: embeddings[globalIndex],
          metadata: {
            startChar: chunk.startChar,
            endChar: chunk.endChar,
            tokenCount: chunk.tokenCount
          },
          createdAt: new Date()
        });
      }

      await batch.commit();
      totalStored += batchChunks.length;
      console.log(`    Stored batch ${Math.floor(i/batchSize) + 1}: ${totalStored}/${chunks.length} chunks`);
    }

    const storeTime = Date.now() - startStoreTime;
    console.log(`  💾 Stored ${totalStored} chunks in ${storeTime}ms`);

    // Add complete step log
    pipelineLogs.push({
      step: 'complete',
      status: 'success',
      startTime: new Date(),
      endTime: new Date(),
      duration: 0,
      message: 'Pipeline completado exitosamente',
    });

    // 5. Update source with RAG metadata and pipeline logs
    await sourceDoc.ref.update({
      ragEnabled: true,
      ragMetadata: {
        totalChunks: chunks.length,
        embeddingModel: 'text-embedding-004',
        embeddingDimensions: 768,
        chunkSize,
        overlap,
        indexedAt: new Date(),
        indexingTime: chunkTime + embedTime + storeTime,
        qualityScore: calculateChunkQuality(chunks)
      },
      pipelineLogs, // ✅ Save pipeline execution logs
    });

    const totalTime = Date.now() - startChunkTime;
    console.log(`✅ RAG enabled for ${sourceData.name}`);
    console.log(`  Total time: ${totalTime}ms`);
    console.log(`  Chunks: ${chunks.length}`);
    console.log(`  Ready for vector search!`);

    return new Response(
      JSON.stringify({
        success: true,
        chunksCreated: chunks.length,
        totalTokens: chunks.reduce((sum, c) => sum + c.tokenCount, 0),
        indexingTime: totalTime,
        estimatedCost: (extractedText.length / 1_000_000) * 0.025, // $0.025 per 1M chars
        message: `RAG enabled successfully with ${chunks.length} chunks`,
        pipelineLogs, // ✅ Return updated pipeline logs
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error enabling RAG:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Failed to enable RAG',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

/**
 * Calculate average chunk quality score
 */
function calculateChunkQuality(chunks: any[]): number {
  const avgLength = chunks.reduce((sum, c) => sum + c.text.length, 0) / chunks.length;
  const lengthScore = Math.min(100, (avgLength / 2000) * 100); // Ideal ~2000 chars
  
  // Check for broken chunks (end mid-sentence)
  const brokenChunks = chunks.filter(c => 
    !c.text.endsWith('.') && !c.text.endsWith('!') && !c.text.endsWith('?')
  ).length;
  const boundaryScore = ((chunks.length - brokenChunks) / chunks.length) * 100;
  
  return (lengthScore * 0.4 + boundaryScore * 0.6);
}

