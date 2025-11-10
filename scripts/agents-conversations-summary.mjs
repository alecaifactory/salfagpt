#!/usr/bin/env node

/**
 * Agents & Conversations Summary
 * Shows each agent with its conversations and which users created them
 */

import { Firestore } from '@google-cloud/firestore';

const firestore = new Firestore({
  projectId: 'salfagpt',
});

async function agentsConversationsSummary() {
  console.log('📊 Agents & Conversations Summary');
  console.log('═'.repeat(120));
  console.log();

  // Load all users
  const usersSnapshot = await firestore.collection('users').get();
  const usersMap = new Map();
  
  for (const userDoc of usersSnapshot.docs) {
    const userData = userDoc.data();
    const userInfo = {
      id: userDoc.id,
      email: userData.email,
      name: userData.name,
      company: userData.company,
    };
    
    usersMap.set(userDoc.id, userInfo);
    if (userData.googleUserId) {
      usersMap.set(userData.googleUserId, userInfo);
    }
  }

  console.log(`👥 Loaded ${usersMap.size} user entries\n`);

  // Load all agents
  const agentsSnapshot = await firestore
    .collection('conversations')
    .where('isAgent', '==', true)
    .get();

  console.log(`🤖 Found ${agentsSnapshot.size} agents\n`);

  // Load all conversations (chats linked to agents)
  const conversationsSnapshot = await firestore
    .collection('conversations')
    .where('isAgent', '==', false)
    .get();

  console.log(`💬 Found ${conversationsSnapshot.size} conversations (chats)\n`);

  // Load all messages to get accurate counts
  const messagesSnapshot = await firestore.collection('messages').get();
  
  // Count messages per conversation
  const messageCountByConversation = new Map();
  const userMessagesByConversation = new Map();
  
  for (const msgDoc of messagesSnapshot.docs) {
    const msgData = msgDoc.data();
    const convId = msgData.conversationId;
    
    if (!messageCountByConversation.has(convId)) {
      messageCountByConversation.set(convId, 0);
      userMessagesByConversation.set(convId, 0);
    }
    
    messageCountByConversation.set(convId, messageCountByConversation.get(convId) + 1);
    
    if (msgData.role === 'user') {
      userMessagesByConversation.set(convId, userMessagesByConversation.get(convId) + 1);
    }
  }

  console.log(`📝 Processed ${messagesSnapshot.size} messages\n`);

  // Process each agent
  const agentData = [];

  for (const agentDoc of agentsSnapshot.docs) {
    const agentInfo = agentDoc.data();
    const agentId = agentDoc.id;
    
    // Find conversations for this agent
    const agentConversations = conversationsSnapshot.docs
      .filter(doc => doc.data().agentId === agentId)
      .map(doc => {
        const convData = doc.data();
        return {
          id: doc.id,
          title: convData.title,
          userId: convData.userId,
          messageCount: messageCountByConversation.get(doc.id) || convData.messageCount || 0,
          userMessages: userMessagesByConversation.get(doc.id) || 0,
          createdAt: convData.createdAt?.toDate ? convData.createdAt.toDate() : new Date(convData.createdAt),
          lastMessageAt: convData.lastMessageAt?.toDate ? convData.lastMessageAt.toDate() : new Date(convData.lastMessageAt),
        };
      })
      .filter(c => c.messageCount > 0); // Only conversations with messages

    // Count messages directly on agent
    const directMessages = messageCountByConversation.get(agentId) || 0;
    const directUserMessages = userMessagesByConversation.get(agentId) || 0;

    // Get unique users
    const uniqueUsers = new Set();
    agentConversations.forEach(c => uniqueUsers.add(c.userId));
    
    // Add users who messaged directly on agent
    if (directMessages > 0) {
      messagesSnapshot.docs
        .filter(doc => doc.data().conversationId === agentId)
        .forEach(doc => uniqueUsers.add(doc.data().userId));
    }

    agentData.push({
      id: agentId,
      title: agentInfo.title,
      ownerId: agentInfo.userId,
      conversations: agentConversations,
      directMessages,
      directUserMessages,
      uniqueUsers: Array.from(uniqueUsers),
      totalActivity: agentConversations.length + (directMessages > 0 ? 1 : 0),
    });
  }

  // Sort by total activity
  agentData.sort((a, b) => b.totalActivity - a.totalActivity);

  // Display
  console.log('═'.repeat(120));
  console.log('🤖 AGENTS WITH ACTIVITY');
  console.log('═'.repeat(120));
  console.log();

  let agentIndex = 1;
  
  for (const agent of agentData) {
    if (agent.totalActivity === 0) continue; // Skip inactive agents
    
    const ownerInfo = usersMap.get(agent.ownerId);
    const totalConversations = agent.conversations.length;
    const totalMessages = agent.conversations.reduce((sum, c) => sum + c.messageCount, 0) + agent.directMessages;
    
    console.log('─'.repeat(120));
    console.log(`${agentIndex}. 🤖 ${agent.title}`);
    console.log('─'.repeat(120));
    console.log(`   🆔 Agent ID: ${agent.id}`);
    console.log(`   👑 Owner: ${ownerInfo?.name || 'Unknown'} (${ownerInfo?.email || 'Unknown'})`);
    console.log(`   👥 Unique Users: ${agent.uniqueUsers.length}`);
    console.log(`   💬 Total Messages: ${totalMessages} (${agent.directMessages} direct on agent, ${totalMessages - agent.directMessages} in chats)`);
    console.log(`   🗨️  Conversations: ${totalConversations}`);
    console.log();

    // Show direct messages on agent
    if (agent.directMessages > 0) {
      console.log(`   📨 DIRECT MESSAGES ON AGENT: ${agent.directUserMessages} questions, ${agent.directMessages - agent.directUserMessages} responses`);
      
      // Get users who messaged directly
      const directMessageUsers = new Map();
      messagesSnapshot.docs
        .filter(doc => doc.data().conversationId === agent.id && doc.data().role === 'user')
        .forEach(doc => {
          const userId = doc.data().userId;
          if (!directMessageUsers.has(userId)) {
            directMessageUsers.set(userId, 0);
          }
          directMessageUsers.set(userId, directMessageUsers.get(userId) + 1);
        });
      
      for (const [userId, count] of directMessageUsers.entries()) {
        const userInfo = usersMap.get(userId);
        console.log(`      👤 ${userInfo?.name || 'Unknown'} (${userInfo?.email || userId}): ${count} questions`);
      }
      console.log();
    }

    // Show conversations (chats)
    if (totalConversations > 0) {
      console.log(`   💬 CONVERSATIONS (Top 20):`);
      
      // Sort by message count
      const sortedConvs = agent.conversations
        .sort((a, b) => b.messageCount - a.messageCount)
        .slice(0, 20);
      
      sortedConvs.forEach((conv, idx) => {
        const userInfo = usersMap.get(conv.userId);
        const date = conv.lastMessageAt?.toLocaleDateString('es-CL') || 'Unknown';
        
        console.log(`      ${idx + 1}. "${conv.title}" - ${conv.userMessages} questions, ${conv.messageCount} total msgs`);
        console.log(`         👤 User: ${userInfo?.name || 'Unknown'} (${userInfo?.email || conv.userId})`);
        console.log(`         📅 Last: ${date}`);
      });
      console.log();
    }

    // Show users who created conversations
    if (totalConversations > 0) {
      const userConvCounts = new Map();
      agent.conversations.forEach(conv => {
        if (!userConvCounts.has(conv.userId)) {
          userConvCounts.set(conv.userId, 0);
        }
        userConvCounts.set(conv.userId, userConvCounts.get(conv.userId) + 1);
      });

      console.log(`   👥 USERS WHO CREATED CONVERSATIONS:`);
      const sortedUserCounts = Array.from(userConvCounts.entries())
        .sort((a, b) => b[1] - a[1]);
      
      sortedUserCounts.forEach(([userId, count]) => {
        const userInfo = usersMap.get(userId);
        console.log(`      👤 ${userInfo?.name || 'Unknown'} (${userInfo?.email || userId}): ${count} conversations`);
      });
      console.log();
    }

    agentIndex++;
  }

  // Overall summary
  console.log('═'.repeat(120));
  console.log('📈 OVERALL SUMMARY');
  console.log('═'.repeat(120));
  console.log(`Total agents: ${agentsSnapshot.size}`);
  console.log(`Agents with activity: ${agentData.filter(a => a.totalActivity > 0).length}`);
  console.log(`Total conversations: ${conversationsSnapshot.size}`);
  console.log(`Conversations with messages: ${agentData.reduce((sum, a) => sum + a.conversations.length, 0)}`);
  console.log(`Total messages in system: ${messagesSnapshot.size}`);
  console.log(`Active users: ${new Set(messagesSnapshot.docs.map(d => d.data().userId)).size}`);
  console.log();
}

agentsConversationsSummary().catch(console.error);



