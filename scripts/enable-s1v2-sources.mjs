#!/usr/bin/env node

/**
 * Script to enable all context sources for S1-v2 agent
 * This fixes the issue where S1-v2 is giving generic responses
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin with application default credentials
initializeApp({
  projectId: 'salfagpt'
});

const db = getFirestore();

async function enableAllSourcesForS1v2() {
  console.log('🔧 Enabling all context sources for S1-v2 agent...\n');

  try {
    // Step 1: Find S1-v2 agent
    console.log('Step 1: Finding S1-v2 agent...');
    const agentsSnapshot = await db.collection('conversations')
      .where('title', '==', 'S1-v2')
      .limit(1)
      .get();

    if (agentsSnapshot.empty) {
      console.error('❌ Error: S1-v2 agent not found');
      process.exit(1);
    }

    const agentDoc = agentsSnapshot.docs[0];
    const agentId = agentDoc.id;
    const agentData = agentDoc.data();

    console.log(`✅ Found S1-v2 agent: ${agentId}`);
    console.log(`   Owner: ${agentData.userId}\n`);

    // Step 2: Get all assigned sources
    console.log('Step 2: Getting all assigned sources...');
    const assignmentsSnapshot = await db.collection('agent_sources')
      .where('agentId', '==', agentId)
      .get();

    if (assignmentsSnapshot.empty) {
      console.error('❌ No sources assigned to S1-v2');
      console.log('   Please assign sources first via the UI');
      process.exit(1);
    }

    const assignedSourceIds = assignmentsSnapshot.docs.map(doc => doc.data().sourceId);
    console.log(`✅ Found ${assignedSourceIds.length} assigned sources:`);
    
    // Get source names
    for (const sourceId of assignedSourceIds.slice(0, 10)) {
      const sourceDoc = await db.collection('context_sources').doc(sourceId).get();
      if (sourceDoc.exists) {
        const sourceName = sourceDoc.data()?.name || 'Unknown';
        console.log(`   - ${sourceName} (${sourceId})`);
      }
    }
    if (assignedSourceIds.length > 10) {
      console.log(`   ... and ${assignedSourceIds.length - 10} more`);
    }
    console.log();

    // Step 3: Enable all sources
    console.log('Step 3: Enabling all sources...');
    await db.collection('conversations').doc(agentId).update({
      activeContextSourceIds: assignedSourceIds,
      updatedAt: new Date()
    });

    console.log(`✅ Successfully enabled ${assignedSourceIds.length} sources for S1-v2!\n`);

    // Step 4: Verify RAG indexing
    console.log('Step 4: Checking RAG indexing status...');
    for (const sourceId of assignedSourceIds.slice(0, 5)) {
      const sourceDoc = await db.collection('context_sources').doc(sourceId).get();
      if (sourceDoc.exists) {
        const sourceData = sourceDoc.data();
        const hasData = !!sourceData.extractedData;
        const ragEnabled = sourceData.ragEnabled || false;
        const chunkCount = sourceData.ragMetadata?.chunkCount || 0;
        
        console.log(`   - ${sourceData.name}:`);
        console.log(`     • Extracted: ${hasData ? '✅ Yes' : '❌ No'}`);
        console.log(`     • RAG Indexed: ${ragEnabled ? '✅ Yes' : '❌ No'}`);
        if (ragEnabled) {
          console.log(`     • Chunks: ${chunkCount}`);
        }
      }
    }

    console.log('\n📝 Next steps:');
    console.log('  1. Refresh the SalfaGPT page in your browser');
    console.log('  2. Select S1-v2 agent');
    console.log('  3. Ask your question again');
    console.log('  4. Check if RAG is now working (look for references)');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

enableAllSourcesForS1v2();

