/**
 * A/B Performance Benchmark: GREEN vs BLUE BigQuery
 * 
 * Tests both BigQuery setups in parallel with the same:
 * - User
 * - Agent: "GESTION BODEGAS GPT (S001)"
 * - Query
 * 
 * Measures and compares:
 * - Search latency
 * - Result count
 * - Result quality (similarity scores)
 * - End-to-end performance
 */

import { searchByAgent as searchByAgentCurrent } from '../src/lib/bigquery-agent-search';
import { searchByAgentOptimized } from '../src/lib/bigquery-optimized';
import { firestore } from '../src/lib/firestore';

interface BenchmarkResult {
  setup: 'BLUE' | 'GREEN';
  success: boolean;
  duration: number;
  resultCount: number;
  avgSimilarity: number;
  error?: string;
  breakdown: {
    embedding?: number;
    sourceLoading?: number;
    vectorSearch?: number;
    nameLoading?: number;
  };
}

async function findAgent(userId: string, agentName: string): Promise<string | null> {
  console.log(`🔍 Finding agent: "${agentName}" for user ${userId}...`);
  
  const snapshot = await firestore
    .collection('conversations')
    .where('userId', '==', userId)
    .where('title', '==', agentName)
    .limit(1)
    .get();
  
  if (snapshot.empty) {
    console.log('  ⚠️ Agent not found, searching with partial match...');
    
    // Try partial match
    const allAgents = await firestore
      .collection('conversations')
      .where('userId', '==', userId)
      .get();
    
    const matches = allAgents.docs.filter(doc => 
      doc.data().title?.toLowerCase().includes(agentName.toLowerCase()) ||
      agentName.toLowerCase().includes(doc.data().title?.toLowerCase())
    );
    
    if (matches.length > 0) {
      console.log(`  ✓ Found ${matches.length} partial matches:`);
      matches.forEach(doc => {
        console.log(`    - ${doc.id}: "${doc.data().title}"`);
      });
      return matches[0].id;
    }
    
    return null;
  }
  
  const agentId = snapshot.docs[0].id;
  console.log(`  ✓ Found agent: ${agentId}`);
  return agentId;
}

async function benchmarkSetup(
  setup: 'BLUE' | 'GREEN',
  userId: string,
  agentId: string,
  query: string
): Promise<BenchmarkResult> {
  const result: BenchmarkResult = {
    setup,
    success: false,
    duration: 0,
    resultCount: 0,
    avgSimilarity: 0,
    breakdown: {}
  };

  const startTime = Date.now();

  try {
    console.log(`\n🔬 Testing ${setup}...`);
    
    let results;
    
    if (setup === 'BLUE') {
      results = await searchByAgentCurrent(userId, agentId, query, {
        topK: 8,
        minSimilarity: 0.25
      });
    } else {
      results = await searchByAgentOptimized(userId, agentId, query, {
        topK: 8,
        minSimilarity: 0.25
      });
    }
    
    result.duration = Date.now() - startTime;
    result.resultCount = results.length;
    
    if (results.length > 0) {
      result.avgSimilarity = results.reduce((sum, r) => sum + r.similarity, 0) / results.length;
      result.success = true;
    }
    
    console.log(`  ✓ Duration: ${result.duration}ms`);
    console.log(`  ✓ Results: ${result.resultCount} chunks`);
    console.log(`  ✓ Avg similarity: ${(result.avgSimilarity * 100).toFixed(1)}%`);
    
  } catch (error) {
    result.duration = Date.now() - startTime;
    result.error = error instanceof Error ? error.message : String(error);
    result.success = false;
    
    console.log(`  ✗ Failed: ${result.error}`);
    console.log(`  ✗ Duration: ${result.duration}ms (before failure)`);
  }
  
  return result;
}

async function runBenchmark() {
  console.log('🔬 GREEN vs BLUE BigQuery Benchmark');
  console.log('=' + '='.repeat(70));
  console.log('');

  // Configuration
  const userId = 'usr_uhwqffaqag1wrryd82tw';
  const agentName = 'GESTION BODEGAS GPT (S001)';
  const testQuery = '¿Cuál es el procedimiento para inventario de existencias?';

  console.log('Configuration:');
  console.log(`  User: ${userId}`);
  console.log(`  Agent: "${agentName}"`);
  console.log(`  Query: "${testQuery}"`);
  console.log('');

  // Find agent
  const agentId = await findAgent(userId, agentName);
  
  if (!agentId) {
    console.error('❌ Agent not found!');
    console.error(`   Searched for: "${agentName}"`);
    console.error('');
    console.error('Available agents:');
    const agents = await firestore
      .collection('conversations')
      .where('userId', '==', userId)
      .limit(10)
      .get();
    
    agents.docs.forEach(doc => {
      console.error(`  - ${doc.id}: "${doc.data().title}"`);
    });
    
    process.exit(1);
  }

  console.log(`✅ Using agent: ${agentId}`);
  console.log('');
  console.log('🚀 Starting parallel benchmark...');
  console.log('=' + '='.repeat(70));

  // Run both in parallel
  const [greenResult, blueResult] = await Promise.all([
    benchmarkSetup('GREEN', userId, agentId, testQuery),
    benchmarkSetup('BLUE', userId, agentId, testQuery)
  ]);

  // Compare results
  console.log('');
  console.log('');
  console.log('📊 BENCHMARK RESULTS');
  console.log('=' + '='.repeat(70));
  console.log('');

  // Results table
  console.log('┌─────────────────────────┬─────────────────┬─────────────────┐');
  console.log('│ Metric                  │ 🔵 BLUE         │ 🟢 GREEN        │');
  console.log('├─────────────────────────┼─────────────────┼─────────────────┤');
  console.log(`│ Success                 │ ${blueResult.success ? '✅ Yes' : '❌ No'  }          │ ${greenResult.success ? '✅ Yes' : '❌ No'  }          │`);
  console.log(`│ Duration                │ ${blueResult.duration.toString().padEnd(11)}ms │ ${greenResult.duration.toString().padEnd(11)}ms │`);
  console.log(`│ Results Found           │ ${blueResult.resultCount.toString().padEnd(15)} │ ${greenResult.resultCount.toString().padEnd(15)} │`);
  console.log(`│ Avg Similarity          │ ${(blueResult.avgSimilarity * 100).toFixed(1).padEnd(13)}% │ ${(greenResult.avgSimilarity * 100).toFixed(1).padEnd(13)}% │`);
  console.log('└─────────────────────────┴─────────────────┴─────────────────┘');
  console.log('');

  // Performance comparison
  if (greenResult.success && blueResult.success) {
    const speedup = (blueResult.duration / greenResult.duration).toFixed(1);
    const timeSaved = blueResult.duration - greenResult.duration;
    
    console.log('🏆 Performance Comparison:');
    console.log('=' + '='.repeat(70));
    
    if (greenResult.duration < blueResult.duration) {
      console.log(`  🟢 GREEN is ${speedup}x FASTER than BLUE`);
      console.log(`  ⚡ Time saved: ${timeSaved}ms per query`);
      console.log(`  💰 Monthly savings: ${(timeSaved * 3000 / 1000 / 60).toFixed(1)} minutes (3,000 queries/month)`);
    } else if (blueResult.duration < greenResult.duration) {
      const slowdown = (greenResult.duration / blueResult.duration).toFixed(1);
      console.log(`  🔵 BLUE is ${slowdown}x faster than GREEN`);
      console.log(`  ⚠️ GREEN needs optimization`);
    } else {
      console.log(`  🤝 Both perform similarly (~${greenResult.duration}ms)`);
    }
    
    console.log('');
    console.log('📊 Quality Comparison:');
    console.log('=' + '='.repeat(70));
    
    if (greenResult.resultCount > blueResult.resultCount) {
      console.log(`  🟢 GREEN found ${greenResult.resultCount - blueResult.resultCount} MORE results`);
    } else if (blueResult.resultCount > greenResult.resultCount) {
      console.log(`  🔵 BLUE found ${blueResult.resultCount - greenResult.resultCount} MORE results`);
    } else {
      console.log(`  🤝 Both found same number of results (${greenResult.resultCount})`);
    }
    
    if (greenResult.avgSimilarity > blueResult.avgSimilarity) {
      const diff = ((greenResult.avgSimilarity - blueResult.avgSimilarity) * 100).toFixed(1);
      console.log(`  🟢 GREEN has ${diff}% HIGHER avg similarity`);
    } else if (blueResult.avgSimilarity > greenResult.avgSimilarity) {
      const diff = ((blueResult.avgSimilarity - greenResult.avgSimilarity) * 100).toFixed(1);
      console.log(`  🔵 BLUE has ${diff}% higher avg similarity`);
    } else {
      console.log(`  🤝 Both have similar quality scores`);
    }
  }

  console.log('');
  console.log('🎯 Target Performance Check:');
  console.log('=' + '='.repeat(70));
  
  const target = 2000; // 2 seconds
  
  if (greenResult.success && greenResult.duration < target) {
    console.log(`  ✅ GREEN PASS: ${greenResult.duration}ms < ${target}ms target`);
    console.log(`  🎯 Performance: ${(target / greenResult.duration).toFixed(1)}x faster than required!`);
  } else if (greenResult.success) {
    console.log(`  ⚠️ GREEN SLOW: ${greenResult.duration}ms > ${target}ms target`);
    console.log(`  💡 Needs: Vector index creation for better performance`);
  } else {
    console.log(`  ❌ GREEN FAILED: ${greenResult.error}`);
  }
  
  if (blueResult.success && blueResult.duration < target) {
    console.log(`  ✅ BLUE PASS: ${blueResult.duration}ms < ${target}ms target`);
  } else if (blueResult.success) {
    console.log(`  ⚠️ BLUE SLOW: ${blueResult.duration}ms > ${target}ms target`);
  } else {
    console.log(`  ❌ BLUE FAILED: ${blueResult.error}`);
  }

  console.log('');
  console.log('🏁 Recommendation:');
  console.log('=' + '='.repeat(70));
  
  if (greenResult.success && greenResult.duration < target && greenResult.resultCount > 0) {
    console.log('  ✅ GREEN is ready for production!');
    console.log('  ');
    console.log('  Next steps:');
    console.log('    1. Test in browser (http://localhost:3000)');
    console.log('    2. Validate user experience (<2s response)');
    console.log('    3. Switch production when confident:');
    console.log('       - Update .env: USE_OPTIMIZED_BIGQUERY=true');
    console.log('       - Or deploy with env var override');
  } else if (greenResult.success && greenResult.duration < blueResult.duration) {
    console.log('  ⚠️ GREEN is faster but above target');
    console.log('  💡 Consider creating vector index for better cold-start performance');
  } else if (!greenResult.success && greenResult.error?.includes('No sources')) {
    console.log('  ℹ️ Agent has no sources assigned - expected behavior');
    console.log('  💡 Test with an agent that has documents uploaded');
  } else {
    console.log('  ⚠️ Review results above for issues');
  }

  console.log('');
  process.exit(greenResult.success ? 0 : 1);
}

runBenchmark().catch(console.error);

