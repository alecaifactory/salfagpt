/**
 * Test inserting a single chunk to diagnose BigQuery insert issues
 */

import { BigQuery } from '@google-cloud/bigquery';
import { firestore } from '../src/lib/firestore';

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'salfagpt';
const DATASET = 'flow_rag_optimized';
const TABLE = 'document_chunks_vectorized';

const bigquery = new BigQuery({ projectId: PROJECT_ID });

async function testSingleInsert() {
  console.log('🧪 Testing single chunk insert to BigQuery...\n');

  // Get one chunk from Firestore
  const snapshot = await firestore.collection('document_chunks').limit(1).get();
  
  if (snapshot.empty) {
    console.error('❌ No chunks found in Firestore');
    process.exit(1);
  }

  const doc = snapshot.docs[0];
  const data = doc.data();
  
  console.log('Source chunk:');
  console.log(`  ID: ${doc.id}`);
  console.log(`  Fields:`, Object.keys(data));
  console.log(`  userId: ${data.userId}`);
  console.log(`  sourceId: ${data.sourceId}`);
  console.log(`  text length: ${data.text?.length || 0}`);
  console.log(`  embedding length: ${data.embedding?.length || 0}`);
  console.log('');

  // Prepare row for BigQuery
  const text = data.text || data.chunkText || '';
  const userId = data.userId || data.hashedUserId || data.googleUserId || '';
  
  // ✅ FIX: metadata must be clean JSON (no Timestamp objects)
  const safeMetadata = data.metadata ? {
    startChar: data.metadata.startChar || 0,
    endChar: data.metadata.endChar || text.length,
    tokenCount: data.metadata.tokenCount || Math.ceil(text.length / 4),
    startPage: data.metadata.startPage,
    endPage: data.metadata.endPage,
    // Convert any Timestamp objects to ISO strings
    ...(data.metadata.reindexedAt ? { reindexedAt: data.metadata.reindexedAt.toDate?.() || data.metadata.reindexedAt } : {}),
    ...(data.metadata.sourceName ? { sourceName: data.metadata.sourceName } : {}),
    ...(data.metadata.sourceType ? { sourceType: data.metadata.sourceType } : {}),
    ...(data.metadata.chunkSize ? { chunkSize: data.metadata.chunkSize } : {}),
    ...(data.metadata.overlap ? { overlap: data.metadata.overlap } : {})
  } : {
    startChar: 0,
    endChar: text.length,
    tokenCount: Math.ceil(text.length / 4)
  };

  const row = {
    chunk_id: doc.id,
    source_id: data.sourceId,
    user_id: userId,
    chunk_index: data.chunkIndex || 0,
    text_preview: text.substring(0, 500),
    full_text: text,
    embedding: data.embedding,
    metadata: JSON.stringify(safeMetadata), // ✅ Convert to JSON string
    created_at: new Date().toISOString(),
  };

  console.log('Prepared row:');
  console.log(`  chunk_id: ${row.chunk_id}`);
  console.log(`  source_id: ${row.source_id}`);
  console.log(`  user_id: ${row.user_id}`);
  console.log(`  chunk_index: ${row.chunk_index}`);
  console.log(`  text_preview length: ${row.text_preview.length}`);
  console.log(`  full_text length: ${row.full_text.length}`);
  console.log(`  embedding length: ${row.embedding.length}`);
  console.log(`  metadata type: ${typeof row.metadata}`);
  console.log('');

  // Calculate payload size
  const payloadSize = JSON.stringify([row]).length;
  console.log(`Payload size: ${(payloadSize / 1024).toFixed(2)} KB`);
  console.log('');

  try {
    console.log('Attempting insert...');
    
    await bigquery
      .dataset(DATASET)
      .table(TABLE)
      .insert([row]);

    console.log('✅ Success! Chunk inserted to BigQuery');
    console.log('');
    
    // Verify
    const query = `SELECT COUNT(*) as count FROM \`${PROJECT_ID}.${DATASET}.${TABLE}\``;
    const [rows] = await bigquery.query({ query });
    console.log(`✅ Verification: ${rows[0].count} chunks in table`);
    
  } catch (error: any) {
    console.error('❌ Insert failed!');
    console.error('Error type:', error.name);
    console.error('');
    
    // For PartialFailureError, check detailed errors
    if (error.errors && Array.isArray(error.errors)) {
      console.error('Detailed errors:');
      error.errors.forEach((err: any, i: number) => {
        console.error(`\nError ${i + 1}:`);
        if (err.errors && Array.isArray(err.errors)) {
          err.errors.forEach((e: any) => {
            console.error(`  - ${e.message}`);
            console.error(`    Reason: ${e.reason}`);
            console.error(`    Location: ${e.location}`);
          });
        }
      });
    }
    
    if (error.message) {
      console.error('\nMessage:', error.message);
    }
    
    process.exit(1);
  }

  process.exit(0);
}

testSingleInsert().catch(console.error);

