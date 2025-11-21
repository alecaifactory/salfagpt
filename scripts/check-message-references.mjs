#!/usr/bin/env node
/**
 * Check which messages have references field in Firestore
 * Usage: node scripts/check-message-references.mjs [conversationId]
 */

import { Firestore } from '@google-cloud/firestore';

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'salfagpt';
const firestore = new Firestore({ projectId: PROJECT_ID });

async function checkMessageReferences(conversationId) {
  console.log(`🔍 Checking messages for conversation: ${conversationId}\n`);
  
  const messagesSnapshot = await firestore
    .collection('messages')
    .where('conversationId', '==', conversationId)
    .orderBy('timestamp', 'desc')
    .limit(50)
    .get();
  
  if (messagesSnapshot.empty) {
    console.log('❌ No messages found for this conversation');
    return;
  }
  
  console.log(`📊 Found ${messagesSnapshot.size} messages\n`);
  
  let withRefs = 0;
  let withoutRefs = 0;
  
  messagesSnapshot.docs.forEach(doc => {
    const data = doc.data();
    const timestamp = data.timestamp.toDate().toISOString();
    const role = data.role;
    const hasRefs = data.references && data.references.length > 0;
    
    if (hasRefs) {
      withRefs++;
      console.log(`✅ [${timestamp}] ${role.toUpperCase()}: ${data.references.length} referencias`);
      data.references.forEach(ref => {
        console.log(`   [${ref.id}] ${ref.sourceName} - ${ref.similarity ? `${(ref.similarity * 100).toFixed(1)}%` : 'N/A'}`);
      });
    } else {
      withoutRefs++;
      console.log(`❌ [${timestamp}] ${role.toUpperCase()}: Sin referencias`);
    }
    console.log(''); // Empty line between messages
  });
  
  console.log('\n📈 Summary:');
  console.log(`  ✅ Messages with references: ${withRefs}`);
  console.log(`  ❌ Messages without references: ${withoutRefs}`);
  console.log(`  📊 Total: ${messagesSnapshot.size}`);
  
  if (withoutRefs > 0) {
    console.log('\n💡 Messages without references were likely created before 2025-11-04');
    console.log('   Send new messages to test if references work correctly now.');
  }
}

// Get conversationId from command line
const conversationId = process.argv[2];

if (!conversationId) {
  console.error('❌ Error: conversationId required');
  console.log('Usage: node scripts/check-message-references.mjs <conversationId>');
  process.exit(1);
}

checkMessageReferences(conversationId)
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });









