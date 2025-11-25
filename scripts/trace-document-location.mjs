#!/usr/bin/env node

/**
 * Trace: Dónde está un documento específico y cómo accederlo
 */

import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { Storage } from '@google-cloud/storage';

if (getApps().length === 0) {
  initializeApp({ projectId: 'salfagpt' });
}

const db = getFirestore();
const storage = new Storage({ projectId: 'salfagpt' });

const DOC_NAME = 'GOP-D-PI-1.PLANIFICACION INICIAL DE OBRA-(V.1) (1).PDF';

async function trace() {
  console.log('🔍 RASTREANDO DOCUMENTO');
  console.log('═'.repeat(80));
  console.log(`Documento: ${DOC_NAME}`);
  console.log('');
  
  // Step 1: Find in Firestore
  console.log('PASO 1: Buscando en Firestore...');
  const sources = await db.collection('context_sources')
    .where('name', '==', DOC_NAME)
    .limit(1)
    .get();
  
  if (sources.empty) {
    console.log('❌ No encontrado en Firestore');
    process.exit(1);
  }
  
  const doc = sources.docs[0];
  const data = doc.data();
  
  console.log('✅ Encontrado en Firestore:');
  console.log(`   ID: ${doc.id}`);
  console.log(`   userId: ${data.userId}`);
  console.log(`   type: ${data.type}`);
  console.log('');
  console.log('   Metadata:');
  console.log(`     storagePath: ${data.metadata?.storagePath || 'N/A'}`);
  console.log(`     gcsPath: ${data.metadata?.gcsPath || 'N/A'}`);
  console.log(`     bucketName: ${data.metadata?.bucketName || 'N/A'}`);
  console.log(`     originalFileName: ${data.metadata?.originalFileName || 'N/A'}`);
  console.log('');
  
  // Step 2: Search in Cloud Storage buckets
  console.log('PASO 2: Buscando en Cloud Storage...');
  console.log('');
  
  const buckets = [
    'salfagpt-context-documents-east4',
    'salfagpt-context-documents',
    'salfagpt-uploads',
  ];
  
  for (const bucketName of buckets) {
    try {
      console.log(`📦 Bucket: ${bucketName}`);
      const bucket = storage.bucket(bucketName);
      
      // Get bucket location
      const [metadata] = await bucket.getMetadata();
      console.log(`   Location: ${metadata.location}`);
      
      // Search for file
      const [files] = await bucket.getFiles({
        prefix: data.userId || '',
        maxResults: 1000,
      });
      
      const match = files.find(f => 
        f.name.toLowerCase().includes('gop-d-pi-1') ||
        f.name.toLowerCase().includes('planificacion inicial')
      );
      
      if (match) {
        console.log(`   ✅ ENCONTRADO: ${match.name}`);
        console.log(`   Tamaño: ${(match.metadata.size / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   Ruta completa: gs://${bucketName}/${match.name}`);
        console.log('');
        
        // Test download
        console.log('   Probando descarga...');
        try {
          const [buffer] = await match.download();
          console.log(`   ✅ Descarga exitosa: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);
        } catch (dlError) {
          console.log(`   ❌ Error descarga: ${dlError.message}`);
        }
        
        console.log('');
        console.log('   📋 SOLUCIÓN:');
        console.log(`   Firestore debe tener:`);
        console.log(`     metadata.storagePath: "${match.name}"`);
        console.log(`     metadata.bucketName: "${bucketName}"`);
        console.log(`     metadata.gcsPath: "gs://${bucketName}/${match.name}"`);
        console.log('');
        
        // Update if needed
        if (data.metadata?.storagePath !== match.name) {
          console.log('   🔧 Actualizando Firestore...');
          await doc.ref.update({
            'metadata.storagePath': match.name,
            'metadata.bucketName': bucketName,
            'metadata.gcsPath': `gs://${bucketName}/${match.name}`,
          });
          console.log('   ✅ Firestore actualizado');
        } else {
          console.log('   ✅ Firestore ya tiene path correcto');
        }
        
        return; // Found, stop searching
      } else {
        console.log(`   ❌ No encontrado en este bucket`);
      }
      console.log('');
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      console.log('');
    }
  }
  
  console.log('═'.repeat(80));
  console.log('❌ Archivo no encontrado en NINGÚN bucket');
  console.log('');
  console.log('Posibles causas:');
  console.log('1. Archivo nunca se subió (solo se extrajo texto)');
  console.log('2. Archivo en bucket diferente');
  console.log('3. Nombre de archivo cambió');
  console.log('');
  console.log('Acción: Re-upload archivo original');
}

trace()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });

