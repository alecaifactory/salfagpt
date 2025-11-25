#!/usr/bin/env node

/**
 * Test S2-v2 RAG con TODOS los chunks (no solo de hoy)
 */

import { BigQuery } from '@google-cloud/bigquery';
import { generateEmbedding } from '../src/lib/embeddings.js';

const bigquery = new BigQuery({ projectId: 'salfagpt' });
const USER_ID = 'usr_uhwqffaqag1wrryd82tw';

const TEST_QUERIES = [
  {
    id: 1,
    pregunta: "Indícame qué filtros debo utilizar para una mantención de 2000 horas para una grúa Sany CR900C."
  },
  {
    id: 2,
    pregunta: "Camión tolva 10163090 TCBY-56 indica en el panel 'forros de frenos desgastados'."
  },
  {
    id: 3,
    pregunta: "¿Cuánto torque se debe aplicar a las ruedas del camión tolva 10163090 TCBY-56 y cuál es el procedimiento correcto?"
  },
  {
    id: 4,
    pregunta: "¿Cada cuántas horas se debe cambiar el aceite hidráulico en un camión pluma SCANIA P450 B 6x4?"
  }
];

async function searchChunks(queryEmbedding, topK = 8) {
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
    )
    SELECT *
    FROM similarities
    WHERE similarity >= 0.25
    ORDER BY similarity DESC
    LIMIT @topK
  `;
  
  const [rows] = await bigquery.query({
    query,
    params: { queryEmbedding, userId: USER_ID, topK }
  });
  
  return rows;
}

async function testQuery(queryData, index, total) {
  console.log(`\n${'═'.repeat(80)}`);
  console.log(`TEST ${queryData.id}/${total}: ${queryData.pregunta}`);
  console.log('═'.repeat(80));
  
  try {
    // Generate embedding
    console.log('🧮 Generating embedding...');
    const embedding = await generateEmbedding(queryData.pregunta);
    
    if (!embedding || embedding.length !== 768) {
      console.log('❌ Failed to generate embedding\n');
      return { success: false };
    }
    
    console.log(`✅ Embedding ready (768 dims)`);
    
    // Search
    console.log('🔍 Searching BigQuery...');
    const searchStart = Date.now();
    const results = await searchChunks(embedding, 8);
    const searchTime = Date.now() - searchStart;
    
    console.log(`✅ Search complete (${(searchTime/1000).toFixed(1)}s)\n`);
    
    if (results.length === 0) {
      console.log('❌ NO RESULTS FOUND\n');
      return { success: false, results: 0 };
    }
    
    // Display top 5
    console.log(`📚 TOP 5 REFERENCIAS:\n`);
    
    results.slice(0, 5).forEach((r, idx) => {
      const sim = (r.similarity * 100).toFixed(1);
      const icon = r.similarity >= 0.7 ? '✅' : r.similarity >= 0.5 ? '⚠️' : '❌';
      
      let sourceName = r.source_id.substring(0, 40);
      try {
        const meta = JSON.parse(r.metadata);
        sourceName = meta.source_name || sourceName;
      } catch (e) {}
      
      console.log(`[${idx + 1}] ${icon} ${sim}% - ${sourceName}`);
      console.log(`    ${r.text_preview.substring(0, 120)}...`);
      console.log('');
    });
    
    // Stats
    const avgSim = results.reduce((sum, r) => sum + r.similarity, 0) / results.length;
    const topSim = results[0].similarity;
    
    console.log('─'.repeat(80));
    console.log(`Similarity promedio: ${(avgSim * 100).toFixed(1)}%`);
    console.log(`Top resultado: ${(topSim * 100).toFixed(1)}%`);
    console.log(`Resultados: ${results.length}`);
    console.log(`Calidad: ${avgSim >= 0.7 ? '✅ EXCELENTE' : avgSim >= 0.5 ? '⚠️ BUENA' : '❌ BAJA'}`);
    
    return {
      success: avgSim >= 0.5 && results.length >= 3,
      avgSimilarity: avgSim,
      topSimilarity: topSim,
      results: results.length
    };
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return { success: false };
  }
}

async function main() {
  console.log('\n🧪 TEST RAG S2-v2 - TODOS LOS CHUNKS\n');
  console.log('═'.repeat(80));
  console.log('Agent: S2-v2 (Maqsa Mantenimiento Eq Superficie)');
  console.log('User: usr_uhwqffaqag1wrryd82tw');
  console.log('Table: flow_analytics.document_embeddings');
  console.log('Filter: ALL chunks (not just today)');
  console.log('═'.repeat(80));
  
  // Check chunks
  console.log('\n📊 Verificando chunks disponibles...');
  const statsQuery = `
    SELECT 
      COUNT(*) as total_chunks,
      COUNT(DISTINCT source_id) as total_sources,
      MIN(created_at) as first_chunk,
      MAX(created_at) as last_chunk
    FROM \`salfagpt.flow_analytics.document_embeddings\`
    WHERE user_id = @userId
  `;
  
  const [statsRows] = await bigquery.query({
    query: statsQuery,
    params: { userId: USER_ID }
  });
  
  const stats = statsRows[0];
  console.log(`✅ Total chunks: ${stats.total_chunks}`);
  console.log(`✅ Total sources: ${stats.total_sources}`);
  console.log(`✅ Desde: ${new Date(stats.first_chunk.value).toLocaleDateString()}`);
  console.log(`✅ Hasta: ${new Date(stats.last_chunk.value).toLocaleDateString()}\n`);
  
  if (stats.total_chunks === 0) {
    console.log('❌ No hay chunks indexados');
    process.exit(1);
  }
  
  // Run tests
  const results = [];
  
  for (let i = 0; i < TEST_QUERIES.length; i++) {
    const result = await testQuery(TEST_QUERIES[i], i, TEST_QUERIES.length);
    results.push(result);
    await new Promise(r => setTimeout(r, 2000));
  }
  
  // Summary
  console.log('\n' + '═'.repeat(80));
  console.log('📊 RESUMEN FINAL\n');
  
  const passed = results.filter(r => r.success).length;
  const avgSim = results
    .filter(r => r.avgSimilarity)
    .reduce((sum, r) => sum + r.avgSimilarity, 0) / results.filter(r => r.avgSimilarity).length || 0;
  
  console.log(`Tests passed: ${passed}/${TEST_QUERIES.length}`);
  console.log(`Average similarity: ${(avgSim * 100).toFixed(1)}%`);
  console.log(`Status: ${passed === 4 ? '✅ ALL PASS' : passed >= 3 ? '⚠️ MOST PASS' : '❌ NEEDS WORK'}`);
  console.log('═'.repeat(80) + '\n');
  
  if (passed >= 3) {
    console.log('🎉 S2-v2 RAG está funcionando correctamente!\n');
  }
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Fatal:', err);
    process.exit(1);
  });

