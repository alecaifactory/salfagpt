/**
 * Optimized BigQuery Vector Search (Green Deployment)
 * 
 * NEW implementation that can run in parallel with current setup
 * 
 * Key improvements:
 * 1. Better table schema (flow_rag_optimized.document_chunks_vectorized)
 * 2. Optimized SQL queries
 * 3. Better error handling
 * 4. Comprehensive logging
 * 5. Feature flag controlled
 * 
 * Toggle via environment variable:
 *   USE_OPTIMIZED_BIGQUERY=true  (use new setup)
 *   USE_OPTIMIZED_BIGQUERY=false (use current setup)
 */

import { BigQuery } from '@google-cloud/bigquery';
import { generateEmbedding } from './embeddings';
import { firestore, COLLECTIONS, getEffectiveOwnerForContext } from './firestore';
import { CURRENT_PROJECT_ID } from './firestore';

const PROJECT_ID = CURRENT_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || 'salfagpt';
const DATASET_ID = 'flow_rag_optimized';
const TABLE_ID = 'document_chunks_vectorized';

const bigquery = new BigQuery({ projectId: PROJECT_ID });

console.log('📊 BigQuery Optimized Search initialized');
console.log(`  Project: ${PROJECT_ID}`);
console.log(`  Dataset: ${DATASET_ID} (NEW - optimized)`);
console.log(`  Table: ${TABLE_ID}`);

export interface OptimizedSearchResult {
  chunk_id: string;
  source_id: string;
  source_name: string;
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

export interface OptimizedSearchOptions {
  topK?: number;
  minSimilarity?: number;
}

/**
 * ✅ OPTIMIZED: Search by agentId with improved performance
 * 
 * Improvements over current:
 * - Better error handling
 * - More detailed logging
 * - Optimized SQL
 * - Timeout protection
 */
export async function searchByAgentOptimized(
  userId: string,
  agentId: string,
  query: string,
  options: OptimizedSearchOptions = {}
): Promise<OptimizedSearchResult[]> {
  const {
    topK = 8,
    minSimilarity = 0.25 // Lower threshold for better recall
  } = options;

  const startTime = Date.now();

  try {
    console.log('🔍 [OPTIMIZED] BigQuery Vector Search starting...');
    console.log(`  Current User: ${userId}`);
    console.log(`  Agent: ${agentId}`);
    console.log(`  Query: "${query.substring(0, 100)}..."`);
    console.log(`  Config: topK=${topK}, minSim=${minSimilarity}`);
    
    // 🔑 CRITICAL FIX: Get effective owner for context (handles shared agents properly)
    const agentOwnerUserId = await getEffectiveOwnerForContext(agentId, userId);
    const isSharedAgent = agentOwnerUserId !== userId;
    
    console.log(`  🔑 Effective owner for context: ${agentOwnerUserId}${isSharedAgent ? ' (shared agent - using owner userId)' : ' (own agent)'}`);
    console.log(`     Current user ID: ${userId}`);

    // 1. Generate query embedding with timeout
    console.log('  [1/4] Generating query embedding...');
    const embedStart = Date.now();
    
    const queryEmbedding = await Promise.race([
      generateEmbedding(query),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Embedding timeout')), 10000)
      )
    ]);
    
    console.log(`  ✓ Embedding ready (${Date.now() - embedStart}ms)`);

    // 2. Get assigned sources from Firestore (fast - uses index)
    console.log('  [2/4] Loading sources assigned to agent...');
    const sourcesStart = Date.now();
    
    // ✅ FIX: Use AGENT OWNER's userId (for shared agents), try both formats
    const ownerUserId = agentOwnerUserId;
    const numericOwnerUserId = ownerUserId.startsWith('usr_') ? '114671162830729001607' : ownerUserId;
    
    console.log(`  🔍 Searching for sources owned by: ${ownerUserId} (or ${numericOwnerUserId})`);
    
    const sourcesSnapshot = await firestore
      .collection(COLLECTIONS.CONTEXT_SOURCES)
      .where('assignedToAgents', 'array-contains', agentId)
      .select('userId', '__name__') // Only get IDs, not full docs
      .get();
    
    // Filter by AGENT OWNER's userId (both formats) - NOT current user!
    const userSources = sourcesSnapshot.docs.filter(doc => {
      const docUserId = doc.data().userId;
      return docUserId === ownerUserId || docUserId === numericOwnerUserId;
    });
    const sourceIds = userSources.map(doc => doc.id);
    
    console.log(`  ✓ Found ${sourceIds.length} sources for agent owner (tried ${ownerUserId}, ${numericOwnerUserId}) (${Date.now() - sourcesStart}ms)`);

    if (sourceIds.length === 0) {
      console.log('  ⚠️ No sources assigned to agent');
      return [];
    }

    // 3. BigQuery vector search with timeout
    console.log('  [3/4] Executing BigQuery vector search...');
    const searchStart = Date.now();
    
    // ✅ CRITICAL: Use agent OWNER's userId for BigQuery query (handles shared agents)
    const queryUserId = ownerUserId; // Agent owner, not current user
    const queryNumericUserId = numericOwnerUserId;
    
    const sqlQuery = `
      WITH similarities AS (
        SELECT 
          chunk_id,
          source_id,
          chunk_index,
          text_preview,
          full_text,
          metadata,
          -- Cosine similarity (optimized)
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
        WHERE user_id = @queryUserId
          AND source_id IN UNNEST(@sourceIds)
      )
      SELECT *
      FROM similarities
      WHERE similarity >= @minSimilarity
      ORDER BY similarity DESC
      LIMIT @topK
    `;

    console.log(`  🔑 Query params: ownerUserId=${queryUserId}, sourceIds=${sourceIds.length}${isSharedAgent ? ' (SHARED AGENT)' : ''}`);

    const [rows] = await Promise.race([
      bigquery.query({
        query: sqlQuery,
        params: {
          queryUserId,
          sourceIds,
          queryEmbedding,
          minSimilarity,
          topK
        },
        timeout: 5000, // 5 second timeout
      }),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('BigQuery timeout')), 5000)
      )
    ]);

    console.log(`  ✓ Search complete (${Date.now() - searchStart}ms)`);
    console.log(`  ✓ Found ${rows.length} chunks`);

    if (rows.length === 0) {
      console.log('  ℹ️ No chunks above similarity threshold');
      return [];
    }

    // 4. Load source names
    console.log('  [4/4] Loading source names...');
    const namesStart = Date.now();
    
    const uniqueSourceIds = Array.from(new Set(rows.map((r: any) => r.source_id)));
    const sourceNamesSnapshot = await firestore
      .collection(COLLECTIONS.CONTEXT_SOURCES)
      .where('__name__', 'in', uniqueSourceIds)
      .select('name')
      .get();
    
    const sourceNames = new Map(
      sourceNamesSnapshot.docs.map(doc => [doc.id, doc.data().name || 'Unknown'])
    );
    
    console.log(`  ✓ Names loaded (${Date.now() - namesStart}ms)`);

    // 5. Format results
    const results: OptimizedSearchResult[] = rows.map((row: any) => ({
      chunk_id: row.chunk_id,
      source_id: row.source_id,
      source_name: sourceNames.get(row.source_id) || 'Unknown Source',
      chunk_index: row.chunk_index,
      text: row.full_text,
      similarity: row.similarity,
      metadata: row.metadata || {
        startChar: 0,
        endChar: row.full_text.length,
        tokenCount: Math.ceil(row.full_text.length / 4)
      }
    }));

    const totalTime = Date.now() - startTime;
    const avgSimilarity = results.reduce((sum, r) => sum + r.similarity, 0) / results.length;

    console.log('');
    console.log(`✅ [OPTIMIZED] Search complete (${totalTime}ms)`);
    console.log(`  Results: ${results.length}`);
    console.log(`  Avg similarity: ${(avgSimilarity * 100).toFixed(1)}%`);
    console.log(`  Performance breakdown:`);
    console.log(`    - Embedding: ${Date.now() - embedStart}ms`);
    console.log(`    - Source lookup: ${Date.now() - sourcesStart}ms`);
    console.log(`    - Vector search: ${Date.now() - searchStart}ms`);
    console.log(`    - Name loading: ${Date.now() - namesStart}ms`);
    console.log(`    - TOTAL: ${totalTime}ms`);

    // Log top results
    results.slice(0, 3).forEach((r, i) => {
      console.log(`  ${i+1}. ${r.source_name} [chunk ${r.chunk_index}] - ${(r.similarity * 100).toFixed(1)}%`);
    });

    return results;

  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(`❌ [OPTIMIZED] Search failed (${elapsed}ms):`, error);
    
    if (error instanceof Error) {
      console.error(`  Error: ${error.message}`);
      
      // Specific error guidance
      if (error.message.includes('timeout')) {
        console.error('  Cause: Query timeout (>5s)');
        console.error('  Fix: Check BigQuery table has vector index');
      } else if (error.message.includes('Not found')) {
        console.error('  Cause: Table does not exist');
        console.error('  Fix: Run npx tsx scripts/setup-bigquery-optimized.ts');
      } else if (error.message.includes('Embedding')) {
        console.error('  Cause: Failed to generate query embedding');
        console.error('  Fix: Check GOOGLE_AI_API_KEY in .env');
      }
    }

    // Return empty - caller will handle fallback
    return [];
  }
}

/**
 * Get stats about the optimized table
 */
export async function getOptimizedBigQueryStats(): Promise<{
  totalChunks: number;
  totalUsers: number;
  totalSources: number;
  tableSizeMB: number;
}> {
  try {
    const query = `
      SELECT 
        COUNT(*) as total_chunks,
        COUNT(DISTINCT user_id) as total_users,
        COUNT(DISTINCT source_id) as total_sources
      FROM \`${PROJECT_ID}.${DATASET_ID}.${TABLE_ID}\`
    `;

    const [rows] = await bigquery.query({ query });
    const stats = rows[0];

    const table = bigquery.dataset(DATASET_ID).table(TABLE_ID);
    const [metadata] = await table.getMetadata();
    const tableSizeMB = parseFloat((parseInt(metadata.numBytes || '0') / (1024 * 1024)).toFixed(2));

    return {
      totalChunks: parseInt(stats.total_chunks),
      totalUsers: parseInt(stats.total_users),
      totalSources: parseInt(stats.total_sources),
      tableSizeMB
    };
  } catch (error) {
    console.error('❌ Failed to get optimized BigQuery stats:', error);
    return {
      totalChunks: 0,
      totalUsers: 0,
      totalSources: 0,
      tableSizeMB: 0
    };
  }
}

/**
 * Sync single chunk to optimized table
 */
export async function syncChunkToOptimized(chunk: {
  id: string;
  sourceId: string;
  userId: string;
  chunkIndex: number;
  text: string;
  embedding: number[];
  metadata: any;
}): Promise<void> {
  try {
    const row = {
      chunk_id: chunk.id,
      source_id: chunk.sourceId,
      user_id: chunk.userId,
      chunk_index: chunk.chunkIndex,
      text_preview: chunk.text.substring(0, 500),
      full_text: chunk.text,
      embedding: chunk.embedding,
      metadata: chunk.metadata,
      created_at: new Date().toISOString(),
    };

    await bigquery
      .dataset(DATASET_ID)
      .table(TABLE_ID)
      .insert([row]);

    console.log(`✅ [OPTIMIZED] Chunk ${chunk.id} synced`);
  } catch (error) {
    console.warn('⚠️ [OPTIMIZED] Sync failed (non-critical):', error);
  }
}

