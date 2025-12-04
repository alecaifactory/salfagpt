#!/usr/bin/env node

/**
 * Remove all copies of DTO-47_05-JUN-1992.pdf from M1-v2 context
 * Keeps the files in Firestore but removes from active context
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({ projectId: 'salfagpt' });
const db = getFirestore();

const M1V2_AGENT_ID = 'EgXezLcu4O3IUqFUJhUZ';
const DTO47_IDS = [
  '8u9hLCXgHqk5LHTEEZ2c',  // Copy 1: 66k chars, 20 chunks
  'HL16CowpioV8l2XkViu2',  // Copy 2: 49k chars, 16 chunks (shared with 99 agents)
  'MURxISKQRKVNwgMtImIa'   // Copy 3: 100k chars, 81 chunks (most recent)
];

async function removeDTO47() {
  console.log('🗑️  Removing DTO-47_05-JUN-1992.pdf from M1-v2 Context\n');
  console.log('═'.repeat(70) + '\n');
  
  // Get current M1-v2 state
  const agentDoc = await db.collection('conversations').doc(M1V2_AGENT_ID).get();
  const agentData = agentDoc.data();
  const activeIdsBefore = agentData?.activeContextSourceIds || [];
  
  console.log('📊 M1-v2 BEFORE:');
  console.log(`   Total activeContextSourceIds: ${activeIdsBefore.length}`);
  
  // Check which copies are active
  const activeCopies = DTO47_IDS.filter(id => activeIdsBefore.includes(id));
  console.log(`   DTO-47 copies active: ${activeCopies.length}/3`);
  activeCopies.forEach(id => {
    const index = DTO47_IDS.indexOf(id);
    console.log(`      - Copy ${index + 1}: ${id} ✅`);
  });
  console.log();
  
  if (activeCopies.length === 0) {
    console.log('ℹ️  No DTO-47 copies are active in M1-v2');
    console.log('   Nothing to remove.');
    process.exit(0);
  }
  
  // Remove all DTO-47 IDs from activeContextSourceIds
  console.log('─'.repeat(70));
  console.log('📝 Removing from activeContextSourceIds...\n');
  
  const activeIdsAfter = activeIdsBefore.filter(id => !DTO47_IDS.includes(id));
  const removedCount = activeIdsBefore.length - activeIdsAfter.length;
  
  await db.collection('conversations').doc(M1V2_AGENT_ID).update({
    activeContextSourceIds: activeIdsAfter,
    updatedAt: new Date(),
  });
  
  console.log('✅ Updated activeContextSourceIds:');
  console.log(`   BEFORE: ${activeIdsBefore.length} sources`);
  console.log(`   AFTER:  ${activeIdsAfter.length} sources`);
  console.log(`   REMOVED: ${removedCount} DTO-47 copies`);
  console.log();
  
  // Update assignedToAgents field (remove M1-v2 from assignment)
  console.log('─'.repeat(70));
  console.log('📝 Updating source assignments...\n');
  
  for (const sourceId of DTO47_IDS) {
    const sourceDoc = await db.collection('context_sources').doc(sourceId).get();
    
    if (!sourceDoc.exists) {
      console.log(`   ⏭️  Skip ${sourceId} (not found)`);
      continue;
    }
    
    const sourceData = sourceDoc.data();
    const assignedAgents = sourceData?.assignedToAgents || [];
    
    // Check if M1-v2 is assigned
    if (!assignedAgents.includes(M1V2_AGENT_ID)) {
      console.log(`   ⏭️  Skip ${sourceId} (M1-v2 not assigned)`);
      continue;
    }
    
    // Remove M1-v2 from assignment
    const newAssignment = assignedAgents.filter(id => id !== M1V2_AGENT_ID);
    
    await db.collection('context_sources').doc(sourceId).update({
      assignedToAgents: newAssignment,
      updatedAt: new Date(),
    });
    
    const copyNum = DTO47_IDS.indexOf(sourceId) + 1;
    console.log(`   ✅ Copy ${copyNum} (${sourceId}):`);
    console.log(`      Assigned agents: ${assignedAgents.length} → ${newAssignment.length}`);
    console.log(`      M1-v2 removed: ✅`);
  }
  console.log();
  
  // Verify final state
  console.log('─'.repeat(70));
  console.log('✅ Verifying final state...\n');
  
  const agentFinal = await db.collection('conversations').doc(M1V2_AGENT_ID).get();
  const finalActiveIds = agentFinal.data()?.activeContextSourceIds || [];
  
  const stillActive = DTO47_IDS.filter(id => finalActiveIds.includes(id));
  
  console.log('🤖 M1-v2 AFTER:');
  console.log(`   Total activeContextSourceIds: ${finalActiveIds.length}`);
  console.log(`   DTO-47 copies active: ${stillActive.length}/3`);
  
  if (stillActive.length === 0) {
    console.log('   ✅ All DTO-47 copies removed successfully!');
  } else {
    console.log('   ⚠️  Some copies still active:');
    stillActive.forEach(id => console.log(`      - ${id}`));
  }
  console.log();
  
  // Summary
  console.log('\n' + '═'.repeat(70));
  console.log('✅ REMOVAL COMPLETE');
  console.log('═'.repeat(70));
  console.log();
  console.log('📄 File: DTO-47_05-JUN-1992.pdf');
  console.log(`🗑️  Copies removed: ${removedCount}`);
  console.log();
  console.log('Changes:');
  console.log(`  1. ✅ Removed from activeContextSourceIds (${removedCount} copies)`);
  console.log('  2. ✅ Removed M1-v2 from assignedToAgents (3 sources)');
  console.log();
  console.log('📊 M1-v2 sources:');
  console.log(`  BEFORE: ${activeIdsBefore.length} sources`);
  console.log(`  AFTER:  ${activeIdsAfter.length} sources`);
  console.log(`  CHANGE: -${removedCount} (DTO-47 removed)`);
  console.log();
  console.log('🎯 DTO-47 document no longer accessible in M1-v2 queries ✅');
  console.log();
  console.log('ℹ️  Note: Files remain in Firestore (not deleted)');
  console.log('   Only removed from M1-v2 active context');
  console.log();
}

removeDTO47()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Removal failed:', err);
    process.exit(1);
  });


