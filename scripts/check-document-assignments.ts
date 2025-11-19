import { firestore } from '../src/lib/firestore';

async function main() {
  const userId = 'usr_uhwqffaqag1wrryd82tw';
  
  console.log('\n🔍 Checking document assignments for user:', userId);
  console.log('═'.repeat(70), '\n');
  
  // Get all documents
  const docs = await firestore
    .collection('context_sources')
    .where('userId', '==', userId)
    .limit(10)
    .get();
  
  console.log(`Found ${docs.size} documents (showing first 10):\n`);
  
  const agentCounts: Record<string, number> = {};
  
  docs.docs.forEach((doc, i) => {
    const data = doc.data();
    const agents = data.assignedToAgents || [];
    
    console.log(`${i + 1}. ${data.name}`);
    console.log(`   Document ID: ${doc.id}`);
    console.log(`   Assigned to: ${agents.join(', ') || 'NONE'}`);
    console.log();
    
    agents.forEach((agentId: string) => {
      agentCounts[agentId] = (agentCounts[agentId] || 0) + 1;
    });
  });
  
  console.log('\n📊 Agent Assignment Summary:');
  console.log('═'.repeat(70));
  for (const [agentId, count] of Object.entries(agentCounts)) {
    console.log(`   ${agentId}: ${count} documents`);
  }
}

main().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

