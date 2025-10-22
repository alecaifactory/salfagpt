/**
 * Quick script to check if a specific user has userId field
 * Usage: npx tsx scripts/check-user-id.ts <email>
 */

import { firestore } from '../src/lib/firestore';

const email = process.argv[2];

if (!email) {
  console.error('❌ Please provide email address');
  console.log('Usage: npx tsx scripts/check-user-id.ts alec@salfacloud.cl');
  process.exit(1);
}

async function checkUserId() {
  try {
    const userId = email.replace(/[@.]/g, '_');
    console.log(`\n🔍 Checking user: ${email}`);
    console.log(`📋 Document ID: ${userId}\n`);
    
    const doc = await firestore.collection('users').doc(userId).get();
    
    if (!doc.exists) {
      console.log('❌ User document not found in Firestore');
      console.log('   This user needs to login at least once\n');
      process.exit(1);
    }
    
    const data = doc.data();
    
    console.log('✅ User document found!');
    console.log('\nDocument contents:');
    console.log(JSON.stringify(data, null, 2));
    
    console.log('\n' + '='.repeat(60));
    if (data?.userId) {
      console.log('✅ userId field EXISTS!');
      console.log(`   Value: ${data.userId}`);
      console.log('   Type:', typeof data.userId);
      console.log('\n✅ This user can be shared with using numeric ID');
    } else {
      console.log('❌ userId field MISSING!');
      console.log('\n🚨 This user needs to LOGOUT and RE-LOGIN');
      console.log('   When they re-login, the Google OAuth ID will be saved');
    }
    console.log('='.repeat(60) + '\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

checkUserId();

