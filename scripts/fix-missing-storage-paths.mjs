#!/usr/bin/env node

/**
 * Fix: Update context_sources with correct storagePaths
 * 
 * Problem: Docs have extractedData but no storagePath
 * Solution: Search Cloud Storage buckets and update Firestore
 */

import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { Storage } from '@google-cloud/storage';

if (getApps().length === 0) {
  initializeApp({ projectId: 'salfagpt' });
}

const db = getFirestore();
const storage = new Storage({ projectId: 'salfagpt' });

const BUCKETS = [
  'salfagpt-context-documents-east4',
  'salfagpt-context-documents',
  'salfagpt-uploads',
];

async function findFileInBuckets(sourceName) {
  // Try to find file by name in all buckets
  for (const bucketName of BUCKETS) {
    try {
      const bucket = storage.bucket(bucketName);
      const [files] = await bucket.getFiles();
      
      // Search for file with similar name
      const match = files.find(f => 
        f.name.toLowerCase().includes(sourceName.toLowerCase().replace(/\.pdf$/i, '').substring(0, 30))
      );
      
      if (match) {
        return {
          bucket: bucketName,
          path: match.name,
          fullPath: `gs://${bucketName}/${match.name}`
        };
      }
    } catch (error) {
      console.log(`  ⚠️  Error searching ${bucketName}:`, error.message);
    }
  }
  
  return null;
}

async function fixMissingPaths() {
  console.log('🔧 FIXING MISSING STORAGE PATHS');
  console.log('═'.repeat(70));
  console.log('');
  
  // Get all sources without storagePath
  const sourcesSnap = await db.collection('context_sources')
    .where('userId', '==', 'usr_uhwqffaqag1wrryd82tw')
    .get();
  
  console.log(`📊 Checking ${sourcesSnap.size} sources...\n`);
  
  let missing = 0;
  let found = 0;
  let updated = 0;
  
  for (const doc of sourcesSnap.docs) {
    const data = doc.data();
    const hasPath = data.metadata?.storagePath || data.metadata?.gcsPath;
    
    if (!hasPath && data.type === 'pdf') {
      missing++;
      console.log(`❌ Missing: ${data.name}`);
      console.log(`   ID: ${doc.id}`);
      console.log(`   Searching in Cloud Storage...`);
      
      const fileInfo = await findFileInBuckets(data.name);
      
      if (fileInfo) {
        found++;
        console.log(`   ✅ Found in: ${fileInfo.bucket}`);
        console.log(`   Path: ${fileInfo.path}`);
        
        // Update Firestore
        await doc.ref.update({
          'metadata.storagePath': fileInfo.path,
          'metadata.gcsPath': fileInfo.fullPath,
          'metadata.bucketName': fileInfo.bucket,
          'metadata.fixedAt': new Date().toISOString()
        });
        
        updated++;
        console.log(`   ✅ Updated in Firestore`);
      } else {
        console.log(`   ❌ NOT FOUND in any bucket`);
        console.log(`   Acción: Re-upload archivo original`);
      }
      
      console.log('');
    }
  }
  
  console.log('═'.repeat(70));
  console.log('📊 RESUMEN:');
  console.log(`   Total PDFs: ${sourcesSnap.docs.filter(d => d.data().type === 'pdf').length}`);
  console.log(`   Sin storagePath: ${missing}`);
  console.log(`   Encontrados en GCS: ${found}`);
  console.log(`   Actualizados: ${updated}`);
  console.log(`   Sin archivo: ${missing - found}`);
  console.log('═'.repeat(70));
  
  if (updated > 0) {
    console.log('\n✅ Refresh browser - PDFs deberían cargar ahora');
  }
  
  if (missing - found > 0) {
    console.log('\n⚠️  Algunos docs no tienen archivo original');
    console.log('   Acción: Re-upload desde fuente original');
  }
}

fixMissingPaths()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });

