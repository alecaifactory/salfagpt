#!/usr/bin/env node

import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { Storage } from '@google-cloud/storage';

if (getApps().length === 0) initializeApp({ projectId: 'salfagpt' });
const db = getFirestore();
const storage = new Storage({ projectId: 'salfagpt' });

console.log('🔄 UPDATING ALL FIRESTORE PATHS TO us-east4');
console.log('═'.repeat(70));

// Get ALL PDFs for user
const snapshot = await db.collection('context_sources')
  .where('userId', '==', 'usr_uhwqffaqag1wrryd82tw')
  .where('type', '==', 'pdf')
  .get();

console.log(`📊 Found ${snapshot.size} PDF documents\n`);

let updated = 0;
let skipped = 0;
let notFound = 0;

for (const doc of snapshot.docs) {
  const data = doc.data();
  const currentPath = data.metadata?.storagePath;
  
  // Skip if already has us-east4 structure
  if (currentPath && currentPath.startsWith('usr_')) {
    skipped++;
    continue;
  }
  
  // Search in us-east4 bucket
  try {
    const bucket = storage.bucket('salfagpt-context-documents-east4');
    const [files] = await bucket.getFiles({ prefix: 'usr_uhwqffaqag1wrryd82tw/' });
    
    const match = files.find(f => {
      const fileName = f.name.split('/').pop().toLowerCase();
      const docName = data.name.toLowerCase();
      return fileName === docName || 
             fileName.includes(docName.substring(0, 30)) ||
             docName.includes(fileName.substring(0, 30));
    });
    
    if (match) {
      await doc.ref.update({
        'metadata.storagePath': match.name,
        'metadata.bucketName': 'salfagpt-context-documents-east4',
        'metadata.gcsPath': `gs://salfagpt-context-documents-east4/${match.name}`,
        'metadata.location': 'us-east4',
      });
      updated++;
      if (updated % 10 === 0) console.log(`  ✅ ${updated} updated...`);
    } else {
      notFound++;
    }
  } catch (error) {
    console.log(`  ❌ ${doc.id}: ${error.message}`);
  }
}

console.log('\n' + '═'.repeat(70));
console.log('📊 SUMMARY:');
console.log(`  Total: ${snapshot.size}`);
console.log(`  Updated: ${updated}`);
console.log(`  Skipped: ${skipped} (already correct)`);
console.log(`  Not found: ${notFound}`);
console.log('═'.repeat(70));
console.log('\n✅ COMPLETE - Refresh browser now\n');

process.exit(0);
