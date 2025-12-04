#!/usr/bin/env node

/**
 * Fix M3-v2 activeContextSourceIds
 * The arrayUnion approach hit limits - need to directly set the array
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({ projectId: 'salfagpt' });
const db = getFirestore();

const M3V2_AGENT_ID = 'vStojK73ZKbjNsEnqANJ';
const USER_ID = 'usr_uhwqffaqag1wrryd82tw';

async function main() {
  console.log('🔧 Fixing M3-v2 activeContextSourceIds...\n');
  
  // 1. Get all agent_sources for M3-v2
  console.log('📥 Loading agent_sources assignments...');
  const agentSourcesSnapshot = await db.collection('agent_sources')
    .where('agentId', '==', M3V2_AGENT_ID)
    .get();
  
  const sourceIds = agentSourcesSnapshot.docs.map(doc => doc.data().sourceId);
  
  console.log(`✅ Found ${sourceIds.length} agent_sources\n`);
  
  // 2. Get current activeContextSourceIds
  const convDoc = await db.collection('conversations').doc(M3V2_AGENT_ID).get();
  const currentIds = convDoc.data().activeContextSourceIds || [];
  
  console.log(`📋 Current activeContextSourceIds: ${currentIds.length}`);
  console.log(`📋 Should be: ${sourceIds.length}\n`);
  
  if (currentIds.length === sourceIds.length) {
    console.log('✅ Already correct - no update needed!');
    return;
  }
  
  // 3. Update with complete array (direct set, not arrayUnion)
  console.log('🔄 Updating activeContextSourceIds...');
  
  await db.collection('conversations').doc(M3V2_AGENT_ID).update({
    activeContextSourceIds: sourceIds, // Direct set
    updatedAt: new Date()
  });
  
  console.log(`✅ Updated! Set ${sourceIds.length} source IDs\n`);
  
  // 4. Verify
  const verifyDoc = await db.collection('conversations').doc(M3V2_AGENT_ID).get();
  const verifyIds = verifyDoc.data().activeContextSourceIds || [];
  
  console.log('🔍 Verification:');
  console.log(`  ActiveContextSourceIds: ${verifyIds.length}`);
  console.log(`  Agent_sources: ${sourceIds.length}`);
  
  if (verifyIds.length === sourceIds.length) {
    console.log('\n✅ SUCCESS - Numbers match!\n');
    console.log(`M3-v2 now has ${sourceIds.length} sources enabled`);
  } else {
    console.log('\n⚠️  Still mismatch - may need to investigate array size limits');
  }
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });




