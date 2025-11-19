/**
 * Check what documents are assigned to TestApiUpload_S001
 */

import { firestore } from '../src/lib/firestore';

async function checkAgent() {
  const agentId = 'TestApiUpload_S001';
  
  console.log(`\n🔍 Checking agent: ${agentId}\n`);
  
  try {
    // 1. Check agent document
    const agentDoc = await firestore.collection('conversations').doc(agentId).get();
    
    if (!agentDoc.exists) {
      console.log('❌ Agent document does not exist!');
      return;
    }
    
    const agentData = agentDoc.data();
    console.log('✅ Agent exists:');
    console.log(`   Name: ${agentData?.name}`);
    console.log(`   Active Context IDs: ${agentData?.activeContextSourceIds?.length || 0}`);
    console.log(`   IDs: ${JSON.stringify(agentData?.activeContextSourceIds || [], null, 2)}`);
    
    // 2. Check context_sources collection for this agent
    console.log('\n🔍 Checking context_sources collection...\n');
    
    const contextSources = await firestore
      .collection('context_sources')
      .where('assignedToAgents', 'array-contains', agentId)
      .get();
    
    console.log(`✅ Found ${contextSources.size} documents with assignedToAgents containing this agent\n`);
    
    if (contextSources.size > 0) {
      console.log('📄 Documents:');
      contextSources.forEach((doc, index) => {
        const data = doc.data();
        console.log(`\n   ${index + 1}. ${data.name}`);
        console.log(`      ID: ${doc.id}`);
        console.log(`      Status: ${data.status}`);
        console.log(`      Enabled: ${data.enabled}`);
        console.log(`      Tags: ${JSON.stringify(data.tags)}`);
        console.log(`      RAG Enabled: ${data.ragEnabled}`);
        console.log(`      Chunks: ${data.ragMetadata?.chunkCount || 0}`);
      });
    }
    
    // 3. Check if there are any documents for this user
    console.log('\n\n🔍 Checking all documents for this user...\n');
    
    const userId = '114671162830729001607';
    const allUserDocs = await firestore
      .collection('context_sources')
      .where('userId', '==', userId)
      .get();
    
    console.log(`✅ Found ${allUserDocs.size} total documents for user ${userId}\n`);
    
    if (allUserDocs.size > 0) {
      console.log('📄 All User Documents:');
      allUserDocs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`\n   ${index + 1}. ${data.name}`);
        console.log(`      ID: ${doc.id}`);
        console.log(`      Assigned to: ${JSON.stringify(data.assignedToAgents || [])}`);
        console.log(`      Active for agent? ${data.assignedToAgents?.includes(agentId) ? 'YES' : 'NO'}`);
      });
    }
    
    // 4. Summary
    console.log('\n\n═══════════════════════════════════════');
    console.log('📊 SUMMARY');
    console.log('═══════════════════════════════════════');
    console.log(`Agent active context IDs: ${agentData?.activeContextSourceIds?.length || 0}`);
    console.log(`Documents with agent in assignedToAgents: ${contextSources.size}`);
    console.log(`Total user documents: ${allUserDocs.size}`);
    
    if (contextSources.size > 0 && agentData?.activeContextSourceIds?.length === 0) {
      console.log('\n⚠️  ISSUE: Documents are assigned but not in activeContextSourceIds!');
      console.log('💡 Solution: The documents need to be added to activeContextSourceIds array');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkAgent().then(() => process.exit(0));

