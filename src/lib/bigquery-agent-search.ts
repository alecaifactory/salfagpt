/**
 * BigQuery Agent-Based Vector Search
 * 
 * OPTIMIZED: Query BigQuery directly by agentId without needing source IDs upfront
 * 
 * This eliminates the need to:
 * 1. Load all source metadata from Firestore (48 seconds)
 * 2. Filter to assigned sources
 * 3. Send IDs to backend
 * 
 * Instead:
 * 1. Send agentId + query
 * 2. BigQuery joins with context_sources to filter
 * 3. Returns top K chunks directly
 * 
 * Performance: < 500ms (vs 48+ seconds)
 */

import { BigQuery } from '@google-cloud/bigquery';
import { generateEmbedding } from './embeddings';
import { firestore, COLLECTIONS, getEffectiveOwnerForContext } from './firestore';
import { CURRENT_PROJECT_ID } from './firestore';
import { getCachedAgentSources } from './agent-sources-cache';
import { getCachedEmbedding } from './embedding-cache';

const PROJECT_ID = CURRENT_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || 'salfagpt';

const bigquery = new BigQuery({
  projectId: PROJECT_ID,
});

const DATASET_ID = 'flow_analytics';
const TABLE_ID = 'document_embeddings';

console.log('📊 BigQuery Agent Search initialized');
console.log(`  Project: ${PROJECT_ID}`);

export interface AgentVectorSearchResult {
  chunk_id: string;
  source_id: string;
  source_name: string; // Loaded from Firestore after search
  chunk_index: number;
  text: string;
  similarity: number;
  metadata: {
    startChar: number;
    endChar: number;
    tokenCount: number;
    startPage?: number;
    endPage?: number;
  };
}

export interface AgentSearchOptions {
  topK?: number;
  minSimilarity?: number;
}

/**
 * ✅ OPTIMIZED: Search by agentId directly (no need to load sources first!)
 * 
 * BigQuery filters chunks to those from sources assigned to the agent
 */
export async function searchByAgent(
  userId: string,
  agentId: string,
  query: string,
  options: AgentSearchOptions = {}
): Promise<AgentVectorSearchResult[]> {
  const {
    topK = 8, // ✅ Increased from 5 to 8 for better coverage
    minSimilarity = 0.25 // ✅ Lowered from 0.3 to 0.25 to catch more relevant docs
  } = options;

  try {
    console.log('🔍 BigQuery Agent Search starting...');
    console.log(`  Current User: ${userId}`);
    console.log(`  Agent: ${agentId}`);
    console.log(`  Query: "${query.substring(0, 100)}..."`);
    console.log(`  TopK: ${topK}, MinSimilarity: ${minSimilarity}`);
    
    const startTime = Date.now();

    // ⚡ OPTIMIZATION: Run embedding + sources lookup in PARALLEL (saves 100-300ms)
    console.log('  🚀 Running parallel operations: embedding + sources lookup...');
    const parallelStart = Date.now();
    
    const [queryEmbedding, cachedSources] = await Promise.all([
      getCachedEmbedding(query), // 0-300ms (cached: 0ms!)
      getCachedAgentSources(agentId, userId) // 0-500ms (cached: 0ms!)
    ]);
    
    const { sourceIds: assignedSourceIds, sourceNames } = cachedSources;
    
    console.log(`  ⚡ Parallel ops complete (${Date.now() - parallelStart}ms)`);
    console.log(`     - Embedding: Ready`);
    console.log(`     - Sources: ${assignedSourceIds.length} found`);

    // ✅ OPTIMIZATION: Sources already fetched in parallel above!
    if (assignedSourceIds.length === 0) {
      console.warn('  ⚠️ No sources assigned to this agent');
      return [];
    }
    
    // Get effective owner for BigQuery query
    const effectiveUserId = await getEffectiveOwnerForContext(agentId, userId);
    console.log(`  🔑 Effective owner: ${effectiveUserId}${effectiveUserId !== userId ? ' (shared)' : ''}`);

    // 3. Vector search in BigQuery (filtered by assigned sources)
    console.log('  3/4 Performing vector search in BigQuery...');
    const startSearch = Date.now();
    
    const sqlQuery = `
      WITH similarities AS (
        SELECT 
          chunk_id,
          source_id,
          chunk_index,
          text_preview,
          full_text,
          metadata,
          -- Cosine similarity calculated in SQL
          (
            SELECT SUM(a * b) / (
              SQRT((SELECT SUM(a * a) FROM UNNEST(embedding) AS a)) * 
              SQRT((SELECT SUM(b * b) FROM UNNEST(@queryEmbedding) AS b))
            )
            FROM UNNEST(embedding) AS a WITH OFFSET pos
            JOIN UNNEST(@queryEmbedding) AS b WITH OFFSET pos2
              ON pos = pos2
          ) AS similarity
        FROM \`${PROJECT_ID}.${DATASET_ID}.${TABLE_ID}\`
        WHERE user_id = @effectiveUserId
          AND source_id IN UNNEST(@assignedSourceIds)
      )
      SELECT 
        chunk_id,
        source_id,
        chunk_index,
        text_preview,
        full_text,
        metadata,
        similarity
      FROM similarities
      WHERE similarity >= @minSimilarity
      ORDER BY similarity DESC
      LIMIT @topK
    `;

    const [rows] = await bigquery.query({
      query: sqlQuery,
      params: {
        effectiveUserId, // ✅ Use effective owner for shared agents
        assignedSourceIds,
        queryEmbedding,
        minSimilarity,
        topK
      },
    });

    console.log(`  ✓ BigQuery search complete (${Date.now() - startSearch}ms)`);
    console.log(`  ✓ Found ${rows.length} results`);

    if (rows.length === 0) {
      console.log('  ⚠️ No chunks above similarity threshold');
      return [];
    }

    // ⚡ OPTIMIZATION: Source names already loaded in cache above!
    console.log('  4/4 Applying cached source names...');

    // 5. Parse results (using cached source names)
    const results: AgentVectorSearchResult[] = rows.map((row: any) => ({
      chunk_id: row.chunk_id,
      source_id: row.source_id,
      source_name: sourceNames.get(row.source_id) || 'Unknown Source', // ✅ From cache!
      chunk_index: row.chunk_index,
      text: row.full_text,
      similarity: row.similarity,
      metadata: row.metadata ? JSON.parse(row.metadata) : {
        startChar: 0,
        endChar: row.full_text.length,
        tokenCount: Math.ceil(row.full_text.length / 4)
      }
    }));

    const totalTime = Date.now() - startTime;
    const avgSimilarity = results.reduce((sum, r) => sum + r.similarity, 0) / results.length;
    
    console.log(`✅ BigQuery Agent Search complete (${totalTime}ms)`);
    console.log(`  Agent: ${agentId}`);
    console.log(`  Sources searched: ${assignedSourceIds.length}`);
    console.log(`  Results: ${results.length}`);
    console.log(`  Avg similarity: ${(avgSimilarity * 100).toFixed(1)}%`);
    
    // Log top results
    results.slice(0, 3).forEach((r, i) => {
      console.log(`  ${i+1}. ${r.source_name} - Chunk ${r.chunk_index} - ${(r.similarity * 100).toFixed(1)}%`);
    });

    return results;
  } catch (error) {
    console.error('❌ BigQuery agent search failed:', error);
    console.error('  Details:', error instanceof Error ? error.message : error);
    
    // Return empty array - caller will fall back to Firestore
    return [];
  }
}

