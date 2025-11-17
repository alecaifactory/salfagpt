/**
 * Tim Vector Store
 * Create and search private vector stores for Tim sessions
 * 
 * Created: 2025-11-17
 * Purpose: Semantic search across all session diagnostics
 */

import { BigQuery } from '@google-cloud/bigquery';
import { GoogleGenAI } from '@google/genai';
import { firestore } from './firestore';

// ============================================================================
// CONFIGURATION
// ============================================================================

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'salfagpt';
const DATASET_ID = 'flow_data';
const TABLE_ID = 'tim_session_vectors';

const bigquery = new BigQuery({ projectId: PROJECT_ID });

const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY ||
  (typeof import.meta !== 'undefined' && import.meta.env?.GOOGLE_AI_API_KEY ? import.meta.env.GOOGLE_AI_API_KEY : undefined);

const genAI = new GoogleGenAI({ apiKey: GOOGLE_AI_API_KEY || '' });

// ============================================================================
// EMBEDDING GENERATION
// ============================================================================

/**
 * Generate embedding for text using Gemini
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const result = await genAI.models.embedContent({
      model: 'text-embedding-004',
      content: text
    });
    
    return result.embedding?.values || [];
    
  } catch (error) {
    console.error('❌ Failed to generate embedding:', error);
    return [];
  }
}

// ============================================================================
// CHUNKING STRATEGY
// ============================================================================

interface SessionChunk {
  sessionId: string;
  userId: string;
  chunkIndex: number;
  chunkType: string;
  chunkText: string;
  chunkData: any;
  embedding: number[];
  timestamp: Date;
  importance: string;
  tags: string[];
  accessLevel: string;
  organizationId?: string;
}

/**
 * Create searchable chunks from session data
 */
export async function createSessionEmbeddings(
  sessionId: string,
  sessionData: any
): Promise<number> {
  console.log('🧠 Creating embeddings for session:', sessionId);
  
  const chunks: SessionChunk[] = [];
  
  // 1. Screenshot chunks
  if (sessionData.recording?.screenshots) {
    for (const screenshot of sessionData.recording.screenshots) {
      const text = `Screenshot ${screenshot.sequenceNumber} at ${screenshot.timestamp.toISOString()}: ${screenshot.uiState}. 
        Trigger: ${screenshot.trigger}. 
        Element: ${screenshot.elementInFocus || 'none'}.
        Filename: ${screenshot.filename}`;
      
      chunks.push({
        sessionId,
        userId: sessionData.userId,
        chunkIndex: chunks.length,
        chunkType: 'screenshot',
        chunkText: text,
        chunkData: screenshot,
        embedding: await generateEmbedding(text),
        timestamp: screenshot.timestamp,
        importance: screenshot.trigger === 'error' ? 'critical' : 'medium',
        tags: ['screenshot', screenshot.trigger],
        accessLevel: 'admin',
        organizationId: sessionData.organizationId
      });
    }
  }
  
  // 2. Console log chunks (errors and warnings only)
  if (sessionData.capturedData?.consoleLogs) {
    const importantLogs = sessionData.capturedData.consoleLogs.filter((log: any) =>
      log.level === 'error' || log.level === 'warn'
    );
    
    for (const log of importantLogs) {
      const text = `Console ${log.level}: ${log.message}. 
        Timestamp: ${log.timestamp.toISOString()}.
        ${log.stack ? `Stack trace available.` : ''}`;
      
      chunks.push({
        sessionId,
        userId: sessionData.userId,
        chunkIndex: chunks.length,
        chunkType: 'console',
        chunkText: text,
        chunkData: log,
        embedding: await generateEmbedding(text),
        timestamp: log.timestamp,
        importance: log.level === 'error' ? 'critical' : 'high',
        tags: ['console', log.level],
        accessLevel: 'admin',
        organizationId: sessionData.organizationId
      });
    }
  }
  
  // 3. Network request chunks (failures only)
  if (sessionData.capturedData?.networkRequests) {
    const failures = sessionData.capturedData.networkRequests.filter((req: any) =>
      req.status >= 400
    );
    
    for (const req of failures) {
      const text = `Network ${req.method} ${req.url} failed with ${req.status} ${req.statusText}. 
        Duration: ${req.duration}ms. 
        Timestamp: ${req.timestamp.toISOString()}.`;
      
      chunks.push({
        sessionId,
        userId: sessionData.userId,
        chunkIndex: chunks.length,
        chunkType: 'network',
        chunkText: text,
        chunkData: req,
        embedding: await generateEmbedding(text),
        timestamp: req.timestamp,
        importance: req.status >= 500 ? 'critical' : 'high',
        tags: ['network', `status_${req.status}`],
        accessLevel: 'admin',
        organizationId: sessionData.organizationId
      });
    }
  }
  
  // 4. AI Analysis chunk (always important)
  if (sessionData.aiAnalysis) {
    const text = `AI Analysis: ${sessionData.aiAnalysis.rootCause}. 
      Severity: ${sessionData.aiAnalysis.severity}. 
      Affected: ${sessionData.aiAnalysis.affectedUsers}. 
      Fix: ${sessionData.aiAnalysis.recommendedFix}. 
      Effort: ${sessionData.aiAnalysis.estimatedEffort}.`;
    
    chunks.push({
      sessionId,
      userId: sessionData.userId,
      chunkIndex: chunks.length,
      chunkType: 'analysis',
      chunkText: text,
      chunkData: sessionData.aiAnalysis,
      embedding: await generateEmbedding(text),
      timestamp: new Date(),
      importance: sessionData.aiAnalysis.severity === 'critical' ? 'critical' : 'high',
      tags: ['analysis', sessionData.aiAnalysis.severity],
      accessLevel: 'admin',
      organizationId: sessionData.organizationId
    });
  }
  
  // 5. Save all chunks to BigQuery
  if (chunks.length > 0) {
    await saveToBigQuery(chunks);
  }
  
  // 6. Update session with vector store info
  await firestore.collection('tim_test_sessions').doc(sessionId).update({
    vectorStore: {
      embeddingId: sessionId,
      chunkCount: chunks.length,
      indexed: true,
      indexedAt: new Date(),
      vectorTable: `${PROJECT_ID}.${DATASET_ID}.${TABLE_ID}`
    }
  });
  
  console.log(`✅ Created ${chunks.length} embeddings for session ${sessionId}`);
  return chunks.length;
}

// ============================================================================
// BIGQUERY OPERATIONS
// ============================================================================

async function saveToBigQuery(chunks: SessionChunk[]): Promise<void> {
  try {
    const rows = chunks.map(chunk => ({
      session_id: chunk.sessionId,
      user_id: chunk.userId,
      chunk_index: chunk.chunkIndex,
      chunk_type: chunk.chunkType,
      chunk_text: chunk.chunkText,
      chunk_data: chunk.chunkData,
      embedding: chunk.embedding,
      timestamp: chunk.timestamp,
      importance: chunk.importance,
      tags: chunk.tags,
      access_level: chunk.accessLevel,
      organization_id: chunk.organizationId,
      created_at: new Date(),
      source: 'localhost' // or 'production'
    }));
    
    await bigquery
      .dataset(DATASET_ID)
      .table(TABLE_ID)
      .insert(rows);
    
    console.log(`✅ Saved ${chunks.length} chunks to BigQuery`);
    
  } catch (error) {
    console.error('❌ Failed to save to BigQuery:', error);
    // Non-blocking - session data still in Firestore
  }
}

// ============================================================================
// SEMANTIC SEARCH
// ============================================================================

/**
 * Search Tim sessions using semantic similarity
 */
export async function searchTimSessions(
  query: string,
  filters: {
    userId?: string;
    organizationId?: string;
    dateRange?: { start: Date; end: Date };
    importance?: string[];
    chunkTypes?: string[];
  } = {}
): Promise<any[]> {
  console.log('🔍 Searching Tim sessions:', query);
  
  try {
    // Generate embedding for search query
    const queryEmbedding = await generateEmbedding(query);
    
    // Build SQL with filters
    const whereClauses = [
      'access_level IN ("admin", "superadmin")'
    ];
    
    if (filters.userId) whereClauses.push(`user_id = '${filters.userId}'`);
    if (filters.organizationId) whereClauses.push(`organization_id = '${filters.organizationId}'`);
    if (filters.importance) whereClauses.push(`importance IN (${filters.importance.map(i => `'${i}'`).join(',')})`);
    if (filters.chunkTypes) whereClauses.push(`chunk_type IN (${filters.chunkTypes.map(t => `'${t}'`).join(',')})`);
    
    const sql = `
      SELECT 
        session_id,
        user_id,
        chunk_index,
        chunk_type,
        chunk_text,
        chunk_data,
        timestamp,
        importance,
        tags,
        (1 - ML.DISTANCE(embedding, @query_embedding, 'COSINE')) AS similarity
      FROM \`${PROJECT_ID}.${DATASET_ID}.${TABLE_ID}\`
      WHERE ${whereClauses.join(' AND ')}
      ORDER BY similarity DESC
      LIMIT 50
    `;
    
    const [rows] = await bigquery.query({
      query: sql,
      params: {
        query_embedding: queryEmbedding
      }
    });
    
    console.log(`✅ Found ${rows.length} matching chunks`);
    return rows;
    
  } catch (error) {
    console.error('❌ Search failed:', error);
    return [];
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  createSessionEmbeddings,
  searchTimSessions,
  generateEmbedding
};

