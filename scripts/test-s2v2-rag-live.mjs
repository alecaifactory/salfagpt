#!/usr/bin/env node

/**
 * Test S2-v2 RAG con documentos ya indexados
 * Mientras continúa el procesamiento en paralelo
 */

import { BigQuery } from '@google-cloud/bigquery';
import { generateEmbedding } from '../src/lib/embeddings.js';

const bigquery = new BigQuery({ projectId: 'salfagpt' });
const USER_ID = 'usr_uhwqffaqag1wrryd82tw';

// Preguntas de test sobre documentos S002
const TEST_QUERIES = [
  '¿Cuál es la capacidad de carga de la grúa Hiab 422?',
  '¿Cómo se realiza el mantenimiento del sistema hidráulico de la grúa?',
  '¿Qué medidas de seguridad se deben tomar al operar la grúa?',
  '¿Cuáles son las especificaciones del motor Scania P450?',
  '¿Cómo se cambia el aceite del motor Volvo FMX?'
];

async function searchChunks(queryEmbedding, topK = 5) {
  const query = `
    WITH similarities AS (
      SELECT 
        chunk_id,
        source_id,
        chunk_index,
        text_preview,
        full_text,
        metadata,
        (
          SELECT SUM(a * b) / (
            SQRT((SELECT SUM(a * a) FROM UNNEST(embedding) AS a)) * 
            SQRT((SELECT SUM(b * b) FROM UNNEST(@queryEmbedding) AS b))
          )
          FROM UNNEST(embedding) AS a WITH OFFSET pos
          JOIN UNNEST(@queryEmbedding) AS b WITH OFFSET pos2
            ON pos = pos2
        ) AS similarity
      FROM \`salfagpt.flow_analytics.document_embeddings\`
      WHERE user_id = @userId
        AND DATE(created_at) = CURRENT_DATE()
    )
    SELECT *
    FROM similarities
    WHERE similarity >= 0.25
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

async function testQuery(question, index, total) {
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`Test ${index + 1}/${total}: ${question}`);
  console.log('═'.repeat(70));
  
  try {
    // Generate embedding
    console.log('🧮 Generating query embedding...');
    const embedStart = Date.now();
    const embedding = await generateEmbedding(question);
    const embedTime = Date.now() - embedStart;
    
    if (!embedding || embedding.length !== 768) {
      console.log('❌ Failed to generate embedding');
      return { success: false };
    }
    
    console.log(`✅ Embedding ready (${embedTime}ms, ${embedding.length} dims)`);
    
    // Search
    console.log('🔍 Searching BigQuery...');
    const searchStart = Date.now();
    const results = await searchChunks(embedding, 5);
    const searchTime = Date.now() - searchStart;
    
    console.log(`✅ Search complete (${searchTime}ms)\n`);
    
    if (results.length === 0) {
      console.log('❌ NO RESULTS FOUND');
      console.log('   Esto es esperado si los docs relevantes no se han procesado aún\n');
      return { success: false, results: 0 };
    }
    
    // Display results
    console.log(`📊 Found ${results.length} results:\n`);
    
    let hasRelevantContent = false;
    
    results.forEach((r, idx) => {
      const similarity = (r.similarity * 100).toFixed(1);
      const icon = r.similarity >= 0.7 ? '✅' : r.similarity >= 0.5 ? '⚠️' : '❌';
      
      // Parse metadata to get source_name
      let sourceName = 'Unknown';
      try {
        const meta = JSON.parse(r.metadata);
        sourceName = meta.source_name || r.source_id.substring(0, 20);
      } catch (e) {}
      
      console.log(`${idx + 1}. ${icon} Similarity: ${similarity}%`);
      console.log(`   Source: ${sourceName}`);
      console.log(`   Chunk ${r.chunk_index}: ${r.text_preview.substring(0, 120)}...`);
      
      // Check if relevant (keywords)
      const text = r.full_text.toLowerCase();
      if (question.toLowerCase().includes('hiab') && text.includes('hiab')) hasRelevantContent = true;
      if (question.toLowerCase().includes('scania') && text.includes('scania')) hasRelevantContent = true;
      if (question.toLowerCase().includes('volvo') && text.includes('volvo')) hasRelevantContent = true;
      if (question.toLowerCase().includes('hidráulico') && text.includes('hidráulico')) hasRelevantContent = true;
      if (question.toLowerCase().includes('seguridad') && text.includes('seguridad')) hasRelevantContent = true;
      
      console.log('');
    });
    
    // Assessment
    const avgSim = results.reduce((sum, r) => sum + r.similarity, 0) / results.length;
    const score = avgSim >= 0.7 ? '✅ EXCELLENT' : avgSim >= 0.5 ? '⚠️ GOOD' : '❌ POOR';
    
    console.log(`Average Similarity: ${(avgSim * 100).toFixed(1)}% ${score}`);
    console.log(`Relevant content: ${hasRelevantContent ? '✅ YES' : '⚠️ Limited'}`);
    console.log(`Search time: ${searchTime}ms`);
    
    return {
      success: avgSim >= 0.5 && results.length >= 3,
      avgSimilarity: avgSim,
      results: results.length,
      hasRelevant: hasRelevantContent
    };
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    return { success: false };
  }
}

async function main() {
  console.log('🧪 Testing S2-v2 RAG - LIVE (while processing continues)\n');
  console.log('═'.repeat(70));
  console.log('Agent: S2-v2');
  console.log('Table: flow_analytics.document_embeddings');
  console.log('Filter: Today\'s chunks only (being indexed now)');
  console.log('═'.repeat(70));
  
  // Check current chunks
  console.log('\n📊 Pre-check: Current chunks in BigQuery...');
  const countQuery = `
    SELECT 
      COUNT(*) as total_chunks,
      COUNT(DISTINCT source_id) as total_sources,
      COUNTIF(embedding IS NOT NULL) as with_embeddings
    FROM \`salfagpt.flow_analytics.document_embeddings\`
    WHERE user_id = @userId
      AND DATE(created_at) = CURRENT_DATE()
  `;
  
  const [countRows] = await bigquery.query({
    query: countQuery,
    params: { userId: USER_ID }
  });
  
  const stats = countRows[0];
  console.log(`✅ Total chunks today: ${stats.total_chunks}`);
  console.log(`✅ From sources: ${stats.total_sources}`);
  console.log(`✅ With embeddings: ${stats.with_embeddings}\n`);
  
  if (stats.total_chunks === 0) {
    console.log('⚠️ No chunks indexed yet - wait for processing to start');
    process.exit(0);
  }
  
  // Run tests
  const results = [];
  
  for (let i = 0; i < TEST_QUERIES.length; i++) {
    const result = await testQuery(TEST_QUERIES[i], i, TEST_QUERIES.length);
    results.push(result);
    
    // Delay between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Summary
  console.log('\n' + '═'.repeat(70));
  console.log('📊 TEST SUMMARY\n');
  
  const passed = results.filter(r => r.success).length;
  const withResults = results.filter(r => r.results > 0).length;
  const avgSim = results
    .filter(r => r.avgSimilarity)
    .reduce((sum, r) => sum + r.avgSimilarity, 0) / results.filter(r => r.avgSimilarity).length || 0;
  
  console.log(`Tests with results: ${withResults}/${TEST_QUERIES.length}`);
  console.log(`Tests passed: ${passed}/${TEST_QUERIES.length}`);
  console.log(`Average similarity: ${(avgSim * 100).toFixed(1)}%`);
  console.log(`Overall: ${passed >= 3 ? '✅ PASS' : withResults >= 3 ? '⚠️ PARTIAL' : '❌ FAIL'}`);
  console.log('═'.repeat(70) + '\n');
  
  if (passed >= 3) {
    console.log('🎉 RAG is working with current indexed docs!');
    console.log('   Quality will improve as more docs are processed.\n');
  } else if (withResults >= 3) {
    console.log('⚠️ RAG is working but quality needs improvement');
    console.log('   This is expected - more docs are still being indexed.\n');
  } else {
    console.log('ℹ️ Limited results - relevant docs may not be indexed yet');
    console.log('  Check again in 30-60 minutes as more docs are processed.\n');
  }
  
  console.log('💡 Background processing continues...');
  console.log('   Monitor: tail -f /tmp/s2v2-chunks-v2.log');
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Fatal:', err);
    process.exit(1);
  });




