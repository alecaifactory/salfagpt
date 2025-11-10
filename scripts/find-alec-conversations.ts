import { firestore } from '../src/lib/firestore.js';

async function main() {
  console.log('🔍 Searching for all conversations for alec@getaifactory.com...\n');
  
  // Get all conversations
  const snapshot = await firestore
    .collection('conversations')
    .get();
  
  console.log(`📊 Total conversations in database: ${snapshot.size}\n`);
  
  // Group by userId
  const byUserId = new Map<string, any[]>();
  
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    const userId = data.userId || 'unknown';
    
    if (!byUserId.has(userId)) {
      byUserId.set(userId, []);
    }
    
    byUserId.get(userId)!.push({
      id: doc.id,
      title: data.title,
      messageCount: data.messageCount || 0,
      createdAt: data.createdAt?.toDate?.() || new Date(),
    });
  });
  
  console.log('📋 Conversations by userId:\n');
  
  for (const [userId, conversations] of byUserId.entries()) {
    console.log(`  userId: ${userId}`);
    console.log(`  Count: ${conversations.length}`);
    console.log(`  Sample titles: ${conversations.slice(0, 3).map(c => c.title).join(', ')}\n`);
  }
  
  // Check for potential matches
  console.log('🔍 Looking for alec-related userIds...\n');
  
  const alecUserIds = Array.from(byUserId.keys()).filter(id => 
    id.includes('alec') || 
    id.includes('114671162830729001607') ||
    id.includes('usr_')
  );
  
  if (alecUserIds.length > 0) {
    console.log('Found potential Alec userIds:');
    alecUserIds.forEach(id => {
      const count = byUserId.get(id)!.length;
      console.log(`  - ${id}: ${count} conversations`);
    });
  }
  
  process.exit(0);
}

main();

