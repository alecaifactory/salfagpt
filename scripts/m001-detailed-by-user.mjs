#!/usr/bin/env node

/**
 * Detailed M001 Usage Report - All Conversations Per User
 */

import { Firestore } from '@google-cloud/firestore';

const firestore = new Firestore({
  projectId: 'salfagpt',
});

const AGENT_ID = 'cjn3bC0HrUYtHqu69CKS';

async function detailedReport() {
  console.log('📋 M001 Agent - Detailed Conversation List by User');
  console.log('═'.repeat(80));
  console.log();

  // Get agent
  const agentDoc = await firestore.collection('conversations').doc(AGENT_ID).get();
  const agentData = agentDoc.data();

  // Get shares
  const sharesSnapshot = await firestore
    .collection('agent_shares')
    .where('agentId', '==', AGENT_ID)
    .get();

  // Collect user IDs
  const userIds = new Set();
  userIds.add(agentData.userId);

  for (const shareDoc of sharesSnapshot.docs) {
    const shareData = shareDoc.data();
    for (const target of shareData.sharedWith || []) {
      if (target.type === 'user') {
        userIds.add(target.id);
      }
    }
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

  // Load ALL conversations for this agent
  const conversationsSnapshot = await firestore
    .collection('conversations')
    .where('agentId', '==', AGENT_ID)
    .where('isAgent', '==', false)
    .get();

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

  // Display per user
  let userIndex = 1;
  
  for (const userId of userIds) {
    const userInfo = usersMap.get(userId);
    const conversations = conversationsByUser.get(userId) || [];
    
    const isOwner = userId === agentData.userId;
    const accessType = isOwner ? '👑 OWNER' : '🔗 SHARED';
    
    console.log('─'.repeat(80));
    console.log(`${userIndex}. ${accessType}`);
    console.log('─'.repeat(80));
    console.log(`👤 Name: ${userInfo?.name || 'Unknown'}`);
    console.log(`📧 Email: ${userInfo?.email || 'Unknown'}`);
    console.log(`🆔 User ID: ${userId}`);
    console.log(`💬 Total Conversations: ${conversations.length}`);
    console.log(`📝 Total Messages: ${conversations.reduce((sum, c) => sum + c.messageCount, 0)}`);
    console.log();
    
    if (conversations.length > 0) {
      console.log('📋 CONVERSATIONS:');
      console.log();
      
      // Sort by last message date
      conversations.sort((a, b) => 
        (b.lastMessageAt?.getTime() || 0) - (a.lastMessageAt?.getTime() || 0)
      );
      
      conversations.forEach((conv, idx) => {
        const date = conv.lastMessageAt ? 
          conv.lastMessageAt.toLocaleString('es-CL', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }) : 
          'No messages';
        
        const hasMessages = conv.messageCount > 0 ? '✅' : '⚪';
        
        console.log(`   ${hasMessages} ${idx + 1}. "${conv.title}"`);
        console.log(`      📝 Messages: ${conv.messageCount}`);
        console.log(`      📅 Last Activity: ${date}`);
        console.log(`      🆔 ID: ${conv.id}`);
        console.log();
      });
    } else {
      console.log('   ⚠️  No conversations created yet');
      console.log();
    }
    
    userIndex++;
  }

  // Final summary
  console.log('═'.repeat(80));
  console.log('📈 OVERALL SUMMARY');
  console.log('═'.repeat(80));
  
  const usersWithConversations = Array.from(userIds).filter(id => 
    (conversationsByUser.get(id) || []).length > 0
  );
  
  const totalConversations = Array.from(conversationsByUser.values())
    .reduce((sum, convs) => sum + convs.length, 0);
  
  const totalMessages = Array.from(conversationsByUser.values())
    .reduce((sum, convs) => sum + convs.reduce((s, c) => s + c.messageCount, 0), 0);
  
  console.log(`Total users with access: ${userIds.size}`);
  console.log(`Users with conversations: ${usersWithConversations.length}`);
  console.log(`Users without conversations: ${userIds.size - usersWithConversations.length}`);
  console.log(`Total conversations: ${totalConversations}`);
  console.log(`Total messages: ${totalMessages}`);
  console.log(`Adoption rate: ${((usersWithConversations.length / userIds.size) * 100).toFixed(1)}%`);
  console.log();
}

detailedReport().catch(console.error);




