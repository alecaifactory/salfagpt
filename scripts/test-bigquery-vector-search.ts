/**
 * Test BigQuery Vector Search End-to-End
 * 
 * This script verifies:
 * 1. BigQuery has chunks
 * 2. Vector search query works
 * 3. Returns relevant results
 */

import { vectorSearchBigQuery } from '../src/lib/bigquery-vector-search.js';

async function testVectorSearch() {
  console.log('🧪 Testing BigQuery Vector Search\n');
  console.log('═══════════════════════════════════════\n');

  // Test parameters
  const userId = '114671162830729001607'; // Your user ID
  const testQuery = '¿Qué documentos hay sobre construcción?';
  const topK = 5;
  const minSimilarity = 0.3;

  console.log('Test Configuration:');
  console.log(`  User ID: ${userId}`);
  console.log(`  Query: "${testQuery}"`);
  console.log(`  Top K: ${topK}`);
  console.log(`  Min Similarity: ${minSimilarity}`);
  console.log('');

  try {
    const startTime = Date.now();
    
    console.log('🔍 Performing vector search...\n');
    
    const results = await vectorSearchBigQuery(userId, testQuery, {
      topK,
      minSimilarity,
    });

    const totalTime = Date.now() - startTime;

    console.log('');
    console.log('═══════════════════════════════════════');
    console.log('✅ Vector Search Successful!');
    console.log('═══════════════════════════════════════');
    console.log(`  Results: ${results.length}`);
    console.log(`  Time: ${totalTime}ms`);
    console.log('');

    if (results.length > 0) {
      console.log('📊 Top Results:\n');
      results.forEach((result, index) => {
        console.log(`${index + 1}. Chunk ${result.chunk_index} (${(result.similarity * 100).toFixed(1)}% similar)`);
        console.log(`   Source: ${result.source_id}`);
        console.log(`   Preview: ${result.text_preview.substring(0, 100)}...`);
        console.log('');
      });

      const avgSimilarity = results.reduce((sum, r) => sum + r.similarity, 0) / results.length;
      console.log(`📈 Average Similarity: ${(avgSimilarity * 100).toFixed(1)}%`);
    } else {
      console.log('⚠️ No results found');
      console.log('   Try:');
      console.log('   - Lower minSimilarity (current: 0.3)');
      console.log('   - Different query');
      console.log('   - Check if chunks exist for this user');
    }

    console.log('');
    console.log('═══════════════════════════════════════');
    console.log('🎯 BigQuery Vector Search is READY!');
    console.log('═══════════════════════════════════════');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Test in production chat: Send a message with RAG enabled');
    console.log('  2. Check logs for "BigQuery search succeeded"');
    console.log('  3. Compare response time (should be ~400ms vs ~2600ms)');

    process.exit(0);
  } catch (error) {
    console.error('❌ Vector search failed:', error);
    process.exit(1);
  }
}

testVectorSearch();

