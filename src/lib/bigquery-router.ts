/**
 * BigQuery Router - Blue-Green Deployment Controller
 * 
 * Routes vector search requests to either:
 * - BLUE (current): flow_analytics.document_embeddings
 * - GREEN (optimized): flow_rag_optimized.document_chunks_vectorized
 * 
 * Routing Strategy (3 modes):
 * 
 * 1. DOMAIN-BASED (default):
 *    - localhost:3000 → GREEN (safe testing)
 *    - salfagpt.salfagestion.cl → BLUE (stable production)
 * 
 * 2. EXPLICIT FLAG:
 *    - USE_OPTIMIZED_BIGQUERY=true → Force GREEN
 *    - USE_OPTIMIZED_BIGQUERY=false → Force BLUE
 * 
 * 3. AUTO (if no flag set):
 *    - Uses domain-based routing
 * 
 * This allows:
 * 1. Safe testing in localhost without affecting production
 * 2. Instant rollback via env var override
 * 3. Gradual production rollout (change domain mapping)
 * 4. Zero-risk deployment
 */

import { searchByAgent as searchByAgentCurrent } from './bigquery-agent-search';
import { searchByAgentOptimized } from './bigquery-optimized';
import type { AgentVectorSearchResult } from './bigquery-agent-search';
import type { OptimizedSearchResult } from './bigquery-optimized';

/**
 * Determine which BigQuery setup to use based on request origin
 */
function shouldUseOptimized(requestOrigin?: string): boolean {
  // Mode 1: Explicit flag takes precedence
  const explicitFlag = process.env.USE_OPTIMIZED_BIGQUERY;
  
  if (explicitFlag === 'true') {
    console.log('  🎛️ Using GREEN (explicit flag: true)');
    return true;
  }
  
  if (explicitFlag === 'false') {
    console.log('  🎛️ Using BLUE (explicit flag: false)');
    return false;
  }
  
  // Mode 2: Domain-based routing (default)
  if (!requestOrigin) {
    // No origin available (e.g., CLI, background job)
    // Default to BLUE (safer for unknown contexts)
    console.log('  🎛️ Using BLUE (no origin, default to stable)');
    return false;
  }
  
  // Extract domain from origin
  const origin = requestOrigin.toLowerCase();
  
  // Localhost → BLUE (GREEN too slow - 30s+ vs BLUE 2-4s)
  if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
    console.log(`  🎛️ Using BLUE (localhost - GREEN optimization pending: ${origin})`);
    return false;  // ✅ Changed to BLUE
  }
  
  // Production domain → BLUE (stable)
  if (origin.includes('salfagpt.salfagestion.cl')) {
    console.log(`  🎛️ Using BLUE (production domain: ${origin})`);
    return false;
  }
  
  // Staging domain → GREEN (testing)
  if (origin.includes('staging') || origin.includes('dev')) {
    console.log(`  🎛️ Using GREEN (staging/dev domain: ${origin})`);
    return true;
  }
  
  // Unknown domain → BLUE (safer default)
  console.log(`  🎛️ Using BLUE (unknown domain: ${origin}, default to stable)`);
  return false;
}

console.log('🔀 BigQuery Router initialized');
console.log('  Routing modes:');
console.log('    1. Domain-based (default):');
console.log('       - localhost → GREEN (testing)');
console.log('       - salfagpt.salfagestion.cl → BLUE (production)');
console.log('    2. Explicit flag: USE_OPTIMIZED_BIGQUERY=true/false');
console.log('    3. Auto: Based on request origin');

/**
 * Main search function - routes to active BigQuery setup
 * 
 * Usage:
 *   import { searchByAgent } from './bigquery-router';
 *   
 *   // Option 1: Let router decide based on domain (recommended)
 *   const results = await searchByAgent(userId, agentId, query, {
 *     requestOrigin: request.headers.get('origin') // Pass origin header
 *   });
 *   
 *   // Option 2: Explicit flag overrides domain routing
 *   const results = await searchByAgent(userId, agentId, query, {
 *     forceOptimized: true // or false
 *   });
 */
export async function searchByAgent(
  userId: string,
  agentId: string,
  query: string,
  options: {
    topK?: number;
    minSimilarity?: number;
    requestOrigin?: string; // NEW: Domain for routing decision
    forceOptimized?: boolean; // NEW: Override domain routing
  } = {}
): Promise<(AgentVectorSearchResult | OptimizedSearchResult)[]> {
  
  // Determine which setup to use
  const useOptimized = options.forceOptimized !== undefined 
    ? options.forceOptimized 
    : shouldUseOptimized(options.requestOrigin);
  
  console.log(`🔀 BigQuery Routing Decision:`);
  console.log(`  Origin: ${options.requestOrigin || 'unknown'}`);
  console.log(`  Selected: ${useOptimized ? 'GREEN (optimized)' : 'BLUE (current)'}`);

  if (useOptimized) {
    // Use GREEN (new optimized setup)
    try {
      const results = await searchByAgentOptimized(userId, agentId, query, options);
      
      if (results.length > 0) {
        console.log(`✅ [GREEN] Success: ${results.length} results`);
        return results;
      }
      
      // If optimized returns 0, try current as fallback
      console.log('  ℹ️ [GREEN] returned 0 results, trying [BLUE] as safety fallback...');
      const fallbackResults = await searchByAgentCurrent(userId, agentId, query, options);
      
      if (fallbackResults.length > 0) {
        console.log(`  ✅ [BLUE] Fallback success: ${fallbackResults.length} results`);
        console.log('  ⚠️ Consider: GREEN setup may need data migration');
      }
      
      return fallbackResults;
      
    } catch (error) {
      console.error('❌ [GREEN] Failed, falling back to [BLUE]:', error);
      
      // Fall back to current setup
      return searchByAgentCurrent(userId, agentId, query, options);
    }
  } else {
    // Use BLUE (current setup)
    return searchByAgentCurrent(userId, agentId, query, options);
  }
}

/**
 * Get stats from active BigQuery setup
 */
export async function getActiveSetupStats(): Promise<{
  setup: 'current' | 'optimized';
  stats: {
    totalChunks: number;
    totalUsers: number;
    totalSources: number;
    tableSizeMB: number;
  };
}> {
  if (USE_OPTIMIZED) {
    const { getOptimizedBigQueryStats } = await import('./bigquery-optimized');
    return {
      setup: 'optimized',
      stats: await getOptimizedBigQueryStats()
    };
  } else {
    const { getBigQueryStats } = await import('./bigquery-vector-search');
    return {
      setup: 'current',
      stats: await getBigQueryStats()
    };
  }
}

/**
 * Compare performance between setups (for A/B testing)
 */
export async function compareBigQuerySetups(
  userId: string,
  agentId: string,
  query: string
): Promise<{
  current: { results: any[]; timeMs: number; error?: string };
  optimized: { results: any[]; timeMs: number; error?: string };
  winner: 'current' | 'optimized' | 'tie';
}> {
  console.log('🔬 A/B Testing: Comparing BigQuery setups...');

  // Test CURRENT setup
  const currentStart = Date.now();
  let currentResults: any[] = [];
  let currentError: string | undefined;
  
  try {
    currentResults = await searchByAgentCurrent(userId, agentId, query);
  } catch (error) {
    currentError = error instanceof Error ? error.message : String(error);
  }
  
  const currentTime = Date.now() - currentStart;

  // Test OPTIMIZED setup
  const optimizedStart = Date.now();
  let optimizedResults: any[] = [];
  let optimizedError: string | undefined;
  
  try {
    optimizedResults = await searchByAgentOptimized(userId, agentId, query);
  } catch (error) {
    optimizedError = error instanceof Error ? error.message : String(error);
  }
  
  const optimizedTime = Date.now() - optimizedStart;

  // Determine winner
  let winner: 'current' | 'optimized' | 'tie' = 'tie';
  
  if (currentError && !optimizedError) {
    winner = 'optimized';
  } else if (optimizedError && !currentError) {
    winner = 'current';
  } else if (!currentError && !optimizedError) {
    // Both succeeded - compare performance
    if (optimizedTime < currentTime * 0.8) {
      winner = 'optimized'; // 20% faster
    } else if (currentTime < optimizedTime * 0.8) {
      winner = 'current';
    }
  }

  console.log('');
  console.log('📊 Comparison Results:');
  console.log(`  CURRENT:   ${currentTime}ms, ${currentResults.length} results${currentError ? ` ❌ ${currentError}` : ' ✅'}`);
  console.log(`  OPTIMIZED: ${optimizedTime}ms, ${optimizedResults.length} results${optimizedError ? ` ❌ ${optimizedError}` : ' ✅'}`);
  console.log(`  Winner: ${winner.toUpperCase()}`);

  return {
    current: { results: currentResults, timeMs: currentTime, error: currentError },
    optimized: { results: optimizedResults, timeMs: optimizedTime, error: optimizedError },
    winner
  };
}

/**
 * Export for backward compatibility
 */
export type { AgentVectorSearchResult } from './bigquery-agent-search';
export type { OptimizedSearchResult };

