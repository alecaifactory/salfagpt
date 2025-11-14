/**
 * Test GREEN BigQuery Search
 * 
 * Verifies that:
 * 1. GREEN table has data
 * 2. Search returns results
 * 3. Performance is <2s
 */

import { searchByAgent } from '../src/lib/bigquery-router';

async function testGreenBigQuery() {
  console.log('🧪 Testing GREEN BigQuery Search');
  console.log('=' + '='.repeat(60));
  console.log('');

  // Test with real user and agent
  const userId = 'usr_uhwqffaqag1wrryd82tw'; // From Firestore chunks
  const agentId = 'rIb6K1kLlGAl6DqzabeO'; // MAQSA agent
  const query = '¿Qué normativa aplica para zona rural?';

  console.log('Test configuration:');
  console.log(`  User: ${userId}`);
  console.log(`  Agent: ${agentId}`);
  console.log(`  Query: "${query}"`);
  console.log(`  Origin: http://localhost:3000 (should use GREEN)`);
  console.log('');

  try {
    const startTime = Date.now();
    
    console.log('🔍 Executing search...\n');
    
    const results = await searchByAgent(userId, agentId, query, {
      topK: 8,
      minSimilarity: 0.25,
      requestOrigin: 'http://localhost:3000' // Simulate localhost request
    });
    
    const duration = Date.now() - startTime;
    
    console.log('');
    console.log('📊 Results:');
    console.log('=' + '='.repeat(60));
    console.log(`  Duration: ${duration}ms`);
    console.log(`  Results found: ${results.length}`);
    
    if (results.length > 0) {
      const avgSimilarity = results.reduce((sum, r) => sum + r.similarity, 0) / results.length;
      console.log(`  Avg similarity: ${(avgSimilarity * 100).toFixed(1)}%`);
      console.log('');
      console.log('  Top 5 results:');
      results.slice(0, 5).forEach((r, i) => {
        console.log(`    ${i+1}. ${r.source_name} [chunk ${r.chunk_index}]`);
        console.log(`       Similarity: ${(r.similarity * 100).toFixed(1)}%`);
        console.log(`       Text: ${r.text.substring(0, 80)}...`);
      });
    }
    
    console.log('');
    console.log('✅ Performance Check:');
    console.log('=' + '='.repeat(60));
    
    if (duration < 2000) {
      console.log(`  ✅ PASS: ${duration}ms < 2,000ms (target)`);
      console.log(`  🎯 Performance: ${(2000 / duration).toFixed(1)}x faster than target!`);
    } else {
      console.log(`  ❌ FAIL: ${duration}ms > 2,000ms (target)`);
      console.log(`  ⚠️ Needs optimization`);
    }
    
    if (results.length > 0) {
      console.log(`  ✅ PASS: Found ${results.length} results (not empty)`);
    } else {
      console.log(`  ❌ FAIL: No results found`);
    }
    
    const avgSim = results.reduce((sum, r) => sum + r.similarity, 0) / results.length;
    if (avgSim > 0.7) {
      console.log(`  ✅ PASS: Avg similarity ${(avgSim * 100).toFixed(1)}% > 70% (good quality)`);
    } else if (avgSim > 0.5) {
      console.log(`  ⚠️ WARN: Avg similarity ${(avgSim * 100).toFixed(1)}% (acceptable but could be better)`);
    } else {
      console.log(`  ❌ FAIL: Avg similarity ${(avgSim * 100).toFixed(1)}% < 50% (poor quality)`);
    }
    
    console.log('');
    
    if (duration < 2000 && results.length > 0 && avgSim > 0.5) {
      console.log('🎉 SUCCESS! GREEN BigQuery is working perfectly!');
      console.log('');
      console.log('✅ Ready for localhost testing');
      console.log('✅ Production remains on BLUE (safe)');
      console.log('✅ Can switch production when confident');
      console.log('');
      console.log('Next: Test in browser at http://localhost:3000');
    } else {
      console.log('⚠️ Some issues detected - review above');
    }
    
  } catch (error) {
    console.error('❌ Test failed!');
    console.error('Error:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

testGreenBigQuery().catch(console.error);

