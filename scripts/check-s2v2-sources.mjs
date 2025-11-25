#!/usr/bin/env node

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({ projectId: 'salfagpt' });
const db = getFirestore();

const S2V2_ID = '1lgr33ywq5qed67sqCYi';

async function check() {
  console.log('🔍 Verificando sources de S2-v2...\n');
  
  // Get active source IDs
  const agentDoc = await db.collection('conversations').doc(S2V2_ID).get();
  const activeIds = agentDoc.data()?.activeContextSourceIds || [];
  
  console.log(`Sources en activeContextSourceIds: ${activeIds.length}\n`);
  
  // Check first 10 sources
  console.log('Verificando primeros 10 sources:\n');
  
  let found = 0;
  let missing = 0;
  let withStorage = 0;
  
  for (let i = 0; i < Math.min(10, activeIds.length); i++) {
    const sourceId = activeIds[i];
    const sourceDoc = await db.collection('context_sources').doc(sourceId).get();
    
    if (sourceDoc.exists) {
      found++;
      const data = sourceDoc.data();
      const storagePath = data?.metadata?.storagePath || data?.originalFileUrl;
      if (storagePath) withStorage++;
      
      console.log(`✅ [${i+1}] ${data?.name || 'Sin nombre'}`);
      console.log(`   ID: ${sourceId.substring(0, 20)}...`);
      console.log(`   Storage: ${storagePath ? storagePath.substring(0, 60) + '...' : '❌ NO TIENE'}`);
      console.log('');
    } else {
      missing++;
      console.log(`❌ [${i+1}] Source NO EXISTE: ${sourceId}`);
      console.log('');
    }
  }
  
  console.log('═'.repeat(60));
  console.log(`\nSample (10 sources):`);
  console.log(`  Found: ${found}`);
  console.log(`  Missing: ${missing}`);
  console.log(`  With storage path: ${withStorage}`);
  console.log(`  Without storage path: ${found - withStorage}`);
  
  if (missing > 0) {
    console.log(`\n⚠️ ${missing} sources referenced but don't exist in Firestore`);
    console.log('   Esto causará "Source not found" en la UI');
  }
  
  if (withStorage < found) {
    console.log(`\n⚠️ ${found - withStorage} sources sin storagePath/originalFileUrl`);
    console.log('   No se podrán ver/descargar archivos originales');
  }
  
  process.exit(0);
}

check();

