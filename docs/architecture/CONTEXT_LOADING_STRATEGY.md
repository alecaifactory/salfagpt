# Context Loading Strategy - Performance Architecture

**Date**: 2025-10-21  
**Purpose**: Document the multi-tier context loading strategy for optimal performance  
**Status**: ✅ Production Implementation

---

## 🎯 Loading Strategy Overview

Flow uses a **3-tier loading strategy** for context sources, optimized for different use cases:

```
┌─────────────────────────────────────────────────────────┐
│           CONTEXT LOADING STRATEGY                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  TIER 1: Assignment Update (Optimistic)                 │
│  • Update local state only                              │
│  • No API calls after assignment                        │
│  • Instant UI feedback                                  │
│  • Time: ~50ms                                          │
│  • Data: 0 bytes (in-memory)                           │
│                                                         │
│  TIER 2: Lightweight Metadata Refresh                   │
│  • Agent-filtered metadata only                         │
│  • No extractedData                                     │
│  • No RAG verification                                  │
│  • Time: ~200ms                                         │
│  • Data: ~10KB                                          │
│                                                         │
│  TIER 3: Full Load with RAG Verification                │
│  • Complete metadata                                    │
│  • RAG chunk verification                               │
│  • Current RAG status                                   │
│  • Time: ~2-5s                                          │
│  • Data: ~50-100KB + N×50KB for RAG calls              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 Tier Details

### Tier 1: Optimistic Assignment Update

**When Used**:
- Immediately after assignment in Context Management Dashboard
- User assigns/unassigns sources to agents

**What Happens**:
```typescript
// 1. API call to save assignment (background)
POST /api/context-sources/bulk-assign
{ sourceId, agentIds }

// 2. Update local state immediately (foreground)
setSources(prev => prev.map(s => 
  s.id === sourceId 
    ? { ...s, assignedToAgents: agentIds }
    : s
))

// 3. UI reflects change instantly ⚡
```

**Performance**:
- Time: ~50ms (in-memory update)
- API Calls: 1 (assignment only)
- Data Transfer: ~1KB (assignment payload)
- User Perception: Instant ✨

**Trade-off**: 
- ✅ Extremely fast
- ⚠️ Assumes API will succeed (optimistic)
- ✅ If API fails, can roll back local state

---

### Tier 2: Lightweight Metadata Refresh

**When Used**:
- When Context Management modal closes
- When Context Settings modal closes
- After simple metadata changes

**What Happens**:
```typescript
// 1. Call lightweight endpoint
GET /api/conversations/:id/context-sources-metadata

// 2. API returns:
{
  sources: [
    {
      id: '...',
      name: 'Document.pdf',
      assignedToAgents: ['agent1', 'agent2'],
      enabled: true,
      labels: ['PUBLIC'],
      metadata: { pageCount, tokensEstimate },
      ragEnabled: true, // From Firestore
      ragMetadata: { chunkCount, avgChunkSize }, // From Firestore
      // NO extractedData
      // NO RAG verification
    }
  ]
}

// 3. Update UI with fresh metadata
setContextSources(sourcesWithDates)
```

**Performance**:
- Time: ~200ms (single filtered query)
- API Calls: 1 (lightweight endpoint)
- Data Transfer: ~10KB (metadata only)
- User Perception: Fast ✅

**Trade-off**:
- ✅ Very fast
- ✅ Shows updated assignments
- ⚠️ RAG metadata might be slightly stale (trusted from Firestore)
- ✅ Good enough for list display

---

### Tier 3: Full Load with RAG Verification

**When Used**:
- User switches agents
- After RAG indexing
- Initial agent load
- When RAG state absolutely needs to be current

**What Happens**:
```typescript
// 1. Load all user's metadata
GET /api/context-sources-metadata?userId=...

// 2. Filter by agent assignment
const filtered = allSources.filter(/* PUBLIC or assigned */)

// 3. For EACH source, verify RAG chunks
for (const source of filtered) {
  GET /api/context-sources/:id/chunks
  // Check if chunks exist
  // Update ragEnabled flag
}

// 4. Update UI with complete verified state
setContextSources(sourcesWithVerifiedRAG)
```

**Performance**:
- Time: ~2-5s (N × verification calls)
- API Calls: 10-15 (1 metadata + N RAG verifications)
- Data Transfer: ~50-100KB + (N × 50KB)
- User Perception: Noticeable but acceptable for important operations

**Trade-off**:
- ⚠️ Slower (2-5s)
- ✅ 100% accurate RAG state
- ✅ Needed for critical decisions (switching agents, post-indexing)

---

## 🎛️ Usage Decision Matrix

| User Action | Tier | Reason |
|-----|------|--------|
| Assign in Context Mgmt | 1 (Optimistic) | Instant feedback needed |
| Close Context Mgmt | 2 (Lightweight) | Just show updated assignments |
| Close Settings Modal | 2 (Lightweight) | Just toggled RAG, metadata unchanged |
| Switch Agent | 3 (Full) | Need current RAG state for new agent |
| After RAG Indexing | 3 (Full) | Verify indexing worked |
| Initial Agent Load | 3 (Full) | Need complete accurate state |
| Send Message | - (Lazy) | Load extractedData on-demand from backend |

---

## 🚀 Lazy Loading of extractedData

**Key Principle**: Never load `extractedData` in the frontend unless absolutely necessary.

### When extractedData is Loaded

**ONLY when**:
1. User sends a message → Backend loads it for AI prompt
2. User expands content preview in modal → Fetch on-demand
3. User exports source → Fetch on-demand

**NEVER when**:
- ❌ Listing sources (use metadata only)
- ❌ Showing assignments (use metadata only)
- ❌ Displaying source cards (use metadata only)
- ❌ Filtering/sorting (use metadata only)

### Implementation

```typescript
// ❌ WRONG: Load extractedData for list view
const sources = await getContextSources(userId); // Fetches extractedData

// ✅ CORRECT: Load metadata only for list view
const sources = await getContextSourcesMetadata(userId); // No extractedData

// ✅ CORRECT: Load extractedData on-demand
const handleExpandContent = async (sourceId: string) => {
  const response = await fetch(`/api/context-sources/${sourceId}`);
  const fullSource = await response.json();
  // Now we have extractedData
  showContentModal(fullSource);
};
```

---

## 📡 API Endpoint Strategy

### Three Metadata Endpoints

1. **`/api/context-sources-metadata?userId=X`**
   - **Purpose**: All user's sources (metadata only)
   - **Returns**: All sources, NOT filtered by agent
   - **Use Case**: Context Management Dashboard (admin view)
   - **Performance**: ~100ms for 100 sources

2. **`/api/context-sources/all-metadata`**
   - **Purpose**: All sources across all users (superadmin only)
   - **Returns**: All sources, all users
   - **Use Case**: Admin panel, bulk operations
   - **Performance**: ~200ms for 1000+ sources

3. **`/api/conversations/:id/context-sources-metadata`** (NEW ⭐)
   - **Purpose**: Agent-specific sources (filtered)
   - **Returns**: Only PUBLIC + assigned sources for this agent
   - **Use Case**: Lightweight refresh after modal close
   - **Performance**: ~50ms (pre-filtered, small dataset)

### Full Data Endpoint

**`/api/context-sources/:id`**
- **Purpose**: Complete source with extractedData
- **Returns**: Everything including full text content
- **Use Case**: Viewing content, re-extraction, detailed inspection
- **Performance**: ~500ms-2s (depends on content size)

---

## 🔄 State Management Strategy

### Local State (Frontend)

```typescript
const [contextSources, setContextSources] = useState<ContextSource[]>([]);
```

**Contains**:
- ✅ Metadata (name, type, labels, assignments)
- ✅ Toggle state (enabled/disabled)
- ✅ RAG metadata (chunkCount, if available)
- ❌ extractedData (never stored in frontend state)

**Updated By**:
- Tier 1: Optimistic in-memory update
- Tier 2: Lightweight API refresh
- Tier 3: Full API reload with verification

---

### Firestore (Backend)

**Collection**: `context_sources/{sourceId}`

**Contains**:
- ✅ All metadata
- ✅ extractedData (full text)
- ✅ assignedToAgents array
- ✅ RAG metadata
- ✅ Pipeline logs
- ✅ Everything

**Accessed**:
- During assignment: Update assignedToAgents only
- During lightweight refresh: Read metadata only
- During message send: Read extractedData for AI prompt
- During full load: Read everything

---

## 🎯 Performance Principles

### 1. Minimize Network Calls

**Bad**:
```typescript
for (const source of sources) {
  await fetch(`/api/context-sources/${source.id}/verify-rag`); // N calls ❌
}
```

**Good**:
```typescript
// Single call returns all needed data
const data = await fetch(`/api/conversations/:id/context-sources-metadata`); // 1 call ✅
```

### 2. Load Only What's Needed

**Bad**:
```typescript
const sources = await getContextSources(userId); // Includes extractedData ❌
// Wasted bandwidth for list view
```

**Good**:
```typescript
const sources = await getContextSourcesMetadata(userId); // Metadata only ✅
// Lightweight, fast
```

### 3. Trust Cached Data When Safe

**Bad**:
```typescript
// Verify RAG status every time
await verifyRAGStatus(source); // Unnecessary if just assigned ❌
```

**Good**:
```typescript
// Trust ragEnabled from Firestore for lightweight refresh
const ragEnabled = source.ragEnabled; // From last indexing ✅
// Verify only when switching agents or after indexing
```

### 4. Optimize for Common Case

**Common**: User assigns sources, closes modal (~80% of operations)  
**Rare**: User switches agents, triggers RAG indexing (~20% of operations)

**Strategy**: Optimize the 80%, accept slower load for 20%

---

## 📈 Monitoring

### Performance Metrics to Track

```typescript
// Log timing for each tier
console.time('Assignment (Tier 1)');
// ... assignment logic
console.timeEnd('Assignment (Tier 1)');
// Target: <200ms

console.time('Lightweight Refresh (Tier 2)');
// ... lightweight load
console.timeEnd('Lightweight Refresh (Tier 2)');
// Target: <300ms

console.time('Full Load (Tier 3)');
// ... full load with RAG verification
console.timeEnd('Full Load (Tier 3)');
// Target: <5s
```

### Alert Thresholds

- ⚠️ Tier 1 > 500ms: Investigate local state update logic
- ⚠️ Tier 2 > 1s: Check API endpoint, database query
- ⚠️ Tier 3 > 10s: Check RAG verification, consider reducing sources

---

## ✅ Best Practices

### DO's ✅

1. ✅ **Use Tier 1 for instant feedback** (assignment, toggles)
2. ✅ **Use Tier 2 for lightweight refreshes** (modal close, simple updates)
3. ✅ **Use Tier 3 for critical accuracy** (agent switch, post-indexing)
4. ✅ **Load extractedData on-demand** (only when sending message)
5. ✅ **Trust metadata from Firestore** (updated during indexing)

### DON'Ts ❌

1. ❌ **Don't reload after every change** (use optimistic updates)
2. ❌ **Don't verify RAG unless displaying** (trust cached metadata)
3. ❌ **Don't fetch extractedData for lists** (metadata is enough)
4. ❌ **Don't make N API calls** (batch or use single filtered endpoint)
5. ❌ **Don't use Tier 3 for simple refreshes** (overkill)

---

## 🔮 Evolution Path

### Current State (2025-10-21)

- ✅ 3-tier loading strategy
- ✅ Optimistic UI updates
- ✅ Lightweight metadata endpoints
- ✅ Smart RAG verification skipping

### Near Future (1-3 months)

- [ ] Debounced batch assignments
- [ ] Virtual scrolling for 1000+ sources
- [ ] IndexedDB cache for offline
- [ ] WebSocket real-time updates

### Long Term (6-12 months)

- [ ] GraphQL for flexible queries
- [ ] Edge caching for metadata
- [ ] Service Worker for offline mode
- [ ] Progressive Web App features

---

## 📚 References

### Internal Documentation
- `docs/performance/CONTEXT_ASSIGNMENT_OPTIMIZATION_2025-10-21.md` - Detailed optimization
- `docs/performance/PERFORMANCE_OPTIMIZATION_SUMMARY_2025-10-21.md` - Summary
- `.cursor/rules/alignment.mdc` - Performance as a Feature principle

### Code Files
- `src/components/ContextManagementDashboard.tsx` - Assignment logic
- `src/components/ChatInterfaceWorking.tsx` - Loading orchestration
- `src/pages/api/conversations/[id]/context-sources-metadata.ts` - Lightweight endpoint
- `src/lib/firestore.ts` - Data layer

---

**Last Updated**: 2025-10-21  
**Version**: 1.0.0  
**Status**: ✅ Production Ready

