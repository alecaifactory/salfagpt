#!/usr/bin/env node

/**
 * Check Direct Messages on M001 Agent
 * Users chat directly with the agent (conversationId = agentId)
 */

import { Firestore } from '@google-cloud/firestore';

const firestore = new Firestore({
  projectId: 'salfagpt',
});

const AGENT_ID = 'cjn3bC0HrUYtHqu69CKS';

async function checkDirectMessages() {
  console.log('🔍 Checking Direct Messages on M001 Agent');
  console.log('═'.repeat(80));
  console.log();

  // Get ALL messages where conversationId = AGENT_ID (no orderBy to avoid index)
  console.log('1️⃣  Loading messages directly on agent...');
  const messagesSnapshot = await firestore
    .collection('messages')
    .where('conversationId', '==', AGENT_ID)
    .get();

  console.log(`   Found ${messagesSnapshot.size} total messages\n`);

  if (messagesSnapshot.size === 0) {
    console.log('❌ No direct messages on agent');
    console.log('💡 Checking if agent has messageCount field...');
    
    const agentDoc = await firestore.collection('conversations').doc(AGENT_ID).get();
    const agentData = agentDoc.data();
    console.log(`   Agent messageCount: ${agentData.messageCount || 0}`);
    return;
  }

  // Load users
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

  // Get agent shares to identify shared users
  const sharesSnapshot = await firestore
    .collection('agent_shares')
    .where('agentId', '==', AGENT_ID)
    .get();

  const sharedUserIds = new Set();
  for (const shareDoc of sharesSnapshot.docs) {
    const shareData = shareDoc.data();
    for (const target of shareData.sharedWith || []) {
      if (target.type === 'user') {
        sharedUserIds.add(target.id);
      }
    }
  }

  // Group messages by user
  const messagesByUser = new Map();
  
  for (const msgDoc of messagesSnapshot.docs) {
    const msgData = msgDoc.data();
    const userId = msgData.userId;
    
    if (!messagesByUser.has(userId)) {
      messagesByUser.set(userId, {
        userMessages: [],
        assistantMessages: [],
        allMessages: [],
      });
    }
    
    const userMsgs = messagesByUser.get(userId);
    const messageInfo = {
      id: msgDoc.id,
      role: msgData.role,
      content: typeof msgData.content === 'string' ? 
        msgData.content : 
        msgData.content?.text || JSON.stringify(msgData.content),
      timestamp: msgData.timestamp?.toDate(),
      tokenCount: msgData.tokenCount,
    };
    
    userMsgs.allMessages.push(messageInfo);
    
    if (msgData.role === 'user') {
      userMsgs.userMessages.push(messageInfo);
    } else if (msgData.role === 'assistant') {
      userMsgs.assistantMessages.push(messageInfo);
    }
  }

  // Display results
  console.log('═'.repeat(80));
  console.log('📊 MESSAGES BY USER (Direct on Agent)');
  console.log('═'.repeat(80));
  console.log();

  // Sort by message count (descending)
  const sortedUsers = Array.from(messagesByUser.entries())
    .sort((a, b) => b[1].allMessages.length - a[1].allMessages.length);

  let userIndex = 1;
  
  for (const [userId, msgs] of sortedUsers) {
    const userInfo = usersMap.get(userId);
    const isShared = sharedUserIds.has(userId);
    const accessType = isShared ? '🔗 SHARED USER' : '👑 OWNER';
    
    console.log('─'.repeat(80));
    console.log(`${userIndex}. ${accessType}`);
    console.log('─'.repeat(80));
    console.log(`👤 Name: ${userInfo?.name || 'Unknown'}`);
    console.log(`📧 Email: ${userInfo?.email || 'Unknown'}`);
    console.log(`🆔 User ID: ${userId}`);
    console.log(`💬 Total Messages: ${msgs.allMessages.length}`);
    console.log(`👤 User Questions: ${msgs.userMessages.length}`);
    console.log(`🤖 AI Responses: ${msgs.assistantMessages.length}`);
    console.log();
    
    if (msgs.userMessages.length > 0) {
      console.log('📝 RECENT QUESTIONS (last 10):');
      console.log();
      
      // Sort by timestamp
      const sortedUserMsgs = msgs.userMessages
        .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0))
        .slice(0, 10);
      
      sortedUserMsgs.forEach((msg, idx) => {
        const preview = msg.content.substring(0, 150).replace(/\n/g, ' ');
        const date = msg.timestamp?.toLocaleString('es-CL', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }) || 'Unknown';
        
        console.log(`   ${idx + 1}. [${date}]`);
        console.log(`      "${preview}${msg.content.length > 150 ? '...' : ''}"`);
        console.log();
      });
    }
    
    userIndex++;
  }

  // Final summary
  console.log('═'.repeat(80));
  console.log('📈 SUMMARY');
  console.log('═'.repeat(80));
  
  const usersWhoSentMessages = messagesByUser.size;
  const sharedUsersWhoSentMessages = Array.from(messagesByUser.keys())
    .filter(id => sharedUserIds.has(id)).length;
  
  const totalUserQuestions = Array.from(messagesByUser.values())
    .reduce((sum, m) => sum + m.userMessages.length, 0);
  
  console.log(`Total users who sent messages: ${usersWhoSentMessages}`);
  console.log(`Shared users who sent messages: ${sharedUsersWhoSentMessages} of ${sharedUserIds.size}`);
  console.log(`Total user questions: ${totalUserQuestions}`);
  console.log(`Total messages (all): ${messagesSnapshot.size}`);
  console.log(`Adoption rate: ${((sharedUsersWhoSentMessages / sharedUserIds.size) * 100).toFixed(1)}%`);
  console.log();
}

checkDirectMessages().catch(console.error);








