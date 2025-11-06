#!/usr/bin/env node

/**
 * Check Messages Directly on the M001 Agent
 * Users might be chatting directly with the agent instead of creating separate conversations
 */

import { Firestore } from '@google-cloud/firestore';

const firestore = new Firestore({
  projectId: 'salfagpt',
});

const AGENT_ID = 'cjn3bC0HrUYtHqu69CKS';

async function checkAgentMessages() {
  console.log('🔍 Checking Messages Directly on M001 Agent');
  console.log('═'.repeat(80));
  console.log();

  // Get ALL messages for the agent itself (not separate chats)
  console.log('1️⃣  Loading messages for agent ID:', AGENT_ID);
  const messagesSnapshot = await firestore
    .collection('messages')
    .where('conversationId', '==', AGENT_ID)
    .orderBy('timestamp', 'desc')
    .limit(200)
    .get();

  console.log(`   Found ${messagesSnapshot.size} messages\n`);

  if (messagesSnapshot.size === 0) {
    console.log('❌ No messages found directly on the agent');
    console.log('💡 Users might be creating separate chats instead');
    return;
  }

  // Load users
  const usersSnapshot = await firestore.collection('users').get();
  const usersMap = new Map();
  
  for (const userDoc of usersSnapshot.docs) {
    const userData = userDoc.data();
    usersMap.set(userDoc.id, {
      email: userData.email,
      name: userData.name,
    });
  }

  // Group messages by user
  const messagesByUser = new Map();
  
  for (const msgDoc of messagesSnapshot.docs) {
    const msgData = msgDoc.data();
    const userId = msgData.userId;
    
    if (!messagesByUser.has(userId)) {
      messagesByUser.set(userId, []);
    }
    
    messagesByUser.get(userId).push({
      id: msgDoc.id,
      role: msgData.role,
      content: typeof msgData.content === 'string' ? 
        msgData.content : 
        msgData.content?.text || JSON.stringify(msgData.content),
      timestamp: msgData.timestamp?.toDate(),
      tokenCount: msgData.tokenCount,
    });
  }

  console.log('═'.repeat(80));
  console.log('📊 MESSAGES BY USER (Direct Agent Messages)');
  console.log('═'.repeat(80));
  console.log();

  let userIndex = 1;
  for (const [userId, messages] of messagesByUser.entries()) {
    const userInfo = usersMap.get(userId);
    const userMessages = messages.filter(m => m.role === 'user');
    const assistantMessages = messages.filter(m => m.role === 'assistant');
    
    console.log(`${userIndex}. ${userInfo?.name || 'Unknown'}`);
    console.log(`   📧 Email: ${userInfo?.email || 'Unknown'}`);
    console.log(`   🆔 User ID: ${userId}`);
    console.log(`   💬 Total Messages: ${messages.length}`);
    console.log(`   👤 User Messages: ${userMessages.length}`);
    console.log(`   🤖 AI Responses: ${assistantMessages.length}`);
    console.log();
    
    // Show last 5 user messages
    if (userMessages.length > 0) {
      console.log('   📝 Recent Messages (last 5):');
      userMessages.slice(0, 5).forEach((msg, idx) => {
        const preview = msg.content.substring(0, 100);
        const date = msg.timestamp?.toLocaleString('es-CL', {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }) || 'Unknown';
        
        console.log(`      ${idx + 1}. [${date}] ${preview}${msg.content.length > 100 ? '...' : ''}`);
      });
      console.log();
    }
    
    userIndex++;
  }

  // Summary
  console.log('═'.repeat(80));
  console.log('📈 SUMMARY');
  console.log('═'.repeat(80));
  console.log(`Total unique users with messages: ${messagesByUser.size}`);
  console.log(`Total messages on agent: ${messagesSnapshot.size}`);
  
  const totalUserMessages = Array.from(messagesByUser.values())
    .reduce((sum, msgs) => sum + msgs.filter(m => m.role === 'user').length, 0);
  
  console.log(`Total user messages: ${totalUserMessages}`);
  console.log(`Total AI responses: ${messagesSnapshot.size - totalUserMessages}`);
  console.log();
}

checkAgentMessages().catch(console.error);

