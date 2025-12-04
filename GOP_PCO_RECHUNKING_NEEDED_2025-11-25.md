# GOP PCO Document Needs Re-Chunking

**Date:** November 25, 2025  
**Agent:** GOP GPT (M3-v2)  
**Document:** GOP-D-PCO-2.PLAN DE CALIDAD Y OPERACION-(V.1).PDF  
**Issue:** ⚠️ **ONLY 1 CHUNK (should be ~37)**

---

## 🚨 **Actual Root Cause**

### **What the UI Shows:**

```
GOP-D-PCO-2.PLAN DE CALIDAD Y OPERACION-(V.1).PDF
• 1 chunks • ~74k tokens  ← ⚠️ PROBLEM!
```

### **What It SHOULD Show:**

```
GOP-D-PCO-2.PLAN DE CALIDAD Y OPERACION-(V.1).PDF
• 37 chunks • ~74k tokens  ← ✅ CORRECT
```

---

## 🔍 **Why This Breaks RAG Search**

### **Current State:**

```
Document: 74,000 tokens
Chunks: 1 (the entire document!)
Chunk size: 74,000 tokens
```

**Problems:**
1. **Embedding quality**: 74k token chunk → poor quality embedding
2. **Specificity lost**: Specific paragraph buried in massive text
3. **Similarity fails**: Query "plazo PCO" vs entire 74k document = low match (<30%)
4. **Below threshold**: Chunk filtered out by `minSimilarity: 0.5` (50%)

### **Expected State:**

```
Document: 74,000 tokens
Chunks: ~37 chunks
Chunk size: ~2,000 tokens each
Overlap: 500 tokens between chunks
```

**Benefits:**
1. **Embedding quality**: Each chunk captures specific topic
2. **Specificity preserved**: Paragraph 5 "30 días" in its own chunk
3. **Similarity high**: Query "plazo PCO" vs chunk about PCO timeline = 70-85% match
4. **Passes threshold**: Chunk returned and cited ✅

---

## 📊 **How Chunking Should Work**

### **Standard Chunking Parameters:**

| Parameter | Value | Purpose |
|-----------|-------|---------|
| `chunkSize` | 2,000 tokens | Optimal for technical docs |
| `overlap` | 500 tokens | Preserve context between chunks |
| **Expected chunks** | **37** | 74k / 2k ≈ 37 |
| **Actual chunks** | **1** | ❌ Chunking failed |

### **Chunking Algorithm:**

```typescript
// src/lib/chunking.ts
function chunkText(text: string, chunkSize: number, overlap: number) {
  const chunks = [];
  let position = 0;
  
  while (position < text.length) {
    const chunkEnd = Math.min(position + chunkSize * 4, text.length); // ~4 chars per token
    const chunkText = text.substring(position, chunkEnd);
    
    chunks.push({
      text: chunkText,
      tokenCount: estimateTokens(chunkText),
      startChar: position,
      endChar: chunkEnd
    });
    
    position += (chunkSize - overlap) * 4; // Move forward with overlap
  }
  
  return chunks;
}
```

**What likely happened:** Chunking was skipped or failed, saving the entire document as 1 chunk.

---

## ✅ **Solution: Re-Index the Document**

### **Option 1: Re-Extract via UI** (Recommended)

**Steps:**
1. In agent M3-v2, find the document in context sources
2. Click **⚙️ Settings icon** on the document
3. In the modal, click **"🔄 Re-extraer"** button
4. **Critical:** Ensure extraction uses **chunking enabled**
5. Wait for re-extraction (~2-3 minutes for 74k tokens)
6. Verify new chunk count: Should show **~37 chunks**

**Expected result after re-indexing:**
```
GOP-D-PCO-2.PLAN DE CALIDAD Y OPERACION-(V.1).PDF
• 37 chunks • ~74k tokens  ← ✅ FIXED!
```

---

### **Option 2: Delete and Re-Upload** (If Re-Extract Not Available)

**Steps:**
1. In agent M3-v2, find the document
2. Click **🗑️ Delete icon**
3. Confirm deletion
4. Click **"+ Agregar"** to upload again
5. Select the same PDF file
6. **Verify during upload**: Chunking is enabled (default)
7. Wait for extraction and indexing
8. Verify: Shows ~37 chunks

---

### **Option 3: CLI Re-Index** (Fastest, Bulk Operation)

If you have direct access to the file:

```bash
# Re-index with proper chunking
npm run cli:reindex -- \
  --source-id=<source-id-from-firestore> \
  --chunk-size=2000 \
  --overlap=500 \
  --force
```

**This will:**
1. Delete old 1-chunk index
2. Re-chunk into ~37 chunks
3. Generate new embeddings
4. Save to Firestore + BigQuery
5. Update source metadata

---

## 📋 **Verification After Re-Indexing**

### **Step 1: Check Chunk Count**

In the context modal, verify:
```
GOP-D-PCO-2.PLAN DE CALIDAD Y OPERACION-(V.1).PDF
• 37 chunks • ~74k tokens  ← Should show ~37 now
```

### **Step 2: Test the Original Question**

Ask again:
> "¿Cuál es el plazo máximo establecido para la elaboración del Plan de Calidad y Operación (PCO) una vez iniciada la obra?"

### **Expected Response (After Fix):**

> "Según el Plan de Calidad y Operación, el PCO deberá elaborarse en un **plazo máximo de 30 días corridos** una vez iniciada la obra [1]. Además, debe permanecer actualizado en todo momento [1]."
>
> **REFERENCIAS:**
> ```json
> {
>   "references": [
>     {
>       "id": 1,
>       "sourceId": "...",
>       "sourceName": "GOP-D-PCO-2.PLAN DE CALIDAD Y OPERACION-(V.1).PDF",
>       "chunkIndex": 5,
>       "similarity": 0.847,
>       "snippet": "Este Plan de Calidad y Operación de Obra deberá elaborarse en un plazo máximo de 30 días corridos una vez iniciada la obra y deberá permanecer actualizado en todo momento."
>     }
>   ]
> }
> ```

### **Step 3: Verify in BigQuery**

Run this query to confirm chunks exist:

```sql
SELECT 
  source_id,
  COUNT(*) as chunk_count,
  AVG(LENGTH(full_text)) as avg_chunk_size
FROM `salfagpt.vector_search_green.document_chunks`
WHERE source_name LIKE '%GOP-D-PCO-2.PLAN DE CALIDAD%'
GROUP BY source_id;
```

**Expected result:**
```
chunk_count: 37
avg_chunk_size: ~8,000 chars (~2,000 tokens)
```

---

## 🎯 **Why This Matters**

### **With 1 Chunk (Current - Broken):**

```
User asks: "plazo máximo PCO"
  ↓
System searches: 1 massive 74k-token chunk
  ↓
Embedding: Entire document averaged into 768 numbers
  ↓
Similarity: Query vs entire doc = 15-25% (too low!)
  ↓
Result: Filtered out by 50% threshold ❌
  ↓
Agent responds: "Document doesn't specify" ❌
```

### **With 37 Chunks (Fixed):**

```
User asks: "plazo máximo PCO"
  ↓
System searches: 37 focused chunks
  ↓
Chunk #5: "Este Plan...30 días corridos...actualizado"
  ↓
Embedding: Specific paragraph about timeline
  ↓
Similarity: Query vs timeline paragraph = 75-85% ✅
  ↓
Result: Passes 50% threshold, returned
  ↓
Agent responds: "30 días corridos" with proper citation ✅
```

---

## 📈 **Impact on Other Documents**

Check if other documents in M3-v2 have the same issue:

**Look for documents showing:**
- ⚠️ **1 chunk with >50k tokens** (likely unchunked)
- ✅ **Multiple chunks with 1-5k tokens each** (properly chunked)

**From your screenshot, I can see:**
- GOP-R-PDI-1.1: **5 chunks** • ~4k tokens ✅ (Good ratio: 800 tokens/chunk)
- GOP-D-PI-1: **9 chunks** • ~40k tokens ✅ (Good ratio: ~4,500 tokens/chunk)
- GOP-P-PCO-2: **3 chunks** • ~2k tokens ✅ (Good ratio: ~667 tokens/chunk)
- **GOP-D-PCO-2: 1 chunk • ~74k tokens** ❌ (Bad ratio: 74,000 tokens/chunk!)

**Recommendation:** Re-index GOP-D-PCO-2 document to fix the chunking.

---

## 🔧 **Technical Details**

### **Why Chunking Failed:**

Possible causes:
1. **Extraction used old non-chunking method** (legacy full-text extraction)
2. **Chunking parameter override** (chunkSize set to 999999?)
3. **Error during chunking** (fell back to saving entire text as 1 chunk)
4. **Document format issue** (PDF had extraction issues, saved as single blob)

### **How to Prevent in Future:**

**During upload, the system should:**
1. Extract text from PDF
2. **Check text size**: If >10k tokens → MUST chunk
3. Call `chunkAndIndexDocument()` with standard parameters
4. Verify chunk count makes sense (size / 2000 ≈ expected chunks)
5. Alert if chunking seems wrong

---

## 📚 **References**

- **Chunking algorithm:** `src/lib/chunking.ts`
- **Indexing process:** `src/lib/rag-indexing.ts`
- **Standard chunk size:** 2,000 tokens (defined in `rag-indexing.ts` line 38)
- **Standard overlap:** 500 tokens (defined in `rag-indexing.ts` line 39)

---

**Conclusion:** The document is uploaded and assigned correctly, but was indexed as ONE giant chunk instead of 37 properly-sized chunks. **Re-indexing with proper chunking will fix the issue.** 🎯



