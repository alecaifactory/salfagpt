/**
 * RAG (Retrieval-Augmented Generation) Search Service
 * 
 * Orchestrates vector search across document chunks
 */

import { firestore } from './firestore';
import { generateEmbedding, findTopKSimilar } from './embeddings';

export interface RAGSearchResult {
  id: string;
  text: string;
  sourceId: string;
  sourceName: string;
  chunkIndex: number;
  similarity: number;
  metadata: {
    startChar: number;
    endChar: number;
    tokenCount: number;
    startPage?: number;
    endPage?: number;
  };
}

export interface RAGSearchOptions {
  topK?: number;
  minSimilarity?: number;
  activeSourceIds?: string[];
}

/**
 * Search for most relevant chunks across user's documents
 */
export async function searchRelevantChunks(
  userId: string,
  query: string,
  options: RAGSearchOptions = {}
): Promise<RAGSearchResult[]> {
  const {
    topK = 5, // Top 5 most relevant chunks
    minSimilarity = 0, // Show ALL chunks to see similarity distribution (TODO: raise to 0.3 after testing)
    activeSourceIds
  } = options;

  try {
    console.log('🔍 RAG Search starting...');
    console.log(`  Query: "${query.substring(0, 100)}..."`);
    console.log(`  TopK: ${topK}, MinSimilarity: ${minSimilarity}`);

    // 1. Generate embedding for query
    console.log('  1/4 Generating query embedding...');
    const startEmbed = Date.now();
    const queryEmbedding = await generateEmbedding(query);
    console.log(`  ✓ Query embedding generated (${Date.now() - startEmbed}ms)`);

    // 2. Load all chunks for user (with optional source filter)
    console.log('  2/4 Loading document chunks...');
    const startLoad = Date.now();
    
    let chunksQuery = firestore
      .collection('document_chunks')
      .where('userId', '==', userId);
    
    // Optional: filter by active sources only
    if (activeSourceIds && activeSourceIds.length > 0) {
      // Firestore 'in' query supports up to 10 values
      // If more, we'll load all and filter in memory
      if (activeSourceIds.length <= 10) {
        chunksQuery = chunksQuery.where('sourceId', 'in', activeSourceIds);
      }
    }
    
    const chunksSnapshot = await chunksQuery.get();
    
    let chunks = chunksSnapshot.docs.map(doc => ({
      id: doc.id,
      sourceId: doc.data().sourceId,
      userId: doc.data().userId,
      chunkIndex: doc.data().chunkIndex,
      text: doc.data().text,
      embedding: doc.data().embedding as number[],
      metadata: doc.data().metadata || {}
    }));

    // Filter in memory if >10 active sources
    if (activeSourceIds && activeSourceIds.length > 10) {
      chunks = chunks.filter(c => activeSourceIds.includes(c.sourceId));
    }

    console.log(`  ✓ Loaded ${chunks.length} chunks (${Date.now() - startLoad}ms)`);

    if (chunks.length === 0) {
      console.log('  ⚠️ No chunks found - documents may not be indexed for RAG');
      return [];
    }

    // 3. Find top K similar chunks
    console.log('  3/4 Calculating similarities...');
    const startSearch = Date.now();
    const topChunks = findTopKSimilar(queryEmbedding, chunks, topK, minSimilarity);
    console.log(`  ✓ Found ${topChunks.length} similar chunks (${Date.now() - startSearch}ms)`);

    if (topChunks.length === 0) {
      console.log('  ⚠️ No chunks above similarity threshold');
      return [];
    }

    // 4. Load source metadata
    console.log('  4/4 Loading source metadata...');
    const startMeta = Date.now();
    const results: RAGSearchResult[] = [];
    
    // Get unique source IDs
    const uniqueSourceIds = [...new Set(topChunks.map(tc => tc.chunk.sourceId))];
    
    // Load all sources at once (more efficient)
    const sourcesSnapshot = await firestore
      .collection('context_sources')
      .where('__name__', 'in', uniqueSourceIds)
      .get();
    
    const sourcesMap = new Map(
      sourcesSnapshot.docs.map(doc => [doc.id, doc.data()])
    );
    
    for (const { chunk, similarity } of topChunks) {
      const sourceData = sourcesMap.get(chunk.sourceId);
      const sourceName = sourceData?.name || 'Unknown Source';
      
      results.push({
        id: chunk.id,
        text: chunk.text,
        sourceId: chunk.sourceId,
        sourceName,
        chunkIndex: chunk.chunkIndex,
        similarity,
        metadata: chunk.metadata
      });
    }

    console.log(`  ✓ Loaded metadata (${Date.now() - startMeta}ms)`);
    console.log(`✅ RAG Search complete - ${results.length} results`);
    
    // Log top results
    results.slice(0, 3).forEach((r, i) => {
      console.log(`  ${i+1}. ${r.sourceName} (chunk ${r.chunkIndex}) - ${(r.similarity * 100).toFixed(1)}% similar`);
    });

    return results;
  } catch (error) {
    console.error('❌ RAG search failed:', error);
    
    // Graceful degradation - return empty array
    // Caller will fall back to full document context
    return [];
  }
}

/**
 * Build context string from RAG search results
 */
export function buildRAGContext(results: RAGSearchResult[]): string {
  if (results.length === 0) return '';

  // Group by source
  const bySource = results.reduce((acc, result) => {
    if (!acc[result.sourceId]) {
      acc[result.sourceId] = {
        name: result.sourceName,
        chunks: []
      };
    }
    acc[result.sourceId].chunks.push(result);
    return acc;
  }, {} as Record<string, { name: string; chunks: RAGSearchResult[] }>);

  // Build formatted context
  let context = '';
  
  for (const [sourceId, { name, chunks }] of Object.entries(bySource)) {
    context += `\n\n=== ${name} (RAG: ${chunks.length} fragmentos relevantes) ===\n`;
    
    // Sort chunks by index for better readability
    chunks.sort((a, b) => a.chunkIndex - b.chunkIndex);
    
    chunks.forEach((chunk, i) => {
      const relevance = (chunk.similarity * 100).toFixed(1);
      context += `\n[Fragmento ${chunk.chunkIndex}, Relevancia: ${relevance}%]\n`;
      context += chunk.text;
      context += '\n';
    });
  }

  return context;
}

/**
 * Get RAG search statistics
 */
export function getRAGStats(results: RAGSearchResult[]) {
  if (results.length === 0) {
    return {
      totalChunks: 0,
      totalTokens: 0,
      avgSimilarity: 0,
      sources: []
    };
  }

  const totalTokens = results.reduce((sum, r) => sum + r.metadata.tokenCount, 0);
  const avgSimilarity = results.reduce((sum, r) => sum + r.similarity, 0) / results.length;
  
  // Group by source
  const sourceGroups = results.reduce((acc, r) => {
    if (!acc[r.sourceId]) {
      acc[r.sourceId] = {
        id: r.sourceId,
        name: r.sourceName,
        chunkCount: 0,
        tokens: 0
      };
    }
    acc[r.sourceId].chunkCount++;
    acc[r.sourceId].tokens += r.metadata.tokenCount;
    return acc;
  }, {} as Record<string, { id: string; name: string; chunkCount: number; tokens: number }>);

  return {
    totalChunks: results.length,
    totalTokens,
    avgSimilarity,
    sources: Object.values(sourceGroups)
  };
}

