/**
 * Import Complete M001 and S001 Evaluations
 * 
 * Purpose: Import full evaluations with ALL questions as sample questions
 * Run: npx tsx scripts/import-complete-evaluations.ts
 */

import { firestore } from '../src/lib/firestore';
import { EVALUATION_COLLECTIONS } from '../src/types/evaluations';
import type { Evaluation } from '../src/types/evaluations';
import m001Questions from '../docs/evaluations/questions/M001-questions-v1.json';
import s001Questions from '../docs/evaluations/questions/S001-questions-v1.json';

async function importCompleteEvaluations() {
  console.log('📦 Importing Complete Evaluations with ALL Questions...\n');

  // ========================================
  // M001 - Complete Import
  // ========================================
  console.log('1️⃣  Creating M001 Complete Evaluation...');
  
  const m001EvaluationId = 'EVAL-M001-COMPLETE-2025-10-29-v1';
  
  const m001Evaluation: Evaluation = {
    id: m001EvaluationId,
    agentId: 'AGENT_M001_ID',
    agentName: m001Questions.agentName,
    version: 'v1',
    createdBy: '114671162830729001607',
    createdByEmail: 'alec@getaifactory.com',
    createdAt: new Date('2025-10-29T20:00:00Z'),
    totalQuestions: m001Questions.totalQuestions,
    questions: m001Questions.questions as any,
    categories: m001Questions.categories as any,
    successCriteria: {
      minimumQuality: 5.0,
      allowPhantomRefs: false,
      minCriticalCoverage: 3,
      minReferenceRelevance: 0.7,
      additionalRequirements: 'Debe citar leyes y artículos específicos (DL 3516, LGUC, OGUC, etc.)',
    },
    status: 'draft',
    questionsTested: 0,
    questionsPassedQuality: 0,
    source: m001Questions.source,
    notes: 'Evaluación completa lista para testing. 19 preguntas sobre legislación territorial.',
    updatedAt: new Date('2025-10-29T20:30:00Z'),
  };

  const m001Data = Object.fromEntries(
    Object.entries(m001Evaluation).filter(([_, v]) => v !== undefined)
  );

  await firestore
    .collection(EVALUATION_COLLECTIONS.EVALUATIONS)
    .doc(m001EvaluationId)
    .set(m001Data);

  console.log('✅ M001 Complete Evaluation created:', m001EvaluationId);
  console.log('   Total Questions:', m001Questions.totalQuestions);
  console.log('   Categories:', m001Questions.categories.length);
  console.log('');

  // ========================================
  // S001 - Complete Import
  // ========================================
  console.log('2️⃣  Creating S001 Complete Evaluation...');
  
  const s001EvaluationId = 'EVAL-S001-COMPLETE-2025-10-29-v1';
  
  const s001Evaluation: Evaluation = {
    id: s001EvaluationId,
    agentId: 'AjtQZEIMQvFnPRJRjl4y',
    agentName: s001Questions.agentName,
    version: 'v1',
    createdBy: '114671162830729001607',
    createdByEmail: 'alec@getaifactory.com',
    createdAt: new Date('2025-10-29T20:00:00Z'),
    totalQuestions: s001Questions.totalQuestions,
    questions: s001Questions.questions as any,
    categories: s001Questions.categories as any,
    successCriteria: {
      minimumQuality: 5.0,
      allowPhantomRefs: false,
      minCriticalCoverage: 4,
      minReferenceRelevance: 0.7,
      additionalRequirements: 'Debe mencionar transacciones SAP específicas cuando sea relevante',
    },
    status: 'draft',
    questionsTested: 0,
    questionsPassedQuality: 0,
    source: s001Questions.source,
    notes: 'Evaluación completa lista para testing. 66 preguntas sobre gestión de bodegas y procedimientos SAP.',
    updatedAt: new Date('2025-10-29T20:30:00Z'),
  };

  const s001Data = Object.fromEntries(
    Object.entries(s001Evaluation).filter(([_, v]) => v !== undefined)
  );

  await firestore
    .collection(EVALUATION_COLLECTIONS.EVALUATIONS)
    .doc(s001EvaluationId)
    .set(s001Data);

  console.log('✅ S001 Complete Evaluation created:', s001EvaluationId);
  console.log('   Total Questions:', s001Questions.totalQuestions);
  console.log('   Categories:', s001Questions.categories.length);
  console.log('');

  // ========================================
  // Summary
  // ========================================
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 Complete Evaluations Imported Successfully!\n');
  console.log('📊 Summary:');
  console.log('');
  console.log('M001 - Asistente Legal Territorial RDI');
  console.log('  ├─ ID:', m001EvaluationId);
  console.log('  ├─ Questions:', m001Questions.totalQuestions);
  console.log('  ├─ Categories:', m001Questions.categories.length);
  console.log('  ├─ Status: draft (ready to test)');
  console.log('  └─ Topics: Legal, territorial, permisos, OGUC, LGUC');
  console.log('');
  console.log('S001 - GESTION BODEGAS GPT');
  console.log('  ├─ ID:', s001EvaluationId);
  console.log('  ├─ Questions:', s001Questions.totalQuestions);
  console.log('  ├─ Categories:', s001Questions.categories.length);
  console.log('  ├─ Status: draft (ready to test)');
  console.log('  └─ Topics: SAP, bodegas, inventarios, traspasos');
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('📍 Next Steps:');
  console.log('   1. Open: http://localhost:3000/chat');
  console.log('   2. Login: alec@getaifactory.com');
  console.log('   3. Menu → "Sistema de Evaluaciones"');
  console.log('   4. See 2 evaluations ready to test');
  console.log('');
  console.log('🧪 To Test:');
  console.log('   - Click on evaluation');
  console.log('   - Go to "Preguntas" tab');
  console.log('   - Filter by CRITICAL priority');
  console.log('   - Click "Probar" on any question');
  console.log('   - Execute test and rate quality');
  console.log('');
  console.log('✅ All data ready in Firestore!');
}

// Run import
importCompleteEvaluations()
  .then(() => {
    console.log('\n✅ Import complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Import failed:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  });

