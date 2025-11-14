#!/usr/bin/env node

/**
 * Simple check for M003 references issue
 */

import { Firestore } from '@google-cloud/firestore';

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'salfagpt';
const firestore = new Firestore({ projectId: PROJECT_ID });

async function checkM003() {
  console.log('🔍 Checking M003 (GOP GPT) Configuration\n');

  // Find agent
  const agent = await firestore
    .collection('conversations')
    .where('title', '==', 'GOP GPT (M003)')
    .limit(1)
    .get();

  if (agent.empty) {
    console.log('❌ Agent not found');
    return;
  }

  const agentDoc = agent.docs[0];
  const agentData = agentDoc.data();
  const agentId = agentDoc.id;

  console.log('📊 Agent:', agentData.title);
  console.log('🆔 ID:', agentId);
  console.log('');

  // Check active sources
  const contextDoc = await firestore
    .collection('conversation_context')
    .doc(agentId)
    .get();

  const activeSourceIds = contextDoc.exists 
    ? contextDoc.data().activeContextSourceIds || []
    : agentData.activeContextSourceIds || [];

  console.log('✅ Active Sources:', activeSourceIds.length);
  console.log('');

  if (activeSourceIds.length === 0) {
    console.log('❌ PROBLEM: No active sources');
    console.log('💡 SOLUTION: Activate sources in UI');
    return;
  }

  // Check recent messages (simplified query to avoid index requirement)
  console.log('📝 Checking recent messages with references...');
  const messages = await firestore
    .collection('messages')
    .where('conversationId', '==', agentId)
    .orderBy('timestamp', 'desc')
    .limit(10)
    .get();
  
  // Filter to assistant messages in code
  const assistantMessages = messages.docs.filter(doc => doc.data().role === 'assistant');

  console.log(`Found ${assistantMessages.length} recent AI messages`);
  console.log('');

  assistantMessages.slice(0, 5).forEach((doc, i) => {
    const msg = doc.data();
    const hasReferences = msg.references && msg.references.length > 0;
    const ragConfig = msg.ragConfiguration || {};
    
    console.log(`${i + 1}. Message at ${msg.timestamp.toDate().toISOString()}`);
    console.log(`   Has references: ${hasReferences ? '✅ YES (' + msg.references.length + ')' : '❌ NO'}`);
    console.log(`   RAG used: ${ragConfig.actuallyUsed ? '✅ YES' : '❌ NO'}`);
    console.log(`   RAG fallback: ${ragConfig.hadFallback ? '⚠️ YES' : '✅ NO'}`);
    
    if (ragConfig.stats) {
      console.log(`   Chunks retrieved: ${ragConfig.stats.totalChunks}`);
      console.log(`   Avg similarity: ${(ragConfig.stats.avgSimilarity * 100).toFixed(1)}%`);
    }
    
    console.log('');
  });

  // Summary
  console.log('📋 DIAGNOSIS:');
  console.log('═'.repeat(60));
  
  const hasRecentReferences = assistantMessages.some(doc => 
    doc.data().references && doc.data().references.length > 0
  );
  
  if (!hasRecentReferences) {
    console.log('❌ No recent messages have references');
    console.log('');
    console.log('🔍 POSSIBLE CAUSES:');
    console.log('   1. No chunks indexed in BigQuery (documents not processed)');
    console.log('   2. Similarity scores below 70% threshold');
    console.log('   3. ragHadFallback = true (no relevant docs found)');
    console.log('');
    console.log('💡 SOLUTIONS:');
    console.log('   1. Check if documents need reindexing:');
    console.log('      node scripts/reindex-all-documents.ts');
    console.log('');
    console.log('   2. Lower similarity threshold temporarily (test only):');
    console.log('      Edit src/pages/api/conversations/[id]/messages-stream.ts');
    console.log('      Change: ragMinSimilarity = 0.7 → 0.5');
    console.log('');
    console.log('   3. Ask more specific questions that match document content');
  } else {
    console.log('✅ Recent messages DO have references!');
    console.log('💡 Try asking a different question that better matches document content');
  }
}

checkM003();

