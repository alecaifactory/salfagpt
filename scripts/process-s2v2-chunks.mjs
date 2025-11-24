#!/usr/bin/env node

/**
 * Process chunks and embeddings for ALL S2-v2 documents
 * 
 * Steps:
 * 1. Get all sources assigned to S2-v2
 * 2. For each source, create chunks (500 tokens, 50 overlap)
 * 3. Generate embeddings for each chunk
 * 4. Save to BigQuery
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { BigQuery } from '@google-cloud/bigquery';
import { GoogleGenAI } from '@google/genai';

// Initialize Firebase
initializeApp({ projectId: 'salfagpt' });
const db = getFirestore();
const bigquery = new BigQuery({ projectId: 'salfagpt' });

// Initialize Gemini - Load API key properly
import { readFileSync } from 'fs';

function getAPIKey() {
  // Try process.env first
  if (process.env.GOOGLE_AI_API_KEY) {
    return process.env.GOOGLE_AI_API_KEY.trim();
  }
  
  // Read from .env.salfacorp file
  try {
    const envContent = readFileSync('.env.salfacorp', 'utf-8');
    const match = envContent.match(/GOOGLE_AI_API_KEY=([^\n\r]+)/);
    if (match && match[1]) {
      return match[1].trim();
    }
  } catch (error) {
    // Try .env
    try {
      const envContent = readFileSync('.env', 'utf-8');
      const match = envContent.match(/GOOGLE_AI_API_KEY=([^\n\r]+)/);
      if (match && match[1]) {
        return match[1].trim();
      }
    } catch (e) {}
  }
  
  return null;
}

const GOOGLE_AI_API_KEY = getAPIKey();
if (!GOOGLE_AI_API_KEY) {
  console.error('❌ GOOGLE_AI_API_KEY not found in .env or .env.salfacorp');
  process.exit(1);
}

console.log(`🔑 API Key loaded: ${GOOGLE_AI_API_KEY.substring(0, 20)}...${GOOGLE_AI_API_KEY.substring(GOOGLE_AI_API_KEY.length - 4)}\n`);

// Constants
const S2V2_AGENT_ID = '1lgr33ywq5qed67sqCYi';
const USER_ID = 'usr_uhwqffaqag1wrryd82tw';
const CHUNK_SIZE = 500; // tokens
const CHUNK_OVERLAP = 50; // tokens

/**
 * Simple token counter (approximate)
 */
function countTokens(text) {
  // Rough approximation: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}

/**
 * Chunk text into overlapping segments
 */
function chunkText(text, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
  const tokens = text.split(/\s+/); // Split by whitespace
  const chunks = [];
  let position = 0;
  
  while (position < tokens.length) {
    const chunkTokens = tokens.slice(position, position + chunkSize);
    const chunkText = chunkTokens.join(' ');
    
    if (chunkText.trim().length > 0) {
      chunks.push({
        text: chunkText,
        startPosition: position,
        endPosition: position + chunkTokens.length,
        tokenCount: chunkTokens.length
      });
    }
    
    position += chunkSize - overlap;
  }
  
  return chunks;
}

/**
 * Generate embedding for text using Gemini REST API
 */
async function generateEmbedding(text) {
  try {
    const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent';
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'x-goog-api-key': GOOGLE_AI_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'models/text-embedding-004',
        content: {
          parts: [{ text: String(text) }]
        },
        taskType: 'RETRIEVAL_DOCUMENT',
        outputDimensionality: 768
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error ${response.status}: ${errorText.substring(0, 200)}`);
    }
    
    const result = await response.json();
    const embedding = result.embedding?.values;
    
    if (!embedding || !Array.isArray(embedding) || embedding.length !== 768) {
      console.error('  ❌ Invalid embedding response');
      return null;
    }
    
    return embedding;
  } catch (error) {
    console.error('  ❌ Embedding error:', error.message);
    return null;
  }
}

/**
 * Save chunks to BigQuery
 */
async function saveChunksToBigQuery(chunks, sourceId, sourceName, userId) {
  try {
    const rows = chunks.map(chunk => ({
      chunk_id: chunk.id,
      source_id: sourceId,
      source_name: sourceName,
      user_id: userId,
      chunk_index: chunk.index,
      text_preview: chunk.text.substring(0, 200),
      full_text: chunk.text,
      embedding: chunk.embedding,
      token_count: chunk.tokenCount,
      created_at: new Date().toISOString(),
      metadata: JSON.stringify({
        start_position: chunk.startPosition,
        end_position: chunk.endPosition
      })
    }));
    
    await bigquery
      .dataset('flow_analytics')
      .table('document_chunks')
      .insert(rows);
    
    return true;
  } catch (error) {
    console.error('  ❌ BigQuery error:', error.message);
    return false;
  }
}

/**
 * Process single source
 */
async function processSource(source, index, total) {
  console.log(`\n[${index + 1}/${total}] Processing: ${source.name}`);
  console.log(`  Size: ${(source.extractedData?.length || 0).toLocaleString()} chars`);
  
  if (!source.extractedData || source.extractedData.length < 100) {
    console.log('  ⚠️ Skipping - No extracted data');
    return { success: false, chunks: 0, embeddings: 0 };
  }
  
  // Step 1: Create chunks
  console.log('  1/3 Creating chunks...');
  const textChunks = chunkText(source.extractedData, CHUNK_SIZE, CHUNK_OVERLAP);
  console.log(`  ✓ Created ${textChunks.length} chunks`);
  
  // Step 2: Generate embeddings
  console.log('  2/3 Generating embeddings...');
  const chunksWithEmbeddings = [];
  let embeddingCount = 0;
  
  for (let i = 0; i < textChunks.length; i++) {
    const chunk = textChunks[i];
    
    // Show progress every 10 chunks
    if (i % 10 === 0 && i > 0) {
      process.stdout.write(`      ${i}/${textChunks.length}...\r`);
    }
    
    const embedding = await generateEmbedding(chunk.text);
    
    if (embedding && embedding.length === 768) {
      chunksWithEmbeddings.push({
        id: `${source.id}_chunk_${i}`,
        index: i,
        text: chunk.text,
        embedding: embedding,
        tokenCount: chunk.tokenCount,
        startPosition: chunk.startPosition,
        endPosition: chunk.endPosition
      });
      embeddingCount++;
    }
    
    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`  ✓ Generated ${embeddingCount} embeddings`);
  
  // Step 3: Save to BigQuery
  if (chunksWithEmbeddings.length > 0) {
    console.log('  3/3 Saving to BigQuery...');
    const saved = await saveChunksToBigQuery(
      chunksWithEmbeddings,
      source.id,
      source.name,
      USER_ID
    );
    
    if (saved) {
      console.log(`  ✅ Saved ${chunksWithEmbeddings.length} chunks to BigQuery`);
      return { 
        success: true, 
        chunks: textChunks.length, 
        embeddings: embeddingCount 
      };
    }
  }
  
  return { success: false, chunks: 0, embeddings: 0 };
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Processing chunks and embeddings for S2-v2\n');
  console.log('═══════════════════════════════════════');
  console.log(`Agent: S2-v2 (${S2V2_AGENT_ID})`);
  console.log(`User: ${USER_ID}`);
  console.log(`Chunk size: ${CHUNK_SIZE} tokens`);
  console.log(`Overlap: ${CHUNK_OVERLAP} tokens`);
  console.log('═══════════════════════════════════════\n');
  
  const startTime = Date.now();
  
  try {
    // Get all assigned sources
    console.log('Loading assigned sources...');
    const agentSourcesSnapshot = await db.collection('agent_sources')
      .where('agentId', '==', S2V2_AGENT_ID)
      .get();
    
    if (agentSourcesSnapshot.empty) {
      console.error('❌ No sources assigned to S2-v2');
      console.error('   Run: npx tsx scripts/assign-all-s002-to-s2v2.mjs');
      process.exit(1);
    }
    
    const sourceIds = agentSourcesSnapshot.docs.map(doc => doc.data().sourceId);
    console.log(`✅ Found ${sourceIds.length} assigned sources\n`);
    
    // Get source documents
    console.log('Loading source documents...');
    const sources = [];
    
    for (const sourceId of sourceIds) {
      const doc = await db.collection('context_sources').doc(sourceId).get();
      if (doc.exists) {
        sources.push({
          id: doc.id,
          ...doc.data()
        });
      }
    }
    
    console.log(`✅ Loaded ${sources.length} source documents\n`);
    
    // Process each source
    const results = {
      total: sources.length,
      success: 0,
      failed: 0,
      totalChunks: 0,
      totalEmbeddings: 0
    };
    
    for (let i = 0; i < sources.length; i++) {
      const result = await processSource(sources[i], i, sources.length);
      
      if (result.success) {
        results.success++;
        results.totalChunks += result.chunks;
        results.totalEmbeddings += result.embeddings;
      } else {
        results.failed++;
      }
    }
    
    // Summary
    const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    
    console.log('\n═══════════════════════════════════════');
    console.log('✅ PROCESSING COMPLETE\n');
    console.log(`Total sources: ${results.total}`);
    console.log(`Successful: ${results.success}`);
    console.log(`Failed: ${results.failed}`);
    console.log(`Total chunks: ${results.totalChunks.toLocaleString()}`);
    console.log(`Total embeddings: ${results.totalEmbeddings.toLocaleString()}`);
    console.log(`Duration: ${duration} minutes`);
    console.log('═══════════════════════════════════════\n');
    
    // Estimated cost
    const embeddingCost = results.totalEmbeddings * 0.00001;
    console.log(`💰 Estimated cost: $${embeddingCost.toFixed(4)}\n`);
    
    console.log('📋 Next steps:');
    console.log('1. Test RAG: npx tsx scripts/test-s2v2-rag.mjs');
    console.log('2. Open S2-v2 in UI and ask a technical question');
    console.log('3. Verify references [1], [2], etc. appear\n');
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

main()
  .then(() => {
    console.log('✅ All done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });

