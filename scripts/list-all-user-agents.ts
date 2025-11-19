import { firestore } from '../src/lib/firestore';

async function main() {
  const userId = 'usr_uhwqffaqag1wrryd82tw';
  
  console.log('\n📋 All Agents for User:', userId);
  console.log('═'.repeat(80), '\n');
  
  const agentsSnapshot = await firestore
    .collection('conversations')
    .where('userId', '==', userId)
    .where('isAgent', '==', true)
    .get();
  
  console.log(`Found ${agentsSnapshot.size} agents:\n`);
  
  for (const doc of agentsSnapshot.docs) {
    const data = doc.data();
    const displayName = data.name || data.agentName || data.title || 'N/A';
    
    // Count documents
    const docsSnapshot = await firestore
      .collection('context_sources')
      .where('userId', '==', userId)
      .where('assignedToAgents', 'array-contains', doc.id)
      .get();
    
    const activeCount = data.activeContextSourceIds?.length || 0;
    const docCount = docsSnapshot.size;
    const syncIcon = activeCount === docCount ? '✅' : '❌';
    
    console.log(`📁 ${displayName}`);
    console.log(`   ID: ${doc.id}`);
    console.log(`   Active Contexts: ${activeCount}`);
    console.log(`   Documents in DB: ${docCount} ${syncIcon}`);
    console.log();
  }
}

main().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

