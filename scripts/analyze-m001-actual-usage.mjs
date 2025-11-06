#!/usr/bin/env node

/**
 * Analyze Actual Usage of M001 Agent by Shared Users
 * Finds conversations created by users who have been granted access
 */

import { Firestore } from '@google-cloud/firestore';

const firestore = new Firestore({
  projectId: 'salfagpt',
});

const AGENT_ID = 'cjn3bC0HrUYtHqu69CKS';
const AGENT_TITLE = 'Asistente Legal Territorial RDI (M001)';

async function analyzeActualUsage() {
  console.log('🔍 Analyzing Actual Usage of M001 Agent');
  console.log('========================================\n');

  // Step 1: Get the agent
  console.log('1️⃣  Loading agent...');
  const agentDoc = await firestore.collection('conversations').doc(AGENT_ID).get();
  const agentData = agentDoc.data();
  
  console.log(`✅ Agent: ${agentData.title}`);
  console.log(`   Owner: ${agentData.userId}\n`);

  // Step 2: Get agent shares (without status filter)
  console.log('2️⃣  Loading agent shares...');
  const sharesSnapshot = await firestore
    .collection('agent_shares')
    .where('agentId', '==', AGENT_ID)
    .get();

  console.log(`   Found ${sharesSnapshot.size} shares\n`);

  // Extract all user IDs with access
  const userIds = new Set();
  userIds.add(agentData.userId); // Add owner

  for (const shareDoc of sharesSnapshot.docs) {
    const shareData = shareDoc.data();
    for (const target of shareData.sharedWith || []) {
      if (target.type === 'user') {
        userIds.add(target.id);
      }
    }
  }

  console.log(`📊 Total unique users with access: ${userIds.size}\n`);

  // Step 3: Load user details
  console.log('3️⃣  Loading user details...');
  const usersSnapshot = await firestore.collection('users').get();
  const usersMap = new Map();
  
  for (const userDoc of usersSnapshot.docs) {
    const userData = userDoc.data();
    usersMap.set(userDoc.id, {
      id: userDoc.id,
      email: userData.email,
      name: userData.name,
    });
  }

  console.log(`   Loaded ${usersMap.size} users from database\n`);

  // Step 4: Find ALL conversations with this agent
  console.log('4️⃣  Finding all conversations for this agent...');
  const conversationsSnapshot = await firestore
    .collection('conversations')
    .where('agentId', '==', AGENT_ID)
    .where('isAgent', '==', false)
    .get();

  console.log(`   Found ${conversationsSnapshot.size} conversations (chats)\n`);

  // Group by user
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
      messageCount: convData.messageCount || 0,
      createdAt: convData.createdAt?.toDate(),
      lastMessageAt: convData.lastMessageAt?.toDate(),
    });
  }

  // Step 5: Display results
  console.log('═'.repeat(80));
  console.log('📊 USAGE ANALYSIS BY USER');
  console.log('═'.repeat(80));
  console.log();

  const userStats = [];

  for (const userId of userIds) {
    const userInfo = usersMap.get(userId);
    const conversations = conversationsByUser.get(userId) || [];
    const totalMessages = conversations.reduce((sum, c) => sum + c.messageCount, 0);
    
    userStats.push({
      userId,
      email: userInfo?.email || 'Unknown',
      name: userInfo?.name || 'Unknown',
      conversationCount: conversations.length,
      totalMessages,
      conversations,
    });
  }

  // Sort by conversation count
  userStats.sort((a, b) => b.conversationCount - a.conversationCount);

  // Display each user
  userStats.forEach((stat, idx) => {
    const hasUsed = stat.conversationCount > 0;
    const icon = hasUsed ? '✅' : '❌';
    
    console.log(`${icon} ${idx + 1}. ${stat.name}`);
    console.log(`   📧 Email: ${stat.email}`);
    console.log(`   💬 Conversations: ${stat.conversationCount}`);
    console.log(`   📝 Total Messages: ${stat.totalMessages}`);
    
    if (stat.conversationCount > 0) {
      console.log(`   📋 Chats:`);
      stat.conversations.forEach((conv, i) => {
        const date = conv.lastMessageAt ? conv.lastMessageAt.toLocaleDateString() : 'N/A';
        console.log(`      ${i + 1}. "${conv.title}" - ${conv.messageCount} msgs (${date})`);
      });
    } else {
      console.log(`   ⚠️  Has not created any conversations with this agent yet`);
    }
    
    console.log();
  });

  // Summary
  const usersWhoUsed = userStats.filter(s => s.conversationCount > 0).length;
  const totalConversations = userStats.reduce((sum, s) => sum + s.conversationCount, 0);
  const totalMessages = userStats.reduce((sum, s) => sum + s.totalMessages, 0);

  console.log('═'.repeat(80));
  console.log('📈 SUMMARY');
  console.log('═'.repeat(80));
  console.log(`Total users with access: ${userIds.size}`);
  console.log(`Users who have used the agent: ${usersWhoUsed} (${((usersWhoUsed / userIds.size) * 100).toFixed(1)}%)`);
  console.log(`Users who have NOT used the agent: ${userIds.size - usersWhoUsed}`);
  console.log(`Total conversations: ${totalConversations}`);
  console.log(`Total messages: ${totalMessages}`);
  console.log(`Average conversations per active user: ${usersWhoUsed > 0 ? (totalConversations / usersWhoUsed).toFixed(1) : 0}`);
  console.log();
}

analyzeActualUsage().catch(console.error);

