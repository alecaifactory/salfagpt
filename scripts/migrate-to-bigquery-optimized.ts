/**
 * Migration to Optimized BigQuery Setup (Blue-Green Deployment)
 * 
 * Migrates chunks from Firestore to NEW optimized BigQuery table
 * WITHOUT touching the current production table
 * 
 * Strategy:
 * - Source: Firestore document_chunks (source of truth)
 * - Destination: flow_rag_optimized.document_chunks_vectorized (NEW)
 * - Current: flow_analytics.document_embeddings (UNTOUCHED)
 * 
 * Usage:
 *   npx tsx scripts/migrate-to-bigquery-optimized.ts [--dry-run] [--batch-size=500]
 */

import { BigQuery } from '@google-cloud/bigquery';
import { firestore } from '../src/lib/firestore';

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'salfagpt';
const NEW_DATASET = 'flow_rag_optimized';
const NEW_TABLE = 'document_chunks_vectorized';

const bigquery = new BigQuery({ projectId: PROJECT_ID });

interface MigrationStats {
  totalSources: number;
  totalChunks: number;
  migratedChunks: number;
  skippedChunks: number;
  failedChunks: number;
  durationMs: number;
}

async function migrateToOptimizedBigQuery(options: {
  dryRun?: boolean;
  batchSize?: number;
} = {}): Promise<MigrationStats> {
  const { dryRun = false, batchSize = 500 } = options;
  
  console.log('🔄 BigQuery Optimized Migration (Blue-Green Deployment)');
  console.log('=' + '='.repeat(60));
  console.log(`Mode: ${dryRun ? 'DRY RUN (preview only)' : 'LIVE MIGRATION'}`);
  console.log(`Batch size: ${batchSize}`);
  console.log(`Target: ${PROJECT_ID}.${NEW_DATASET}.${NEW_TABLE}`);
  console.log(`Current: flow_analytics.document_embeddings (UNTOUCHED)`);
  console.log('');

  const startTime = Date.now();
  const stats: MigrationStats = {
    totalSources: 0,
    totalChunks: 0,
    migratedChunks: 0,
    skippedChunks: 0,
    failedChunks: 0,
    durationMs: 0
  };

  try {
    // 1. Verify new table exists
    console.log('🔍 Step 1: Verifying new table exists...');
    
    const table = bigquery.dataset(NEW_DATASET).table(NEW_TABLE);
    const [exists] = await table.exists();
    
    if (!exists) {
      console.error('  ❌ Table does not exist!');
      console.error('     Run first: npx tsx scripts/setup-bigquery-optimized.ts');
      throw new Error('Table not found. Run setup script first.');
    }
    
    console.log('  ✅ Table exists: flow_rag_optimized.document_chunks_vectorized');

    // 2. Check current state of new table
    console.log('');
    console.log('📊 Step 2: Checking current state of new table...');
    
    const statsQuery = `
      SELECT 
        COUNT(*) as total_chunks,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(DISTINCT source_id) as unique_sources
      FROM \`${PROJECT_ID}.${NEW_DATASET}.${NEW_TABLE}\`
    `;
    
    const [statsRows] = await bigquery.query({ query: statsQuery });
    const currentState = statsRows[0];
    
    console.log('  Current state of NEW table:');
    console.log(`    Total chunks: ${currentState.total_chunks}`);
    console.log(`    Unique users: ${currentState.unique_users}`);
    console.log(`    Unique sources: ${currentState.unique_sources}`);

    // 3. Fetch all chunks from Firestore
    console.log('');
    console.log('📥 Step 3: Fetching chunks from Firestore...');
    
    const chunksSnapshot = await firestore
      .collection('document_chunks')
      .get();
    
    stats.totalChunks = chunksSnapshot.size;
    console.log(`  Found ${stats.totalChunks} chunks in Firestore`);

    if (stats.totalChunks === 0) {
      console.log('  ⚠️ No chunks to migrate!');
      stats.durationMs = Date.now() - startTime;
      return stats;
    }

    // Group by source
    const chunksBySource = new Map<string, any[]>();
    
    for (const doc of chunksSnapshot.docs) {
      const data = doc.data();
      const sourceId = data.sourceId || doc.id.split('_chunk_')[0];
      
      if (!sourceId || !data.userId || !data.embedding) {
        console.warn(`  ⚠️ Skipping chunk ${doc.id} - missing required fields`);
        stats.skippedChunks++;
        continue;
      }

      if (!chunksBySource.has(sourceId)) {
        chunksBySource.set(sourceId, []);
      }

      // Get text from either 'text' or 'chunkText' field
      const chunkText = data.text || data.chunkText || '';
      
      // Get userId (handle multiple formats: userId, hashedUserId, googleUserId)
      const chunkUserId = data.userId || data.hashedUserId || data.googleUserId || '';
      
      if (!chunkText || !chunkUserId || !data.embedding) {
        console.warn(`  ⚠️ Skipping chunk ${doc.id} - missing required data`);
        stats.skippedChunks++;
        continue;
      }
      
      chunksBySource.get(sourceId)!.push({
        chunk_id: doc.id,
        source_id: sourceId,
        user_id: chunkUserId, // Use whatever format exists
        chunk_index: data.chunkIndex || 0,
        text_preview: chunkText.substring(0, 500),
        full_text: chunkText,
        embedding: data.embedding,
        metadata: data.metadata || {},
      });
    }

    stats.totalSources = chunksBySource.size;
    console.log(`  Grouped into ${stats.totalSources} sources`);
    console.log('');

    if (dryRun) {
      console.log('🔍 DRY RUN - Preview of migration:');
      console.log('');
      
      let previewCount = 0;
      for (const [sourceId, chunks] of chunksBySource) {
        if (previewCount >= 5) {
          console.log(`  ... and ${chunksBySource.size - 5} more sources`);
          break;
        }
        
        console.log(`  Source: ${sourceId}`);
        console.log(`    Chunks: ${chunks.length}`);
        console.log(`    User: ${chunks[0].user_id}`);
        console.log(`    Sample: ${chunks[0].full_text.substring(0, 100)}...`);
        console.log('');
        previewCount++;
      }

      stats.durationMs = Date.now() - startTime;
      console.log('✅ Dry run complete!');
      console.log('  Run without --dry-run to perform migration');
      return stats;
    }

    // 4. Migrate in batches
    console.log('📤 Step 4: Migrating chunks to NEW table...');
    console.log('');

    let processedSources = 0;
    const allChunks = Array.from(chunksBySource.values()).flat();
    
    for (let i = 0; i < allChunks.length; i += batchSize) {
      const batch = allChunks.slice(i, i + batchSize);
      
      try {
        // Prepare rows for BigQuery
        const rows = batch.map(chunk => {
          // ✅ FIX: Clean metadata - remove Timestamp objects, convert to JSON string
          const cleanMetadata = chunk.metadata ? {
            startChar: chunk.metadata.startChar || 0,
            endChar: chunk.metadata.endChar || chunk.full_text.length,
            tokenCount: chunk.metadata.tokenCount || Math.ceil(chunk.full_text.length / 4),
            startPage: chunk.metadata.startPage,
            endPage: chunk.metadata.endPage,
            sourceName: chunk.metadata.sourceName,
            sourceType: chunk.metadata.sourceType,
            chunkSize: chunk.metadata.chunkSize,
            overlap: chunk.metadata.overlap,
            // Convert Timestamp if exists
            reindexedAt: chunk.metadata.reindexedAt?.toDate ? 
              chunk.metadata.reindexedAt.toDate().toISOString() : 
              chunk.metadata.reindexedAt
          } : {
            startChar: 0,
            endChar: chunk.full_text.length,
            tokenCount: Math.ceil(chunk.full_text.length / 4)
          };
          
          return {
            chunk_id: chunk.chunk_id,
            source_id: chunk.source_id,
            user_id: chunk.user_id,
            chunk_index: chunk.chunk_index,
            text_preview: chunk.text_preview,
            full_text: chunk.full_text,
            embedding: chunk.embedding,
            metadata: JSON.stringify(cleanMetadata), // ✅ Convert to JSON string
            created_at: new Date().toISOString(),
          };
        });

        // Insert to NEW table (not touching current one!)
        await bigquery
          .dataset(NEW_DATASET)
          .table(NEW_TABLE)
          .insert(rows);

        stats.migratedChunks += batch.length;
        
        const progress = ((stats.migratedChunks / stats.totalChunks) * 100).toFixed(1);
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        const rate = Math.round(stats.migratedChunks / ((Date.now() - startTime) / 1000));
        const remaining = Math.round((stats.totalChunks - stats.migratedChunks) / rate);
        
        console.log(`  ✓ Batch ${Math.floor(i / batchSize) + 1}: ${stats.migratedChunks}/${stats.totalChunks} chunks (${progress}%) - ${elapsed}s elapsed, ~${remaining}s remaining, ${rate} chunks/s`);
      } catch (error) {
        console.error(`  ✗ Batch ${Math.floor(i / batchSize) + 1} failed:`);
        console.error(`     Error:`, error instanceof Error ? error.message : error);
        if (error instanceof Error && error.stack) {
          console.error(`     Stack:`, error.stack.split('\n').slice(0, 3).join('\n'));
        }
        // Log first failed chunk for debugging
        if (batch.length > 0) {
          console.error(`     First chunk in batch:`, {
            chunk_id: batch[0].chunk_id,
            source_id: batch[0].source_id,
            user_id: batch[0].user_id,
            has_embedding: !!batch[0].embedding,
            embedding_length: batch[0].embedding?.length,
            text_length: batch[0].full_text?.length
          });
        }
        stats.failedChunks += batch.length;
      }

      // Small delay to avoid rate limits
      if (i + batchSize < allChunks.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    stats.durationMs = Date.now() - startTime;

    // 5. Verify migration
    console.log('');
    console.log('✅ Step 5: Verifying migration...');
    
    const [verifyRows] = await bigquery.query({ query: statsQuery });
    const finalState = verifyRows[0];
    
    console.log('  Final state of NEW table:');
    console.log(`    Total chunks: ${finalState.total_chunks} (was ${currentState.total_chunks})`);
    console.log(`    Unique users: ${finalState.unique_users}`);
    console.log(`    Unique sources: ${finalState.unique_sources}`);

    // 6. Get table size
    const [metadata] = await table.getMetadata();
    const tableSizeMB = (parseInt(metadata.numBytes || '0') / (1024 * 1024)).toFixed(2);
    console.log(`    Table size: ${tableSizeMB} MB`);

    // Final summary
    console.log('');
    console.log('📊 Migration Summary');
    console.log('=' + '='.repeat(60));
    console.log(`Total chunks in Firestore: ${stats.totalChunks}`);
    console.log(`Successfully migrated: ${stats.migratedChunks}`);
    console.log(`Skipped: ${stats.skippedChunks}`);
    console.log(`Failed: ${stats.failedChunks}`);
    console.log(`Duration: ${(stats.durationMs / 1000).toFixed(2)}s`);
    console.log(`Rate: ${Math.round(stats.migratedChunks / (stats.durationMs / 1000))} chunks/sec`);
    console.log('');

    if (stats.failedChunks === 0 && stats.migratedChunks > 0) {
      console.log('✅ Migration successful!');
      console.log('');
      console.log('🧪 Next: Test the new setup');
      console.log('');
      console.log('Terminal 1 (Test new setup):');
      console.log('  export USE_OPTIMIZED_BIGQUERY=true');
      console.log('  npm run dev');
      console.log('  # Test queries, verify <2s performance');
      console.log('');
      console.log('Terminal 2 (Keep current running):');
      console.log('  npm run dev');
      console.log('  # Current setup still works as fallback');
      console.log('');
      console.log('Once validated:');
      console.log('  1. Update .env: USE_OPTIMIZED_BIGQUERY=true');
      console.log('  2. Deploy to production');
      console.log('  3. Monitor for 24-48 hours');
      console.log('  4. If stable, delete old table (optional)');
    } else if (stats.failedChunks > 0) {
      console.warn('');
      console.warn('⚠️ Some chunks failed to migrate');
      console.warn('  Review errors above and retry failed chunks');
    }

    return stats;

  } catch (error) {
    stats.durationMs = Date.now() - startTime;
    throw error;
  }
}

// Parse args
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const batchSizeArg = args.find(arg => arg.startsWith('--batch-size='));
const batchSize = batchSizeArg ? parseInt(batchSizeArg.split('=')[1]) : 500;

// Run migration
migrateToOptimizedBigQuery({ dryRun, batchSize })
  .then(stats => {
    console.log('');
    console.log('🎉 Migration completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('');
    console.error('💥 Migration failed!');
    console.error(error);
    process.exit(1);
  });

