/**
 * Complete check of alec@getaifactory.com data across all collections
 */

import { firestore } from '../src/lib/firestore.js';

async function checkAlecData() {
  console.log('\n🔍 COMPLETE DATA CHECK: alec@getaifactory.com\n');
  console.log('═'.repeat(70));
  
  // 1. Find user document
  console.log('\n1️⃣  User Document:\n');
  
  const userSnapshot = await firestore
    .collection('users')
    .where('email', '==', 'alec@getaifactory.com')
    .limit(1)
    .get();
  
  let alecUser = null;
  if (!userSnapshot.empty) {
    const doc = userSnapshot.docs[0];
    alecUser = { id: doc.id, ...doc.data() };
    console.log(`   ✅ Found:`);
    console.log(`      Doc ID: ${alecUser.id}`);
    console.log(`      Email: ${alecUser.email}`);
    console.log(`      GoogleUserId: ${alecUser.googleUserId || 'NOT SET'}`);
    console.log(`      Role: ${alecUser.role}`);
  } else {
    console.log(`   ❌ User not found!`);
    process.exit(1);
  }
  
  // 2. Check all possible userId values
  console.log('\n2️⃣  Testing All Possible UserIds:\n');
  
  const testIds = [
    { name: 'User Doc ID', value: alecUser.id },
    { name: 'GoogleUserId', value: alecUser.googleUserId },
    { name: 'Hardcoded Numeric', value: '114671162830729001607' },
  ].filter(t => t.value);
  
  const results = {};
  
  for (const test of testIds) {
    console.log(`   Testing: ${test.name} = "${test.value}"`);
    
    // Conversations
    const convs = await firestore
      .collection('conversations')
      .where('userId', '==', test.value)
      .limit(10)
      .get();
    
    // Folders
    const folders = await firestore
      .collection('folders')
      .where('userId', '==', test.value)
      .get();
    
    // Messages
    const msgs = await firestore
      .collection('messages')
      .where('userId', '==', test.value)
      .limit(10)
      .get();
    
    results[test.value] = {
      conversations: convs.size,
      folders: folders.size,
      messages: msgs.size,
    };
    
    console.log(`      Conversations: ${convs.size}`);
    console.log(`      Folders: ${folders.size}`);
    console.log(`      Messages: ${msgs.size}`);
    console.log('');
  }
  
  // 3. Detailed output
  console.log('3️⃣  Detailed Results:\n');
  
  Object.entries(results).forEach(([userId, counts]) => {
    if (counts.conversations > 0 || counts.folders > 0 || counts.messages > 0) {
      console.log(`   ✅ userId="${userId}" HAS DATA:`);
      console.log(`      ${counts.conversations} conversations`);
      console.log(`      ${counts.folders} folders`);
      console.log(`      ${counts.messages} messages`);
      console.log('');
    }
  });
  
  // 4. Migration plan
  console.log('═'.repeat(70));
  console.log('\n4️⃣  MIGRATION PLAN:\n');
  
  // Find which userId has the most data
  const dataByUserId = Object.entries(results).sort((a, b) => {
    const aTotal = a[1].conversations + a[1].folders + a[1].messages;
    const bTotal = b[1].conversations + b[1].folders + b[1].messages;
    return bTotal - aTotal;
  });
  
  if (dataByUserId.length > 0 && dataByUserId[0][1].conversations > 0) {
    const primaryUserId = dataByUserId[0][0];
    const counts = dataByUserId[0][1];
    
    console.log(`   Primary data location: userId="${primaryUserId}"`);
    console.log(`   Data to migrate:`);
    console.log(`      ${counts.conversations} conversations`);
    console.log(`      ${counts.folders} folders`);
    console.log(`      ${counts.messages} messages`);
    console.log('');
    console.log(`   New hash ID will be: usr_<20_random_chars>`);
    console.log('');
    console.log(`   Migration will:`);
    console.log(`      1. Generate new hash ID`);
    console.log(`      2. Update user doc: ${alecUser.id} → usr_xxx`);
    console.log(`      3. Update ${counts.conversations} conversations`);
    console.log(`      4. Update ${counts.folders} folders`);
    console.log(`      5. Update ${counts.messages} messages`);
    console.log(`      6. Update shares (if any)`);
  } else {
    console.log('   ℹ️  No data found to migrate');
  }
  
  console.log('\n' + '═'.repeat(70) + '\n');
  process.exit(0);
}

checkAlecData();

