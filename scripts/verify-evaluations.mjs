/**
 * Verify Evaluations in Firestore
 * Run: node scripts/verify-evaluations.mjs
 */

import { Firestore } from '@google-cloud/firestore';

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'salfagpt';

const firestore = new Firestore({
  projectId: PROJECT_ID,
});

async function verify() {
  console.log('🔍 Verificando evaluaciones en Firestore...\n');
  console.log('📊 Project:', PROJECT_ID);
  console.log('');
  
  try {
    // Check evaluations
    const evalSnapshot = await firestore.collection('evaluations').get();
    console.log('✅ Evaluaciones encontradas:', evalSnapshot.size);
    console.log('');
    
    if (evalSnapshot.size > 0) {
      evalSnapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log('📋 Evaluación:', doc.id);
        console.log('   Agente:', data.agentName);
        console.log('   Preguntas totales:', data.totalQuestions);
        console.log('   Preguntas probadas:', data.questionsTested);
        console.log('   Calidad promedio:', data.averageQuality + '/10');
        console.log('   Phantom refs:', data.phantomRefsDetected);
        console.log('   Estado:', data.status);
        console.log('   Creado por:', data.createdByEmail);
        console.log('');
      });
    } else {
      console.log('⚠️  No se encontraron evaluaciones');
      console.log('   Run: npx tsx scripts/import-s001-evaluation.ts');
    }
    
    // Check test results
    const resultsSnapshot = await firestore.collection('test_results').get();
    console.log('✅ Test Results encontrados:', resultsSnapshot.size);
    console.log('');
    
    if (resultsSnapshot.size > 0) {
      resultsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log('🧪 Test:', doc.id);
        console.log('   Pregunta:', data.questionId);
        console.log('   Calidad:', data.quality + '/10');
        console.log('   Phantom refs:', data.phantomRefs ? 'SÍ ⚠️' : 'NO ✅');
        console.log('   Evaluado por:', data.testedByEmail);
        console.log('');
      });
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Verificación completa!');
    console.log('');
    console.log('📍 Para ver en UI:');
    console.log('   1. Abrir: http://localhost:3000/chat');
    console.log('   2. Login: alec@getaifactory.com');
    console.log('   3. Menu usuario → "Sistema de Evaluaciones"');
    console.log('   4. Ver evaluación S001');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('');
    console.error('💡 Asegúrate de:');
    console.error('   1. gcloud auth application-default login');
    console.error('   2. GOOGLE_CLOUD_PROJECT=salfagpt en .env');
  }
}

verify();












