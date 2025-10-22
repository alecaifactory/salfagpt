#!/usr/bin/env node

/**
 * Enable all assigned sources for an agent
 * 
 * Usage:
 *   node scripts/enable-all-agent-sources.mjs <agentId>
 *   node scripts/enable-all-agent-sources.mjs cjn3bC0HrUYtHqu69CKS
 */

import { Firestore } from '@google-cloud/firestore';

// Initialize Firestore
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'salfagpt';
const firestore = new Firestore({
  projectId: PROJECT_ID,
});

const COLLECTIONS = {
  CONTEXT_SOURCES: 'context_sources',
  CONVERSATION_CONTEXT: 'conversation_context',
  CONVERSATIONS: 'conversations',
};

async function enableAllAgentSources(agentId) {
  console.log('🎯 Activating all sources for agent:', agentId);
  console.log('📋 Project:', PROJECT_ID);
  
  try {
    // 1. Get all sources assigned to this agent
    console.log('\n1️⃣ Querying assigned sources...');
    const sourcesSnapshot = await firestore
      .collection(COLLECTIONS.CONTEXT_SOURCES)
      .where('assignedToAgents', 'array-contains', agentId)
      .select('__name__') // Only get IDs for performance
      .get();
    
    const allSourceIds = sourcesSnapshot.docs.map(doc => doc.id);
    console.log(`✅ Found ${allSourceIds.length} sources assigned to agent`);
    
    if (allSourceIds.length === 0) {
      console.log('⚠️ No sources found assigned to this agent');
      console.log('💡 Tip: Upload sources via UI first');
      return;
    }
    
    // 2. Save to conversation_context collection
    console.log('\n2️⃣ Activating sources...');
    const contextRef = firestore
      .collection(COLLECTIONS.CONVERSATION_CONTEXT)
      .doc(agentId);
    
    await contextRef.set({
      conversationId: agentId,
      activeContextSourceIds: allSourceIds,
      lastUsedAt: new Date(),
      updatedAt: new Date(),
    }, { merge: true });
    
    console.log(`✅ Activated ${allSourceIds.length} sources in Firestore`);
    
    // 3. Verify
    console.log('\n3️⃣ Verifying activation...');
    const contextDoc = await contextRef.get();
    const contextData = contextDoc.data();
    const activeIds = contextData?.activeContextSourceIds || [];
    
    console.log(`📊 Verification: ${activeIds.length} sources active`);
    
    if (activeIds.length === allSourceIds.length) {
      console.log('✅ SUCCESS! All sources activated');
      console.log('\n🎉 Next steps:');
      console.log('   1. Refresh your browser (Cmd+Shift+R)');
      console.log('   2. Go to Agent M001');
      console.log('   3. Ask your question again');
      console.log('   4. AI should now use all 538 files in context');
    } else {
      console.log('⚠️ Partial success:', activeIds.length, 'of', allSourceIds.length, 'activated');
    }
    
    // 4. Sample some source names
    console.log('\n📄 Sample sources activated:');
    const sampleSnapshot = await firestore
      .collection(COLLECTIONS.CONTEXT_SOURCES)
      .where('assignedToAgents', 'array-contains', agentId)
      .limit(5)
      .get();
    
    sampleSnapshot.docs.forEach(doc => {
      console.log(`   - ${doc.data().name}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('\n💡 Troubleshooting:');
    console.error('   - Ensure GOOGLE_CLOUD_PROJECT is set in .env');
    console.error('   - Run: gcloud auth application-default login');
    console.error('   - Verify agent ID is correct');
    process.exit(1);
  }
}

// Get agent ID from command line
const agentId = process.argv[2];

if (!agentId) {
  console.error('❌ Error: Agent ID required');
  console.error('\nUsage:');
  console.error('  node scripts/enable-all-agent-sources.mjs <agentId>');
  console.error('\nExample:');
  console.error('  node scripts/enable-all-agent-sources.mjs cjn3bC0HrUYtHqu69CKS');
  process.exit(1);
}

// Run activation
enableAllAgentSources(agentId)
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

