/**
 * Get Hash ID for a user (for use in CLI uploads)
 * 
 * Usage: npx tsx scripts/get-hash-id.ts [email]
 */

import { firestore } from '../src/lib/firestore';

async function getHashId() {
  const email = process.argv[2] || 'alec@getaifactory.com';
  
  console.log(`\n🔍 Looking up hash ID for: ${email}\n`);
  
  const users = await firestore
    .collection('users')
    .where('email', '==', email)
    .get();
  
  if (users.empty) {
    console.log(`❌ No user found with email: ${email}`);
    console.log(`\n💡 Make sure the user has logged in at least once.`);
    process.exit(1);
  }
  
  const user = users.docs[0];
  const data = user.data();
  
  console.log('✅ User found!\n');
  console.log('═══════════════════════════════════════');
  console.log('📋 USER INFORMATION');
  console.log('═══════════════════════════════════════');
  console.log(`Hash ID:    ${user.id}`);
  console.log(`Email:      ${data.email}`);
  console.log(`Name:       ${data.name}`);
  console.log(`Google ID:  ${data.googleUserId || 'N/A'}`);
  console.log('═══════════════════════════════════════\n');
  
  console.log('💡 Use this in CLI uploads:\n');
  console.log(`   --user=${user.id} \\`);
  if (data.googleUserId) {
    console.log(`   --google-user=${data.googleUserId} \\`);
  }
  console.log(`   --email=${data.email}`);
  console.log('');
}

getHashId().then(() => process.exit(0)).catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});

