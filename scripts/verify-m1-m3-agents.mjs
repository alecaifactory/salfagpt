#!/usr/bin/env node

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({ projectId: 'salfagpt' });
const db = getFirestore();

const AGENT_IDS = {
  'S1-v2': 'iQmdg3bMSJ1AdqqlFpye',
  'S2-v2': '1lgr33ywq5qed67sqCYi',
  'M1-v2': 'EgXezLcu4O3IUqFUJhUZ',
  'M3-v2': 'vStojK73ZKbjNsEnqANJ'
};

console.log('🔍 Verificando Agent IDs...\n');

for (const [name, id] of Object.entries(AGENT_IDS)) {
  try {
    const doc = await db.collection('conversations').doc(id).get();
    
    if (doc.exists) {
      const data = doc.data();
      console.log(`✅ ${name}:`);
      console.log(`   ID: ${id}`);
      console.log(`   Title: ${data.title || 'Sin título'}`);
      console.log(`   Sources: ${(data.activeContextSourceIds || []).length}`);
      console.log(`   Created: ${data.createdAt?.toDate?.()}`);
      console.log('');
    } else {
      console.log(`❌ ${name}: ID ${id} NO encontrado`);
      console.log('');
    }
  } catch (error) {
    console.log(`❌ ${name}: Error - ${error.message}`);
    console.log('');
  }
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

process.exit(0);

