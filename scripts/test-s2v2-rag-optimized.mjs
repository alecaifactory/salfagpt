#!/usr/bin/env node

/**
 * Test S2-v2 RAG OPTIMIZADO
 * Busca solo en los 467 sources de S2-v2, no en todos los 2,366 del usuario
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { BigQuery } from '@google-cloud/bigquery';
import { generateEmbedding } from '../src/lib/embeddings.js';

initializeApp({ projectId: 'salfagpt' });
const db = getFirestore();
const bq = new BigQuery({ projectId: 'salfagpt' });

const S2V2_ID = '1lgr33ywq5qed67sqCYi';
const USER_ID = 'usr_uhwqffaqag1wrryd82tw';

const QUERIES = [
  "Indícame qué filtros debo utilizar para una mantención de 2000 horas para una grúa Sany CR900C.",
  "Camión tolva 10163090 TCBY-56 indica en el panel 'forros de frenos desgastados'.",
  "¿Cuánto torque se debe aplicar a las ruedas del camión tolva 10163090 TCBY-56?",
  "¿Cada cuántas horas se debe cambiar el aceite hidráulico en un camión pluma SCANIA P450 B 6x4?"
];

async function getS2V2Sources() {
  // Get active source IDs for S2-v2
  const agentDoc = await db.collection('conversations').doc(S2V2_ID).get();
  return agentDoc.data()?.activeContextSourceIds || [];
}

async function searchOptimized(queryEmbedding, sourceIds, topK = 5) {
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
        AND source_id IN UNNEST(@sourceIds)
    )
    SELECT *
    FROM similarities
    WHERE similarity >= 0.25
    ORDER BY similarity DESC
    LIMIT @topK
  `;
  
  const [rows] = await bq.query({
    query,
    params: { queryEmbedding, userId: USER_ID, sourceIds, topK }
  });
  
  return rows;
}

async function test(question, index, sourceIds) {
  console.log(`\n${'═'.repeat(80)}`);
  console.log(`TEST ${index + 1}/4: ${question}`);
  console.log('═'.repeat(80));
  
  // Embedding
  console.log('🧮 Embedding...');
  const start1 = Date.now();
  const emb = await generateEmbedding(question);
  console.log(`✅ Ready (${Date.now() - start1}ms)`);
  
  // Search
  console.log('🔍 Searching BigQuery (filtered to S2-v2 sources only)...');
  const start2 = Date.now();
  const results = await searchOptimized(emb, sourceIds, 5);
  const searchTime = Date.now() - start2;
  
  console.log(`✅ Found ${results.length} results (${searchTime}ms) ⚡\n`);
  
  if (results.length === 0) {
    console.log('❌ No results\n');
    return { success: false };
  }
  
  results.forEach((r, i) => {
    const sim = (r.similarity * 100).toFixed(1);
    let name = 'Unknown';
    try {
      const meta = JSON.parse(r.metadata);
      name = meta.source_name || r.source_id.substring(0, 30);
    } catch (e) {}
    
    console.log(`[${i + 1}] ${sim}% - ${name}`);
    console.log(`    ${r.text_preview.substring(0, 100)}...`);
  });
  
  const avg = results.reduce((sum, r) => sum + r.similarity, 0) / results.length;
  console.log(`\nAvg: ${(avg * 100).toFixed(1)}%`);
  
  return { success: avg >= 0.5, avg, time: searchTime };
}

async function main() {
  console.log('\n🧪 TEST RAG S2-v2 OPTIMIZADO\n');
  console.log('Agent: Maqsa Mantenimiento (S2-v2)');
  console.log('ID: 1lgr33ywq5qed67sqCYi\n');
  
  // Get S2-v2 sources
  console.log('📥 Loading S2-v2 sources...');
  const sourceIds = await getS2V2Sources();
  console.log(`✅ ${sourceIds.length} sources\n`);
  
  // Check chunks
  const query = `
    SELECT COUNT(*) as chunks
    FROM \`salfagpt.flow_analytics.document_embeddings\`
    WHERE user_id = @userId AND source_id IN UNNEST(@sourceIds)
  `;
  
  const [rows] = await bq.query({
    query,
    params: { userId: USER_ID, sourceIds }
  });
  
  console.log(`📊 Chunks for S2-v2: ${rows[0].chunks}\n`);
  
  // Run tests
  const results = [];
  
  for (let i = 0; i < QUERIES.length; i++) {
    const r = await test(QUERIES[i], i, sourceIds);
    results.push(r);
  }
  
  // Summary
  console.log('\n' + '═'.repeat(80));
  const passed = results.filter(r => r.success).length;
  const avgTime = results.reduce((sum, r) => sum + (r.time || 0), 0) / results.length;
  
  console.log(`\n✅ Passed: ${passed}/4`);
  console.log(`⚡ Avg search time: ${avgTime.toFixed(0)}ms`);
  console.log(`📊 Status: ${passed >= 3 ? '✅ EXCELENTE' : '⚠️ PARCIAL'}\n`);
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });

