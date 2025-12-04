#!/usr/bin/env node

/**
 * Assign ALL S002-20251118 documents to S2-v2 agent
 * 
 * Creates assignments in agent_sources collection
 * Enables all sources on the agent
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ projectId: 'salfagpt' });
const db = getFirestore();

const S2V2_AGENT_ID = '1lgr33ywq5qed67sqCYi'; // S2-v2
const USER_ID = 'usr_uhwqffaqag1wrryd82tw'; // alec@salfacloud.cl

async function assignAllS002ToS2v2() {
  console.log('🔧 Assigning ALL S002 documents to S2-v2...\n');
  
  try {
    // Step 1: Get all active sources for user
    console.log('Step 1: Loading all active sources...');
    const sourcesSnapshot = await db.collection('context_sources')
      .where('userId', '==', USER_ID)
      .where('status', '==', 'active')
      .get();
    
    if (sourcesSnapshot.empty) {
      console.error('❌ No sources found for user');
      process.exit(1);
    }
    
    console.log(`✅ Found ${sourcesSnapshot.size} active sources\n`);
    
    const sources = sourcesSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      type: doc.data().type
    }));
    
    // Step 2: Create agent_sources assignments
    console.log('Step 2: Creating agent_sources assignments...');
    let assignmentCount = 0;
    let batch = db.batch();
    
    for (const source of sources) {
      const assignmentRef = db.collection('agent_sources').doc();
      batch.set(assignmentRef, {
        agentId: S2V2_AGENT_ID,
        sourceId: source.id,
        userId: USER_ID,
        assignedAt: FieldValue.serverTimestamp(),
        assignedBy: USER_ID,
        sourceName: source.name,
        sourceType: source.type
      });
      assignmentCount++;
      
      // Firestore batch limit is 500 operations
      if (assignmentCount % 400 === 0) {
        await batch.commit();
        console.log(`   ✓ Committed batch (${assignmentCount} assignments so far)...`);
        batch = db.batch();
      }
    }
    
    // Commit remaining
    if (assignmentCount % 400 !== 0) {
      await batch.commit();
    }
    
    console.log(`✅ Created ${assignmentCount} agent_sources assignments\n`);
    
    // Step 3: Enable all sources on the agent
    console.log('Step 3: Enabling sources on S2-v2 agent...');
    const sourceIds = sources.map(s => s.id);
    
    await db.collection('conversations').doc(S2V2_AGENT_ID).update({
      activeContextSourceIds: sourceIds,
      updatedAt: FieldValue.serverTimestamp()
    });
    
    console.log(`✅ Enabled ${sourceIds.length} sources on S2-v2\n`);
    
    // Step 4: Verify assignment
    console.log('Step 4: Verifying assignments...');
    const verifySnapshot = await db.collection('agent_sources')
      .where('agentId', '==', S2V2_AGENT_ID)
      .get();
    
    console.log(`✅ Verification: ${verifySnapshot.size} assignments found\n`);
    
    // Step 5: Show summary
    console.log('═══════════════════════════════════════');
    console.log('✅ ASSIGNMENT COMPLETE\n');
    console.log(`Agent: S2-v2 (${S2V2_AGENT_ID})`);
    console.log(`Sources assigned: ${assignmentCount}`);
    console.log(`Active sources enabled: ${sourceIds.length}`);
    console.log('═══════════════════════════════════════\n');
    
    console.log('📋 Next steps:');
    console.log('1. Process chunks: npm run process:chunks');
    console.log('2. Generate embeddings: npm run process:embeddings');
    console.log('3. Test RAG: npx tsx scripts/test-s2v2-rag.mjs\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

assignAllS002ToS2v2()
  .then(() => {
    console.log('✅ Script complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });




