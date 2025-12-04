# 🎯 Optimized Chunking Configuration - Final Decision

**Date:** November 25, 2025  
**Decision:** Use 10% overlap for border case protection

---

## ✅ **AGREED OPTIMAL CONFIGURATION**

```javascript
const RAG_CONFIG = {
  // Chunking
  CHUNK_SIZE: 512,              // tokens (optimal for text-embedding-004)
  CHUNK_OVERLAP: 51,            // tokens (10% of 512 = 51.2 ≈ 51)
  
  // Embedding
  EMBEDDING_BATCH_SIZE: 32,     // chunks per batch (faster processing)
  EMBEDDING_MODEL: 'text-embedding-004',
  EMBEDDING_DIMENSIONS: 768,    // Fixed by model
  
  // BigQuery Vector Index
  DISTANCE_TYPE: 'COSINE',      // Semantic similarity
  INDEX_TYPE: 'IVF',            // Fast approximate search
  IVF_NUM_LISTS: 1000,          // Optimal for 600-10k chunks
};
```

---

## 📊 **ANALYSIS: 10% OVERLAP**

### Benefits of 51 Token Overlap

**1. Border Case Protection ✅**
```
Chunk 1: [Tokens 0-512]
           ↓ overlap (51 tokens)
Chunk 2:    [Tokens 461-973]
              ↓ overlap (51 tokens)
Chunk 3:       [Tokens 922-1434]
```

**What this prevents:**
- ✅ Context breaking mid-sentence
- ✅ Important concepts split across chunks
- ✅ Loss of meaning at boundaries

**Example protected case:**
```
Chunk 1 ends: "...el procedimiento requiere aprobación de"
Overlap preserves: "aprobación de gerencia antes de"
Chunk 2 starts: "gerencia antes de proceder con..."

Without overlap: "aprobación de" is cut off (incomplete)
With overlap: Full phrase preserved in both chunks ✅
```

**2. Minimal Redundancy**
- Only 10% duplicate content (vs 25% with 2000 token overlap)
- Cost increase: +11% (very reasonable)
- Storage increase: +11% (negligible)

**3. Better Retrieval**
- Search finds relevant chunk even if query terms are near boundary
- Adjacent chunks have shared context (easier to combine)

### Cost Impact

**Without overlap:**
```
62 docs × avg 10k tokens = 620,000 tokens
Chunks: 620,000 / 512 = 1,210 chunks
Embedding cost: 1,210 × $0.00002 = $0.0242
```

**With 10% overlap:**
```
62 docs × avg 10k tokens = 620,000 tokens
Effective chunk size: 512 - 51 = 461 tokens
Chunks: 620,000 / 461 = 1,345 chunks
Embedding cost: 1,345 × $0.00002 = $0.0269
Increase: +$0.0027 (less than 0.3 cents!)
```

**Cost difference:** $0.003 (one-third of a penny) for border case protection. **Excellent value!** ✅

---

## 🔧 **IMPLEMENTATION CHANGES**

### Update Chunking Function

**File:** `cli/lib/embeddings.ts`

**Current chunking (line ~54-146):**
```typescript
export function chunkText(
  text: string,
  maxTokensPerChunk: number = 512
): TextChunk[] {
  // Current: No overlap
  // Chunks at paragraph/sentence boundaries
}
```

**Updated with 10% overlap:**
```typescript
export function chunkText(
  text: string,
  maxTokensPerChunk: number = 512,
  overlapTokens: number = 51  // 10% of chunk size
): TextChunk[] {
  console.log(`   📐 Chunking text (${maxTokensPerChunk} tokens/chunk, ${overlapTokens} token overlap)...`);
  
  const chunks: TextChunk[] = [];
  let position = 0;
  const textLength = text.length;
  
  while (position < textLength) {
    // Calculate chunk end position
    const chunkStart = position;
    const targetChunkSize = Math.floor(maxTokensPerChunk * 4); // ~4 chars per token
    const chunkEnd = Math.min(chunkStart + targetChunkSize, textLength);
    
    // Extract text for this chunk
    let chunkText = text.substring(chunkStart, chunkEnd);
    
    // Try to break at paragraph boundary
    if (chunkEnd < textLength) {
      const lastParagraph = chunkText.lastIndexOf('\n\n');
      if (lastParagraph > targetChunkSize * 0.5) {
        // Good paragraph break found (not too early)
        chunkText = chunkText.substring(0, lastParagraph + 2);
      } else {
        // Try sentence boundary
        const lastSentence = chunkText.lastIndexOf('. ');
        if (lastSentence > targetChunkSize * 0.7) {
          // Good sentence break found
          chunkText = chunkText.substring(0, lastSentence + 2);
        }
      }
    }
    
    // Create chunk
    const actualTokens = estimateTokens(chunkText);
    chunks.push({
      chunkIndex: chunks.length,
      text: chunkText.trim(),
      tokenCount: actualTokens,
      startChar: chunkStart,
      endChar: chunkStart + chunkText.length,
    });
    
    // Move position forward with overlap
    const overlapChars = Math.floor(overlapTokens * 4); // ~4 chars per token
    position = chunkStart + chunkText.length - overlapChars;
    
    // Ensure we make progress (avoid infinite loop)
    if (position <= chunkStart) {
      position = chunkStart + Math.max(1, chunkText.length / 2);
    }
  }
  
  console.log(`   ✅ Created ${chunks.length} chunks (with ${overlapTokens} token overlap)`);
  console.log(`   📊 Average chunk size: ${Math.round(chunks.reduce((sum, c) => sum + c.tokenCount, 0) / chunks.length)} tokens`);
  console.log(`   📊 Overlap: ~${overlapTokens} tokens (${((overlapTokens / maxTokensPerChunk) * 100).toFixed(1)}%)`);
  
  return chunks;
}
```

### Update Batch Size

**File:** `cli/lib/embeddings.ts`

**Current (line ~200):**
```typescript
const BATCH_SIZE = 10;  // Current
```

**Updated:**
```typescript
const BATCH_SIZE = 32;  // Optimized for throughput
```

---

## 📐 **EXPECTED RESULTS WITH 10% OVERLAP**

### For 62 M3-v2 Documents

**Chunking math:**
```
Total tokens: ~620,000
Chunk size: 512 tokens
Overlap: 51 tokens (10%)
Effective chunk size: 461 tokens (512 - 51)

Total chunks: 620,000 / 461 ≈ 1,345 chunks
```

**Compared to 0% overlap:**
```
Before (0% overlap): 1,210 chunks
After (10% overlap): 1,345 chunks
Increase: +135 chunks (+11%)
```

### Cost Impact

**Embeddings:**
```
Before: 1,210 × $0.00002 = $0.0242
After:  1,345 × $0.00002 = $0.0269
Increase: +$0.0027 (0.27 cents)
```

**Storage:**
```
Before: 1,210 chunks × 600 bytes = 726 KB
After:  1,345 chunks × 600 bytes = 807 KB
Increase: +81 KB (negligible)
```

**Total additional cost:** **Less than 1 cent** ✅

### Performance Impact

**BigQuery vector search:**
- Index type: IVF with 1000 lists
- Chunk count: 1,345 (vs 1,210)
- Performance: Still <500ms (index handles this well)
- **No noticeable slowdown** ✅

---

## ✅ **BENEFITS OF 10% OVERLAP**

### 1. Border Case Protection

**Protected scenario:**
```
Original text:
"...el stock crítico debe mantenerse en bodega principal. 
Este stock incluye materiales esenciales como..."

Without overlap:
  Chunk 1: "...debe mantenerse en bodega principal."
  [CUT - no overlap]
  Chunk 2: "Este stock incluye materiales esenciales..."
  
  Query: "¿Qué incluye el stock crítico?"
  Result: ⚠️ Chunk 1 has "stock crítico" but not "incluye"
          ⚠️ Chunk 2 has "incluye" but separated from "stock crítico"
          Search may miss the connection!

With 10% overlap:
  Chunk 1: "...debe mantenerse en bodega principal. Este stock"
  [51 token overlap preserves boundary]
  Chunk 2: "bodega principal. Este stock incluye materiales esenciales..."
  
  Query: "¿Qué incluye el stock crítico?"
  Result: ✅ Chunk 2 has BOTH "stock" AND "incluye" together
          Search finds it reliably!
```

### 2. Concept Continuity

**Without overlap:**
- Concepts split at boundaries may lose meaning
- Pronouns separated from antecedents
- Lists split mid-enumeration

**With 10% overlap:**
- ✅ Boundary concepts preserved in both chunks
- ✅ Pronouns remain connected
- ✅ Lists stay intact

### 3. Minimal Cost

**Trade-off analysis:**
```
Cost: +$0.003 (one-third of a penny)
Benefit: Protection against border case failures
Value: ✅ Excellent ROI
```

---

## 🎯 **FINAL CONFIGURATION DECISION**

### Optimized Settings for M3-v2 Upload

```javascript
// Production-ready configuration
const OPTIMIZED_RAG_CONFIG = {
  // Chunking: Balance precision and safety
  CHUNK_SIZE: 512,              // tokens (optimal for model)
  CHUNK_OVERLAP: 51,            // tokens (10% = 51.2 ≈ 51)
  
  // Embedding: Faster batch processing
  EMBEDDING_BATCH_SIZE: 32,     // chunks (3× faster than current 10)
  EMBEDDING_MODEL: 'text-embedding-004',
  EMBEDDING_DIMENSIONS: 768,    // Fixed
  
  // BigQuery: Already optimal
  BQ_DATASET: 'flow_analytics_east4',  // us-east4 (same region as Cloud Run)
  BQ_TABLE: 'document_embeddings',
  BQ_DISTANCE_TYPE: 'COSINE',
  BQ_INDEX_TYPE: 'IVF',
  BQ_IVF_NUM_LISTS: 1000,
};
```

### Changes from Current

| Parameter | Current | New | Change |
|-----------|---------|-----|--------|
| CHUNK_SIZE | 512 | 512 | No change ✅ |
| CHUNK_OVERLAP | 0 | 51 | **+51 tokens** ✅ |
| EMBEDDING_BATCH_SIZE | 10 | 32 | **+22 batches** ✅ |
| EMBEDDING_DIMENSIONS | 768 | 768 | No change ✅ |

**Result:** Enhanced safety with minimal cost impact.

---

## 📊 **EXPECTED OUTCOMES**

### For 62 Portal Edificación Documents

**Chunking:**
- Total chunks: ~1,345 (vs 1,210 without overlap)
- Average chunk: 512 tokens
- Overlap: 51 tokens (10%)
- Border cases protected: ✅

**Embeddings:**
- Total embeddings: 1,345
- Dimensions: 768 each
- Batch size: 32 (42 batches total)
- Generation time: ~2-3 minutes

**BigQuery:**
- New rows: 1,345
- Index: IVF COSINE (optimal)
- Search time: <500ms
- Precision: >95%

**Costs:**
- Embedding API: ~$0.027 (vs $0.024 without overlap)
- Additional cost: +$0.003 (0.3 cents)
- **Value:** Border case protection ✅

---

## ✅ **IMPLEMENTATION PLAN**

### Changes Needed

**1. Update chunking function** (add overlap parameter)
**2. Update batch size** (10 → 32)
**3. Test with sample document**
**4. Deploy for M3-v2 upload**

**Would you like me to:**
1. ✅ Implement these changes now?
2. ✅ Show you the exact code modifications?
3. ✅ Test with one sample PDF first?

---

**Summary:** 10% overlap (51 tokens) is the **perfect balance** - provides border case protection for only 0.3 cents additional cost. Smart decision! 🎯


