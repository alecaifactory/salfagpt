/**
 * Fix Agent Name and Reassign Documents
 * 
 * Ensures agent rzEqb17ZwSjk99bZHbTv has name "TestApiUpload_S001"
 * and all CLI documents are assigned to it
 */

import { firestore } from '../src/lib/firestore';

async function main() {
  const targetAgentId = 'rzEqb17ZwSjk99bZHbTv';
  const desiredName = 'TestApiUpload_S001';
  const userId = 'usr_uhwqffaqag1wrryd82tw';
  
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║           Fix Agent Name and Reassign Documents             ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  // Step 1: Update agent name/title
  console.log('🔧 STEP 1: Updating agent name...');
  console.log('═'.repeat(60));
  console.log(`   Agent ID: ${targetAgentId}`);
  console.log(`   Setting name to: ${desiredName}`);
  
  await firestore.collection('conversations').doc(targetAgentId).update({
    name: desiredName,
    agentName: desiredName,
    title: desiredName,
    organizationId: 'getaifactory.com',
    messageCount: 0,
    version: 1,
    source: 'cli',
    updatedAt: new Date(),
  });
  
  console.log('   ✅ Agent name updated');
  
  // Step 2: Find all CLI-uploaded documents
  console.log('\n🔍 STEP 2: Finding CLI-uploaded documents...');
  console.log('═'.repeat(60));
  
  const cliDocs = await firestore
    .collection('context_sources')
    .where('userId', '==', userId)
    .where('metadata.uploadedVia', '==', 'cli')
    .get();
  
  console.log(`   Found ${cliDocs.size} CLI-uploaded documents`);
  
  if (cliDocs.size === 0) {
    console.log('\n⚠️  No CLI documents found. Checking for test-script uploads...');
    
    const testDocs = await firestore
      .collection('context_sources')
      .where('userId', '==', userId)
      .where('metadata.uploadedVia', '==', 'test-script')
      .get();
    
    console.log(`   Found ${testDocs.size} test-script documents`);
    
    if (testDocs.size > 0) {
      // Reassign test-script docs instead
      await reassignDocuments(testDocs, targetAgentId, userId);
    } else {
      console.log('\n⚠️  No documents to reassign.');
    }
  } else {
    await reassignDocuments(cliDocs, targetAgentId, userId);
  }
  
  console.log('\n\n═'.repeat(60));
  console.log('✅ COMPLETE');
  console.log('═'.repeat(60));
  console.log(`\n📊 Summary:`);
  console.log(`   Agent ID: ${targetAgentId}`);
  console.log(`   Agent Name: ${desiredName}`);
  console.log(`\n💡 Refresh your browser and check agent "${desiredName}"`);
  console.log('');
}

async function reassignDocuments(
  docs: FirebaseFirestore.QuerySnapshot,
  targetAgentId: string,
  userId: string
) {
  console.log('\n🔄 STEP 3: Reassigning documents...');
  console.log('═'.repeat(60));
  
  const batch = firestore.batch();
  let count = 0;
  
  for (const doc of docs.docs) {
    const docRef = firestore.collection('context_sources').doc(doc.id);
    batch.update(docRef, {
      assignedToAgents: [targetAgentId],
      updatedAt: new Date(),
    });
    count++;
    
    if (count % 500 === 0) {
      await batch.commit();
      console.log(`   ✅ Committed batch of ${count} documents`);
    }
  }
  
  if (count % 500 !== 0) {
    await batch.commit();
  }
  
  console.log(`   ✅ Reassigned ${count} documents to agent: ${targetAgentId}`);
  
  // Step 4: Update activeContextSourceIds
  console.log('\n🔗 STEP 4: Updating activeContextSourceIds...');
  console.log('═'.repeat(60));
  
  const allAssignedDocs = await firestore
    .collection('context_sources')
    .where('userId', '==', userId)
    .where('assignedToAgents', 'array-contains', targetAgentId)
    .get();
  
  const docIds = allAssignedDocs.docs.map(d => d.id);
  
  await firestore.collection('conversations').doc(targetAgentId).update({
    activeContextSourceIds: docIds,
    updatedAt: new Date(),
  });
  
  console.log(`   ✅ Synced ${docIds.length} documents to activeContextSourceIds`);
}

main().then(() => process.exit(0)).catch(err => {
  console.error('\n❌ Error:', err);
  process.exit(1);
});

