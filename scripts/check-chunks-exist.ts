import { firestore } from '../src/lib/firestore';

async function checkChunks() {
  // Get GOP GPT M3 sources
  const agentDoc = await firestore.collection('conversations').doc('5aNwSMgff2BRKrrVRypF').get();
  const sourceIds = agentDoc.data()?.activeContextSourceIds || [];
  
  console.log(`📊 Checking chunks for ${sourceIds.length} sources...\n`);
  
  let totalChunks = 0;
  let sourcesWithChunks = 0;
  let sourcesWithoutChunks = 0;
  
  for (let i = 0; i < Math.min(10, sourceIds.length); i++) {
    const sourceId = sourceIds[i];
    
    const chunksSnapshot = await firestore
      .collection('document_chunks')
      .where('sourceId', '==', sourceId)
      .get();
    
    const sourceDoc = await firestore.collection('context_sources').doc(sourceId).get();
    const sourceName = sourceDoc.data()?.name || 'Unknown';
    const userId = sourceDoc.data()?.userId;
    
    if (chunksSnapshot.size > 0) {
      sourcesWithChunks++;
      totalChunks += chunksSnapshot.size;
      console.log(`✅ [${i+1}] ${sourceName.substring(0, 50)}`);
      console.log(`     Chunks: ${chunksSnapshot.size}, userId: ${userId}`);
    } else {
      sourcesWithoutChunks++;
      console.log(`❌ [${i+1}] ${sourceName.substring(0, 50)}`);
      console.log(`     Chunks: 0, userId: ${userId}`);
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   Sources with chunks: ${sourcesWithChunks}`);
  console.log(`   Sources without chunks: ${sourcesWithoutChunks}`);
  console.log(`   Total chunks found: ${totalChunks}`);
  
  // Now check if those chunks have userId that matches
  if (totalChunks > 0) {
    console.log(`\n🔍 Checking userId on chunks...`);
    const sampleSourceId = sourceIds[0];
    const sampleChunks = await firestore
      .collection('document_chunks')
      .where('sourceId', '==', sampleSourceId)
      .limit(3)
      .get();
    
    sampleChunks.docs.forEach(doc => {
      const data = doc.data();
      console.log(`   Chunk ${doc.id}:`);
      console.log(`     userId: ${data.userId}`);
      console.log(`     sourceId: ${data.sourceId}`);
      console.log(`     chunkIndex: ${data.chunkIndex}`);
    });
  }
  
  process.exit(0);
}

checkChunks();

