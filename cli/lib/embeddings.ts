/**
 * RAG: Chunking & Embeddings Generation
 * 
 * Takes extracted text and:
 * 1. Chunks it intelligently (by paragraph/section)
 * 2. Generates embeddings for each chunk
 * 3. Stores in vector database (Firestore for now, BigQuery later)
 */

import { GoogleGenAI } from '@google/genai';
import { config } from 'dotenv';
import { firestore } from '../../src/lib/firestore';

config();

const API_KEY = process.env.GOOGLE_AI_API_KEY;
if (!API_KEY) {
  throw new Error('GOOGLE_AI_API_KEY not configured');
}

const genAI = new GoogleGenAI({ apiKey: API_KEY });

export interface TextChunk {
  chunkIndex: number;
  text: string;
  tokenCount: number;
  startChar: number;
  endChar: number;
}

export interface EmbeddingResult {
  chunkIndex: number;
  text: string;
  embedding: number[];  // 768 dimensions
  tokenCount: number;
}

export interface RAGProcessResult {
  success: boolean;
  documentId: string;
  chunks: TextChunk[];
  embeddings: EmbeddingResult[];
  totalChunks: number;
  totalTokens: number;
  duration: number;
  estimatedCost: number;
  error?: string;
}

/**
 * Intelligent text chunking with overlap
 * Splits text into semantically meaningful chunks with 20% overlap for robust border protection
 * 
 * Optimized for:
 * - text-embedding-004 (optimal input: 256-512 tokens)
 * - Spanish procedural documents
 * - BigQuery vector search (COSINE similarity)
 * - 20% overlap ensures no context loss at boundaries
 */
export function chunkText(
  text: string,
  maxTokensPerChunk: number = 512,
  overlapTokens: number = 102  // 20% of chunk size (512 * 0.2 ≈ 102)
): TextChunk[] {
  console.log(`   📐 Chunking text (${maxTokensPerChunk} tokens/chunk, ${overlapTokens} token overlap = ${((overlapTokens/maxTokensPerChunk)*100).toFixed(0)}%)...`);
  
  const chunks: TextChunk[] = [];
  const textLength = text.length;
  let position = 0;
  
  while (position < textLength) {
    // Calculate chunk boundaries
    const chunkStart = position;
    const targetChunkChars = maxTokensPerChunk * 4; // ~4 chars per token
    let chunkEnd = Math.min(chunkStart + targetChunkChars, textLength);
    
    // Extract potential chunk text
    let chunkText = text.substring(chunkStart, chunkEnd);
    
    // Try to break at natural boundaries (only if not at end of text)
    if (chunkEnd < textLength) {
      // First try: paragraph boundary (\n\n)
      const lastParagraph = chunkText.lastIndexOf('\n\n');
      if (lastParagraph > targetChunkChars * 0.5) {
        // Good paragraph break found (not too early in chunk)
        chunkEnd = chunkStart + lastParagraph + 2;
        chunkText = text.substring(chunkStart, chunkEnd);
      } else {
        // Second try: sentence boundary (. followed by space or newline)
        const sentenceMatch = chunkText.match(/\.\s+(?=[A-ZÁÉÍÓÚÑ])/g);
        if (sentenceMatch && sentenceMatch.length > 0) {
          const lastSentencePos = chunkText.lastIndexOf(sentenceMatch[sentenceMatch.length - 1]);
          if (lastSentencePos > targetChunkChars * 0.7) {
            // Good sentence break found
            chunkEnd = chunkStart + lastSentencePos + 2;
            chunkText = text.substring(chunkStart, chunkEnd);
          }
        }
      }
    }
    
    // Calculate actual tokens for this chunk
    const actualTokens = estimateTokens(chunkText);
    
    // Create chunk
    chunks.push({
      chunkIndex: chunks.length,
      text: chunkText.trim(),
      tokenCount: actualTokens,
      startChar: chunkStart,
      endChar: chunkEnd,
    });
    
    // Move position forward with overlap
    // Overlap is applied by moving back from the end of current chunk
    const overlapChars = overlapTokens * 4; // ~4 chars per token
    position = chunkEnd - overlapChars;
    
    // Ensure we make progress (avoid infinite loop on very small chunks)
    if (position <= chunkStart) {
      position = chunkEnd; // Skip overlap if chunk is too small
    }
    
    // Safety: if we're very close to the end, just finish
    if (textLength - position < targetChunkChars * 0.1) {
      break; // Avoid tiny final chunk
    }
  }
  
  console.log(`   ✅ Created ${chunks.length} chunks (with ${overlapTokens} token overlap)`);
  console.log(`   📊 Average chunk size: ${Math.round(chunks.reduce((sum, c) => sum + c.tokenCount, 0) / chunks.length)} tokens`);
  console.log(`   📊 Overlap: ${overlapTokens} tokens (${((overlapTokens / maxTokensPerChunk) * 100).toFixed(1)}%)`);
  
  return chunks;
}

/**
 * Estimate tokens (rough: 1 token ≈ 4 characters for English/Spanish)
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Filter out low-quality chunks (headers, footers, TOC, page numbers, etc.)
 * 
 * ✅ Prevents garbage chunks from polluting RAG search results
 */
export function filterGarbageChunks(chunks: TextChunk[]): TextChunk[] {
  const GARBAGE_PATTERNS = [
    /^[\d\s\.]+$/,                          // Only numbers and dots (TOC)
    /^página\s+\d+\s+de\s+\d+$/i,           // "Página X de Y"
    /^page\s+\d+\s+of\s+\d+$/i,             // "Page X of Y"
    /^[\.\s]{20,}$/,                        // Only dots and spaces (20+ chars)
    /^[-=_]{10,}$/,                         // Only separators (10+ chars)
    /^\d+\.\s+[A-ZÁÉÍÓÚ\s]{1,50}\.{5,}$/,   // TOC entries: "1. INTRODUCCIÓN ........"
    /^índice$/i,                            // "ÍNDICE"
    /^tabla\s+de\s+contenido/i,             // "Tabla de contenido"
    /^introducción\s*\.{5,}$/i,             // "INTRODUCCIÓN ........"
  ];
  
  const MIN_MEANINGFUL_CHARS = 50; // Minimum 50 chars for a chunk to be useful
  const MAX_DOT_RATIO = 0.3;        // Max 30% dots in text
  
  const filtered = chunks.filter(chunk => {
    const text = chunk.text.trim();
    
    // 1. Too short - probably not useful
    if (text.length < MIN_MEANINGFUL_CHARS) {
      return false;
    }
    
    // 2. Matches garbage pattern
    if (GARBAGE_PATTERNS.some(pattern => pattern.test(text))) {
      return false;
    }
    
    // 3. Too many dots (TOC formatting)
    const dotCount = (text.match(/\./g) || []).length;
    const dotRatio = dotCount / text.length;
    if (dotRatio > MAX_DOT_RATIO) {
      return false;
    }
    
    // 4. Only whitespace and punctuation
    const contentChars = text.replace(/[\s\.\-=_]/g, '').length;
    if (contentChars < 30) {
      return false;
    }
    
    // ✅ Chunk passed all filters
    return true;
  });
  
  const filteredCount = chunks.length - filtered.length;
  if (filteredCount > 0) {
    console.log(`   🗑️ Filtered ${filteredCount} low-quality chunks`);
  }
  
  return filtered;
}

/**
 * Generate embeddings for chunks (optimized with batching)
 * 
 * Batch size: 32 chunks per batch (optimized for throughput)
 * Processing: Sequential within each batch for stability
 */
export async function generateEmbeddings(
  chunks: TextChunk[],
  model: string = 'text-embedding-004'
): Promise<EmbeddingResult[]> {
  console.log(`   🧬 Generating embeddings for ${chunks.length} chunks...`);
  console.log(`   🤖 Model: ${model}`);
  console.log(`   📦 Batch size: 32 chunks (optimized for throughput)`);
  
  const embeddings: EmbeddingResult[] = [];
  const BATCH_SIZE = 100; // ✅ Optimized for Gemini API (supports up to 100 concurrent)
  
  // Process in batches
  for (let batchStart = 0; batchStart < chunks.length; batchStart += BATCH_SIZE) {
    const batchEnd = Math.min(batchStart + BATCH_SIZE, chunks.length);
    const batchChunks = chunks.slice(batchStart, batchEnd);
    const batchNum = Math.floor(batchStart / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(chunks.length / BATCH_SIZE);
    
    console.log(`      📦 Batch ${batchNum}/${totalBatches}: Processing chunks ${batchStart + 1}-${batchEnd}...`);
    
    // Process each chunk in this batch
    for (let i = 0; i < batchChunks.length; i++) {
      const chunk = batchChunks[i];
      const globalIndex = batchStart + i;
      
      try {
        // Generate embedding using Gemini Embedding API
        const result = await genAI.models.embedContent({
          model: model,
          contents: {
            parts: [{ text: chunk.text }],
          },
        });
        
        // Extract embedding vector (768 dimensions)
        const embedding = result.embeddings?.[0]?.values || [];
        
        embeddings.push({
          chunkIndex: chunk.chunkIndex,
          text: chunk.text,
          embedding: embedding,
          tokenCount: chunk.tokenCount,
        });
        
        // Micro-delay within batch to avoid rate limiting
        if (i < batchChunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
      } catch (error) {
        console.log(`      ⚠️  Error en chunk ${globalIndex + 1}: ${error instanceof Error ? error.message : 'Unknown'}`);
        // Continue with other chunks
      }
    }
    
    console.log(`      ✅ Batch ${batchNum} complete: ${batchChunks.length} embeddings generated`);
    
    // Small delay between batches
    if (batchEnd < chunks.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  console.log(`   ✅ Generated ${embeddings.length} embeddings (${embeddings[0]?.embedding.length || 0} dimensions each)`);
  console.log(`   📊 Processed in ${Math.ceil(chunks.length / BATCH_SIZE)} batches`);
  
  return embeddings;
}

/**
 * Store embeddings in Firestore AND BigQuery
 * ✅ NEW: Now syncs to BigQuery for optimized vector search
 */
export async function storeEmbeddings(
  documentId: string,
  fileName: string,
  userId: string,
  agentId: string,
  embeddings: EmbeddingResult[],
  metadata: {
    model: string;
    uploadedVia: string;
    cliVersion: string;
    userEmail: string;
  }
): Promise<void> {
  console.log(`   💾 Storing ${embeddings.length} embeddings in Firestore...`);
  
  // Batch write for efficiency
  const batch = firestore.batch();
  
  for (const embedding of embeddings) {
    const docRef = firestore.collection('document_chunks').doc();
    
    batch.set(docRef, {
      // Document reference (API expects sourceId)
      sourceId: documentId,  // Use sourceId for API compatibility
      documentId,            // Keep for backward compat
      fileName,
      userId,
      agentId,
      
      // Chunk info (API expects text, not chunkText)
      chunkIndex: embedding.chunkIndex,
      text: embedding.text,              // API expects 'text'
      chunkText: embedding.text,         // Keep for backward compat
      metadata: {
        tokenCount: embedding.tokenCount,
        startChar: 0,  // Calculated during chunking if needed
        endChar: embedding.text.length,
      },
      
      // Vector embedding (768 dimensions)
      embedding: embedding.embedding,
      embeddingModel: metadata.model,
      
      // Attribution & Traceability
      uploadedVia: metadata.uploadedVia,  // ⭐ 'cli'
      cliVersion: metadata.cliVersion,     // ⭐ '0.2.0'
      userEmail: metadata.userEmail,       // ⭐ 'alec@getaifactory.com'
      source: 'cli',                       // ⭐ Source tracking
      
      // Timestamps
      createdAt: new Date(),
      indexedAt: new Date(),
    });
  }
  
  await batch.commit();
  
  console.log(`   ✅ Stored ${embeddings.length} chunks in collection 'document_chunks'`);
  console.log(`   📍 Collection: https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore/data/~2Fdocument_chunks`);
  
  // ✅ NEW: Sync to BigQuery for vector search (non-blocking)
  console.log(`   📊 Syncing to BigQuery for vector search...`);
  try {
    const { syncChunksBatchToBigQuery } = await import('../../src/lib/bigquery-vector-search.js');
    
    const chunksForBigQuery = embeddings.map(embedding => ({
      id: `${documentId}_chunk_${embedding.chunkIndex}`,
      sourceId: documentId,
      userId,
      chunkIndex: embedding.chunkIndex,
      text: embedding.text,
      embedding: embedding.embedding,
      metadata: {
        tokenCount: embedding.tokenCount,
        startChar: 0,
        endChar: embedding.text.length,
      }
    }));
    
    await syncChunksBatchToBigQuery(chunksForBigQuery);
    console.log(`   ✅ Synced ${embeddings.length} chunks to BigQuery`);
  } catch (error) {
    console.warn('   ⚠️ BigQuery sync failed (non-critical):', error);
  }
}

/**
 * Complete RAG process: Chunk + Embed + Store
 */
export async function processForRAG(
  documentId: string,
  fileName: string,
  extractedText: string,
  userId: string,
  agentId: string,
  options: {
    chunkSize?: number;
    embeddingModel?: string;
    uploadedVia?: string;
    cliVersion?: string;
    userEmail?: string;
  } = {}
): Promise<RAGProcessResult> {
  const startTime = Date.now();
  
  console.log(`\n   🔬 Paso 4/5: Preparando para RAG (Retrieval-Augmented Generation)...`, 'cyan');
  
  const {
    chunkSize = 1000, // Match webapp default (better for technical docs like SSOMA)
    embeddingModel = 'text-embedding-004',
    uploadedVia = 'cli',
    cliVersion = '0.2.0',
    userEmail = 'alec@getaifactory.com',
  } = options;
  
  try {
    // Step 1: Chunk the text
    const rawChunks = chunkText(extractedText, chunkSize);
    
    // ✅ NEW: Filter garbage chunks
    const chunks = filterGarbageChunks(rawChunks);
    const filteredCount = rawChunks.length - chunks.length;
    
    if (filteredCount > 0) {
      console.log(`   🗑️ Filtrados ${filteredCount} chunks de baja calidad`);
      console.log(`   ✅ ${chunks.length} chunks útiles restantes`);
    }
    
    // Step 2: Generate embeddings
    const embeddings = await generateEmbeddings(chunks, embeddingModel);
    
    // Step 3: Store in vector database
    await storeEmbeddings(
      documentId,
      fileName,
      userId,
      agentId,
      embeddings,
      {
        model: embeddingModel,
        uploadedVia,
        cliVersion,
        userEmail,
      }
    );
    
    const duration = Date.now() - startTime;
    const totalTokens = chunks.reduce((sum, c) => sum + c.tokenCount, 0);
    
    // Estimate embedding cost
    // text-embedding-004: $0.00002 / 1K tokens
    const estimatedCost = (totalTokens / 1000) * 0.00002;
    
    console.log(`   ✅ Paso 4/5: RAG process completado en ${(duration / 1000).toFixed(1)}s`);
    console.log(`      📦 ${chunks.length} chunks creados`);
    console.log(`      🧬 ${embeddings.length} embeddings generados (768-dim)`);
    console.log(`      🎯 ${totalTokens.toLocaleString()} tokens totales`);
    console.log(`      💰 Costo embeddings: $${estimatedCost.toFixed(6)}`);
    
    return {
      success: true,
      documentId,
      chunks,
      embeddings,
      totalChunks: chunks.length,
      totalTokens,
      duration,
      estimatedCost,
    };
    
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.log(`   ❌ Error en RAG process: ${errorMessage}`);
    
    return {
      success: false,
      documentId,
      chunks: [],
      embeddings: [],
      totalChunks: 0,
      totalTokens: 0,
      duration,
      estimatedCost: 0,
      error: errorMessage,
    };
  }
}

/**
 * Calculate embedding cost
 */
export function calculateEmbeddingCost(
  totalTokens: number,
  model: string = 'text-embedding-004'
): number {
  // Pricing: $0.00002 per 1K tokens for text-embedding-004
  const pricePerThousandTokens = 0.00002;
  return (totalTokens / 1000) * pricePerThousandTokens;
}

