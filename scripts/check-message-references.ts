/**
 * Diagnostic script to check if messages have references in Firestore
 * 
 * Usage:
 *   npx tsx scripts/check-message-references.ts [conversationId]
 */

import { firestore, COLLECTIONS } from '../src/lib/firestore';

async function checkMessageReferences(conversationId?: string) {
  try {
    console.log('🔍 Checking message references in Firestore\n');

    if (conversationId) {
      // Check specific conversation
      console.log(`📋 Conversation: ${conversationId}\n`);
      
      const messagesSnapshot = await firestore
        .collection(COLLECTIONS.MESSAGES)
        .where('conversationId', '==', conversationId)
        .orderBy('timestamp', 'desc')
        .limit(10)
        .get();

      console.log(`Found ${messagesSnapshot.size} messages\n`);

      messagesSnapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        const hasReferences = data.references && data.references.length > 0;
        
        console.log(`Message ${index + 1}:`);
        console.log(`  ID: ${doc.id}`);
        console.log(`  Role: ${data.role}`);
        console.log(`  Timestamp: ${data.timestamp.toDate().toISOString()}`);
        console.log(`  References: ${hasReferences ? `✅ ${data.references.length} refs` : '❌ None'}`);
        
        if (hasReferences) {
          data.references.forEach((ref: any) => {
            console.log(`    [${ref.id}] ${ref.sourceName} - Similarity: ${ref.similarity ? (ref.similarity * 100).toFixed(1) + '%' : 'N/A'}`);
          });
        }
        console.log('');
      });
    } else {
      // Check all recent messages with references
      console.log('📊 Checking recent messages with references...\n');
      
      const messagesSnapshot = await firestore
        .collection(COLLECTIONS.MESSAGES)
        .where('role', '==', 'assistant')
        .orderBy('timestamp', 'desc')
        .limit(50)
        .get();

      const withRefs = messagesSnapshot.docs.filter(doc => {
        const data = doc.data();
        return data.references && data.references.length > 0;
      });

      console.log(`Total assistant messages checked: ${messagesSnapshot.size}`);
      console.log(`Messages with references: ${withRefs.length}`);
      console.log(`Messages without references: ${messagesSnapshot.size - withRefs.length}\n`);

      // Group by conversation
      const byConversation = new Map<string, number>();
      withRefs.forEach(doc => {
        const convId = doc.data().conversationId;
        byConversation.set(convId, (byConversation.get(convId) || 0) + 1);
      });

      console.log('Messages with references by conversation:');
      Array.from(byConversation.entries())
        .sort((a, b) => b[1] - a[1])
        .forEach(([convId, count]) => {
          console.log(`  ${convId}: ${count} messages`);
        });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Get conversation ID from command line or check all
const conversationId = process.argv[2];
checkMessageReferences(conversationId);

