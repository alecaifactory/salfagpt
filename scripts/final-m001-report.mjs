#!/usr/bin/env node

/**
 * Final M001 Report - Clean and Accurate
 * Shows all users who have interacted with M001 with their full activity
 */

import { Firestore } from '@google-cloud/firestore';

const firestore = new Firestore({
  projectId: 'salfagpt',
});

const AGENT_ID = 'cjn3bC0HrUYtHqu69CKS';
const AGENT_TITLE = 'Asistente Legal Territorial RDI (M001)';

async function finalM001Report() {
  console.log('📊 Final M001 Agent Activity Report');
  console.log('═'.repeat(100));
  console.log();

  // Load users
  const usersSnapshot = await firestore.collection('users').get();
  const emailToUserMap = new Map();
  const idToUserMap = new Map();
  
  for (const userDoc of usersSnapshot.docs) {
    const userData = userDoc.data();
    const userInfo = {
      id: userDoc.id,
      email: userData.email,
      name: userData.name,
      company: userData.company,
      googleUserId: userData.googleUserId,
    };
    
    if (userData.email) {
      emailToUserMap.set(userData.email, userInfo);
    }
    idToUserMap.set(userDoc.id, userInfo);
    if (userData.googleUserId) {
      idToUserMap.set(userData.googleUserId, userInfo);
    }
  }

  // Get agent
  const agentDoc = await firestore.collection('conversations').doc(AGENT_ID).get();
  const agentData = agentDoc.data();

  console.log(`🤖 Agent: ${AGENT_TITLE}`);
  console.log(`🆔 Agent ID: ${AGENT_ID}`);
  console.log(`👑 Owner: ${agentData.userId}`);
  console.log();

  // Get all messages for this agent
  const messagesSnapshot = await firestore
    .collection('messages')
    .where('conversationId', '==', AGENT_ID)
    .get();

  console.log(`📝 Total messages on agent: ${messagesSnapshot.size}\n`);

  // Group by email (to consolidate multiple user IDs)
  const activityByEmail = new Map();

  for (const msgDoc of messagesSnapshot.docs) {
    const msgData = msgDoc.data();
    const userId = msgData.userId;
    const role = msgData.role;
    
    // Get user info
    const userInfo = idToUserMap.get(userId);
    const email = userInfo?.email || 'unknown';
    
    if (!activityByEmail.has(email)) {
      activityByEmail.set(email, {
        userInfo: userInfo || { name: 'Unknown', email: 'unknown', id: userId },
        userMessages: [],
        assistantMessages: [],
      });
    }
    
    const activity = activityByEmail.get(email);
    
    const messageInfo = {
      content: typeof msgData.content === 'string' ? msgData.content : msgData.content?.text || '',
      timestamp: msgData.timestamp?.toDate ? msgData.timestamp.toDate() : new Date(msgData.timestamp),
      userId: userId, // Track which ID was used
    };
    
    if (role === 'user') {
      activity.userMessages.push(messageInfo);
    } else if (role === 'assistant') {
      activity.assistantMessages.push(messageInfo);
    }
  }

  // Get shared users
  const sharesSnapshot = await firestore
    .collection('agent_shares')
    .where('agentId', '==', AGENT_ID)
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

  console.log(`🔗 Agent shared with ${sharedEmails.size} users\n`);

  // Display activity
  console.log('═'.repeat(100));
  console.log('👥 USERS WHO HAVE USED M001');
  console.log('═'.repeat(100));
  console.log();

  const sortedActivity = Array.from(activityByEmail.entries())
    .filter(([email, activity]) => activity.userMessages.length > 0)
    .sort((a, b) => b[1].userMessages.length - a[1].userMessages.length);

  if (sortedActivity.length === 0) {
    console.log('❌ No user activity found');
  } else {
    sortedActivity.forEach(([email, activity], idx) => {
      const isShared = sharedEmails.has(email);
      const userType = isShared ? '🔗 SHARED USER' : '👑 OWNER';
      
      console.log(`${idx + 1}. ${userType}: ${activity.userInfo.name}`);
      console.log(`   📧 Email: ${email}`);
      console.log(`   🏢 Company: ${activity.userInfo.company || 'Unknown'}`);
      console.log(`   💬 Questions: ${activity.userMessages.length}`);
      console.log(`   🤖 AI Responses: ${activity.assistantMessages.length}`);
      console.log();
      
      console.log(`   📝 ALL QUESTIONS:`);
      activity.userMessages
        .sort((a, b) => b.timestamp - a.timestamp)
        .forEach((msg, i) => {
          const preview = msg.content.substring(0, 150).replace(/\n/g, ' ');
          const date = msg.timestamp?.toLocaleString('es-CL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }) || 'Unknown';
          
          console.log(`      ${i + 1}. [${date}]`);
          console.log(`         "${preview}${msg.content.length > 150 ? '...' : ''}"`);
        });
      console.log();
    });
  }

  // Summary
  console.log('═'.repeat(100));
  console.log('📈 M001 USAGE SUMMARY');
  console.log('═'.repeat(100));
  console.log(`Total users with access: ${sharedEmails.size + 1} (${sharedEmails.size} shared + 1 owner)`);
  console.log(`Users who have used M001: ${sortedActivity.length}`);
  console.log(`Users who have NOT used M001: ${sharedEmails.size + 1 - sortedActivity.length}`);
  console.log(`Shared users who have used M001: ${sortedActivity.filter(([email]) => sharedEmails.has(email)).length}`);
  console.log(`Total questions to M001: ${Array.from(activityByEmail.values()).reduce((sum, a) => sum + a.userMessages.length, 0)}`);
  console.log(`Adoption rate: ${((sortedActivity.length / (sharedEmails.size + 1)) * 100).toFixed(1)}%`);
  console.log();
}

finalM001Report().catch(console.error);


