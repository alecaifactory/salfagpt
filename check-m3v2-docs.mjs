/**
 * Quick script to check M3-v2 agent documents
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

// Initialize Firebase Admin
const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();
const agentId = 'vStojK73ZKbjNsEnqANJ';

async function main() {
  console.log('\n🔍 GOP GPT (M3-v2) - Current Documents\n');
  console.log('═'.repeat(70));
  
  // Get agent info
  const agentDoc = await db.collection('conversations').doc(agentId).get();
  if (!agentDoc.exists) {
    console.log('❌ Agent not found!');
    process.exit(1);
  }
  
  const agentData = agentDoc.data();
  console.log('✅ Agent found:');
  console.log('   Name:', agentData.name);
  console.log('   Owner:', agentData.userId);
  console.log('');
  
  // Get all documents assigned to this agent
  const sourcesSnapshot = await db.collection('context_sources')
    .where('assignedToAgents', 'array-contains', agentId)
    .orderBy('addedAt', 'desc')
    .get();
  
  console.log(`📚 Total documents: ${sourcesSnapshot.size}\n`);
  console.log('═'.repeat(70));
  console.log('\n📄 DOCUMENT LIST:\n');
  
  const documents = [];
  sourcesSnapshot.docs.forEach((doc, idx) => {
    const data = doc.data();
    documents.push({
      index: idx + 1,
      id: doc.id,
      name: data.name,
      status: data.status,
      ragEnabled: data.ragEnabled || false,
      chunks: data.ragMetadata?.chunkCount || 0,
      tags: data.tags || [],
      addedAt: data.addedAt?.toDate().toISOString().split('T')[0] || 'unknown'
    });
    
    console.log(`${idx + 1}. ${data.name}`);
    console.log(`   ID: ${doc.id}`);
    console.log(`   Status: ${data.status}`);
    console.log(`   RAG: ${data.ragEnabled ? 'Yes' : 'No'} (${data.ragMetadata?.chunkCount || 0} chunks)`);
    console.log(`   Tags: ${JSON.stringify(data.tags || [])}`);
    console.log(`   Added: ${data.addedAt?.toDate().toISOString().split('T')[0]}`);
    console.log('');
  });
  
  console.log('═'.repeat(70));
  console.log('\n📊 SUMMARY:');
  console.log(`   Total documents: ${documents.length}`);
  console.log(`   RAG enabled: ${documents.filter(d => d.ragEnabled).length}`);
  console.log(`   Total chunks: ${documents.reduce((sum, d) => sum + d.chunks, 0)}`);
  console.log('\n');
  
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});


