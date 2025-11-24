#!/usr/bin/env node
/**
 * Migrate Sharing from conversations.sharedWith to agent_shares collection
 * 
 * Problem: We added shares to conversations.sharedWith array
 * But: The UI reads from agent_shares collection
 * 
 * Solution: Create agent_shares documents from sharedWith arrays
 * 
 * Usage: npx tsx scripts/migrate-sharing-to-agent-shares.mjs
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ projectId: 'salfagpt' });
const db = getFirestore();

const AGENT_IDS = [
  'iQmdg3bMSJ1AdqqlFpye', // S1-v2
  '1lgr33ywq5qed67sqCYi', // S2-v2
  'cjn3bC0HrUYtHqu69CKS', // M1-v2
  'vStojK73ZKbjNsEnqANJ'  // M3-v2
];

async function migrateAgentSharing(agentId) {
  console.log(`\n${'═'.repeat(80)}`);
  
  // Get agent document
  const agentDoc = await db.collection('conversations').doc(agentId).get();
  
  if (!agentDoc.exists) {
    console.log(`❌ Agent ${agentId} not found`);
    return { migrated: 0, failed: 0 };
  }

  const agentData = agentDoc.data();
  const agentName = agentData.title || agentId;
  const ownerId = agentData.userId;
  const sharedWith = agentData.sharedWith || [];
  
  console.log(`🔄 Migrating: ${agentName}`);
  console.log(`${'═'.repeat(80)}`);
  console.log(`Owner: ${ownerId}`);
  console.log(`Shares in sharedWith: ${sharedWith.length}\n`);

  if (sharedWith.length === 0) {
    console.log(`⚠️ No shares to migrate\n`);
    return { migrated: 0, failed: 0 };
  }

  let migratedCount = 0;
  let failedCount = 0;

  // Create an agent_shares document for this sharing configuration
  // The agent_shares structure expects a single document with array of targets
  
  try {
    // Check if share document already exists
    const existingShares = await db.collection('agent_shares')
      .where('agentId', '==', agentId)
      .get();

    if (!existingShares.empty) {
      console.log(`ℹ️  Found ${existingShares.size} existing share documents`);
      console.log(`   Deleting old shares before creating new...\n`);
      
      const batch = db.batch();
      existingShares.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    }

    // Create new agent_share document
    const shareDoc = {
      id: db.collection('agent_shares').doc().id, // Generate ID
      agentId: agentId,
      ownerId: ownerId,
      sharedWith: sharedWith, // Copy the entire array
      accessLevel: 'use', // Default (individual entries have their own levels)
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: ownerId
    };

    await db.collection('agent_shares').doc(shareDoc.id).set(shareDoc);

    console.log(`✅ Created agent_share document: ${shareDoc.id}`);
    console.log(`   Contains ${sharedWith.length} shared users\n`);

    migratedCount = sharedWith.length;

  } catch (error) {
    console.error(`❌ Error migrating shares:`, error.message);
    failedCount = sharedWith.length;
  }

  return { migrated: migratedCount, failed: failedCount };
}

async function main() {
  console.log('\n🔄 MIGRATING SHARING DATA\n');
  console.log('From: conversations.sharedWith (array)');
  console.log('To: agent_shares collection (documents)\n');
  console.log('Why: UI reads from agent_shares, not conversations.sharedWith\n');

  const results = [];
  let totalMigrated = 0;
  let totalFailed = 0;

  for (const agentId of AGENT_IDS) {
    const result = await migrateAgentSharing(agentId);
    results.push(result);
    totalMigrated += result.migrated;
    totalFailed += result.failed;
  }

  // Summary
  console.log('═'.repeat(80));
  console.log('📊 MIGRATION SUMMARY');
  console.log('═'.repeat(80));
  console.log();
  console.log(`Total shares migrated:  ${totalMigrated}`);
  console.log(`Failed:                 ${totalFailed}`);
  console.log(`Success rate:           ${totalFailed === 0 ? '100%' : ((totalMigrated/(totalMigrated+totalFailed))*100).toFixed(1) + '%'}`);
  console.log();

  console.log('═'.repeat(80));
  console.log(`\n${totalFailed === 0 ? '✅ MIGRATION COMPLETE!' : '⚠️ SOME MIGRATIONS FAILED'}\n`);
  console.log('═'.repeat(80));
  console.log();

  if (totalFailed === 0) {
    console.log('🎉 Next steps:');
    console.log('  1. Hard refresh browser (Cmd+Shift+R)');
    console.log('  2. Open sharing modal again');
    console.log('  3. Should now see all users with names\n');
  } else {
    console.log('⚠️ Fix errors and re-run\n');
  }

  process.exit(totalFailed === 0 ? 0 : 1);
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});

