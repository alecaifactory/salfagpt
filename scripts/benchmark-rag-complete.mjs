#!/usr/bin/env node

/**
 * Benchmark completo RAG - Medir cada fase
 * Comparar con UI para identificar cuellos de botella
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
const QUERY = "Cada cuantas horas se debe cambiar el aceite hidraulico en un camion pluma SCANIA P450 B 6x4";

// Use GREEN if configured
const DATASET = process.env.USE_EAST4_BIGQUERY === 'true' 
  ? 'flow_analytics_east4'  
  : 'flow_analytics';

async function benchmark() {
  console.log('🔬 BENCHMARK RAG COMPLETO\n');
  console.log('═'.repeat(70));
  console.log('Query:', QUERY);
  console.log('Agent: S2-v2 (Maqsa Mantenimiento)');
  console.log(`Dataset: ${DATASET}`);
  console.log('═'.repeat(70) + '\n');
  
  const totalStart = Date.now();
  
  // FASE 1: Get agent sources
  console.log('📋 FASE 1: Get agent sources...');
  const phase1Start = Date.now();
  
  const agentDoc = await db.collection('conversations').doc(S2V2_ID).get();
  const sourceIds = agentDoc.data()?.activeContextSourceIds || [];
  
  const phase1Time = Date.now() - phase1Start;
  console.log(`✅ Loaded ${sourceIds.length} source IDs (${phase1Time}ms)\n`);
  
  // FASE 2: Generate query embedding
  console.log('🧮 FASE 2: Generate query embedding...');
  const phase2Start = Date.now();
  
  const queryEmbedding = await generateEmbedding(QUERY);
  
  const phase2Time = Date.now() - phase2Start;
  console.log(`✅ Embedding generated: 768 dims (${phase2Time}ms)\n`);
  
  // FASE 3: BigQuery vector search
  console.log('🔍 FASE 3: BigQuery vector search...');
  const phase3Start = Date.now();
  
  const searchQuery = \`
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
      FROM \\\`salfagpt.\${DATASET}.document_embeddings\\\`
      WHERE user_id = @userId
        AND source_id IN UNNEST(@sourceIds)
    )
    SELECT *
    FROM similarities
    WHERE similarity >= 0.25
    ORDER BY similarity DESC
    LIMIT 8
  \`;
  
  const [rows] = await bq.query({
    query: searchQuery,
    params: { userId: USER_ID, sourceIds, queryEmbedding },
    location: DATASET.includes('east4') ? 'us-east4' : 'us-central1'
  });
  
  const phase3Time = Date.now() - phase3Start;
  console.log(\`✅ Found \${rows.length} chunks (${phase3Time}ms)\n\`);
  
  // Show top 3 results
  rows.slice(0, 3).forEach((r, i) => {
    let name = 'Unknown';
    try {
      const meta = JSON.parse(r.metadata);
      name = meta.source_name || r.source_id.substring(0, 30);
    } catch (e) {}
    
    console.log(\`  [\${i+1}] \${(r.similarity * 100).toFixed(1)}% - \${name}\`);
  });
  console.log('');
  
  // FASE 4: Build context
  console.log('📝 FASE 4: Build context for Gemini...');
  const phase4Start = Date.now();
  
  const context = rows.map((r, i) => {
    let name = 'Document';
    try {
      const meta = JSON.parse(r.metadata);
      name = meta.source_name || name;
    } catch (e) {}
    
    return \`[\${i+1}] \${name} - Chunk \${r.chunk_index}:\n\${r.full_text.substring(0, 500)}...\`;
  }).join('\n\n');
  
  const contextSize = context.length;
  const phase4Time = Date.now() - phase4Start;
  console.log(\`✅ Context built: \${contextSize} chars (${phase4Time}ms)\n\`);
  
  // FASE 5: Gemini generation (simulated - no real call)
  console.log('🤖 FASE 5: Gemini generation (estimated)...');
  const estimatedGeminiTime = 2000 + (contextSize / 1000) * 100; // ~2s base + proportional
  console.log(\`⏱️ Estimated: \${estimatedGeminiTime}ms\n\`);
  
  // TOTAL
  const totalTime = Date.now() - totalStart;
  const estimatedTotal = totalTime + estimatedGeminiTime;
  
  console.log('═'.repeat(70));
  console.log('📊 BENCHMARK RESULTS\n');
  console.log(\`Phase 1 - Get sources:     \${phase1Time}ms\`);
  console.log(\`Phase 2 - Generate embedding:     \${phase2Time}ms\`);
  console.log(\`Phase 3 - BigQuery search:     \${phase3Time}ms ⚡\`);
  console.log(\`Phase 4 - Build context:     \${phase4Time}ms\`);
  console.log(\`Phase 5 - Gemini (estimated):     \${estimatedGeminiTime}ms\`);
  console.log(\`\nTotal (without Gemini):     \${totalTime}ms\`);
  console.log(\`Total (with Gemini est):     \${estimatedTotal}ms\`);
  console.log('═'.repeat(70) + '\n');
  
  // Compare with UI
  console.log('📊 COMPARACIÓN CON UI:\n');
  console.log(\`UI observado:     30,000ms ❌\`);
  console.log(\`Script benchmark:     \${estimatedTotal}ms ✅\`);
  console.log(\`Diferencia:     \${30000 - estimatedTotal}ms\`);
  console.log(\`\nPosibles causas de diferencia:\`);
  console.log('  - UI: Múltiples renders de React');
  console.log('  - UI: Network overhead frontend → backend');
  console.log('  - UI: Parsing y formateo de respuesta');
  console.log('  - Backend: Servidor viejo sin GREEN flags');
  console.log('  - Backend: Logs de debug ralentizan');
  console.log('');
  
  if (estimatedTotal < 6000) {
    console.log('✅ Backend performance es BUENO (<6s)');
    console.log('⚠️ UI performance es el problema (30s)');
    console.log('\n💡 Optimizaciones sugeridas:');
    console.log('  1. Reducir re-renders de React');
    console.log('  2. Memoizar componentes pesados');
    console.log('  3. Lazy load referencias');
    console.log('  4. Optimizar parsing de markdown');
  } else {
    console.log('⚠️ Backend también es lento');
    console.log('\n💡 Optimizaciones backend:');
    console.log('  1. Reducir contexto enviado a Gemini');
    console.log('  2. Limitar chunks a top 5 (no 8)');
    console.log('  3. Cache de búsquedas frecuentes');
  }
}

benchmark()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });


