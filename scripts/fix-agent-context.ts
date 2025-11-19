/**
 * Fix TestApiUpload_S001 activeContextSourceIds
 * 
 * Sync the activeContextSourceIds with all documents that have this agent in assignedToAgents
 */

import { firestore } from '../src/lib/firestore';

async function fixAgentContext() {
  const agentId = 'TestApiUpload_S001';
  const userId = 'usr_uhwqffaqag1wrryd82tw'; // ✅ Hash ID (primary)
  
  console.log(`\n🔧 Fixing agent context for: ${agentId}`);
  console.log(`   User ID: ${userId} (hash ID)\n`);
  
  try {
    // 1. Get all documents assigned to this agent (filtered by user's hash ID)
    const contextSources = await firestore
      .collection('context_sources')
      .where('userId', '==', userId) // ✅ Filter by hash ID
      .where('assignedToAgents', 'array-contains', agentId)
      .get();
    
    console.log(`✅ Found ${contextSources.size} documents assigned to agent\n`);
    
    // 2. Get all document IDs
    const allDocIds = contextSources.docs.map(doc => doc.id);
    
    console.log('📄 Document IDs to add to activeContextSourceIds:');
    allDocIds.forEach((id, index) => {
      const doc = contextSources.docs[index];
      const data = doc.data();
      console.log(`   ${index + 1}. ${id} - ${data.name}`);
    });
    
    // 3. Update agent's activeContextSourceIds
    console.log(`\n🔄 Updating agent's activeContextSourceIds...`);
    
    await firestore.collection('conversations').doc(agentId).update({
      activeContextSourceIds: allDocIds,
      updatedAt: new Date(),
    });
    
    console.log(`✅ Updated successfully!\n`);
    
    // 4. Verify
    const agentDoc = await firestore.collection('conversations').doc(agentId).get();
    const agentData = agentDoc.data();
    
    console.log('═══════════════════════════════════════');
    console.log('✅ VERIFICATION');
    console.log('═══════════════════════════════════════');
    console.log(`Active Context IDs count: ${agentData?.activeContextSourceIds?.length || 0}`);
    console.log(`Documents with agent assigned: ${contextSources.size}`);
    console.log(`Match: ${agentData?.activeContextSourceIds?.length === contextSources.size ? '✅ YES' : '❌ NO'}`);
    console.log('\n💡 Now refresh the UI and the documents should appear!\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixAgentContext().then(() => process.exit(0));

