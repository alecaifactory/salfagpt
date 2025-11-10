import { firestore } from '../src/lib/firestore.js';

async function main() {
  const oldUserId = 'usr_uhwqffaqag1wrryd82tw';
  const newUserId = '114671162830729001607';
  
  console.log('🔄 Reverting migration...');
  
  // Revert conversations
  const convs = await firestore.collection('conversations').where('userId', '==', newUserId).get();
  console.log('Reverting', convs.size, 'conversations');
  
  if (convs.size > 0) {
    const batch = firestore.batch();
    convs.docs.forEach(doc => {
      batch.update(doc.ref, { 
        userId: oldUserId,
        updatedAt: new Date() 
      });
    });
    await batch.commit();
    console.log('✅ Reverted conversations');
  }
  
  process.exit(0);
}

main();

