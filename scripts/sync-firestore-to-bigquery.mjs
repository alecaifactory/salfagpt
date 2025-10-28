#!/usr/bin/env node

/**
 * Sync Firestore document_chunks → BigQuery document_embeddings
 * 
 * Purpose: Resolve FB-001 (S001 shows 0 references)
 * Root Cause: Chunks re-indexed in Firestore but NOT synced to BigQuery
 * 
 * This script:
 * 1. Reads all chunks from Firestore (document_chunks collection)
 * 2. Transforms to BigQuery schema
 * 3. Inserts into salfagpt.flow_analytics.document_embeddings
 * 4. Logs progress every 100 chunks
 * 5. Verifies successful insertion
 * 
 * Usage:
 *   node scripts/sync-firestore-to-bigquery.mjs
 * 
 * Environment:
 *   GOOGLE_CLOUD_PROJECT must be set (salfagpt or gen-lang-client-0986191192)
 */

import { Firestore } from '@google-cloud/firestore';
import { BigQuery } from '@google-cloud/bigquery';

// ===== CONFIGURATION =====

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'salfagpt';
const DATASET_ID = 'flow_analytics';
const TABLE_ID = 'document_embeddings';
const BATCH_SIZE = 100; // BigQuery batch insert size

// Target user (Sebastian's user)
const TARGET_USER_ID = '114671162830729001607';

console.log('🚀 Starting Firestore → BigQuery Sync');
console.log('=====================================');
console.log('Project:', PROJECT_ID);
console.log('Dataset:', DATASET_ID);
console.log('Table:', TABLE_ID);
console.log('Target User:', TARGET_USER_ID);
console.log('');

// ===== INITIALIZE CLIENTS =====

const firestore = new Firestore({
  projectId: PROJECT_ID,
});

const bigquery = new BigQuery({
  projectId: PROJECT_ID,
});

const table = bigquery.dataset(DATASET_ID).table(TABLE_ID);

// ===== HELPER FUNCTIONS =====

/**
 * Transform Firestore chunk to BigQuery row
 */
function transformChunk(firestoreDoc) {
  const data = firestoreDoc.data();
  const id = firestoreDoc.id;
  
  // Extract metadata (ensure it's an object)
  const metadata = data.metadata || {};
  
  return {
    chunk_id: id,
    user_id: data.userId || TARGET_USER_ID,
    source_id: data.sourceId,
    chunk_index: data.chunkIndex || 0,
    text_preview: (data.text || '').substring(0, 500),
    full_text: data.text || '',
    embedding: data.embedding || [],
    metadata: JSON.stringify(metadata), // BigQuery stores as JSON string
    created_at: new Date().toISOString(),
  };
}

/**
 * Insert batch to BigQuery
 */
async function insertBatch(rows) {
  try {
    await table.insert(rows);
    return { success: true, count: rows.length };
  } catch (error) {
    console.error('❌ BigQuery insert error:', error.message);
    
    // If partial success, return error details
    if (error.errors && Array.isArray(error.errors)) {
      const failedRows = error.errors.filter(e => e.errors).length;
      const successRows = rows.length - failedRows;
      
      console.warn(`⚠️ Partial success: ${successRows}/${rows.length} rows inserted`);
      
      // Log first few errors for debugging
      error.errors.slice(0, 3).forEach((rowError, idx) => {
        if (rowError.errors) {
          console.error(`  Row ${idx} errors:`, rowError.errors);
        }
      });
      
      return { success: false, count: successRows, errors: failedRows };
    }
    
    throw error;
  }
}

// ===== MAIN SYNC FUNCTION =====

async function syncFirestoreToBigQuery() {
  try {
    console.log('📥 Step 1: Reading chunks from Firestore...');
    console.log('   Collection: document_chunks');
    console.log('   Filter: userId ==', TARGET_USER_ID);
    console.log('');
    
    // Query Firestore for all chunks of target user
    const chunksSnapshot = await firestore
      .collection('document_chunks')
      .where('userId', '==', TARGET_USER_ID)
      .get();
    
    const totalChunks = chunksSnapshot.size;
    
    console.log(`✅ Found ${totalChunks} chunks in Firestore`);
    console.log('');
    
    if (totalChunks === 0) {
      console.log('⚠️ No chunks found for user:', TARGET_USER_ID);
      console.log('   Verify:');
      console.log('   - User ID is correct');
      console.log('   - Chunks exist in Firestore');
      console.log('   - Re-indexing completed successfully');
      return;
    }
    
    // ===== TRANSFORM & BATCH =====
    
    console.log('🔄 Step 2: Transforming chunks to BigQuery schema...');
    
    const allRows = [];
    let transformErrors = 0;
    
    chunksSnapshot.docs.forEach((doc, idx) => {
      try {
        const row = transformChunk(doc);
        allRows.push(row);
      } catch (error) {
        console.error(`❌ Error transforming chunk ${idx}:`, error.message);
        transformErrors++;
      }
    });
    
    console.log(`✅ Transformed ${allRows.length} chunks`);
    if (transformErrors > 0) {
      console.warn(`⚠️ Failed to transform ${transformErrors} chunks`);
    }
    console.log('');
    
    // ===== INSERT TO BIGQUERY IN BATCHES =====
    
    console.log('📤 Step 3: Inserting to BigQuery in batches...');
    console.log(`   Batch size: ${BATCH_SIZE}`);
    console.log('');
    
    let inserted = 0;
    let failed = 0;
    const totalBatches = Math.ceil(allRows.length / BATCH_SIZE);
    
    for (let i = 0; i < allRows.length; i += BATCH_SIZE) {
      const batch = allRows.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      
      console.log(`📦 Batch ${batchNum}/${totalBatches} (${batch.length} chunks)...`);
      
      const result = await insertBatch(batch);
      
      if (result.success) {
        inserted += result.count;
        console.log(`   ✅ Inserted ${result.count} chunks`);
      } else {
        inserted += result.count || 0;
        failed += result.errors || batch.length;
        console.warn(`   ⚠️ Partial success: ${result.count} inserted, ${result.errors} failed`);
      }
      
      // Small delay to avoid rate limits
      if (i + BATCH_SIZE < allRows.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log('');
    console.log('✅ Step 4: Sync Complete!');
    console.log('=========================');
    console.log('Total chunks read:', totalChunks);
    console.log('Successfully inserted:', inserted);
    console.log('Failed:', failed);
    console.log('');
    
    // ===== VERIFY =====
    
    console.log('🔍 Step 5: Verifying insertion...');
    
    const verifyQuery = `
      SELECT COUNT(*) as count
      FROM \`${PROJECT_ID}.${DATASET_ID}.${TABLE_ID}\`
      WHERE user_id = '${TARGET_USER_ID}'
      AND DATE(created_at) = CURRENT_DATE()
    `;
    
    const [rows] = await bigquery.query(verifyQuery);
    const verifiedCount = rows[0]?.count || 0;
    
    console.log(`✅ Verified: ${verifiedCount} chunks in BigQuery with user_id ${TARGET_USER_ID}`);
    console.log('');
    
    // ===== SUMMARY =====
    
    if (verifiedCount >= inserted * 0.95) { // Allow 5% margin
      console.log('🎉 SUCCESS! Sync completed successfully.');
      console.log('');
      console.log('Next Steps:');
      console.log('1. Test S001 query: "¿Cómo genero el informe de consumo de petróleo?"');
      console.log('2. Verify references appear: [1][2][3]...');
      console.log('3. Check response uses PP-009 content');
      console.log('4. If pass → Fix M001 phantom refs [9][10]');
      console.log('5. If pass → Run bulk evaluation (87 questions)');
    } else {
      console.log('⚠️ WARNING: Verification count mismatch');
      console.log(`   Expected: ~${inserted}`);
      console.log(`   Found: ${verifiedCount}`);
      console.log('');
      console.log('Possible causes:');
      console.log('- Insertion errors (check logs above)');
      console.log('- Query timing (chunks not yet indexed)');
      console.log('- Date filter (created_at not today)');
      console.log('');
      console.log('Run manual verification:');
      console.log(`SELECT COUNT(*) FROM \`${PROJECT_ID}.${DATASET_ID}.${TABLE_ID}\``);
      console.log(`WHERE user_id = '${TARGET_USER_ID}'`);
    }
    
  } catch (error) {
    console.error('💥 Fatal error during sync:', error);
    console.error('');
    console.error('Troubleshooting:');
    console.error('1. Verify GOOGLE_CLOUD_PROJECT is set');
    console.error('2. Verify authenticated: gcloud auth application-default login');
    console.error('3. Verify BigQuery table exists:');
    console.error(`   bq show ${PROJECT_ID}:${DATASET_ID}.${TABLE_ID}`);
    console.error('4. Verify Firestore has chunks:');
    console.error(`   # Check in Firebase Console`);
    
    process.exit(1);
  }
}

// ===== EXECUTE =====

syncFirestoreToBigQuery()
  .then(() => {
    console.log('');
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });

