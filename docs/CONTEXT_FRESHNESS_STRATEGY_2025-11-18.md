# Context Freshness Strategy - Achieving 100x Value at 1% Cost

**Date**: 2025-11-18  
**Priority**: 🔴 CRITICAL - User NPS Impact  
**Status**: Solution Design  
**Objective**: Deliver always-current context that exceeds ChatGPT/Gemini web access

---

## 🚨 User Feedback Analysis

### Problem Statement

**Users report:**
> "Los documentos en contexto están desactualizados. ChatGPT y Gemini con internet tienen información más actual sin problema."

**Impact:**
- ❌ Questions platform value proposition
- ❌ NPS <99 target not met
- ❌ Users prefer generic ChatGPT over specialized agents
- ❌ **Fundamental value prop threatened**

### Root Cause

**Current Architecture Limitation:**
```
User uploads PDF → Extract once → Store in Firestore → Never updates
                                                      ↓
                                            Gets stale over time ❌
```

**User Expectation:**
```
ChatGPT/Gemini → Always has latest from web → Always current ✅
```

**The Gap:**
- Static documents vs. live web information
- One-time extraction vs. continuous refresh
- Stale knowledge vs. current facts

---

## 🎯 Strategic Solution: Hybrid Context Architecture

### Vision: "Living Context" System

**Principle:** Combine the best of both worlds
- ✅ Private, validated documents (proprietary knowledge)
- ✅ Real-time web context (current public information)
- ✅ Automatic staleness detection & refresh
- ✅ User-controlled update policies

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│           LIVING CONTEXT SYSTEM                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  TIER 1: Static Documents (Proprietary)                │
│  ├─ User uploads (PDFs, Excel, Word)                   │
│  ├─ Extract once                                       │
│  ├─ Version control                                    │
│  ├─ Manual re-extraction available                     │
│  └─ Best for: CVs, contracts, manuals                  │
│                                                         │
│  TIER 2: Semi-Dynamic Web Pages (Public Reference)     │
│  ├─ URL-based sources                                  │
│  ├─ Automatic refresh schedule (daily/weekly)         │
│  ├─ Change detection                                   │
│  ├─ Version history (compare before/after)            │
│  └─ Best for: Company websites, product pages         │
│                                                         │
│  TIER 3: Real-time Web Search (Current Facts)          │
│  ├─ Google Search integration (NEW)                   │
│  ├─ Query-time web lookup                             │
│  ├─ No storage, always fresh                          │
│  ├─ User opt-in per query                             │
│  └─ Best for: News, prices, schedules                 │
│                                                         │
│  TIER 4: Live APIs (Dynamic Data)                      │
│  ├─ REST/GraphQL integrations                          │
│  ├─ Real-time data fetch                               │
│  ├─ Caching with TTL                                   │
│  ├─ Rate limiting & error handling                     │
│  └─ Best for: CRM, inventory, analytics                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Implementation Plan

### Phase 1: Automatic Web Source Refresh (Week 1-2)

**Goal:** Make web-based context always current

#### 1.1 Add Refresh Metadata to ContextSource

```typescript
interface ContextSource {
  // ... existing fields ...
  
  // ✅ NEW: Freshness tracking
  freshness?: {
    lastRefreshed: Date;           // Last update timestamp
    refreshSchedule: 'manual' | 'daily' | 'weekly' | 'monthly' | 'realtime';
    nextRefreshDue: Date;           // When next refresh should happen
    autoRefreshEnabled: boolean;    // User preference
    staleSinceDate?: Date;          // When content became outdated
    changeDetected?: boolean;       // If content changed on last check
    lastChangeDate?: Date;          // When content last changed
    refreshHistory?: Array<{        // Track refresh history
      timestamp: Date;
      success: boolean;
      changesDetected: boolean;
      bytesChanged?: number;
      error?: string;
    }>;
  };
  
  // For web/API sources
  sourceUrl?: string;               // URL to refresh from
  
  // For version control
  versions?: Array<{
    version: number;
    extractedAt: Date;
    extractedData: string;         // Historical snapshot
    metadata: any;                  // Metadata at that time
  }>;
  currentVersion?: number;          // Active version
}
```

#### 1.2 Create Refresh Background Service

**File:** `src/lib/context-refresher.ts`

```typescript
/**
 * Automatic Context Refresher
 * Runs on Cloud Scheduler (daily at 2 AM)
 * Refreshes web-based context sources
 */

import { firestore } from './firestore';
import { extractFromUrl } from './extractors';

export async function refreshStaleContextSources() {
  console.log('🔄 Starting automatic context refresh...');
  
  // Find sources due for refresh
  const staleSources = await firestore
    .collection('context_sources')
    .where('type', 'in', ['web-url', 'api'])
    .where('freshness.autoRefreshEnabled', '==', true)
    .where('freshness.nextRefreshDue', '<=', new Date())
    .limit(100) // Batch size
    .get();
  
  console.log(`📋 Found ${staleSources.size} sources to refresh`);
  
  const results = {
    total: staleSources.size,
    success: 0,
    failed: 0,
    unchanged: 0,
    updated: 0
  };
  
  for (const doc of staleSources.docs) {
    const source = doc.data();
    
    try {
      // Extract fresh content
      const freshContent = source.type === 'web-url'
        ? await extractFromUrl(source.sourceUrl!)
        : await extractFromApi(source.sourceUrl!);
      
      // Detect changes
      const hasChanged = freshContent !== source.extractedData;
      
      // Prepare update
      const updates: any = {
        'freshness.lastRefreshed': new Date(),
        'freshness.nextRefreshDue': calculateNextRefresh(source.freshness?.refreshSchedule || 'daily'),
        'freshness.changeDetected': hasChanged,
      };
      
      if (hasChanged) {
        // Content changed - create new version
        const newVersion = (source.currentVersion || 0) + 1;
        
        // Store old version
        const oldVersion = {
          version: source.currentVersion || 0,
          extractedAt: source.metadata?.extractionDate || new Date(),
          extractedData: source.extractedData || '',
          metadata: source.metadata
        };
        
        updates.versions = [...(source.versions || []), oldVersion];
        updates.extractedData = freshContent;
        updates.currentVersion = newVersion;
        updates['freshness.lastChangeDate'] = new Date();
        updates['metadata.extractionDate'] = new Date();
        
        console.log(`✅ Updated ${source.name} (v${source.currentVersion} → v${newVersion})`);
        results.updated++;
      } else {
        console.log(`ℹ️ No changes for ${source.name}`);
        results.unchanged++;
      }
      
      // Log refresh history
      updates['freshness.refreshHistory'] = [
        ...(source.freshness?.refreshHistory || []).slice(-10), // Keep last 10
        {
          timestamp: new Date(),
          success: true,
          changesDetected: hasChanged,
          bytesChanged: hasChanged ? Math.abs(freshContent.length - (source.extractedData?.length || 0)) : 0
        }
      ];
      
      await doc.ref.update(updates);
      results.success++;
      
    } catch (error) {
      console.error(`❌ Failed to refresh ${source.name}:`, error);
      
      // Log failure
      await doc.ref.update({
        'freshness.refreshHistory': [
          ...(source.freshness?.refreshHistory || []).slice(-10),
          {
            timestamp: new Date(),
            success: false,
            changesDetected: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        ]
      });
      
      results.failed++;
    }
  }
  
  console.log('🎯 Refresh complete:', results);
  return results;
}

function calculateNextRefresh(schedule: string): Date {
  const now = new Date();
  switch (schedule) {
    case 'daily':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case 'weekly':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case 'monthly':
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
  }
}
```

#### 1.3 Cloud Scheduler Setup

**File:** `scripts/setup-context-refresh-scheduler.sh`

```bash
#!/bin/bash
# Setup Cloud Scheduler for automatic context refresh

PROJECT_ID="salfagpt"
SERVICE_ACCOUNT="salfagpt-scheduler@salfagpt.iam.gserviceaccount.com"

# Create scheduler job
gcloud scheduler jobs create http context-refresh-daily \
  --project=$PROJECT_ID \
  --location=us-east4 \
  --schedule="0 2 * * *" \
  --uri="https://cr-salfagpt-ai-ft-prod-mmxiou2nja-uk.a.run.app/api/context/refresh-all" \
  --http-method=POST \
  --oidc-service-account-email=$SERVICE_ACCOUNT \
  --time-zone="America/Santiago" \
  --description="Daily refresh of web-based context sources at 2 AM Santiago time"

echo "✅ Cloud Scheduler configured for daily context refresh"
```

#### 1.4 User Controls in UI

**Component:** `ContextSourceSettingsModal.tsx`

Add freshness controls:

```typescript
// In source settings modal
<div className="space-y-4">
  <div className="border-t pt-4">
    <h4 className="font-semibold text-sm mb-3">⏰ Actualización Automática</h4>
    
    {/* Only for web/API sources */}
    {(source.type === 'web-url' || source.type === 'api') && (
      <>
        <label className="flex items-center gap-3 mb-3">
          <input
            type="checkbox"
            checked={source.freshness?.autoRefreshEnabled || false}
            onChange={(e) => handleToggleAutoRefresh(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm">Actualizar automáticamente</span>
        </label>
        
        {source.freshness?.autoRefreshEnabled && (
          <div className="ml-7 space-y-2">
            <label className="block text-sm">
              Frecuencia:
              <select
                value={source.freshness?.refreshSchedule || 'daily'}
                onChange={(e) => handleChangeSchedule(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border rounded"
              >
                <option value="daily">Diariamente (2 AM)</option>
                <option value="weekly">Semanalmente (Lunes 2 AM)</option>
                <option value="monthly">Mensualmente (Día 1, 2 AM)</option>
              </select>
            </label>
            
            {/* Freshness indicators */}
            <div className="text-xs space-y-1 text-slate-600">
              <p>
                Última actualización: {
                  source.freshness?.lastRefreshed 
                    ? formatDistance(source.freshness.lastRefreshed)
                    : 'Nunca'
                }
              </p>
              
              {source.freshness?.changeDetected && (
                <p className="text-orange-600 font-medium">
                  ⚠️ Cambios detectados en última actualización
                </p>
              )}
              
              <p>
                Próxima actualización: {
                  source.freshness?.nextRefreshDue
                    ? formatDate(source.freshness.nextRefreshDue)
                    : 'No programada'
                }
              </p>
            </div>
          </div>
        )}
        
        {/* Manual refresh button */}
        <button
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className="mt-3 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300"
        >
          {isRefreshing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Actualizando...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Actualizar Ahora
            </>
          )}
        </button>
        
        {/* Refresh history */}
        {source.freshness?.refreshHistory && source.freshness.refreshHistory.length > 0 && (
          <details className="mt-3">
            <summary className="text-sm font-medium cursor-pointer">
              Historial de actualizaciones ({source.freshness.refreshHistory.length})
            </summary>
            <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
              {source.freshness.refreshHistory.slice().reverse().map((refresh, idx) => (
                <div key={idx} className="text-xs p-2 bg-slate-50 rounded">
                  <div className="flex items-center justify-between">
                    <span>{formatDateTime(refresh.timestamp)}</span>
                    <span className={refresh.success ? 'text-green-600' : 'text-red-600'}>
                      {refresh.success ? '✅' : '❌'}
                    </span>
                  </div>
                  {refresh.changesDetected && (
                    <p className="text-orange-600 mt-1">
                      Cambios: {refresh.bytesChanged} bytes modificados
                    </p>
                  )}
                  {refresh.error && (
                    <p className="text-red-600 mt-1">Error: {refresh.error}</p>
                  )}
                </div>
              ))}
            </div>
          </details>
        )}
      </>
    )}
  </div>
</div>
```

---

### Phase 2: Real-Time Web Search Integration (Week 3-4)

**Goal:** Give agents access to current web information like ChatGPT

#### 2.1 Google Search API Integration

**File:** `src/lib/web-search.ts`

```typescript
import { google } from 'googleapis';

const customsearch = google.customsearch('v1');

export interface WebSearchResult {
  title: string;
  link: string;
  snippet: string;
  displayLink: string;
  formattedUrl: string;
  htmlSnippet: string;
}

export interface WebSearchResponse {
  query: string;
  results: WebSearchResult[];
  totalResults: number;
  searchTime: number;
  sources: string[]; // URLs accessed
}

/**
 * Search the web for current information
 * Uses Google Custom Search API
 */
export async function searchWeb(
  query: string,
  options?: {
    numResults?: number;
    dateRestrict?: string; // e.g., 'd7' for last 7 days
    language?: string;
  }
): Promise<WebSearchResponse> {
  const startTime = Date.now();
  
  try {
    const response = await customsearch.cse.list({
      auth: process.env.GOOGLE_SEARCH_API_KEY,
      cx: process.env.GOOGLE_SEARCH_ENGINE_ID, // Custom Search Engine ID
      q: query,
      num: options?.numResults || 5,
      dateRestrict: options?.dateRestrict,
      lr: options?.language ? `lang_${options.language}` : undefined,
    });
    
    const results: WebSearchResult[] = (response.data.items || []).map(item => ({
      title: item.title || '',
      link: item.link || '',
      snippet: item.snippet || '',
      displayLink: item.displayLink || '',
      formattedUrl: item.formattedUrl || '',
      htmlSnippet: item.htmlSnippet || ''
    }));
    
    const searchTime = Date.now() - startTime;
    
    return {
      query,
      results,
      totalResults: parseInt(response.data.searchInformation?.totalResults || '0'),
      searchTime,
      sources: results.map(r => r.link)
    };
  } catch (error) {
    console.error('❌ Web search failed:', error);
    throw new Error('Failed to search web');
  }
}

/**
 * Search and extract content from top results
 * Returns formatted context ready for AI
 */
export async function searchAndExtractWeb(
  query: string,
  numResults: number = 3
): Promise<string> {
  // Search
  const searchResults = await searchWeb(query, { numResults });
  
  // Extract content from top results
  const extractedContent = await Promise.all(
    searchResults.results.slice(0, numResults).map(async (result) => {
      try {
        const response = await fetch(result.link);
        const html = await response.text();
        
        // Simple extraction (can be enhanced with readability.js or similar)
        const text = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        return {
          url: result.link,
          title: result.title,
          content: text.substring(0, 2000) // First 2000 chars
        };
      } catch (error) {
        console.warn(`⚠️ Failed to extract from ${result.link}`);
        return {
          url: result.link,
          title: result.title,
          content: result.snippet // Fallback to snippet
        };
      }
    })
  );
  
  // Format for AI context
  return extractedContent
    .map(item => `
=== ${item.title} ===
URL: ${item.url}

${item.content}
`)
    .join('\n\n---\n\n');
}
```

#### 2.2 Agent Web Search Toggle

**UI Enhancement:** Add "Web Search" toggle to agent configuration

```typescript
// In AgentPromptModal or UserSettingsModal
<div className="space-y-3">
  <label className="flex items-center gap-3">
    <input
      type="checkbox"
      checked={agentConfig.webSearchEnabled || false}
      onChange={(e) => setAgentConfig(prev => ({
        ...prev,
        webSearchEnabled: e.target.checked
      }))}
      className="w-4 h-4"
    />
    <div className="flex-1">
      <span className="font-medium">🌐 Acceso a Internet</span>
      <p className="text-xs text-slate-600 mt-1">
        Permitir búsqueda web en tiempo real para información actualizada
      </p>
    </div>
  </label>
  
  {agentConfig.webSearchEnabled && (
    <div className="ml-7 space-y-2 text-sm">
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={agentConfig.webSearchAutomatic || false}
          onChange={(e) => setAgentConfig(prev => ({
            ...prev,
            webSearchAutomatic: e.target.checked
          }))}
        />
        <span>Búsqueda automática (cuando detecta necesidad de info actual)</span>
      </label>
      
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={agentConfig.webSearchManual || true}
          onChange={(e) => setAgentConfig(prev => ({
            ...prev,
            webSearchManual: e.target.checked
          }))}
        />
        <span>Búsqueda manual (solo cuando usuario lo pide explícitamente)</span>
      </label>
      
      <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs">
        <p className="font-medium text-blue-800 mb-1">💡 Cómo usar:</p>
        <ul className="list-disc ml-4 space-y-1 text-blue-700">
          <li>Automático: "¿Cuál es el precio actual de Bitcoin?"</li>
          <li>Manual: "Busca en internet el precio de Bitcoin"</li>
        </ul>
      </div>
    </div>
  )}
</div>
```

#### 2.3 Integrate Web Search in Message Flow

**File:** `src/pages/api/conversations/[id]/messages.ts`

```typescript
// In message processing
export const POST: APIRoute = async ({ params, request, cookies }) => {
  // ... existing auth & setup ...
  
  const { message, model, systemPrompt } = await request.json();
  
  // Check if agent has web search enabled
  const agentConfig = await getAgentConfig(conversationId);
  
  let webSearchContext = '';
  
  if (agentConfig?.webSearchEnabled) {
    // Detect if web search is needed
    const needsWebSearch = 
      agentConfig.webSearchAutomatic && detectWebSearchIntent(message) ||
      agentConfig.webSearchManual && message.toLowerCase().includes('busca en internet');
    
    if (needsWebSearch) {
      console.log('🌐 Web search enabled for this query');
      
      // Extract search query from message
      const searchQuery = extractSearchQuery(message);
      
      // Search and extract web content
      webSearchContext = await searchAndExtractWeb(searchQuery, 3);
      
      console.log(`✅ Web search complete: ${webSearchContext.length} chars from 3 sources`);
    }
  }
  
  // Build AI context (existing context + web search results)
  const contextString = buildContextString(
    contextSources,
    messageHistory,
    systemPrompt,
    webSearchContext // ✅ NEW: Add web search results
  );
  
  // ... rest of message processing ...
};

function detectWebSearchIntent(message: string): boolean {
  const webSearchKeywords = [
    'actual', 'actualizado', 'reciente', 'hoy', 'ahora',
    'precio', 'cotización', 'noticias', 'últimas',
    'current', 'latest', 'today', 'now', 'price', 'news'
  ];
  
  const messageLower = message.toLowerCase();
  return webSearchKeywords.some(keyword => messageLower.includes(keyword));
}

function extractSearchQuery(message: string): string {
  // Simple extraction - can be enhanced with NLP
  // Remove common conversational prefixes
  return message
    .replace(/^(busca|búscame|dame información sobre|cuál es|cómo está|what is|search for)/i, '')
    .trim();
}
```

---

### Phase 3: Version Control & Change Notifications (Week 5-6)

**Goal:** Users see when context changed and can compare versions

#### 3.1 Version History UI

**Component:** `ContextVersionHistory.tsx`

```typescript
export function ContextVersionHistory({ 
  source 
}: { 
  source: ContextSource 
}) {
  const [selectedVersions, setSelectedVersions] = useState<[number, number]>([
    source.currentVersion || 0,
    Math.max(0, (source.currentVersion || 0) - 1)
  ]);
  
  const versions = source.versions || [];
  const currentContent = source.extractedData || '';
  
  // Get version contents
  const version1 = selectedVersions[0] === source.currentVersion
    ? currentContent
    : versions.find(v => v.version === selectedVersions[0])?.extractedData || '';
  
  const version2 = selectedVersions[1] === source.currentVersion
    ? currentContent
    : versions.find(v => v.version === selectedVersions[1])?.extractedData || '';
  
  // Simple diff
  const changes = calculateDiff(version1, version2);
  
  return (
    <div className="space-y-4">
      <h4 className="font-semibold">📜 Historial de Versiones</h4>
      
      {/* Version selectors */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Versión 1</label>
          <select
            value={selectedVersions[0]}
            onChange={(e) => setSelectedVersions([parseInt(e.target.value), selectedVersions[1]])}
            className="mt-1 block w-full px-3 py-2 border rounded"
          >
            <option value={source.currentVersion}>
              v{source.currentVersion} (Actual)
            </option>
            {versions.map(v => (
              <option key={v.version} value={v.version}>
                v{v.version} ({formatDate(v.extractedAt)})
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="text-sm font-medium">Versión 2</label>
          <select
            value={selectedVersions[1]}
            onChange={(e) => setSelectedVersions([selectedVersions[0], parseInt(e.target.value)])}
            className="mt-1 block w-full px-3 py-2 border rounded"
          >
            <option value={source.currentVersion}>
              v{source.currentVersion} (Actual)
            </option>
            {versions.map(v => (
              <option key={v.version} value={v.version}>
                v{v.version} ({formatDate(v.extractedAt)})
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Diff display */}
      <div className="border rounded-lg p-4 bg-slate-50">
        <div className="flex items-center justify-between mb-2">
          <h5 className="font-medium text-sm">Cambios Detectados</h5>
          <span className="text-xs text-slate-600">
            {changes.additions} adiciones, {changes.deletions} eliminaciones
          </span>
        </div>
        
        <div className="space-y-1 text-xs font-mono max-h-60 overflow-y-auto">
          {changes.lines.map((line, idx) => (
            <div
              key={idx}
              className={
                line.type === 'addition' ? 'bg-green-100 text-green-800' :
                line.type === 'deletion' ? 'bg-red-100 text-red-800' :
                'text-slate-700'
              }
            >
              {line.type === 'addition' && '+ '}
              {line.type === 'deletion' && '- '}
              {line.content}
            </div>
          ))}
        </div>
      </div>
      
      {/* Revert button */}
      {selectedVersions[1] !== source.currentVersion && (
        <button
          onClick={() => handleRevertToVersion(selectedVersions[1])}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
        >
          <RotateCcw className="w-4 h-4" />
          Restaurar versión {selectedVersions[1]}
        </button>
      )}
    </div>
  );
}

function calculateDiff(text1: string, text2: string) {
  // Simple word-level diff
  const words1 = text1.split(/\s+/);
  const words2 = text2.split(/\s+/);
  
  // Use a simple LCS algorithm or library like diff-match-patch
  // For now, simplified comparison
  
  const additions = words1.filter(w => !words2.includes(w)).length;
  const deletions = words2.filter(w => !words1.includes(w)).length;
  
  return {
    additions,
    deletions,
    lines: [] // Simplified for now
  };
}
```

#### 3.2 Staleness Indicators in UI

**Enhancement:** Show freshness badges on context sources

```typescript
// In context source card
function getFreshnessBadge(source: ContextSource) {
  if (!source.freshness?.lastRefreshed) {
    return <span className="text-xs text-slate-500">Sin actualizar</span>;
  }
  
  const daysSinceRefresh = Math.floor(
    (Date.now() - source.freshness.lastRefreshed.getTime()) / (24 * 60 * 60 * 1000)
  );
  
  const isFresh = daysSinceRefresh < 1;
  const isCurrent = daysSinceRefresh < 7;
  const isStale = daysSinceRefresh > 30;
  
  return (
    <span className={`
      text-xs px-2 py-0.5 rounded-full font-medium
      ${isFresh ? 'bg-green-100 text-green-700' : ''}
      ${isCurrent && !isFresh ? 'bg-yellow-100 text-yellow-700' : ''}
      ${isStale ? 'bg-red-100 text-red-700' : ''}
      ${!isFresh && !isCurrent && !isStale ? 'bg-slate-100 text-slate-600' : ''}
    `}>
      {isFresh && '✅ Actualizado hoy'}
      {isCurrent && !isFresh && `⏰ ${daysSinceRefresh}d`}
      {isStale && `⚠️ ${daysSinceRefresh}d desactualizado`}
    </span>
  );
}
```

---

### Phase 4: Smart Context Selection (Week 7-8)

**Goal:** AI automatically uses best context source (static vs web)

#### 4.1 Context Source Ranking

```typescript
/**
 * Rank context sources by relevance and freshness
 * Returns prioritized list for AI context
 */
export function rankContextSources(
  sources: ContextSource[],
  query: string,
  options?: {
    prioritizeFreshness?: boolean; // Default: false
    maxAge?: number; // Max days old (default: 30)
  }
): ContextSource[] {
  return sources
    .map(source => {
      // Calculate freshness score
      const daysSinceUpdate = source.freshness?.lastRefreshed
        ? Math.floor((Date.now() - source.freshness.lastRefreshed.getTime()) / (24 * 60 * 60 * 1000))
        : 999;
      
      const freshnessScore = Math.max(0, 1 - (daysSinceUpdate / (options?.maxAge || 30)));
      
      // Calculate relevance score (simple keyword matching - can use embeddings later)
      const relevanceScore = calculateRelevance(source.name, query);
      
      // Calculate quality score
      const qualityScore = source.certified ? 1.0 :
                          source.qualityRating ? source.qualityRating / 5 :
                          0.5;
      
      // Combined score (weighted)
      const score = options?.prioritizeFreshness
        ? freshnessScore * 0.6 + relevanceScore * 0.3 + qualityScore * 0.1
        : relevanceScore * 0.6 + qualityScore * 0.3 + freshnessScore * 0.1;
      
      return { source, score };
    })
    .sort((a, b) => b.score - a.score)
    .map(item => item.source);
}

function calculateRelevance(sourceName: string, query: string): number {
  const sourceWords = sourceName.toLowerCase().split(/\s+/);
  const queryWords = query.toLowerCase().split(/\s+/);
  
  const matches = queryWords.filter(qw => 
    sourceWords.some(sw => sw.includes(qw) || qw.includes(sw))
  ).length;
  
  return matches / queryWords.length;
}
```

---

## 📊 Competitive Advantage Matrix

### Flow vs ChatGPT/Gemini

| Capability | ChatGPT/Gemini Web | Flow (After Implementation) | Advantage |
|---|---|---|---|
| **Current Public Info** | ✅ Always fresh | ✅ Web search + auto-refresh | ⚖️ Equal |
| **Private Documents** | ❌ Cannot access | ✅ Secure upload & versioning | ✅ Flow |
| **Historical Context** | ❌ No version history | ✅ Full version control | ✅ Flow |
| **Validation** | ❌ No certification | ✅ Expert validation system | ✅ Flow |
| **Source Transparency** | ❌ Hidden sources | ✅ Full source attribution | ✅ Flow |
| **Multi-Agent Context** | ❌ Single context pool | ✅ Isolated agent contexts | ✅ Flow |
| **Cost** | $$$ (ChatGPT Plus $20/mo) | $ (Pay per use, ~$2/mo) | ✅ Flow (90% cheaper) |
| **Privacy** | ❌ Data sent to OpenAI/Google | ✅ Private GCP deployment | ✅ Flow |
| **Customization** | ❌ Generic responses | ✅ Custom prompts per agent | ✅ Flow |
| **Integration** | ❌ No enterprise integrations | ✅ API/CRM/Database connectors | ✅ Flow |

**Result**: Flow provides **superior** solution combining private knowledge + current web + validation + customization

---

## 💰 Cost-Benefit Analysis

### Current State (Without Auto-Refresh)

**User Perception:**
- "Context está desactualizado"
- "ChatGPT es mejor porque tiene internet"
- **NPS: < 50** (estimated)

**Churning Users:**
- Lost to ChatGPT: ~20% (hypothetical)
- Revenue impact: -$X per month

### With Auto-Refresh + Web Search

**User Perception:**
- "Contexto siempre actualizado"
- "Mejor que ChatGPT porque tiene mi contexto privado + internet"
- **NPS: 90+** (target)

**Cost Analysis:**
```
Daily refresh for 100 sources:
- Google Search API: $5/1000 queries = $0.50/day
- Gemini extraction: 100 sources × 10K tokens × $0.075/1M = $0.075/day
- Cloud Scheduler: $0.10/day
TOTAL: ~$0.725/day = ~$22/month for 100 sources

Benefit:
- Retain 20% more users
- Each user worth $10/month (hypothetical)
- 20 users × $10 = $200/month revenue saved
ROI: 909% 🚀
```

---

## 🎯 Implementation Priority

### Immediate (This Week)

**Priority 1: Quick Win - Manual Refresh**
- [ ] Add "🔄 Actualizar" button to web/API sources
- [ ] Implement immediate re-extraction on click
- [ ] Show "Actualizado hace X tiempo" indicator
- **Impact:** Users can manually refresh stale content
- **Effort:** 4 hours
- **NPS Impact:** +10 points

**Priority 2: Staleness Indicators**
- [ ] Add `lastRefreshed` field to all web sources
- [ ] Display freshness badges in UI
- [ ] Warning for sources >30 days old
- **Impact:** Transparency about content age
- **Effort:** 2 hours
- **NPS Impact:** +5 points

### Short-term (Next 2 Weeks)

**Priority 3: Automatic Daily Refresh**
- [ ] Implement Cloud Scheduler job
- [ ] Background refresh service
- [ ] User opt-in controls
- [ ] Change detection & notifications
- **Impact:** Context always current
- **Effort:** 16 hours
- **NPS Impact:** +20 points

**Priority 4: Web Search Integration**
- [ ] Google Custom Search API setup
- [ ] Query-time web lookup
- [ ] User toggle in agent config
- **Impact:** Match ChatGPT web access
- **Effort:** 20 hours
- **NPS Impact:** +30 points

### Medium-term (Month 2)

**Priority 5: Version Control & Diff**
- [ ] Version history storage
- [ ] Visual diff viewer
- [ ] Revert to previous version
- **Impact:** Trust through transparency
- **Effort:** 12 hours
- **NPS Impact:** +10 points

---

## 📈 Success Metrics

### KPIs to Track

**User Satisfaction:**
- NPS score (target: 90+)
- Feature adoption rate (auto-refresh enabled)
- Manual refresh usage frequency
- Feedback mentions of "outdated" (target: <5%)

**Technical Metrics:**
- Refresh success rate (target: >99%)
- Average refresh time (target: <5s per source)
- Web search query time (target: <2s)
- Storage costs (monitor Cloud Storage growth)

**Business Metrics:**
- User retention (prevent churn)
- Competitive advantage (Flow vs ChatGPT)
- Cost per user per month
- ROI of refresh system

---

## 🔐 Privacy & Security Considerations

### Data Handling

**Web Search Results:**
- ✅ Temporary - not stored permanently
- ✅ User consent required (opt-in toggle)
- ✅ Source attribution shown
- ✅ Filtered for relevance

**Auto-Refresh:**
- ✅ Only refreshes web/API sources
- ✅ Never touches user-uploaded private documents
- ✅ User can disable per source
- ✅ Audit trail of all refreshes

### Compliance

**GDPR/CCPA:**
- ✅ User controls data refresh
- ✅ Clear transparency about web access
- ✅ Can export full version history
- ✅ Can delete all versions

---

## 🎓 User Communication Strategy

### Messaging to Users

**Email/In-App Announcement:**

```
🎉 Nuevo: Contexto Siempre Actualizado

Escuchamos tu feedback sobre documentos desactualizados.

✅ Ahora disponible:
- Actualización automática de fuentes web
- Búsqueda en internet en tiempo real
- Indicadores de frescura de contenido
- Control total sobre frecuencia de actualización

Flow ahora combina:
✅ Tu contexto privado y validado
✅ Información pública siempre actualizada
✅ A 1% del costo de ChatGPT Plus

¿El resultado? Lo mejor de ambos mundos. 🌍✨

Activa la actualización automática en Configuración de Fuente.
```

### Help Documentation

**New Guide:** `docs/user-guides/keeping-context-fresh.md`

Topics:
1. Why context freshness matters
2. Types of context (static vs dynamic)
3. Enabling automatic refresh
4. Using web search
5. Version history and comparison
6. Best practices for source management

---

## 🔮 Future Enhancements (Month 3+)

### Advanced Features

**1. Intelligent Refresh Scheduling**
- ML model predicts when content likely to change
- Adaptive refresh frequency
- Cost optimization

**2. Multi-Source Synthesis**
- Combine multiple web sources automatically
- Cross-reference validation
- Confidence scoring

**3. Live Data Streams**
- WebSocket connections for real-time updates
- Event-driven refresh triggers
- Push notifications for changes

**4. Collaborative Validation**
- Team members vote on source quality
- Crowdsourced freshness verification
- Expert review workflow

---

## ✅ Implementation Checklist

### Week 1: Foundation
- [ ] Design freshness schema addition
- [ ] Update ContextSource TypeScript interfaces
- [ ] Add freshness fields to Firestore
- [ ] Create refresh service skeleton
- [ ] Basic UI for manual refresh

### Week 2: Manual Refresh
- [ ] Implement manual refresh endpoint
- [ ] Add refresh button to UI
- [ ] Show last refresh timestamp
- [ ] Test with web sources
- [ ] Deploy to production

### Week 3: Auto-Refresh
- [ ] Create Cloud Scheduler job
- [ ] Implement batch refresh logic
- [ ] Add user controls for schedule
- [ ] Change detection algorithm
- [ ] Email notifications for changes

### Week 4: Web Search
- [ ] Google Custom Search API setup
- [ ] Web search integration in message flow
- [ ] Agent web search toggle
- [ ] Query intent detection
- [ ] Source attribution in responses

### Week 5-6: Version Control
- [ ] Version storage architecture
- [ ] Version history UI
- [ ] Diff viewer component
- [ ] Revert functionality
- [ ] Version management API

### Week 7-8: Polish & Optimize
- [ ] Performance optimization
- [ ] Error handling improvements
- [ ] User documentation
- [ ] Admin analytics dashboard
- [ ] A/B testing for adoption

---

## 🎯 Success Criteria

**Phase 1 Complete When:**
- ✅ Users can manually refresh any web source
- ✅ Freshness indicators visible in UI
- ✅ No sources >7 days old without indicator
- ✅ Refresh completes in <10 seconds

**Phase 2 Complete When:**
- ✅ Auto-refresh runs successfully daily
- ✅ >80% users enable auto-refresh
- ✅ Web search available in agents
- ✅ NPS improvement of +20 points

**Phase 3 Complete When:**
- ✅ Version history accessible for all sources
- ✅ Users can compare and revert versions
- ✅ Change notifications delivered
- ✅ NPS >90 sustained for 30 days

---

## 💡 Learnings & Principles

### Why This Matters

**User Trust:**
- Stale information destroys trust
- Current information builds confidence
- Transparency about freshness is key

**Competitive Positioning:**
- Can't compete with ChatGPT on web access alone
- Must combine private + public + validation
- Speed + freshness + control = differentiation

**Value Proposition:**
```
ChatGPT: Generic knowledge + Web access
Flow:    Private knowledge + Web access + Validation + Multi-agent + Version control
         
         = 100x value at 1% cost ✅
```

### Design Decisions

**Why Hybrid (Not Just Web Search):**
- Users have valuable private documents
- Validation adds trust layer
- Compliance requires data control
- Enterprise needs audit trails

**Why Auto-Refresh (Not Real-time Only):**
- Balance freshness vs cost
- Most content doesn't change hourly
- Daily/weekly sufficient for 90% use cases
- Real-time available when needed

**Why Version Control:**
- Users need to see what changed
- Ability to revert builds confidence
- Audit trail for compliance
- Learning from content evolution

---

## 📚 Related Documentation

**Architecture:**
- `docs/architecture/CONTEXT_LOADING_STRATEGY.md` - Loading performance
- `.cursor/rules/data.mdc` - Data schema
- `.cursor/rules/agents.mdc` - Agent context

**Implementation:**
- `CONTEXT_SOURCES_PERSISTENCE_FIX_2025-10-13.md` - Persistence architecture
- `STORAGE_ARCHITECTURE.md` - Where context is stored

**User Guides:**
- (To create) `docs/user-guides/keeping-context-fresh.md`
- (To create) `docs/user-guides/web-search-in-agents.md`

---

## 🚀 Next Steps

**Immediate Actions:**

1. **Create technical spec** for freshness fields
2. **Prototype manual refresh** button
3. **User interview** - validate auto-refresh need
4. **Cost estimate** for Google Search API at scale
5. **Setup Cloud Scheduler** in GCP

**This Week:**
- Implement Priority 1 (Manual Refresh)
- Deploy to staging
- Test with 10 users
- Gather feedback
- Iterate

**Next Week:**
- Implement Priority 2 (Staleness Indicators)
- Start Priority 3 (Auto-Refresh)
- Document user guides
- Prepare announcement

---

**Remember:** Users don't care about our architecture. They care about having current, trustworthy information when they need it. This system delivers that at scale. 🎯✨

---

**Last Updated:** 2025-11-18  
**Owner:** Platform Team  
**Status:** 🔨 Ready for Implementation  
**Estimated Completion:** 8 weeks  
**Expected NPS Impact:** +50 points (from <50 to 90+)


