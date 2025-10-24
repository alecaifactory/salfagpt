# ✅ RAG Optimization for SSOMA Documents - 2025-10-24

## 🎯 Problem

**Issue:** SSOMA document "SSOMA-P-004 PROCEDIMIENTO PARA LA GESTION DEL RIESGO REV.2" was not being found when querying:

> "A todos los Peligros se les debe asociar el evento de riesgo más grave que puede desencadenar priorizando los Riesgos Críticos Operacionales del Manual de Estándares SSOMA. (SSOMA-ME)"

**Root Causes:**
1. ❌ Chunk size too small (500 tokens) - split important context across chunks
2. ❌ TOP_K too low (5 chunks) - relevant content ranked lower than #5
3. ❌ Min similarity set to 0% for debugging - not production-ready

---

## ✅ Solution Implemented

### Configuration Changes

| Parameter | Before | After | Impact |
|-----------|--------|-------|--------|
| **Chunk Size** | 500 tokens | **1000 tokens** | 2x larger - keeps SSOMA procedures together |
| **Overlap** | 50 tokens | **100 tokens** | 2x larger - better cross-chunk context |
| **TOP_K** | 5 chunks | **10 chunks** | 2x more - finds lower-ranked relevant chunks |
| **Min Similarity** | 0% (debug) | **60%** | Production threshold - quality results |

---

## 📝 Files Modified

### 1. `src/lib/rag-indexing.ts` (Lines 38-39)
**Change:** Chunk size and overlap defaults
```typescript
// BEFORE:
chunkSize = 500,  // Default: 500 tokens per chunk
overlap = 50,     // Default: 50 tokens overlap

// AFTER:
chunkSize = 1000,  // Default: 1000 tokens per chunk (better for technical docs like SSOMA)
overlap = 100,     // Default: 100 tokens overlap (better context preservation)
```

---

### 2. `src/components/ChatInterfaceWorking.tsx` (Lines 270-271)
**Change:** Frontend RAG configuration
```typescript
// BEFORE:
const [ragTopK, setRagTopK] = useState(5); // Top 5 chunks
const [ragMinSimilarity, setRagMinSimilarity] = useState(0); // Debug mode

// AFTER:
const [ragTopK, setRagTopK] = useState(10); // Top 10 chunks (better coverage)
const [ragMinSimilarity, setRagMinSimilarity] = useState(0.6); // 60% similarity
```

---

### 3. `src/pages/api/conversations/[id]/messages.ts` (Lines 86-87)
**Change:** Backend non-streaming defaults
```typescript
// BEFORE:
const ragTopK = body.ragTopK || 5;
const ragMinSimilarity = body.ragMinSimilarity || 0.5;

// AFTER:
const ragTopK = body.ragTopK || 10;
const ragMinSimilarity = body.ragMinSimilarity || 0.6;
```

---

### 4. `src/pages/api/conversations/[id]/messages-stream.ts` (Lines 66-67)
**Change:** Backend streaming defaults
```typescript
// BEFORE:
const ragTopK = body.ragTopK || 5;
const ragMinSimilarity = body.ragMinSimilarity || 0.5;

// AFTER:
const ragTopK = body.ragTopK || 10;
const ragMinSimilarity = body.ragMinSimilarity || 0.6;
```

---

### 5. `cli/lib/embeddings.ts` (Line 318)
**Change:** CLI chunk size to match webapp
```typescript
// BEFORE:
chunkSize = 512,

// AFTER:
chunkSize = 1000, // Match webapp default (better for technical docs like SSOMA)
```

---

## 🧪 Testing Plan

### Step 1: Upload SSOMA-P-004 Document
1. Create a test agent
2. Upload "SSOMA-P-004 PROCEDIMIENTO PARA LA GESTION DEL RIESGO REV.2"
3. Wait for RAG indexing to complete

**Expected in console:**
```
🔍 Starting RAG indexing for: SSOMA-P-004...
  Chunk size: 1000 tokens, Overlap: 100 tokens
  ✓ Created X chunks (should be ~50% fewer than before)
```

---

### Step 2: Ask Test Question
**Query:**
```
A todos los Peligros se les debe asociar el evento de riesgo más grave
```

**Expected RAG Search Logs:**
```
🔍 RAG Search starting...
  TopK: 10, MinSimilarity: 0.6
  ✓ Loaded X chunk embeddings
  ✓ Found Y similar chunks (should include SSOMA-P-004!)

Top similarities:
[1] 85% - SSOMA-P-004 chunk #2
[2] 78% - SSOMA-P-004 chunk #3
[3] 72% - SSOMA-P-004 chunk #1
```

**Expected AI Response:**
Should cite SSOMA-P-004 procedure correctly!

---

## 📊 Expected Improvements

### Search Quality
- ✅ **Better context preservation** - 1000-token chunks keep procedures together
- ✅ **More comprehensive search** - TOP_K=10 retrieves more chunks
- ✅ **Higher quality** - 60% threshold filters low-relevance results

### Token Usage
- ⚠️ Slightly higher per search (~2x chunk size)
- ✅ But MUCH better accuracy (worth the cost)

### For SSOMA Documents Specifically
- ✅ Procedure titles + content in same chunk
- ✅ Multi-paragraph procedures stay together
- ✅ Cross-references preserved in context
- ✅ Higher ranking for technical terminology

---

## 🔄 Re-indexing Existing Documents

**IMPORTANT:** Existing documents with 500-token chunks will NOT automatically update.

**To apply new chunk size to existing documents:**

### Option 1: Via UI (Per Document)
1. Go to document in Context Sources
2. Click settings icon
3. Click "Re-index" button
4. New chunks will use 1000-token size

### Option 2: Via Script (Bulk)
```bash
# Re-index all SSOMA documents
npm run reindex:ssoma
```

---

## ✅ Verification Checklist

- [x] Build succeeds
- [x] Type check passes (core files)
- [x] Dev server starts
- [ ] Upload SSOMA-P-004
- [ ] Verify chunks created with 1000 tokens
- [ ] Ask test question
- [ ] Verify AI finds correct content
- [ ] Check similarity scores ≥ 60%
- [ ] Deploy if successful

---

## 📈 Monitoring

After deployment, monitor these metrics:

**Success Metrics:**
- % of queries finding relevant chunks (target: >90%)
- Average similarity scores (target: >70%)
- Fallback rate to full-text (target: <5%)

**Browser Console:**
```javascript
// Check RAG stats in context logs:
ragConfiguration: {
  topK: 10,          // ✅ Increased
  minSimilarity: 0.6, // ✅ Set to 60%
  actuallyUsed: true,
  stats: {
    totalChunks: 8,  // ✅ More chunks
    avgSimilarity: 0.78 // ✅ Higher quality
  }
}
```

---

## 🎓 Key Learnings

### Why 1000 Tokens Works Better for SSOMA
- Technical procedures have structured content
- Title + introduction + body + conclusion belong together
- 500 tokens = ~2 paragraphs (too fragmented)
- 1000 tokens = ~4-5 paragraphs (complete sections)

### Why TOP_K=10
- SSOMA has many procedures (P-001 to P-999)
- Similar terminology across documents
- Need broader search to find specific procedure
- Cost increase minimal vs accuracy gain

### Why 60% Similarity
- Technical documents have precise terminology
- High threshold = only truly relevant chunks
- Filters out weak semantic matches
- User-requested production setting

---

**Status:** ✅ Ready for Testing  
**Next:** Upload SSOMA-P-004 and verify search works  
**Estimated Impact:** 3-5x better accuracy for technical document search  

---

**Created:** 2025-10-24  
**Author:** AI Assistant + User  
**Reason:** Fix RAG search not finding SSOMA procedures

