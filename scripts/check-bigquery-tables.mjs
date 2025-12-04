#!/usr/bin/env node

import { BigQuery } from '@google-cloud/bigquery';

const bq = new BigQuery({ projectId: 'salfagpt' });
const USER_ID = 'usr_uhwqffaqag1wrryd82tw';

async function main() {
  console.log('🔍 Checking BigQuery tables for M3-v2 data...\n');
  
  // Check flow_analytics.document_embeddings
  try {
    const [rows1] = await bq.query(`
      SELECT COUNT(*) as count, 
             COUNT(DISTINCT source_id) as sources,
             MAX(created_at) as latest
      FROM \`salfagpt.flow_analytics.document_embeddings\`
      WHERE user_id = '${USER_ID}'
    `);
    console.log('✅ flow_analytics.document_embeddings:');
    console.log('   Total rows:', rows1[0].count);
    console.log('   Distinct sources:', rows1[0].sources);
    console.log('   Latest:', rows1[0].latest?.value || 'N/A');
    console.log('');
  } catch (e) {
    console.log('❌ flow_analytics.document_embeddings:', e.message);
    console.log('');
  }
  
  // Check flow_rag_optimized.document_chunks_vectorized
  try {
    const [rows2] = await bq.query(`
      SELECT COUNT(*) as count,
             COUNT(DISTINCT source_id) as sources
      FROM \`salfagpt.flow_rag_optimized.document_chunks_vectorized\`
      WHERE user_id = '${USER_ID}'
    `);
    console.log('✅ flow_rag_optimized.document_chunks_vectorized:');
    console.log('   Total rows:', rows2[0].count);
    console.log('   Distinct sources:', rows2[0].sources);
    console.log('');
  } catch (e) {
    console.log('❌ flow_rag_optimized.document_chunks_vectorized:', e.message);
    console.log('');
  }
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });




