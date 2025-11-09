import { firestore } from '../src/lib/firestore.js';

async function checkUserId() {
  console.log('Checking userId for alec@getaifactory.com...\n');
  
  const snapshot = await firestore.collection('users')
    .where('email', '==', 'alec@getaifactory.com')
    .limit(1)
    .get();

  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    const data = doc.data();
    console.log('✅ User found:');
    console.log('  Document ID (firestore):', doc.id);
    console.log('  Email:', data.email);
    console.log('  GoogleUserId:', data.googleUserId || 'NOT SET');
    console.log('  UserId field:', data.userId || 'NOT SET');
    console.log('\n📊 Which one should be used for queries?');
    console.log('  Answer: Document ID =', doc.id);
  } else {
    console.log('❌ User not found');
  }
  
  process.exit(0);
}

checkUserId().catch(console.error);

