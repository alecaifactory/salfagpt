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
 * Intelligent text chunking
 * Splits text into semantically meaningful chunks
 */
export function chunkText(
  text: string,
  maxTokensPerChunk: number = 512
): TextChunk[] {
  console.log(`   📐 Chunking text (max ${maxTokensPerChunk} tokens/chunk)...`);
  
  // Split by paragraphs first
  const paragraphs = text
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 0);
  
  const chunks: TextChunk[] = [];
  let currentChunk = '';
  let currentTokenCount = 0;
  let currentStartChar = 0;
  
  for (const paragraph of paragraphs) {
    const paragraphTokens = estimateTokens(paragraph);
    
    // If paragraph alone exceeds max, split it by sentences
    if (paragraphTokens > maxTokensPerChunk) {
      // Save current chunk if exists
      if (currentChunk) {
        chunks.push({
          chunkIndex: chunks.length,
          text: currentChunk.trim(),
          tokenCount: currentTokenCount,
          startChar: currentStartChar,
          endChar: currentStartChar + currentChunk.length,
        });
        currentChunk = '';
        currentTokenCount = 0;
        currentStartChar += currentChunk.length;
      }
      
      // Split long paragraph by sentences
      const sentences = paragraph.split(/\. /).map(s => s.trim() + '.');
      for (const sentence of sentences) {
        const sentenceTokens = estimateTokens(sentence);
        
        if (currentTokenCount + sentenceTokens > maxTokensPerChunk && currentChunk) {
          chunks.push({
            chunkIndex: chunks.length,
            text: currentChunk.trim(),
            tokenCount: currentTokenCount,
            startChar: currentStartChar,
            endChar: currentStartChar + currentChunk.length,
          });
          currentChunk = sentence + ' ';
          currentTokenCount = sentenceTokens;
          currentStartChar += currentChunk.length;
        } else {
          currentChunk += sentence + ' ';
          currentTokenCount += sentenceTokens;
        }
      }
    } else {
      // Check if adding this paragraph exceeds limit
      if (currentTokenCount + paragraphTokens > maxTokensPerChunk && currentChunk) {
        chunks.push({
          chunkIndex: chunks.length,
          text: currentChunk.trim(),
          tokenCount: currentTokenCount,
          startChar: currentStartChar,
          endChar: currentStartChar + currentChunk.length,
        });
        currentChunk = paragraph + '\n\n';
        currentTokenCount = paragraphTokens;
        currentStartChar += currentChunk.length;
      } else {
        currentChunk += paragraph + '\n\n';
        currentTokenCount += paragraphTokens;
      }
    }
  }
  
  // Add final chunk
  if (currentChunk.trim()) {
    chunks.push({
      chunkIndex: chunks.length,
      text: currentChunk.trim(),
      tokenCount: currentTokenCount,
      startChar: currentStartChar,
      endChar: currentStartChar + currentChunk.length,
    });
  }
  
  console.log(`   ✅ Created ${chunks.length} chunks`);
  console.log(`   📊 Average chunk size: ${Math.round(chunks.reduce((sum, c) => sum + c.tokenCount, 0) / chunks.length)} tokens`);
  
  return chunks;
}

/**
 * Estimate tokens (rough: 1 token ≈ 4 characters for English/Spanish)
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Generate embeddings for chunks
 */
export async function generateEmbeddings(
  chunks: TextChunk[],
  model: string = 'text-embedding-004'
): Promise<EmbeddingResult[]> {
  console.log(`   🧬 Generating embeddings for ${chunks.length} chunks...`);
  console.log(`   🤖 Model: ${model}`);
  
  const embeddings: EmbeddingResult[] = [];
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    
    try {
      // Show progress every 5 chunks
      if (i % 5 === 0 || i === chunks.length - 1) {
        console.log(`      Procesando chunk ${i + 1}/${chunks.length} (${((i + 1) / chunks.length * 100).toFixed(0)}%)`);
      }
      
      // Generate embedding using Gemini Embedding API
      const result = await genAI.models.embedContent({
        model: model,
        content: {
          parts: [{ text: chunk.text }],
        },
      });
      
      // Extract embedding vector (768 dimensions)
      const embedding = result.embedding?.values || [];
      
      embeddings.push({
        chunkIndex: chunk.chunkIndex,
        text: chunk.text,
        embedding: embedding,
        tokenCount: chunk.tokenCount,
      });
      
    } catch (error) {
      console.log(`      ⚠️  Error en chunk ${i + 1}: ${error instanceof Error ? error.message : 'Unknown'}`);
      // Continue with other chunks
    }
  }
  
  console.log(`   ✅ Generated ${embeddings.length} embeddings (${embeddings[0]?.embedding.length || 0} dimensions each)`);
  
  return embeddings;
}

/**
 * Store embeddings in Firestore
 * (In future: migrate to BigQuery or Vertex AI Vector Search for better performance)
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
    const docRef = firestore.collection('document_embeddings').doc();
    
    batch.set(docRef, {
      // Document reference
      documentId,
      fileName,
      userId,
      agentId,
      
      // Chunk info
      chunkIndex: embedding.chunkIndex,
      chunkText: embedding.text,
      tokenCount: embedding.tokenCount,
      
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
  
  console.log(`   ✅ Stored ${embeddings.length} chunks in collection 'document_embeddings'`);
  console.log(`   📍 Collection: https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore/data/~2Fdocument_embeddings`);
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
    chunkSize = 512,
    embeddingModel = 'text-embedding-004',
    uploadedVia = 'cli',
    cliVersion = '0.2.0',
    userEmail = 'alec@getaifactory.com',
  } = options;
  
  try {
    // Step 1: Chunk the text
    const chunks = chunkText(extractedText, chunkSize);
    
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

