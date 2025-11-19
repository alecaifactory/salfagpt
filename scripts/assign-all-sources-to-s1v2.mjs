#!/usr/bin/env node

/**
 * Assign all user's sources to S1-v2 agent and enable them
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ projectId: 'salfagpt' });
const db = getFirestore();

async function assignAllSourcesToS1v2() {
  const userId = 'usr_uhwqffaqag1wrryd82tw';
  const agentId = 'iQmdg3bMSJ1AdqqlFpye';
  
  console.log('🔧 Assigning ALL sources to S1-v2 agent...\n');
  
  try {
    // Step 1: Get all sources for this user
    console.log('Step 1: Loading all sources for user...');
    const sourcesSnapshot = await db.collection('context_sources')
      .where('userId', '==', userId)
      .get();
    
    if (sourcesSnapshot.empty) {
      console.error('❌ No sources found for user');
      process.exit(1);
    }
    
    const sourceIds = sourcesSnapshot.docs.map(doc => doc.id);
    console.log(`✅ Found ${sourceIds.length} sources\n`);
    
    // Step 2: Create agent_sources assignments
    console.log('Step 2: Creating agent_sources assignments...');
    let assignmentCount = 0;
    let batch = db.batch();
    
    for (const sourceId of sourceIds) {
      const assignmentRef = db.collection('agent_sources').doc();
      batch.set(assignmentRef, {
        agentId,
        sourceId,
        userId,
        assignedAt: FieldValue.serverTimestamp(),
        assignedBy: userId
      });
      assignmentCount++;
      
      // Firestore batch limit is 500 operations
      if (assignmentCount % 400 === 0) {
        await batch.commit();
        console.log(`   Committed batch of ${assignmentCount} assignments...`);
        batch = db.batch(); // Create new batch after commit
      }
    }
    
    // Commit remaining
    if (assignmentCount % 400 !== 0) {
      await batch.commit();
    }
    
    console.log(`✅ Created ${assignmentCount} agent_sources assignments\n`);
    
    // Step 3: Enable all sources on the agent
    console.log('Step 3: Enabling all sources on agent...');
    await db.collection('conversations').doc(agentId).update({
      activeContextSourceIds: sourceIds,
      updatedAt: FieldValue.serverTimestamp()
    });
    
    console.log(`✅ Enabled ${sourceIds.length} sources on S1-v2\n`);
    
    // Step 4: Verify
    console.log('Step 4: Verifying assignment...');
    const agentDoc = await db.collection('conversations').doc(agentId).get();
    const activeIds = agentDoc.data()?.activeContextSourceIds || [];
    
    console.log(`✅ Verification: ${activeIds.length} sources are now active\n`);
    
    console.log('🎉 SUCCESS! All sources assigned and enabled for S1-v2\n');
    console.log('📝 Next steps:');
    console.log('  1. Refresh SalfaGPT in your browser');
    console.log('  2. Select S1-v2 agent');
    console.log('  3. Ask your question again');
    console.log('  4. You should now see RAG working with references!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

assignAllSourcesToS1v2();

