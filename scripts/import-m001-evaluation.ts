/**
 * Import M001 Evaluation Data
 * 
 * Purpose: Import M001 testing data as an example evaluation
 * Run: npx tsx scripts/import-m001-evaluation.ts
 */

import { firestore } from '../src/lib/firestore';
import { EVALUATION_COLLECTIONS } from '../src/types/evaluations';
import type { Evaluation, EvaluationQuestion, TestResult } from '../src/types/evaluations';

// Based on M001 testing session results
const M001_TESTED_QUESTIONS = [
  {
    id: 'M001-Q001',
    number: 1,
    category: 'Normativa y Excepciones',
    priority: 'critical' as const,
    question: '¿Cuáles son las excepciones a la prohibición de subdividir predios agrícolas?',
    expectedTopics: ['subdivisión', 'predios agrícolas', 'excepciones', 'DL 3516'],
    tested: true,
    testResult: {
      quality: 10,
      phantomRefs: false,
      references: 6,
      date: '2025-10-29',
      notes: 'Perfect response - comprehensive, specific law citations, clear structure',
    },
  },
  {
    id: 'M001-Q003',
    number: 3,
    category: 'Casos Específicos - Viabilidad',
    priority: 'critical' as const,
    question: '¿Se puede subdividir un predio de 5 hectáreas en la comuna de Paine?',
    expectedTopics: ['subdivisión', 'Paine', 'hectáreas', 'viabilidad'],
    tested: true,
    testResult: {
      quality: 10,
      phantomRefs: false,
      references: 8,
      date: '2025-10-29',
      notes: 'Excellent - specific to Paine, mentions 0.5ha minimum, DL 3516 Article 55',
    },
  },
  {
    id: 'M001-Q008',
    number: 8,
    category: 'Diferencias Procedimentales',
    priority: 'high' as const,
    question: '¿Cuál es la diferencia entre loteo y subdivisión?',
    expectedTopics: ['loteo', 'subdivisión', 'diferencias', 'definiciones'],
    tested: true,
    testResult: {
      quality: 8,
      phantomRefs: false,
      references: 7,
      date: '2025-10-29',
      notes: 'Good explanation with key differences, could add more examples',
    },
  },
  {
    id: 'M001-Q011',
    number: 11,
    category: 'Requisitos de Permisos',
    priority: 'critical' as const,
    question: '¿Qué permisos se necesitan para construir en un terreno agrícola?',
    expectedTopics: ['permisos', 'construcción', 'terreno agrícola', 'SAG'],
    tested: true,
    testResult: {
      quality: 9,
      phantomRefs: false,
      references: 6,
      date: '2025-10-29',
      notes: 'Very comprehensive - SAG, DOM, environmental, all mentioned',
    },
  },
];

const M001_TEST_RESULTS = [
  {
    id: 'result-m001-001',
    evaluationId: 'EVAL-M001-2025-10-29-v1',
    questionId: 'M001-Q001',
    agentId: 'AGENT_M001_ID', // Replace with actual ID
    testedBy: '114671162830729001607',
    testedByEmail: 'alec@getaifactory.com',
    prompt: '¿Cuáles son las excepciones a la prohibición de subdividir predios agrícolas?',
    context: ['Legal documents'],
    model: 'gemini-2.5-flash',
    response: 'Las excepciones incluyen: 1) Predios mayores a 0.5 hectáreas físicas, 2) Transferencias por herencia...',
    references: [],
    quality: 10,
    phantomRefs: false,
    expectedTopicsFound: ['subdivisión', 'excepciones', 'DL 3516'],
    expectedTopicsMissing: [],
    notes: 'Perfect - comprehensive law citations',
    passedCriteria: true,
  },
  {
    id: 'result-m001-003',
    evaluationId: 'EVAL-M001-2025-10-29-v1',
    questionId: 'M001-Q003',
    agentId: 'AGENT_M001_ID',
    testedBy: '114671162830729001607',
    testedByEmail: 'alec@getaifactory.com',
    prompt: '¿Se puede subdividir un predio de 5 hectáreas en la comuna de Paine?',
    context: ['Legal documents'],
    model: 'gemini-2.5-flash',
    response: 'Sí, en Paine se puede subdividir hasta 0.5 hectáreas según DL 3516 Art. 55...',
    references: [],
    quality: 10,
    phantomRefs: false,
    expectedTopicsFound: ['Paine', 'hectáreas', 'DL 3516'],
    expectedTopicsMissing: [],
    notes: 'Excellent - specific to Paine comuna',
    passedCriteria: true,
  },
  {
    id: 'result-m001-008',
    evaluationId: 'EVAL-M001-2025-10-29-v1',
    questionId: 'M001-Q008',
    agentId: 'AGENT_M001_ID',
    testedBy: '114671162830729001607',
    testedByEmail: 'alec@getaifactory.com',
    prompt: '¿Cuál es la diferencia entre loteo y subdivisión?',
    context: ['Legal documents'],
    model: 'gemini-2.5-flash',
    response: 'Loteo: división urbana con urbanización. Subdivisión: división sin urbanización...',
    references: [],
    quality: 8,
    phantomRefs: false,
    expectedTopicsFound: ['loteo', 'subdivisión', 'diferencias'],
    expectedTopicsMissing: [],
    notes: 'Good explanation, could add more examples',
    passedCriteria: true,
  },
  {
    id: 'result-m001-011',
    evaluationId: 'EVAL-M001-2025-10-29-v1',
    questionId: 'M001-Q011',
    agentId: 'AGENT_M001_ID',
    testedBy: '114671162830729001607',
    testedByEmail: 'alec@getaifactory.com',
    prompt: '¿Qué permisos se necesitan para construir en un terreno agrícola?',
    context: ['Legal documents'],
    model: 'gemini-2.5-flash',
    response: 'Se requieren: 1) SAG (cambio de uso), 2) DOM (permiso edificación), 3) Ambiental (si aplica)...',
    references: [],
    quality: 9,
    phantomRefs: false,
    expectedTopicsFound: ['permisos', 'SAG', 'construcción'],
    expectedTopicsMissing: [],
    notes: 'Comprehensive - all key permits mentioned',
    passedCriteria: true,
  },
];

async function importM001Evaluation() {
  console.log('📦 Importing M001 Evaluation Data...\n');

  const evaluationId = 'EVAL-M001-2025-10-29-v1';

  // Create evaluation document
  const evaluation: Evaluation = {
    id: evaluationId,
    agentId: 'AGENT_M001_ID', // Replace with actual M001 agent ID
    agentName: 'Asistente Legal Territorial RDI (M001)',
    version: 'v1',
    createdBy: '114671162830729001607',
    createdByEmail: 'alec@getaifactory.com',
    createdAt: new Date('2025-10-29T20:00:00Z'),
    totalQuestions: 19,
    questions: M001_TESTED_QUESTIONS as EvaluationQuestion[],
    categories: [
      { id: 'cat-01', name: 'Conceptos y Diferencias', count: 2, priority: 'high' },
      { id: 'cat-02', name: 'Requisitos de Permisos', count: 3, priority: 'critical' },
      { id: 'cat-03', name: 'Casos Específicos - Viabilidad', count: 4, priority: 'high' },
      { id: 'cat-04', name: 'Normativa y Excepciones', count: 3, priority: 'high' },
      { id: 'cat-05', name: 'Diferencias Procedimentales', count: 2, priority: 'medium' },
      { id: 'cat-06', name: 'Documentación Específica', count: 2, priority: 'medium' },
      { id: 'cat-07', name: 'Conflictos Normativos', count: 2, priority: 'medium' },
      { id: 'cat-08', name: 'Procedimientos Técnicos', count: 1, priority: 'low' },
    ],
    successCriteria: {
      minimumQuality: 5.0,
      allowPhantomRefs: false,
      minCriticalCoverage: 3,
      minReferenceRelevance: 0.7,
      additionalRequirements: 'Debe citar leyes y artículos específicos (DL 3516, LGUC, etc.)',
    },
    status: 'in_progress',
    questionsTested: 4,
    questionsPassedQuality: 4,
    averageQuality: 9.25,
    phantomRefsDetected: 0,
    avgSimilarity: 0.80,
    source: 'Especialistas Salfa - Legal y Territorial',
    notes: 'Sample validation in progress. 4 questions tested with excellent results.',
    updatedAt: new Date('2025-10-29T20:30:00Z'),
  };

  // Save evaluation
  console.log('1️⃣  Creating M001 evaluation document...');
  
  const evalData = Object.fromEntries(
    Object.entries(evaluation).filter(([_, v]) => v !== undefined)
  );

  await firestore
    .collection(EVALUATION_COLLECTIONS.EVALUATIONS)
    .doc(evaluationId)
    .set(evalData);

  console.log('✅ Evaluation created:', evaluationId);

  // Save test results
  console.log('\n2️⃣  Creating test results...');
  
  for (const result of M001_TEST_RESULTS) {
    const resultData = {
      ...result,
      testedAt: new Date('2025-10-29T20:15:00Z'),
    };

    const cleanData = Object.fromEntries(
      Object.entries(resultData).filter(([_, v]) => v !== undefined)
    );

    await firestore
      .collection(EVALUATION_COLLECTIONS.TEST_RESULTS)
      .doc(result.id)
      .set(cleanData);

    console.log('✅ Result saved:', result.questionId, '-', result.quality + '/10');
  }

  console.log('\n🎉 M001 Evaluation imported successfully!');
  console.log('\nSummary:');
  console.log('- Evaluation ID:', evaluationId);
  console.log('- Total Questions:', evaluation.totalQuestions);
  console.log('- Questions Tested:', evaluation.questionsTested);
  console.log('- Average Quality:', evaluation.averageQuality + '/10');
  console.log('- Phantom Refs:', evaluation.phantomRefsDetected);
  console.log('- Status:', evaluation.status);
  console.log('\n✅ Data ready in Firestore!');
}

// Run import
importM001Evaluation()
  .then(() => {
    console.log('\n✅ Import complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  });




