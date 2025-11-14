/**
 * Debug script to check Firestore chunk structure
 */

import { firestore } from '../src/lib/firestore';

async function debugChunkStructure() {
  console.log('🔍 Checking Firestore chunk structure...\n');

  const snapshot = await firestore.collection('document_chunks').limit(3).get();
  
  console.log(`Found ${snapshot.size} chunks to examine\n`);

  snapshot.docs.forEach((doc, index) => {
    const chunk = doc.data();
    
    console.log(`Chunk ${index + 1}:`);
    console.log(`  ID: ${doc.id}`);
    console.log(`  Fields present:`, Object.keys(chunk));
    console.log(`  userId:`, chunk.userId);
    console.log(`  sourceId:`, chunk.sourceId);
    console.log(`  chunkIndex:`, chunk.chunkIndex);
    console.log(`  chunkText exists:`, !!chunk.chunkText);
    console.log(`  text exists:`, !!chunk.text);
    console.log(`  embedding exists:`, !!chunk.embedding);
    console.log(`  embedding length:`, chunk.embedding?.length);
    console.log(`  metadata:`, chunk.metadata);
    console.log('');
  });

  process.exit(0);
}

debugChunkStructure().catch(console.error);

