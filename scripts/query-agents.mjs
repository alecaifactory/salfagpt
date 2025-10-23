#!/usr/bin/env node
// Query agents directly from Firestore

import { Firestore } from '@google-cloud/firestore';

const PROJECT_ID = 'gen-lang-client-0986191192';
const userId = '114671162830729001607'; // alec@getaifactory.com

const firestore = new Firestore({
  projectId: PROJECT_ID,
});

async function main() {
  try {
    console.log('\n🔍 Consultando Firestore...');
    console.log('📦 Proyecto:', PROJECT_ID);
    console.log('👤 Usuario:', userId);
    console.log('');
    
    const snapshot = await firestore
      .collection('conversations')
      .where('userId', '==', userId)
      .orderBy('lastMessageAt', 'desc')
      .get();
    
    console.log('📋 AGENTES ACTIVOS - alec@getaifactory.com');
    console.log('═══════════════════════════════════════════════════════════════════════════════════════\n');
    console.log('Total de agentes encontrados:', snapshot.size);
    console.log('');
    
    if (snapshot.empty) {
      console.log('⚠️ No se encontraron agentes para este usuario.\n');
      return;
    }
    
    // Table header
    console.log('┌─────┬────────────────────────────────┬─────────┬──────────┬──────────────────┬─────────────────┐');
    console.log('│  #  │ Título                         │ Modelo  │ Mensajes │ Última Actividad │ ID              │');
    console.log('├─────┼────────────────────────────────┼─────────┼──────────┼──────────────────┼─────────────────┤');
    
    // Table rows
    snapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      const title = (data.title || 'Sin título').padEnd(30).substring(0, 30);
      const model = (data.agentModel === 'gemini-2.5-pro' ? 'Pro' : 'Flash').padEnd(7);
      const messages = String(data.messageCount || 0).padStart(8);
      const lastActivity = data.lastMessageAt 
        ? data.lastMessageAt.toDate().toLocaleDateString('es-ES', { 
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          }).padEnd(16)
        : 'N/A'.padEnd(16);
      const id = doc.id.substring(0, 15);
      const num = String(index + 1).padStart(3);
      
      console.log(`│ ${num} │ ${title} │ ${model} │ ${messages} │ ${lastActivity} │ ${id}... │`);
    });
    
    console.log('└─────┴────────────────────────────────┴─────────┴──────────┴──────────────────┴─────────────────┘');
    console.log('\n✅ Lista completa de agentes mostrada\n');
    
  } catch (error) {
    console.error('\n❌ Error consultando Firestore:', error.message);
    console.error('💡 Asegúrate de haber ejecutado: gcloud auth application-default login');
    console.error('');
    process.exit(1);
  }
}

main();

