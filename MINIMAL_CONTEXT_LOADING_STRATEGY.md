# Minimal Context Loading Strategy for RAG

## 🎯 **Core Principle**

**For RAG with BigQuery embeddings, we should NEVER load source content or metadata upfront!**

### **What We Actually Need:**

```
Frontend needs to know:
1. COUNT of sources assigned to agent (for display: "89 sources")
2. That's it! ✅

Backend has BigQuery with:
- All chunks
- All embeddings  
- All metadata
- User/source filtering built-in

When user asks question:
- Backend queries BigQuery
- Returns top K chunks
- Loads source NAMES for those K chunks only
- Returns to frontend
```

---

## 🚨 **Current Problem**

### **What's Happening Now:**

```
1. User selects agent
   ↓
2. Frontend calls: /api/conversations/[id]/context-sources-metadata
   ├─ Loads ALL 628 sources in 8 batches
   ├─ Filters to 89 assigned sources
   ├─ Loads toggle states
   └─ Takes 48 seconds! ⏱️
   ↓
3. User sends message (maybe before #2 completes!)
   ├─ If sources loaded: Sends 89 IDs ✅
   ├─ If sources NOT loaded: Sends 0 IDs ❌
   └─ Race condition!
```

### **Why This Is Wrong:**

- ❌ Loads 628 sources when agent only has 89
- ❌ Takes 48 seconds
- ❌ Loads metadata we don't need
- ❌ User can send message before loading completes
- ❌ Completely defeats the purpose of BigQuery/RAG!

---

## ✅ **Correct Approach**

### **Minimal Loading:**

```
1. User selects agent
   ↓
2. Frontend calls: /api/agents/[id]/context-stats (NEW!)
   └─ Returns: { count: 89, activeCount: 89 }
   └─ Takes: < 1 second ⚡
   ↓
3. Frontend displays: "89 fuentes activas"
   └─ NO source list needed!
   ↓
4. User sends message
   ├─ Frontend sends: agentId + question
   ├─ Backend queries BigQuery with agentId filter
   ├─ BigQuery returns top 5 chunks
   ├─ Backend loads 5 source names from Firestore
   └─ Returns answer with 5 references
   ↓
5. Frontend displays references with source names
```

### **Data Flow:**

```
Frontend State:
├─ contextSourcesCount: 89        ← For display only
├─ activeSourcesCount: 89         ← For display only
└─ NO contextSources array! ✅

Backend has everything in BigQuery:
├─ 3,021 chunks with embeddings
├─ Filtered by userId, sourceId
└─ Returns only what's relevant

Result:
├─ Load time: < 1 second (vs 48 seconds)
├─ No race conditions
├─ Minimal data transfer
└─ BigQuery does the heavy lifting
```

---

## 🔧 **Implementation Plan**

### **Step 1: Create Minimal Stats Endpoint**

**New file:** `src/pages/api/agents/[id]/context-stats.ts`

```typescript
export const GET: APIRoute = async ({ params, cookies }) => {
  const agentId = params.id;
  const session = getSession({ cookies });
  
  // Count sources assigned to this agent (fast query)
  const snapshot = await firestore
    .collection('context_sources')
    .where('userId', '==', session.id)
    .where('assignedToAgents', 'array-contains', agentId)
    .count()
    .get();
  
  const totalCount = snapshot.data().count;
  
  // Count active sources (from conversation_context)
  const contextDoc = await firestore
    .collection('conversation_context')
    .doc(agentId)
    .get();
  
  const activeCount = contextDoc.data()?.activeContextSourceIds?.length || 0;
  
  return new Response(JSON.stringify({
    totalCount,
    activeCount,
    agentId
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
```

**Performance:** < 500ms (just 2 count queries)

---

### **Step 2: Update Frontend to Use Minimal Data**

**In ChatInterfaceWorking.tsx:**

```typescript
// Remove: loadContextForConversation() ❌
// Add: loadContextStats() ✅

const loadContextStats = async (agentId: string) => {
  const response = await fetch(`/api/agents/${agentId}/context-stats`);
  const data = await response.json();
  
  setContextSourcesCount(data.totalCount);
  setActiveSourcesCount(data.activeCount);
  
  // That's it! No loading 628 sources!
};
```

---

### **Step 3: Modify sendMessage to Use AgentId Directly**

**In ChatInterfaceWorking.tsx:**

```typescript
// OLD (requires contextSources state):
const activeSourceIds = contextSources.filter(s => s.enabled).map(s => s.id);

// NEW (just send agentId):
const response = await fetch(`/api/conversations/${conversationId}/messages-stream`, {
  method: 'POST',
  body: JSON.stringify({
    userId,
    message,
    agentId: currentConversation, // ✅ Backend queries BigQuery by agentId!
    model,
    systemPrompt,
    ragTopK,
    ragMinSimilarity
  })
});
```

---

### **Step 4: Update Backend to Query BigQuery by AgentId**

**In messages-stream.ts:**

```typescript
// OLD:
const activeSourceIds = body.activeSourceIds || [];
const searchResult = await searchRelevantChunksOptimized(userId, message, {
  activeSourceIds
});

// NEW:
const agentId = body.agentId;

// Query BigQuery for chunks assigned to this agent
const sqlQuery = `
  SELECT chunk_id, source_id, full_text, similarity, metadata
  FROM (
    SELECT *, 
      (SELECT SUM(a*b)/...) AS similarity
    FROM \`salfagpt.flow_analytics.document_embeddings\`
    WHERE user_id = @userId
      AND source_id IN (
        SELECT id FROM \`salfagpt.flow_analytics.context_sources\`
        WHERE @agentId IN UNNEST(assignedToAgents)
      )
  )
  WHERE similarity >= @minSimilarity
  ORDER BY similarity DESC
  LIMIT @topK
`;
```

**Performance:** BigQuery handles the join, still < 500ms!

---

## 📊 **Performance Comparison**

| Approach | Load Time | Data Transferred | User Can Send |
|----------|-----------|------------------|---------------|
| **Current** | 48s | 628 sources (MB) | After 48s |
| **Optimized (IDs)** | 48s | 89 IDs (KB) | After 48s |
| **MINIMAL (stats only)** | < 1s | Count only (bytes) | Immediately! ✅ |

---

## 🎯 **Recommended Architecture**

### **Frontend State (Minimal):**

```typescript
// DON'T load:
❌ contextSources: ContextSource[] // NO! Too heavy

// DO load:
✅ contextSourcesCount: number     // For display: "89 sources"
✅ activeSourcesCount: number      // For display: "89 active"
✅ agent: { id, name, model }      // For agent info
```

### **Display:**

```
SSOMA Agent
├─ 89 fuentes de contexto
└─ [Send message button] ← Always ready!

When user clicks a source panel (optional):
└─ THEN load source list (lazy load)
```

### **RAG Search:**

```
User sends: "¿Qué hacer...?"
  ↓
Backend receives: { agentId, message }
  ↓
BigQuery query:
  WHERE user_id = userId
    AND source_id IN (SELECT id WHERE agentId IN assignedToAgents)
    AND similarity >= 0.5
  ORDER BY similarity DESC
  LIMIT 5
  ↓
Returns: 5 chunks with source_id
  ↓
Load 5 source names from Firestore
  ↓
Return: Answer + 5 references
```

**Total time:** ~1.5s (no 48-second wait!)

---

## 🚀 **Immediate Fix (Quick Win)**

For now, without changing the architecture, let's fix the race condition:

**Option A: Wait for sources before enabling send button**
```typescript
const [sourcesLoaded, setSourcesLoaded] = useState(false);

// Disable send until loaded
<button disabled={!sourcesLoaded || !inputMessage}>
```

**Option B: Use cached sources** (already implemented)
```typescript
// Cache sources after first load
// Next time: Instant (<1ms)
```

**Option C: Pre-load sources on app start**
```typescript
// Load sources for all agents once
// Cache in memory
// Always available
```

---

## 🎯 **What Should We Do?**

### **Quick Fix (Now):**
1. ✅ Fix the `activeContextSources` bug (DONE)
2. ✅ Add wait/cache for sources before allowing send
3. ✅ Show loading state while sources load

### **Proper Fix (Soon):**
1. Create `/api/agents/[id]/context-stats` endpoint (count only)
2. Remove context sources loading from agent selection
3. Backend queries BigQuery by agentId directly
4. Load source names only for results

### **Ideal Architecture (Future):**
1. Move source metadata to BigQuery
2. Single BigQuery query gets everything
3. < 500ms total
4. No Firestore queries for RAG

---

**Which approach do you want me to implement?**

A) **Quick fix** - Cache sources + wait before send (5 min)
B) **Proper fix** - Stats endpoint + agentId-based search (30 min)
C) **Both** - Quick fix now, proper fix next
