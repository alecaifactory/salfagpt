#!/usr/bin/env node
/**
 * Clean all documents from M3-v2 agent
 * Prepares for fresh upload
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

// Initialize
const serviceAccount = JSON.parse(readFileSync('./salfagpt-firebase-key.json', 'utf8'));
initializeApp({ credential: cert(serviceAccount) });

const db = getFirestore();
const agentId = 'vStojK73ZKbjNsEnqANJ';

async function clean() {
  console.log('🗑️  Cleaning M3-v2 documents...\n');
  
  // Get all documents
  const sources = await db.collection('context_sources')
    .where('assignedToAgents', 'array-contains', agentId)
    .get();
  
  console.log(`   Found: ${sources.size} documents`);
  
  if (sources.size === 0) {
    console.log('   ℹ️  No documents to delete\n');
    process.exit(0);
  }
  
  // Get chunks
  const sourceIds = sources.docs.map(d => d.id);
  let totalChunks = 0;
  
  console.log('   Counting chunks...');
  for (const sourceId of sourceIds) {
    const chunks = await db.collection('document_chunks')
      .where('sourceId', '==', sourceId)
      .get();
    totalChunks += chunks.size;
  }
  
  console.log(`   Found: ${totalChunks} chunks\n`);
  console.log('🗑️  Deleting chunks...');
  
  // Delete chunks (batch by source)
  for (let i = 0; i < sourceIds.length; i++) {
    const sourceId = sourceIds[i];
    const chunks = await db.collection('document_chunks')
      .where('sourceId', '==', sourceId)
      .get();
    
    if (chunks.size > 0) {
      const batch = db.batch();
      chunks.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      console.log(`   ✅ Deleted ${chunks.size} chunks for source ${i + 1}/${sourceIds.length}`);
    }
  }
  
  console.log(`\\n🗑️  Deleting ${sources.size} source documents...`);
  
  // Delete sources
  const batch = db.batch();
  sources.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
  
  console.log(`   ✅ Deleted ${sources.size} documents\n`);
  console.log('✅ M3-v2 cleaned successfully!');
  console.log(`   Removed: ${sources.size} documents + ${totalChunks} chunks\n`);
  
  process.exit(0);
}

clean().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});


