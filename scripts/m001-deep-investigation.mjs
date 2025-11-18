#!/usr/bin/env node

/**
 * Deep Investigation - Find ALL M001 Activity
 * Checks multiple ways conversations could be linked to M001
 */

import { Firestore } from '@google-cloud/firestore';

const firestore = new Firestore({
  projectId: 'salfagpt',
});

const AGENT_ID = 'cjn3bC0HrUYtHqu69CKS';
const AGENT_TITLE = 'Asistente Legal Territorial RDI (M001)';

async function deepInvestigation() {
  console.log('🔍 DEEP INVESTIGATION - M001 Activity');
  console.log('═'.repeat(80));
  console.log();

  // Get shared users
  const sharesSnapshot = await firestore
    .collection('agent_shares')
    .where('agentId', '==', AGENT_ID)
    .get();

  const sharedUserIds = new Set();
  const sharedUserEmails = new Set();
  
  for (const shareDoc of sharesSnapshot.docs) {
    const shareData = shareDoc.data();
    for (const target of shareData.sharedWith || []) {
      if (target.type === 'user') {
        sharedUserIds.add(target.id);
        if (target.email) {
          sharedUserEmails.add(target.email);
        }
      }
    }
  }

  console.log(`📊 Shared with ${sharedUserIds.size} users`);
  console.log(`📧 Emails: ${Array.from(sharedUserEmails).join(', ')}`);
  console.log();

  // Load users to get email mapping
  const usersSnapshot = await firestore.collection('users').get();
  const usersMap = new Map();
  const emailToUserMap = new Map();
  
  for (const userDoc of usersSnapshot.docs) {
    const userData = userDoc.data();
    usersMap.set(userDoc.id, {
      id: userDoc.id,
      email: userData.email,
      name: userData.name,
    });
    if (userData.email) {
      emailToUserMap.set(userData.email, userDoc.id);
    }
  }

  // Strategy 1: Conversations with agentId field
  console.log('1️⃣  Checking conversations with agentId field...');
  const convWithAgentIdSnapshot = await firestore
    .collection('conversations')
    .where('agentId', '==', AGENT_ID)
    .get();
  
  console.log(`   Found ${convWithAgentIdSnapshot.size} conversations\n`);

  // Strategy 2: Conversations with M001 in title (case insensitive)
  console.log('2️⃣  Checking conversations with "M001" in title...');
  const allConversationsSnapshot = await firestore
    .collection('conversations')
    .get();
  
  const m001TitleConversations = allConversationsSnapshot.docs.filter(doc => {
    const title = doc.data().title?.toLowerCase() || '';
    return title.includes('m001') || title.includes('legal') || title.includes('territorial');
  });
  
  console.log(`   Found ${m001TitleConversations.length} conversations with M001/legal/territorial in title\n`);

  // Strategy 3: Check messages that reference M001 context
  console.log('3️⃣  Checking for messages with M001 context sources...');
  const messagesSnapshot = await firestore
    .collection('messages')
    .limit(1000)
    .get();
  
  const conversationsWithM001Context = new Set();
  
  for (const msgDoc of messagesSnapshot.docs) {
    const msgData = msgDoc.data();
    const references = msgData.references || [];
    
    // Check if any reference is to M001 context sources
    const hasM001Reference = references.some(ref => 
      ref.sourceName?.includes('M001') || 
      ref.sourceName?.includes('Legal') ||
      ref.sourceName?.includes('Territorial')
    );
    
    if (hasM001Reference) {
      conversationsWithM001Context.add(msgData.conversationId);
    }
  }
  
  console.log(`   Found ${conversationsWithM001Context.size} conversations with M001 context references\n`);

  // Strategy 4: Get ALL conversations by shared users (regardless of agent)
  console.log('4️⃣  Getting ALL conversations by shared users...');
  
  const allConversationsBySharedUsers = new Map();
  
  for (const doc of allConversationsSnapshot.docs) {
    const data = doc.data();
    const userId = data.userId;
    
    // Check if this user is in our shared users list
    if (sharedUserIds.has(userId)) {
      if (!allConversationsBySharedUsers.has(userId)) {
        allConversationsBySharedUsers.set(userId, []);
      }
      
      allConversationsBySharedUsers.get(userId).push({
        id: doc.id,
        title: data.title,
        messageCount: data.messageCount || 0,
        agentId: data.agentId,
        isAgent: data.isAgent,
        lastMessageAt: data.lastMessageAt?.toDate(),
      });
    }
  }

  console.log(`   Found conversations for ${allConversationsBySharedUsers.size} shared users\n`);

  // Display results
  console.log('═'.repeat(80));
  console.log('📊 DETAILED FINDINGS');
  console.log('═'.repeat(80));
  console.log();

  for (const userId of sharedUserIds) {
    const userInfo = usersMap.get(userId);
    const conversations = allConversationsBySharedUsers.get(userId) || [];
    
    console.log('─'.repeat(80));
    console.log(`👤 ${userInfo?.name || 'Unknown'}`);
    console.log(`📧 ${userInfo?.email || 'Unknown'}`);
    console.log(`🆔 ${userId}`);
    console.log();
    
    if (conversations.length > 0) {
      console.log(`✅ FOUND ${conversations.length} CONVERSATIONS:`);
      console.log();
      
      conversations.forEach((conv, idx) => {
        const date = conv.lastMessageAt ? 
          conv.lastMessageAt.toLocaleString('es-CL', { 
            day: '2-digit', 
            month: '2-digit', 
            hour: '2-digit',
            minute: '2-digit'
          }) : 
          'No messages';
        
        const isLinkedToM001 = conv.agentId === AGENT_ID ? '🎯 M001' : '❓ Other';
        const hasMessages = conv.messageCount > 0 ? `📝 ${conv.messageCount}` : '⚪ 0';
        
        console.log(`   ${idx + 1}. "${conv.title}"`);
        console.log(`      ${isLinkedToM001} | ${hasMessages} msgs | ${date}`);
        console.log(`      Agent ID: ${conv.agentId || 'NOT SET'}`);
        console.log(`      Is Agent: ${conv.isAgent}`);
        console.log();
      });
    } else {
      console.log('   ❌ NO conversations found for this user');
      console.log();
    }
  }

  // Summary
  console.log('═'.repeat(80));
  console.log('📈 INVESTIGATION SUMMARY');
  console.log('═'.repeat(80));
  
  const totalConvsBySharedUsers = Array.from(allConversationsBySharedUsers.values())
    .reduce((sum, convs) => sum + convs.length, 0);
  
  const convsLinkedToM001 = Array.from(allConversationsBySharedUsers.values())
    .flat()
    .filter(c => c.agentId === AGENT_ID).length;
  
  const convsWithMessages = Array.from(allConversationsBySharedUsers.values())
    .flat()
    .filter(c => c.messageCount > 0).length;

  console.log(`Shared users with ANY conversations: ${allConversationsBySharedUsers.size}`);
  console.log(`Total conversations by shared users: ${totalConvsBySharedUsers}`);
  console.log(`Conversations linked to M001 (agentId match): ${convsLinkedToM001}`);
  console.log(`Conversations with messages: ${convsWithMessages}`);
  console.log(`Conversations found via title search: ${m001TitleConversations.length}`);
  console.log(`Conversations with M001 context references: ${conversationsWithM001Context.size}`);
  console.log();
}

deepInvestigation().catch(console.error);







