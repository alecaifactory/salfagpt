#!/usr/bin/env node
// Create "Cursor" agent for alec@getaifactory.com

import { Firestore } from '@google-cloud/firestore';

const PROJECT_ID = 'gen-lang-client-0986191192';
const userId = '114671162830729001607'; // alec@getaifactory.com

const firestore = new Firestore({
  projectId: PROJECT_ID,
});

async function createCursorAgent() {
  try {
    console.log('\n🤖 Creando agente "Cursor"...');
    console.log('📦 Proyecto:', PROJECT_ID);
    console.log('👤 Usuario:', userId);
    console.log('');
    
    const conversationRef = firestore.collection('conversations').doc();
    const now = new Date();
    
    const conversation = {
      id: conversationRef.id,
      userId,
      title: 'Cursor',
      createdAt: now,
      updatedAt: now,
      lastMessageAt: now,
      messageCount: 0,
      contextWindowUsage: 0,
      agentModel: 'gemini-2.5-flash',
      source: 'localhost',
      status: 'active',
    };

    await conversationRef.set(conversation);
    
    console.log('✅ Agente "Cursor" creado exitosamente!');
    console.log('');
    console.log('Detalles:');
    console.log('  Título:', conversation.title);
    console.log('  ID:', conversation.id);
    console.log('  Modelo:', conversation.agentModel);
    console.log('  Mensajes:', conversation.messageCount);
    console.log('');
    
    return conversation;
  } catch (error) {
    console.error('\n❌ Error creando agente:', error.message);
    console.error('💡 Asegúrate de haber ejecutado: gcloud auth application-default login');
    console.error('');
    process.exit(1);
  }
}

createCursorAgent()
  .then(() => {
    console.log('🎉 Proceso completado\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

