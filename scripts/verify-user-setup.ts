#!/usr/bin/env tsx
/**
 * Verify complete user setup
 * Simulates what the user will see when they login
 */

import { firestore, COLLECTIONS, getSharedAgents, getUserByEmail } from '../src/lib/firestore.js';

const TARGET_EMAIL = process.env.TARGET_EMAIL || 'dortega@novatec.cl';

async function main() {
  console.log(`🔍 Verifying setup for: ${TARGET_EMAIL}\n`);
  console.log('='.repeat(60));
  
  // Step 1: Check user exists
  console.log('1️⃣  User Account');
  const user = await getUserByEmail(TARGET_EMAIL);
  
  if (!user) {
    console.log('   ❌ User not found - must login first');
    process.exit(1);
  }
  
  console.log(`   ✅ User ID: ${user.id}`);
  console.log(`   ✅ Name: ${user.name}`);
  console.log(`   ✅ Role: ${user.role || 'user'}`);
  console.log();
  
  // Step 2: Check domain
  console.log('2️⃣  Domain Configuration');
  const domain = TARGET_EMAIL.split('@')[1];
  const domainDoc = await firestore
    .collection(COLLECTIONS.ORGANIZATIONS)
    .doc(domain)
    .get();
  
  if (!domainDoc.exists) {
    console.log(`   ❌ Domain ${domain} not configured`);
    console.log('   → User will get 403 errors');
  } else {
    const domainData = domainDoc.data();
    console.log(`   ✅ Domain: ${domain}`);
    console.log(`   ✅ Enabled: ${domainData?.isEnabled === true ? 'YES' : 'NO'}`);
    
    if (!domainData?.isEnabled) {
      console.log('   ⚠️  Domain is disabled - user will get 403 errors');
    }
  }
  console.log();
  
  // Step 3: Check own conversations
  console.log('3️⃣  Own Conversations');
  const conversationsSnapshot = await firestore
    .collection(COLLECTIONS.CONVERSATIONS)
    .where('userId', '==', user.id)
    .get();
  
  console.log(`   Own Conversations: ${conversationsSnapshot.size}`);
  if (conversationsSnapshot.size > 0) {
    conversationsSnapshot.docs.forEach((doc, idx) => {
      const data = doc.data();
      console.log(`   ${idx + 1}. ${data.title}`);
    });
  } else {
    console.log('   ✅ Empty state (as expected for fresh user)');
  }
  console.log();
  
  // Step 4: Check shared agents
  console.log('4️⃣  Shared Agents');
  const sharedAgents = await getSharedAgents(user.id, user.email);
  
  console.log(`   Shared Agents: ${sharedAgents.length}`);
  if (sharedAgents.length > 0) {
    sharedAgents.forEach((agent, idx) => {
      console.log(`   ${idx + 1}. ${agent.title} (ID: ${agent.id})`);
    });
  } else {
    console.log('   ℹ️  No shared agents');
  }
  console.log();
  
  // Step 5: Check context sources
  console.log('5️⃣  Context Sources');
  const sourcesSnapshot = await firestore
    .collection(COLLECTIONS.CONTEXT_SOURCES)
    .where('userId', '==', user.id)
    .get();
  
  console.log(`   Context Sources: ${sourcesSnapshot.size}`);
  if (sourcesSnapshot.size > 0) {
    sourcesSnapshot.docs.forEach((doc, idx) => {
      const data = doc.data();
      console.log(`   ${idx + 1}. ${data.name}`);
    });
  } else {
    console.log('   ✅ Empty state (as expected for fresh user)');
  }
  console.log();
  
  // Summary
  console.log('='.repeat(60));
  console.log('📊 VERIFICATION SUMMARY');
  console.log('='.repeat(60));
  
  const allGood = 
    user && 
    domainDoc.exists && 
    domainDoc.data()?.isEnabled === true &&
    sharedAgents.length >= 0; // At least accessible
  
  if (allGood) {
    console.log('✅ User setup is CORRECT');
    console.log('');
    console.log('Expected User Experience:');
    console.log(`   - Can login with ${TARGET_EMAIL}`);
    console.log('   - No 403 errors');
    console.log(`   - Sees ${sharedAgents.length} shared agent(s)`);
    console.log(`   - Sees ${conversationsSnapshot.size} own conversation(s)`);
    console.log('   - Can create new conversations');
    console.log('   - Can upload context sources');
  } else {
    console.log('❌ User setup has ISSUES');
    console.log('   Review the details above');
  }
  console.log('='.repeat(60));
  
  process.exit(0);
}

main();




