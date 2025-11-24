#!/usr/bin/env node
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
initializeApp({ projectId: 'salfagpt' });
const db = getFirestore();

const USER_ID = 'usr_uhwqffaqag1wrryd82tw'; // alec@salfacloud.cl

async function findM3Agent() {
  console.log('🔍 Buscando agente M3-v2 (GOP GPT)...\n');

  try {
    const snapshot = await db.collection('conversations')
      .where('userId', '==', USER_ID)
      .get();

    let found = false;

    snapshot.docs.forEach(doc => {
      const title = doc.data().title || '';
      
      // Buscar M3, M003, GOP
      if (title.includes('M3') || title.includes('M003') || title.includes('GOP')) {
        console.log('✅ Encontrado:');
        console.log('   ID:', doc.id);
        console.log('   Title:', title);
        console.log('   Created:', doc.data().createdAt?.toDate?.());
        console.log('   Sources:', (doc.data().activeContextSourceIds || []).length);
        console.log('');
        found = true;
      }
    });

    if (!found) {
      console.log('⚠️  No encontrado con M3/M003/GOP. Listando todos los agentes:\n');
      snapshot.docs.forEach(doc => {
        const title = doc.data().title || '';
        console.log('   -', doc.id, ':', title);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

findM3Agent();

