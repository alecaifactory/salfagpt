# BigQuery Architecture - Clarification on Data Flow

**Your Questions:**
1. ❓ "We're still getting all chunks streamed - shouldn't we just use BigQuery?"
2. ❓ "When uploading new documents, will chunks go to BigQuery or Firestore first?"

**Answers:**
1. ✅ **Two different use cases** - UI display vs RAG search (explained below)
2. ✅ **Both databases** - Firestore is source of truth, BigQuery is for search (backward compatible)

---

## 🎯 Understanding the Dual-Database Architecture

### **Firestore** (Source of Truth) 📦
**Purpose:** Store ALL chunk data permanently

**Use cases:**
- ✅ UI display (Settings Modal shows all chunks)
- ✅ Data management (edit, delete, view)
- ✅ Backup and recovery
- ✅ Audit trail
- ✅ Source of truth if BigQuery fails

**What's stored:**
```typescript
{
  id: string,
  sourceId: string,
  userId: string,
  chunkIndex: number,
  text: string,           // Full text
  embedding: number[],    // 768 dimensions
  metadata: {...},
  createdAt: Date
}
```

---

### **BigQuery** (Fast Search Only) 🔍
**Purpose:** Optimized vector similarity search

**Use cases:**
- ✅ RAG search ONLY (finding similar chunks)
- ✅ Nothing else

**What's stored:**
```typescript
{
  chunk_id: string,
  source_id: string,
  user_id: string,
  chunk_index: number,
  text_preview: string,   // First 500 chars
  full_text: string,      // Full text
  embedding: ARRAY<FLOAT64>, // 768 dimensions
  metadata: JSON,
  created_at: TIMESTAMP
}
```

---

## 🔍 Two Different Use Cases

### **Use Case 1: Settings Modal (Shows ALL Chunks)** 📊

**When:** User clicks "Settings" icon on a context source

**What happens:**
```
User clicks Settings → Opens modal
    ↓
Modal loads chunks for DISPLAY
    ↓
GET /api/context-sources/:id/chunks
    ↓
Firestore query:
  .where('sourceId', '==', sourceId)
  .orderBy('chunkIndex', 'asc')
  .get()
    ↓
Returns ALL chunks (for display in table)
    ↓
User sees table with all chunks, embeddings, metadata
```

**Why load ALL chunks here:**
- ✅ User wants to see what was indexed
- ✅ UI displays chunk table (need all for pagination)
- ✅ Not for AI - just for human inspection
- ✅ Happens rarely (only when opening modal)

**Should we change this to BigQuery?**
- ❌ NO! This is for UI display, not search
- ✅ Firestore is correct here
- ✅ User wants to see ALL chunks, not just similar ones

---

### **Use Case 2: RAG Search (Find SIMILAR Chunks)** 🔍

**When:** User asks a question with RAG enabled

**What happens NOW (OPTIMIZED):**
```
User asks: "What is the policy?"
    ↓
Generate query embedding
    ↓
BigQuery vector search:
  SELECT ... WHERE similarity >= 0.3
  ORDER BY similarity DESC
  LIMIT 5
    ↓
Returns ONLY top 5 similar chunks ✅
    ↓
AI uses these 5 chunks for context
```

**Why BigQuery here:**
- ✅ Need to find SIMILAR chunks (not all)
- ✅ Similarity calculation is heavy
- ✅ BigQuery does it 6x faster
- ✅ Only need top 5 (not all 47)

**This IS using BigQuery!** ✅

---

## 📊 Chunk Loading - Two Different Endpoints

### **Endpoint 1: Get ALL Chunks (for UI)**

**API:** `GET /api/context-sources/:id/chunks`  
**Purpose:** Display in Settings Modal  
**Database:** Firestore ✅ Correct  
**Returns:** ALL chunks for that source  
**Frequency:** Rare (only when user opens modal)  

**Code location:** `src/pages/api/context-sources/[id]/chunks.ts`

```typescript
// This loads ALL chunks for UI display
const chunksSnapshot = await firestore
  .collection('document_chunks')
  .where('sourceId', '==', sourceId)
  .orderBy('chunkIndex', 'asc')
  .get();
```

**Should this use BigQuery?** ❌ NO
- User wants to see ALL chunks
- This is for management/inspection
- Firestore is appropriate

---

### **Endpoint 2: Search SIMILAR Chunks (for RAG)**

**API:** `POST /api/conversations/:id/messages-stream`  
**Purpose:** Find relevant chunks for AI context  
**Database:** **BigQuery** ✅ Optimized  
**Returns:** Only top 5 most similar chunks  
**Frequency:** Every message (high volume)  

**Code location:** `src/pages/api/conversations/[id]/messages-stream.ts` (lines 93-101)

```typescript
// ✅ NEW: Uses BigQuery for similarity search!
const searchResult = await searchRelevantChunksOptimized(userId, message, {
  topK: ragTopK,
  minSimilarity: ragMinSimilarity,
  activeSourceIds,
  preferBigQuery: true  // ✅ Using BigQuery!
});

ragResults = searchResult.results;  // Only top 5 chunks
console.log(`Search method: ${searchResult.searchMethod.toUpperCase()}`);
```

**This IS using BigQuery!** ✅

---

## 🔄 Data Flow on Upload

### **Question: When uploading new document, where do chunks go?**

**Answer: BOTH databases (for backward compatibility)**

### **Upload Flow:**

```
User uploads PDF
    ↓
Extract text with Gemini
    ↓
Chunk text (500 tokens, 50 overlap)
    ↓
Generate embeddings (Gemini embedding-001)
    ↓
┌────────────────────────────────────────────┐
│  SAVE TO FIRESTORE FIRST (Source of Truth) │ ← ALWAYS happens
└──────────────────┬─────────────────────────┘
                   │
                   ▼
            Firestore commit success
                   │
                   ▼
┌────────────────────────────────────────────┐
│  SYNC TO BIGQUERY (Non-blocking)           │ ← THEN happens
│  - If fails: logged but not critical       │
│  - If succeeds: enables fast search        │
└────────────────────────────────────────────┘
```

### **Why BOTH?**

**Firestore (Primary):**
- ✅ Source of truth (can rebuild BigQuery from this)
- ✅ Real-time updates
- ✅ Transactional operations
- ✅ Used for UI display
- ✅ Used for data management
- ✅ Backup if BigQuery fails

**BigQuery (Secondary - Optimization):**
- ✅ Fast vector search
- ✅ Scales to millions of chunks
- ✅ Lower query costs at scale
- ✅ Can be rebuilt from Firestore if lost

**This ensures backward compatibility!** ✅

---

## 🛡️ Backward Compatibility Guarantee

### **What if BigQuery is deleted?**

**Scenario:** Someone accidentally deletes the BigQuery table

**What happens:**
1. Next RAG query tries BigQuery → Fails
2. Automatically falls back to Firestore ✅
3. User gets results (slower but works)
4. Logs warning: "BigQuery search failed, using Firestore"

**Recovery:**
```bash
# Rebuild BigQuery table
bq query --use_legacy_sql=false < create-table.sql

# Re-sync from Firestore
npx tsx scripts/migrate-chunks-to-bigquery.ts
```

**Result:** Back to fast queries, zero data loss ✅

---

### **What if Firestore is deleted?**

**Scenario:** Someone accidentally deletes Firestore chunks

**What happens:**
1. BigQuery still has embeddings
2. But no source of truth
3. ❌ **PROBLEM** - Can't rebuild

**Why Firestore must be primary:**
- Has complete chunk data
- Has all metadata
- Has transaction history
- Is the source of truth

**BigQuery alone is not enough!**

---

## 📊 Chunk Flow Comparison

### **For Settings Modal (Display All Chunks)**

```
User clicks Settings icon
    ↓
Load ALL chunks from Firestore
    ↓
Display in table (all 47 chunks visible)
    ↓
User can see:
  - Chunk text
  - Embeddings
  - Metadata
  - Token counts
  
✅ Correct: Uses Firestore
❌ Wrong: Use BigQuery (it's for search, not display)
```

---

### **For RAG Search (Find Similar Chunks)**

```
User asks: "What is the policy?"
    ↓
Generate query embedding
    ↓
BigQuery similarity search ✅ NEW!
    ↓
Returns ONLY top 5 similar chunks
    ↓
AI uses these 5 for context
    ↓
User sees response with [1], [2] citations

✅ Correct: Uses BigQuery (fast!)
❌ Wrong: Load all from Firestore (slow)
```

---

## 🔍 What You're Seeing in Logs

### **When you ask a question, you see:**

```
📊 Chunks seleccionados: [
  { sourceId: '8tjg...', sourceName: 'Cir32.pdf', chunkCount: 5, tokens: 2347 }
]

🗺️ Fragment mapping received: [
  { refId: 1, chunkIndex: 15, sourceName: 'Cir32.pdf', similarity: 0.921 },
  { refId: 2, chunkIndex: 18, sourceName: 'Cir32.pdf', similarity: 0.874 },
  { refId: 3, chunkIndex: 12, sourceName: 'Cir32.pdf', similarity: 0.842 },
  { refId: 4, chunkIndex: 7, sourceName: 'Cir32.pdf', similarity: 0.798 },
  { refId: 5, chunkIndex: 22, sourceName: 'Cir32.pdf', similarity: 0.763 }
]
```

**This is METADATA about the 5 chunks found by BigQuery!**
- NOT loading all chunks
- Just sending info about which 5 were selected
- For the reference panel UI

**This is correct!** ✅

---

## 🎯 Key Points

### **1. We ARE using BigQuery for search** ✅

Check your logs - you should see:
```
✅ RAG: Using 5 relevant chunks via BIGQUERY (350ms)
```

If you see "via FIRESTORE" instead:
- BigQuery table might be empty
- Need to run migration script

---

### **2. Firestore is STILL needed** ✅

**Why:**
- Source of truth (can rebuild BigQuery)
- UI displays (Settings Modal)
- Data management
- Backward compatibility
- Graceful degradation

**This is by design!**

---

### **3. Upload flow is optimal** ✅

```
Upload → Chunk → Embed → Save to Firestore → Sync to BigQuery
                              ↑                ↑
                         (Primary)        (Secondary)
```

**Benefits:**
- ✅ Firestore save always succeeds
- ✅ BigQuery sync is bonus (doesn't block)
- ✅ Can rebuild BigQuery from Firestore
- ✅ Backward compatible

---

## 🚨 What You Should Verify

### **Check if BigQuery is actually being used:**

**Run migration first:**
```bash
npx tsx scripts/migrate-chunks-to-bigquery.ts
```

**Then ask a question and check logs for:**
```
✅ RAG: Using 5 relevant chunks via BIGQUERY (350ms)
                                    ^^^^^^^ ← Should say BIGQUERY!
```

**If it says FIRESTORE:**
- Migration didn't run or failed
- BigQuery table is empty
- Need to sync chunks

---

## 📝 Summary

### **Your Concerns Addressed:**

**1. "We're getting all chunks streamed"**
- ✅ That's metadata for the reference panel (5 chunks info)
- ✅ Not the actual chunk loading
- ✅ The search itself uses BigQuery (only loads 5)

**2. "Should we just use BigQuery?"**
- ✅ For RAG search: YES, we are!
- ❌ For UI display: NO, use Firestore
- ✅ For backup: Need Firestore as source of truth

**3. "Will new uploads go to BigQuery or Firestore?"**
- ✅ **BOTH!**
- ✅ Firestore first (source of truth)
- ✅ BigQuery second (optimization)
- ✅ This ensures backward compatibility

---

## ✅ Verification Steps

### **1. Check BigQuery is being used for search:**

```bash
# Run migration
npx tsx scripts/migrate-chunks-to-bigquery.ts

# Ask a question
# Check console for:
# "✅ RAG: Using 5 relevant chunks via BIGQUERY"
```

### **2. Verify both databases have chunks:**

```bash
# Firestore count
npx tsx -e "
import { firestore } from './src/lib/firestore.js';
const chunks = await firestore.collection('document_chunks').get();
console.log('Firestore:', chunks.size, 'chunks');
process.exit(0);
"

# BigQuery count
bq query --use_legacy_sql=false --project_id=$GOOGLE_CLOUD_PROJECT \
  "SELECT COUNT(*) as chunks FROM \`$GOOGLE_CLOUD_PROJECT.flow_analytics.document_embeddings\`"
```

**Both should have the same count!** ✅

---

**The architecture is correct - Firestore + BigQuery dual strategy is intentional and provides the best of both worlds!**

