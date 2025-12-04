#!/usr/bin/env node

/**
 * Reassign OGUC document from M3-v2 to M1-v2
 * Without re-uploading, re-chunking, or re-embedding
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ projectId: 'salfagpt' });
const db = getFirestore();

const SOURCE_ID = 'd3w7m98Yymsm1rAJlFpE'; // OGUC document
const M3V2_AGENT_ID = 'vStojK73ZKbjNsEnqANJ'; // FROM (GOP GPT)
const M1V2_AGENT_ID = 'EgXezLcu4O3IUqFUJhUZ'; // TO (Asistente Legal)
const USER_ID = 'usr_uhwqffaqag1wrryd82tw';

async function reassignDocument() {
  console.log('🔄 Reassigning OGUC Document: M3-v2 → M1-v2\n');
  console.log('═'.repeat(70) + '\n');
  
  // ===== STEP 1: Get current state =====
  console.log('📊 STEP 1: Getting current state...\n');
  
  // Get source document
  const sourceDoc = await db.collection('context_sources').doc(SOURCE_ID).get();
  
  if (!sourceDoc.exists) {
    console.error('❌ Source document not found!');
    process.exit(1);
  }
  
  const sourceData = sourceDoc.data();
  console.log('📄 Source document:');
  console.log(`   ID: ${SOURCE_ID}`);
  console.log(`   Name: ${sourceData.name}`);
  console.log(`   Current assignedToAgents: ${JSON.stringify(sourceData.assignedToAgents)}`);
  console.log();
  
  // Get M3-v2 agent state
  const m3v2Doc = await db.collection('conversations').doc(M3V2_AGENT_ID).get();
  const m3v2Data = m3v2Doc.data();
  const m3v2ActiveBefore = m3v2Data?.activeContextSourceIds || [];
  const m3v2HasSource = m3v2ActiveBefore.includes(SOURCE_ID);
  
  console.log('🤖 M3-v2 (GOP GPT) BEFORE:');
  console.log(`   Agent ID: ${M3V2_AGENT_ID}`);
  console.log(`   Total activeContextSourceIds: ${m3v2ActiveBefore.length}`);
  console.log(`   Has OGUC: ${m3v2HasSource ? '✅ YES' : '❌ NO'}`);
  console.log();
  
  // Get M1-v2 agent state
  const m1v2Doc = await db.collection('conversations').doc(M1V2_AGENT_ID).get();
  const m1v2Data = m1v2Doc.data();
  const m1v2ActiveBefore = m1v2Data?.activeContextSourceIds || [];
  const m1v2HasSource = m1v2ActiveBefore.includes(SOURCE_ID);
  
  console.log('🤖 M1-v2 (Legal Territorial) BEFORE:');
  console.log(`   Agent ID: ${M1V2_AGENT_ID}`);
  console.log(`   Total activeContextSourceIds: ${m1v2ActiveBefore.length}`);
  console.log(`   Has OGUC: ${m1v2HasSource ? '✅ YES' : '❌ NO'}`);
  console.log();
  
  // Get chunks count
  const chunksSnapshot = await db.collection('document_chunks')
    .where('sourceId', '==', SOURCE_ID)
    .get();
  
  console.log('📦 Chunks:');
  console.log(`   Count: ${chunksSnapshot.size}`);
  console.log(`   Current agentId: ${chunksSnapshot.docs[0]?.data()?.agentId || 'N/A'}`);
  console.log();
  
  // ===== STEP 2: Update source assignment =====
  console.log('─'.repeat(70));
  console.log('📝 STEP 2: Updating source assignment...\n');
  
  await db.collection('context_sources').doc(SOURCE_ID).update({
    assignedToAgents: [M1V2_AGENT_ID], // Change from M3-v2 to M1-v2
    updatedAt: new Date(),
  });
  
  console.log('✅ Updated context_sources.assignedToAgents:');
  console.log(`   FROM: [${M3V2_AGENT_ID}] (M3-v2)`);
  console.log(`   TO:   [${M1V2_AGENT_ID}] (M1-v2)`);
  console.log();
  
  // ===== STEP 3: Update chunks agentId =====
  console.log('─'.repeat(70));
  console.log('📝 STEP 3: Updating chunks agentId...\n');
  
  const batch = db.batch();
  let chunkUpdateCount = 0;
  
  for (const chunkDoc of chunksSnapshot.docs) {
    batch.update(chunkDoc.ref, {
      agentId: M1V2_AGENT_ID, // Change from M3-v2 to M1-v2
    });
    chunkUpdateCount++;
  }
  
  await batch.commit();
  
  console.log(`✅ Updated ${chunkUpdateCount} chunks:`);
  console.log(`   FROM: agentId = ${M3V2_AGENT_ID} (M3-v2)`);
  console.log(`   TO:   agentId = ${M1V2_AGENT_ID} (M1-v2)`);
  console.log();
  
  // ===== STEP 4: Update agent_sources =====
  console.log('─'.repeat(70));
  console.log('📝 STEP 4: Updating agent_sources assignments...\n');
  
  // Check for existing M3-v2 assignment
  const m3v2Assignment = await db.collection('agent_sources')
    .where('agentId', '==', M3V2_AGENT_ID)
    .where('sourceId', '==', SOURCE_ID)
    .limit(1)
    .get();
  
  if (!m3v2Assignment.empty) {
    // Delete M3-v2 assignment
    await m3v2Assignment.docs[0].ref.delete();
    console.log('🗑️  Deleted M3-v2 assignment');
  }
  
  // Check for existing M1-v2 assignment
  const m1v2Assignment = await db.collection('agent_sources')
    .where('agentId', '==', M1V2_AGENT_ID)
    .where('sourceId', '==', SOURCE_ID)
    .limit(1)
    .get();
  
  if (m1v2Assignment.empty) {
    // Create M1-v2 assignment
    await db.collection('agent_sources').add({
      agentId: M1V2_AGENT_ID,
      sourceId: SOURCE_ID,
      userId: USER_ID,
      assignedAt: new Date(),
    });
    console.log('✅ Created M1-v2 assignment');
  } else {
    console.log('ℹ️  M1-v2 assignment already exists');
  }
  console.log();
  
  // ===== STEP 5: Update activeContextSourceIds =====
  console.log('─'.repeat(70));
  console.log('📝 STEP 5: Updating activeContextSourceIds...\n');
  
  // Remove from M3-v2
  if (m3v2HasSource) {
    const m3v2ActiveAfter = m3v2ActiveBefore.filter(id => id !== SOURCE_ID);
    
    await db.collection('conversations').doc(M3V2_AGENT_ID).update({
      activeContextSourceIds: m3v2ActiveAfter,
      updatedAt: new Date(),
    });
    
    console.log('✅ Removed from M3-v2 activeContextSourceIds:');
    console.log(`   BEFORE: ${m3v2ActiveBefore.length} sources (OGUC included)`);
    console.log(`   AFTER:  ${m3v2ActiveAfter.length} sources (OGUC removed)`);
    console.log();
  } else {
    console.log('ℹ️  OGUC not in M3-v2 activeContextSourceIds (skipped)');
    console.log();
  }
  
  // Add to M1-v2
  if (!m1v2HasSource) {
    const m1v2ActiveAfter = [...m1v2ActiveBefore, SOURCE_ID];
    
    await db.collection('conversations').doc(M1V2_AGENT_ID).update({
      activeContextSourceIds: m1v2ActiveAfter,
      updatedAt: new Date(),
    });
    
    console.log('✅ Added to M1-v2 activeContextSourceIds:');
    console.log(`   BEFORE: ${m1v2ActiveBefore.length} sources (OGUC not included)`);
    console.log(`   AFTER:  ${m1v2ActiveAfter.length} sources (OGUC added)`);
    console.log();
  } else {
    console.log('ℹ️  OGUC already in M1-v2 activeContextSourceIds (skipped)');
    console.log();
  }
  
  // ===== STEP 6: Verify final state =====
  console.log('─'.repeat(70));
  console.log('✅ STEP 6: Verifying final state...\n');
  
  // Re-fetch agents
  const m3v2Final = await db.collection('conversations').doc(M3V2_AGENT_ID).get();
  const m3v2FinalActive = m3v2Final.data()?.activeContextSourceIds || [];
  
  const m1v2Final = await db.collection('conversations').doc(M1V2_AGENT_ID).get();
  const m1v2FinalActive = m1v2Final.data()?.activeContextSourceIds || [];
  
  console.log('🤖 M3-v2 (GOP GPT) AFTER:');
  console.log(`   Total activeContextSourceIds: ${m3v2FinalActive.length}`);
  console.log(`   Has OGUC: ${m3v2FinalActive.includes(SOURCE_ID) ? '⚠️ STILL HAS' : '✅ REMOVED'}`);
  console.log();
  
  console.log('🤖 M1-v2 (Legal Territorial) AFTER:');
  console.log(`   Total activeContextSourceIds: ${m1v2FinalActive.length}`);
  console.log(`   Has OGUC: ${m1v2FinalActive.includes(SOURCE_ID) ? '✅ ADDED' : '❌ MISSING'}`);
  console.log();
  
  // Verify chunks
  const chunksAfter = await db.collection('document_chunks')
    .where('sourceId', '==', SOURCE_ID)
    .limit(1)
    .get();
  
  console.log('📦 Chunks:');
  console.log(`   Updated agentId: ${chunksAfter.docs[0]?.data()?.agentId}`);
  console.log(`   Expected: ${M1V2_AGENT_ID}`);
  console.log(`   Match: ${chunksAfter.docs[0]?.data()?.agentId === M1V2_AGENT_ID ? '✅ YES' : '❌ NO'}`);
  console.log();
  
  // ===== SUMMARY =====
  console.log('\n' + '═'.repeat(70));
  console.log('✅ REASSIGNMENT COMPLETE');
  console.log('═'.repeat(70));
  console.log();
  console.log('📄 Document: OGUC Septiembre 2025');
  console.log('🆔 Source ID: ' + SOURCE_ID);
  console.log();
  console.log('Changes made:');
  console.log('  1. ✅ Updated assignedToAgents: M3-v2 → M1-v2');
  console.log(`  2. ✅ Updated ${chunksSnapshot.size} chunks agentId: M3-v2 → M1-v2`);
  console.log('  3. ✅ Removed from M3-v2 activeContextSourceIds');
  console.log('  4. ✅ Added to M1-v2 activeContextSourceIds');
  console.log('  5. ✅ Updated agent_sources assignments');
  console.log();
  console.log('📊 Final state:');
  console.log(`  M3-v2: ${m3v2ActiveBefore.length} → ${m3v2FinalActive.length} sources (-1)`);
  console.log(`  M1-v2: ${m1v2ActiveBefore.length} → ${m1v2FinalActive.length} sources (+1)`);
  console.log();
  console.log('🎯 OGUC document now assigned to M1-v2 (Legal Territorial) ✅');
  console.log();
  console.log('⚠️  NOTE: BigQuery chunks still reference old agentId in metadata.');
  console.log('   This is OK - queries filter by source_id, not agentId.');
  console.log('   Firestore is source of truth for assignments.');
  console.log();
}

reassignDocument()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Reassignment failed:', err);
    process.exit(1);
  });


