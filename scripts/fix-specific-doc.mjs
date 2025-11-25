#!/usr/bin/env node

import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (getApps().length === 0) {
  initializeApp({ projectId: 'salfagpt' });
}

const db = getFirestore();

// El documento específico que NO se ve
const DOC_ID = 'LqZZrXNqK5zKKl26rwXZ';
const CORRECT_PATH = 'usr_uhwqffaqag1wrryd82tw/vStojK73ZKbjNsEnqANJ/GOP-D-PI-1.PLANIFICACION INICIAL DE OBRA-(V.1) (1).PDF';

async function fixDoc() {
  console.log('🔧 FIXING SPECIFIC DOCUMENT');
  console.log('═'.repeat(70));
  console.log(`Doc ID: ${DOC_ID}`);
  console.log(`Correct path: ${CORRECT_PATH}`);
  console.log('');
  
  // Update Firestore
  await db.collection('context_sources').doc(DOC_ID).update({
    'metadata.storagePath': CORRECT_PATH,
    'metadata.bucketName': 'salfagpt-context-documents-east4',
    'metadata.gcsPath': `gs://salfagpt-context-documents-east4/${CORRECT_PATH}`,
    'metadata.location': 'us-east4',
    'metadata.fixedAt': new Date().toISOString(),
  });
  
  console.log('✅ Document updated in Firestore');
  console.log('');
  console.log('Verify:');
  
  const doc = await db.collection('context_sources').doc(DOC_ID).get();
  const data = doc.data();
  
  console.log('  storagePath:', data.metadata?.storagePath);
  console.log('  bucketName:', data.metadata?.bucketName);
  console.log('  gcsPath:', data.metadata?.gcsPath);
  console.log('');
  console.log('✅ FIXED');
  console.log('');
  console.log('Next: Refresh browser and click reference again');
}

fixDoc()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });

