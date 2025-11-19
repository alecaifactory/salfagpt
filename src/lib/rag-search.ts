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
    topK = 8, // ✅ Increased from 5 to 8 for better coverage
    minSimilarity = 0.25, // ✅ Lowered from 0 to 0.25 (filter very low similarity but catch more)
    activeSourceIds
  } = options;

  try {
    console.log('🔍 RAG Search starting...');
    console.log(`  Query: "${query.substring(0, 100)}..."`);
    console.log(`  TopK: ${topK}, MinSimilarity: ${minSimilarity}`);

    // 🔑 CRITICAL FIX: Resolve userId to Google format for chunk queries
    // Chunks were indexed with Google user ID (numeric), not hashed ID (usr_xxx)
    const { getUserById } = await import('./firestore.js');
    const userDoc = await getUserById(userId);
    const googleUserId = userDoc?.googleUserId || userId;
    
    if (googleUserId !== userId) {
      console.log(`  🔑 Resolved userId: ${userId} → ${googleUserId} (Google format)`);
    }

    // 1. Generate embedding for query
    console.log('  1/4 Generating query embedding...');
    const startEmbed = Date.now();
    const queryEmbedding = await generateEmbedding(query);
    console.log(`  ✓ Query embedding generated (${Date.now() - startEmbed}ms)`);

    // 2. Load embeddings only (not full text yet - saves bandwidth!)
    console.log('  2/4 Loading chunk embeddings...');
    const startLoad = Date.now();
    
    let chunksQuery = firestore
      .collection('document_chunks')
      .where('userId', '==', googleUserId); // ✅ Use Google user ID for chunks
    
    // Optional: filter by active sources only
    if (activeSourceIds && activeSourceIds.length > 0) {
      // Firestore 'in' query supports up to 10 values
      // If more, we'll load all and filter in memory
      if (activeSourceIds.length <= 10) {
        chunksQuery = chunksQuery.where('sourceId', 'in', activeSourceIds);
      }
    }
    
    // ✅ OPTIMIZATION: Only load fields needed for similarity calculation
    const chunksSnapshot = await chunksQuery
      .select('sourceId', 'chunkIndex', 'embedding')
      .get();
    
    let chunks = chunksSnapshot.docs.map(doc => ({
      id: doc.id,
      sourceId: doc.data().sourceId,
      userId: userId, // We know this from query
      chunkIndex: doc.data().chunkIndex,
      text: '', // Will load later for top K only
      embedding: doc.data().embedding as number[],
      metadata: {} // Will load later for top K only
    }));

    // Filter in memory if >10 active sources
    if (activeSourceIds && activeSourceIds.length > 10) {
      chunks = chunks.filter(c => activeSourceIds.includes(c.sourceId));
    }

    console.log(`  ✓ Loaded ${chunks.length} chunk embeddings (${Date.now() - startLoad}ms)`);

    if (chunks.length === 0) {
      console.log('  ⚠️ No chunks found - documents may not be indexed for RAG');
      return [];
    }

    // 3. Find top K similar chunks (using embeddings only)
    console.log('  3/4 Calculating similarities...');
    const startSearch = Date.now();
    const topChunks = findTopKSimilar(queryEmbedding, chunks, topK, minSimilarity);
    console.log(`  ✓ Found ${topChunks.length} similar chunks (${Date.now() - startSearch}ms)`);

    if (topChunks.length === 0) {
      console.log('  ⚠️ No chunks above similarity threshold');
      return [];
    }

    // 4. ✅ NOW load full data for ONLY the top K chunks
    console.log('  4/4 Loading full data for top chunks...');
    const startMeta = Date.now();
    const results: RAGSearchResult[] = [];
    
    // Get chunk IDs for top K
    const topChunkIds = topChunks.map(tc => tc.chunk.id);
    
    // Load full chunk data for top K only (not all chunks!)
    const fullChunksSnapshot = await firestore
      .collection('document_chunks')
      .where('__name__', 'in', topChunkIds)
      .get();
    
    const fullChunksMap = new Map(
      fullChunksSnapshot.docs.map(doc => [doc.id, doc.data()])
    );
    
    // Get unique source IDs
    const uniqueSourceIds = Array.from(new Set(topChunks.map(tc => tc.chunk.sourceId)));
    
    // Load source metadata
    const sourcesSnapshot = await firestore
      .collection('context_sources')
      .where('__name__', 'in', uniqueSourceIds)
      .get();
    
    const sourcesMap = new Map(
      sourcesSnapshot.docs.map(doc => [doc.id, doc.data()])
    );
    
    for (const { chunk, similarity } of topChunks) {
      const fullChunkData = fullChunksMap.get(chunk.id);
      const sourceData = sourcesMap.get(chunk.sourceId);
      const sourceName = sourceData?.name || 'Unknown Source';
      
      results.push({
        id: chunk.id,
        text: fullChunkData?.text || '',
        sourceId: chunk.sourceId,
        sourceName,
        chunkIndex: chunk.chunkIndex,
        similarity,
        metadata: fullChunkData?.metadata || {}
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
 * ✅ FIX 2025-10-29: Consolidate by document FIRST, then renumber
 * This prevents phantom references like [7][8] when final refs are [1][2][3]
 */
export function buildRAGContext(results: RAGSearchResult[]): string {
  if (results.length === 0) return '';

  // ✅ STEP 1: Group by source document FIRST
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

  // ✅ STEP 2: Build formatted context with CONSOLIDATED numbering
  // Each unique document gets ONE reference number (not per-chunk)
  let context = '';
  let documentRefNumber = 1; // Reference number per DOCUMENT (not per chunk)
  
  for (const [sourceId, { name, chunks }] of Object.entries(bySource)) {
    // Sort chunks by similarity (highest first) for better context
    chunks.sort((a, b) => b.similarity - a.similarity);
    
    // Calculate average similarity for this document
    const avgSimilarity = chunks.reduce((sum, c) => sum + c.similarity, 0) / chunks.length;
    const relevance = (avgSimilarity * 100).toFixed(1);
    
    // ✅ CRITICAL: Use document reference number, not chunk number
    context += `\n\n=== [Referencia ${documentRefNumber}] ${name} ===\n`;
    context += `Relevancia promedio: ${relevance}% (${chunks.length} fragmentos consolidados)\n\n`;
    
    // Include all chunks from this document (for full context)
    chunks.forEach((chunk, i) => {
      const chunkRelevance = (chunk.similarity * 100).toFixed(1);
      context += `--- Fragmento ${i + 1}/${chunks.length} (Similitud: ${chunkRelevance}%) ---\n`;
      context += chunk.text;
      context += '\n\n';
    });
    
    documentRefNumber++; // Next document gets next reference number
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

