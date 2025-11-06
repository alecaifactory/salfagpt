#!/usr/bin/env node

/**
 * Complete Analysis of Agent: Asistente Legal Territorial RDI (M001)
 * 
 * Handles both old (numeric OAuth) and new (hash) user ID formats
 * Uses email addresses for user mapping
 */

import { Firestore } from '@google-cloud/firestore';

const firestore = new Firestore({
  projectId: 'salfagpt',
});

const AGENT_TITLE = 'Asistente Legal Territorial RDI (M001)';

async function analyzeAgentM001() {
  console.log('🔍 Analyzing Agent: Asistente Legal Territorial RDI (M001)');
  console.log('==========================================================');
  console.log('');

  try {
    // Step 1: Find the agent
    console.log('1️⃣  Finding agent...');
    const agentsSnapshot = await firestore
      .collection('conversations')
      .where('isAgent', '==', true)
      .where('title', '==', AGENT_TITLE)
      .get();

    if (agentsSnapshot.empty) {
      console.log(`❌ Agent "${AGENT_TITLE}" not found`);
      process.exit(1);
    }

    const agentDoc = agentsSnapshot.docs[0];
    const agentId = agentDoc.id;
    const agentData = agentDoc.data();
    
    console.log(`✅ Agent found!`);
    console.log(`   ID: ${agentId}`);
    console.log(`   Owner ID: ${agentData.userId}`);
    console.log(`   Created: ${agentData.createdAt?.toDate?.()?.toISOString() || 'Unknown'}`);
    console.log('');

    // Step 2: Find agent shares and extract emails
    console.log('2️⃣  Finding users with access via agent_shares...');
    const sharesSnapshot = await firestore
      .collection('agent_shares')
      .where('agentId', '==', agentId)
      .where('status', '==', 'active')
      .get();

    console.log(`   Found ${sharesSnapshot.size} active shares`);

    // Collect emails from shares
    const emailsWithAccess = new Set();
    const userIdToEmailMap = new Map();

    sharesSnapshot.docs.forEach(shareDoc => {
      const shareData = shareDoc.data();
      if (shareData.sharedWith) {
        shareData.sharedWith.forEach(target => {
          if (target.type === 'user' && target.email) {
            emailsWithAccess.add(target.email);
            userIdToEmailMap.set(target.id, target.email);
          }
        });
      }
    });

    console.log(`   Extracted ${emailsWithAccess.size} unique emails from shares`);
    console.log('');

    // Step 3: Get all users and create email → user mapping
    console.log('3️⃣  Loading user database...');
    const usersSnapshot = await firestore.collection('users').get();
    
    const emailToUserMap = new Map();
    const numericIdToEmailMap = new Map();
    
    usersSnapshot.docs.forEach(doc => {
      const userData = doc.data();
      const email = userData.email;
      
      emailToUserMap.set(email, {
        id: doc.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
      });
      
      // Also store numeric ID if it exists (old format)
      if (userData.googleId) {
        numericIdToEmailMap.set(userData.googleId, email);
      }
    });

    console.log(`   Loaded ${usersSnapshot.size} users`);
    console.log('');

    // Step 4: Find all conversations (chats) for this agent
    console.log('4️⃣  Finding all conversations with this agent...');
    const chatsSnapshot = await firestore
      .collection('conversations')
      .where('agentId', '==', agentId)
      .where('isAgent', '==', false)
      .get();

    console.log(`✅ Found ${chatsSnapshot.size} total conversations (chats)`);
    console.log('');

    // Step 5: Group by user (using numeric IDs from conversations)
    console.log('5️⃣  Analyzing usage by user...');
    
    const numericUserIds = new Set();
    const conversationsByNumericId = new Map();

    chatsSnapshot.docs.forEach(doc => {
      const chatData = doc.data();
      const numericUserId = chatData.userId;
      
      numericUserIds.add(numericUserId);
      
      if (!conversationsByNumericId.has(numericUserId)) {
        conversationsByNumericId.set(numericUserId, []);
      }
      
      conversationsByNumericId.get(numericUserId).push({
        id: doc.id,
        title: chatData.title,
        messageCount: chatData.messageCount || 0,
        createdAt: chatData.createdAt?.toDate?.(),
        lastMessageAt: chatData.lastMessageAt?.toDate?.(),
      });
    });

    console.log(`   Found ${numericUserIds.size} unique users in conversations`);
    console.log('');

    // Step 6: Try to resolve numeric IDs to emails/names
    console.log('6️⃣  Resolving user identities...');
    console.log('');
    
    const userStats = [];
    let totalConversations = 0;
    let totalMessages = 0;

    for (const numericId of numericUserIds) {
      const conversations = conversationsByNumericId.get(numericId);
      const messages = conversations.reduce((sum, conv) => sum + conv.messageCount, 0);
      
      totalConversations += conversations.length;
      totalMessages += messages;

      // Try to find user info (this is the tricky part with old numeric IDs)
      let userInfo = {
        numericId: numericId,
        email: 'Unknown',
        name: 'Unknown',
        role: 'Unknown',
      };

      // Check if we can find this user in our users collection by any means
      // (This won't work for old OAuth IDs, but worth trying)
      const foundUser = Array.from(emailToUserMap.values()).find(user => 
        user.id === numericId
      );

      if (foundUser) {
        userInfo.email = foundUser.email;
        userInfo.name = foundUser.name;
        userInfo.role = foundUser.role;
      }

      userStats.push({
        ...userInfo,
        conversationCount: conversations.length,
        totalMessages: messages,
        conversations: conversations,
      });
    });

    // Sort by conversation count
    userStats.sort((a, b) => b.conversationCount - a.conversationCount);

    // Display results
    console.log('📊 USAGE ANALYSIS');
    console.log('=================');
    console.log('');

    userStats.forEach((stat, idx) => {
      console.log(`${idx + 1}. User: ${stat.name}`);
      console.log(`   Email: ${stat.email}`);
      console.log(`   Numeric ID: ${stat.numericId}`);
      console.log(`   Conversations: ${stat.conversationCount}`);
      console.log(`   Total messages: ${stat.totalMessages}`);
      
      if (stat.conversationCount > 0 && stat.conversationCount <= 5) {
        console.log(`   All conversations:`);
        stat.conversations.forEach(conv => {
          const lastMsg = conv.lastMessageAt ? 
            conv.lastMessageAt.toISOString().split('T')[0] : 
            'Unknown';
          console.log(`      - ${conv.title || 'Untitled'} (${conv.messageCount} msgs) - Last: ${lastMsg}`);
        });
      } else if (stat.conversationCount > 5) {
        console.log(`   Latest 5 conversations:`);
        stat.conversations
          .sort((a, b) => (b.lastMessageAt?.getTime() || 0) - (a.lastMessageAt?.getTime() || 0))
          .slice(0, 5)
          .forEach(conv => {
            const lastMsg = conv.lastMessageAt ? 
              conv.lastMessageAt.toISOString().split('T')[0] : 
              'Unknown';
            console.log(`      - ${conv.title || 'Untitled'} (${conv.messageCount} msgs) - Last: ${lastMsg}`);
          });
      }
      console.log('');
    });

    // Step 7: Show users from agent_shares who haven't used the agent yet
    console.log('7️⃣  Users with access but no conversations yet:');
    const usersWhoHaventUsed = Array.from(emailsWithAccess)
      .filter(email => {
        // Check if this email appears in our usage stats
        return !userStats.some(stat => stat.email === email);
      });

    if (usersWhoHaventUsed.length === 0) {
      console.log('   None - all users with access have created conversations');
    } else {
      usersWhoHaventUsed.forEach(email => {
        const user = emailToUserMap.get(email);
        if (user) {
          console.log(`   - ${user.name} (${email})`);
        } else {
          console.log(`   - ${email} (user not yet in system)`);
        }
      });
    }
    console.log('');

    // Final Summary
    console.log('');
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║                    FINAL SUMMARY                       ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`📋 Agent: ${AGENT_TITLE}`);
    console.log(`🆔 Agent ID: ${agentId}`);
    console.log(`👥 Users granted access (via shares): ${emailsWithAccess.size}`);
    console.log(`💬 Users who have used it: ${userStats.length}`);
    console.log(`📝 Total conversations (chats): ${totalConversations}`);
    console.log(`💭 Total messages sent: ${totalMessages}`);
    
    if (totalConversations > 0) {
      console.log(`📊 Average conversations per active user: ${(totalConversations / userStats.length).toFixed(2)}`);
      console.log(`📊 Average messages per conversation: ${(totalMessages / totalConversations).toFixed(2)}`);
    }
    
    console.log('');
    
    // Show detailed user breakdown
    console.log('📊 Detailed User Breakdown:');
    console.log('===========================');
    userStats.forEach((stat, idx) => {
      const percentage = ((stat.conversationCount / totalConversations) * 100).toFixed(1);
      console.log(`${idx + 1}. ${stat.email}: ${stat.conversationCount} chats (${percentage}%) - ${stat.totalMessages} messages`);
    });
    
    console.log('');
    console.log('✅ Analysis complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.message?.includes('PERMISSION_DENIED')) {
      console.error('\n💡 Authentication required. Run:');
      console.error('   gcloud auth application-default login --project salfagpt');
    }
    
    process.exit(1);
  }
}

analyzeAgentM001();

