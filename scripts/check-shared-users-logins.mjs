#!/usr/bin/env node

/**
 * Check Login Activity of Shared Users
 * See if they've even logged in since the agent was shared
 */

import { Firestore } from '@google-cloud/firestore';

const firestore = new Firestore({
  projectId: 'salfagpt',
});

const AGENT_ID = 'cjn3bC0HrUYtHqu69CKS';

async function checkSharedUsersLogins() {
  console.log('🔍 Checking Login Activity of Shared Users');
  console.log('═'.repeat(80));
  console.log();

  // Get share details
  const sharesSnapshot = await firestore
    .collection('agent_shares')
    .where('agentId', '==', AGENT_ID)
    .get();

  if (sharesSnapshot.empty) {
    console.log('❌ No shares found');
    return;
  }

  const shareDoc = sharesSnapshot.docs[0];
  const shareData = shareDoc.data();
  const sharedDate = shareData.createdAt?.toDate();

  console.log(`📅 Agent shared on: ${sharedDate?.toLocaleString('es-CL') || 'Unknown'}\n`);

  // Get shared user details
  const sharedUsers = [];
  for (const target of shareData.sharedWith || []) {
    if (target.type === 'user') {
      sharedUsers.push({
        id: target.id,
        email: target.email,
      });
    }
  }

  console.log(`👥 Shared with ${sharedUsers.length} users\n`);

  // Load user documents
  console.log('═'.repeat(80));
  console.log('📊 LOGIN STATUS PER USER');
  console.log('═'.repeat(80));
  console.log();

  let loggedInCount = 0;
  let neverLoggedIn = 0;
  let loggedInAfterShare = 0;

  for (let i = 0; i < sharedUsers.length; i++) {
    const sharedUser = sharedUsers[i];
    
    // Get user document
    const userDoc = await firestore.collection('users').doc(sharedUser.id).get();
    
    if (!userDoc.exists) {
      console.log(`${i + 1}. ❌ ${sharedUser.email || sharedUser.id}`);
      console.log(`   User document not found`);
      console.log();
      continue;
    }

    const userData = userDoc.data();
    const lastLogin = userData.lastLoginAt?.toDate ? userData.lastLoginAt.toDate() : (userData.lastLoginAt ? new Date(userData.lastLoginAt) : null);
    const createdAt = userData.createdAt?.toDate ? userData.createdAt.toDate() : (userData.createdAt ? new Date(userData.createdAt) : null);
    
    const hasLoggedIn = lastLogin != null;
    const loggedInAfter = lastLogin && sharedDate && lastLogin > sharedDate;
    
    if (hasLoggedIn) {
      loggedInCount++;
      if (loggedInAfter) {
        loggedInAfterShare++;
      }
    } else {
      neverLoggedIn++;
    }
    
    const statusIcon = loggedInAfter ? '✅' : hasLoggedIn ? '⚠️' : '❌';
    
    console.log(`${statusIcon} ${i + 1}. ${userData.name || 'Unknown'}`);
    console.log(`   📧 Email: ${userData.email}`);
    console.log(`   🆔 ID: ${sharedUser.id}`);
    console.log(`   👤 Created: ${createdAt?.toLocaleString('es-CL') || 'Unknown'}`);
    
    if (lastLogin) {
      console.log(`   🔐 Last Login: ${lastLogin.toLocaleString('es-CL')}`);
      
      if (sharedDate) {
        const daysSinceShare = Math.floor((lastLogin - sharedDate) / (1000 * 60 * 60 * 24));
        if (loggedInAfter) {
          console.log(`   ✅ Logged in ${daysSinceShare} days AFTER agent was shared`);
        } else {
          const daysBefore = Math.floor((sharedDate - lastLogin) / (1000 * 60 * 60 * 24));
          console.log(`   ⚠️  Last login was ${daysBefore} days BEFORE agent was shared`);
        }
      }
    } else {
      console.log(`   🔐 Last Login: NEVER`);
      console.log(`   ❌ User has not logged in since account creation`);
    }
    
    console.log();
  }

  // Summary
  console.log('═'.repeat(80));
  console.log('📈 LOGIN SUMMARY');
  console.log('═'.repeat(80));
  console.log(`Total shared users: ${sharedUsers.length}`);
  console.log(`Users who have logged in (ever): ${loggedInCount}`);
  console.log(`Users who NEVER logged in: ${neverLoggedIn}`);
  console.log(`Users who logged in AFTER share: ${loggedInAfterShare}`);
  console.log(`Users who need to log in: ${neverLoggedIn + (loggedInCount - loggedInAfterShare)}`);
  console.log();
  
  console.log('💡 Recommendation:');
  if (loggedInAfterShare === 0) {
    console.log('   None of the shared users have logged in since the agent was shared.');
    console.log('   Consider sending them a notification or onboarding email.');
  } else if (loggedInAfterShare < sharedUsers.length) {
    console.log(`   ${sharedUsers.length - loggedInAfterShare} users need to log in to see the shared agent.`);
  } else {
    console.log('   All users have logged in but are not using the agent.');
    console.log('   Consider user training or checking for UI/UX issues.');
  }
  console.log();
}

checkSharedUsersLogins().catch(console.error);

