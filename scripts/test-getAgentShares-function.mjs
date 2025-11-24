#!/usr/bin/env node
/**
 * Test getAgentShares function directly
 * 
 * This is what the API endpoint calls
 * Let's see what it returns for M1-v2
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({ projectId: 'salfagpt' });
const db = getFirestore();

const COLLECTIONS = {
  AGENT_SHARES: 'agent_shares'
};

// Simulate the getAgentShares function from firestore.ts
async function getAgentShares(agentId) {
  try {
    const snapshot = await db
      .collection(COLLECTIONS.AGENT_SHARES)
      .where('agentId', '==', agentId)
      .get();

    console.log(`\n📊 Query result:`);
    console.log(`   Collection: ${COLLECTIONS.AGENT_SHARES}`);
    console.log(`   Where: agentId == ${agentId}`);
    console.log(`   Documents found: ${snapshot.size}\n`);

    const shares = snapshot.docs.map(doc => {
      const data = doc.data();
      console.log(`Document ${doc.id}:`);
      console.log(`   agentId: ${data.agentId}`);
      console.log(`   ownerId: ${data.ownerId}`);
      console.log(`   sharedWith: ${data.sharedWith?.length || 0} users`);
      console.log(`   accessLevel: ${data.accessLevel}`);
      console.log();
      
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
        ...(data.expiresAt && { expiresAt: data.expiresAt?.toDate?.() || data.expiresAt }),
      };
    });

    return shares;
  } catch (error) {
    console.error('❌ Error getting agent shares:', error);
    return [];
  }
}

async function main() {
  const M1_AGENT_ID = 'cjn3bC0HrUYtHqu69CKS';
  const S1_AGENT_ID = 'iQmdg3bMSJ1AdqqlFpye';
  
  console.log('\n🔍 TESTING getAgentShares FUNCTION\n');
  console.log('This simulates what the API endpoint does\n');
  
  // Test M1-v2
  console.log('═'.repeat(80));
  console.log('M1-v2 (BROKEN IN UI):');
  console.log('═'.repeat(80));
  const m1Shares = await getAgentShares(M1_AGENT_ID);
  console.log(`📊 Returned shares: ${m1Shares.length}`);
  
  if (m1Shares.length > 0) {
    const share = m1Shares[0];
    console.log(`\nFirst share:`);
    console.log(`   id: ${share.id}`);
    console.log(`   sharedWith: ${share.sharedWith?.length || 0} users`);
    
    if (share.sharedWith && share.sharedWith.length > 0) {
      console.log(`\n   Users:`);
      share.sharedWith.slice(0, 5).forEach((user, idx) => {
        console.log(`     ${idx + 1}. ${user.email} - ${user.name || 'no name'} (${user.userId || 'no userId'})`);
      });
      if (share.sharedWith.length > 5) {
        console.log(`     ... and ${share.sharedWith.length - 5} more`);
      }
    }
  } else {
    console.log(`❌ NO SHARES RETURNED - This is the problem!`);
  }
  
  // Test S1-v2 for comparison
  console.log('\n\n═'.repeat(80));
  console.log('S1-v2 (WORKING IN UI):');
  console.log('═'.repeat(80));
  const s1Shares = await getAgentShares(S1_AGENT_ID);
  console.log(`📊 Returned shares: ${s1Shares.length}`);
  
  if (s1Shares.length > 0) {
    const share = s1Shares[0];
    console.log(`\nFirst share:`);
    console.log(`   id: ${share.id}`);
    console.log(`   sharedWith: ${share.sharedWith?.length || 0} users`);
  }
  
  // Comparison
  console.log('\n\n═'.repeat(80));
  console.log('📊 COMPARISON');
  console.log('═'.repeat(80));
  console.log(`\nM1-v2: ${m1Shares.length} share documents, ${m1Shares[0]?.sharedWith?.length || 0} users`);
  console.log(`S1-v2: ${s1Shares.length} share documents, ${s1Shares[0]?.sharedWith?.length || 0} users`);
  
  if (m1Shares.length === s1Shares.length && m1Shares.length > 0) {
    console.log('\n✅ Both return same structure');
    console.log('⚠️ Problem must be in frontend React component or state management');
    console.log('\n💡 Possible issues:');
    console.log('   1. Frontend cached empty state for M1-v2');
    console.log('   2. Race condition in useEffect');
    console.log('   3. Agent ID mismatch in frontend');
  } else {
    console.log('\n❌ Different structures - API problem');
  }
  
  process.exit(0);
}

main();

