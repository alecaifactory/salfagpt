/**
 * Verify Agent Context Synchronization
 * Check if activeContextSourceIds matches assigned documents
 */

import { firestore } from '../src/lib/firestore';

async function main() {
  console.log('🔍 Verifying agent context synchronization...\n');
  
  const agentId = 'TestApiUpload_S001';
  const userId = 'usr_uhwqffaqag1wrryd82tw'; // Hash ID
  
  // 1. Get agent's activeContextSourceIds
  const agentDoc = await firestore.collection('conversations').doc(agentId).get();
  const agentData = agentDoc.data();
  const activeIds = agentData?.activeContextSourceIds || [];
  
  console.log(`📋 Agent: ${agentId}`);
  console.log(`   activeContextSourceIds count: ${activeIds.length}`);
  console.log(`   First 5 IDs: ${activeIds.slice(0, 5).join(', ')}`);
  console.log('');
  
  // 2. Get all documents assigned to this agent (using hash ID)
  const assignedDocs = await firestore
    .collection('context_sources')
    .where('userId', '==', userId) // ✅ Hash ID query
    .where('assignedToAgents', 'array-contains', agentId)
    .get();
  
  const assignedIds = assignedDocs.docs.map(doc => doc.id);
  
  console.log(`📄 Documents assigned to agent (using hash ID query):`);
  console.log(`   Count: ${assignedIds.length}`);
  console.log(`   First 5 IDs: ${assignedIds.slice(0, 5).join(', ')}`);
  console.log('');
  
  // 3. Compare
  if (activeIds.length === assignedIds.length) {
    console.log('✅ SYNC CHECK: Counts match!');
    console.log(`   Both have ${activeIds.length} documents`);
  } else {
    console.log('❌ SYNC CHECK: Counts DO NOT match!');
    console.log(`   activeContextSourceIds: ${activeIds.length}`);
    console.log(`   assignedToAgents: ${assignedIds.length}`);
    console.log('');
    console.log('💡 This means documents won\'t appear in the UI');
    console.log('💡 Run: npx tsx scripts/fix-agent-context.ts');
  }
  
  console.log('');
}

main().then(() => process.exit(0)).catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});

