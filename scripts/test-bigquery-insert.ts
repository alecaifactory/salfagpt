/**
 * Test BigQuery insert to see detailed errors
 */

import { BigQuery } from '@google-cloud/bigquery';

const PROJECT_ID = 'salfagpt';
const DATASET_ID = 'flow_analytics';
const TABLE_ID = 'document_embeddings';

const bigquery = new BigQuery({
  projectId: PROJECT_ID,
});

async function testInsert() {
  console.log('🧪 Testing BigQuery insert...\n');

  // Test with a single simple row
  const testRow = {
    chunk_id: 'test_chunk_001',
    source_id: 'test_source_001',
    user_id: 'test_user_001',
    chunk_index: 0,
    text_preview: 'This is a test chunk preview...',
    full_text: 'This is a test chunk with some sample text for testing BigQuery insertion.',
    embedding: [0.1, 0.2, 0.3, 0.4, 0.5], // Small test embedding
    metadata: JSON.stringify({ // ✅ FIX: JSON string for BigQuery JSON type
      startChar: 0,
      endChar: 75,
      tokenCount: 15
    }),
    created_at: new Date().toISOString(),
  };

  console.log('Test row:', JSON.stringify(testRow, null, 2));
  console.log('');

  try {
    const result = await bigquery
      .dataset(DATASET_ID)
      .table(TABLE_ID)
      .insert([testRow]);

    console.log('✅ Insert successful!');
    console.log('Result:', result);
  } catch (error: any) {
    console.error('❌ Insert failed!');
    console.error('');
    
    if (error.errors && error.errors.length > 0) {
      console.error('Detailed errors:');
      error.errors.forEach((err: any, index: number) => {
        console.error(`\nError ${index + 1}:`);
        console.error('  Row:', JSON.stringify(err.row, null, 2));
        console.error('  Errors:', JSON.stringify(err.errors, null, 2));
      });
    } else {
      console.error('Error:', error);
    }
  }

  process.exit(0);
}

testInsert();

