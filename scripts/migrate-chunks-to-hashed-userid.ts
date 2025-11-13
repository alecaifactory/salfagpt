/**
 * Migration: Add hashed userId to document_chunks
 * 
 * Problem: Chunks have googleUserId (114671162830729001607) but searches use hashedUserId (usr_xxx)
 * Solution: Add hashedUserId field to all chunks, keep googleUserId for reference
 * 
 * Run: npx tsx scripts/migrate-chunks-to-hashed-userid.ts
 */

import { firestore } from '../src/lib/firestore';
import { hashUserId } from '../src/lib/privacy-utils';

async function migrateChunks() {
  console.log('🔧 Migrating document_chunks to use hashed userId...\n');
  
  try {
    // 1. Get all chunks (in batches)
    console.log('📊 Loading all chunks...');
    const chunksSnapshot = await firestore
      .collection('document_chunks')
      .get();
    
    console.log(`✅ Found ${chunksSnapshot.size} chunks to migrate\n`);
    
    // 2. Process in batches of 500 (Firestore batch limit)
    const BATCH_SIZE = 500;
    let processed = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    
    const docs = chunksSnapshot.docs;
    
    for (let i = 0; i < docs.length; i += BATCH_SIZE) {
      const batch = firestore.batch();
      const batchDocs = docs.slice(i, Math.min(i + BATCH_SIZE, docs.length));
      
      for (const doc of batchDocs) {
        processed++;
        const data = doc.data();
        const googleUserId = data.userId; // Current userId is actually googleUserId
        
        if (!googleUserId) {
          skipped++;
          console.warn(`⏭️  [${processed}] Skipped: No userId found`);
          continue;
        }
        
        // Check if already has hashedUserId (idempotent)
        if (data.hashedUserId) {
          skipped++;
          if (processed % 100 === 0) {
            console.log(`⏭️  [${processed}/${docs.length}] Already migrated`);
          }
          continue;
        }
        
        // Generate hashed userId
        const hashedUserId = hashUserId(googleUserId);
        
        // Update chunk with both IDs
        batch.update(doc.ref, {
          googleUserId: googleUserId, // Keep original as reference
          hashedUserId: hashedUserId, // Add hashed ID for queries
          // Keep userId as googleUserId for now (backward compat)
          // Will switch to hashedUserId in phase 2
          updatedAt: new Date(),
        });
        
        updated++;
        
        if (processed % 100 === 0) {
          console.log(`✅ [${processed}/${docs.length}] Processing... (${updated} updated, ${skipped} skipped)`);
        }
      }
      
      // Commit this batch
      try {
        await batch.commit();
        console.log(`💾 Batch committed: ${batchDocs.length} chunks`);
      } catch (error) {
        errors++;
        console.error(`❌ Batch commit failed:`, error);
      }
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('📊 Migration Summary:');
    console.log('='.repeat(70));
    console.log(`Total chunks processed: ${processed}`);
    console.log(`Chunks updated: ${updated}`);
    console.log(`Chunks skipped (already migrated): ${skipped}`);
    console.log(`Errors encountered: ${errors}`);
    console.log('='.repeat(70));
    
    // Phase 2: Switch userId field to hashedUserId
    console.log('\n🔄 Phase 2: Switching userId field to hashedUserId...');
    console.log('(This makes queries use hashed ID by default)\n');
    
    let phase2Updated = 0;
    let phase2Errors = 0;
    
    for (let i = 0; i < docs.length; i += BATCH_SIZE) {
      const batch = firestore.batch();
      const batchDocs = docs.slice(i, Math.min(i + BATCH_SIZE, docs.length));
      
      for (const doc of batchDocs) {
        const data = doc.data();
        
        if (data.hashedUserId) {
          // Switch userId to hashedUserId
          batch.update(doc.ref, {
            userId: data.hashedUserId, // Now userId = hashed format
            // googleUserId stays as-is (reference)
            // hashedUserId stays as-is (reference)
          });
          phase2Updated++;
        }
      }
      
      try {
        await batch.commit();
        console.log(`💾 Phase 2 batch committed: ${batchDocs.length} chunks (userId switched to hashed)`);
      } catch (error) {
        phase2Errors++;
        console.error(`❌ Phase 2 batch failed:`, error);
      }
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('📊 Phase 2 Summary:');
    console.log('='.repeat(70));
    console.log(`Chunks switched to hashed userId: ${phase2Updated}`);
    console.log(`Errors: ${phase2Errors}`);
    console.log('='.repeat(70));
    
    console.log('\n✅ Migration complete!');
    console.log('\n🎯 Next steps:');
    console.log('  1. Verify chunk queries now work with hashed userId');
    console.log('  2. Test agent search finds chunks correctly');
    console.log('  3. Test similarity values show real percentages (70-90%)');
    
    if (errors > 0 || phase2Errors > 0) {
      console.warn(`\n⚠️  ${errors + phase2Errors} errors occurred. Check logs above.`);
      process.exit(1);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateChunks();

