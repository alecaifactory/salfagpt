import { firestore } from '../src/lib/firestore.js';

async function main() {
  console.log('🔍 Checking user mapping for hashed IDs...\n');
  
  // Check the users collection
  const userDoc = await firestore
    .collection('users')
    .doc('usr_uhwqffaqag1wrryd82tw')
    .get();
  
  if (userDoc.exists) {
    const userData = userDoc.data();
    console.log('✅ Found user document:');
    console.log('  ID:', userDoc.id);
    console.log('  Email:', userData?.email);
    console.log('  Name:', userData?.name);
    console.log('  Role:', userData?.role);
    console.log('  Google User ID:', userData?.googleUserId);
  } else {
    console.log('❌ No user document found for usr_uhwqffaqag1wrryd82tw');
    console.log('💡 This might be a legacy hashed ID without a user document');
  }
  
  // Also check if there's a user doc with the Google OAuth ID
  const googleUserDoc = await firestore
    .collection('users')
    .doc('114671162830729001607')
    .get();
  
  console.log('\n🔍 Checking user doc with Google OAuth ID...\n');
  
  if (googleUserDoc.exists) {
    const userData = googleUserDoc.data();
    console.log('✅ Found user document with Google ID:');
    console.log('  ID:', googleUserDoc.id);
    console.log('  Email:', userData?.email);
    console.log('  Name:', userData?.name);
  } else {
    console.log('ℹ️ No user document found with Google OAuth ID as document ID');
  }
  
  process.exit(0);
}

main();

