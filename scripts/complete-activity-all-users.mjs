#!/usr/bin/env node

/**
 * Complete Activity Report - Show ALL Messages by ALL Users
 * Groups by user first, then shows which agents they've used
 */

import { Firestore } from '@google-cloud/firestore';

const firestore = new Firestore({
  projectId: 'salfagpt',
});

async function completeActivityReport() {
  console.log('🔍 Complete User Activity Report - All Agents');
  console.log('═'.repeat(100));
  console.log();

  // Load all users
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
    // Also map by googleUserId if it exists
    if (userData.googleUserId) {
      usersMap.set(userData.googleUserId, {
        id: userDoc.id,
        email: userData.email,
        name: userData.name,
        company: userData.company,
        note: '(via googleUserId)',
      });
    }
  }

  // Load all agents
  const agentsSnapshot = await firestore
    .collection('conversations')
    .where('isAgent', '==', true)
    .get();
  
  const agentsMap = new Map();
  agentsSnapshot.docs.forEach(doc => {
    agentsMap.set(doc.id, {
      id: doc.id,
      title: doc.data().title,
      ownerId: doc.data().userId,
    });
  });

  console.log(`📊 Loaded ${usersMap.size} user entries and ${agentsMap.size} agents\n`);

  // Load all messages
  console.log('Loading all messages...');
  const messagesSnapshot = await firestore
    .collection('messages')
    .get();

  console.log(`   ${messagesSnapshot.size} messages loaded\n`);

  // Group by user
  const activityByUser = new Map();

  for (const msgDoc of messagesSnapshot.docs) {
    const msgData = msgDoc.data();
    const userId = msgData.userId;
    const conversationId = msgData.conversationId;
    const role = msgData.role;
    
    if (!activityByUser.has(userId)) {
      activityByUser.set(userId, {
        agents: new Map(),
        totalMessages: 0,
        totalQuestions: 0,
      });
    }
    
    const userActivity = activityByUser.get(userId);
    userActivity.totalMessages++;
    
    if (role === 'user') {
      userActivity.totalQuestions++;
    }
    
    // Track per agent/conversation
    if (!userActivity.agents.has(conversationId)) {
      userActivity.agents.set(conversationId, {
        messages: [],
        questionCount: 0,
      });
    }
    
    const agentActivity = userActivity.agents.get(conversationId);
    
    if (role === 'user') {
      agentActivity.questionCount++;
      agentActivity.messages.push({
        content: typeof msgData.content === 'string' ? msgData.content : msgData.content?.text || '',
        timestamp: msgData.timestamp?.toDate ? msgData.timestamp.toDate() : new Date(msgData.timestamp),
      });
    }
  }

  // Sort users by activity
  const sortedUsers = Array.from(activityByUser.entries())
    .sort((a, b) => b[1].totalMessages - a[1].totalMessages);

  // Display
  console.log('═'.repeat(100));
  console.log('👥 ACTIVITY BY USER (All Agents)');
  console.log('═'.repeat(100));
  console.log();

  sortedUsers.forEach(([userId, activity], idx) => {
    const userInfo = usersMap.get(userId);
    
    console.log(`${idx + 1}. ${userInfo?.name || 'Unknown User'}`);
    console.log(`   📧 ${userInfo?.email || 'Unknown Email'}`);
    console.log(`   🏢 ${userInfo?.company || 'Unknown Company'}`);
    console.log(`   🆔 ${userId} ${userInfo?.note || ''}`);
    console.log(`   💬 Total Messages: ${activity.totalMessages}`);
    console.log(`   ❓ Total Questions: ${activity.totalQuestions}`);
    console.log(`   🤖 Agents Used: ${activity.agents.size}`);
    console.log();
    
    // Show agents used
    const sortedAgents = Array.from(activity.agents.entries())
      .sort((a, b) => b[1].questionCount - a[1].questionCount);
    
    console.log(`   📱 AGENTS USED:`);
    sortedAgents.forEach(([agentId, agentActivity], agentIdx) => {
      const agentInfo = agentsMap.get(agentId);
      const agentTitle = agentInfo?.title || `Conversation ${agentId.substring(0, 8)}...`;
      
      console.log(`      ${agentIdx + 1}. ${agentTitle}`);
      console.log(`         💬 ${agentActivity.questionCount} questions`);
      
      // Show last 2 questions
      if (agentActivity.messages.length > 0) {
        const recentMsgs = agentActivity.messages
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 2);
        
        console.log(`         📝 Recent:`);
        recentMsgs.forEach((msg, i) => {
          const preview = msg.content.substring(0, 80).replace(/\n/g, ' ');
          const date = msg.timestamp?.toLocaleDateString('es-CL') || 'Unknown';
          console.log(`            - [${date}] "${preview}${msg.content.length > 80 ? '...' : ''}"`);
        });
      }
      console.log();
    });
  });

  // Check specifically for M001 usage
  console.log('═'.repeat(100));
  console.log('🎯 M001 SPECIFIC USAGE');
  console.log('═'.repeat(100));
  console.log();

  const M001_ID = 'cjn3bC0HrUYtHqu69CKS';
  let m001UserCount = 0;
  let m001MessageCount = 0;

  for (const [userId, activity] of activityByUser.entries()) {
    if (activity.agents.has(M001_ID)) {
      m001UserCount++;
      const m001Activity = activity.agents.get(M001_ID);
      m001MessageCount += m001Activity.questionCount;
      
      const userInfo = usersMap.get(userId);
      console.log(`✅ ${userInfo?.name || 'Unknown'} (${userInfo?.email || userId})`);
      console.log(`   Questions: ${m001Activity.questionCount}`);
      console.log();
    }
  }

  console.log(`Total users who used M001: ${m001UserCount}`);
  console.log(`Total questions to M001: ${m001MessageCount}`);
  console.log();

  // Overall summary
  console.log('═'.repeat(100));
  console.log('📈 SYSTEM-WIDE SUMMARY');
  console.log('═'.repeat(100));
  console.log(`Total unique users with activity: ${activityByUser.size}`);
  console.log(`Total messages in system: ${messagesSnapshot.size}`);
  console.log(`Total agents: ${agentsMap.size}`);
  console.log(`Agents with activity: ${new Set(Array.from(activityByUser.values()).flatMap(u => Array.from(u.agents.keys()))).size}`);
  console.log();
}

completeActivityReport().catch(console.error);








