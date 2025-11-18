/**
 * Find where Alec's conversations are actually stored
 * Check all possible userId values
 */

import { firestore } from '../src/lib/firestore.js';

async function findAlecConversations() {
  console.log('\n🔍 Finding Alec\'s Conversations\n');
  console.log('═'.repeat(60));
  
  const possibleUserIds = [
    'alec_getaifactory_com',        // Email-based
    '114671162830729001607',        // Known numeric from other docs
    'alec@getaifactory.com',        // Direct email
    'usr_y6c1byffl5yu4fq8mqmu',     // Hash from dry run
  ];
  
  for (const userId of possibleUserIds) {
    console.log(`\n📋 Checking userId: "${userId}"`);
    console.log('─'.repeat(60));
    
    try {
      const snapshot = await firestore
        .collection('conversations')
        .where('userId', '==', userId)
        .orderBy('lastMessageAt', 'desc')
        .limit(10)
        .get();
      
      console.log(`   Result: ${snapshot.size} conversations found`);
      
      if (snapshot.size > 0) {
        console.log('\n   📝 Sample conversations:');
        snapshot.docs.slice(0, 5).forEach((doc, idx) => {
          const data = doc.data();
          console.log(`\n   ${idx + 1}. ${data.title || 'Untitled'}`);
          console.log(`      ID: ${doc.id}`);
          console.log(`      isAgent: ${data.isAgent !== false}`);
          console.log(`      status: ${data.status || 'active'}`);
          console.log(`      messageCount: ${data.messageCount || 0}`);
          console.log(`      created: ${data.createdAt?.toDate?.().toISOString() || 'unknown'}`);
        });
        
        console.log(`\n   ✅ FOUND! Alec's conversations use userId: "${userId}"`);
      }
    } catch (error) {
      console.log(`   ❌ Query error: ${error.message}`);
    }
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log('\n🔍 Checking for ANY conversations without specific userId filter...\n');
  
  try {
    // Get sample of all conversations
    const allConvs = await firestore
      .collection('conversations')
      .orderBy('lastMessageAt', 'desc')
      .limit(20)
      .get();
    
    console.log(`📊 Total recent conversations (sample): ${allConvs.size}\n`);
    console.log('UserId distribution:');
    
    const userIdCounts = {};
    allConvs.docs.forEach(doc => {
      const userId = doc.data().userId;
      userIdCounts[userId] = (userIdCounts[userId] || 0) + 1;
    });
    
    Object.entries(userIdCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([userId, count]) => {
        console.log(`   ${userId}: ${count} conversations`);
      });
      
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log('\n✅ Search complete\n');
  
  process.exit(0);
}

findAlecConversations().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});






