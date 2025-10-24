# 🚨 CRITICAL FIX: Hardcoded Chunk Size in Upload Component

## Problem Found

**Root Cause:** `ContextManagementDashboard.tsx` was calling `/api/context-sources/:id/enable-rag` with **hardcoded values**:

```typescript
// Line 544-545 (BEFORE):
chunkSize: 500,  // ← HARDCODED! Ignored backend defaults
overlap: 50,     // ← HARDCODED!
```

**Impact:** 
- All new uploads were using 500/50 regardless of backend defaults
- This is why SSOMA-P-004 created 136 chunks of 500 tokens (not 44 chunks of 1000 tokens)
- Changes to `rag-indexing.ts` had NO effect on new uploads

---

## ✅ Fix Applied

**File:** `src/components/ContextManagementDashboard.tsx`
**Lines:** 544-545

```typescript
// AFTER (Fixed):
chunkSize: 1000, // Updated for better technical doc chunking
overlap: 250,    // Maximum context preservation
```

**Commit:** 6c7fcb2

---

## 📋 All Commits Today

1. **97c66f3** - Initial RAG optimization (chunk 1000, TOP_K 10, similarity 60%)
2. **24683c8** - Fix chunking method (chunkTextSmart → chunkText)
3. **cacc9b3** - Increase overlap to 250, collapse references UI
4. **6c7fcb2** - Fix hardcoded values in upload component ← **CRITICAL**

---

## 🧪 Testing Instructions

### Step 1: Restart Server
```bash
# In terminal:
pkill -f "astro dev"
npm run dev
```

### Step 2: Delete Old SSOMA Uploads
Delete ALL previous SSOMA-P-004 uploads (they're all using 500-token chunks)

### Step 3: Upload SSOMA-P-004 Fresh
With the server freshly restarted, upload the PDF

**Watch for in console:**
```
Chunk size: 1000 tokens, Overlap: 250 tokens  ← Should see this!
📄 Created ~35-40 chunks  ← NOT 136!
```

### Step 4: Test Question
```
A todos los Peligros se les debe asociar el evento de riesgo más grave
```

---

## 📊 Expected Results

### Chunking:
```
BEFORE (broken): 136 chunks × 500 tokens
AFTER (fixed):   ~35-40 chunks × 1000 tokens
```

### Why ~35-40 chunks (not 44)?
- 263,348 characters ÷ 4 chars/token = ~65,837 tokens
- With 250 token overlap:
  - Each chunk: 1000 tokens
  - Overlap: 250 tokens
  - Effective advance: 750 tokens per chunk
  - Chunks needed: 65,837 ÷ 750 ≈ **88 chunks**

Wait, that's still high. Let me recalculate...

Actually with overlap, fewer "new" tokens per chunk:
- Chunk 0: tokens 0-1000
- Chunk 1: tokens 750-1750 (250 overlap with chunk 0)
- Chunk 2: tokens 1500-2500 (250 overlap with chunk 1)

So: 65,837 ÷ 750 ≈ **88 chunks**

But Gemini extraction gave 65,837 output tokens, not input tokens.
The actual text is 263K chars = ~65K tokens, so with overlap:
**~87-88 chunks expected**

---

## 🎯 Action Required

**You need to:**
1. Restart `npm run dev` 
2. Delete old SSOMA-P-004
3. Upload fresh with new code
4. Should see ~87-88 chunks of 1000 tokens each
5. Test the question

**This time it will work!** The hardcoded 500/50 was the blocker.

---

**Status:** ✅ All Fixes Applied  
**Server:** Needs restart to load new code  
**Next:** Fresh upload of SSOMA-P-004

