#!/usr/bin/env node

/**
 * Find ALL M001-Related Activity
 * Check messages in:
 * 1. Agent itself (conversationId = agentId)
 * 2. Child conversations (agentId field)
 * 3. Any conversation by shared users
 */

import { Firestore } from '@google-cloud/firestore';

const firestore = new Firestore({
  projectId: 'salfagpt',
});

const AGENT_ID = 'cjn3bC0HrUYtHqu69CKS';

async function findAllActivity() {
  console.log('🔍 Finding ALL M001-Related Activity');
  console.log('═'.repeat(80));
  console.log();

  // Get shared users
  const sharesSnapshot = await firestore
    .collection('agent_shares')
    .where('agentId', '==', AGENT_ID)
    .get();

  const sharedUsers = new Map();
  for (const shareDoc of sharesSnapshot.docs) {
    const shareData = shareDoc.data();
    for (const target of shareData.sharedWith || []) {
      if (target.type === 'user') {
        sharedUsers.set(target.id, {
          email: target.email,
          accessLevel: shareData.accessLevel,
        });
      }
    }
  }

  console.log(`📊 Agent shared with ${sharedUsers.size} users\n`);

  // Load all users
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

  // Get agent owner
  const agentDoc = await firestore.collection('conversations').doc(AGENT_ID).get();
  const ownerId = agentDoc.data()?.userId;

  console.log(`👑 Agent owner: ${ownerId}\n`);

  // Strategy: Check ALL messages and find which users have interacted
  console.log('1️⃣  Loading ALL messages (last 5000)...');
  const allMessagesSnapshot = await firestore
    .collection('messages')
    .limit(5000)
    .get();

  console.log(`   Loaded ${allMessagesSnapshot.size} messages total\n`);

  // Find messages by each shared user
  const activityByUser = new Map();

  for (const msgDoc of allMessagesSnapshot.docs) {
    const msgData = msgDoc.data();
    const userId = msgData.userId;
    const conversationId = msgData.conversationId;
    
    // Check if this user is a shared user or owner
    if (sharedUsers.has(userId) || userId === ownerId) {
      if (!activityByUser.has(userId)) {
        activityByUser.set(userId, {
          directMessages: [],
          childConversations: new Set(),
          otherConversations: new Set(),
          totalMessages: 0,
        });
      }
      
      const activity = activityByUser.get(userId);
      activity.totalMessages++;
      
      // Categorize message
      if (conversationId === AGENT_ID) {
        // Direct message on agent
        activity.directMessages.push({
          id: msgDoc.id,
          role: msgData.role,
          content: typeof msgData.content === 'string' ? msgData.content : msgData.content?.text || '',
          timestamp: msgData.timestamp?.toDate(),
        });
      } else {
        // Check if conversation has agentId = M001
        const convDoc = await firestore.collection('conversations').doc(conversationId).get();
        const convData = convDoc.data();
        
        if (convData?.agentId === AGENT_ID) {
          activity.childConversations.add(conversationId);
        } else {
          activity.otherConversations.add(conversationId);
        }
      }
    }
  }

  // Display results
  console.log('═'.repeat(80));
  console.log('📊 ACTIVITY REPORT BY USER');
  console.log('═'.repeat(80));
  console.log();

  let activeUsers = 0;
  let inactiveUsers = 0;

  // Check all users (shared + owner)
  const allUserIds = new Set([...sharedUsers.keys(), ownerId]);

  for (const userId of allUserIds) {
    const userInfo = usersMap.get(userId);
    const activity = activityByUser.get(userId);
    const isOwner = userId === ownerId;
    const accessType = isOwner ? '👑 OWNER' : '🔗 SHARED';
    
    if (activity && activity.totalMessages > 0) {
      activeUsers++;
      
      console.log(`✅ ${accessType}: ${userInfo?.name || 'Unknown'}`);
      console.log(`   📧 ${userInfo?.email || sharedUsers.get(userId)?.email || 'Unknown'}`);
      console.log(`   💬 Total Messages: ${activity.totalMessages}`);
      console.log(`   📨 Direct on Agent: ${activity.directMessages.length}`);
      console.log(`   🗨️  In Child Chats: ${activity.childConversations.size}`);
      
      if (activity.directMessages.length > 0) {
        const userMsgs = activity.directMessages.filter(m => m.role === 'user');
        console.log(`\n   📝 Recent Questions (${userMsgs.length} total):`);
        userMsgs.slice(0, 3).forEach((msg, i) => {
          const preview = msg.content.substring(0, 100).replace(/\n/g, ' ');
          const date = msg.timestamp?.toLocaleDateString('es-CL') || 'Unknown';
          console.log(`      ${i + 1}. [${date}] "${preview}${msg.content.length > 100 ? '...' : ''}"`);
        });
      }
      console.log();
    } else {
      inactiveUsers++;
      
      console.log(`❌ ${accessType}: ${userInfo?.name || 'Unknown'}`);
      console.log(`   📧 ${userInfo?.email || sharedUsers.get(userId)?.email || 'Unknown'}`);
      console.log(`   ⚠️  No activity detected`);
      console.log();
    }
  }

  // Final summary
  console.log('═'.repeat(80));
  console.log('📈 FINAL SUMMARY');
  console.log('═'.repeat(80));
  console.log(`Total users with access: ${allUserIds.size}`);
  console.log(`Users with activity: ${activeUsers} (${((activeUsers / allUserIds.size) * 100).toFixed(1)}%)`);
  console.log(`Users without activity: ${inactiveUsers} (${((inactiveUsers / allUserIds.size) * 100).toFixed(1)}%)`);
  console.log();
}

findAllActivity().catch(console.error);







