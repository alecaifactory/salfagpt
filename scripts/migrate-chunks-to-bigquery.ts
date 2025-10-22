/**
 * Migration Script: Sync Existing Firestore Chunks to BigQuery
 * 
 * This script migrates all existing document_chunks from Firestore to BigQuery
 * for optimized vector search.
 * 
 * Usage:
 *   npx tsx scripts/migrate-chunks-to-bigquery.ts [--dry-run] [--batch-size=100]
 * 
 * Options:
 *   --dry-run: Preview what would be migrated without actually doing it
 *   --batch-size: Number of chunks to process at once (default: 100)
 */

import { firestore } from '../src/lib/firestore';
import { syncChunksBatchToBigQuery, getBigQueryStats } from '../src/lib/bigquery-vector-search';

interface MigrationStats {
  totalChunks: number;
  totalUsers: number;
  totalSources: number;
  migratedChunks: number;
  skippedChunks: number;
  failedChunks: number;
  durationMs: number;
}

async function migrateChunksToBigQuery(
  options: {
    dryRun?: boolean;
    batchSize?: number;
  } = {}
): Promise<MigrationStats> {
  const { dryRun = false, batchSize = 100 } = options;
  
  console.log('🔄 BigQuery Migration Script');
  console.log('=' + '='.repeat(50));
  console.log(`Mode: ${dryRun ? 'DRY RUN (preview only)' : 'LIVE MIGRATION'}`);
  console.log(`Batch size: ${batchSize}`);
  console.log('');

  const startTime = Date.now();
  const stats: MigrationStats = {
    totalChunks: 0,
    totalUsers: 0,
    totalSources: 0,
    migratedChunks: 0,
    skippedChunks: 0,
    failedChunks: 0,
    durationMs: 0
  };

  try {
    // 1. Get current BigQuery state
    console.log('📊 Step 1: Checking BigQuery current state...');
    const bqStats = await getBigQueryStats();
    console.log(`  Current BigQuery state:`);
    console.log(`    Total chunks: ${bqStats.totalChunks}`);
    console.log(`    Total users: ${bqStats.totalUsers}`);
    console.log(`    Total sources: ${bqStats.totalSources}`);
    console.log(`    Table size: ${bqStats.tableSizeMB} MB`);
    console.log('');

    // 2. Get existing chunks from BigQuery to avoid duplicates
    console.log('📋 Step 2: Fetching existing chunk IDs from BigQuery...');
    const existingChunkIds = new Set<string>();
    
    // We'll build chunk IDs as sourceId_chunk_chunkIndex to match our insertion pattern
    // For now, assume we're starting fresh or will use upsert logic
    console.log('  (Skipping duplicate check for first migration)');
    console.log('');

    // 3. Fetch all chunks from Firestore
    console.log('📥 Step 3: Fetching chunks from Firestore...');
    const chunksSnapshot = await firestore
      .collection('document_chunks')
      .get();

    stats.totalChunks = chunksSnapshot.size;
    console.log(`  Found ${stats.totalChunks} chunks in Firestore`);

    if (stats.totalChunks === 0) {
      console.log('  ⚠️ No chunks to migrate!');
      return stats;
    }

    // Group chunks by source for batch processing
    const chunksBySource = new Map<string, any[]>();
    
    for (const doc of chunksSnapshot.docs) {
      const data = doc.data();
      const sourceId = data.sourceId || data.documentId;
      
      if (!sourceId) {
        console.warn(`  ⚠️ Skipping chunk ${doc.id} - no sourceId`);
        stats.skippedChunks++;
        continue;
      }

      if (!chunksBySource.has(sourceId)) {
        chunksBySource.set(sourceId, []);
      }

      chunksBySource.get(sourceId)!.push({
        id: doc.id,
        sourceId,
        userId: data.userId,
        chunkIndex: data.chunkIndex,
        text: data.text || data.chunkText || '',
        embedding: data.embedding,
        metadata: data.metadata || {}
      });
    }

    stats.totalSources = chunksBySource.size;
    stats.totalUsers = new Set([...chunksBySource.values()].flat().map(c => c.userId)).size;

    console.log(`  Grouped into ${stats.totalSources} sources`);
    console.log(`  From ${stats.totalUsers} users`);
    console.log('');

    if (dryRun) {
      console.log('🔍 DRY RUN - Preview of what would be migrated:');
      console.log('');
      
      let previewCount = 0;
      for (const [sourceId, chunks] of chunksBySource) {
        if (previewCount >= 5) {
          console.log(`  ... and ${chunksBySource.size - previewCount} more sources`);
          break;
        }
        
        console.log(`  Source: ${sourceId}`);
        console.log(`    Chunks: ${chunks.length}`);
        console.log(`    User: ${chunks[0].userId}`);
        console.log(`    Sample text: ${chunks[0].text.substring(0, 100)}...`);
        console.log('');
        
        previewCount++;
      }

      stats.durationMs = Date.now() - startTime;
      console.log('✅ Dry run complete!');
      console.log('  Run without --dry-run to perform actual migration');
      return stats;
    }

    // 4. Migrate in batches
    console.log('📤 Step 4: Migrating chunks to BigQuery...');
    console.log('');

    let processedSources = 0;
    
    for (const [sourceId, chunks] of chunksBySource) {
      processedSources++;
      console.log(`  [${processedSources}/${stats.totalSources}] Migrating source: ${sourceId}`);
      console.log(`    Chunks: ${chunks.length}`);

      // Process in batches
      for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize);
        
        try {
          await syncChunksBatchToBigQuery(batch);
          stats.migratedChunks += batch.length;
          
          const progress = ((stats.migratedChunks / stats.totalChunks) * 100).toFixed(1);
          console.log(`    ✓ Batch ${Math.floor(i / batchSize) + 1}: ${stats.migratedChunks}/${stats.totalChunks} chunks (${progress}%)`);
        } catch (error) {
          console.error(`    ✗ Batch failed:`, error);
          stats.failedChunks += batch.length;
        }

        // Small delay to avoid rate limits
        if (i + batchSize < chunks.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      console.log('');
    }

    stats.durationMs = Date.now() - startTime;

    // 5. Verify migration
    console.log('✅ Step 5: Verifying migration...');
    const finalBqStats = await getBigQueryStats();
    console.log(`  Final BigQuery state:`);
    console.log(`    Total chunks: ${finalBqStats.totalChunks} (was ${bqStats.totalChunks})`);
    console.log(`    Total users: ${finalBqStats.totalUsers}`);
    console.log(`    Total sources: ${finalBqStats.totalSources}`);
    console.log(`    Table size: ${finalBqStats.tableSizeMB} MB`);
    console.log('');

    // Final summary
    console.log('📊 Migration Summary');
    console.log('=' + '='.repeat(50));
    console.log(`Total chunks in Firestore: ${stats.totalChunks}`);
    console.log(`Successfully migrated: ${stats.migratedChunks}`);
    console.log(`Skipped: ${stats.skippedChunks}`);
    console.log(`Failed: ${stats.failedChunks}`);
    console.log(`Duration: ${(stats.durationMs / 1000).toFixed(2)}s`);
    console.log(`Average: ${(stats.migratedChunks / (stats.durationMs / 1000)).toFixed(0)} chunks/sec`);
    console.log('');

    if (stats.failedChunks > 0) {
      console.warn('⚠️ Some chunks failed to migrate. Check logs above.');
    } else {
      console.log('✅ All chunks migrated successfully!');
    }

    return stats;

  } catch (error) {
    console.error('❌ Migration failed:', error);
    stats.durationMs = Date.now() - startTime;
    throw error;
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const batchSizeArg = args.find(arg => arg.startsWith('--batch-size='));
const batchSize = batchSizeArg 
  ? parseInt(batchSizeArg.split('=')[1]) 
  : 100;

// Run migration
migrateChunksToBigQuery({ dryRun, batchSize })
  .then(stats => {
    console.log('');
    console.log('🎉 Migration script completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('');
    console.error('💥 Migration script failed!');
    console.error(error);
    process.exit(1);
  });

