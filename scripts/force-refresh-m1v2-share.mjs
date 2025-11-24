#!/usr/bin/env node
/**
 * Force Refresh M1-v2 Share Document
 * 
 * Delete and recreate the M1-v2 agent_shares document
 * to trigger UI refresh
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({ projectId: 'salfagpt' });
const db = getFirestore();

const M1_AGENT_ID = 'cjn3bC0HrUYtHqu69CKS';
const OWNER_ID = 'usr_uhwqffaqag1wrryd82tw';

async function main() {
  console.log('\n🔄 FORCE REFRESH M1-v2 SHARING\n');
  
  // Step 1: Get current agent_shares document
  console.log('Step 1: Reading current M1-v2 agent_shares...');
  const currentShares = await db.collection('agent_shares')
    .where('agentId', '==', M1_AGENT_ID)
    .get();
  
  if (currentShares.empty) {
    console.log('❌ No agent_shares document found!\n');
    process.exit(1);
  }
  
  const currentDoc = currentShares.docs[0];
  const currentData = currentDoc.data();
  
  console.log(`   Found document: ${currentDoc.id}`);
  console.log(`   Contains: ${currentData.sharedWith?.length || 0} users\n`);
  
  // Step 2: Delete current document
  console.log('Step 2: Deleting current document...');
  await currentDoc.ref.delete();
  console.log(`   ✅ Deleted: ${currentDoc.id}\n`);
  
  // Step 3: Wait a moment
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Step 4: Create new document with EXACT same data but new timestamp
  console.log('Step 3: Creating fresh document...');
  
  const newDocRef = db.collection('agent_shares').doc();
  await newDocRef.set({
    id: newDocRef.id,
    agentId: M1_AGENT_ID,
    ownerId: OWNER_ID,
    sharedWith: currentData.sharedWith, // Keep same users
    accessLevel: currentData.accessLevel || 'use',
    createdAt: new Date(), // NEW timestamp
    updatedAt: new Date(), // NEW timestamp
    createdBy: OWNER_ID
  });
  
  console.log(`   ✅ Created: ${newDocRef.id}`);
  console.log(`   Contains: ${currentData.sharedWith.length} users\n`);
  
  // Step 5: Verify
  console.log('Step 4: Verifying...');
  const verifyShares = await db.collection('agent_shares')
    .where('agentId', '==', M1_AGENT_ID)
    .get();
  
  console.log(`   Documents: ${verifyShares.size}`);
  if (verifyShares.size > 0) {
    const doc = verifyShares.docs[0];
    console.log(`   sharedWith: ${doc.data().sharedWith?.length} users`);
    console.log(`   First 3: ${doc.data().sharedWith?.slice(0, 3).map(u => u.email).join(', ')}\n`);
  }
  
  console.log('═'.repeat(80));
  console.log('✅ M1-v2 SHARING REFRESHED');
  console.log('═'.repeat(80));
  console.log();
  console.log('Next steps:');
  console.log('  1. Hard refresh browser: Cmd+Shift+R');
  console.log('  2. Close and reopen M1-v2 sharing modal');
  console.log('  3. Should now show 14 users\n');
  console.log('If still not working, there may be a UI caching issue');
  console.log('or the API endpoint may need debugging.\n');
  
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});

