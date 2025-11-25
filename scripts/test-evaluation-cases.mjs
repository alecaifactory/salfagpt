#!/usr/bin/env node

/**
 * Test the 4 evaluation cases automatically
 * Measures: Performance, Quality, References
 */

import { searchByAgent } from '../src/lib/bigquery-router.js';

const USER_ID = 'usr_uhwqffaqag1wrryd82tw';
const S2V2_AGENT = '1lgr33ywq5qed67sqCYi'; // Gestion Bodegas (S2-v2)
const M3V2_AGENT = 'vStojK73ZKbjNsEnqANJ'; // Mantenimiento (M3-v2)

const TEST_CASES = [
  {
    id: 1,
    question: "Indicame que filtros debo utilizar para una mantencion de 2000 Hrs para una grua Sany CR900C",
    agent: S2V2_AGENT,
    agentName: "S2-v2 (Gestion Bodegas)",
    expectedDocs: "Hojas de ruta mantenimiento",
    originalRating: "Inaceptable (1/5)",
  },
  {
    id: 2,
    question: "Camion tolva 10163090 TCBY-56 indica en el panel forros de frenos desgastados",
    agent: S2V2_AGENT,
    agentName: "S2-v2 (Gestion Bodegas)",
    expectedDocs: "Manual de servicio TCBY-56",
    originalRating: "Sobresaliente (5/5) pero falta manual",
  },
  {
    id: 3,
    question: "Cuanto torque se le debe suministrar a las ruedas del camion tolva 10163090 TCBY-56 y cual es el procedimiento correcto",
    agent: S2V2_AGENT,
    agentName: "S2-v2 (Gestion Bodegas)",
    expectedDocs: "Manual de servicio con tabla de torque",
    originalRating: "Aceptable (2/5) - falta manual",
  },
  {
    id: 4,
    question: "Cada cuantas horas se debe cambiar el aceite hidraulico en un camion pluma SCANIA P450 B 6x4",
    agent: M3V2_AGENT,
    agentName: "M3-v2 (Mantenimiento)",
    expectedDocs: "Manual Scania P450 o HIAB con intervalos",
    originalRating: "Inaceptable (1/5)",
  },
];

async function testCase(testCase) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`TEST CASO ${testCase.id}`);
  console.log(`${'='.repeat(80)}`);
  console.log(`Agente: ${testCase.agentName}`);
  console.log(`Pregunta: "${testCase.question}"`);
  console.log(`Docs esperados: ${testCase.expectedDocs}`);
  console.log(`Rating original: ${testCase.originalRating}`);
  console.log('');
  
  const startTime = Date.now();
  
  try {
    // Search with lowered threshold (0.6)
    const results = await searchByAgent(
      USER_ID,
      testCase.agent,
      testCase.question,
      {
        topK: 10,
        minSimilarity: 0.6, // Lowered from 0.7
        requestOrigin: 'http://localhost:3000' // Force GREEN (us-east4)
      }
    );
    
    const searchTime = Date.now() - startTime;
    
    console.log(`⏱️  Tiempo de búsqueda: ${searchTime}ms`);
    console.log(`📊 Chunks encontrados: ${results.length}`);
    console.log('');
    
    if (results.length === 0) {
      console.log('❌ FALLO: No se encontraron documentos');
      console.log('   Razón probable: Documento no cargado en agente');
      console.log('   Acción: Cargar documento faltante');
      return {
        case: testCase.id,
        success: false,
        reason: 'no-docs-found',
        time: searchTime,
        chunks: 0,
      };
    }
    
    // Analyze results
    const topResult = results[0];
    const avgSimilarity = results.reduce((sum, r) => sum + r.similarity, 0) / results.length;
    
    console.log('📚 Top 5 Resultados:');
    results.slice(0, 5).forEach((r, idx) => {
      console.log(`   ${idx + 1}. [${(r.similarity * 100).toFixed(1)}%] ${r.sourceName}`);
      console.log(`      Chunk #${r.chunkIndex + 1}: "${r.text.substring(0, 80)}..."`);
    });
    console.log('');
    
    // Quality assessment
    const hasHighQuality = topResult.similarity >= 0.7;
    const hasMediumQuality = topResult.similarity >= 0.6;
    const hasLowQuality = topResult.similarity >= 0.5;
    
    let quality;
    if (hasHighQuality) {
      quality = '✅ ALTA (≥70%)';
    } else if (hasMediumQuality) {
      quality = '⚠️  MEDIA (60-70%)';
    } else if (hasLowQuality) {
      quality = '⚠️  BAJA (50-60%)';
    } else {
      quality = '❌ MUY BAJA (<50%)';
    }
    
    console.log(`🎯 Calidad de resultados: ${quality}`);
    console.log(`   Top similarity: ${(topResult.similarity * 100).toFixed(1)}%`);
    console.log(`   Avg similarity: ${(avgSimilarity * 100).toFixed(1)}%`);
    console.log('');
    
    // Verdict
    if (hasHighQuality) {
      console.log('✅ ÉXITO: Debería dar respuesta de calidad');
      console.log('   Referencias con >70% similitud');
    } else if (hasMediumQuality) {
      console.log('⚠️  PARCIAL: Encontró docs relacionados pero no óptimos');
      console.log('   Con threshold 0.6 ahora se mostrarán');
      console.log('   Antes (0.7) no se mostraban');
    } else {
      console.log('❌ INSUFICIENTE: Similitud muy baja');
      console.log('   Probable: Documento correcto no está cargado');
    }
    
    return {
      case: testCase.id,
      success: hasHighQuality || hasMediumQuality,
      quality: hasHighQuality ? 'high' : 'medium',
      topSimilarity: topResult.similarity,
      avgSimilarity,
      chunks: results.length,
      time: searchTime,
      topSource: topResult.sourceName,
    };
    
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    return {
      case: testCase.id,
      success: false,
      reason: 'error',
      error: error.message,
      time: Date.now() - startTime,
    };
  }
}

async function runAllTests() {
  console.log('🧪 TESTING 4 CASOS DE EVALUACIÓN');
  console.log('Configuración:');
  console.log('  - Threshold: 0.6 (bajado desde 0.7)');
  console.log('  - Dataset: us-east4');
  console.log('  - TopK: 10');
  console.log('');
  
  const results = [];
  
  for (const testCase of TEST_CASES) {
    const result = await testCase(testCase);
    results.push(result);
    await new Promise(r => setTimeout(r, 1000)); // Pause entre tests
  }
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 RESUMEN DE RESULTADOS');
  console.log('='.repeat(80));
  console.log('');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Exitosos: ${successful.length}/4 (${(successful.length / 4 * 100).toFixed(0)}%)`);
  console.log(`❌ Fallidos: ${failed.length}/4 (${(failed.length / 4 * 100).toFixed(0)}%)`);
  console.log('');
  
  if (successful.length > 0) {
    console.log('✅ Casos Exitosos:');
    successful.forEach(r => {
      console.log(`   Caso ${r.case}: ${r.quality?.toUpperCase()} quality (${(r.topSimilarity * 100).toFixed(1)}%)`);
      console.log(`            Top doc: ${r.topSource}`);
      console.log(`            Time: ${r.time}ms`);
    });
    console.log('');
  }
  
  if (failed.length > 0) {
    console.log('❌ Casos Fallidos:');
    failed.forEach(r => {
      console.log(`   Caso ${r.case}: ${r.reason || 'unknown'}`);
      if (r.error) console.log(`            Error: ${r.error}`);
    });
    console.log('');
    console.log('Acción requerida:');
    console.log('  - Cargar documentos faltantes para estos casos');
    console.log('  - O verificar que docs estén asignados al agente');
  }
  
  // Performance summary
  const avgTime = results.reduce((sum, r) => sum + (r.time || 0), 0) / results.length;
  console.log(`⏱️  Tiempo promedio de búsqueda: ${avgTime.toFixed(0)}ms`);
  console.log('');
  
  // Expected full response time
  const expectedFullTime = avgTime + 4000; // + Gemini generation
  console.log(`🎯 Tiempo esperado respuesta completa: ~${(expectedFullTime / 1000).toFixed(1)}s`);
  console.log(`   (${avgTime.toFixed(0)}ms búsqueda + ~4000ms Gemini)`);
  
  if (expectedFullTime < 8000) {
    console.log('   ✅ OBJETIVO CUMPLIDO (<8s)');
  } else if (expectedFullTime < 10000) {
    console.log('   ⚠️  Cercano al objetivo (8-10s)');
  } else {
    console.log('   ❌ Por encima del objetivo (>10s)');
  }
}

runAllTests()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });

