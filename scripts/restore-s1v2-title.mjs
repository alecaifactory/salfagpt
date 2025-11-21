#!/usr/bin/env node

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({ projectId: 'salfagpt' });
const db = getFirestore();

async function restoreS1v2Title() {
  const agentId = 'iQmdg3bMSJ1AdqqlFpye';
  
  console.log('🔧 Restaurando título de S1-v2...\n');
  
  try {
    await db.collection('conversations').doc(agentId).update({
      title: 'S1-v2',
      updatedAt: new Date()
    });
    
    console.log('✅ Título restaurado a "S1-v2"');
    console.log('   Refresca el navegador para ver el cambio.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

restoreS1v2Title();

