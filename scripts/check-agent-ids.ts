import { firestore } from '../src/lib/firestore';

async function main() {
  const testId = 'TestApiUpload_S001';
  const otherId = 'rzEqb17ZwSjk99bZHbTv';
  const userId = 'usr_uhwqffaqag1wrryd82tw';
  
  const testAgent = await firestore.collection('conversations').doc(testId).get();
  const otherAgent = await firestore.collection('conversations').doc(otherId).get();
  
  console.log('\n=== Agent ID Comparison ===\n');
  
  console.log(`${testId}:`);
  console.log(`  Exists: ${testAgent.exists}`);
  if (testAgent.exists) {
    const data = testAgent.data();
    console.log(`  Name: ${data?.agentName || 'N/A'}`);
    console.log(`  Owner: ${data?.userId}`);
    console.log(`  Active contexts: ${data?.activeContextSourceIds?.length || 0}`);
    
    // Count actual documents
    const testDocs = await firestore
      .collection('context_sources')
      .where('userId', '==', userId)
      .where('assignedToAgents', 'array-contains', testId)
      .get();
    console.log(`  Documents in DB: ${testDocs.size}`);
  }
  
  console.log(`\n${otherId}:`);
  console.log(`  Exists: ${otherAgent.exists}`);
  if (otherAgent.exists) {
    const data = otherAgent.data();
    console.log(`  Name: ${data?.agentName || 'N/A'}`);
    console.log(`  Owner: ${data?.userId}`);
    console.log(`  Active contexts: ${data?.activeContextSourceIds?.length || 0}`);
    
    // Count actual documents
    const otherDocs = await firestore
      .collection('context_sources')
      .where('userId', '==', userId)
      .where('assignedToAgents', 'array-contains', otherId)
      .get();
    console.log(`  Documents in DB: ${otherDocs.size}`);
  }
  
  if (testAgent.exists && otherAgent.exists) {
    const areSame = testId === otherId;
    console.log(`\n✅ Both agents exist`);
    console.log(`Same agent? ${areSame ? 'YES' : 'NO'}`);
    
    if (!areSame) {
      console.log(`\n⚠️  These are DIFFERENT agents!`);
      console.log(`\n📊 Summary:`);
      console.log(`   Agent in UI: ${otherId}`);
      console.log(`   Agent with docs: ${testId}`);
      console.log(`\n💡 Solution: Look for agent "${testId}" in the UI's agent list`);
    }
  }
}

main().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

