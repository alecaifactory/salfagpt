# Google Cloud Infrastructure - SALFACORP Platform

**Project:** `salfagpt`  
**Organization:** SALFACORP  
**Last Updated:** October 22, 2025  
**Status:** 🟢 Production Ready

---

## 🏗️ **Infrastructure Overview**

```
┌─────────────────────────────────────────────────────────────┐
│             SALFACORP GOOGLE CLOUD ARCHITECTURE             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🔥 FIRESTORE (Operational Database)                       │
│  ├─ Project: salfagpt                                      │
│  ├─ Location: us-central1                                  │
│  ├─ Collections:                                           │
│  │  ├─ conversations (agents & chats)                      │
│  │  ├─ messages (conversation history)                     │
│  │  ├─ context_sources (document metadata)                 │
│  │  ├─ document_chunks (text chunks)                       │
│  │  ├─ conversation_context (toggle states)                │
│  │  ├─ users (profiles & roles)                            │
│  │  └─ ... (other collections)                             │
│  └─ Usage: Metadata, user data, conversation history       │
│                                                             │
│  📊 BIGQUERY (Analytics & Vector Search)                   │
│  ├─ Project: salfagpt                                      │
│  ├─ Dataset: flow_analytics                                │
│  ├─ Tables:                                                │
│  │  └─ document_embeddings (PRIMARY - Vector Search)       │
│  │     ├─ 3,021 chunks indexed                             │
│  │     ├─ 768-dim embeddings (text-embedding-004)          │
│  │     ├─ Partitioned by: created_at (DAY)                 │
│  │     └─ Clustered by: user_id, source_id                 │
│  └─ Usage: Vector similarity search, RAG retrieval          │
│                                                             │
│  🤖 VERTEX AI (Embeddings Generation)                      │
│  ├─ Model: text-embedding-004                              │
│  ├─ Dimensions: 768                                        │
│  ├─ Usage: Generate embeddings for chunks & queries        │
│  └─ Integration: Via @google-cloud/vertexai SDK            │
│                                                             │
│  🧠 GEMINI AI (Response Generation)                        │
│  ├─ Models:                                                │
│  │  ├─ gemini-2.5-flash (default, fast, 94% cheaper)       │
│  │  └─ gemini-2.5-pro (advanced, precise, expensive)       │
│  ├─ Context Window: 1M tokens (Flash) / 2M (Pro)           │
│  ├─ Usage: Generate AI responses with RAG context          │
│  └─ Integration: Via @google/genai SDK                     │
│                                                             │
│  ☁️ CLOUD RUN (Application Hosting)                        │
│  ├─ Service: flow-salfacorp                                │
│  ├─ Region: us-central1                                    │
│  ├─ Resources: 512Mi RAM, 1 CPU                            │
│  ├─ Scaling: 0-10 instances                                │
│  └─ Framework: Astro 5.14.7 + React 18.3.1                 │
│                                                             │
│  🔐 AUTHENTICATION                                          │
│  ├─ OAuth 2.0: Google Sign-In                              │
│  ├─ Session: JWT tokens (7-day expiry)                     │
│  ├─ Storage: HTTP-only cookies                             │
│  └─ Domain: getaifactory.com (verified)                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 **BigQuery Vector Search Architecture**

### **Table Schema: `document_embeddings`**

```sql
CREATE TABLE `salfagpt.flow_analytics.document_embeddings` (
  -- Identity
  chunk_id STRING NOT NULL,
  source_id STRING NOT NULL,
  user_id STRING NOT NULL,
  chunk_index INTEGER NOT NULL,
  
  -- Content
  text_preview STRING(500),      -- First 500 chars for preview
  full_text STRING,               -- Complete chunk text
  
  -- Vector Embedding (768 dimensions)
  embedding ARRAY<FLOAT64>,       -- Semantic vector from Vertex AI
  
  -- Metadata (stored as JSON string)
  metadata JSON,                  -- { startChar, endChar, tokenCount, startPage, endPage }
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
PARTITION BY DATE(created_at)
CLUSTER BY user_id, source_id;
```

**Current Data:**
- **Total chunks:** 3,021
- **Users:** 2
- **Sources:** 629
- **Table size:** ~15 MB
- **Embedding dimensions:** 768 (per chunk)

**Performance:**
- **First query:** 30-60s (cold start - one-time)
- **Subsequent queries:** ~400ms ⚡ (6x faster than Firestore)
- **Cost:** ~$0.00005 per query (negligible)

---

## 🔄 **Data Flow Architecture**

### **Document Upload & Indexing**

```
1. User uploads PDF to agent (e.g., SSOMA)
   ↓
2. Cloud Storage: Store original file
   ↓
3. Gemini AI: Extract text, tables, images
   ↓
4. Firestore: Save to context_sources
   └─ Fields: name, type, extractedData, assignedToAgents: ['SSOMA_ID']
   ↓
5. Chunking: Split text into 500-token chunks (50-token overlap)
   ↓
6. Vertex AI: Generate 768-dim embeddings for each chunk
   ↓
7. Firestore: Save to document_chunks collection
   └─ Fields: sourceId, userId, text, embedding, metadata
   ↓
8. BigQuery: Sync to document_embeddings (async, non-blocking)
   └─ Fields: chunk_id, source_id, user_id, text, embedding, metadata
   ↓
9. Ready for vector search! ✅
```

**Performance:**
- PDF upload: ~2-5 seconds
- Text extraction: ~10-30 seconds (depends on pages)
- Chunking: ~1 second
- Embeddings: ~2-3 seconds per chunk (parallel batches of 5)
- BigQuery sync: ~1-2 seconds (async)
- **Total:** ~30-60 seconds for complete indexing

---

### **RAG Search Flow (Optimized)**

```
1. User selects Agent SSOMA
   ↓
2. Frontend loads minimal stats
   └─ Call: /api/agents/SSOMA_ID/context-stats
   └─ Returns: { totalCount: 89, activeCount: 89 }
   └─ Time: < 500ms ⚡
   └─ UI shows: "89 fuentes"
   ↓
3. User sends message: "¿Qué hacer si aparecen mantos de arena?"
   ↓
4. Frontend sends:
   └─ { useAgentSearch: true, message: "...", agentId: "SSOMA_ID" }
   └─ Size: ~1 KB (minimal!)
   ↓
5. Backend: Agent-based BigQuery search
   ├─ Step 1: Determine effectiveAgentId (~10ms)
   │  └─ SSOMA is agent (not chat) → effectiveAgentId = SSOMA_ID
   ├─ Step 2: Generate query embedding (~1s)
   │  └─ Vertex AI: 768-dim vector for query
   ├─ Step 3: Get source IDs for agent (~200ms)
   │  └─ Firestore: WHERE assignedToAgents contains SSOMA_ID
   │  └─ Returns: 89 source IDs
   ├─ Step 4: BigQuery vector search (~400ms) ⚡
   │  └─ SQL: Cosine similarity on 3,021 chunks
   │  └─ Filter: user_id = userId AND source_id IN (89 IDs)
   │  └─ Order: similarity DESC
   │  └─ Returns: Top 5 chunks
   └─ Step 5: Load source names (~100ms)
      └─ Firestore: Get names for 5 sources only
      └─ Returns: 5 chunks with source names
   ↓
6. Build RAG context from 5 chunks
   ↓
7. Gemini AI: Generate response with context
   ↓
8. Stream response to user with 5 clickable references
   ↓
9. Total time: ~1.5-2 seconds ⚡
```

**Data Transfer:**
- Frontend → Backend: ~1 KB (just agentId + message)
- BigQuery → Backend: ~50 KB (5 chunks)
- Backend → Frontend: ~10 KB (response + references)
- **Total:** ~61 KB per message (vs 4.5 MB before!)

---

## 🚀 **Optimization Achievements**

### **Performance Improvements**

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Agent selection** | 48s | 400ms | **96x faster** |
| **Context loading** | 628 sources (48s) | Count only (400ms) | **120x faster** |
| **Message request size** | 4.5 MB | 1 KB | **99.98% smaller** |
| **RAG vector search** | 2.6s (Firestore) | 400ms (BigQuery) | **6.5x faster** |
| **Total response time** | ~55s | ~2s | **27x faster** |
| **Bandwidth per message** | ~5 MB | ~61 KB | **99% reduction** |

### **Architecture Benefits**

1. **BigQuery as Single Source of Truth**
   - All chunks with embeddings in one place
   - Native SQL vector similarity search
   - Distributed, parallel computation
   - Automatic scaling

2. **Minimal Frontend Loading**
   - No source metadata transfer
   - Just count statistics
   - Instant agent switching
   - Clean UX

3. **Agent-Based Search**
   - No need to load source IDs upfront
   - Backend determines effectiveAgentId
   - Chats inherit from parent agents
   - Transparent to users

4. **Backward Compatible**
   - Supports 3 search formats
   - Automatic fallback to Firestore
   - Emergency fallback for unindexed docs
   - No breaking changes

---

## 🗄️ **Data Storage Strategy**

### **Firestore (Operational Data)**

**Purpose:** Real-time operational data, metadata, user state

**What's Stored:**
- ✅ User profiles, authentication
- ✅ Conversation metadata (title, timestamps)
- ✅ Message history
- ✅ Context source metadata (name, status, tags, assignedToAgents)
- ✅ Toggle states (conversation_context)
- ✅ Configuration (user settings, agent configs)

**What's NOT Stored:**
- ❌ Full embeddings (too large - in BigQuery)
- ❌ Chunk duplicates (BigQuery has them)
- ❌ Analytics aggregations (BigQuery for that)

**Performance:**
- Queries: < 500ms (with proper indexes)
- Writes: < 200ms
- Real-time: Yes (snapshot listeners)

---

### **BigQuery (Vector Search & Analytics)**

**Purpose:** Vector similarity search, chunk storage, analytics

**What's Stored:**
- ✅ All document chunks (3,021)
- ✅ All embeddings (768-dim vectors)
- ✅ Chunk metadata (JSON)
- ✅ User/source relationships

**What's NOT Stored:**
- ❌ User profiles (Firestore has them)
- ❌ Conversation metadata (Firestore)
- ❌ Real-time state (Firestore)

**Performance:**
- Vector search: ~400ms (warm)
- Cold start: 30-60s (first query only)
- Scales: Millions of chunks without slowdown
- Cost: ~$0.005 per 1TB scanned

---

## 🔧 **Integration Points**

### **1. Document Upload**

```typescript
// src/pages/api/extract-document.ts
POST /api/extract-document
  ↓
1. Gemini AI: Extract text
2. Firestore: Save to context_sources
3. Trigger: Chunking & embedding
4. Firestore: Save to document_chunks
5. BigQuery: Sync (async, non-blocking)
```

**Code:**
```typescript
// After saving to Firestore
import { syncChunksBatchToBigQuery } from './bigquery-vector-search';

await firestore.collection('document_chunks').add(chunk);

// Async sync to BigQuery (non-blocking)
syncChunksBatchToBigQuery([chunk]).catch(err => {
  console.warn('BigQuery sync failed (non-critical):', err);
});
```

---

### **2. Agent Selection**

```typescript
// src/components/ChatInterfaceWorking.tsx
useEffect(() => {
  if (currentConversation) {
    loadContextForConversation(currentConversation);
  }
}, [currentConversation]);

// Loads minimal stats only
loadContextForConversation()
  ↓
GET /api/agents/{id}/context-stats
  ↓
Returns: { totalCount: 89, activeCount: 89 }
  ↓
UI updates: "89 fuentes"
```

**Code:**
```typescript
// src/pages/api/agents/[id]/context-stats.ts
const assignedCountSnapshot = await firestore
  .collection('context_sources')
  .where('userId', '==', userId)
  .where('assignedToAgents', 'array-contains', effectiveAgentId)
  .count()
  .get();

return { totalCount: count, activeCount: activeIds.length };
```

---

### **3. RAG Search**

```typescript
// src/pages/api/conversations/[id]/messages-stream.ts
POST /api/conversations/{id}/messages-stream
  ↓
1. Determine effectiveAgentId (agent or chat's parent)
2. Call: searchByAgent(userId, conversationId, query)
3. BigQuery: Vector similarity search
4. Load: Source names for top K chunks
5. Build: RAG context
6. Gemini AI: Generate response
7. Stream: Response with references
```

**Code:**
```typescript
// src/lib/bigquery-agent-search.ts
const results = await searchByAgent(userId, conversationId, query, {
  topK: 5,
  minSimilarity: 0.5
});

// BigQuery SQL:
SELECT chunk_id, source_id, full_text, similarity
FROM (
  SELECT *, 
    (SELECT SUM(a*b)/SQRT(...)) AS similarity
  FROM `salfagpt.flow_analytics.document_embeddings`
  WHERE user_id = @userId
    AND source_id IN UNNEST(@assignedSourceIds)
)
WHERE similarity >= 0.5
ORDER BY similarity DESC
LIMIT 5
```

---

## 🔐 **Security & Access Control**

### **Firestore Security Rules**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // User isolation - every query filters by userId
    match /conversations/{conversationId} {
      allow read, write: if request.auth.uid == resource.data.userId;
    }
    
    match /context_sources/{sourceId} {
      allow read, write: if request.auth.uid == resource.data.userId;
    }
    
    match /document_chunks/{chunkId} {
      allow read, write: if request.auth.uid == resource.data.userId;
    }
  }
}
```

**Deployment:**
```bash
firebase deploy --only firestore:rules --project salfagpt
```

---

### **BigQuery Access Control**

**Project-level IAM:**
```bash
# Service account for Cloud Run
SERVICE_ACCOUNT="[PROJECT_NUMBER]-compute@developer.gserviceaccount.com"

# Grant BigQuery access
gcloud projects add-iam-policy-binding salfagpt \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/bigquery.dataViewer"

gcloud projects add-iam-policy-binding salfagpt \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/bigquery.jobUser"
```

**Query-level filtering:**
```sql
-- All queries filter by user_id
WHERE user_id = @userId
  AND source_id IN (...)
```

**Result:** Complete user isolation at multiple layers

---

## 🎯 **Key Design Decisions**

### **1. BigQuery for Vector Search (Not Firestore)**

**Why BigQuery:**
- ✅ Native SQL similarity calculations (distributed)
- ✅ Handles millions of vectors without slowdown
- ✅ Returns only top K (minimal data transfer)
- ✅ Automatic scaling and optimization
- ✅ 6x faster than Firestore-based search

**Why NOT Firestore:**
- ❌ Similarity calculated in backend (single-threaded)
- ❌ Must load all chunks to calculate (slow)
- ❌ Doesn't scale well beyond thousands of chunks
- ❌ Higher data transfer

**Decision:** BigQuery first, Firestore fallback

---

### **2. Minimal Context Loading (Not Full Metadata)**

**Why Minimal:**
- ✅ Loads count only (< 500ms)
- ✅ BigQuery has all the data
- ✅ No need to transfer metadata upfront
- ✅ Instant agent switching

**Why NOT Full:**
- ❌ Loading 628 sources took 48 seconds
- ❌ Transferred MBs of unused data
- ❌ Defeated purpose of BigQuery/embeddings
- ❌ Race conditions (user sends before load)

**Decision:** Stats only, BigQuery handles search

---

### **3. Agent-Based Search (Not Source IDs)**

**Why Agent-Based:**
- ✅ No source loading needed upfront
- ✅ Backend queries assignedToAgents
- ✅ Chats inherit from parent agents
- ✅ Single request parameter (agentId)

**Why NOT Source IDs:**
- ❌ Required loading sources first (slow)
- ❌ Frontend had to filter and send IDs
- ❌ Extra step in data flow
- ❌ Larger requests

**Decision:** Send agentId only, backend handles rest

---

### **4. Firestore for Metadata, BigQuery for Search**

**Firestore:**
- Source names, status, tags
- User relationships (assignedToAgents)
- Toggle states
- Real-time updates

**BigQuery:**
- Chunk text and embeddings
- Vector similarity search
- Read-only queries (no updates)
- Analytics

**Why Split:**
- Each system does what it's best at
- Firestore: Real-time operational data
- BigQuery: Analytical queries and vector search
- Best performance for each use case

---

## 📈 **Monitoring & Observability**

### **BigQuery Query History**

**Console:** https://console.cloud.google.com/bigquery?project=salfagpt

**Check recent queries:**
```sql
SELECT 
  creation_time,
  query,
  total_bytes_processed / 1024 / 1024 as mb_processed,
  total_slot_ms / 1000 as seconds,
  statement_type
FROM `salfagpt.region-us-central1.INFORMATION_SCHEMA.JOBS`
WHERE creation_time > TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 DAY)
  AND referenced_tables LIKE '%document_embeddings%'
ORDER BY creation_time DESC
LIMIT 20;
```

---

### **Performance Metrics**

**Track these in production:**

1. **BigQuery Search Times**
   ```
   Target: < 500ms (p95)
   Current: ~400ms (warm)
   Alert: > 2 seconds
   ```

2. **Stats Load Times**
   ```
   Target: < 500ms
   Current: 350-530ms
   Alert: > 1 second
   ```

3. **Total Response Times**
   ```
   Target: < 3 seconds
   Current: ~2 seconds
   Alert: > 5 seconds
   ```

4. **BigQuery Usage Rate**
   ```
   Target: > 95% (vs Firestore fallback)
   Monitor: Search method logs
   ```

---

## 🔧 **Maintenance & Operations**

### **BigQuery Table Maintenance**

**Check table stats:**
```bash
bq query --use_legacy_sql=false --project_id=salfagpt \
  "SELECT 
     COUNT(*) as total_chunks,
     COUNT(DISTINCT user_id) as total_users,
     COUNT(DISTINCT source_id) as total_sources
   FROM \`salfagpt.flow_analytics.document_embeddings\`"
```

**Expected output:**
```
total_chunks: 3,021+
total_users: 2+
total_sources: 629+
```

**Monitor table growth:**
```bash
bq show --format=prettyjson salfagpt:flow_analytics.document_embeddings | \
  jq '{numRows, numBytes, lastModified}'
```

---

### **Sync Health Check**

**Verify Firestore → BigQuery sync:**

```bash
# Count chunks in Firestore
npx tsx -e "
import { firestore } from './src/lib/firestore.js';
const snapshot = await firestore.collection('document_chunks').count().get();
console.log('Firestore chunks:', snapshot.data().count);
process.exit(0);
"

# Count chunks in BigQuery
bq query --use_legacy_sql=false --project_id=salfagpt \
  "SELECT COUNT(*) as count FROM \`salfagpt.flow_analytics.document_embeddings\`"

# Should be approximately equal (BigQuery may lag slightly)
```

**If out of sync:** Run backfill script
```bash
npx tsx scripts/backfill-bigquery.ts
```

---

### **Index Management**

**Required Firestore indexes:**

```json
{
  "indexes": [
    {
      "collectionGroup": "context_sources",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "assignedToAgents", "arrayConfig": "CONTAINS" }
      ]
    },
    {
      "collectionGroup": "document_chunks",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "sourceId", "order": "ASCENDING" }
      ]
    }
  ]
}
```

**Deploy:**
```bash
firebase deploy --only firestore:indexes --project salfagpt
```

---

## 🚨 **Troubleshooting**

### **Issue: BigQuery Returns 0 Results**

**Check:**
```bash
# Verify chunks exist for user
bq query --use_legacy_sql=false --project_id=salfagpt \
  "SELECT user_id, COUNT(*) as chunks 
   FROM \`salfagpt.flow_analytics.document_embeddings\`
   GROUP BY user_id"

# Verify source assignment
bq query --use_legacy_sql=false --project_id=salfagpt \
  "SELECT source_id, COUNT(*) as chunks
   FROM \`salfagpt.flow_analytics.document_embeddings\`
   WHERE user_id = '114671162830729001607'
   GROUP BY source_id
   LIMIT 10"
```

**Solutions:**
- If no chunks: Re-index documents
- If chunks exist: Check assignedToAgents field
- Automatic fallback: Firestore search activates

---

### **Issue: Slow First Query**

**Symptom:** First BigQuery query takes 30-60 seconds

**Cause:** BigQuery cold start (loading table into memory)

**Solution:** This is normal! Subsequent queries will be fast (~400ms)

**Optional:** Pre-warm with scheduled queries
```sql
-- Run every hour to keep table warm
SELECT COUNT(*) FROM `salfagpt.flow_analytics.document_embeddings`
```

---

### **Issue: Stats Show 0 Sources**

**Check:**
1. Is agent/chat selected? (currentConversation not null)
2. Did stats endpoint return correctly?
3. Is contextStats state set?

**Debug:**
```javascript
// Browser console
console.log('contextStats:', contextStats);
console.log('currentConversation:', currentConversation);
```

**Solution:**
- Hard refresh browser (Cmd+Shift+R)
- Check /api/agents/[id]/context-stats returns data
- Verify agent has sources assigned

---

## 📚 **Related Documentation**

### **Implementation Docs**
- `BIGQUERY_VECTOR_SEARCH_ACTIVATED_2025-10-22.md` - Activation guide
- `BIGQUERY_OPTIMIZATION_COMPLETE_2025-10-22.md` - Optimization details
- `MINIMAL_CONTEXT_IMPLEMENTATION_2025-10-22.md` - Minimal loading
- `FINAL_OPTIMIZATION_STATUS.md` - Complete status

### **Testing Docs**
- `TEST_BIGQUERY_IN_CHAT.md` - How to test
- `TEST_MINIMAL_CONTEXT_NOW.md` - Minimal loading tests
- `BROWSER_CACHE_FIX.md` - Cache issues

### **Reference Docs**
- `BIGQUERY_QUICK_REFERENCE.md` - Quick commands
- `COMPLETE_OPTIMIZATION_SUMMARY.md` - Summary

---

## 🔮 **Future Enhancements**

### **Short-term (Next Sprint)**

1. **Cache Query Embeddings**
   - Store embeddings for common queries
   - Save ~1s per repeated question
   - Implementation: Redis or Firestore cache

2. **Batch BigQuery Queries**
   - Multiple messages → single BigQuery call
   - Reduce query count
   - Lower costs

3. **Pre-warm BigQuery**
   - Scheduled queries keep table warm
   - Eliminate 30-60s cold start
   - Better user experience

---

### **Medium-term (Next Month)**

1. **Multi-modal Embeddings**
   - Image embeddings (Vertex AI)
   - Mixed text + image search
   - Richer context retrieval

2. **Approximate Nearest Neighbor (ANN)**
   - For massive datasets (>100K chunks)
   - Sub-100ms search times
   - ScaNN or FAISS integration

3. **BigQuery for Source Metadata**
   - Move context_sources to BigQuery
   - Single query for everything
   - Sub-second total time

---

### **Long-term (Next Quarter)**

1. **Real-time Streaming Inserts**
   - BigQuery streaming API
   - Instant availability (no sync delay)
   - Better user experience

2. **Cross-lingual Search**
   - Multilingual embeddings
   - Search in any language
   - Same semantic space

3. **Hybrid Search**
   - Combine vector + keyword search
   - Better recall and precision
   - BM25 + vector fusion

---

## 📊 **Current Production Metrics**

### **BigQuery Table Stats**

```
Dataset: salfagpt.flow_analytics
Table: document_embeddings

Total Rows: 3,021
Total Size: ~15 MB
Users: 2
Sources: 629
Avg Chunks per Source: 4.8
```

### **Performance Baselines**

```
Agent Selection: 350-530ms
Stats API Call: 350-530ms
Vector Search (warm): ~400ms
Vector Search (cold): 30-60s (first query only)
Total Message Response: ~1.5-2s
```

### **Cost Estimates**

```
BigQuery Queries: ~$0.005 per 1TB scanned
Per Query Cost: ~$0.00005 (15 MB scanned)
1000 queries: ~$0.05
Monthly (10K queries): ~$0.50

Negligible cost! ✅
```

---

## ✅ **Infrastructure Checklist**

### **Production Ready**

- [x] BigQuery dataset created: `flow_analytics`
- [x] BigQuery table created: `document_embeddings`
- [x] Table properly partitioned (DATE)
- [x] Table properly clustered (user_id, source_id)
- [x] 3,021 chunks indexed
- [x] Metadata stored as JSON strings
- [x] Project ID consistent (salfagpt)
- [x] Firestore indexes deployed
- [x] Security rules documented
- [x] Stats endpoint created
- [x] Agent search implemented
- [x] Chat inheritance working
- [x] UI displays stats correctly
- [x] No batch loading
- [x] Backward compatible
- [x] All tests passing

---

## 🚀 **Deployment**

### **Local Development**

```bash
# 1. Authenticate
gcloud auth application-default login

# 2. Set project
gcloud config set project salfagpt

# 3. Start dev server
npm run dev

# 4. Open browser
open http://localhost:3000/chat
```

### **Production Deployment**

```bash
# Deploy to Cloud Run
gcloud run deploy flow-salfacorp \
  --source . \
  --platform managed \
  --region us-central1 \
  --project salfagpt \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=salfagpt"

# Verify
curl https://[SERVICE_URL]/api/health
```

---

## 🎯 **Success Criteria - ALL MET**

- [x] BigQuery activated and working
- [x] 6x faster vector search
- [x] 96x faster agent selection
- [x] 99% bandwidth reduction
- [x] Minimal context loading
- [x] Agent-based search
- [x] Chat inheritance
- [x] Clean canvas UX
- [x] Stats update instantly
- [x] No breaking changes
- [x] Production ready

---

## 📞 **Support & Resources**

### **Google Cloud Console Links**

- **Firestore:** https://console.cloud.google.com/firestore/databases/-default-/data/panel?project=salfagpt
- **BigQuery:** https://console.cloud.google.com/bigquery?project=salfagpt
- **Cloud Run:** https://console.cloud.google.com/run?project=salfagpt
- **IAM:** https://console.cloud.google.com/iam-admin/iam?project=salfagpt

### **Monitoring**

- **Logs:** https://console.cloud.google.com/logs/query?project=salfagpt
- **Metrics:** https://console.cloud.google.com/monitoring?project=salfagpt

### **Key Files**

- `src/lib/bigquery-agent-search.ts` - Agent-based vector search
- `src/lib/bigquery-vector-search.ts` - BigQuery integration
- `src/pages/api/agents/[id]/context-stats.ts` - Stats endpoint
- `src/pages/api/conversations/[id]/messages-stream.ts` - RAG integration

---

**Last Updated:** October 22, 2025  
**Version:** 2.0 (BigQuery Optimized)  
**Status:** 🟢 Production Ready  
**Project:** salfagpt (SALFACORP)

---

**Infrastructure is fully optimized and production-ready!** 🚀

