#!/usr/bin/env node

/**
 * Check Which Users Are Actually Active
 * Find users who have sent messages recently
 */

import { Firestore } from '@google-cloud/firestore';

const firestore = new Firestore({
  projectId: 'salfagpt',
});

async function checkActiveUsers() {
  console.log('🔍 Checking Active Users in System');
  console.log('═'.repeat(80));
  console.log();

  // Load all users
  const usersSnapshot = await firestore.collection('users').get();
  const usersMap = new Map();
  const emailToIdMap = new Map();
  
  for (const userDoc of usersSnapshot.docs) {
    const userData = userDoc.data();
    usersMap.set(userDoc.id, {
      id: userDoc.id,
      email: userData.email,
      name: userData.name,
      company: userData.company,
    });
    if (userData.email) {
      emailToIdMap.set(userData.email.toLowerCase(), userDoc.id);
    }
  }

  console.log(`📊 Total users in system: ${usersMap.size}\n`);

  // Get messages from last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  console.log('1️⃣  Loading recent messages (last 1000)...');
  const messagesSnapshot = await firestore
    .collection('messages')
    .limit(1000)
    .get();

  // Group by user
  const messagesByUser = new Map();
  
  for (const msgDoc of messagesSnapshot.docs) {
    const msgData = msgDoc.data();
    const userId = msgData.userId;
    const timestamp = msgData.timestamp?.toDate();
    
    if (!messagesByUser.has(userId)) {
      messagesByUser.set(userId, {
        total: 0,
        recent: 0,
        lastMessage: null,
        conversations: new Set(),
      });
    }
    
    const userStats = messagesByUser.get(userId);
    userStats.total++;
    userStats.conversations.add(msgData.conversationId);
    
    if (timestamp && timestamp > sevenDaysAgo) {
      userStats.recent++;
    }
    
    if (!userStats.lastMessage || timestamp > userStats.lastMessage) {
      userStats.lastMessage = timestamp;
    }
  }

  console.log(`   Found messages from ${messagesByUser.size} unique users\n`);

  // Sort by recent activity
  const sortedUsers = Array.from(messagesByUser.entries())
    .sort((a, b) => (b[1].lastMessage?.getTime() || 0) - (a[1].lastMessage?.getTime() || 0));

  // Display active users
  console.log('═'.repeat(80));
  console.log('👥 ACTIVE USERS (Last 7 Days)');
  console.log('═'.repeat(80));
  console.log();

  sortedUsers.forEach(([userId, stats], idx) => {
    const userInfo = usersMap.get(userId);
    const isRecent = stats.recent > 0;
    const icon = isRecent ? '✅' : '⚪';
    
    if (isRecent) {
      console.log(`${icon} ${idx + 1}. ${userInfo?.name || 'Unknown'}`);
      console.log(`   📧 ${userInfo?.email || 'Unknown'}`);
      console.log(`   🏢 ${userInfo?.company || 'Unknown'}`);
      console.log(`   💬 Recent Messages (7d): ${stats.recent}`);
      console.log(`   📊 Total Messages: ${stats.total}`);
      console.log(`   🗨️  Conversations: ${stats.conversations.size}`);
      console.log(`   📅 Last Activity: ${stats.lastMessage?.toLocaleString('es-CL') || 'Unknown'}`);
      console.log();
    }
  });

  // Check the specific shared user emails
  console.log('═'.repeat(80));
  console.log('🔍 CHECKING SPECIFIC SHARED USERS');
  console.log('═'.repeat(80));
  console.log();

  const sharedEmails = [
    'cquijadam@iaconcagua.com',
    'ireygadas@iaconcagua.com',
    'jriverof@iaconcagua.com',
    'mallende@iaconcagua.com',
    'recontreras@iaconcagua.com',
    'jmancilla@iaconcagua.com',
    'afmanriquez@iaconcagua.com',
    'fdiazt@salfagestion.cl',
    'sorellanac@salfagestion.cl',
    'nfarias@salfagestion.cl',
    'alec@salfacloud.cl',
  ];

  for (const email of sharedEmails) {
    const userId = emailToIdMap.get(email.toLowerCase());
    const activity = userId ? messagesByUser.get(userId) : null;
    
    console.log(`📧 ${email}`);
    
    if (!userId) {
      console.log(`   ❌ User not found in database`);
    } else if (!activity) {
      console.log(`   ⚠️  User exists but has NO messages`);
      console.log(`   🆔 User ID: ${userId}`);
    } else {
      console.log(`   ✅ User has activity!`);
      console.log(`   🆔 User ID: ${userId}`);
      console.log(`   💬 Messages: ${activity.total} (${activity.recent} in last 7 days)`);
      console.log(`   📅 Last: ${activity.lastMessage?.toLocaleString('es-CL') || 'Unknown'}`);
    }
    console.log();
  }

  // Summary
  console.log('═'.repeat(80));
  console.log('📈 SUMMARY');
  console.log('═'.repeat(80));
  console.log(`Active users (7 days): ${sortedUsers.filter(([_, s]) => s.recent > 0).length}`);
  console.log(`Shared users with activity: ${sharedEmails.filter(e => {
    const id = emailToIdMap.get(e.toLowerCase());
    return id && messagesByUser.has(id);
  }).length} of ${sharedEmails.length}`);
  console.log();
}

checkActiveUsers().catch(console.error);




