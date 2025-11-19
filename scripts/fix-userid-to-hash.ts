/**
 * Fix userId on context_sources documents
 * 
 * Update from Google numeric ID to hash ID so the API can find them
 */

import { firestore } from '../src/lib/firestore';

async function fixUserIds() {
  const googleId = '114671162830729001607';
  const hashId = 'usr_uhwqffaqag1wrryd82tw';
  const agentId = 'TestApiUpload_S001';
  
  console.log('\n🔧 Fixing userId on context_sources documents\n');
  console.log(`From: ${googleId} (Google numeric ID)`);
  console.log(`To:   ${hashId} (hash ID)\n`);
  
  // Get all documents with the old Google ID
  const docs = await firestore
    .collection('context_sources')
    .where('userId', '==', googleId)
    .get();
  
  console.log(`✅ Found ${docs.size} documents to update\n`);
  
  if (docs.size === 0) {
    console.log('No documents to update!');
    return;
  }
  
  // Update in batches
  const batch = firestore.batch();
  let count = 0;
  
  docs.forEach(doc => {
    const data = doc.data();
    console.log(`   ${count + 1}. ${data.name} (${doc.id})`);
    
    batch.update(doc.ref, {
      userId: hashId,
      updatedAt: new Date(),
    });
    
    count++;
  });
  
  console.log(`\n🔄 Updating ${count} documents...`);
  await batch.commit();
  console.log(`✅ Updated successfully!\n`);
  
  // Also update the agent's userId
  console.log(`🔄 Updating agent userId...`);
  await firestore.collection('conversations').doc(agentId).update({
    userId: hashId,
    updatedAt: new Date(),
  });
  console.log(`✅ Agent updated!\n`);
  
  // Verify
  console.log('🔍 Verifying...');
  const verifyDocs = await firestore
    .collection('context_sources')
    .where('userId', '==', hashId)
    .where('assignedToAgents', 'array-contains', agentId)
    .get();
  
  console.log(`✅ Verification: ${verifyDocs.size} documents now have correct userId\n`);
  
  console.log('═══════════════════════════════════════');
  console.log('✅ DONE!');
  console.log('═══════════════════════════════════════');
  console.log(`Updated ${count} context_sources documents`);
  console.log(`Updated 1 agent document`);
  console.log(`\n💡 Now refresh the UI and documents should appear!`);
}

fixUserIds().then(() => process.exit(0));

