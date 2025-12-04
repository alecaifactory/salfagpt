# 🚨 Firestore Size Limit Issue - Fix Required

**Date:** November 25, 2025  
**Issue:** Firestore document field limit exceeded  
**Impact:** Large PDFs failing during upload

---

## ⚠️ **PROBLEM IDENTIFIED**

### Error Message
```
❌ CONTRATACION DE SUBCONTRATISTAS.PDF failed: 
3 INVALID_ARGUMENT: The value of property "extractedData" is longer than 1048487 bytes.
```

### Root Cause

**Firestore limitation:**
- **Max size per field:** 1,048,487 bytes (~1 MB)
- **Violated by:** Large PDF extractions (CONTRATACION DE SUBCONTRATISTAS.PDF extracted 1.9 MB of text)

**Current code saves full text to Firestore:**
```typescript
await firestore.collection('context_sources').add({
  extractedData: extraction.extractedText,  // ❌ Can exceed 1 MB
  // ... other fields
});
```

---

## ✅ **SOLUTION: Don't Store Full Text in Firestore**

### Strategy

**Firestore should only store:**
- Metadata (filename, size, status, tags, etc.)
- Text preview (first 10,000 characters)
- NOT full extracted text

**Full text should be stored in:**
- GCS: Original PDF
- BigQuery: Chunked text in document_embeddings table
- Chunks: Full text distributed across document_chunks collection

### Why This Works

**For RAG, we don't need full text in Firestore because:**
- ✅ Search happens in BigQuery (has all chunks)
- ✅ Chunks in document_chunks collection (has all text distributed)
- ✅ GCS has original PDF (if needed for re-extraction)
- ✅ UI only needs metadata and preview

**Benefits:**
- ✅ No size limit issues
- ✅ Faster Firestore queries (smaller documents)
- ✅ Lower Firestore storage costs
- ✅ Better performance

---

## 🔧 **CODE FIX NEEDED**

### Update: cli/commands/upload.ts

**Current (line ~352-380):**
```typescript
const sourceDoc = await firestore.collection('context_sources').add({
  userId: config.userId,
  name: fileName,
  type: 'pdf',
  enabled: true,
  status: 'active',
  addedAt: new Date(),
  extractedData: extraction.extractedText,  // ❌ PROBLEM: Can exceed 1 MB
  originalFileUrl: uploadResult.gcsPath,
  // ... rest
});
```

**Fixed:**
```typescript
// Store only preview in Firestore (first 50k chars ≈ 50 KB)
const textPreview = extraction.extractedText.substring(0, 50000);

const sourceDoc = await firestore.collection('context_sources').add({
  userId: config.userId,
  name: fileName,
  type: 'pdf',
  enabled: true,
  status: 'active',
  addedAt: new Date(),
  extractedData: textPreview,  // ✅ FIXED: Only preview (max 50 KB)
  originalFileUrl: uploadResult.gcsPath,
  fullTextInChunks: true,  // ✅ NEW: Flag that full text is in chunks
  metadata: {
    originalFileName: fileName,
    originalFileSize: uploadResult.fileSize,
    extractionDate: new Date(),
    extractionTime: extractDuration,
    model: extraction.model,
    charactersExtracted: extraction.charactersExtracted,  // ✅ Total count
    tokensEstimate: extraction.tokensEstimate,
    textPreviewLength: textPreview.length,  // ✅ Preview length
    fullTextLength: extraction.extractedText.length,  // ✅ Full length
    // ... rest
  },
  // ... rest
});
```

### Why 50,000 Characters?

- **Firestore limit:** 1,048,487 bytes (~1 MB)
- **50k chars:** ~50 KB (well under limit)
- **Covers:** ~30-50 paragraphs (good preview)
- **UI display:** More than enough for preview
- **Safety margin:** 20× under limit

---

## 📊 **IMPACT ON CURRENT UPLOAD**

### Files Affected

Based on extraction size, likely failures:
- CONTRATACION DE SUBCONTRATISTAS.PDF (1.9 MB extracted) ❌ FAILED
- Any other PDF that extracts > 1 MB of text

### Files That Will Succeed

PDFs with extracted text < 1 MB (most files):
- Small-medium documents: ✅ Will work
- Short procedures: ✅ Will work  
- Documents with lots of images: ✅ Will work (less text)

### What Happens to Failed Files

**Currently:**
- ❌ File skipped (not saved to Firestore)
- ⚠️ Not available in agent
- ⚠️ Will need re-upload after fix

**After fix:**
- ✅ File saves successfully (preview only)
- ✅ Chunks save successfully (full text distributed)
- ✅ BigQuery indexes successfully
- ✅ Available in agent

---

## 🚀 **IMMEDIATE ACTION PLAN**

### Option 1: Fix Code and Retry Failed Files

1. **Stop current upload** (let it finish current file)
2. **Apply fix** to cli/commands/upload.ts
3. **Re-upload only failed files** (CONTRATACION DE SUBCONTRATISTAS.PDF)

### Option 2: Let Upload Continue, Fix Later

1. **Let upload continue** (most files will succeed)
2. **Note failed files** from logs
3. **Apply fix** after batch completes
4. **Re-upload failed files** individually

### Option 3: Cancel and Restart with Fix

1. **Cancel upload** (Ctrl+C)
2. **Apply fix immediately**
3. **Restart from beginning**
4. **All 62 files will succeed**

---

## 🎯 **RECOMMENDATION**

### Let Upload Continue (Option 2)

**Why:**
- ✅ Most files are smaller (will succeed)
- ✅ Don't lose progress on files already uploaded
- ✅ Only ~2-5 large files will fail
- ✅ Can re-upload failed ones quickly after fix

**Then:**
1. Let current batch finish
2. Apply fix
3. Re-upload only the failed files
4. Total time saved vs restarting

---

**Would you like me to:**
1. ✅ Apply the fix now (for failed file re-uploads)?
2. ✅ Let current upload continue and track failures?
3. ✅ Create a script to re-upload only failed files after fix?


