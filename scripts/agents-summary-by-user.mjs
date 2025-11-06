#!/usr/bin/env node

/**
 * Agents Summary - Messages by Each User on Each Agent
 * Concise view showing user → agents → message counts
 */

import { Firestore } from '@google-cloud/firestore';

const firestore = new Firestore({
  projectId: 'salfagpt',
});

async function agentsSummary() {
  console.log('📊 All Agents - Messages by User');
  console.log('═'.repeat(100));
  console.log();

  // Load users
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

  // Load agents
  const agentsSnapshot = await firestore
    .collection('conversations')
    .where('isAgent', '==', true)
    .get();
  
  const agentsMap = new Map();
  agentsSnapshot.docs.forEach(doc => {
    agentsMap.set(doc.id, {
      title: doc.data().title,
      ownerId: doc.data().userId,
    });
  });

  // Load all messages
  const messagesSnapshot = await firestore.collection('messages').get();

  // Group: user → agent → message count
  const userAgentActivity = new Map();

  for (const msgDoc of messagesSnapshot.docs) {
    const msgData = msgDoc.data();
    const userId = msgData.userId;
    const conversationId = msgData.conversationId;
    const role = msgData.role;
    
    // Only count user messages (questions)
    if (role !== 'user') continue;
    
    const userInfo = usersMap.get(userId);
    const email = userInfo?.email || userId;
    
    if (!userAgentActivity.has(email)) {
      userAgentActivity.set(email, {
        userInfo: userInfo || { name: 'Unknown', email: userId, id: userId },
        agents: new Map(),
        totalQuestions: 0,
      });
    }
    
    const userData = userAgentActivity.get(email);
    userData.totalQuestions++;
    
    if (!userData.agents.has(conversationId)) {
      userData.agents.set(conversationId, 0);
    }
    
    userData.agents.set(conversationId, userData.agents.get(conversationId) + 1);
  }

  // Sort by total activity
  const sortedUsers = Array.from(userAgentActivity.entries())
    .sort((a, b) => b[1].totalQuestions - a[1].totalQuestions);

  // Display
  console.log('═'.repeat(100));
  console.log('📊 ACTIVITY BY USER');
  console.log('═'.repeat(100));
  console.log();

  sortedUsers.forEach(([email, userData], idx) => {
    console.log(`${idx + 1}. ${userData.userInfo.name}`);
    console.log(`   📧 ${email}`);
    console.log(`   🏢 ${userData.userInfo.company || 'Unknown'}`);
    console.log(`   ❓ Total Questions: ${userData.totalQuestions}`);
    console.log(`   🤖 Agents Used: ${userData.agents.size}`);
    console.log();
    
    // Show top 10 agents
    const sortedAgents = Array.from(userData.agents.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    console.log(`   📱 TOP AGENTS:`);
    sortedAgents.forEach(([agentId, count], i) => {
      const agentInfo = agentsMap.get(agentId);
      const agentName = agentInfo?.title || `Conversation ${agentId.substring(0, 12)}...`;
      const isM001 = agentId === 'cjn3bC0HrUYtHqu69CKS' ? '🎯' : '  ';
      
      console.log(`      ${isM001} ${i + 1}. ${agentName} - ${count} questions`);
    });
    console.log();
  });

  // M001 specific summary
  console.log('═'.repeat(100));
  console.log('🎯 M001 SPECIFIC BREAKDOWN');
  console.log('═'.repeat(100));
  console.log();

  // Get shared emails
  const sharesSnapshot = await firestore
    .collection('agent_shares')
    .where('agentId', '==', 'cjn3bC0HrUYtHqu69CKS')
    .get();

  const sharedEmails = new Set();
  if (!sharesSnapshot.empty) {
    const shareData = sharesSnapshot.docs[0].data();
    for (const target of shareData.sharedWith || []) {
      if (target.type === 'user' && target.email) {
        sharedEmails.add(target.email);
      }
    }
  }

  const m001Users = Array.from(userAgentActivity.entries())
    .filter(([email, userData]) => userData.agents.has('cjn3bC0HrUYtHqu69CKS'))
    .sort((a, b) => b[1].agents.get('cjn3bC0HrUYtHqu69CKS') - a[1].agents.get('cjn3bC0HrUYtHqu69CKS'));

  if (m001Users.length === 0) {
    console.log('❌ No users have sent messages to M001');
  } else {
    m001Users.forEach(([email, userData], idx) => {
      const questionCount = userData.agents.get('cjn3bC0HrUYtHqu69CKS');
      const isShared = sharedEmails.has(email);
      const userType = isShared ? '🔗 SHARED' : '👑 OWNER';
      
      console.log(`${idx + 1}. ${userType} - ${userData.userInfo.name}`);
      console.log(`   📧 ${email}`);
      console.log(`   💬 Questions to M001: ${questionCount}`);
      console.log();
    });
  }

  // Summary
  console.log('═'.repeat(100));
  console.log('📈 FINAL SUMMARY');
  console.log('═'.repeat(100));
  console.log(`Total active users in system: ${userAgentActivity.size}`);
  console.log(`Total users who used M001: ${m001Users.length}`);
  console.log(`Shared users who used M001: ${m001Users.filter(([e]) => sharedEmails.has(e)).length} of ${sharedEmails.size}`);
  console.log(`Total questions to M001: ${m001Users.reduce((sum, [_, u]) => sum + u.agents.get('cjn3bC0HrUYtHqu69CKS'), 0)}`);
  console.log();
}

agentsSummary().catch(console.error);

