import { firestore } from '../src/lib/firestore';

async function check() {
  // 1. Check agent owner ID
  const agent = await firestore.collection('conversations').doc('5aNwSMgff2BRKrrVRypF').get();
  const agentUserId = agent.data()?.userId;
  
  console.log('📊 GOP GPT M3 Agent:');
  console.log('   userId:', agentUserId);
  console.log('   Format:', agentUserId?.startsWith('usr_') ? 'usr_ format' : agentUserId?.startsWith('user_') ? 'user_ format' : 'other');
  
  // 2. Check chunks for this agent's sources
  const sourceIds = agent.data()?.activeContextSourceIds || [];
  if (sourceIds.length > 0) {
    const sourceId = sourceIds[0];
    const chunk = await firestore.collection('document_chunks')
      .where('sourceId', '==', sourceId)
      .limit(1)
      .get();
    
    if (!chunk.empty) {
      const chunkData = chunk.docs[0].data();
      console.log('\n📄 Sample Chunk:');
      console.log('   userId:', chunkData.userId);
      console.log('   googleUserId:', chunkData.googleUserId);
      console.log('   Format:', chunkData.userId?.startsWith('usr_') ? 'usr_ format' : chunkData.userId?.startsWith('user_') ? 'user_ format' : 'other');
    }
  }
  
  // 3. Check if they match
  console.log('\n🔍 Comparison:');
  const chunk = await firestore.collection('document_chunks')
    .where('sourceId', '==', sourceIds[0])
    .limit(1)
    .get();
  
  if (!chunk.empty) {
    const chunkUserId = chunk.docs[0].data().userId;
    console.log('   Agent userId:', agentUserId);
    console.log('   Chunk userId:', chunkUserId);
    console.log('   MATCH?:', agentUserId === chunkUserId ? 'YES ✅' : 'NO ❌ (THIS IS THE PROBLEM!)');
  }
  
  process.exit(0);
}

check();

