#!/usr/bin/env node

/**
 * Analyze Usage of Agent: Asistente Legal Territorial RDI (M001)
 * 
 * Queries production Firestore to find:
 * 1. How many users have access to this agent
 * 2. Total conversations with this agent
 * 3. Conversations per user
 */

import { Firestore } from '@google-cloud/firestore';

// Initialize Firestore
const firestore = new Firestore({
  projectId: 'salfagpt',
});

const AGENT_TITLE = 'Asistente Legal Territorial RDI (M001)';

async function analyzeAgentUsage() {
  console.log('🔍 Analyzing Agent Usage');
  console.log('========================');
  console.log(`Agent: ${AGENT_TITLE}`);
  console.log('');

  try {
    // Step 1: Find the agent by title
    console.log('1️⃣  Finding agent...');
    const agentsSnapshot = await firestore
      .collection('conversations')
      .where('isAgent', '==', true)
      .where('title', '==', AGENT_TITLE)
      .get();

    if (agentsSnapshot.empty) {
      console.log(`❌ Agent "${AGENT_TITLE}" not found`);
      console.log('\nSearching for similar agents...');
      
      const allAgentsSnapshot = await firestore
        .collection('conversations')
        .where('isAgent', '==', true)
        .get();
      
      const similarAgents = allAgentsSnapshot.docs
        .filter(doc => doc.data().title?.toLowerCase().includes('m001') || 
                       doc.data().title?.toLowerCase().includes('legal'))
        .map(doc => ({
          id: doc.id,
          title: doc.data().title,
          userId: doc.data().userId,
        }));
      
      if (similarAgents.length > 0) {
        console.log('\n📋 Similar agents found:');
        similarAgents.forEach(agent => {
          console.log(`   - ${agent.title} (ID: ${agent.id})`);
        });
      }
      
      process.exit(1);
    }

    const agentDoc = agentsSnapshot.docs[0];
    const agentId = agentDoc.id;
    const agentData = agentDoc.data();
    
    console.log(`✅ Agent found!`);
    console.log(`   ID: ${agentId}`);
    console.log(`   Owner: ${agentData.userId}`);
    console.log(`   Created: ${agentData.createdAt?.toDate?.()?.toISOString() || 'Unknown'}`);
    console.log('');

    // Step 2: Find agent shares (who has access)
    console.log('2️⃣  Finding users with access...');
    const sharesSnapshot = await firestore
      .collection('agent_shares')
      .where('agentId', '==', agentId)
      .where('status', '==', 'active')
      .get();

    const userIds = new Set([agentData.userId]); // Owner always has access
    
    sharesSnapshot.docs.forEach(shareDoc => {
      const shareData = shareDoc.data();
      if (shareData.sharedWith) {
        shareData.sharedWith.forEach(target => {
          if (target.type === 'user' && target.id) {
            userIds.add(target.id);
          }
        });
      }
    });

    console.log(`✅ Found ${userIds.size} users with access`);
    console.log('');

    // Step 3: Get user details
    console.log('3️⃣  Getting user details...');
    console.log(`   Looking up ${userIds.size} user IDs...`);
    
    const usersSnapshot = await firestore.collection('users').get();
    const usersMap = new Map();
    
    console.log(`   Found ${usersSnapshot.size} total users in database`);
    
    usersSnapshot.docs.forEach(doc => {
      usersMap.set(doc.id, {
        id: doc.id,
        email: doc.data().email,
        name: doc.data().name,
        role: doc.data().role,
      });
    });

    // Debug: Show what IDs we're looking for
    console.log(`   User IDs with access:`);
    Array.from(userIds).forEach(id => {
      console.log(`      - ${id}`);
    });

    const usersWithAccess = Array.from(userIds)
      .map(id => {
        const user = usersMap.get(id);
        if (!user) {
          console.log(`   ⚠️  User ID ${id} not found in users collection`);
        }
        return user;
      })
      .filter(user => user); // Remove any not found

    console.log('');
    console.log('📧 Users with access:');
    if (usersWithAccess.length === 0) {
      console.log('   ⚠️  No users found (possible ID mismatch)');
      console.log('');
      console.log('   Checking agent_shares for email information...');
      
      sharesSnapshot.docs.forEach(shareDoc => {
        const shareData = shareDoc.data();
        console.log(`   Share ID: ${shareDoc.id}`);
        console.log(`   Shared with:`, JSON.stringify(shareData.sharedWith, null, 2));
      });
    } else {
      usersWithAccess.forEach((user, idx) => {
        console.log(`   ${idx + 1}. ${user.name} (${user.email}) - ${user.role}`);
      });
    }
    console.log('');

    // Step 4: Find all conversations (chats) with this agent
    console.log('4️⃣  Finding all conversations with this agent...');
    const chatsSnapshot = await firestore
      .collection('conversations')
      .where('agentId', '==', agentId)
      .where('isAgent', '==', false)
      .get();

    console.log(`✅ Found ${chatsSnapshot.size} total conversations (chats)`);
    console.log('');

    // Step 5: Group by user
    console.log('5️⃣  Grouping conversations by user...');
    const conversationsByUser = new Map();

    chatsSnapshot.docs.forEach(doc => {
      const chatData = doc.data();
      const userId = chatData.userId;
      
      if (!conversationsByUser.has(userId)) {
        conversationsByUser.set(userId, []);
      }
      
      conversationsByUser.get(userId).push({
        id: doc.id,
        title: chatData.title,
        messageCount: chatData.messageCount || 0,
        createdAt: chatData.createdAt?.toDate?.(),
        lastMessageAt: chatData.lastMessageAt?.toDate?.(),
      });
    });

    console.log('📊 Conversations by user:');
    console.log('');

    let totalConversations = 0;
    const userStats = [];

    usersWithAccess.forEach(user => {
      const userConvs = conversationsByUser.get(user.id) || [];
      const totalMessages = userConvs.reduce((sum, conv) => sum + conv.messageCount, 0);
      
      totalConversations += userConvs.length;
      
      userStats.push({
        user,
        conversationCount: userConvs.length,
        totalMessages,
        conversations: userConvs,
      });
    });

    // Sort by conversation count (descending)
    userStats.sort((a, b) => b.conversationCount - a.conversationCount);

    userStats.forEach((stat, idx) => {
      console.log(`${idx + 1}. ${stat.user.name} (${stat.user.email})`);
      console.log(`   Conversations: ${stat.conversationCount}`);
      console.log(`   Total messages: ${stat.totalMessages}`);
      
      if (stat.conversationCount > 0) {
        console.log(`   Latest conversations:`);
        stat.conversations
          .sort((a, b) => (b.lastMessageAt?.getTime() || 0) - (a.lastMessageAt?.getTime() || 0))
          .slice(0, 3)
          .forEach(conv => {
            console.log(`      - ${conv.title || 'Untitled'} (${conv.messageCount} messages) - Last: ${conv.lastMessageAt?.toISOString()?.split('T')[0] || 'Unknown'}`);
          });
      }
      console.log('');
    });

    // Summary
    console.log('');
    console.log('📈 SUMMARY');
    console.log('==========');
    console.log(`Agent: ${AGENT_TITLE}`);
    console.log(`Agent ID: ${agentId}`);
    console.log(`Users with access: ${usersWithAccess.length}`);
    console.log(`Total conversations: ${totalConversations}`);
    console.log(`Average conversations per user: ${(totalConversations / usersWithAccess.length).toFixed(2)}`);
    
    const totalMessages = userStats.reduce((sum, stat) => sum + stat.totalMessages, 0);
    console.log(`Total messages across all conversations: ${totalMessages}`);
    
    if (totalConversations > 0) {
      console.log(`Average messages per conversation: ${(totalMessages / totalConversations).toFixed(2)}`);
    }
    
    console.log('');
    console.log('✅ Analysis complete!');

  } catch (error) {
    console.error('❌ Error analyzing agent usage:', error);
    
    if (error.message?.includes('PERMISSION_DENIED')) {
      console.error('\n💡 Authentication required. Run:');
      console.error('   gcloud auth application-default login --project salfagpt');
    }
    
    process.exit(1);
  }
}

analyzeAgentUsage();

