#!/usr/bin/env node
/**
 * Debug M1-v2 Sharing Issue
 * 
 * M1-v2 shows "Accesos Compartidos (0)" and empty list
 * But database has 14 users
 * 
 * This script checks:
 * 1. agent_shares collection for M1-v2
 * 2. Structure of the document
 * 3. Compare with S1-v2 (which works)
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({ projectId: 'salfagpt' });
const db = getFirestore();

const M1_AGENT_ID = 'cjn3bC0HrUYtHqu69CKS';
const S1_AGENT_ID = 'iQmdg3bMSJ1AdqqlFpye'; // Working one for comparison

async function debugAgent(agentId, name) {
  console.log(`\n${'═'.repeat(80)}`);
  console.log(`🔍 DEBUGGING: ${name}`);
  console.log('═'.repeat(80));
  
  // Check agent_shares collection
  const sharesSnapshot = await db.collection('agent_shares')
    .where('agentId', '==', agentId)
    .get();
  
  console.log(`\n1️⃣ agent_shares collection:`);
  console.log(`   Documents found: ${sharesSnapshot.size}`);
  
  if (sharesSnapshot.empty) {
    console.log(`   ❌ NO DOCUMENTS - This is the problem!`);
    console.log(`   UI reads from agent_shares and finds nothing\n`);
    return null;
  }
  
  const shareDoc = sharesSnapshot.docs[0];
  const shareData = shareDoc.data();
  
  console.log(`   Document ID: ${shareDoc.id}`);
  console.log(`   agentId: ${shareData.agentId}`);
  console.log(`   ownerId: ${shareData.ownerId}`);
  console.log(`   sharedWith length: ${shareData.sharedWith?.length || 0}`);
  console.log(`   createdAt: ${shareData.createdAt?.toDate?.() || shareData.createdAt}`);
  
  console.log(`\n2️⃣ sharedWith array (first 3):`);
  if (shareData.sharedWith && shareData.sharedWith.length > 0) {
    shareData.sharedWith.slice(0, 3).forEach((user, idx) => {
      console.log(`   User ${idx + 1}:`);
      console.log(`     email: ${user.email}`);
      console.log(`     name: ${user.name}`);
      console.log(`     userId: ${user.userId || 'MISSING'}`);
      console.log(`     accessLevel: ${user.accessLevel}`);
    });
  } else {
    console.log(`   ❌ sharedWith array is EMPTY or MISSING`);
  }
  
  console.log(`\n3️⃣ Full document structure:`);
  console.log(JSON.stringify({
    id: shareDoc.id,
    agentId: shareData.agentId,
    ownerId: shareData.ownerId,
    sharedWithLength: shareData.sharedWith?.length,
    hasSharedWith: !!shareData.sharedWith,
    isArray: Array.isArray(shareData.sharedWith)
  }, null, 2));
  
  return shareData;
}

async function main() {
  console.log('\n🔍 M1-v2 SHARING DEBUG\n');
  console.log('Problem: M1-v2 shows 0 shares in UI but should show 14\n');
  
  // Debug M1-v2
  const m1Data = await debugAgent(M1_AGENT_ID, 'M1-v2 (BROKEN)');
  
  // Debug S1-v2 for comparison
  const s1Data = await debugAgent(S1_AGENT_ID, 'S1-v2 (WORKING)');
  
  // Compare
  console.log('\n' + '═'.repeat(80));
  console.log('📊 COMPARISON');
  console.log('═'.repeat(80));
  console.log();
  
  if (!m1Data) {
    console.log('❌ M1-v2: NO agent_shares document');
    console.log('✅ S1-v2: HAS agent_shares document');
    console.log('\n🚨 ROOT CAUSE: M1-v2 agent_shares was not created or was deleted');
    console.log('\n💡 FIX: Re-run migration for M1-v2 only\n');
  } else if (m1Data && s1Data) {
    console.log('✅ Both have agent_shares documents');
    console.log(`   M1-v2: ${m1Data.sharedWith?.length || 0} users`);
    console.log(`   S1-v2: ${s1Data.sharedWith?.length || 0} users`);
    
    if ((m1Data.sharedWith?.length || 0) === 0) {
      console.log('\n🚨 M1-v2 sharedWith array is EMPTY');
      console.log('💡 FIX: Re-populate sharedWith array\n');
    } else {
      console.log('\n✅ M1-v2 has users in database');
      console.log('⚠️ Problem may be UI caching or data format');
      console.log('💡 FIX: Check frontend code or hard refresh\n');
    }
  }
  
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});




