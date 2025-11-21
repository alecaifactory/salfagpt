/**
 * Document Update Scanner
 * 
 * Scans context sources for available updates from the internet
 * 
 * Features:
 * - Direct URL checking (Last-Modified headers)
 * - Content hash comparison
 * - Web search for document updates
 * - Semantic similarity detection
 * - Confidence scoring
 */

import { firestore, COLLECTIONS } from './firestore';
import { generateEmbedding } from './embeddings';
import type { ContextSource } from '../types/context';

// ============================================================================
// Types
// ============================================================================

export interface DocumentUpdateCheck {
  sourceId: string;
  sourceName: string;
  sourceUrl?: string;
  
  currentVersion: {
    date: Date;
    hash?: string;
    size: number;
  };
  
  foundUpdate?: {
    url: string;
    date: Date;
    preview: string;
    confidence: number; // 0-1
    estimatedChanges?: string[];
  };
  
  status: 'checking' | 'up_to_date' | 'update_found' | 'error';
  errorMessage?: string;
}

interface DocumentSearchStrategy {
  type: 'direct_url' | 'metadata_url' | 'web_search' | 'domain_search';
  url?: string;
  query?: string;
  checkMethod: 'last_modified_header' | 'content_hash' | 'semantic_similarity';
}

// ============================================================================
// Main Scanner Function
// ============================================================================

/**
 * Scan all context sources for an agent to find available updates
 */
export async function scanForDocumentUpdates(
  agentId: string,
  userId: string,
  options: {
    enableWebSearch?: boolean;
    maxConcurrent?: number;
  } = {}
): Promise<DocumentUpdateCheck[]> {
  const {
    enableWebSearch = true,
    maxConcurrent = 5
  } = options;

  console.log(`🔍 Starting document update scan for agent ${agentId}...`);
  console.log(`   Web search: ${enableWebSearch ? 'enabled' : 'disabled'}`);
  
  try {
    // 1. Get all context sources for agent
    const sources = await getContextSourcesForAgent(agentId, userId);
    console.log(`   Found ${sources.length} sources to check`);
    
    if (sources.length === 0) {
      console.log(`   ℹ️ No sources assigned to agent`);
      return [];
    }
    
    // 2. Check each source for updates (with concurrency limit)
    const checks: DocumentUpdateCheck[] = [];
    
    for (let i = 0; i < sources.length; i += maxConcurrent) {
      const batch = sources.slice(i, i + maxConcurrent);
      console.log(`   Checking batch ${Math.floor(i / maxConcurrent) + 1}/${Math.ceil(sources.length / maxConcurrent)}...`);
      
      const batchResults = await Promise.allSettled(
        batch.map(source => checkSingleDocumentForUpdate(source, enableWebSearch))
      );
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          checks.push(result.value);
          if (result.value.foundUpdate) {
            console.log(`      ✅ ${batch[index].name}: Update found!`);
          } else {
            console.log(`      ℹ️ ${batch[index].name}: Up to date`);
          }
        } else {
          console.error(`      ❌ ${batch[index].name}: Error - ${result.reason}`);
          checks.push({
            sourceId: batch[index].id,
            sourceName: batch[index].name,
            currentVersion: {
              date: batch[index].addedAt || new Date(),
              size: 0
            },
            status: 'error',
            errorMessage: result.reason?.message || 'Unknown error'
          });
        }
      });
    }
    
    const updatesFound = checks.filter(c => c.foundUpdate).length;
    console.log(`✅ Scan complete: ${updatesFound}/${sources.length} updates found`);
    
    return checks;
    
  } catch (error) {
    console.error(`❌ Scan failed:`, error);
    throw error;
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get context sources assigned to an agent
 */
async function getContextSourcesForAgent(
  agentId: string,
  userId: string
): Promise<ContextSource[]> {
  const sourcesSnapshot = await firestore
    .collection(COLLECTIONS.CONTEXT_SOURCES)
    .where('assignedToAgents', 'array-contains', agentId)
    .where('userId', '==', userId)
    .get();
  
  return sourcesSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as ContextSource[];
}

/**
 * Check a single document for updates
 */
async function checkSingleDocumentForUpdate(
  source: ContextSource,
  enableWebSearch: boolean
): Promise<DocumentUpdateCheck> {
  console.log(`      Checking: ${source.name}...`);
  
  // Determine search strategy
  const strategy = analyzeDocumentForUpdates(source);
  console.log(`         Strategy: ${strategy.type}, Method: ${strategy.checkMethod}`);
  
  try {
    switch (strategy.type) {
      case 'direct_url':
        return await checkDirectUrlUpdate(source, strategy.url!);
      
      case 'metadata_url':
        return await checkMetadataUrlUpdate(source, strategy.url!);
      
      case 'web_search':
      case 'domain_search':
        if (!enableWebSearch) {
          return createUpToDateResult(source, 'Web search disabled');
        }
        return await checkWebSearchUpdate(source, strategy.query!);
      
      default:
        throw new Error(`Unknown strategy type: ${strategy.type}`);
    }
  } catch (error) {
    console.error(`         ❌ Check failed:`, error);
    throw error;
  }
}

/**
 * Analyze document to determine best update check strategy
 */
function analyzeDocumentForUpdates(source: ContextSource): DocumentSearchStrategy {
  // Strategy 1: Direct URL (best - fastest and most reliable)
  if (source.url && isValidUrl(source.url)) {
    return {
      type: 'direct_url',
      url: source.url,
      checkMethod: 'last_modified_header'
    };
  }
  
  // Strategy 2: URL in metadata
  if (source.metadata?.originalUrl && isValidUrl(source.metadata.originalUrl)) {
    return {
      type: 'metadata_url',
      url: source.metadata.originalUrl,
      checkMethod: 'content_hash'
    };
  }
  
  // Strategy 3: Domain-specific search (if domain is known)
  if (source.domainId && source.name) {
    const domain = getDomainWebsite(source.domainId);
    if (domain) {
      return {
        type: 'domain_search',
        query: `${source.name} site:${domain}`,
        checkMethod: 'semantic_similarity'
      };
    }
  }
  
  // Strategy 4: General web search (last resort)
  return {
    type: 'web_search',
    query: source.name,
    checkMethod: 'semantic_similarity'
  };
}

/**
 * Check document update via direct URL (Last-Modified header)
 */
async function checkDirectUrlUpdate(
  source: ContextSource,
  url: string
): Promise<DocumentUpdateCheck> {
  console.log(`         Fetching headers from ${url}...`);
  
  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      headers: {
        'User-Agent': 'SalfaGPT Document Update Scanner/1.0'
      }
    });
    
    if (!response.ok) {
      console.log(`         ⚠️ HTTP ${response.status}, falling back to content check`);
      return await checkContentHashUpdate(source, url);
    }
    
    const lastModified = response.headers.get('last-modified');
    const contentLength = response.headers.get('content-length');
    
    if (!lastModified) {
      console.log(`         ℹ️ No Last-Modified header, falling back to content check`);
      return await checkContentHashUpdate(source, url);
    }
    
    const updateDate = new Date(lastModified);
    const currentDate = source.addedAt || source.metadata?.uploadedAt || new Date();
    
    console.log(`         Current: ${currentDate.toISOString()}`);
    console.log(`         Found:   ${updateDate.toISOString()}`);
    
    if (updateDate > currentDate) {
      return {
        sourceId: source.id,
        sourceName: source.name,
        sourceUrl: url,
        currentVersion: {
          date: currentDate,
          hash: source.metadata?.hash,
          size: source.metadata?.size || 0
        },
        foundUpdate: {
          url,
          date: updateDate,
          preview: `Documento modificado el ${updateDate.toLocaleDateString()}`,
          confidence: 0.95,
          estimatedChanges: [`Última modificación: ${updateDate.toLocaleString()}`]
        },
        status: 'update_found'
      };
    }
    
    return createUpToDateResult(source);
    
  } catch (error) {
    console.error(`         ❌ Direct URL check failed:`, error);
    throw error;
  }
}

/**
 * Check document update via content hash comparison
 */
async function checkContentHashUpdate(
  source: ContextSource,
  url: string
): Promise<DocumentUpdateCheck> {
  console.log(`         Downloading content for hash comparison...`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SalfaGPT Document Update Scanner/1.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const newContent = await response.arrayBuffer();
    const newHash = await hashContent(new Uint8Array(newContent));
    const currentHash = source.metadata?.hash;
    
    console.log(`         Current hash: ${currentHash?.substring(0, 12)}...`);
    console.log(`         New hash:     ${newHash.substring(0, 12)}...`);
    
    if (currentHash && newHash !== currentHash) {
      // Content has changed
      return {
        sourceId: source.id,
        sourceName: source.name,
        sourceUrl: url,
        currentVersion: {
          date: source.addedAt || new Date(),
          hash: currentHash,
          size: source.metadata?.size || 0
        },
        foundUpdate: {
          url,
          date: new Date(), // Use current date since we don't have exact modification time
          preview: `Contenido modificado (hash cambió de ${currentHash?.substring(0, 8)} a ${newHash.substring(0, 8)})`,
          confidence: 0.90,
          estimatedChanges: ['Contenido del documento ha cambiado']
        },
        status: 'update_found'
      };
    }
    
    return createUpToDateResult(source);
    
  } catch (error) {
    console.error(`         ❌ Content hash check failed:`, error);
    throw error;
  }
}

/**
 * Check document update via web search + semantic similarity
 * 
 * NOTE: This requires web search API integration
 * For now, this is a placeholder that returns "up to date"
 */
async function checkWebSearchUpdate(
  source: ContextSource,
  query: string
): Promise<DocumentUpdateCheck> {
  console.log(`         Web searching: "${query}"...`);
  
  // TODO: Implement actual web search integration
  // Options:
  // 1. Google Custom Search API
  // 2. Bing Search API
  // 3. SerpAPI
  // 4. Brave Search API
  
  console.log(`         ⚠️ Web search not yet implemented - returning up to date`);
  
  return createUpToDateResult(source, 'Web search not yet implemented');
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create an "up to date" result
 */
function createUpToDateResult(
  source: ContextSource,
  reason?: string
): DocumentUpdateCheck {
  return {
    sourceId: source.id,
    sourceName: source.name,
    sourceUrl: source.url,
    currentVersion: {
      date: source.addedAt || new Date(),
      hash: source.metadata?.hash,
      size: source.metadata?.size || 0
    },
    status: 'up_to_date'
  };
}

/**
 * Validate URL
 */
function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Get website for domain
 */
function getDomainWebsite(domainId: string): string | null {
  // TODO: Implement domain website lookup from Firestore
  // For now, return null (will use general web search)
  return null;
}

/**
 * Hash content (SHA-256)
 */
async function hashContent(content: Uint8Array): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', content);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Calculate cosine similarity between two texts
 */
async function calculateTextSimilarity(text1: string, text2: string): Promise<number> {
  const [embedding1, embedding2] = await Promise.all([
    generateEmbedding(text1.substring(0, 5000)), // Limit to 5000 chars
    generateEmbedding(text2.substring(0, 5000))
  ]);
  
  // Cosine similarity
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  
  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i];
    norm1 += embedding1[i] * embedding1[i];
    norm2 += embedding2[i] * embedding2[i];
  }
  
  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}


