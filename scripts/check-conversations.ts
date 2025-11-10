import { firestore } from '../src/lib/firestore.js';

async function main() {
  console.log('🔍 Checking conversations for userId: 114671162830729001607');
  
  const snapshot = await firestore
    .collection('conversations')
    .where('userId', '==', '114671162830729001607')
    .get();
  
  console.log('Total conversations:', snapshot.size);
  
  if (snapshot.size > 0) {
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log('  -', data.title, '(', data.messageCount, 'messages )');
    });
  } else {
    console.log('ℹ️ No conversations found for this user');
    console.log('💡 This is normal for a new user or fresh setup');
    console.log('✅ Click "+ Nuevo Agente" to create your first conversation');
  }
  
  process.exit(0);
}

main();

