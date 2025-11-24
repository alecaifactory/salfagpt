#!/usr/bin/env node

/**
 * RAG Evaluation for M3-v2 - GOP GPT (Procedimientos Edificación)
 * Tests retrieval quality with real questions
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { searchRelevantChunks } from '../src/lib/rag-search.js';

initializeApp({ projectId: 'salfagpt' });
const db = getFirestore();

const AGENT_ID = 'vStojK73ZKbjNsEnqANJ'; // M3-v2 GOP GPT
const USER_ID = 'usr_uhwqffaqag1wrryd82tw';

// Evaluation questions - GOP GPT specific (from JSON config)
const EVALUATION_QUESTIONS = [
  {
    id: 1,
    question: "¿Qué debo hacer antes de comenzar una obra de edificación?",
    expectedQuality: "Debe mencionar explícitamente PROCEDIMIENTO INICIO DE OBRAS DE EDIFICACIÓN, PLANIFICACIÓN INICIAL DE OBRA, PLAN DE CALIDAD Y OPERACIÓN, ENTORNO VECINOS. Debe dar pasos concretos para preparación.",
    expectedFormat: "Comenzar mencionando procedimientos clave, luego punteo de pasos estructurados. 6-10 pasos máximo."
  },
  {
    id: 2,
    question: "¿Qué documentos necesito para el Panel Financiero de un proyecto afecto?",
    expectedQuality: "Debe referenciar PROCESO PANEL FINANCIERO PROYECTOS AFECTOS (V1) y mencionar: Panel 0, paneles mensuales, codificación recursos, control costos/ingresos.",
    expectedFormat: "Lista de documentos/anexos. Cada uno con 1 línea de descripción. Referencia al procedimiento principal."
  },
  {
    id: 3,
    question: "Tengo un vecino molesto por el polvo de la obra, ¿qué debo hacer?",
    expectedQuality: "Debe usar ENTORNO VECINOS Y RELACIONAMIENTO COMUNITARIO (V4), FORMULARIO DE VISITA, CARTA DE ACUERDOS. Pasos: recibir vecino, registrar reclamo, evaluar, definir medidas, comunicar.",
    expectedFormat: "Pasos concretos en lista numerada. 5-8 pasos. Mencionar formularios específicos."
  },
  {
    id: 4,
    question: "Respuesta corta: ¿Qué reuniones debo tener según gestión de construcción en obra?",
    expectedQuality: "Debe referenciar PROCEDIMIENTO DE GESTION DE CONSTRUCCION EN OBRA (V2). Listar tipos: Planificación Intermedia, Línea de Mando, Subcontratos, Cumplimiento/Retroalimentación.",
    expectedFormat: "MUY BREVE. Lista de 4 tipos de reunión con 1 línea cada una. Total máximo 8 líneas. Respetar 'respuesta corta'."
  }
];

async function main() {
  console.log('🧪 M3-v2 RAG Evaluation - GOP GPT (Procedimientos Edificación)');
  console.log('==============================================================\n');
  console.log(`Agent: ${AGENT_ID}`);
  console.log(`Questions: ${EVALUATION_QUESTIONS.length}\n`);

  const results = [];
  let totalTime = 0;
  let passCount = 0;

  for (const [index, evaluation] of EVALUATION_QUESTIONS.entries()) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📝 Evaluation ${index + 1}/${EVALUATION_QUESTIONS.length}: ${evaluation.id}`);
    console.log(`${'='.repeat(80)}\n`);
    console.log(`❓ Question: ${evaluation.question}\n`);

    const startTime = Date.now();

    try {
      // Perform RAG search
      const ragResults = await searchRelevantChunks(
        USER_ID,
        evaluation.question,
        {
          topK: 5,
          minSimilarity: 0.5,
          activeSourceIds: undefined // Will use all assigned sources
        }
      );

      const duration = Date.now() - startTime;
      totalTime += duration;

      if (!ragResults || ragResults.length === 0) {
        console.log('❌ NO RESULTS FOUND\n');
        results.push({
          id: evaluation.id,
          question: evaluation.question,
          passed: false,
          reason: 'No RAG results',
          duration: duration,
          chunks: 0,
          avgSimilarity: 0
        });
        continue;
      }

      const avgSimilarity = ragResults.reduce((sum, r) => sum + r.similarity, 0) / ragResults.length;
      const passed = avgSimilarity >= 0.7 && ragResults.length >= 3;

      console.log(`✅ Found ${ragResults.length} relevant chunks`);
      console.log(`📊 Average similarity: ${(avgSimilarity * 100).toFixed(1)}%`);
      console.log(`⏱️  Search time: ${duration}ms\n`);

      console.log('📚 Top 3 Results:\n');
      ragResults.slice(0, 3).forEach((result, idx) => {
        console.log(`${idx + 1}. Similarity: ${(result.similarity * 100).toFixed(1)}%`);
        console.log(`   Source: ${result.source_name}`);
        console.log(`   Preview: ${result.text_preview.substring(0, 150)}...`);
        console.log('');
      });

      results.push({
        id: evaluation.id,
        question: evaluation.question,
        passed: passed,
        reason: passed ? 'Good similarity and coverage' : 'Low similarity or insufficient results',
        duration: duration,
        chunks: ragResults.length,
        avgSimilarity: avgSimilarity,
        topResults: ragResults.slice(0, 3).map(r => ({
          similarity: r.similarity,
          source: r.source_name,
          preview: r.text_preview.substring(0, 100)
        }))
      });

      if (passed) {
        passCount++;
        console.log('✅ PASSED\n');
      } else {
        console.log(`⚠️  NEEDS IMPROVEMENT: ${passed ? 'Good similarity' : 'Low similarity or few results'}\n`);
      }

    } catch (error) {
      console.error(`❌ ERROR: ${error.message}\n`);
      results.push({
        id: evaluation.id,
        question: evaluation.question,
        passed: false,
        reason: `Error: ${error.message}`,
        duration: Date.now() - startTime,
        chunks: 0,
        avgSimilarity: 0
      });
    }
  }

  // Final Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 FINAL RESULTS');
  console.log('='.repeat(80) + '\n');

  console.log(`Agent: M1-v2 (${AGENT_ID})`);
  console.log(`Total Evaluations: ${EVALUATION_QUESTIONS.length}`);
  console.log(`Passed: ${passCount}/${EVALUATION_QUESTIONS.length} (${((passCount/EVALUATION_QUESTIONS.length)*100).toFixed(1)}%)`);
  console.log(`Average Time: ${(totalTime / EVALUATION_QUESTIONS.length).toFixed(0)}ms`);
  console.log(`Total Time: ${(totalTime / 1000).toFixed(1)}s\n`);

  // Detailed results
  console.log('## Detailed Results:\n');
  results.forEach(r => {
    const status = r.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} - Evaluation ${r.id}`);
    console.log(`   Chunks: ${r.chunks}`);
    console.log(`   Similarity: ${(r.avgSimilarity * 100).toFixed(1)}%`);
    console.log(`   Time: ${r.duration}ms`);
    console.log(`   Reason: ${r.reason}`);
    console.log('');
  });

  // Save report
  const report = generateReport(results, passCount, totalTime);
  const reportFile = 'M001_EVALUATION_REPORT.md';
  writeFileSync(reportFile, report);
  console.log(`\n📄 Report saved: ${reportFile}`);

  // Exit with status code
  const exitCode = passCount === EVALUATION_QUESTIONS.length ? 0 : 1;
  console.log(`\n${passCount === EVALUATION_QUESTIONS.length ? '✅ ALL TESTS PASSED' : '⚠️  SOME TESTS FAILED'}`);
  process.exit(exitCode);
}

function generateReport(results, passCount, totalTime) {
  const timestamp = new Date().toISOString();
  
  let report = `# M1-v2 RAG Evaluation Report\n\n`;
  report += `**Agent:** Asistente Legal Territorial RDI (M1-v2)\n`;
  report += `**Agent ID:** ${AGENT_ID}\n`;
  report += `**Generated:** ${timestamp}\n`;
  report += `**Evaluations:** ${EVALUATION_QUESTIONS.length}\n`;
  report += `**Passed:** ${passCount}/${EVALUATION_QUESTIONS.length} (${((passCount/EVALUATION_QUESTIONS.length)*100).toFixed(1)}%)\n`;
  report += `**Total Time:** ${(totalTime/1000).toFixed(1)}s\n`;
  report += `**Avg Time:** ${(totalTime/EVALUATION_QUESTIONS.length).toFixed(0)}ms\n\n`;
  
  report += `## Summary\n\n`;
  report += `| Evaluation | Status | Chunks | Similarity | Time (ms) | Reason |\n`;
  report += `|-----------|--------|--------|-----------|-----------|--------|\n`;
  
  results.forEach(r => {
    const status = r.passed ? '✅ PASS' : '❌ FAIL';
    report += `| ${r.id} | ${status} | ${r.chunks} | ${(r.avgSimilarity * 100).toFixed(1)}% | ${r.duration} | ${r.reason} |\n`;
  });
  
  report += `\n## Detailed Results\n\n`;
  
  results.forEach(r => {
    report += `### Evaluation ${r.id}\n\n`;
    report += `**Question:** ${r.question}\n\n`;
    report += `**Status:** ${r.passed ? '✅ PASSED' : '❌ FAILED'}\n`;
    report += `**Chunks Found:** ${r.chunks}\n`;
    report += `**Avg Similarity:** ${(r.avgSimilarity * 100).toFixed(1)}%\n`;
    report += `**Search Time:** ${r.duration}ms\n`;
    report += `**Reason:** ${r.reason}\n\n`;
    
    if (r.topResults && r.topResults.length > 0) {
      report += `**Top Results:**\n\n`;
      r.topResults.forEach((result, idx) => {
        report += `${idx + 1}. **Similarity:** ${(result.similarity * 100).toFixed(1)}%\n`;
        report += `   **Source:** ${result.source}\n`;
        report += `   **Preview:** ${result.preview}...\n\n`;
      });
    }
    
    report += `---\n\n`;
  });
  
  report += `## Overall Assessment\n\n`;
  report += passCount === EVALUATION_QUESTIONS.length 
    ? `✅ **ALL TESTS PASSED** - M1-v2 RAG is production ready!\n\n`
    : `⚠️  **${EVALUATION_QUESTIONS.length - passCount} tests failed** - Review and improve retrieval quality.\n\n`;
  
  report += `**Next Steps:**\n`;
  if (passCount === EVALUATION_QUESTIONS.length) {
    report += `- ✅ M1-v2 ready for user testing\n`;
    report += `- ✅ Proceed with M3-v2 configuration\n`;
    report += `- ✅ Monitor RAG performance in production\n`;
  } else {
    report += `- ⚠️  Analyze failed evaluations\n`;
    report += `- ⚠️  Check if more documents needed\n`;
    report += `- ⚠️  Consider adjusting similarity threshold\n`;
    report += `- ⚠️  Review chunk quality for failed cases\n`;
  }
  
  return report;
}

// Execute
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
