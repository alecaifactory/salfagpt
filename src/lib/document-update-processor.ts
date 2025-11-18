/**
 * Document Update Processor
 * 
 * Processes approved document updates:
 * - Downloads new document
 * - Extracts text
 * - Chunks and vectorizes
 * - Creates new context source
 * - Updates version control
 * - Invalidates caches
 * 
 * This is the main orchestrator for the update workflow
 */

import { createContextSource, updateContextSource, getContextSource, type ContextSource } from './firestore';
import { 
  createDocumentVersion, 
  updateRequestStatus, 
  createUpdateLog,
  type DocumentUpdateRequest 
} from './document-version-control';
import { syncChunksBatchToBigQuery } from './bigquery-vector-search';
import { invalidateAgentSourcesCache } from './agent-sources-cache';
import { generateEmbedding } from './embeddings';

// ============================================================================
// Types
// ============================================================================

interface ProcessedDocument {
  text: string;
  chunks: DocumentChunk[];
  metadata: {
    pageCount?: number;
    wordCount: number;
    chunkCount: number;
    extractionMethod: string;
    hash: string;
  };
  type: ContextSource['type'];
  version: number;
}

interface DocumentChunk {
  id: string;
  sourceId: string;
  userId: string;
  chunkIndex: number;
  text: string;
  embedding: number[];
  metadata: {
    startChar: number;
    endChar: number;
    tokenCount: number;
    startPage?: number;
    endPage?: number;
  };
}

// ============================================================================
// Main Processor
// ============================================================================

/**
 * Process an approved document update
 * 
 * This handles the complete update workflow:
 * 1. Download document
 * 2. Extract text
 * 3. Chunk and vectorize
 * 4. Create new context source (versioned)
 * 5. Update version control
 * 6. Mark old version as superseded
 * 7. Invalidate caches
 * 8. Log completion
 */
export async function processDocumentUpdate(
  request: DocumentUpdateRequest,
  approvedBy: string
): Promise<string> {
  console.log(`🔄 Processing document update: ${request.id}`);
  console.log(`   Original: ${request.originalDocument.name}`);
  console.log(`   New URL:  ${request.proposedUpdate.url}`);
  console.log(`   Approved by: ${approvedBy}`);
  
  try {
    // 1. Update request status to processing
    await updateRequestStatus(request.id, 'processing');
    
    await createUpdateLog({
      updateRequestId: request.id,
      sourceId: request.sourceId,
      action: 'update_processing',
      userId: request.userId,
      details: {
        approvedBy,
        url: request.proposedUpdate.url
      }
    });
    
    // 2. Download and process document
    console.log(`   [1/7] Downloading document...`);
    const document = await downloadDocument(request.proposedUpdate.url);
    
    // 3. Extract text
    console.log(`   [2/7] Extracting text...`);
    const extractedText = await extractText(document);
    
    // 4. Chunk document
    console.log(`   [3/7] Chunking document...`);
    const chunks = await chunkDocument(extractedText);
    
    // 5. Vectorize chunks
    console.log(`   [4/7] Vectorizing ${chunks.length} chunks...`);
    const vectorizedChunks = await vectorizeChunks(chunks, request.userId);
    
    // 6. Get old version info
    const oldSource = await getContextSource(request.sourceId);
    const oldVersion = oldSource?.metadata?.version || 1;
    const newVersion = oldVersion + 1;
    
    // 7. Create new context source (versioned)
    console.log(`   [5/7] Creating new context source (v${newVersion})...`);
    
    const versionTag = request.proposedUpdate.date.toISOString().split('T')[0];
    const newSourceName = `${request.originalDocument.name} (${versionTag})`;
    
    const newSource = await createContextSource(request.userId, {
      name: newSourceName,
      type: determineDocumentType(request.proposedUpdate.url),
      url: request.proposedUpdate.url,
      extractedData: extractedText.text,
      metadata: {
        ...extractedText.metadata,
        updateType: 'internet_refresh',
        originalSourceId: request.sourceId,
        version: newVersion,
        versionTag,
        approvedBy,
        updateRequestId: request.id,
        updatedFrom: request.originalDocument.url,
        updateDate: request.proposedUpdate.date,
        estimatedChanges: request.proposedUpdate.estimatedChanges
      },
      assignedToAgents: [request.agentId],
      tags: [
        ...(request.domainId ? [`domain:${request.domainId}`] : []),
        'auto-update',
        'latest',
        versionTag,
        `v${newVersion}`
      ],
      domainId: request.domainId
    });
    
    console.log(`      ✅ New source created: ${newSource.id}`);
    
    // 8. Sync chunks to BigQuery
    console.log(`   [6/7] Syncing ${vectorizedChunks.length} chunks to BigQuery...`);
    await syncChunksBatchToBigQuery(
      vectorizedChunks.map(chunk => ({
        ...chunk,
        sourceId: newSource.id
      }))
    );
    
    // 9. Create version record
    console.log(`   [7/7] Creating version record...`);
    await createDocumentVersion({
      sourceId: newSource.id,
      parentSourceId: request.sourceId,
      version: newVersion,
      versionTag,
      date: request.proposedUpdate.date,
      url: request.proposedUpdate.url,
      isLatest: true,
      supersedes: request.sourceId,
      metadata: {
        updateType: 'internet_refresh',
        changes: request.proposedUpdate.estimatedChanges,
        approvedBy,
        updateRequestId: request.id,
        originalUploadDate: oldSource?.addedAt
      },
      tags: [
        ...(request.domainId ? [`domain:${request.domainId}`] : []),
        'auto-update',
        'latest'
      ],
      userId: request.userId,
      domainId: request.domainId,
      createdBy: approvedBy
    });
    
    // 10. Update old source to mark as superseded
    console.log(`   Marking old version as superseded...`);
    const oldTags = oldSource?.tags || [];
    const newTags = oldTags.filter(t => t !== 'latest').concat('superseded');
    
    await updateContextSource(request.sourceId, {
      tags: newTags,
      metadata: {
        ...oldSource?.metadata,
        supersededBy: newSource.id,
        supersededAt: new Date().toISOString()
      }
    });
    
    // 11. Invalidate cache (so next search uses new source)
    console.log(`   Invalidating agent sources cache...`);
    invalidateAgentSourcesCache(request.agentId, request.userId);
    
    // 12. Update request status to completed
    await updateRequestStatus(request.id, 'completed', {
      newSourceId: newSource.id,
      processedAt: new Date()
    });
    
    // 13. Log completion
    await createUpdateLog({
      updateRequestId: request.id,
      sourceId: newSource.id,
      action: 'update_completed',
      userId: request.userId,
      details: {
        oldSourceId: request.sourceId,
        newSourceId: newSource.id,
        oldVersion,
        newVersion,
        chunksCreated: vectorizedChunks.length,
        approvedBy,
        versionTag
      }
    });
    
    console.log(`✅ Document update completed successfully!`);
    console.log(`   Old source: ${request.sourceId} (v${oldVersion})`);
    console.log(`   New source: ${newSource.id} (v${newVersion})`);
    console.log(`   Chunks: ${vectorizedChunks.length}`);
    
    return newSource.id;
    
  } catch (error) {
    console.error(`❌ Failed to process document update:`, error);
    
    // Update request status to failed
    await updateRequestStatus(request.id, 'failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    // Log failure
    await createUpdateLog({
      updateRequestId: request.id,
      sourceId: request.sourceId,
      action: 'update_failed',
      userId: request.userId,
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    
    throw error;
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Download document from URL
 */
async function downloadDocument(url: string): Promise<{
  content: ArrayBuffer;
  contentType: string;
  size: number;
}> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'SalfaGPT Document Update Bot/1.0'
    }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const content = await response.arrayBuffer();
  const contentType = response.headers.get('content-type') || 'application/octet-stream';
  const size = content.byteLength;
  
  console.log(`      Downloaded ${(size / 1024).toFixed(2)} KB (${contentType})`);
  
  return { content, contentType, size };
}

/**
 * Extract text from document
 * 
 * TODO: Implement actual text extraction for PDFs, Word docs, etc.
 * For now, this is a placeholder that assumes plain text
 */
async function extractText(document: {
  content: ArrayBuffer;
  contentType: string;
  size: number;
}): Promise<{
  text: string;
  metadata: {
    pageCount?: number;
    wordCount: number;
    extractionMethod: string;
    hash: string;
  };
}> {
  // For now, assume it's plain text
  // TODO: Add support for:
  // - application/pdf (use pdf-parse or similar)
  // - application/vnd.openxmlformats-officedocument.wordprocessingml.document (use mammoth)
  // - text/html (use cheerio or similar)
  
  const text = new TextDecoder().decode(document.content);
  const wordCount = text.split(/\s+/).length;
  
  // Calculate hash
  const hashBuffer = await crypto.subtle.digest('SHA-256', document.content);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return {
    text,
    metadata: {
      wordCount,
      extractionMethod: 'plain_text',
      hash
    }
  };
}

/**
 * Chunk document into smaller pieces
 */
async function chunkDocument(extracted: {
  text: string;
  metadata: any;
}): Promise<Array<{
  text: string;
  startChar: number;
  endChar: number;
  startPage?: number;
  endPage?: number;
}>> {
  const CHUNK_SIZE = 1000; // characters
  const OVERLAP = 200; // characters overlap
  
  const chunks: Array<{
    text: string;
    startChar: number;
    endChar: number;
  }> = [];
  
  let startChar = 0;
  
  while (startChar < extracted.text.length) {
    const endChar = Math.min(startChar + CHUNK_SIZE, extracted.text.length);
    const chunkText = extracted.text.substring(startChar, endChar);
    
    chunks.push({
      text: chunkText,
      startChar,
      endChar
    });
    
    startChar += CHUNK_SIZE - OVERLAP;
  }
  
  console.log(`      Created ${chunks.length} chunks (${CHUNK_SIZE} chars each, ${OVERLAP} overlap)`);
  
  return chunks;
}

/**
 * Vectorize chunks (generate embeddings)
 */
async function vectorizeChunks(
  chunks: Array<{
    text: string;
    startChar: number;
    endChar: number;
  }>,
  userId: string
): Promise<DocumentChunk[]> {
  const vectorizedChunks: DocumentChunk[] = [];
  
  // Process chunks in batches to avoid rate limits
  const BATCH_SIZE = 10;
  
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    
    const batchResults = await Promise.all(
      batch.map(async (chunk, batchIndex) => {
        const embedding = await generateEmbedding(chunk.text);
        
        return {
          id: `chunk_${i + batchIndex}`,
          sourceId: '', // Will be set by caller
          userId,
          chunkIndex: i + batchIndex,
          text: chunk.text,
          embedding,
          metadata: {
            startChar: chunk.startChar,
            endChar: chunk.endChar,
            tokenCount: Math.ceil(chunk.text.length / 4)
          }
        };
      })
    );
    
    vectorizedChunks.push(...batchResults);
    
    // Small delay to avoid rate limits
    if (i + BATCH_SIZE < chunks.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return vectorizedChunks;
}

/**
 * Determine document type from URL
 */
function determineDocumentType(url: string): ContextSource['type'] {
  const extension = url.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'pdf':
      return 'pdf';
    case 'doc':
    case 'docx':
      return 'word';
    case 'txt':
      return 'text';
    case 'md':
      return 'text';
    case 'html':
    case 'htm':
      return 'web';
    default:
      return 'pdf'; // Default fallback
  }
}

/**
 * Calculate content hash
 */
async function hashContent(content: Uint8Array): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', content);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

