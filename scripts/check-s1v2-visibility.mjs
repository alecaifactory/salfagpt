#!/usr/bin/env node

/**
 * Check why S1-v2 is not visible for the current user
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({ projectId: 'salfagpt' });
const db = getFirestore();

async function checkS1v2Visibility() {
  const agentId = 'iQmdg3bMSJ1AdqqlFpye';
  const ownerUserId = 'usr_uhwqffaqag1wrryd82tw'; // dundurraga
  const currentUserId = 'usr_ywg6pg0v3tgbq1817xmo'; // alec
  const currentUserEmail = 'alec@getaifactory.com';
  
  console.log('🔍 Checking S1-v2 visibility...\n');
  
  try {
    // 1. Check agent exists
    console.log('1. Agent document:');
    const agentDoc = await db.collection('conversations').doc(agentId).get();
    
    if (!agentDoc.exists) {
      console.log('   ❌ Agent does NOT exist!');
      return;
    }
    
    const agentData = agentDoc.data();
    console.log(`   ✅ Exists: ${agentData.title}`);
    console.log(`   • Owner: ${agentData.userId}`);
    console.log(`   • isAgent: ${agentData.isAgent}`);
    console.log(`   • Active sources: ${(agentData.activeContextSourceIds || []).length}`);
    
    // 2. Check if shared with current user
    console.log('\n2. Sharing configuration:');
    const sharingSnapshot = await db.collection('agent_sharing')
      .where('agentId', '==', agentId)
      .get();
    
    if (sharingSnapshot.empty) {
      console.log('   ❌ NO agent_sharing record found!');
      console.log('   → Agent is NOT shared with anyone');
      console.log('\n   SOLUTION: Share the agent with alec@getaifactory.com');
      return;
    }
    
    const sharingDoc = sharingSnapshot.docs[0];
    const sharingData = sharingDoc.data();
    
    console.log(`   ✅ Sharing record exists (${sharingDoc.id})`);
    console.log(`   • Type: ${sharingData.shareType}`);
    console.log(`   • Shared by: ${sharingData.sharedBy}`);
    console.log(`   • Created: ${sharingData.createdAt?.toDate?.()}`);
    
    const sharedWith = sharingData.sharedWith || [];
    console.log(`\n   • Shared with: ${sharedWith.length} users/groups`);
    
    // Check if current user is in sharedWith
    const isSharedWithUser = sharedWith.some(item => {
      if (typeof item === 'string') {
        return item === currentUserId || item === currentUserEmail;
      }
      return item.userId === currentUserId || item.email === currentUserEmail;
    });
    
    if (isSharedWithUser) {
      console.log(`   ✅ User ${currentUserEmail} IS in sharedWith list`);
    } else {
      console.log(`   ❌ User ${currentUserEmail} is NOT in sharedWith list`);
      console.log('\n   Current sharedWith:');
      sharedWith.forEach((item, idx) => {
        if (typeof item === 'string') {
          console.log(`      ${idx + 1}. ${item}`);
        } else {
          console.log(`      ${idx + 1}. ${item.email || item.userId}`);
        }
      });
    }
    
    // 3. Check domain access
    console.log('\n3. Domain-based access:');
    
    // Get agent owner's domain
    const ownerDoc = await db.collection('users').doc(ownerUserId).get();
    const ownerEmail = ownerDoc.data()?.email;
    const ownerDomain = ownerEmail?.split('@')[1];
    
    // Get current user's domain
    const currentDomain = currentUserEmail.split('@')[1];
    
    console.log(`   • Owner domain: ${ownerDomain}`);
    console.log(`   • Current user domain: ${currentDomain}`);
    
    if (sharingData.shareType === 'domain' && ownerDomain === currentDomain) {
      console.log(`   ✅ Domain match - user should have access`);
    } else if (sharingData.shareType === 'domain') {
      console.log(`   ❌ Domain mismatch - user should NOT have access`);
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY:');
    console.log('='.repeat(60));
    
    if (!isSharedWithUser && sharingData.shareType !== 'domain') {
      console.log('❌ PROBLEM: User is NOT in sharing list');
      console.log('\nSOLUTION:');
      console.log('   1. Owner should open S1-v2');
      console.log('   2. Click share button');
      console.log(`   3. Add: ${currentUserEmail}`);
      console.log('   4. Refresh browser');
    } else {
      console.log('✅ Sharing looks correct');
      console.log('\nIf agent still not visible:');
      console.log('   1. Check /api/agents/shared endpoint');
      console.log('   2. Clear browser cache');
      console.log('   3. Check frontend console logs');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkS1v2Visibility();

