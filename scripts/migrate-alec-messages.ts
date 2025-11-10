import { firestore } from '../src/lib/firestore.js';

async function main() {
  const oldUserId = 'usr_uhwqffaqag1wrryd82tw';  // Hashed ID
  const newUserId = '114671162830729001607';      // Google OAuth ID
  
  console.log('🔄 Migrating messages...');
  console.log(`   From: ${oldUserId}`);
  console.log(`   To: ${newUserId}\n`);
  
  // Get all messages with old userId
  const snapshot = await firestore
    .collection('messages')
    .where('userId', '==', oldUserId)
    .get();
  
  console.log(`📊 Found ${snapshot.size} messages to migrate\n`);
  
  if (snapshot.size === 0) {
    console.log('ℹ️ No messages to migrate');
    process.exit(0);
  }
  
  // Migrate in batches of 500 (Firestore limit)
  const batchSize = 500;
  let migrated = 0;
  
  for (let i = 0; i < snapshot.docs.length; i += batchSize) {
    const batch = firestore.batch();
    const batchDocs = snapshot.docs.slice(i, i + batchSize);
    
    batchDocs.forEach(doc => {
      batch.update(doc.ref, {
        userId: newUserId,
        _migratedFrom: oldUserId,  // Track migration
        _migratedAt: new Date(),
      });
    });
    
    await batch.commit();
    migrated += batchDocs.length;
    
    console.log(`✅ Migrated ${migrated}/${snapshot.size} messages`);
  }
  
  console.log('\n✅ Migration complete!');
  console.log(`   Migrated: ${migrated} messages`);
  console.log(`   From: ${oldUserId}`);
  console.log(`   To: ${newUserId}`);
  
  process.exit(0);
}

main();

