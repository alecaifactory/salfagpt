/**
 * RAG Indexing Service
 * 
 * Chunks documents and creates embeddings for RAG search
 */

import { firestore } from './firestore';
import { chunkText } from './chunking';
import { generateEmbedding } from './embeddings';
import { syncChunksBatchToBigQuery } from './bigquery-vector-search';

export interface IndexingOptions {
  sourceId: string;
  userId: string;
  sourceName: string;
  text: string;
  chunkSize?: number;
  overlap?: number;
}

export interface IndexingResult {
  chunksCreated: number;
  totalTokens: number;
  indexingTime: number;
}

/**
 * Chunk document and create embeddings for RAG
 */
export async function chunkAndIndexDocument(
  options: IndexingOptions
): Promise<IndexingResult> {
  const {
    sourceId,
    userId,
    sourceName,
    text,
    chunkSize = 500,  // Default: 500 tokens per chunk
    overlap = 50,     // Default: 50 tokens overlap
  } = options;

  const startTime = Date.now();

  try {
    console.log('🔍 Starting RAG indexing for:', sourceName);
    console.log(`  Text length: ${text.length} chars`);
    console.log(`  Chunk size: ${chunkSize} tokens, Overlap: ${overlap} tokens`);

    // 1. Chunk the document
    console.log('  Step 1/3: Chunking document...');
    const chunks = chunkText(text, chunkSize, overlap);
    console.log(`  ✓ Created ${chunks.length} chunks`);

    // 2. Delete existing chunks for this source (if re-indexing)
    console.log('  Step 2/3: Clearing old chunks...');
    const existingChunks = await firestore
      .collection('document_chunks')
      .where('sourceId', '==', sourceId)
      .get();
    
    if (existingChunks.size > 0) {
      const batch = firestore.batch();
      existingChunks.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      console.log(`  ✓ Deleted ${existingChunks.size} old chunks`);
    }

    // 3. Generate embeddings and save chunks (OPTIMIZED - Parallel embeddings)
    console.log('  Step 3/3: Generating embeddings and saving...');
    
    let totalTokens = 0;
    let savedCount = 0;
    
    // Process in batches of 10 for Firestore, but generate embeddings 5 at a time in parallel
    const firestoreBatchSize = 10;
    const embeddingParallelSize = 5;
    
    for (let i = 0; i < chunks.length; i += firestoreBatchSize) {
      const batchChunks = chunks.slice(i, i + firestoreBatchSize);
      
      console.log(`  Processing chunks ${i + 1}-${Math.min(i + firestoreBatchSize, chunks.length)} of ${chunks.length}...`);
      
      // Generate embeddings in parallel (5 at a time)
      const embeddingsForBatch: number[][] = [];
      for (let j = 0; j < batchChunks.length; j += embeddingParallelSize) {
        const parallelChunks = batchChunks.slice(j, j + embeddingParallelSize);
        const parallelEmbeddings = await Promise.all(
          parallelChunks.map(chunk => generateEmbedding(chunk.text))
        );
        embeddingsForBatch.push(...parallelEmbeddings);
      }
      
      // Now save all chunks in this batch
      const batch = firestore.batch();
      
      for (let j = 0; j < batchChunks.length; j++) {
        const chunk = batchChunks[j];
        const embedding = embeddingsForBatch[j];
        
        try {
          const docRef = firestore.collection('document_chunks').doc();
          
          // Filter out undefined values for Firestore
          const metadata: any = {
            startChar: chunk.startChar,
            endChar: chunk.endChar,
            tokenCount: chunk.tokenCount,
          };
          
          if (chunk.metadata?.startPage !== undefined) {
            metadata.startPage = chunk.metadata.startPage;
          }
          if (chunk.metadata?.endPage !== undefined) {
            metadata.endPage = chunk.metadata.endPage;
          }
          
          batch.set(docRef, {
            sourceId,
            userId,
            sourceName,
            chunkIndex: chunk.chunkIndex,
            text: chunk.text,
            embedding,
            metadata,
            createdAt: new Date(),
          });
          
          totalTokens += chunk.tokenCount;
          savedCount++;
          
        } catch (error) {
          console.error(`  ⚠️ Failed to save chunk ${chunk.chunkIndex}:`, error);
        }
      }
      
      // Save this batch to Firestore
      await batch.commit();
      console.log(`  ✓ Saved ${batchChunks.length} chunks (embeddings generated in parallel)`);
      
      // ✅ NEW: Sync to BigQuery for vector search (non-blocking)
      const chunksForBigQuery = batchChunks.map((chunk, j) => ({
        id: `${sourceId}_chunk_${chunk.chunkIndex}`, // Generate deterministic ID
        sourceId,
        userId,
        chunkIndex: chunk.chunkIndex,
        text: chunk.text,
        embedding: embeddingsForBatch[j],
        metadata: {
          startChar: chunk.startChar,
          endChar: chunk.endChar,
          tokenCount: chunk.tokenCount,
          startPage: chunk.metadata?.startPage,
          endPage: chunk.metadata?.endPage,
        }
      }));
      
      syncChunksBatchToBigQuery(chunksForBigQuery).catch(err => {
        console.warn('⚠️ BigQuery sync failed (non-critical):', err.message);
      });
      
      // Reduced delay (was 100ms, now 50ms)
      if (i + firestoreBatchSize < chunks.length) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    const indexingTime = Date.now() - startTime;
    console.log(`✅ RAG indexing complete!`);
    console.log(`  Chunks created: ${savedCount}`);
    console.log(`  Total tokens: ${totalTokens}`);
    console.log(`  Time: ${(indexingTime / 1000).toFixed(2)}s`);

    return {
      chunksCreated: savedCount,
      totalTokens,
      indexingTime,
    };

  } catch (error) {
    console.error('❌ RAG indexing failed:', error);
    throw error;
  }
}

/**
 * Delete all chunks for a source
 */
export async function deleteSourceChunks(sourceId: string): Promise<number> {
  try {
    console.log('🗑️ Deleting chunks for source:', sourceId);
    
    const chunks = await firestore
      .collection('document_chunks')
      .where('sourceId', '==', sourceId)
      .get();
    
    if (chunks.size === 0) {
      console.log('  No chunks to delete');
      return 0;
    }
    
    const batch = firestore.batch();
    chunks.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    
    console.log(`  ✓ Deleted ${chunks.size} chunks`);
    return chunks.size;
    
  } catch (error) {
    console.error('❌ Failed to delete chunks:', error);
    throw error;
  }
}

