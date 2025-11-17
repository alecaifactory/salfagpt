#!/usr/bin/env node

/**
 * Query M001 Agent Usage
 * Simplified script to find users and conversations for the M001 agent
 */

import { Firestore } from '@google-cloud/firestore';

const firestore = new Firestore({
  projectId: 'salfagpt',
});

const AGENT_TITLE = 'Asistente Legal Territorial RDI (M001)';

async function queryM001Usage() {
  console.log('🔍 Querying M001 Agent Usage');
  console.log('============================\n');

  try {
    // Step 1: Find the agent
    console.log('1️⃣  Finding agent by title...');
    const agentsSnapshot = await firestore
      .collection('conversations')
      .where('isAgent', '==', true)
      .where('title', '==', AGENT_TITLE)
      .get();

    if (agentsSnapshot.empty) {
      console.log(`❌ Agent "${AGENT_TITLE}" not found`);
      return;
    }

    const agentDoc = agentsSnapshot.docs[0];
    const agentId = agentDoc.id;
    const agentData = agentDoc.data();
    
    console.log(`✅ Agent found!`);
    console.log(`   ID: ${agentId}`);
    console.log(`   Owner ID: ${agentData.userId}\n`);

    // Step 2: Find agent shares
    console.log('2️⃣  Finding agent shares...');
    const sharesSnapshot = await firestore
      .collection('agent_shares')
      .where('agentId', '==', agentId)
      .where('status', '==', 'active')
      .get();

    console.log(`   Found ${sharesSnapshot.size} active shares\n`);

    // Collect user IDs and emails
    const usersWithAccess = new Map();
    
    // Add owner
    usersWithAccess.set(agentData.userId, { type: 'owner', email: null });

    // Add shared users
    for (const shareDoc of sharesSnapshot.docs) {
      const shareData = shareDoc.data();
      for (const target of shareData.sharedWith || []) {
        if (target.type === 'user') {
          usersWithAccess.set(target.id, { 
            type: 'shared', 
            email: target.email,
            accessLevel: shareData.accessLevel 
          });
        }
      }
    }

    console.log(`📊 Total unique users with access: ${usersWithAccess.size}\n`);

    // Step 3: Load users collection for emails
    console.log('3️⃣  Loading user details...');
    const usersSnapshot = await firestore.collection('users').get();
    const usersMap = new Map();
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      usersMap.set(userDoc.id, {
        email: userData.email,
        name: userData.name,
        id: userDoc.id,
      });
      // Also map by googleUserId if it exists
      if (userData.googleUserId) {
        usersMap.set(userData.googleUserId, {
          email: userData.email,
          name: userData.name,
          id: userDoc.id,
        });
      }
    }

    console.log(`   Loaded ${usersMap.size} user entries\n`);

    // Step 4: Find conversations (chats) for this agent
    console.log('4️⃣  Finding conversations (chats) for this agent...');
    const conversationsSnapshot = await firestore
      .collection('conversations')
      .where('agentId', '==', agentId)
      .where('isAgent', '==', false)
      .get();

    console.log(`   Found ${conversationsSnapshot.size} conversations\n`);

    // Group conversations by user
    const conversationsByUser = new Map();
    
    for (const convDoc of conversationsSnapshot.docs) {
      const convData = convDoc.data();
      const userId = convData.userId;
      
      if (!conversationsByUser.has(userId)) {
        conversationsByUser.set(userId, []);
      }
      
      conversationsByUser.get(userId).push({
        id: convDoc.id,
        title: convData.title,
        createdAt: convData.createdAt?.toDate(),
        messageCount: convData.messageCount || 0,
      });
    }

    // Step 5: Display results
    console.log('═'.repeat(80));
    console.log('📊 RESULTS');
    console.log('═'.repeat(80));
    console.log();
    
    console.log(`🎯 Agent: ${AGENT_TITLE}`);
    console.log(`📝 Agent ID: ${agentId}`);
    console.log();
    
    console.log(`👥 USERS WITH ACCESS: ${usersWithAccess.size}`);
    console.log('─'.repeat(80));
    
    let userIndex = 1;
    let totalConversations = 0;
    
    for (const [userId, accessInfo] of usersWithAccess.entries()) {
      const userInfo = usersMap.get(userId);
      const userConversations = conversationsByUser.get(userId) || [];
      const conversationCount = userConversations.length;
      totalConversations += conversationCount;
      
      console.log(`\n${userIndex}. User ID: ${userId}`);
      
      if (userInfo) {
        console.log(`   📧 Email: ${userInfo.email}`);
        console.log(`   👤 Name: ${userInfo.name}`);
      } else if (accessInfo.email) {
        console.log(`   📧 Email: ${accessInfo.email} (from share)`);
      } else {
        console.log(`   ⚠️  User not found in users collection`);
      }
      
      console.log(`   🔑 Access: ${accessInfo.type}${accessInfo.accessLevel ? ` (${accessInfo.accessLevel})` : ''}`);
      console.log(`   💬 Conversations: ${conversationCount}`);
      
      if (conversationCount > 0) {
        console.log(`   📋 Conversation list:`);
        userConversations.forEach((conv, idx) => {
          console.log(`      ${idx + 1}. ${conv.title || 'Untitled'} (${conv.messageCount} msgs)`);
        });
      }
      
      userIndex++;
    }
    
    console.log();
    console.log('═'.repeat(80));
    console.log('📈 SUMMARY');
    console.log('═'.repeat(80));
    console.log(`Total users with access: ${usersWithAccess.size}`);
    console.log(`Total conversations (chats): ${totalConversations}`);
    console.log(`Average conversations per user: ${usersWithAccess.size > 0 ? (totalConversations / usersWithAccess.size).toFixed(1) : 0}`);
    console.log();

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

queryM001Usage().catch(console.error);




