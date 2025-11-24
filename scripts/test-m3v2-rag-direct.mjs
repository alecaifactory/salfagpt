#!/usr/bin/env node

/**
 * Direct RAG Test for M3-v2 - Using flow_analytics.document_embeddings
 * Bypasses routing to test directly against the correct table
 */

import { initializeApp } from 'firebase-admin/app';
import { BigQuery } from '@google-cloud/bigquery';
import { generateEmbedding } from '../src/lib/embeddings.js';

initializeApp({ projectId: 'salfagpt' });
const bq = new BigQuery({ projectId: 'salfagpt' });

const USER_ID = 'usr_uhwqffaqag1wrryd82tw';
const AGENT_ID = 'vStojK73ZKbjNsEnqANJ'; // M3-v2 GOP GPT

// Test questions
const QUESTIONS = [
  "¿Qué debo hacer antes de comenzar una obra de edificación?",
  "¿Qué documentos necesito para el Panel Financiero de un proyecto afecto?",
  "Tengo un vecino molesto por el polvo de la obra, ¿qué debo hacer?",
  "Respuesta corta: ¿Qué reuniones debo tener según gestión de construcción en obra?"
];

async function testQuestion(question, index) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📝 Question ${index + 1}/4`);
  console.log('='.repeat(80));
  console.log(`\n❓ ${question}\n`);
  
  const startTime = Date.now();
  
  try {
    // 1. Generate query embedding
    console.log('🧮 1/3 Generating query embedding...');
    const queryEmbedding = await generateEmbedding(question);
    console.log(`✅ Generated embedding: ${queryEmbedding.length} dimensions\n`);
    
    // 2. Search BigQuery directly
    console.log('🔍 2/3 Searching flow_analytics.document_embeddings...');
    
    const embeddingStr = queryEmbedding.join(',');
    
    const query = `
      WITH query_vector AS (
        SELECT [${embeddingStr}] AS query_embedding
      ),
      chunk_similarities AS (
        SELECT 
          chunk_id,
          source_id,
          chunk_index,
          text_preview,
          full_text,
          metadata,
          (
            SELECT SUM(query_val * doc_val) / (
              SQRT(SUM(query_val * query_val)) * SQRT(SUM(doc_val * doc_val))
            )
            FROM UNNEST((SELECT query_embedding FROM query_vector)) AS query_val WITH OFFSET AS query_idx
            JOIN UNNEST(embedding) AS doc_val WITH OFFSET AS doc_idx
            ON query_idx = doc_idx
          ) AS similarity
        FROM \`salfagpt.flow_analytics.document_embeddings\`,
             query_vector
        WHERE user_id = @userId
          AND embedding IS NOT NULL
          AND ARRAY_LENGTH(embedding) = 768
      )
      SELECT *
      FROM chunk_similarities
      WHERE similarity > 0.5
      ORDER BY similarity DESC
      LIMIT 5
    `;
    
    const [results] = await bq.query({
      query,
      params: { userId: USER_ID }
    });
    
    const duration = Date.now() - startTime;
    
    console.log(`✅ Found ${results.length} results in ${(duration/1000).toFixed(1)}s\n`);
    
    if (results.length === 0) {
      console.log('❌ NO RESULTS - Query returned empty\n');
      return {
        question,
        passed: false,
        chunks: 0,
        avgSimilarity: 0,
        duration
      };
    }
    
    // 3. Display results
    const avgSim = results.reduce((sum, r) => sum + parseFloat(r.similarity), 0) / results.length;
    
    console.log(`📊 3/3 Results Analysis:`);
    console.log(`   Average similarity: ${(avgSim * 100).toFixed(1)}%`);
    console.log(`   Chunks found: ${results.length}`);
    console.log(`   Search time: ${(duration/1000).toFixed(1)}s`);
    console.log('');
    
    console.log('📚 Top 3 chunks:\n');
    results.slice(0, 3).forEach((r, idx) => {
      const metadata = JSON.parse(r.metadata || '{}');
      console.log(`${idx + 1}. Similarity: ${(parseFloat(r.similarity) * 100).toFixed(1)}%`);
      console.log(`   Source: ${metadata.source_name || r.source_id}`);
      console.log(`   Preview: ${r.text_preview.substring(0, 100)}...`);
      console.log('');
    });
    
    const passed = avgSim >= 0.70 && results.length >= 3;
    
    console.log(passed ? '✅ PASSED' : '⚠️  BORDERLINE/FAILED');
    console.log('');
    
    return {
      question,
      passed,
      chunks: results.length,
      avgSimilarity: avgSim,
      duration,
      topResults: results.slice(0, 3).map(r => ({
        similarity: parseFloat(r.similarity),
        source: JSON.parse(r.metadata || '{}').source_name || r.source_id,
        preview: r.text_preview.substring(0, 200)
      }))
    };
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return {
      question,
      passed: false,
      error: error.message,
      duration: Date.now() - startTime
    };
  }
}

async function main() {
  console.log('🧪 M3-v2 Direct RAG Evaluation - GOP GPT');
  console.log('Using: flow_analytics.document_embeddings');
  console.log('=========================================\n');
  
  const results = [];
  
  for (let i = 0; i < QUESTIONS.length; i++) {
    const result = await testQuestion(QUESTIONS[i], i);
    results.push(result);
  }
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 EVALUATION SUMMARY');
  console.log('='.repeat(80) + '\n');
  
  const passed = results.filter(r => r.passed).length;
  const avgSim = results.reduce((sum, r) => sum + (r.avgSimilarity || 0), 0) / results.length;
  const avgTime = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
  
  console.log(`Agent: M3-v2 GOP GPT (${AGENT_ID})`);
  console.log(`Total questions: ${results.length}`);
  console.log(`Passed: ${passed}/${results.length} (${((passed/results.length)*100).toFixed(1)}%)`);
  console.log(`Average similarity: ${(avgSim * 100).toFixed(1)}%`);
  console.log(`Average search time: ${(avgTime/1000).toFixed(1)}s`);
  console.log('');
  
  results.forEach((r, idx) => {
    const status = r.passed ? '✅' : '❌';
    console.log(`${status} Q${idx + 1}: ${r.chunks} chunks, ${((r.avgSimilarity || 0) * 100).toFixed(1)}% similarity`);
  });
  
  console.log('\n' + '='.repeat(80));
  
  if (passed === results.length) {
    console.log('🎉 ALL EVALUATIONS PASSED!');
  } else if (passed >= results.length * 0.75) {
    console.log('✅ MOSTLY PASSED - Ready for production with minor tuning');
  } else {
    console.log('⚠️  NEEDS IMPROVEMENT - Check document coverage or similarity threshold');
  }
  
  console.log('='.repeat(80) + '\n');
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Fatal:', err);
    process.exit(1);
  });

