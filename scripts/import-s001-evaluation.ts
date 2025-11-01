/**
 * Import S001 Evaluation Data
 * 
 * Purpose: Import S001 testing data as an example evaluation
 * Run: npx tsx scripts/import-s001-evaluation.ts
 */

import { firestore } from '../src/lib/firestore';
import { EVALUATION_COLLECTIONS } from '../src/types/evaluations';
import type { Evaluation, EvaluationQuestion, TestResult } from '../src/types/evaluations';

const S001_QUESTIONS = [
  {
    id: 'S001-Q001',
    number: 1,
    category: 'Códigos y Catálogos',
    priority: 'critical' as const,
    question: '¿Dónde busco los códigos de materiales?',
    expectedTopics: ['SAP', 'código material', 'transacción', 'catálogo'],
    tested: true,
    testResult: {
      quality: 9,
      phantomRefs: false,
      references: 6,
      date: '2025-10-29',
      notes: 'Excellent response with two specific locations and SAP procedure',
    },
  },
  {
    id: 'S001-Q002',
    number: 2,
    category: 'Procedimientos SAP',
    priority: 'critical' as const,
    question: '¿Cómo hago una pedido de convenio?',
    expectedTopics: ['pedido', 'convenio', 'SAP', 'procedimiento'],
    tested: true,
    testResult: {
      quality: 8,
      phantomRefs: false,
      references: 3,
      date: '2025-10-29',
      notes: 'Good SAP transaction guidance, could be more detailed',
    },
  },
  {
    id: 'S001-Q004',
    number: 4,
    category: 'Gestión Combustible',
    priority: 'critical' as const,
    question: '¿Cómo genero el informe de consumo de petróleo?',
    expectedTopics: ['ZMM_IE', 'SAP', 'Sociedad', 'PEP', 'Formulario'],
    expectedDocuments: ['PP-009', 'I-006'],
    tested: true,
    testResult: {
      quality: 10,
      phantomRefs: false,
      references: 3,
      date: '2025-10-29',
      notes: 'Perfect - complete procedure, ZMM_IE transaction, found PP-009',
    },
  },
  {
    id: 'S001-Q009',
    number: 9,
    category: 'Guías de Despacho',
    priority: 'critical' as const,
    question: '¿Cómo genero una guía de despacho?',
    expectedTopics: ['guía despacho', 'SAP', 'procedimiento'],
    tested: true,
    testResult: {
      quality: 10,
      phantomRefs: false,
      references: 2,
      date: '2025-10-29',
      notes: 'OUTSTANDING - three different methods (VA01, MIGO, VL01NO), comprehensive',
    },
  },
];

const S001_TEST_RESULTS = [
  {
    id: 'result-001',
    evaluationId: 'EVAL-S001-2025-10-29-v1',
    questionId: 'S001-Q001',
    agentId: 'AjtQZEIMQvFnPRJRjl4y',
    testedBy: '114671162830729001607',
    testedByEmail: 'alec@getaifactory.com',
    prompt: '¿Dónde busco los códigos de materiales?',
    context: ['76 fuentes de contexto'],
    model: 'gemini-2.5-flash',
    response: 'Puedes buscar los códigos de materiales en dos lugares: 1) ANEXO: CÓDIGOS DE MATERIAL INSUMOS DE TECNOLOGÍA, 2) SAP: función de búsqueda por Texto breve material',
    references: [
      { id: 'ref-1', name: 'Paso a Paso Insumos Tecnológicos-GTI', similarity: 0.748, content: '...' },
      { id: 'ref-2', name: 'Evaluación Proveedores SAP', similarity: 0.735, content: '...' },
    ],
    quality: 9,
    phantomRefs: false,
    expectedTopicsFound: ['SAP', 'código material', 'catálogo'],
    expectedTopicsMissing: [],
    notes: 'Excellent response with specific locations and examples',
    passedCriteria: true,
  },
  {
    id: 'result-002',
    evaluationId: 'EVAL-S001-2025-10-29-v1',
    questionId: 'S001-Q002',
    agentId: 'AjtQZEIMQvFnPRJRjl4y',
    testedBy: '114671162830729001607',
    testedByEmail: 'alec@getaifactory.com',
    prompt: '¿Cómo hago una pedido de convenio?',
    context: ['76 fuentes de contexto'],
    model: 'gemini-2.5-flash',
    response: 'Transacción ME21N, tipo de pedido ZCON (Contra Convenio)',
    references: [
      { id: 'ref-2', name: 'MAQ-ABA-CNV-PP-001 Compras por Convenio', similarity: 0.808, content: '...' },
    ],
    quality: 8,
    phantomRefs: false,
    expectedTopicsFound: ['pedido', 'convenio', 'SAP'],
    expectedTopicsMissing: [],
    notes: 'Good but brief, could include more step-by-step details',
    passedCriteria: true,
  },
  {
    id: 'result-004',
    evaluationId: 'EVAL-S001-2025-10-29-v1',
    questionId: 'S001-Q004',
    agentId: 'AjtQZEIMQvFnPRJRjl4y',
    testedBy: '114671162830729001607',
    testedByEmail: 'alec@getaifactory.com',
    prompt: '¿Cómo genero el informe de consumo de petróleo?',
    context: ['76 fuentes de contexto'],
    model: 'gemini-2.5-flash',
    response: 'Transaction ZMM_IE, campos: Sociedad, PEP, Formulario. Documento PP-009 tiene el procedimiento completo.',
    references: [
      { id: 'ref-1', name: 'PP-009', similarity: 0.807, content: '...' },
    ],
    quality: 10,
    phantomRefs: false,
    expectedTopicsFound: ['ZMM_IE', 'SAP', 'Sociedad', 'PEP'],
    expectedTopicsMissing: [],
    notes: 'Perfect - complete procedure, found specific document',
    passedCriteria: true,
  },
  {
    id: 'result-009',
    evaluationId: 'EVAL-S001-2025-10-29-v1',
    questionId: 'S001-Q009',
    agentId: 'AjtQZEIMQvFnPRJRjl4y',
    testedBy: '114671162830729001607',
    testedByEmail: 'alec@getaifactory.com',
    prompt: '¿Cómo genero una guía de despacho?',
    context: ['76 fuentes de contexto'],
    model: 'gemini-2.5-flash',
    response: 'Tres métodos: 1) VA01 (desde pedido), 2) MIGO + ZMM_MB90 (traspaso), 3) VL01NO (sin referencia)',
    references: [
      { id: 'ref-1', name: 'Paso a Paso Guia Despacho Electronica', similarity: 0.82, content: '...' },
      { id: 'ref-2', name: 'MAQ-LOG-CBO-PP-010 Emisión Guías Sin Referencia', similarity: 0.82, content: '...' },
    ],
    quality: 10,
    phantomRefs: false,
    expectedTopicsFound: ['guía despacho', 'SAP', 'procedimiento'],
    expectedTopicsMissing: [],
    notes: 'OUTSTANDING - comprehensive coverage of 3 methods, detailed fields',
    passedCriteria: true,
  },
];

async function importS001Evaluation() {
  console.log('📦 Importing S001 Evaluation Data...\n');

  const evaluationId = 'EVAL-S001-2025-10-29-v1';

  // Create evaluation document
  const evaluation: Evaluation = {
    id: evaluationId,
    agentId: 'AjtQZEIMQvFnPRJRjl4y',
    agentName: 'GESTION BODEGAS GPT (S001)',
    version: 'v1',
    createdBy: '114671162830729001607',
    createdByEmail: 'alec@getaifactory.com',
    createdAt: new Date('2025-10-29T20:00:00Z'),
    totalQuestions: 66,
    questions: S001_QUESTIONS as EvaluationQuestion[],
    categories: [
      { id: 'cat-01', name: 'Códigos y Catálogos', count: 7, priority: 'high' },
      { id: 'cat-02', name: 'Procedimientos SAP', count: 18, priority: 'critical' },
      { id: 'cat-03', name: 'Gestión Combustible', count: 5, priority: 'critical' },
      { id: 'cat-04', name: 'Transporte y Logística', count: 7, priority: 'high' },
      { id: 'cat-05', name: 'Guías de Despacho', count: 3, priority: 'critical' },
      { id: 'cat-06', name: 'Inventarios', count: 6, priority: 'high' },
      { id: 'cat-07', name: 'Traspasos', count: 3, priority: 'high' },
      { id: 'cat-08', name: 'Bodega Fácil', count: 8, priority: 'medium' },
      { id: 'cat-09', name: 'Equipos Terceros', count: 3, priority: 'medium' },
      { id: 'cat-10', name: 'Documentación', count: 7, priority: 'high' },
    ],
    successCriteria: {
      minimumQuality: 5.0,
      allowPhantomRefs: false,
      minCriticalCoverage: 3,
      minReferenceRelevance: 0.7,
      additionalRequirements: 'Debe mencionar transacciones SAP específicas cuando sea relevante',
    },
    status: 'completed',
    questionsTested: 4,
    questionsPassedQuality: 4,
    averageQuality: 9.25,
    phantomRefsDetected: 0,
    avgSimilarity: 0.77,
    source: 'Especialistas Salfa - Gestión de Bodegas',
    notes: 'Sample validation complete. System validated as production-ready.',
    updatedAt: new Date('2025-10-29T20:30:00Z'),
  };

  // Save evaluation
  console.log('1️⃣  Creating evaluation document...');
  
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
  
  for (const result of S001_TEST_RESULTS) {
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

  console.log('\n🎉 S001 Evaluation imported successfully!');
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
importS001Evaluation()
  .then(() => {
    console.log('\n✅ Import complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  });



