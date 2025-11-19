/**
 * Debug why the API isn't returning documents for the agent
 */

import { firestore } from '../src/lib/firestore';

async function debugAgentAPI() {
  const agentId = 'TestApiUpload_S001';
  const googleUserId = '114671162830729001607'; // The user ID from CLI uploads
  
  console.log('\n🔍 Debugging Agent API Issue\n');
  console.log(`Agent ID: ${agentId}`);
  console.log(`Google User ID: ${googleUserId}\n`);
  
  // Test 1: Check if agent exists
  console.log('Test 1: Check if agent document exists');
  const agentDoc = await firestore.collection('conversations').doc(agentId).get();
  if (!agentDoc.exists) {
    console.log('❌ Agent does not exist!');
    return;
  }
  const agentData = agentDoc.data();
  console.log(`✅ Agent exists: ${agentData?.name}`);
  console.log(`   activeContextSourceIds: ${agentData?.activeContextSourceIds?.length || 0} IDs\n`);
  
  // Test 2: Query with userId + assignedToAgents
  console.log('Test 2: Query with userId + assignedToAgents (like the API does)');
  const apiQuery = await firestore
    .collection('context_sources')
    .where('userId', '==', googleUserId)
    .where('assignedToAgents', 'array-contains', agentId)
    .get();
  
  console.log(`✅ Query returned: ${apiQuery.size} documents\n`);
  
  if (apiQuery.size === 0) {
    console.log('❌ API query returns 0 documents!\n');
    
    // Test 3: Check what userId is actually on the documents
    console.log('Test 3: Checking userId on uploaded documents');
    const allDocs = await firestore
      .collection('context_sources')
      .where('assignedToAgents', 'array-contains', agentId)
      .limit(5)
      .get();
    
    console.log(`Found ${allDocs.size} documents with agentId in assignedToAgents`);
    if (allDocs.size > 0) {
      allDocs.docs.forEach((doc, i) => {
        const data = doc.data();
        console.log(`\n   Document ${i + 1}: ${data.name}`);
        console.log(`   - userId: "${data.userId}" (type: ${typeof data.userId})`);
        console.log(`   - Expected: "${googleUserId}"`);
        console.log(`   - Match: ${data.userId === googleUserId ? '✅ YES' : '❌ NO'}`);
        console.log(`   - assignedToAgents: ${JSON.stringify(data.assignedToAgents)}`);
      });
      
      // Check if there's a userId mismatch
      const firstDoc = allDocs.docs[0].data();
      if (firstDoc.userId !== googleUserId) {
        console.log(`\n⚠️  ISSUE FOUND: Documents have userId="${firstDoc.userId}" but API is querying with userId="${googleUserId}"`);
        console.log(`\n💡 Solution: Update the API to use the correct userId, or update documents to have the correct userId`);
      }
    }
  } else {
    console.log('✅ API query works correctly! Documents:');
    apiQuery.docs.forEach((doc, i) => {
      const data = doc.data();
      console.log(`   ${i + 1}. ${data.name}`);
    });
  }
  
  // Test 4: Check agent's userId
  console.log(`\nTest 4: Check agent's userId`);
  console.log(`   Agent userId: "${agentData?.userId}"`);
  console.log(`   Expected: "${googleUserId}"`);
  console.log(`   Match: ${agentData?.userId === googleUserId ? '✅ YES' : '❌ NO'}`);
}

debugAgentAPI().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});

