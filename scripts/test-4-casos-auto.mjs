#!/usr/bin/env node

/**
 * Test automático de 4 casos de evaluación
 * Mide: Performance, Calidad, Referencias
 */

import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { BigQuery } from '@google-cloud/bigquery';
import { generateEmbedding } from '../src/lib/embeddings.js';

if (getApps().length === 0) {
  initializeApp({ projectId: 'salfagpt' });
}

const db = getFirestore();
const bq = new BigQuery({ projectId: 'salfagpt' });

const USER_ID = 'usr_uhwqffaqag1wrryd82tw';
const DATASET = 'flow_analytics_east4';
const LOCATION = 'us-east4';

const TEST_CASES = [
  {
    id: 1,
    question: "Indicame que filtros debo utilizar para una mantencion de 2000 Hrs para una grua Sany CR900C",
    agentId: '1lgr33ywq5qed67sqCYi',
    agentName: "S2-v2 (Gestion Bodegas)",
    expectedDocs: "Hojas de ruta mantenimiento",
    originalRating: "Inaceptable (1/5)",
  },
  {
    id: 2,
    question: "Camion tolva 10163090 TCBY-56 indica en el panel forros de frenos desgastados",
    agentId: '1lgr33ywq5qed67sqCYi',
    agentName: "S2-v2 (Gestion Bodegas)",
    expectedDocs: "Manual de servicio TCBY-56",
    originalRating: "Sobresaliente (5/5) pero falta manual",
  },
  {
    id: 3,
    question: "Cuanto torque se le debe suministrar a las ruedas del camion tolva 10163090 TCBY-56 y cual es el procedimiento correcto",
    agentId: '1lgr33ywq5qed67sqCYi',
    agentName: "S2-v2 (Gestion Bodegas)",
    expectedDocs: "Manual con tabla de torque",
    originalRating: "Aceptable (2/5)",
  },
  {
    id: 4,
    question: "Cada cuantas horas se debe cambiar el aceite hidraulico en un camion pluma SCANIA P450 B 6x4",
    agentId: 'vStojK73ZKbjNsEnqANJ',
    agentName: "M3-v2 (Mantenimiento)",
    expectedDocs: "Manual Scania/HIAB con intervalos",
    originalRating: "Inaceptable (1/5)",
  },
];

async function testCase(testCase) {
  console.log(`\n${'═'.repeat(80)}`);
  console.log(`CASO ${testCase.id}: ${testCase.question.substring(0, 60)}...`);
  console.log(`${'═'.repeat(80)}`);
  console.log(`Agente: ${testCase.agentName}`);
  console.log(`Original: ${testCase.originalRating}`);
  console.log('');
  
  const totalStart = Date.now();
  
  try {
    // Get agent's sources
    console.log('1/4 Obteniendo sources del agente...');
    const agentDoc = await db.collection('conversations').doc(testCase.agentId).get();
    const sourceIds = agentDoc.data()?.activeContextSourceIds || [];
    console.log(`    ✅ ${sourceIds.length} sources activas (${Date.now() - totalStart}ms)`);
    
    if (sourceIds.length === 0) {
      console.log('    ❌ FALLO: Agente sin sources');
      return { case: testCase.id, success: false, reason: 'no-sources' };
    }
    
    // Generate embedding
    console.log('2/4 Generando embedding...');
    const embStart = Date.now();
    const embedding = await generateEmbedding(testCase.question);
    const embTime = Date.now() - embStart;
    console.log(`    ✅ Embedding generado (${embTime}ms)`);
    
    // Search BigQuery with NEW threshold (0.6)
    console.log('3/4 Buscando en BigQuery (threshold: 0.6)...');
    const searchStart = Date.now();
    
    const query = `
      WITH similarities AS (
        SELECT 
          chunk_id,
          source_id,
          chunk_index,
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
        FROM \`salfagpt.${DATASET}.document_embeddings\`
        WHERE user_id = @userId
          AND source_id IN UNNEST(@sourceIds)
      )
      SELECT *
      FROM similarities
      WHERE similarity >= 0.6
      ORDER BY similarity DESC
      LIMIT 10
    `;
    
    const [rows] = await bq.query({
      query,
      params: {
        userId: USER_ID,
        sourceIds: sourceIds.slice(0, 100), // Limit para query
        queryEmbedding: embedding,
      },
      location: LOCATION,
    });
    
    const searchTime = Date.now() - searchStart;
    console.log(`    ✅ Búsqueda completada (${searchTime}ms)`);
    console.log(`    📊 Chunks encontrados: ${rows.length}`);
    
    if (rows.length === 0) {
      console.log('    ❌ FALLO: No docs encontrados (incluso con threshold 0.6)');
      console.log(`    ⏱️  Tiempo total: ${Date.now() - totalStart}ms`);
      return {
        case: testCase.id,
        success: false,
        reason: 'no-docs-found',
        time: Date.now() - totalStart,
        embeddingTime: embTime,
        searchTime,
      };
    }
    
    // Get source names
    console.log('4/4 Obteniendo nombres de sources...');
    const uniqueSourceIds = [...new Set(rows.map(r => r.source_id))];
    const sourcesSnap = await db.collection('context_sources')
      .where('__name__', 'in', uniqueSourceIds.slice(0, 10))
      .select('name')
      .get();
    
    const sourceNames = {};
    sourcesSnap.docs.forEach(doc => {
      sourceNames[doc.id] = doc.data().name;
    });
    
    const totalTime = Date.now() - totalStart;
    
    // Analyze results
    const topSim = rows[0].similarity;
    const avgSim = rows.reduce((sum, r) => sum + r.similarity, 0) / rows.length;
    
    console.log('');
    console.log('📊 RESULTADOS:');
    console.log(`   Top similarity: ${(topSim * 100).toFixed(1)}%`);
    console.log(`   Avg similarity: ${(avgSim * 100).toFixed(1)}%`);
    console.log(`   Chunks: ${rows.length}`);
    console.log('');
    console.log('📚 Top 3 Documentos:');
    rows.slice(0, 3).forEach((r, idx) => {
      const name = sourceNames[r.source_id] || `Doc ${r.source_id.substring(0, 8)}`;
      console.log(`   ${idx + 1}. [${(r.similarity * 100).toFixed(1)}%] ${name}`);
      console.log(`      "${r.full_text.substring(0, 100)}..."`);
    });
    console.log('');
    console.log(`⏱️  PERFORMANCE:`);
    console.log(`   Embedding: ${embTime}ms`);
    console.log(`   BigQuery: ${searchTime}ms`);
    console.log(`   Total búsqueda: ${totalTime}ms`);
    console.log(`   Con Gemini (~4s): ~${totalTime + 4000}ms (~${((totalTime + 4000) / 1000).toFixed(1)}s)`);
    
    // Quality assessment
    let quality, verdict;
    if (topSim >= 0.7) {
      quality = 'ALTA';
      verdict = '✅ ÉXITO - Respuesta debería ser Sobresaliente';
    } else if (topSim >= 0.6) {
      quality = 'MEDIA';
      verdict = '⚠️  PARCIAL - Respuesta Aceptable (threshold 0.6 permite mostrar)';
    } else {
      quality = 'BAJA';
      verdict = '❌ INSUFICIENTE - Docs encontrados pero poco relevantes';
    }
    
    console.log('');
    console.log(`🎯 VEREDICTO: ${verdict}`);
    console.log(`   Calidad: ${quality}`);
    console.log(`   Mejora vs original: ${topSim >= 0.6 ? 'SÍ (threshold 0.6 permite)' : 'NO (falta doc correcto)'}`);
    
    return {
      case: testCase.id,
      success: topSim >= 0.6,
      quality,
      topSimilarity: topSim,
      avgSimilarity: avgSim,
      chunks: rows.length,
      time: totalTime,
      embeddingTime: embTime,
      searchTime,
      expectedFullTime: totalTime + 4000,
      topSource: sourceNames[rows[0].source_id],
      verdict,
    };
    
  } catch (error) {
    console.log(`\n❌ ERROR: ${error.message}`);
    console.log(`⏱️  Tiempo hasta error: ${Date.now() - totalStart}ms`);
    return {
      case: testCase.id,
      success: false,
      reason: 'error',
      error: error.message,
      time: Date.now() - totalStart,
    };
  }
}

async function runAllTests() {
  console.log('🧪 TEST AUTOMÁTICO DE 4 CASOS DE EVALUACIÓN');
  console.log('═'.repeat(80));
  console.log('Configuración:');
  console.log('  Threshold: 0.6 (bajado desde 0.7) ✅');
  console.log('  Dataset: flow_analytics_east4 ✅');
  console.log('  Location: us-east4 ✅');
  console.log('  Usuario: usr_uhwqffaqag1wrryd82tw');
  console.log('');
  
  const results = [];
  
  for (const testCase of TEST_CASES) {
    const result = await testCase(testCase);
    results.push(result);
  }
  
  // SUMMARY
  console.log('\n' + '═'.repeat(80));
  console.log('📊 RESUMEN FINAL');
  console.log('═'.repeat(80));
  console.log('');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`RESULTADOS:`);
  console.log(`  ✅ Exitosos: ${successful.length}/4 (${(successful.length / 4 * 100).toFixed(0)}%)`);
  console.log(`  ❌ Fallidos: ${failed.length}/4`);
  console.log('');
  
  if (successful.length > 0) {
    console.log('✅ CASOS EXITOSOS:');
    successful.forEach(r => {
      console.log(`  Caso ${r.case}: ${r.quality} quality (top: ${(r.topSimilarity * 100).toFixed(1)}%)`);
      console.log(`           Time: ${r.expectedFullTime}ms (~${(r.expectedFullTime / 1000).toFixed(1)}s con Gemini)`);
      console.log(`           Doc: ${r.topSource?.substring(0, 50) || 'N/A'}`);
    });
    console.log('');
  }
  
  if (failed.length > 0) {
    console.log('❌ CASOS FALLIDOS:');
    failed.forEach(r => {
      const testCase = TEST_CASES[r.case - 1];
      console.log(`  Caso ${r.case}: ${testCase.question.substring(0, 60)}...`);
      console.log(`           Razón: ${r.reason}`);
      console.log(`           Acción: Cargar "${testCase.expectedDocs}"`);
    });
    console.log('');
  }
  
  // Performance
  const avgTime = results
    .filter(r => r.expectedFullTime)
    .reduce((sum, r) => sum + r.expectedFullTime, 0) / successful.length;
  
  if (successful.length > 0) {
    console.log(`⏱️  PERFORMANCE:`);
    console.log(`  Avg embedding: ${(results.reduce((s, r) => s + (r.embeddingTime || 0), 0) / successful.length).toFixed(0)}ms`);
    console.log(`  Avg search: ${(results.reduce((s, r) => s + (r.searchTime || 0), 0) / successful.length).toFixed(0)}ms`);
    console.log(`  Avg total (con Gemini): ~${(avgTime / 1000).toFixed(1)}s`);
    console.log('');
    
    if (avgTime < 8000) {
      console.log(`  ✅ OBJETIVO CUMPLIDO (<8s)`);
    } else if (avgTime < 10000) {
      console.log(`  ⚠️  Cercano (8-10s)`);
    } else {
      console.log(`  ❌ Por encima (>10s)`);
    }
  }
  
  // Recommendations
  console.log('');
  console.log('📋 RECOMENDACIONES:');
  
  if (successful.length >= 3) {
    console.log('  ✅ Sistema funcionando bien');
    console.log('  → Cargar docs faltantes para casos fallidos');
    console.log('  → Deploy a producción');
  } else if (successful.length >= 1) {
    console.log('  ⚠️  Sistema funcionando parcialmente');
    console.log('  → Cargar documentos faltantes (alta prioridad)');
    console.log('  → Re-test después de cargar docs');
  } else {
    console.log('  ❌ Problema fundamental');
    console.log('  → Verificar us-east4 funcionando correctamente');
    console.log('  → Check activeContextSourceIds en agentes');
    console.log('  → Verificar embeddings indexados');
  }
  
  console.log('');
  console.log('═'.repeat(80));
}

runAllTests()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });

