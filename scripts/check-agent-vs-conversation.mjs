#!/usr/bin/env node

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({ projectId: 'salfagpt' });
const db = getFirestore();

async function checkAgentVsConversation() {
  const agentId = 'iQmdg3bMSJ1AdqqlFpye';
  
  console.log('🔍 Verificando Agent vs Conversation...\n');
  
  try {
    // Get the document
    const doc = await db.collection('conversations').doc(agentId).get();
    
    if (!doc.exists) {
      console.log('❌ Documento no existe');
      return;
    }
    
    const data = doc.data();
    
    console.log('📋 Datos del documento:');
    console.log(`   ID: ${doc.id}`);
    console.log(`   title: "${data.title}"`);
    console.log(`   isAgent: ${data.isAgent}`);
    console.log(`   userId: ${data.userId}`);
    console.log(`   agentId: ${data.agentId || 'N/A'}`);
    console.log(`   createdAt: ${data.createdAt?.toDate?.()}`);
    console.log(`   messageCount: ${data.messageCount || 0}`);
    
    console.log('\n' + '='.repeat(60));
    
    if (data.isAgent === true) {
      console.log('📌 TIPO: AGENTE (Padre)');
      console.log('   → El título debería ser: "S1-v2"');
      console.log(`   → Título actual: "${data.title}"`);
      
      if (data.title !== 'S1-v2') {
        console.log('\n⚠️  PROBLEMA DETECTADO:');
        console.log('   El título del AGENTE fue modificado.');
        console.log('   Esto NO debería pasar.');
        console.log('\n   ¿Quieres que lo corrija a "S1-v2"? (y/n)');
      } else {
        console.log('\n✅ Título correcto');
      }
      
      // Check for conversations derived from this agent
      console.log('\n📚 Conversaciones derivadas de este agente:');
      const conversationsSnapshot = await db.collection('conversations')
        .where('agentId', '==', agentId)
        .where('isAgent', '==', false)
        .limit(5)
        .get();
      
      if (conversationsSnapshot.empty) {
        console.log('   (No hay conversaciones derivadas aún)');
      } else {
        conversationsSnapshot.docs.forEach((convDoc, idx) => {
          const convData = convDoc.data();
          console.log(`   ${idx + 1}. "${convData.title}" (${convData.messageCount || 0} mensajes)`);
        });
      }
      
    } else if (data.agentId) {
      console.log('💬 TIPO: CONVERSACIÓN (Derivada)');
      console.log(`   → Derivada del agente: ${data.agentId}`);
      console.log(`   → Título: "${data.title}" (puede cambiar)`);
    } else {
      console.log('⚠️  TIPO: Conversación sin agente');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkAgentVsConversation();

