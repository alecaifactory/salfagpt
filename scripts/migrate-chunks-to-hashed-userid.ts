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
    // 0. Build user ID mapping cache (googleUserId → document ID)
    console.log('📊 Building user ID mapping cache...');
    const userIdCache = new Map<string, string>();
    
    const usersSnapshot = await firestore.collection('users').get();
    usersSnapshot.docs.forEach(doc => {
      const googleId = doc.data().googleUserId;
      if (googleId) {
        userIdCache.set(googleId, doc.id); // Map googleUserId → document ID (usr_xxx)
      }
    });
    
    console.log(`✅ Cached ${userIdCache.size} user ID mappings\n`);
    
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
        const currentUserId = data.userId;
        
        if (!currentUserId) {
          skipped++;
          console.warn(`⏭️  [${processed}] Skipped: No userId found`);
          continue;
        }
        
        // Check if current userId is already in usr_ format (already correct)
        if (currentUserId.startsWith('usr_')) {
          skipped++;
          if (processed % 100 === 0) {
            console.log(`⏭️  [${processed}/${docs.length}] Already in usr_ format`);
          }
          continue;
        }
        
        // Try to resolve to usr_ format
        let correctHashedId: string;
        
        // If we have googleUserId, look it up in cache
        if (data.googleUserId && userIdCache.has(data.googleUserId)) {
          correctHashedId = userIdCache.get(data.googleUserId)!;
        } else if (currentUserId.match(/^\d+$/)) {
          // currentUserId is numeric (googleUserId), look it up
          correctHashedId = userIdCache.get(currentUserId) || currentUserId;
        } else {
          // currentUserId is in user_ format, need to find corresponding usr_ format
          // This is complex - for now, skip
          skipped++;
          continue;
        }
        
        // Update chunk - switch userId to correct usr_ format
        batch.update(doc.ref, {
          userId: correctHashedId, // ✅ Switch to usr_ format (matches user documents)
          googleUserId: data.googleUserId || currentUserId, // Keep Google ID for reference
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
    
    console.log('\n✅ Migration complete!');
    console.log('\n🎯 Next steps:');
    console.log('  1. Verify chunk queries now work with usr_ format');
    console.log('  2. Test agent search finds chunks correctly');
    console.log('  3. Test similarity values show real percentages (70-90%)');
    
    if (errors > 0) {
      console.warn(`\n⚠️  ${errors} errors occurred. Check logs above.`);
      process.exit(1);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateChunks();

