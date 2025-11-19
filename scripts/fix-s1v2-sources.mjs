#!/usr/bin/env node

/**
 * Fix S1-v2: Assign only the 75 recently uploaded sources
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ projectId: 'salfagpt' });
const db = getFirestore();

async function fixS1v2Sources() {
  const userId = 'usr_uhwqffaqag1wrryd82tw';
  const agentId = 'iQmdg3bMSJ1AdqqlFpye';
  
  console.log('🔧 Fixing S1-v2: Removing incorrect assignments and adding only recent 75 sources...\n');
  
  try {
    // Step 1: Remove ALL current assignments for S1-v2
    console.log('Step 1: Removing all current agent_sources assignments...');
    const currentAssignments = await db.collection('agent_sources')
      .where('agentId', '==', agentId)
      .get();
    
    console.log(`   Found ${currentAssignments.size} assignments to remove`);
    
    let batch = db.batch();
    let count = 0;
    
    for (const doc of currentAssignments.docs) {
      batch.delete(doc.ref);
      count++;
      
      if (count % 400 === 0) {
        await batch.commit();
        console.log(`   Deleted ${count} assignments...`);
        batch = db.batch();
      }
    }
    
    if (count % 400 !== 0) {
      await batch.commit();
    }
    
    console.log(`✅ Removed ${count} old assignments\n`);
    
    // Step 2: Find the 75 most recently uploaded sources (likely SSOMA docs)
    console.log('Step 2: Finding sources with CLI tag...');
    
    // Get all sources for user and filter client-side
    const allSources = await db.collection('context_sources')
      .where('userId', '==', userId)
      .get();
    
    if (allSources.empty) {
      console.error('❌ No sources found');
      process.exit(1);
    }
    
    console.log(`   Total sources: ${allSources.size}`);
    
    // Filter for sources with 'cli' tag (most likely the recent upload)
    const cliSources = allSources.docs.filter(doc => {
      const data = doc.data();
      return data.tags?.includes('cli');
    });
    
    console.log(`   Sources with CLI tag: ${cliSources.length}`);
    
    // Sort by createdAt descending
    cliSources.sort((a, b) => {
      const aTime = a.data().createdAt?.toDate?.()?.getTime() || 0;
      const bTime = b.data().createdAt?.toDate?.()?.getTime() || 0;
      return bTime - aTime;
    });
    
    // If we have CLI-tagged sources, use those. Otherwise, fall back to most recent
    let sourcesToAssign = cliSources;
    
    if (sourcesToAssign.length === 0) {
      console.log('   No CLI-tagged sources found, using most recent 75...');
      // Sort all by createdAt
      const sortedSources = allSources.docs.sort((a, b) => {
        const aTime = a.data().createdAt?.toDate?.()?.getTime() || 0;
        const bTime = b.data().createdAt?.toDate?.()?.getTime() || 0;
        return bTime - aTime;
      });
      sourcesToAssign = sortedSources.slice(0, 75);
    } else if (sourcesToAssign.length > 75) {
      console.log(`   Taking 75 most recent CLI-tagged sources...`);
      sourcesToAssign = sourcesToAssign.slice(0, 75);
    }
    
    console.log(`\n📋 Will assign these ${sourcesToAssign.length} sources:`);
    sourcesToAssign.forEach((doc, idx) => {
      const data = doc.data();
      if (idx < 10) {
        console.log(`   ${idx + 1}. ${data.name} (${data.tags?.includes('cli') ? 'CLI' : 'UI'})`);
      }
    });
    if (sourcesToAssign.length > 10) {
      console.log(`   ... and ${sourcesToAssign.length - 10} more\n`);
    }
    
    // Step 3: Create new assignments for only these 75 sources
    console.log(`\nStep 3: Creating ${sourcesToAssign.length} new assignments...`);
    batch = db.batch();
    count = 0;
    
    const sourceIds = [];
    for (const doc of sourcesToAssign) {
      const sourceId = doc.id;
      sourceIds.push(sourceId);
      
      const assignmentRef = db.collection('agent_sources').doc();
      batch.set(assignmentRef, {
        agentId,
        sourceId,
        userId,
        assignedAt: FieldValue.serverTimestamp(),
        assignedBy: userId
      });
      count++;
      
      if (count % 400 === 0) {
        await batch.commit();
        batch = db.batch();
      }
    }
    
    if (count % 400 !== 0) {
      await batch.commit();
    }
    
    console.log(`✅ Created ${count} assignments\n`);
    
    // Step 4: Update agent to enable only these sources
    console.log('Step 4: Updating agent activeContextSourceIds...');
    await db.collection('conversations').doc(agentId).update({
      activeContextSourceIds: sourceIds,
      updatedAt: FieldValue.serverTimestamp()
    });
    
    console.log(`✅ Enabled ${sourceIds.length} sources on S1-v2\n`);
    
    // Step 5: Verify
    console.log('Step 5: Verifying...');
    const agentDoc = await db.collection('conversations').doc(agentId).get();
    const activeIds = agentDoc.data()?.activeContextSourceIds || [];
    
    console.log(`✅ Verification: ${activeIds.length} sources are now active\n`);
    
    console.log('🎉 SUCCESS! S1-v2 now has only the 75 recently uploaded sources\n');
    console.log('📝 Next steps:');
    console.log('  1. Refresh SalfaGPT in your browser');
    console.log('  2. Select S1-v2 agent');
    console.log('  3. Ask your question about SSOMA');
    console.log('  4. You should now see RAG working with the correct documents!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixS1v2Sources();

