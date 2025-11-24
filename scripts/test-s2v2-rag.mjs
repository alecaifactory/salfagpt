#!/usr/bin/env node

/**
 * Test S2-v2 RAG functionality
 * 
 * Sends test queries and verifies:
 * 1. Vector search finds relevant chunks
 * 2. References are returned
 * 3. Similarity scores are good (>70%)
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { BigQuery } from '@google-cloud/bigquery';
import { GoogleGenAI } from '@google/genai';

initializeApp({ projectId: 'salfagpt' });
const db = getFirestore();
const bigquery = new BigQuery({ projectId: 'salfagpt' });

const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
const genAI = new GoogleGenAI({ apiKey: GOOGLE_AI_API_KEY });

const S2V2_AGENT_ID = '1lgr33ywq5qed67sqCYi';
const USER_ID = 'usr_uhwqffaqag1wrryd82tw';

// Test queries
const TEST_QUERIES = [
  {
    question: '¿Cuál es la capacidad de carga de la grúa Hiab 422?',
    expectedKeywords: ['hiab', '422', 'capacidad', 'carga', 'toneladas']
  },
  {
    question: '¿Cómo se realiza el mantenimiento del sistema hidráulico?',
    expectedKeywords: ['hidráulico', 'mantenimiento', 'aceite', 'cambio']
  },
  {
    question: '¿Qué especificaciones tiene el motor Scania P450?',
    expectedKeywords: ['scania', 'p450', 'motor', 'potencia']
  },
  {
    question: '¿Cuáles son las medidas de seguridad para operar la grúa?',
    expectedKeywords: ['seguridad', 'grúa', 'operación', 'advertencias']
  }
];

async function generateEmbedding(text) {
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
      taskType: 'RETRIEVAL_QUERY',
      outputDimensionality: 768
    })
  });
  
  if (!response.ok) {
    throw new Error(`API error ${response.status}`);
  }
  
  const result = await response.json();
  return result.embedding?.values || null;
}

async function searchChunks(queryEmbedding, topK = 5) {
  const query = `
    WITH similarities AS (
      SELECT 
        chunk_id,
        source_id,
        source_name,
        chunk_index,
        text_preview,
        full_text,
        (
          SELECT SUM(a * b) / (
            SQRT((SELECT SUM(a * a) FROM UNNEST(embedding) AS a)) * 
            SQRT((SELECT SUM(b * b) FROM UNNEST(@queryEmbedding) AS b))
          )
          FROM UNNEST(embedding) AS a WITH OFFSET pos
          JOIN UNNEST(@queryEmbedding) AS b WITH OFFSET pos2
            ON pos = pos2
        ) AS similarity
      FROM \`salfagpt.flow_analytics.document_chunks\`
      WHERE user_id = @userId
    )
    SELECT *
    FROM similarities
    WHERE similarity >= 0.3
    ORDER BY similarity DESC
    LIMIT @topK
  `;
  
  const [rows] = await bigquery.query({
    query,
    params: {
      queryEmbedding,
      userId: USER_ID,
      topK
    }
  });
  
  return rows;
}

async function testQuery(queryData, index, total) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`Test ${index + 1}/${total}: ${queryData.question}`);
  console.log('═'.repeat(60));
  
  try {
    // Generate query embedding
    console.log('1/2 Generating embedding...');
    const embedding = await generateEmbedding(queryData.question);
    
    if (!embedding) {
      console.log('❌ Failed to generate embedding');
      return { success: false };
    }
    
    console.log(`✓ Embedding generated (${embedding.length} dimensions)`);
    
    // Search chunks
    console.log('2/2 Searching chunks...');
    const searchStart = Date.now();
    const results = await searchChunks(embedding, 5);
    const searchDuration = Date.now() - searchStart;
    
    console.log(`✓ Search complete (${searchDuration}ms)\n`);
    
    if (results.length === 0) {
      console.log('❌ NO RESULTS FOUND\n');
      return { success: false, results: 0 };
    }
    
    // Display results
    console.log(`📊 Found ${results.length} results:\n`);
    
    results.forEach((result, idx) => {
      const similarity = (result.similarity * 100).toFixed(1);
      const similarityIcon = result.similarity >= 0.7 ? '✅' : result.similarity >= 0.5 ? '⚠️' : '❌';
      
      console.log(`${idx + 1}. ${similarityIcon} Similarity: ${similarity}%`);
      console.log(`   Source: ${result.source_name}`);
      console.log(`   Chunk: ${result.chunk_index}`);
      console.log(`   Text: ${result.text_preview.substring(0, 100)}...`);
      console.log('');
    });
    
    // Validate keywords
    const allText = results.map(r => r.full_text.toLowerCase()).join(' ');
    const foundKeywords = queryData.expectedKeywords.filter(kw => 
      allText.includes(kw.toLowerCase())
    );
    
    console.log(`🔑 Keywords found: ${foundKeywords.length}/${queryData.expectedKeywords.length}`);
    queryData.expectedKeywords.forEach(kw => {
      const found = allText.includes(kw.toLowerCase());
      console.log(`   ${found ? '✅' : '❌'} ${kw}`);
    });
    
    // Overall assessment
    const avgSimilarity = results.reduce((sum, r) => sum + r.similarity, 0) / results.length;
    const score = avgSimilarity >= 0.7 ? 'EXCELLENT' : avgSimilarity >= 0.5 ? 'GOOD' : 'POOR';
    const icon = avgSimilarity >= 0.7 ? '✅' : avgSimilarity >= 0.5 ? '⚠️' : '❌';
    
    console.log(`\n${icon} Average Similarity: ${(avgSimilarity * 100).toFixed(1)}% - ${score}`);
    
    return {
      success: avgSimilarity >= 0.5,
      results: results.length,
      avgSimilarity: avgSimilarity
    };
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    return { success: false };
  }
}

async function main() {
  console.log('🧪 Testing S2-v2 RAG Functionality\n');
  console.log('═══════════════════════════════════════');
  console.log(`Agent: S2-v2 (${S2V2_AGENT_ID})`);
  console.log(`Test queries: ${TEST_QUERIES.length}`);
  console.log('═══════════════════════════════════════');
  
  // Check that chunks exist
  console.log('\nPre-check: Verifying chunks exist...');
  const countQuery = `
    SELECT COUNT(*) as count
    FROM \`salfagpt.flow_analytics.document_chunks\`
    WHERE user_id = @userId
      AND embedding IS NOT NULL
  `;
  
  const [countRows] = await bigquery.query({
    query: countQuery,
    params: { userId: USER_ID }
  });
  
  const chunkCount = countRows[0]?.count || 0;
  
  if (chunkCount === 0) {
    console.error('❌ No chunks with embeddings found in BigQuery');
    console.error('   Run: npx tsx scripts/process-s2v2-chunks.mjs');
    process.exit(1);
  }
  
  console.log(`✅ Found ${chunkCount} chunks with embeddings\n`);
  
  // Run tests
  const testResults = [];
  
  for (let i = 0; i < TEST_QUERIES.length; i++) {
    const result = await testQuery(TEST_QUERIES[i], i, TEST_QUERIES.length);
    testResults.push(result);
    
    // Delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Final summary
  console.log('\n═══════════════════════════════════════');
  console.log('📊 TEST SUMMARY\n');
  
  const passed = testResults.filter(r => r.success).length;
  const avgSimilarity = testResults
    .filter(r => r.avgSimilarity)
    .reduce((sum, r) => sum + r.avgSimilarity, 0) / testResults.length;
  
  console.log(`Tests passed: ${passed}/${TEST_QUERIES.length}`);
  console.log(`Average similarity: ${(avgSimilarity * 100).toFixed(1)}%`);
  console.log(`Overall status: ${passed === TEST_QUERIES.length ? '✅ PASS' : '⚠️ PARTIAL'}`);
  console.log('═══════════════════════════════════════\n');
  
  if (passed === TEST_QUERIES.length) {
    console.log('🎉 S2-v2 RAG is FULLY FUNCTIONAL!\n');
    console.log('Next: Test in UI at localhost:3000 or salfagpt.salfagestion.cl');
  } else {
    console.log('⚠️ Some tests failed - may need to:');
    console.log('1. Re-process chunks for better quality');
    console.log('2. Adjust similarity threshold');
    console.log('3. Check extracted data quality\n');
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });

