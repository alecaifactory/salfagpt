import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { BigQuery } from '@google-cloud/bigquery';

initializeApp({
  credential: applicationDefault(),
  projectId: 'salfagpt'
});

const db = getFirestore();
const bigquery = new BigQuery({ projectId: 'salfagpt' });

// Mapping of old agent IDs to new agent IDs
const AGENT_MIGRATIONS = [
  {
    oldId: 'AjtQZEIMQvFnPRJRjl4y',
    newId: 'iQmdg3bMSJ1AdqqlFpye',
    name: 'S1-v2 (Gestion Bodegas)'
  },
  {
    oldId: 'KfoKcDrb6pMnduAiLlrD',
    newId: '1lgr33ywq5qed67sqCYi',
    name: 'S2-v2 (Maqsa Mantenimiento)'
  },
  {
    oldId: 'cjn3bC0HrUYtHqu69CKS',
    newId: 'EgXezLcu4O3IUqFUJhUZ',
    name: 'M1-v2 (Asistente Legal Territorial RDI)'
  }
];

/**
 * Get sources assigned to an agent
 */
async function getAgentSources(agentId) {
  const snapshot = await db
    .collection('context_sources')
    .where('assignedToAgents', 'array-contains', agentId)
    .get();
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    data: doc.data()
  }));
}

/**
 * Migrate sources from old agent to new agent
 */
async function migrateSources(oldId, newId, agentName) {
  console.log(`\n${'═'.repeat(80)}`);
  console.log(`📦 Migrating: ${agentName}`);
  console.log(`   FROM: ${oldId}`);
  console.log(`   TO:   ${newId}`);
  console.log('─'.repeat(80));
  
  // Step 1: Get sources from old agent
  console.log('\n📚 Step 1: Getting sources from OLD agent...');
  const oldSources = await getAgentSources(oldId);
  console.log(`   Found ${oldSources.length} sources assigned to OLD agent`);
  
  // Step 2: Get sources from new agent (to avoid duplicates)
  console.log('\n📚 Step 2: Getting sources from NEW agent...');
  const newSources = await getAgentSources(newId);
  const newSourceIds = new Set(newSources.map(s => s.id));
  console.log(`   Found ${newSources.length} sources already assigned to NEW agent`);
  
  // Step 3: Identify sources to migrate (in old but not in new)
  const sourcesToMigrate = oldSources.filter(s => !newSourceIds.has(s.id));
  const alreadyInNew = oldSources.filter(s => newSourceIds.has(s.id));
  
  console.log(`\n📊 Analysis:`);
  console.log(`   Total in OLD: ${oldSources.length}`);
  console.log(`   Already in NEW: ${alreadyInNew.length}`);
  console.log(`   Need to migrate: ${sourcesToMigrate.length}`);
  
  if (sourcesToMigrate.length === 0) {
    console.log(`   ✅ All sources already in new agent, no migration needed`);
    return {
      migrated: 0,
      skipped: alreadyInNew.length,
      total: oldSources.length
    };
  }
  
  // Step 4: Migrate sources
  console.log(`\n🔄 Step 3: Migrating ${sourcesToMigrate.length} sources...`);
  
  let migratedCount = 0;
  let errorCount = 0;
  
  for (const source of sourcesToMigrate) {
    try {
      const currentAssignments = source.data.assignedToAgents || [];
      
      // Add new agent ID, keep old one for now (safety)
      const updatedAssignments = [...currentAssignments];
      if (!updatedAssignments.includes(newId)) {
        updatedAssignments.push(newId);
      }
      
      await db.collection('context_sources').doc(source.id).update({
        assignedToAgents: updatedAssignments,
        updatedAt: new Date()
      });
      
      migratedCount++;
      
      if (migratedCount % 10 === 0) {
        process.stdout.write(`   Progress: ${migratedCount}/${sourcesToMigrate.length}\r`);
      }
    } catch (error) {
      console.error(`   ❌ Error migrating ${source.id}: ${error.message}`);
      errorCount++;
    }
  }
  
  console.log(`\n   ✅ Migrated: ${migratedCount} sources`);
  if (errorCount > 0) {
    console.log(`   ❌ Errors: ${errorCount} sources`);
  }
  
  // Step 5: Verify migration
  console.log(`\n✔️  Step 4: Verifying migration...`);
  const verifyNew = await getAgentSources(newId);
  console.log(`   NEW agent now has: ${verifyNew.length} sources (was ${newSources.length})`);
  console.log(`   Added: ${verifyNew.length - newSources.length} sources`);
  
  return {
    migrated: migratedCount,
    skipped: alreadyInNew.length,
    errors: errorCount,
    total: oldSources.length,
    finalCount: verifyNew.length
  };
}

/**
 * Main function
 */
async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║    Migrate Sources from OLD Agent IDs to NEW Agent IDs      ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  console.log('📋 Migration Plan:\n');
  AGENT_MIGRATIONS.forEach((m, idx) => {
    console.log(`   ${idx + 1}. ${m.name}`);
    console.log(`      ${m.oldId} → ${m.newId}\n`);
  });
  
  const results = [];
  
  // Process each migration
  for (const migration of AGENT_MIGRATIONS) {
    const result = await migrateSources(
      migration.oldId,
      migration.newId,
      migration.name
    );
    
    results.push({
      ...migration,
      ...result
    });
  }
  
  // Final summary
  console.log('\n\n╔══════════════════════════════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                                    MIGRATION SUMMARY                                                 ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════════════════════════════╝\n');
  
  console.log('┌───────────────────────────────────────┬──────────┬───────────┬─────────┬─────────┬──────────────┐');
  console.log('│ Agent Name                            │ Old Srcs │ Migrated  │ Skipped │ Errors  │ Final Count  │');
  console.log('├───────────────────────────────────────┼──────────┼───────────┼─────────┼─────────┼──────────────┤');
  
  results.forEach(r => {
    const name = r.name.padEnd(37).substring(0, 37);
    const total = String(r.total || 0).padStart(8);
    const migrated = String(r.migrated || 0).padStart(9);
    const skipped = String(r.skipped || 0).padStart(7);
    const errors = String(r.errors || 0).padStart(7);
    const final = String(r.finalCount || 0).padStart(12);
    
    console.log(`│ ${name} │ ${total} │ ${migrated} │ ${skipped} │ ${errors} │ ${final} │`);
  });
  
  console.log('└───────────────────────────────────────┴──────────┴───────────┴─────────┴─────────┴──────────────┘\n');
  
  const totalMigrated = results.reduce((sum, r) => sum + (r.migrated || 0), 0);
  const totalErrors = results.reduce((sum, r) => sum + (r.errors || 0), 0);
  
  console.log(`📊 TOTAL RESULTS:`);
  console.log(`   ✅ Successfully migrated: ${totalMigrated} sources`);
  console.log(`   ⏭️  Already in new agent: ${results.reduce((sum, r) => sum + (r.skipped || 0), 0)} sources`);
  if (totalErrors > 0) {
    console.log(`   ❌ Errors: ${totalErrors} sources`);
  }
  
  console.log(`\n💡 NEXT STEPS:\n`);
  console.log(`   1. The sources are now assigned to BOTH old and new agent IDs (safe)`);
  console.log(`   2. BigQuery chunks remain unchanged (linked by source_id, not agent_id)`);
  console.log(`   3. GCS files remain unchanged (linked by source_id in metadata)`);
  console.log(`   4. You can now use the new agent IDs and all documents will be available`);
  console.log(`\n   Optional cleanup (after confirming everything works):`);
  console.log(`   - Remove old agent IDs from assignedToAgents arrays`);
  console.log(`   - Archive or delete old agent documents in Firestore\n`);
  
  console.log('✨ Done!\n');
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

