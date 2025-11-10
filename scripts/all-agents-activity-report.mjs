#!/usr/bin/env node

/**
 * Complete Activity Report - All Agents by All Users
 * Shows messages for every active agent in the system
 */

import { Firestore } from '@google-cloud/firestore';

const firestore = new Firestore({
  projectId: 'salfagpt',
});

async function generateCompleteReport() {
  console.log('🔍 Complete Agent Activity Report');
  console.log('═'.repeat(100));
  console.log();

  // Step 1: Load all users
  console.log('1️⃣  Loading all users...');
  const usersSnapshot = await firestore.collection('users').get();
  const usersMap = new Map();
  
  for (const userDoc of usersSnapshot.docs) {
    const userData = userDoc.data();
    usersMap.set(userDoc.id, {
      id: userDoc.id,
      email: userData.email,
      name: userData.name,
      company: userData.company,
    });
  }
  console.log(`   Loaded ${usersMap.size} users\n`);

  // Step 2: Load all agents
  console.log('2️⃣  Loading all agents...');
  const agentsSnapshot = await firestore
    .collection('conversations')
    .where('isAgent', '==', true)
    .get();
  
  const agents = agentsSnapshot.docs.map(doc => ({
    id: doc.id,
    title: doc.data().title,
    ownerId: doc.data().userId,
    createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(doc.data().createdAt),
    messageCount: doc.data().messageCount || 0,
  }));

  console.log(`   Found ${agents.length} agents\n`);

  // Step 3: Load ALL messages
  console.log('3️⃣  Loading all messages...');
  const allMessagesSnapshot = await firestore
    .collection('messages')
    .get();

  console.log(`   Loaded ${allMessagesSnapshot.size} messages\n`);

  // Step 4: Group messages by agent and user
  const activityByAgent = new Map();

  for (const msgDoc of allMessagesSnapshot.docs) {
    const msgData = msgDoc.data();
    const conversationId = msgData.conversationId;
    const userId = msgData.userId;
    const role = msgData.role;
    
    // Initialize agent activity if needed
    if (!activityByAgent.has(conversationId)) {
      activityByAgent.set(conversationId, new Map());
    }
    
    const agentActivity = activityByAgent.get(conversationId);
    
    // Initialize user activity for this agent
    if (!agentActivity.has(userId)) {
      agentActivity.set(userId, {
        userMessages: [],
        assistantMessages: [],
        total: 0,
      });
    }
    
    const userActivity = agentActivity.get(userId);
    userActivity.total++;
    
    const messageInfo = {
      id: msgDoc.id,
      content: typeof msgData.content === 'string' ? 
        msgData.content : 
        msgData.content?.text || '',
      timestamp: msgData.timestamp?.toDate ? msgData.timestamp.toDate() : new Date(msgData.timestamp),
      tokenCount: msgData.tokenCount,
    };
    
    if (role === 'user') {
      userActivity.userMessages.push(messageInfo);
    } else if (role === 'assistant') {
      userActivity.assistantMessages.push(messageInfo);
    }
  }

  // Step 5: Display report for each agent
  console.log('═'.repeat(100));
  console.log('📊 ACTIVITY REPORT - ALL AGENTS');
  console.log('═'.repeat(100));
  console.log();

  // Sort agents by total activity
  const sortedAgents = agents.sort((a, b) => {
    const activityA = activityByAgent.get(a.id);
    const activityB = activityByAgent.get(b.id);
    const totalA = activityA ? Array.from(activityA.values()).reduce((sum, u) => sum + u.total, 0) : 0;
    const totalB = activityB ? Array.from(activityB.values()).reduce((sum, u) => sum + u.total, 0) : 0;
    return totalB - totalA;
  });

  sortedAgents.forEach((agent, agentIdx) => {
    const agentActivity = activityByAgent.get(agent.id);
    const ownerInfo = usersMap.get(agent.ownerId);
    
    if (!agentActivity || agentActivity.size === 0) {
      // Skip agents with no activity
      return;
    }

    const totalMessages = Array.from(agentActivity.values())
      .reduce((sum, u) => sum + u.total, 0);
    
    const uniqueUsers = agentActivity.size;

    console.log('─'.repeat(100));
    console.log(`🤖 AGENT #${agentIdx + 1}: ${agent.title}`);
    console.log('─'.repeat(100));
    console.log(`🆔 Agent ID: ${agent.id}`);
    console.log(`👑 Owner: ${ownerInfo?.name || 'Unknown'} (${ownerInfo?.email || 'Unknown'})`);
    console.log(`📅 Created: ${agent.createdAt?.toLocaleDateString('es-CL') || 'Unknown'}`);
    console.log(`👥 Active Users: ${uniqueUsers}`);
    console.log(`💬 Total Messages: ${totalMessages}`);
    console.log();

    // Sort users by activity
    const sortedUsers = Array.from(agentActivity.entries())
      .sort((a, b) => b[1].total - a[1].total);

    sortedUsers.forEach(([userId, activity], userIdx) => {
      const userInfo = usersMap.get(userId);
      const isOwner = userId === agent.ownerId;
      
      console.log(`   ${userIdx + 1}. ${isOwner ? '👑' : '👤'} ${userInfo?.name || 'Unknown'}`);
      console.log(`      📧 ${userInfo?.email || 'Unknown'}`);
      console.log(`      💬 Total: ${activity.total} msgs (${activity.userMessages.length} questions, ${activity.assistantMessages.length} responses)`);
      
      if (activity.userMessages.length > 0) {
        console.log(`      📝 Recent Questions (showing 3 of ${activity.userMessages.length}):`);
        
        const recentQuestions = activity.userMessages
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 3);
        
        recentQuestions.forEach((msg, i) => {
          const preview = msg.content.substring(0, 120).replace(/\n/g, ' ');
          const date = msg.timestamp?.toLocaleDateString('es-CL') || 'Unknown';
          console.log(`         ${i + 1}. [${date}] "${preview}${msg.content.length > 120 ? '...' : ''}"`);
        });
      }
      console.log();
    });
  });

  // Overall summary
  console.log('═'.repeat(100));
  console.log('📈 OVERALL SUMMARY');
  console.log('═'.repeat(100));
  
  const agentsWithActivity = Array.from(activityByAgent.values()).filter(a => a.size > 0).length;
  const totalActiveUsers = new Set(
    Array.from(activityByAgent.values())
      .flatMap(agentActivity => Array.from(agentActivity.keys()))
  ).size;
  
  const totalMessages = Array.from(activityByAgent.values())
    .reduce((sum, agentActivity) => 
      sum + Array.from(agentActivity.values()).reduce((s, u) => s + u.total, 0), 0
    );

  console.log(`Total agents: ${agents.length}`);
  console.log(`Agents with activity: ${agentsWithActivity}`);
  console.log(`Total active users: ${totalActiveUsers}`);
  console.log(`Total messages: ${totalMessages}`);
  console.log();
}

generateCompleteReport().catch(console.error);



