/**
 * Embeddings Service for RAG using Gemini AI
 * 
 * Generates REAL semantic vector embeddings for text chunks and performs similarity search
 * 
 * Model: text-embedding-004 via Gemini AI REST API
 * Dimensions: 768
 * Cost: FREE (included with Gemini API key)
 */

import * as fs from 'fs';
import * as path from 'path';

// Configuration - Load API key from .env file directly (Astro doesn't auto-load for server code)
function getAPIKey(): string | undefined {
  // Try process.env first (in case it's set)
  if (typeof process !== 'undefined' && process.env?.GOOGLE_AI_API_KEY) {
    return process.env.GOOGLE_AI_API_KEY;
  }
  
  // Try import.meta.env (build time)
  if (typeof import.meta !== 'undefined' && import.meta.env?.GOOGLE_AI_API_KEY) {
    return import.meta.env.GOOGLE_AI_API_KEY;
  }
  
  // Last resort: Read .env file directly
  try {
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      const match = envContent.match(/GOOGLE_AI_API_KEY=(.+)/);
      if (match && match[1]) {
        const key = match[1].trim();
        console.log('🔑 [Embeddings] Loaded API key from .env file');
        return key;
      }
    }
  } catch (error) {
    // Silent fail - will use deterministic fallback
  }
  
  return undefined;
}

export const EMBEDDING_MODEL = 'text-embedding-004'; // Gemini embedding model
export const EMBEDDING_DIMENSIONS = 768;

/**
 * Generate REAL semantic embedding vector for text using Vertex AI
 * 
 * ✨ This generates TRUE semantic embeddings that capture MEANING
 * - "Ley 19.537" and "legislación sobre copropiedad" → High similarity
 * - Different text, same topic → High similarity  
 * - Different topics → Low similarity
 */
/**
 * Generate REAL semantic embedding using Gemini AI REST API
 * 
 * Uses Gemini AI embedContent API for semantic embeddings
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  // Get API key at runtime (not module load time)
  const API_KEY = getAPIKey();
  
  // If no API key, use deterministic immediately
  if (!API_KEY) {
    console.warn('⚠️ GOOGLE_AI_API_KEY not available - using deterministic fallback');
    return generateDeterministicEmbedding(text);
  }
  
  try {
    console.log(`🧮 [Gemini AI] Generating semantic embedding (${text.substring(0, 50)}...)`);
    
    // Gemini AI Embeddings REST API
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent?key=${API_KEY}`;
    
    // Request body - Gemini format
    const requestBody = {
      model: `models/${EMBEDDING_MODEL}`,
      content: {
        parts: [{ text }]
      },
      taskType: 'RETRIEVAL_DOCUMENT', // For document storage
      title: 'Document chunk for RAG', // Optional but helps quality
    };
    
    // Call Gemini API
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error ${response.status}: ${errorText.substring(0, 300)}`);
    }
    
    const result = await response.json();
    
    // Extract embedding from response
    const embedding = result.embedding?.values;
    
    if (!embedding || !Array.isArray(embedding) || embedding.length === 0) {
      console.warn('⚠️ Gemini returned empty embedding, using fallback');
      console.warn('Response:', JSON.stringify(result).substring(0, 200));
      return generateDeterministicEmbedding(text);
    }
    
    console.log(`✅ [Gemini AI] Generated SEMANTIC embedding: ${embedding.length} dimensions`);
    return embedding;
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Gemini AI embedding failed:', errorMessage.substring(0, 300));
    console.warn('⚠️ Falling back to deterministic embedding');
    
    // Fallback to deterministic (better than crashing)
    return generateDeterministicEmbedding(text);
  }
}

/**
 * Generate a deterministic embedding from text
 * 
 * ⚠️ WARNING: TEMPORARY PLACEHOLDER - NOT SEMANTIC EMBEDDINGS
 * 
 * This generates a deterministic vector based on character positions and word hashes.
 * It does NOT capture semantic meaning, only text patterns.
 * 
 * Behavior:
 * - Near-identical text → ~80-100% similarity ✅
 * - Semantically similar text → ~1-10% similarity ❌
 * - Unrelated text → ~0-2% similarity ❌
 * 
 * Impact on RAG:
 * - Threshold must be very low (0.05 instead of 0.5)
 * - Chunk selection is not optimal
 * - False positives possible
 * 
 * TODO: Replace with Vertex AI text-embedding-004 for production-grade semantic search
 * 
 * This is a simple but LIMITED approach until real embeddings API is available.
 */
function generateDeterministicEmbedding(text: string): number[] {
  const normalized = text.toLowerCase().trim();
  const embedding = new Array(EMBEDDING_DIMENSIONS).fill(0);
  
  // Use multiple hash functions for better distribution
  for (let i = 0; i < normalized.length && i < 1000; i++) {
    const char = normalized.charCodeAt(i);
    
    // Distribute character influence across multiple dimensions
    for (let dim = 0; dim < 10; dim++) {
      const index = (i * 37 + dim * 13 + char) % EMBEDDING_DIMENSIONS;
      embedding[index] += Math.sin(char * (i + 1) * (dim + 1)) / (normalized.length);
    }
  }
  
  // Add word-level features
  const words = normalized.split(/\s+/).filter(w => w.length > 2);
  for (let wi = 0; wi < words.length && wi < 100; wi++) {
    const word = words[wi];
    let wordHash = 0;
    for (let ci = 0; ci < word.length; ci++) {
      wordHash = ((wordHash << 5) - wordHash) + word.charCodeAt(ci);
      wordHash = wordHash & wordHash; // Convert to 32-bit integer
    }
    
    const index = Math.abs(wordHash) % EMBEDDING_DIMENSIONS;
    embedding[index] += 1.0 / Math.sqrt(words.length);
  }
  
  // Normalize the vector
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    for (let i = 0; i < EMBEDDING_DIMENSIONS; i++) {
      embedding[i] /= magnitude;
    }
  }
  
  return embedding;
}

/**
 * Generate embeddings for multiple texts in batch
 * Processes in parallel with rate limiting
 */
export async function generateEmbeddingsBatch(
  texts: string[],
  batchSize: number = 5
): Promise<number[][]> {
  console.log(`🧮 Generating ${texts.length} embeddings (batch size: ${batchSize})...`);
  
  const embeddings: number[][] = [];
  
  // Process in batches to avoid rate limits
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    console.log(`  Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(texts.length/batchSize)}...`);
    
    try {
      const batchEmbeddings = await Promise.all(
        batch.map(text => generateEmbedding(text))
      );
      embeddings.push(...batchEmbeddings);
      
      // Small delay between batches to avoid rate limits
      if (i + batchSize < texts.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error(`❌ Batch ${Math.floor(i/batchSize) + 1} failed:`, error);
      throw error;
    }
  }
  
  console.log(`✅ Generated ${embeddings.length} embeddings`);
  return embeddings;
}

/**
 * Calculate cosine similarity between two vectors
 * Returns value between -1 and 1 (1 = identical, 0 = orthogonal, -1 = opposite)
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vector dimension mismatch: ${a.length} vs ${b.length}`);
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  
  if (denominator === 0) {
    return 0;
  }

  return dotProduct / denominator;
}

/**
 * Find top K most similar chunks to a query
 */
export function findTopKSimilar<T extends { embedding: number[] }>(
  queryEmbedding: number[],
  chunks: T[],
  k: number = 5,
  minSimilarity: number = 0.3
): Array<{ chunk: T; similarity: number }> {
  // Calculate similarities
  const similarities = chunks.map(chunk => ({
    chunk,
    similarity: cosineSimilarity(queryEmbedding, chunk.embedding)
  }));

  // Filter by minimum similarity
  const filtered = similarities.filter(s => s.similarity >= minSimilarity);

  // Sort by similarity (descending)
  filtered.sort((a, b) => b.similarity - a.similarity);

  // Return top k
  return filtered.slice(0, k);
}

/**
 * Estimate cost of generating embeddings
 */
export function estimateEmbeddingCost(totalCharacters: number): number {
  // Cost: $0.025 per 1M characters
  return (totalCharacters / 1_000_000) * 0.025;
}

/**
 * Get embedding model info
 */
export function getEmbeddingModelInfo() {
  return {
    model: EMBEDDING_MODEL,
    dimensions: EMBEDDING_DIMENSIONS,
    costPer1MChars: 0.025,
    provider: 'Vertex AI',
    capabilities: [
      'Multilingual support',
      'Semantic search',
      'High quality embeddings',
      'Fast generation (<100ms per chunk)'
    ]
  };
}

