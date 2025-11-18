#!/usr/bin/env tsx
/**
 * Cache Performance Test Script
 * 
 * Tests the new caching system to measure performance improvements
 * 
 * Usage: npm run test:cache
 */

import { getCachedAgentSources, getAgentSourcesCacheStats, clearAllAgentSourcesCaches } from '../src/lib/agent-sources-cache';
import { getCachedEmbedding, getEmbeddingCacheStats, clearEmbeddingCache } from '../src/lib/embedding-cache';

// Test data - replace with real IDs from your database
const TEST_AGENT_ID = 'conv_xxx'; // Replace with real agent ID
const TEST_USER_ID = 'usr_xxx';   // Replace with real user ID

const TEST_QUERIES = [
  '¿Qué es esto?',
  '¿Cómo funciona?',
  '¿Cuál es el proceso?',
  'Resume el documento',
  'Explica esto'
];

function printHeader(title: string) {
  console.log('\n' + '='.repeat(70));
  console.log(`  ${title}`);
  console.log('='.repeat(70) + '\n');
}

async function testEmbeddingCache() {
  printHeader('🧪 Test 1: Embedding Cache Performance');
  
  console.log('Testing query embeddings with caching...\n');
  
  // Clear cache first
  clearEmbeddingCache();
  console.log('✓ Cache cleared\n');
  
  const results = [];
  
  // Test 1: First run (cold cache)
  console.log('📊 Run 1: Cold Cache (all misses expected)');
  for (const query of TEST_QUERIES) {
    const start = Date.now();
    await getCachedEmbedding(query);
    const time = Date.now() - start;
    results.push({ query, run: 1, time });
    console.log(`  - "${query}": ${time}ms`);
  }
  
  console.log('\n' + getEmbeddingCacheStats());
  console.log('');
  
  // Test 2: Second run (warm cache)
  console.log('📊 Run 2: Warm Cache (all hits expected)');
  for (const query of TEST_QUERIES) {
    const start = Date.now();
    await getCachedEmbedding(query);
    const time = Date.now() - start;
    results.push({ query, run: 2, time });
    console.log(`  - "${query}": ${time}ms`);
  }
  
  console.log('\n' + getEmbeddingCacheStats());
  console.log('');
  
  // Calculate improvement
  const avgRun1 = results.filter(r => r.run === 1).reduce((sum, r) => sum + r.time, 0) / TEST_QUERIES.length;
  const avgRun2 = results.filter(r => r.run === 2).reduce((sum, r) => sum + r.time, 0) / TEST_QUERIES.length;
  const improvement = ((avgRun1 - avgRun2) / avgRun1 * 100).toFixed(1);
  
  console.log('📈 Performance Summary:');
  console.log(`  - First run (cold):  ${avgRun1.toFixed(0)}ms avg`);
  console.log(`  - Second run (warm): ${avgRun2.toFixed(0)}ms avg`);
  console.log(`  - Improvement:       ${improvement}% faster ⚡`);
  console.log('');
}

async function testAgentSourcesCache() {
  printHeader('🧪 Test 2: Agent Sources Cache Performance');
  
  console.log('Testing agent sources lookup with caching...\n');
  console.log(`⚠️  NOTE: You need to set TEST_AGENT_ID and TEST_USER_ID in this script`);
  console.log(`    Current values:`);
  console.log(`      - Agent ID: ${TEST_AGENT_ID}`);
  console.log(`      - User ID:  ${TEST_USER_ID}`);
  console.log('');
  
  if (TEST_AGENT_ID === 'conv_xxx' || TEST_USER_ID === 'usr_xxx') {
    console.log('⏭️  Skipping test - please set real IDs first\n');
    return;
  }
  
  // Clear cache first
  clearAllAgentSourcesCaches();
  console.log('✓ Cache cleared\n');
  
  const results = [];
  
  // Test 1: First run (cold cache)
  console.log('📊 Run 1: Cold Cache (miss expected)');
  let start = Date.now();
  const result1 = await getCachedAgentSources(TEST_AGENT_ID, TEST_USER_ID);
  const time1 = Date.now() - start;
  results.push({ run: 1, time: time1, sources: result1.sourceIds.length });
  console.log(`  - Sources found: ${result1.sourceIds.length}`);
  console.log(`  - Time: ${time1}ms`);
  console.log('\n' + getAgentSourcesCacheStats());
  console.log('');
  
  // Test 2: Second run (warm cache)
  console.log('📊 Run 2: Warm Cache (hit expected)');
  start = Date.now();
  const result2 = await getCachedAgentSources(TEST_AGENT_ID, TEST_USER_ID);
  const time2 = Date.now() - start;
  results.push({ run: 2, time: time2, sources: result2.sourceIds.length });
  console.log(`  - Sources found: ${result2.sourceIds.length}`);
  console.log(`  - Time: ${time2}ms`);
  console.log('\n' + getAgentSourcesCacheStats());
  console.log('');
  
  // Calculate improvement
  const improvement = ((time1 - time2) / time1 * 100).toFixed(1);
  
  console.log('📈 Performance Summary:');
  console.log(`  - First run (cold):  ${time1}ms`);
  console.log(`  - Second run (warm): ${time2}ms`);
  console.log(`  - Improvement:       ${improvement}% faster ⚡`);
  console.log('');
}

async function testCombinedPerformance() {
  printHeader('🧪 Test 3: Combined Search Performance Simulation');
  
  console.log('Simulating full search with both caches...\n');
  
  if (TEST_AGENT_ID === 'conv_xxx' || TEST_USER_ID === 'usr_xxx') {
    console.log('⏭️  Skipping test - please set real IDs first\n');
    return;
  }
  
  // Clear all caches
  clearAllAgentSourcesCaches();
  clearEmbeddingCache();
  console.log('✓ All caches cleared\n');
  
  const testQuery = '¿Qué dice el documento?';
  
  // Simulated search 1: Cold cache
  console.log('📊 Search 1: Cold Cache (all misses)');
  let start = Date.now();
  const [embedding1, sources1] = await Promise.all([
    getCachedEmbedding(testQuery),
    getCachedAgentSources(TEST_AGENT_ID, TEST_USER_ID)
  ]);
  const parallelTime1 = Date.now() - start;
  
  console.log(`  - Parallel ops time: ${parallelTime1}ms`);
  console.log(`  - Sources found: ${sources1.sourceIds.length}`);
  console.log(`  - Embedding dimension: ${embedding1.length}`);
  console.log('');
  
  // Simulated search 2: Warm cache
  console.log('📊 Search 2: Warm Cache (all hits)');
  start = Date.now();
  const [embedding2, sources2] = await Promise.all([
    getCachedEmbedding(testQuery),
    getCachedAgentSources(TEST_AGENT_ID, TEST_USER_ID)
  ]);
  const parallelTime2 = Date.now() - start;
  
  console.log(`  - Parallel ops time: ${parallelTime2}ms`);
  console.log(`  - Sources found: ${sources2.sourceIds.length}`);
  console.log(`  - Embedding dimension: ${embedding2.length}`);
  console.log('');
  
  // Calculate total search time (including BigQuery)
  const estimatedBigQueryTime = 400; // ms (typical)
  const totalTime1 = parallelTime1 + estimatedBigQueryTime;
  const totalTime2 = parallelTime2 + estimatedBigQueryTime;
  
  console.log('📈 Full Search Performance Estimate:');
  console.log(`  - Search 1 (cold):  ${parallelTime1}ms parallel + ${estimatedBigQueryTime}ms BigQuery = ${totalTime1}ms total`);
  console.log(`  - Search 2 (warm):  ${parallelTime2}ms parallel + ${estimatedBigQueryTime}ms BigQuery = ${totalTime2}ms total`);
  console.log(`  - Improvement:      ${((totalTime1 - totalTime2) / totalTime1 * 100).toFixed(1)}% faster ⚡`);
  console.log('');
  
  console.log('Cache Statistics:');
  console.log('  - Agent Sources:', getAgentSourcesCacheStats());
  console.log('  - Embeddings:', getEmbeddingCacheStats());
  console.log('');
}

async function runAllTests() {
  printHeader('⚡ Cache Performance Test Suite');
  
  console.log('Testing new caching system for latency optimization\n');
  console.log('This will test:');
  console.log('  1. Embedding cache (query embeddings)');
  console.log('  2. Agent sources cache (source IDs + names)');
  console.log('  3. Combined performance (simulated full search)');
  console.log('');
  
  try {
    await testEmbeddingCache();
    await testAgentSourcesCache();
    await testCombinedPerformance();
    
    printHeader('✅ All Tests Complete!');
    
    console.log('Next steps:');
    console.log('  1. Update TEST_AGENT_ID and TEST_USER_ID in this script');
    console.log('  2. Run again to test agent sources cache');
    console.log('  3. Test in the actual application at http://localhost:3000/chat');
    console.log('  4. Monitor cache hit rates in production');
    console.log('');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
runAllTests();

