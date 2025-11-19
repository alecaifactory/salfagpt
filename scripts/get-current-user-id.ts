/**
 * Get the current logged-in user's hash ID from the browser
 * 
 * This will show us what ID to use for context sources
 */

import { firestore } from '../src/lib/firestore';

async function getCurrentUserId() {
  console.log('\n🔍 Finding user IDs...\n');
  
  // Look for the user with Google ID
  const googleId = '114671162830729001607';
  const email = 'alec@getaifactory.com';
  
  console.log(`Looking for user with:`);
  console.log(`  Google ID: ${googleId}`);
  console.log(`  Email: ${email}\n`);
  
  // Check users collection for this Google ID
  const usersByGoogle = await firestore
    .collection('users')
    .where('googleUserId', '==', googleId)
    .get();
  
  if (usersByGoogle.size > 0) {
    console.log(`✅ Found ${usersByGoogle.size} user(s) with Google ID:\n`);
    usersByGoogle.forEach(doc => {
      const data = doc.data();
      console.log(`  Document ID (hash): ${doc.id}`);
      console.log(`  Email: ${data.email}`);
      console.log(`  Google ID: ${data.googleUserId}`);
      console.log(`  Name: ${data.name}\n`);
    });
  }
  
  // Also check by email
  const usersByEmail = await firestore
    .collection('users')
    .where('email', '==', email)
    .get();
  
  if (usersByEmail.size > 0) {
    console.log(`✅ Found ${usersByEmail.size} user(s) with email ${email}:\n`);
    usersByEmail.forEach(doc => {
      const data = doc.data();
      console.log(`  Document ID (hash): ${doc.id}`);
      console.log(`  Email: ${data.email}`);
      console.log(`  Google ID: ${data.googleUserId}`);
      console.log(`  Name: ${data.name}\n`);
    });
  }
  
  // Summary
  console.log('═══════════════════════════════════════');
  console.log('📝 SUMMARY');
  console.log('═══════════════════════════════════════');
  console.log(`Documents were uploaded with userId: ${googleId}`);
  if (usersByGoogle.size > 0) {
    const hashId = usersByGoogle.docs[0].id;
    console.log(`Current user's hash ID: ${hashId}`);
    console.log(`\n💡 Solution: Update all context_sources documents to use hash ID: ${hashId}`);
  } else {
    console.log(`⚠️  No user found with Google ID ${googleId}`);
    console.log(`💡 Create a user document or update context sources with correct userId`);
  }
}

getCurrentUserId().then(() => process.exit(0));

