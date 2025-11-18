# 🔄 Document Update System - Internet-Powered Context Refresh

**Date:** November 18, 2025  
**Feature:** Automatic Document Updates from Internet  
**Purpose:** Keep context sources fresh with latest public information  
**Security:** Role-based approval (Super Admin, Admin, Expert, Supervisor)

---

## 🎯 Overview

### Problem Solved
Documents in context become outdated over time. Users need:
- ✅ Automatic detection of available updates
- ✅ Smart web search for official sources
- ✅ Version control for document history
- ✅ Approval workflow for updates
- ✅ Automatic re-vectorization
- ✅ Weighted relevance (newer = higher priority)

### User Flow
```
1. User clicks "🔍 Buscar Actualizaciones" in chat
   ↓
2. System analyzes documents in context
   ↓
3. Searches internet for each document source
   ↓
4. Presents update cards with:
   - Document name
   - Current version date
   - Found update date
   - Source URL
   - Preview of changes
   ↓
5. Admin approves/rejects updates
   ↓
6. Approved updates are:
   - Downloaded
   - Logged in Firestore
   - Vectorized
   - Tagged with timestamp
   - Added to agent context
   ↓
7. RAG prioritizes newer versions
8. Old versions kept as references
```

---

## 🏗️ Architecture

### Components

```typescript
// 1. Document Update Scanner
interface DocumentUpdateCheck {
  sourceId: string;
  sourceName: string;
  sourceUrl?: string;
  currentVersion: {
    date: Date;
    hash: string;
    size: number;
  };
  foundUpdate?: {
    url: string;
    date: Date;
    preview: string;
    confidence: number; // 0-1
  };
  status: 'checking' | 'up_to_date' | 'update_found' | 'error';
}

// 2. Update Request
interface DocumentUpdateRequest {
  id: string;
  sourceId: string;
  userId: string;
  agentId: string;
  domainId?: string;
  
  originalDocument: {
    name: string;
    url: string;
    version: string;
    date: Date;
  };
  
  proposedUpdate: {
    url: string;
    date: Date;
    preview: string;
    estimatedChanges: string[];
  };
  
  status: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed' | 'failed';
  
  requestedBy: string;
  requestedAt: Date;
  
  approvedBy?: string;
  approvedAt?: Date;
  
  processedAt?: Date;
  newSourceId?: string; // ID of created updated source
  
  error?: string;
}

// 3. Document Version
interface DocumentVersion {
  sourceId: string;
  version: number;
  versionTag: string; // e.g., "v2.0", "2025-11-18", "latest"
  
  date: Date;
  url?: string;
  
  isLatest: boolean;
  supersedes?: string; // Previous version sourceId
  supersededBy?: string; // Newer version sourceId
  
  metadata: {
    updateType: 'manual' | 'automatic' | 'internet_refresh';
    changes?: string[];
    approvedBy?: string;
  };
}
```

### Database Schema

#### Firestore Collections

**`document_update_requests`**
```typescript
{
  id: "upd_abc123",
  sourceId: "src_xyz789",
  userId: "usr_123",
  agentId: "conv_456",
  domainId: "domain_salfa",
  
  originalDocument: {
    name: "Manual RDI M001",
    url: "https://salfa.cl/docs/rdi-m001.pdf",
    version: "v1.5",
    date: "2024-01-15T00:00:00Z"
  },
  
  proposedUpdate: {
    url: "https://salfa.cl/docs/rdi-m001.pdf",
    date: "2025-11-01T00:00:00Z",
    preview: "Updated sections: 2.3, 4.1, 7.5. Added new workflow diagrams.",
    estimatedChanges: [
      "Section 2.3: New approval process",
      "Section 4.1: Updated contact information",
      "Section 7.5: New compliance requirements"
    ]
  },
  
  status: "pending",
  requestedBy: "usr_123",
  requestedAt: "2025-11-18T12:00:00Z",
  
  tags: ["domain:salfa", "auto-update", "2025-11-18"]
}
```

**`document_versions`**
```typescript
{
  sourceId: "src_xyz789_v2",
  parentSourceId: "src_xyz789_v1",
  version: 2,
  versionTag: "2025-11-18",
  
  date: "2025-11-18T12:30:00Z",
  url: "https://salfa.cl/docs/rdi-m001.pdf",
  
  isLatest: true,
  supersedes: "src_xyz789_v1",
  
  metadata: {
    updateType: "internet_refresh",
    changes: ["Section 2.3", "Section 4.1", "Section 7.5"],
    approvedBy: "usr_admin",
    updateRequestId: "upd_abc123"
  },
  
  tags: ["domain:salfa", "auto-update", "latest"]
}
```

**`document_update_logs`**
```typescript
{
  id: "log_123",
  updateRequestId: "upd_abc123",
  sourceId: "src_xyz789",
  timestamp: "2025-11-18T12:30:00Z",
  
  action: "update_completed",
  
  details: {
    oldVersion: "v1.5",
    newVersion: "v2.0",
    chunksCreated: 45,
    vectorizationTime: 1234,
    approvedBy: "usr_admin"
  }
}
```

---

## 🔍 Web Search Strategy

### Document Source Detection

```typescript
// Analyze documents to determine search strategy
function analyzeDocumentForUpdates(source: ContextSource): DocumentSearchStrategy {
  // 1. Check if has URL
  if (source.url) {
    return {
      type: 'direct_url',
      url: source.url,
      checkMethod: 'last_modified_header'
    };
  }
  
  // 2. Try to extract URL from metadata
  if (source.metadata?.originalUrl) {
    return {
      type: 'metadata_url',
      url: source.metadata.originalUrl,
      checkMethod: 'content_comparison'
    };
  }
  
  // 3. Search by document name + organization
  if (source.name && source.domainId) {
    return {
      type: 'web_search',
      query: `${source.name} site:${getDomainWebsite(source.domainId)}`,
      checkMethod: 'semantic_similarity'
    };
  }
  
  // 4. General web search
  return {
    type: 'web_search',
    query: source.name,
    checkMethod: 'semantic_similarity'
  };
}
```

### Update Detection Methods

**Method 1: Direct URL Check (Fastest)**
```typescript
async function checkDirectUrl(url: string, currentDate: Date): Promise<boolean> {
  const response = await fetch(url, { method: 'HEAD' });
  const lastModified = new Date(response.headers.get('last-modified'));
  return lastModified > currentDate;
}
```

**Method 2: Content Hash Comparison**
```typescript
async function checkContentHash(url: string, currentHash: string): Promise<boolean> {
  const content = await fetchDocument(url);
  const newHash = hashContent(content);
  return newHash !== currentHash;
}
```

**Method 3: Web Search + Semantic Similarity**
```typescript
async function checkWebSearch(query: string, currentContent: string): Promise<UpdateInfo | null> {
  // Use Google Custom Search or similar
  const results = await searchWeb(query);
  
  for (const result of results) {
    const newContent = await fetchDocument(result.url);
    const similarity = calculateSimilarity(currentContent, newContent);
    
    if (similarity > 0.85 && similarity < 0.99) {
      // Similar enough to be same document, different enough to be updated
      return {
        url: result.url,
        date: result.date,
        changes: detectChanges(currentContent, newContent)
      };
    }
  }
  
  return null;
}
```

---

## 🎨 UI Components

### 1. Update Check Button

```tsx
// In ChatInterface
<button
  onClick={handleCheckForUpdates}
  disabled={!hasContextSources || isChecking}
  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
>
  {isChecking ? (
    <>
      <RefreshIcon className="animate-spin h-4 w-4" />
      Buscando actualizaciones...
    </>
  ) : (
    <>
      <SearchIcon className="h-4 w-4" />
      🔍 Buscar Actualizaciones
    </>
  )}
</button>
```

### 2. Update Cards Display

```tsx
interface UpdateCardProps {
  update: DocumentUpdateCheck;
  onApprove: (updateId: string) => void;
  onReject: (updateId: string) => void;
  canApprove: boolean;
}

function UpdateCard({ update, onApprove, onReject, canApprove }: UpdateCardProps) {
  return (
    <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold text-gray-900">{update.sourceName}</h4>
          <p className="text-sm text-gray-600">Versión actual: {update.currentVersion.date.toLocaleDateString()}</p>
        </div>
        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
          Actualización disponible
        </span>
      </div>
      
      {/* Update Info */}
      <div className="bg-white rounded p-3 mb-3">
        <p className="text-sm font-medium text-gray-700 mb-2">Actualización encontrada:</p>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>📅 Fecha: {update.foundUpdate.date.toLocaleDateString()}</li>
          <li>🔗 Fuente: <a href={update.foundUpdate.url} target="_blank" className="text-blue-600 hover:underline">{update.foundUpdate.url}</a></li>
          <li>🎯 Confianza: {(update.foundUpdate.confidence * 100).toFixed(0)}%</li>
        </ul>
        
        {/* Preview */}
        {update.foundUpdate.preview && (
          <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-700">
            <p className="font-medium mb-1">Vista previa de cambios:</p>
            <p>{update.foundUpdate.preview}</p>
          </div>
        )}
      </div>
      
      {/* Actions */}
      {canApprove && (
        <div className="flex gap-2">
          <button
            onClick={() => onApprove(update.sourceId)}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            ✅ Aprobar Actualización
          </button>
          <button
            onClick={() => onReject(update.sourceId)}
            className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            ❌ Rechazar
          </button>
        </div>
      )}
      
      {!canApprove && (
        <p className="text-sm text-gray-500 italic">
          ⚠️ Requiere aprobación de Admin, Experto o Supervisor
        </p>
      )}
    </div>
  );
}
```

### 3. Update Progress Modal

```tsx
function UpdateProgressModal({ updates }: { updates: DocumentUpdateRequest[] }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <h3 className="text-xl font-bold mb-4">Procesando Actualizaciones</h3>
        
        {updates.map(update => (
          <div key={update.id} className="mb-4 p-4 border rounded">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">{update.originalDocument.name}</span>
              <StatusBadge status={update.status} />
            </div>
            
            {update.status === 'processing' && (
              <div className="space-y-2">
                <ProgressStep completed={true}>Descargando documento</ProgressStep>
                <ProgressStep completed={true}>Extrayendo texto</ProgressStep>
                <ProgressStep inProgress={true}>Vectorizando contenido</ProgressStep>
                <ProgressStep>Actualizando contexto</ProgressStep>
              </div>
            )}
            
            {update.status === 'completed' && (
              <p className="text-green-600 text-sm">✅ Actualización completada</p>
            )}
            
            {update.status === 'failed' && (
              <p className="text-red-600 text-sm">❌ Error: {update.error}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 🔐 Permission System

### Role-Based Access Control

```typescript
// Check if user can approve updates
function canApproveUpdates(userRole: UserRole): boolean {
  return ['super_admin', 'admin', 'expert', 'supervisor'].includes(userRole);
}

// Check if user can request updates
function canRequestUpdates(userRole: UserRole): boolean {
  return true; // All users can request, but approval needed
}

// Audit log for updates
interface UpdateAuditLog {
  updateId: string;
  action: 'requested' | 'approved' | 'rejected' | 'completed';
  userId: string;
  userRole: string;
  timestamp: Date;
  metadata: Record<string, any>;
}
```

---

## 🤖 Backend Services

### 1. Document Update Scanner

```typescript
// src/lib/document-update-scanner.ts

import { searchWeb } from './web-search';
import { getContextSource } from './firestore';
import { calculateSimilarity } from './embeddings';

export async function scanForDocumentUpdates(
  agentId: string,
  userId: string
): Promise<DocumentUpdateCheck[]> {
  console.log(`🔍 Scanning for document updates for agent ${agentId}...`);
  
  // 1. Get all context sources for agent
  const sources = await getContextSourcesForAgent(agentId, userId);
  console.log(`  Found ${sources.length} sources to check`);
  
  // 2. Check each source for updates
  const checks: DocumentUpdateCheck[] = [];
  
  for (const source of sources) {
    console.log(`  Checking: ${source.name}...`);
    
    try {
      const check = await checkSingleDocumentForUpdate(source);
      checks.push(check);
      
      if (check.foundUpdate) {
        console.log(`    ✅ Update found! Confidence: ${(check.foundUpdate.confidence * 100).toFixed(0)}%`);
      } else {
        console.log(`    ℹ️ No updates found`);
      }
    } catch (error) {
      console.error(`    ❌ Error checking ${source.name}:`, error);
      checks.push({
        sourceId: source.id,
        sourceName: source.name,
        currentVersion: {
          date: source.addedAt,
          hash: source.metadata?.hash || '',
          size: source.metadata?.size || 0
        },
        status: 'error'
      });
    }
  }
  
  console.log(`✅ Scan complete: ${checks.filter(c => c.foundUpdate).length} updates found`);
  
  return checks;
}

async function checkSingleDocumentForUpdate(
  source: ContextSource
): Promise<DocumentUpdateCheck> {
  const strategy = analyzeDocumentForUpdates(source);
  
  switch (strategy.type) {
    case 'direct_url':
      return await checkDirectUrlUpdate(source, strategy.url);
    
    case 'metadata_url':
      return await checkMetadataUrlUpdate(source, strategy.url);
    
    case 'web_search':
      return await checkWebSearchUpdate(source, strategy.query);
    
    default:
      throw new Error(`Unknown strategy type: ${strategy.type}`);
  }
}

async function checkDirectUrlUpdate(
  source: ContextSource,
  url: string
): Promise<DocumentUpdateCheck> {
  // Check Last-Modified header
  const response = await fetch(url, { method: 'HEAD' });
  const lastModified = response.headers.get('last-modified');
  
  if (!lastModified) {
    // Fall back to content hash check
    return await checkContentHashUpdate(source, url);
  }
  
  const updateDate = new Date(lastModified);
  const currentDate = source.addedAt;
  
  if (updateDate > currentDate) {
    return {
      sourceId: source.id,
      sourceName: source.name,
      sourceUrl: url,
      currentVersion: {
        date: currentDate,
        hash: source.metadata?.hash || '',
        size: source.metadata?.size || 0
      },
      foundUpdate: {
        url,
        date: updateDate,
        preview: `Documento modificado el ${updateDate.toLocaleDateString()}`,
        confidence: 0.95
      },
      status: 'update_found'
    };
  }
  
  return {
    sourceId: source.id,
    sourceName: source.name,
    sourceUrl: url,
    currentVersion: {
      date: currentDate,
      hash: source.metadata?.hash || '',
      size: source.metadata?.size || 0
    },
    status: 'up_to_date'
  };
}

async function checkWebSearchUpdate(
  source: ContextSource,
  query: string
): Promise<DocumentUpdateCheck> {
  // Use web search to find potential updates
  const searchResults = await searchWeb(query, { maxResults: 5 });
  
  // Get current document content for comparison
  const currentContent = await getSourceContent(source);
  
  for (const result of searchResults) {
    try {
      // Fetch new document
      const newContent = await fetchDocumentContent(result.url);
      
      // Calculate semantic similarity
      const similarity = await calculateSimilarity(currentContent, newContent);
      
      // If similar enough to be same document but different enough to be updated
      if (similarity > 0.85 && similarity < 0.99) {
        // Extract changes
        const changes = await detectDocumentChanges(currentContent, newContent);
        
        return {
          sourceId: source.id,
          sourceName: source.name,
          currentVersion: {
            date: source.addedAt,
            hash: source.metadata?.hash || '',
            size: currentContent.length
          },
          foundUpdate: {
            url: result.url,
            date: result.publishedDate || new Date(),
            preview: changes.summary,
            confidence: similarity
          },
          status: 'update_found'
        };
      }
    } catch (error) {
      console.warn(`  ⚠️ Failed to check ${result.url}:`, error);
      continue;
    }
  }
  
  // No updates found
  return {
    sourceId: source.id,
    sourceName: source.name,
    currentVersion: {
      date: source.addedAt,
      hash: source.metadata?.hash || '',
      size: currentContent.length
    },
    status: 'up_to_date'
  };
}
```

### 2. Update Processor

```typescript
// src/lib/document-update-processor.ts

import { createContextSource } from './firestore';
import { processDocument } from './document-processor';
import { syncChunksBatchToBigQuery } from './bigquery-vector-search';
import { invalidateAgentSourcesCache } from './agent-sources-cache';

export async function processDocumentUpdate(
  request: DocumentUpdateRequest,
  approvedBy: string
): Promise<string> {
  console.log(`🔄 Processing document update: ${request.id}`);
  
  try {
    // 1. Update request status
    await updateRequestStatus(request.id, 'processing');
    
    // 2. Download new document
    console.log(`  📥 Downloading from ${request.proposedUpdate.url}...`);
    const document = await downloadDocument(request.proposedUpdate.url);
    
    // 3. Process document (extract text, chunk, embed)
    console.log(`  📄 Processing document...`);
    const processed = await processDocument(document, {
      userId: request.userId,
      agentId: request.agentId,
      domainId: request.domainId
    });
    
    // 4. Create new context source (versioned)
    console.log(`  💾 Creating new context source (version ${processed.version})...`);
    const newSource = await createContextSource(request.userId, {
      name: `${request.originalDocument.name} (${request.proposedUpdate.date.toISOString().split('T')[0]})`,
      type: processed.type,
      url: request.proposedUpdate.url,
      extractedData: processed.text,
      metadata: {
        ...processed.metadata,
        updateType: 'internet_refresh',
        originalSourceId: request.sourceId,
        version: processed.version,
        versionTag: request.proposedUpdate.date.toISOString().split('T')[0],
        approvedBy,
        updateRequestId: request.id
      },
      assignedToAgents: [request.agentId],
      tags: [
        ...(request.domainId ? [`domain:${request.domainId}`] : []),
        'auto-update',
        'latest',
        request.proposedUpdate.date.toISOString().split('T')[0]
      ]
    });
    
    // 5. Vectorize and sync to BigQuery
    console.log(`  🧮 Vectorizing chunks...`);
    await syncChunksBatchToBigQuery(processed.chunks);
    
    // 6. Create version record
    console.log(`  📝 Creating version record...`);
    await createDocumentVersion({
      sourceId: newSource.id,
      parentSourceId: request.sourceId,
      version: processed.version,
      versionTag: request.proposedUpdate.date.toISOString().split('T')[0],
      date: request.proposedUpdate.date,
      url: request.proposedUpdate.url,
      isLatest: true,
      supersedes: request.sourceId,
      metadata: {
        updateType: 'internet_refresh',
        changes: request.proposedUpdate.estimatedChanges,
        approvedBy,
        updateRequestId: request.id
      }
    });
    
    // 7. Update old source to mark as superseded
    await updateContextSource(request.sourceId, {
      tags: [...(await getContextSource(request.sourceId)).tags.filter(t => t !== 'latest'), 'superseded'],
      metadata: {
        supersededBy: newSource.id,
        supersededAt: new Date()
      }
    });
    
    // 8. Invalidate cache
    invalidateAgentSourcesCache(request.agentId, request.userId);
    
    // 9. Update request status
    await updateRequestStatus(request.id, 'completed', {
      newSourceId: newSource.id,
      processedAt: new Date()
    });
    
    // 10. Log completion
    await createUpdateLog({
      updateRequestId: request.id,
      sourceId: newSource.id,
      action: 'update_completed',
      details: {
        oldVersion: request.originalDocument.version,
        newVersion: processed.version,
        chunksCreated: processed.chunks.length,
        approvedBy
      }
    });
    
    console.log(`✅ Document update completed: ${newSource.id}`);
    
    return newSource.id;
    
  } catch (error) {
    console.error(`❌ Failed to process update:`, error);
    
    await updateRequestStatus(request.id, 'failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    throw error;
  }
}
```

### 3. Version Weighting for RAG

```typescript
// src/lib/rag-version-weighting.ts

/**
 * Apply version weighting to search results
 * 
 * Newer versions get higher scores, but old versions remain as references
 */
export function applyVersionWeighting(
  results: RAGSearchResult[],
  versionMetadata: Map<string, DocumentVersion>
): RAGSearchResult[] {
  return results.map(result => {
    const version = versionMetadata.get(result.sourceId);
    
    if (!version) {
      return result; // No version info, keep as-is
    }
    
    // Calculate version boost
    let versionBoost = 1.0;
    
    if (version.isLatest) {
      versionBoost = 1.3; // 30% boost for latest version
    } else if (version.supersededBy) {
      versionBoost = 0.7; // 30% penalty for superseded versions
    }
    
    // Calculate age boost (newer = higher)
    const ageInDays = (Date.now() - version.date.getTime()) / (1000 * 60 * 60 * 24);
    const ageBoost = Math.max(0.5, 1 - (ageInDays / 365)); // Decay over 1 year
    
    // Combined boost
    const finalBoost = versionBoost * ageBoost;
    
    return {
      ...result,
      similarity: result.similarity * finalBoost,
      metadata: {
        ...result.metadata,
        versionBoost,
        ageBoost,
        finalBoost,
        isLatest: version.isLatest,
        version: version.versionTag
      }
    };
  });
}
```

---

## 📡 API Endpoints

### 1. Check for Updates

```typescript
// POST /api/documents/check-updates
export const POST: APIRoute = async ({ request, cookies }) => {
  const session = getSession({ cookies });
  if (!session) return unauthorized();
  
  const { agentId } = await request.json();
  
  // Scan for updates
  const updates = await scanForDocumentUpdates(agentId, session.id);
  
  return jsonResponse({ updates });
};
```

### 2. Request Update

```typescript
// POST /api/documents/request-update
export const POST: APIRoute = async ({ request, cookies }) => {
  const session = getSession({ cookies });
  if (!session) return unauthorized();
  
  const { sourceId, agentId, proposedUpdate } = await request.json();
  
  // Create update request
  const updateRequest = await createUpdateRequest({
    sourceId,
    userId: session.id,
    agentId,
    proposedUpdate,
    requestedBy: session.id,
    requestedAt: new Date(),
    status: 'pending'
  });
  
  return jsonResponse({ updateRequest });
};
```

### 3. Approve/Reject Update

```typescript
// POST /api/documents/approve-update
export const POST: APIRoute = async ({ request, cookies }) => {
  const session = getSession({ cookies });
  if (!session) return unauthorized();
  
  // Check permissions
  if (!canApproveUpdates(session.role)) {
    return forbidden('Solo Admin, Expert o Supervisor pueden aprobar actualizaciones');
  }
  
  const { updateRequestId, action } = await request.json();
  
  if (action === 'approve') {
    // Process update
    const newSourceId = await processDocumentUpdate(
      await getUpdateRequest(updateRequestId),
      session.id
    );
    
    return jsonResponse({ success: true, newSourceId });
  } else {
    // Reject
    await updateRequestStatus(updateRequestId, 'rejected', {
      rejectedBy: session.id,
      rejectedAt: new Date()
    });
    
    return jsonResponse({ success: true, rejected: true });
  }
};
```

### 4. Get Update History

```typescript
// GET /api/documents/:id/versions
export const GET: APIRoute = async ({ params, cookies }) => {
  const session = getSession({ cookies });
  if (!session) return unauthorized();
  
  const sourceId = params.id;
  
  // Get all versions
  const versions = await getDocumentVersionHistory(sourceId);
  
  return jsonResponse({ versions });
};
```

---

## 🎯 Implementation Checklist

### Phase 1: Core Infrastructure (Week 1)
- [ ] Create Firestore collections (document_update_requests, document_versions, document_update_logs)
- [ ] Implement document update scanner service
- [ ] Implement update processor service
- [ ] Add web search integration
- [ ] Create version weighting system for RAG

### Phase 2: UI Components (Week 1-2)
- [ ] Add "Buscar Actualizaciones" button to chat interface
- [ ] Create update cards UI
- [ ] Build update approval modal
- [ ] Add update progress tracking

### Phase 3: API Endpoints (Week 2)
- [ ] POST /api/documents/check-updates
- [ ] POST /api/documents/request-update
- [ ] POST /api/documents/approve-update
- [ ] GET /api/documents/:id/versions

### Phase 4: Permissions & Security (Week 2)
- [ ] Implement role-based access control
- [ ] Add audit logging
- [ ] Implement rate limiting for web searches
- [ ] Add content validation

### Phase 5: Testing & Refinement (Week 3)
- [ ] Test with real documents
- [ ] Monitor web search accuracy
- [ ] Optimize version weighting
- [ ] Performance testing

---

## 🚀 Next Steps

1. **Implement core scanner** - Start with document update detection
2. **Add web search** - Integrate Google Custom Search or similar
3. **Build UI** - Create update cards and approval flow
4. **Test with real data** - Use RDI M001 as test case
5. **Deploy to production** - Monitor and refine

---

**Status:** Design Complete ✅  
**Ready for Implementation:** Yes  
**Estimated Time:** 2-3 weeks

¿Quieres que empiece a implementar alguna parte específica primero?

