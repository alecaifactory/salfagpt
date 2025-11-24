#!/usr/bin/env node
/**
 * Fix Agent Sharing - Add userId to sharedWith entries
 * 
 * The UI shows "Usuario desconocido" because sharedWith entries
 * are missing the userId field. This script:
 * 1. Looks up each user by email in the users collection
 * 2. Adds their userId to the sharedWith entry
 * 3. Updates all 4 agents
 * 
 * Usage: npx tsx scripts/fix-sharing-with-userids.mjs
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({ projectId: 'salfagpt' });
const db = getFirestore();

const AGENT_IDS = [
  'iQmdg3bMSJ1AdqqlFpye', // S1-v2
  '1lgr33ywq5qed67sqCYi', // S2-v2
  'cjn3bC0HrUYtHqu69CKS', // M1-v2
  'vStojK73ZKbjNsEnqANJ'  // M3-v2
];

// Helper: Find user by email
async function findUserByEmail(email) {
  const snapshot = await db.collection('users')
    .where('email', '==', email.toLowerCase())
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const userDoc = snapshot.docs[0];
  return {
    userId: userDoc.id,
    ...userDoc.data()
  };
}

// Helper: Create hashId from email (if user doesn't exist)
function createHashId(email) {
  // Simple hash: email without @ and . converted to alphanumeric
  return 'usr_' + email.toLowerCase()
    .replace('@', '_')
    .replace(/\./g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

async function fixAgentSharing(agentId) {
  console.log(`\n${'═'.repeat(80)}`);
  
  const agentDoc = await db.collection('conversations').doc(agentId).get();
  
  if (!agentDoc.exists) {
    console.log(`❌ Agent ${agentId} not found`);
    return { fixed: 0, failed: 0 };
  }

  const agentData = agentDoc.data();
  const agentName = agentData.title || agentId;
  
  console.log(`🔧 Fixing: ${agentName}`);
  console.log(`${'═'.repeat(80)}`);
  
  const sharedWith = agentData.sharedWith || [];
  console.log(`Found ${sharedWith.length} shared users\n`);

  const fixedSharedWith = [];
  let fixedCount = 0;
  let failedCount = 0;

  for (const share of sharedWith) {
    // Skip if already has userId
    if (share.userId) {
      console.log(`✅ ${share.email} - already has userId`);
      fixedSharedWith.push(share);
      fixedCount++;
      continue;
    }

    // Look up user
    console.log(`🔍 Looking up: ${share.email}...`);
    const user = await findUserByEmail(share.email);

    if (user) {
      // Found user - add userId
      const fixed = {
        ...share,
        userId: user.userId,
        // Update name if user has full name in database
        name: user.name || share.name
      };
      fixedSharedWith.push(fixed);
      console.log(`   ✅ Found userId: ${user.userId}`);
      fixedCount++;
    } else {
      // User doesn't exist - create hashId
      const hashId = createHashId(share.email);
      const fixed = {
        ...share,
        userId: hashId
      };
      fixedSharedWith.push(fixed);
      console.log(`   ⚠️ User not found, using hashId: ${hashId}`);
      failedCount++;
    }

    // Small delay
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  // Update agent with fixed sharedWith
  await db.collection('conversations').doc(agentId).update({
    sharedWith: fixedSharedWith,
    updatedAt: new Date()
  });

  console.log(`\n📊 Results: ${fixedCount} fixed, ${failedCount} users not found in database\n`);

  return { fixed: fixedCount, failed: failedCount };
}

async function main() {
  console.log('\n🔧 FIXING AGENT SHARING - Adding userIds\n');
  console.log('Problem: Shared users show as "Usuario desconocido"');
  console.log('Solution: Look up userId for each email and add to sharedWith\n');

  const results = [];
  let totalFixed = 0;
  let totalFailed = 0;

  for (const agentId of AGENT_IDS) {
    const result = await fixAgentSharing(agentId);
    results.push(result);
    totalFixed += result.fixed;
    totalFailed += result.failed;
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Summary
  console.log('═'.repeat(80));
  console.log('📊 SUMMARY');
  console.log('═'.repeat(80));
  console.log();
  console.log(`Total shares processed:   ${totalFixed + totalFailed}`);
  console.log(`Successfully fixed:       ${totalFixed}`);
  console.log(`Users not in database:    ${totalFailed}`);
  console.log();

  if (totalFailed > 0) {
    console.log('⚠️ USERS NOT FOUND:');
    console.log('These users need to be created in the users collection first.');
    console.log('Used hashId based on email as fallback.');
    console.log('\nTo create users, run:');
    console.log('  npx tsx scripts/create-missing-users.mjs\n');
  } else {
    console.log('✅ ALL USERS FOUND AND FIXED!\n');
  }

  console.log('═'.repeat(80));
  console.log(`\n${totalFailed === 0 ? '✅ SHARING FIXED!' : '⚠️ PARTIAL FIX - CREATE USERS'}\n`);
  console.log('═'.repeat(80));
  console.log();

  console.log('Next: Refresh the UI to see user names instead of "Usuario desconocido"\n');

  process.exit(0);
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});

