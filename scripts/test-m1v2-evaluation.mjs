#!/usr/bin/env node

/**
 * RAG Evaluation for M1-v2 - Asistente Legal Territorial RDI
 * Tests retrieval quality with real questions
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { writeFileSync } from 'fs';
import { searchRelevantChunks } from '../src/lib/rag-search.js';

initializeApp({ projectId: 'salfagpt' });
const db = getFirestore();

const AGENT_ID = 'EgXezLcu4O3IUqFUJhUZ'; // M1-v2
const USER_ID = 'usr_uhwqffaqag1wrryd82tw';

// Evaluation questions from Ficha de Asistente
const EVALUATION_QUESTIONS = [
  {
    id: 1,
    question: "¿Cuáles son las alternativas de aporte al espacio público en los permisos de edificación?",
    expectedQuality: "Debe identificar claramente las principales formas de cumplimiento del Art. 70 LGUC: cesión de terreno, aporte en dinero, ejecución de obras de urbanización. Debe mencionar DDU relevantes.",
    expectedFormat: "Respuesta estructurada tipo lista. Cada alternativa con 1-3 líneas de explicación y referencia normativa."
  },
  {
    id: 2,
    question: "¿Es posible compartir laboratorios en colegios colindantes?",
    expectedQuality: "Debe entregar respuesta clara sobre la posibilidad jurídica, condiciones y qué normas o DDU regulan la situación (uso de suelo, seguridad, accesos).",
    expectedFormat: "Comenzar con conclusión clara ('Sí, es posible, siempre que…'). Luego 2-4 viñetas con condiciones y referencias."
  },
  {
    id: 3,
    question: "¿Los EIU caducan cuando entra en vigencia el PRC?",
    expectedQuality: "Debe explicar si los EIU caducan automáticamente con nuevo PRC o subsisten bajo reglas transitorias. Distinguir entre derechos adquiridos, permisos otorgados y EIU en trámite.",
    expectedFormat: "Primero respuesta clara sí/no más matices. Luego desarrollo en 3-5 viñetas: regla general, excepciones, referencia normativa."
  },
  {
    id: 4,
    question: "¿Es posible aprobar un condominio tipo B dentro de un permiso de edificación acogido a conjunto armónico?",
    expectedQuality: "Debe indicar si la normativa permite esta combinación, bajo qué condiciones. Considerar definiciones, reglas y DDU relevantes. Si hay ambigüedad, explicitarla.",
    expectedFormat: "Conclusión explícita en primera o segunda frase. Explicación ordenada en viñetas: marco normativo condominio B, conjunto armónico, análisis compatibilidad, referencias."
  },
  {
    id: 5,
    question: "Por favor provee una respuesta tipo lista. ¿Cuáles deberían ser las etapas que debo considerar si quiero desarrollar un proyecto inmobiliario en un terreno? Por favor considera el caso más completo posible.",
    expectedQuality: "Debe listar etapas clave de proyecto inmobiliario complejo en Chile: análisis normativo-territorial, estudios previos, anteproyecto, permisos urbanización/edificación, mitigaciones, recepciones.",
    expectedFormat: "Lista ordenada (numerada) de etapas, cada una con 1-2 oraciones. Respetar instrucción explícita 'respuesta tipo lista'. Extensión moderada, sin bloques largos."
  },
  {
    id: 6,
    question: "¿Qué debería hacer si quiero desarrollar un proyecto inmobiliario?",
    expectedQuality: "Orientación práctica sobre pasos y permisos. Mencionar: revisión IPT (PRC, PRI, PRMS), definición proyecto, anteproyecto, permisos urbanización/edificación, estudios, recepción final.",
    expectedFormat: "Respuesta concisa, lista o pasos numerados. 5-8 pasos máximos, cada uno corto. Evitar 'muros de texto'. Referencias breves al final de cada punto."
  },
  {
    id: 7,
    question: "En términos de permisos, ¿con cuántos debo contar para desarrollar un proyecto inmobiliario? Para un caso residencial, industrial y comercial.",
    expectedQuality: "Listado claro de permisos básicos y variaciones por tipo de proyecto. Incluir: anteproyecto, permiso urbanización, edificación, recepciones, autorizaciones sectoriales.",
    expectedFormat: "Estructura por secciones: (1) Permisos comunes, (2) adicionales residenciales, (3) industriales, (4) comerciales. Formato viñetas, frases cortas."
  },
  {
    id: 8,
    question: "¿Cuáles son las diferencias entre subdivisión y división afecta?",
    expectedQuality: "Explicar diferencia conceptual y procedimental entre subdivisión predial y división afecta. Definición, objetivo, requisitos, efectos sobre propiedad, referencias normativas.",
    expectedFormat: "Formato comparativo: dos listas o tabla conceptual. 3-5 bullets por concepto. Al final 1-2 líneas sintetizando diferencia práctica."
  }
];

async function main() {
  console.log('🧪 M1-v2 RAG Evaluation - Asistente Legal Territorial RDI');
  console.log('=======================================================\n');
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
          minSimilarity: 0.5
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
        console.log(`   Source: ${result.sourceName}`);
        console.log(`   Preview: ${result.text.substring(0, 150)}...`);
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
          source: r.sourceName,
          preview: r.text.substring(0, 100)
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
