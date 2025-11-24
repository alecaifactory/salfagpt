#!/usr/bin/env node

/**
 * Test S2-v2 con preguntas de evaluación
 * Mientras procesamiento continúa en paralelo
 */

import { BigQuery } from '@google-cloud/bigquery';
import { generateEmbedding } from '../src/lib/embeddings.js';

const bigquery = new BigQuery({ projectId: 'salfagpt' });
const USER_ID = 'usr_uhwqffaqag1wrryd82tw';

// Preguntas de evaluación del cuestionario
const EVALUACIONES = [
  {
    id: 1,
    pregunta: "Indícame qué filtros debo utilizar para una mantención de 2000 horas para una grúa Sany CR900C.",
    esperado_calidad: "Respuesta completa basada en documentación o explicar qué documento falta",
    esperado_formato: "1) Lista filtros, 2) Referencias manual, 3) Recomendaciones, 4) Pasos si falta doc"
  },
  {
    id: 2,
    pregunta: "Camión tolva 10163090 TCBY-56 indica en el panel 'forros de frenos desgastados'.",
    esperado_calidad: "Relacionar con docs disponibles o equivalentes, explicar riesgo y acciones",
    esperado_formato: "1) Significado mensaje, 2) Riesgos, 3) Acciones, 4) Referencias"
  },
  {
    id: 3,
    pregunta: "¿Cuánto torque se debe aplicar a las ruedas del camión tolva 10163090 TCBY-56 y cuál es el procedimiento correcto?",
    esperado_calidad: "Confirmar si existe doc específico. Si no, usar referencia con advertencias",
    esperado_formato: "1) Torque específico/referencial, 2) Secuencia apriete, 3) Advertencias, 4) Notas"
  },
  {
    id: 4,
    pregunta: "¿Cada cuántas horas se debe cambiar el aceite hidráulico en un camión pluma SCANIA P450 B 6x4?",
    esperado_calidad: "Intervalo exacto si existe. Si no, explicar qué doc falta",
    esperado_formato: "1) Intervalo oficial, 2) Fuente técnica, 3) Pasos si no disponible"
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
    params: { queryEmbedding, userId: USER_ID, topK }
  });
  
  return rows;
}

async function testEvaluacion(evaluacion, index, total) {
  console.log(`\n${'═'.repeat(80)}`);
  console.log(`EVALUACIÓN ${evaluacion.id}/${total}: ${evaluacion.pregunta}`);
  console.log('═'.repeat(80));
  
  try {
    // Generate embedding
    const embedding = await generateEmbedding(evaluacion.pregunta);
    
    if (!embedding || embedding.length !== 768) {
      console.log('❌ Failed to generate embedding\n');
      return { success: false };
    }
    
    // Search
    console.log('🔍 Buscando en BigQuery...');
    const searchStart = Date.now();
    const results = await searchChunks(embedding, 8);
    const searchTime = Date.now() - searchStart;
    
    console.log(`✅ Búsqueda completada (${(searchTime/1000).toFixed(1)}s)\n`);
    
    if (results.length === 0) {
      console.log('⚠️ NO SE ENCONTRARON RESULTADOS');
      console.log('   Los documentos relevantes aún no han sido indexados.\n');
      console.log('📋 Esperado calidad:', evaluacion.esperado_calidad);
      console.log('📋 Esperado formato:', evaluacion.esperado_formato);
      return { success: false, results: 0 };
    }
    
    // Display results
    console.log(`📚 REFERENCIAS ENCONTRADAS (${results.length}):\n`);
    
    results.forEach((r, idx) => {
      const similarity = (r.similarity * 100).toFixed(1);
      const icon = r.similarity >= 0.7 ? '✅' : r.similarity >= 0.5 ? '⚠️' : '❌';
      
      // Parse metadata
      let sourceName = r.source_id.substring(0, 30);
      try {
        const meta = JSON.parse(r.metadata);
        sourceName = meta.source_name || sourceName;
      } catch (e) {}
      
      console.log(`[${idx + 1}] ${icon} ${similarity}% - ${sourceName}`);
      console.log(`    Chunk ${r.chunk_index}: ${r.text_preview.substring(0, 150)}...`);
      console.log('');
    });
    
    // Analysis
    const avgSim = results.reduce((sum, r) => sum + r.similarity, 0) / results.length;
    const topSim = results[0].similarity;
    
    console.log('─'.repeat(80));
    console.log(`📊 ANÁLISIS:`);
    console.log(`   Promedio similitud: ${(avgSim * 100).toFixed(1)}%`);
    console.log(`   Top resultado: ${(topSim * 100).toFixed(1)}%`);
    console.log(`   Calidad: ${avgSim >= 0.7 ? '✅ EXCELENTE' : avgSim >= 0.5 ? '⚠️ BUENA' : '❌ BAJA'}`);
    
    // Extract source names for answer
    const sourceNames = new Set();
    results.forEach(r => {
      try {
        const meta = JSON.parse(r.metadata);
        if (meta.source_name) sourceNames.add(meta.source_name);
      } catch (e) {}
    });
    
    console.log(`   Documentos referenciados: ${sourceNames.size}`);
    sourceNames.forEach(name => {
      console.log(`     - ${name}`);
    });
    
    console.log('\n📋 CRITERIOS DE EVALUACIÓN:');
    console.log(`   Calidad esperada: ${evaluacion.esperado_calidad}`);
    console.log(`   Formato esperado: ${evaluacion.esperado_formato}\n`);
    
    // Simulated AI response based on chunks
    console.log('💬 RESPUESTA SIMULADA (basada en chunks encontrados):\n');
    
    if (results.length >= 3 && avgSim >= 0.7) {
      console.log('   Basándome en la documentación disponible:');
      console.log(`   ${results[0].text_preview.substring(0, 200)}...`);
      console.log('\n   Referencias:');
      results.slice(0, 3).forEach((r, idx) => {
        try {
          const meta = JSON.parse(r.metadata);
          console.log(`   [${idx + 1}] ${meta.source_name || r.source_id}`);
        } catch (e) {
          console.log(`   [${idx + 1}] ${r.source_id.substring(0, 30)}`);
        }
      });
    } else {
      console.log('   ⚠️ La información disponible es limitada.');
      console.log('   Recomiendo consultar con un especialista o esperar a que');
      console.log('   se complete la indexación de todos los documentos.');
    }
    
    return {
      success: avgSim >= 0.5 && results.length >= 3,
      avgSimilarity: avgSim,
      results: results.length,
      topSimilarity: topSim
    };
    
  } catch (error) {
    console.error('❌ Error en test:', error.message);
    return { success: false };
  }
}

async function main() {
  console.log('\n🧪 EVALUACIÓN S2-v2 - Asistente de Mantenimiento Eq Superficie\n');
  console.log('═'.repeat(80));
  console.log('Agente: S2-v2');
  console.log('Usuario: Mecánicos y supervisores MAQSA');
  console.log('Objetivo: Apoyo en terreno para mantenimiento');
  console.log('═'.repeat(80));
  
  // Check current state
  console.log('\n📊 Estado actual en BigQuery...');
  const statsQuery = `
    SELECT 
      COUNT(*) as chunks,
      COUNT(DISTINCT source_id) as sources,
      MIN(created_at) as first_chunk,
      MAX(created_at) as last_chunk
    FROM \`salfagpt.flow_analytics.document_embeddings\`
    WHERE user_id = @userId
      AND DATE(created_at) = CURRENT_DATE()
  `;
  
  const [statsRows] = await bigquery.query({
    query: statsQuery,
    params: { userId: USER_ID }
  });
  
  const stats = statsRows[0];
  console.log(`✅ Chunks indexados: ${stats.chunks}`);
  console.log(`✅ Documentos: ${stats.sources}`);
  console.log(`✅ Primer chunk: ${new Date(stats.first_chunk.value).toLocaleTimeString()}`);
  console.log(`✅ Último chunk: ${new Date(stats.last_chunk.value).toLocaleTimeString()}`);
  console.log(`\n💡 Nota: Procesamiento continúa en paralelo (background)\n`);
  
  // Run evaluations
  const resultados = [];
  
  for (let i = 0; i < EVALUACIONES.length; i++) {
    const result = await testEvaluacion(EVALUACIONES[i], i, EVALUACIONES.length);
    resultados.push(result);
    
    // Delay between tests
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  // Final summary
  console.log('\n' + '═'.repeat(80));
  console.log('📊 RESUMEN FINAL DE EVALUACIÓN\n');
  
  const passed = resultados.filter(r => r.success).length;
  const withResults = resultados.filter(r => r.results > 0).length;
  const avgSim = resultados
    .filter(r => r.avgSimilarity)
    .reduce((sum, r) => sum + r.avgSimilarity, 0) / resultados.filter(r => r.avgSimilarity).length || 0;
  
  console.log(`Evaluaciones completadas: ${EVALUACIONES.length}`);
  console.log(`Con resultados: ${withResults}/${EVALUACIONES.length}`);
  console.log(`Aprobadas (>50% sim, 3+ refs): ${passed}/${EVALUACIONES.length}`);
  console.log(`Similitud promedio: ${(avgSim * 100).toFixed(1)}%`);
  console.log(`\nEstado general: ${passed >= 3 ? '✅ APROBADO' : withResults >= 2 ? '⚠️ PARCIAL' : '❌ REQUIERE MÁS DOCS'}`);
  console.log('═'.repeat(80) + '\n');
  
  if (passed >= 3) {
    console.log('🎉 El asistente está funcionando correctamente!');
    console.log('   Puede responder preguntas técnicas con referencias apropiadas.\n');
  } else if (withResults >= 2) {
    console.log('⚠️ El asistente funciona parcialmente.');
    console.log('   Algunas preguntas requieren documentos que aún se están indexando.');
    console.log('   Re-ejecutar cuando complete el procesamiento.\n');
  } else {
    console.log('ℹ️ Documentos relevantes aún se están indexando.');
    console.log('  Esperar ~1-2 horas más y volver a probar.\n');
  }
  
  console.log('💡 Procesamiento de chunks continúa en paralelo');
  console.log('   Monitor: tail -f /tmp/s2v2-chunks-v2.log\n');
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Fatal:', err);
    process.exit(1);
  });

