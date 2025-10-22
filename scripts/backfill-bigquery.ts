/**
 * Backfill BigQuery with existing Firestore chunks
 * 
 * Run this if you have chunks in Firestore that weren't synced to BigQuery
 */

import { firestore } from '../src/lib/firestore.js';
import { syncChunksBatchToBigQuery } from '../src/lib/bigquery-vector-search.js';

async function backfillBigQuery() {
  console.log('🔄 Backfilling BigQuery with Firestore chunks...\n');

  try {
    // Get all chunks from Firestore
    const chunksSnapshot = await firestore
      .collection('document_chunks')
      .orderBy('createdAt', 'asc')
      .get();

    if (chunksSnapshot.empty) {
      console.log('ℹ️ No chunks found in Firestore. Nothing to backfill.');
      process.exit(0);
    }

    console.log(`📦 Found ${chunksSnapshot.size} chunks in Firestore`);
    console.log('');

    // Process in batches of 100 for BigQuery
    const batchSize = 100;
    let synced = 0;
    let failed = 0;

    for (let i = 0; i < chunksSnapshot.docs.length; i += batchSize) {
      const batchDocs = chunksSnapshot.docs.slice(i, i + batchSize);
      
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1} (chunks ${i + 1}-${Math.min(i + batchSize, chunksSnapshot.size)})...`);

      const chunksForBigQuery = batchDocs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          sourceId: data.sourceId,
          userId: data.userId,
          chunkIndex: data.chunkIndex,
          text: data.text,
          embedding: data.embedding,
          metadata: data.metadata || {}
        };
      });

      try {
        await syncChunksBatchToBigQuery(chunksForBigQuery);
        synced += chunksForBigQuery.length;
        console.log(`  ✅ Synced ${chunksForBigQuery.length} chunks`);
      } catch (error) {
        failed += chunksForBigQuery.length;
        console.error(`  ❌ Failed to sync batch:`, error);
      }

      // Small delay between batches
      if (i + batchSize < chunksSnapshot.docs.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log('');
    console.log('═══════════════════════════════════════');
    console.log('✅ Backfill Complete!');
    console.log(`  Total chunks: ${chunksSnapshot.size}`);
    console.log(`  Synced: ${synced}`);
    console.log(`  Failed: ${failed}`);
    console.log('═══════════════════════════════════════');
    console.log('');
    console.log('🔍 Verify with:');
    console.log('  bq query --use_legacy_sql=false --project_id=salfagpt "SELECT COUNT(*) as total FROM \\`salfagpt.flow_analytics.document_embeddings\\`"');

    process.exit(0);
  } catch (error) {
    console.error('❌ Backfill failed:', error);
    process.exit(1);
  }
}

backfillBigQuery();

