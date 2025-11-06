#!/usr/bin/env node

/**
 * Debug User ID Formats
 * Check how user IDs are stored across collections
 */

import { Firestore } from '@google-cloud/firestore';

const firestore = new Firestore({
  projectId: 'salfagpt',
});

async function debugUserFormats() {
  console.log('🔍 Debugging User ID Formats');
  console.log('============================');
  console.log('');

  // Check users collection
  console.log('1️⃣  Users collection sample:');
  const usersSnapshot = await firestore.collection('users').limit(5).get();
  
  usersSnapshot.docs.forEach(doc => {
    const data = doc.data();
    console.log(`   ID: ${doc.id}`);
    console.log(`   Email: ${data.email}`);
    console.log(`   Name: ${data.name}`);
    console.log(`   ---`);
  });
  console.log('');

  // Check conversations collection
  console.log('2️⃣  Conversations with agent M001:');
  const agentsSnapshot = await firestore
    .collection('conversations')
    .where('isAgent', '==', true)
    .where('title', '==', 'Asistente Legal Territorial RDI (M001)')
    .get();

  if (!agentsSnapshot.empty) {
    const agentId = agentsSnapshot.docs[0].id;
    const agentData = agentsSnapshot.docs[0].data();
    
    console.log(`   Agent ID: ${agentId}`);
    console.log(`   Agent userId: ${agentData.userId}`);
    console.log('');

    // Get chats for this agent
    const chatsSnapshot = await firestore
      .collection('conversations')
      .where('agentId', '==', agentId)
      .where('isAgent', '==', false)
      .limit(10)
      .get();

    console.log(`   Sample chats (${chatsSnapshot.size} shown):`);
    chatsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(`      Chat userId: ${data.userId}`);
      console.log(`      Title: ${data.title || 'Untitled'}`);
      console.log(`      Messages: ${data.messageCount || 0}`);
      console.log(`      ---`);
    });
  }
  
  console.log('');
  console.log('3️⃣  Checking agent_shares:');
  const sharesSnapshot = await firestore
    .collection('agent_shares')
    .limit(5)
    .get();
  
  sharesSnapshot.docs.forEach(doc => {
    const data = doc.data();
    console.log(`   Share ID: ${doc.id}`);
    console.log(`   Agent ID: ${data.agentId}`);
    console.log(`   Owner ID: ${data.ownerId}`);
    console.log(`   Shared with:`, JSON.stringify(data.sharedWith, null, 2));
    console.log(`   ---`);
  });
}

debugUserFormats().catch(console.error);

