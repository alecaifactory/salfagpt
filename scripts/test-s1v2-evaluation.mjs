#!/usr/bin/env node

/**
 * Test S1-v2 RAG with official evaluation questions
 * 
 * Tests based on: Ficha de Asistente Virtual (MAQSA-GESTION-BODEGAS)
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { BigQuery } from '@google-cloud/bigquery';
import { generateEmbedding } from '../src/lib/embeddings.js';

initializeApp({ projectId: 'salfagpt' });
const db = getFirestore();
const bigquery = new BigQuery({ projectId: 'salfagpt' });

const AGENT_ID = 'iQmdg3bMSJ1AdqqlFpye';
const USER_ID = 'usr_uhwqffaqag1wrryd82tw';

// Official evaluation questions from requirements
const EVALUATION_QUESTIONS = [
  {
    id: 1,
    question: "¿Cómo hago un pedido de convenio?",
    expectedContent: ["ME21N", "ZCON", "tipo de pedido", "convenio"],
    expectedFormat: "Breve con pasos (3-5 viñetas), transacción destacada"
  },
  {
    id: 2,
    question: "¿Cuándo debo enviar el informe de consumo de petróleo?",
    expectedContent: ["4to día hábil", "mes siguiente", "ZMM_IE", "diésel"],
    expectedFormat: "Plazo claro primero, luego 3-4 viñetas con roles/transacción"
  },
  {
    id: 3,
    question: "¿Cómo se hace una Solped?",
    expectedContent: ["solicitud de pedido", "SAP", "ME51N o ME57", "crear"],
    expectedFormat: "Breve y conciso, pasos numerados"
  },
  {
    id: 4,
    question: "¿Cómo genero una guía de despacho?",
    expectedContent: ["guía despacho", "electrónica", "procedimiento", "emitir"],
    expectedFormat: "Pasos claros, transacción SAP si aplica"
  }
];

// RAG Search function (simplified from S2-v2)
async function ragSearch(query) {
  try {
    // 1. Generate query embedding
    const queryEmbedding = await generateEmbedding(query);
    
    if (!queryEmbedding || queryEmbedding.length !== 768) {
      throw new Error('Failed to generate query embedding');
    }
    
    // 2. Cosine similarity search in BigQuery
    const sqlQuery = `
      WITH query_embedding AS (
        SELECT ${JSON.stringify(queryEmbedding)} as qe
      ),
      similarities AS (
        SELECT 
          chunk_id,
          source_id,
          text_preview,
          full_text,
          metadata,
          (
            SELECT SUM(qe_val * emb_val)
            FROM UNNEST((SELECT qe FROM query_embedding)) AS qe_val WITH OFFSET AS qe_idx
            JOIN UNNEST(embedding) AS emb_val WITH OFFSET AS emb_idx
              ON qe_idx = emb_idx
          ) / (
            SQRT((SELECT SUM(qe_val * qe_val) FROM UNNEST((SELECT qe FROM query_embedding)) AS qe_val)) *
            SQRT((SELECT SUM(emb_val * emb_val) FROM UNNEST(embedding) AS emb_val))
          ) AS similarity
        FROM \`salfagpt.flow_analytics.document_embeddings\`
        WHERE user_id = @userId
          AND DATE(created_at) >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
      )
      SELECT *
      FROM similarities
      WHERE similarity > 0.5
      ORDER BY similarity DESC
      LIMIT 5
    `;
    
    const [rows] = await bigquery.query({
      query: sqlQuery,
      params: { userId: USER_ID }
    });
    
    return rows.map(row => ({
      chunkId: row.chunk_id,
      sourceId: row.source_id,
      preview: row.text_preview,
      fullText: row.full_text,
      similarity: row.similarity,
      metadata: JSON.parse(row.metadata || '{}')
    }));
  } catch (error) {
    console.error('RAG search error:', error.message);
    return [];
  }
}

// Test single question
async function testQuestion(evaluation) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`EVALUACIÓN ${evaluation.id}: ${evaluation.question}`);
  console.log('='.repeat(60));
  
  // Execute RAG search
  const results = await ragSearch(evaluation.question);
  
  if (results.length === 0) {
    console.log('❌ No results found\n');
    return {
      id: evaluation.id,
      question: evaluation.question,
      passed: false,
      results: 0,
      avgSimilarity: 0
    };
  }
  
  // Analyze results
  console.log(`\n✅ Found ${results.length} relevant chunks\n`);
  
  const avgSimilarity = results.reduce((sum, r) => sum + r.similarity, 0) / results.length;
  
  console.log('📊 Similarity scores:');
  results.forEach((r, idx) => {
    const pct = (r.similarity * 100).toFixed(1);
    const bar = '█'.repeat(Math.floor(r.similarity * 20));
    console.log(`  ${idx + 1}. ${bar} ${pct}% - ${r.metadata.source_name || 'Unknown'}`);
  });
  
  console.log(`\n📈 Average similarity: ${(avgSimilarity * 100).toFixed(1)}%`);
  
  // Show top reference
  console.log('\n📄 Top reference preview:');
  console.log(`   Source: ${results[0].metadata.source_name}`);
  console.log(`   Similarity: ${(results[0].similarity * 100).toFixed(1)}%`);
  console.log(`   Text: "${results[0].preview}..."\n`);
  
  // Check for expected content
  const topText = results[0].fullText.toLowerCase();
  const foundContent = evaluation.expectedContent.filter(term => 
    topText.includes(term.toLowerCase())
  );
  
  console.log(`🔍 Expected content check:`);
  evaluation.expectedContent.forEach(term => {
    const found = topText.includes(term.toLowerCase());
    console.log(`   ${found ? '✅' : '❌'} "${term}"`);
  });
  
  const passed = avgSimilarity > 0.70 && foundContent.length >= 2;
  
  console.log(`\n${passed ? '✅ PASSED' : '⚠️ REVIEW NEEDED'}`);
  console.log(`   Similarity: ${avgSimilarity > 0.70 ? '✅' : '❌'} ${(avgSimilarity * 100).toFixed(1)}% (>70%)`);
  console.log(`   Content: ${foundContent.length >= 2 ? '✅' : '❌'} ${foundContent.length}/${evaluation.expectedContent.length} terms found`);
  
  return {
    id: evaluation.id,
    question: evaluation.question,
    passed,
    results: results.length,
    avgSimilarity,
    topSource: results[0].metadata.source_name,
    foundTerms: foundContent.length,
    totalTerms: evaluation.expectedContent.length
  };
}

// Main
async function main() {
  console.log('🧪 S1-v2 RAG Evaluation Test');
  console.log('============================\n');
  console.log(`Agent: S1-v2 GESTION BODEGAS GPT (${AGENT_ID})`);
  console.log(`User: ${USER_ID}`);
  console.log(`Questions: ${EVALUATION_QUESTIONS.length}\n`);
  
  const startTime = Date.now();
  const results = [];
  
  for (const evaluation of EVALUATION_QUESTIONS) {
    const result = await testQuestion(evaluation);
    results.push(result);
    
    // Delay between queries
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  
  // Final summary
  console.log('\n\n' + '='.repeat(60));
  console.log('📊 EVALUATION SUMMARY');
  console.log('='.repeat(60) + '\n');
  
  console.log('| # | Question | Results | Avg Sim | Status |');
  console.log('|---|----------|---------|---------|--------|');
  
  results.forEach(r => {
    const simPct = (r.avgSimilarity * 100).toFixed(1) + '%';
    const status = r.passed ? '✅ PASS' : '⚠️ REVIEW';
    console.log(`| ${r.id} | ${r.question.substring(0, 40)}... | ${r.results} | ${simPct} | ${status} |`);
  });
  
  const passed = results.filter(r => r.passed).length;
  const totalAvgSim = results.reduce((sum, r) => sum + r.avgSimilarity, 0) / results.length;
  
  console.log(`\n## 🎯 Overall Results\n`);
  console.log(`- Passed: ${passed}/${results.length} (${((passed/results.length)*100).toFixed(1)}%)`);
  console.log(`- Average similarity: ${(totalAvgSim * 100).toFixed(1)}%`);
  console.log(`- Duration: ${duration}s`);
  console.log(`- Status: ${passed === results.length ? '✅ ALL PASSED' : '⚠️ NEEDS REVIEW'}\n`);
  
  if (passed === results.length) {
    console.log('✅ S1-v2 RAG is fully functional and ready for production!\n');
  } else {
    console.log('⚠️ Some evaluations need review. Check results above.\n');
  }
}

main()
  .then(() => {
    console.log('✅ Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
