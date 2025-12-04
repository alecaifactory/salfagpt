#!/usr/bin/env node

/**
 * Test OGUC Document with RAG Queries
 * Verify that M3-v2 can answer questions about the OGUC document
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { BigQuery } from '@google-cloud/bigquery';
import { generateEmbedding } from './src/lib/embeddings.js';

initializeApp({ projectId: 'salfagpt' });
const db = getFirestore();
const bigquery = new BigQuery({ projectId: 'salfagpt' });

const M3V2_AGENT_ID = 'vStojK73ZKbjNsEnqANJ';
const USER_ID = 'usr_uhwqffaqag1wrryd82tw';
const DATASET = 'flow_rag_optimized';
const TABLE = 'document_chunks_vectorized';

// Test queries about OGUC
const TEST_QUERIES = [
  {
    query: '¿Qué es un desmonte según la OGUC?',
    expectedKeywords: ['desmonte', 'terreno', 'cerro', 'rebaje'],
    description: 'Definition test'
  },
  {
    query: '¿Cuándo entró en vigencia la OGUC?',
    expectedKeywords: ['1992', 'mayo', 'D.O.', 'vigencia'],
    description: 'Date/history test'
  },
  {
    query: '¿Qué modificaciones tiene el D.S. 47?',
    expectedKeywords: ['D.S.', '47', 'modificaciones', 'ordenanza'],
    description: 'Specific regulation test'
  }
];

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a, b) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Search for relevant chunks using BigQuery vector search
 */
async function searchChunks(queryText, topK = 5) {
  console.log(`   🔍 Generating query embedding...`);
  const queryEmbedding = await generateEmbedding(queryText);
  
  console.log(`   📊 Searching BigQuery (${DATASET}.${TABLE})...`);
  
  const sqlQuery = `
    SELECT 
      chunk_id,
      source_id,
      chunk_index,
      text_preview,
      full_text,
      metadata
    FROM \`salfagpt.${DATASET}.${TABLE}\`
    WHERE user_id = @userId
    ORDER BY chunk_index
    LIMIT 100
  `;
  
  const [allChunks] = await bigquery.query({
    query: sqlQuery,
    params: { userId: USER_ID }
  });
  
  console.log(`   ✅ Loaded ${allChunks.length} chunks from BigQuery`);
  
  // Calculate similarities
  const results = allChunks.map(chunk => {
    const embedding = chunk.embedding || [];
    const similarity = cosineSimilarity(queryEmbedding, embedding);
    
    return {
      chunk_id: chunk.chunk_id,
      source_id: chunk.source_id,
      chunk_index: chunk.chunk_index,
      text: chunk.full_text || chunk.text_preview,
      similarity
    };
  });
  
  // Sort by similarity and take top K
  results.sort((a, b) => b.similarity - a.similarity);
  const topResults = results.slice(0, topK);
  
  console.log(`   🎯 Top ${topK} results (similarity > 0.3):`);
  topResults.forEach((r, i) => {
    if (r.similarity >= 0.3) {
      console.log(`      ${i+1}. Chunk ${r.chunk_index}: ${(r.similarity * 100).toFixed(1)}% similar`);
      console.log(`         Text: "${r.text.substring(0, 100)}..."`);
    }
  });
  
  return topResults;
}

/**
 * Test a single query
 */
async function testQuery(testCase, index, total) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`TEST ${index + 1}/${total}: ${testCase.description}`);
  console.log('═'.repeat(60));
  console.log(`❓ Query: "${testCase.query}"`);
  console.log();
  
  const startTime = Date.now();
  
  try {
    const results = await searchChunks(testCase.query, 3);
    const duration = Date.now() - startTime;
    
    // Check if any result has good similarity
    const bestSimilarity = results[0]?.similarity || 0;
    const hasGoodMatch = bestSimilarity >= 0.3;
    
    // Check if keywords found
    const topTexts = results.slice(0, 3).map(r => r.text.toLowerCase()).join(' ');
    const keywordsFound = testCase.expectedKeywords.filter(kw => 
      topTexts.includes(kw.toLowerCase())
    );
    
    console.log(`\n📊 Results:`);
    console.log(`   Best similarity: ${(bestSimilarity * 100).toFixed(1)}%`);
    console.log(`   Keywords found: ${keywordsFound.length}/${testCase.expectedKeywords.length}`);
    console.log(`   Duration: ${duration}ms`);
    console.log();
    
    if (hasGoodMatch && keywordsFound.length >= 1) {
      console.log(`✅ PASSED - Relevant content found`);
      return { passed: true, similarity: bestSimilarity, duration };
    } else {
      console.log(`⚠️  PARTIAL - Low similarity or missing keywords`);
      return { passed: false, similarity: bestSimilarity, duration };
    }
    
  } catch (error) {
    console.error(`❌ FAILED - Error: ${error.message}`);
    return { passed: false, error: error.message };
  }
}

/**
 * Main test suite
 */
async function main() {
  console.log('🧪 OGUC DOCUMENT RAG TEST SUITE');
  console.log('═'.repeat(60));
  console.log();
  console.log('📄 Document: OGUC Septiembre 2025');
  console.log('🆔 Source ID: d3w7m98Yymsm1rAJlFpE');
  console.log('🤖 Agent: M3-v2 (GOP GPT)');
  console.log('👤 User: usr_uhwqffaqag1wrryd82tw');
  console.log();
  
  const results = [];
  
  for (let i = 0; i < TEST_QUERIES.length; i++) {
    const result = await testQuery(TEST_QUERIES[i], i, TEST_QUERIES.length);
    results.push(result);
    
    // Small delay between tests
    if (i < TEST_QUERIES.length - 1) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  
  // Final summary
  console.log('\n\n' + '═'.repeat(60));
  console.log('📊 FINAL SUMMARY');
  console.log('═'.repeat(60));
  console.log();
  
  const passed = results.filter(r => r.passed).length;
  const avgDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0) / results.length;
  const avgSimilarity = results.reduce((sum, r) => sum + (r.similarity || 0), 0) / results.length;
  
  console.log(`Tests passed: ${passed}/${results.length} (${(passed/results.length*100).toFixed(1)}%)`);
  console.log(`Average similarity: ${(avgSimilarity * 100).toFixed(1)}%`);
  console.log(`Average duration: ${avgDuration.toFixed(0)}ms`);
  console.log();
  
  if (passed === results.length) {
    console.log('✅ ALL TESTS PASSED - OGUC document fully operational! 🎉');
  } else if (passed >= results.length / 2) {
    console.log('⚠️  PARTIAL SUCCESS - Some queries working');
  } else {
    console.log('❌ MOST TESTS FAILED - Check indexing');
  }
  console.log();
  
  console.log('🎯 Next steps:');
  console.log('   1. Try queries in production UI');
  console.log('   2. Ask: "¿Qué es un desmonte según la OGUC?"');
  console.log('   3. Verify citations reference the OGUC document');
  console.log();
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  });

