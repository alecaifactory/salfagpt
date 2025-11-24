#!/usr/bin/env node
/**
 * Fix M1-v2 API Query Issue
 * 
 * The API returns empty array for M1-v2 but not for M3-v2
 * Even though both documents exist in Firestore
 * 
 * Possible causes:
 * 1. Firestore index not ready for agent_shares collection
 * 2. Query timing issue
 * 3. Document field mismatch
 * 
 * Solution: Delete and recreate with EXACT same format as M3-v2
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({ projectId: 'salfagpt' });
const db = getFirestore();

const M1_AGENT_ID = 'cjn3bC0HrUYtHqu69CKS';
const M3_AGENT_ID = 'vStojK73ZKbjNsEnqANJ';

async function main() {
  console.log('\n🔧 FIXING M1-v2 API QUERY ISSUE\n');
  console.log('Problem: API returns empty array for M1-v2');
  console.log('Solution: Clone M3-v2 document structure exactly\n');
  
  // Step 1: Get M3-v2 document (working one)
  console.log('Step 1: Get M3-v2 document structure (working)...');
  const m3Shares = await db.collection('agent_shares')
    .where('agentId', '==', M3_AGENT_ID)
    .get();
  
  if (m3Shares.empty) {
    console.log('❌ M3-v2 document not found!');
    process.exit(1);
  }
  
  const m3Data = m3Shares.docs[0].data();
  console.log(`   ✅ Found M3-v2 document`);
  console.log(`   Structure: ${Object.keys(m3Data).join(', ')}\n`);
  
  // Step 2: Get M1-v2 users from conversations.sharedWith
  console.log('Step 2: Get M1-v2 users from conversations...');
  const m1Agent = await db.collection('conversations').doc(M1_AGENT_ID).get();
  const m1SharedWith = m1Agent.data().sharedWith || [];
  
  console.log(`   ✅ Found ${m1SharedWith.length} users in conversations.sharedWith\n`);
  
  // Step 3: Delete existing M1-v2 agent_shares
  console.log('Step 3: Delete existing M1-v2 agent_shares...');
  const m1Shares = await db.collection('agent_shares')
    .where('agentId', '==', M1_AGENT_ID)
    .get();
  
  if (!m1Shares.empty) {
    const batch = db.batch();
    m1Shares.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    console.log(`   ✅ Deleted ${m1Shares.size} old documents\n`);
  } else {
    console.log(`   ℹ️  No existing documents\n`);
  }
  
  // Wait a moment for Firestore to process
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Step 4: Create new M1-v2 document with EXACT M3 structure
  console.log('Step 4: Create new M1-v2 document (cloning M3 structure)...');
  
  const newM1Doc = {
    // Clone M3 structure exactly
    id: db.collection('agent_shares').doc().id,
    agentId: M1_AGENT_ID, // Change to M1
    ownerId: m3Data.ownerId, // Same
    sharedWith: m1SharedWith, // M1 users
    accessLevel: m3Data.accessLevel, // Same as M3
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: m3Data.createdBy || m3Data.ownerId
  };
  
  await db.collection('agent_shares').doc(newM1Doc.id).set(newM1Doc);
  
  console.log(`   ✅ Created document: ${newM1Doc.id}`);
  console.log(`   agentId: ${newM1Doc.agentId}`);
  console.log(`   sharedWith: ${newM1Doc.sharedWith.length} users`);
  console.log(`   Structure: ${Object.keys(newM1Doc).join(', ')}\n`);
  
  // Step 5: Verify query works
  console.log('Step 5: Verify query returns document...');
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const verifyQuery = await db.collection('agent_shares')
    .where('agentId', '==', M1_AGENT_ID)
    .get();
  
  console.log(`   Documents found: ${verifyQuery.size}`);
  
  if (verifyQuery.size > 0) {
    const doc = verifyQuery.docs[0];
    const data = doc.data();
    console.log(`   ✅ Query works!`);
    console.log(`   Document ID: ${doc.id}`);
    console.log(`   sharedWith: ${data.sharedWith?.length || 0} users\n`);
  } else {
    console.log(`   ❌ Query still returns empty!\n`);
  }
  
  console.log('═'.repeat(80));
  console.log('✅ M1-V2 DOCUMENT RECREATED');
  console.log('═'.repeat(80));
  console.log();
  console.log('Next steps:');
  console.log('  1. Wait 30 seconds for Firestore to propagate');
  console.log('  2. In browser Console, run the API test again:');
  console.log('     fetch(\'/api/agents/cjn3bC0HrUYtHqu69CKS/share\')');
  console.log('       .then(r => r.json())');
  console.log('       .then(d => console.log(\'Shares:\', d.shares?.length));');
  console.log('  3. Should now return: Shares: 1');
  console.log('  4. Refresh modal in UI\n');
  
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});

