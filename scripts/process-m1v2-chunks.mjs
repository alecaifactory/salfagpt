#!/usr/bin/env node

/**
 * Process chunks and embeddings for M1-v2 - ASISTENTE LEGAL TERRITORIAL RDI
 * Uses the existing embeddings.ts module from src/lib
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { BigQuery } from '@google-cloud/bigquery';
import { generateEmbedding } from '../src/lib/embeddings.js';

// Initialize
initializeApp({ projectId: 'salfagpt' });
const db = getFirestore();
const bigquery = new BigQuery({ projectId: 'salfagpt' });

const M1V2_AGENT_ID = 'EgXezLcu4O3IUqFUJhUZ';
const USER_ID = 'usr_uhwqffaqag1wrryd82tw';
const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 50;

// Simple chunking
function chunkText(text, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
  const words = text.split(/\s+/);
  const chunks = [];
  let position = 0;
  
  while (position < words.length) {
    const chunkWords = words.slice(position, position + chunkSize);
    const chunkText = chunkWords.join(' ');
    
    if (chunkText.trim().length > 20) {
      chunks.push({
        text: chunkText,
        startPosition: position,
        endPosition: position + chunkWords.length
      });
    }
    
    position += chunkSize - overlap;
  }
  
  return chunks;
}

// Save to BigQuery
async function saveChunksToBigQuery(chunks, sourceId, sourceName, userId) {
  if (chunks.length === 0) return false;
  
  try {
    // ✅ BACKWARD COMPATIBLE: Only fields that exist in BigQuery schema
    const rows = chunks.map(chunk => ({
      chunk_id: chunk.id,
      source_id: sourceId,
      user_id: userId,
      chunk_index: chunk.index,
      text_preview: chunk.text.substring(0, 500), // Max 500 chars per schema
      full_text: chunk.text,
      embedding: chunk.embedding,
      // ✅ BACKWARD COMPATIBLE: Move extra fields to metadata JSON
      metadata: JSON.stringify({
        source_name: sourceName,           // For display in results
        token_count: Math.ceil(chunk.text.length / 4),
        start_position: chunk.startPosition,
        end_position: chunk.endPosition,
        chunk_text_length: chunk.text.length,
        processed_at: new Date().toISOString(),
        processor: 'process-s2v2-chunks-v2',
        version: '2.0'
      }),
      created_at: new Date().toISOString()
    }));
    
    await bigquery
      .dataset('flow_analytics')
      .table('document_embeddings')
      .insert(rows);
    
    return true;
  } catch (error) {
    console.error('  ❌ BigQuery error:', error.message);
    // Log detailed error if available
    if (error.errors && error.errors.length > 0) {
      console.error('  Details:', JSON.stringify(error.errors[0], null, 2));
    }
    return false;
  }
}

// Process single source
async function processSource(source, index, total) {
  const docNum = `[${index + 1}/${total}]`;
  console.log(`\n${docNum} ${source.name}`);
  console.log(`  📄 ${(source.extractedData?.length || 0).toLocaleString()} chars`);
  
  if (!source.extractedData || source.extractedData.length < 100) {
    console.log('  ⏭️  Skip - No data');
    return { success: false, reason: 'no_data' };
  }
  
  // Chunk
  const textChunks = chunkText(source.extractedData);
  console.log(`  ✂️  ${textChunks.length} chunks`);
  
  if (textChunks.length === 0) {
    console.log('  ⏭️  Skip - No chunks');
    return { success: false, reason: 'no_chunks' };
  }
  
  // Generate embeddings
  console.log(`  🧮 Generating embeddings...`);
  const chunksWithEmbeddings = [];
  
  for (let i = 0; i < textChunks.length; i++) {
    const chunk = textChunks[i];
    
    // Progress indicator
    if (i % 10 === 0 && i > 0) {
      process.stdout.write(`     ${i}/${textChunks.length}...\r`);
    }
    
    const embedding = await generateEmbedding(chunk.text);
    
    if (embedding && embedding.length === 768) {
      chunksWithEmbeddings.push({
        id: `${source.id}_${i}`,
        index: i,
        text: chunk.text,
        embedding,
        startPosition: chunk.startPosition,
        endPosition: chunk.endPosition
      });
    }
    
    // Rate limit protection
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`  ✅ ${chunksWithEmbeddings.length}/${textChunks.length} embeddings`);
  
  // Save to BigQuery
  if (chunksWithEmbeddings.length > 0) {
    const saved = await saveChunksToBigQuery(
      chunksWithEmbeddings,
      source.id,
      source.name,
      USER_ID
    );
    
    if (saved) {
      console.log(`  💾 Saved to BigQuery`);
      return { 
        success: true, 
        chunks: chunksWithEmbeddings.length 
      };
    }
  }
  
  return { success: false, reason: 'save_failed' };
}

// Main
async function main() {
  console.log('🚀 M1-v2 Chunk Processing - ASISTENTE LEGAL TERRITORIAL RDI\n');
  console.log('Using src/lib/embeddings.ts (REST API)\n');
  
  const startTime = Date.now();
  
  // Get assignments
  const assignmentsSnapshot = await db.collection('agent_sources')
    .where('agentId', '==', M1V2_AGENT_ID)
    .get();
  
  if (assignmentsSnapshot.empty) {
    console.error('❌ No assignments found');
    process.exit(1);
  }
  
  const sourceIds = assignmentsSnapshot.docs.map(d => d.data().sourceId);
  console.log(`✅ ${sourceIds.length} sources assigned\n`);
  
  // Load sources (batch of 100)
  console.log('📥 Loading source documents...');
  const sources = [];
  
  for (let i = 0; i < sourceIds.length; i += 100) {
    const batch = sourceIds.slice(i, i + 100);
    const docs = await Promise.all(
      batch.map(id => db.collection('context_sources').doc(id).get())
    );
    
    docs.forEach(doc => {
      if (doc.exists) {
        sources.push({ id: doc.id, ...doc.data() });
      }
    });
    
    console.log(`  Loaded ${sources.length}/${sourceIds.length}...`);
  }
  
  console.log(`✅ ${sources.length} documents loaded\n`);
  
  // Process
  const stats = {
    total: sources.length,
    success: 0,
    failed: 0,
    totalChunks: 0,
    skipped: { no_data: 0, no_chunks: 0 }
  };
  
  for (let i = 0; i < sources.length; i++) {
    const result = await processSource(sources[i], i, sources.length);
    
    if (result.success) {
      stats.success++;
      stats.totalChunks += result.chunks || 0;
    } else {
      stats.failed++;
      if (result.reason) {
        stats.skipped[result.reason] = (stats.skipped[result.reason] || 0) + 1;
      }
    }
  }
  
  // Summary
  const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  
  console.log('\n' + '═'.repeat(50));
  console.log('✅ PROCESSING COMPLETE\n');
  console.log(`Total: ${stats.total}`);
  console.log(`Success: ${stats.success}`);
  console.log(`Failed: ${stats.failed}`);
  console.log(`  - No data: ${stats.skipped.no_data || 0}`);
  console.log(`  - No chunks: ${stats.skipped.no_chunks || 0}`);
  console.log(`Total chunks: ${stats.totalChunks.toLocaleString()}`);
  console.log(`Duration: ${duration} min`);
  console.log(`Cost: ~$${(stats.totalChunks * 0.00001).toFixed(4)}`);
  console.log('═'.repeat(50) + '\n');
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Fatal:', err);
    process.exit(1);
  });

