# Gemini File API Implementation

**Date:** 2025-11-17  
**Branch:** refactor/chat-v2-2025-11-15  
**Feature Flag:** `ENABLE_GEMINI_FILE_API`  
**Status:** ✅ Implemented (testing pending)

---

## 🎯 Objective

Implement **Gemini File API** as Option B for handling large/corrupt PDFs that fail with pdf-lib.

**Problem:** 5 Scania PDFs (13.3 MB each) fail with error:
```
Expected instance of PDFDict, but got instance of undefined
```

**Root Cause:** PDFs have corrupt internal structure that pdf-lib cannot parse.

**Solution:** Use Gemini File API which handles PDFs at the binary level (no parsing required).

---

## 🏗️ Architecture

### Extraction Pipeline (With File API)

```
User uploads PDF (>10MB)
    ↓
Check flag: ENABLE_GEMINI_FILE_API=true?
    ↓
YES → Try File API
    ├─ Upload to Gemini (converts Buffer → Blob)
    ├─ Wait for ACTIVE state (max 30s)
    ├─ Extract with generateContent()
    └─ Clean up (delete from Gemini)
    
    If File API FAILS:
    └─→ Fallback to chunked extraction (existing code)
    
NO → Use existing methods (Vision API → chunked)
```

---

## 📁 Files Modified

### New File

**`src/lib/gemini-file-upload.ts`** (New - 229 lines)

**Purpose:** Gemini File API integration for large/corrupt PDFs

**Key Functions:**
- `extractWithFileAPI(buffer, options)` - Main extraction
- `isFileAPIEnabled()` - Check feature flag
- `shouldUseFileAPI(fileSizeMB)` - Determine if File API applies

**Dependencies:**
- `@google/genai` v1.23.0
- Uses `genAI.files.uploadFile()` - Upload Blob
- Uses `genAI.files.get()` - Check file state
- Uses `genAI.files.delete()` - Cleanup

---

### Modified File

**`src/pages/api/extract-document.ts`**

**Line 274-347:** Added File API option with feature flag

**Changes:**
- ✅ Import `shouldUseFileAPI` and `extractWithFileAPI`
- ✅ Check flag + file size (>10MB)
- ✅ Try File API extraction
- ✅ Auto-fallback to chunked if File API fails
- ✅ Log all steps for debugging

**Backward Compatible:** YES
- Flag=false → uses existing code (Vision → chunked)
- Flag=true → tries File API first, fallbacks if fails

---

## 🔧 Configuration

### Environment Variable

```bash
# .env (added 2025-11-17)
ENABLE_GEMINI_FILE_API=true
```

**Default:** `false` (safe default, uses existing methods)

**When to enable:** 
- Large PDFs (>10MB)
- Corrupt PDFs that fail with pdf-lib
- High-quality extraction needed

---

## 🧪 Testing Plan

### Test Case 1: Manual de Operaciones Scania P410 B 6x4.pdf

**File:** 13.3 MB  
**Issue:** Fails with pdf-lib (corrupt structure)

**Steps:**
1. Set `ENABLE_GEMINI_FILE_API=true` in .env
2. Upload file via UI (Context Sources → Agregar)
3. Select model: Flash or Pro
4. Monitor console logs for File API steps
5. Verify extraction completes successfully
6. Check extracted text quality

**Expected Result:**
```
📤 [File API] Starting upload and extraction...
   File: Manual de Operaciones Scania P410 B 6x4.pdf
   Size: 13.30 MB
   Model: gemini-2.5-flash

📤 [File API] Step 1/2: Uploading file to Gemini...
✅ [File API] File uploaded: files/xyz123
   URI: https://generativelanguage.googleapis.com/...

⏳ [File API] Waiting for file processing...
✅ [File API] File ready for extraction (3s)

📖 [File API] Step 2/2: Extracting text with Gemini...
✅ [File API] Extraction complete!
   Characters: 245,892
   Time: 18.3s
   Tokens: 61,473 (in: 1,234, out: 60,239)
   Cost: $0.0185

🗑️ [File API] Uploaded file deleted from Gemini
```

---

### Test Case 2: Fallback Verification

**Purpose:** Verify auto-fallback when File API fails

**Steps:**
1. Set `ENABLE_GEMINI_FILE_API=true`
2. Upload small PDF (<10MB) → should skip File API
3. Upload large corrupt PDF → File API tries
4. Simulate File API error (disconnect network mid-upload)
5. Verify fallback to chunked extraction

**Expected Result:**
- Small PDFs bypass File API (use existing methods)
- File API errors trigger auto-fallback
- No data loss or crashes

---

### Test Case 3: Feature Flag OFF (Backward Compatibility)

**Purpose:** Verify existing functionality unchanged

**Steps:**
1. Set `ENABLE_GEMINI_FILE_API=false` (or remove from .env)
2. Upload any PDF
3. Verify Vision API → chunked flow works as before

**Expected Result:**
- No File API logs
- Existing extraction methods used
- Same quality/performance as before

---

## 📊 Performance Expectations

### File API vs Chunked Extraction

| Method | File Size | Time | Cost | Quality |
|--------|-----------|------|------|---------|
| **File API** | 13 MB | ~18s | $0.018 (Flash) | High |
| **Chunked** | 13 MB | ~45s | $0.024 (Flash) | Medium |

**File API Advantages:**
- ✅ Faster (single upload + single inference)
- ✅ Cheaper (no chunking overhead)
- ✅ Handles corrupt PDFs (no pdf-lib parsing)
- ✅ Better coherence (single context window)

**File API Limitations:**
- ⚠️ Requires network (upload step)
- ⚠️ Max 20MB per file (Gemini limit)
- ⚠️ 48h file expiration (must re-upload)

---

## 🔄 Rollback Plan

If File API causes issues:

### Step 1: Disable Feature Flag
```bash
# .env
ENABLE_GEMINI_FILE_API=false
```

### Step 2: Restart Server
```bash
pkill -f "astro dev"
npm run dev
```

**Result:** System reverts to existing Vision API → chunked flow

**No code changes needed** - just toggle flag

---

## 💰 Cost Analysis

### Gemini File API Pricing

**Flash (2.5):**
- Input: $0.075 per 1M tokens
- Output: $0.30 per 1M tokens

**Pro (2.5):**
- Input: $1.25 per 1M tokens
- Output: $5.00 per 1M tokens

### Example: 13MB PDF with Flash

**Estimated tokens:** 
- Input (file): ~1,234 tokens (minimal, just file reference)
- Output (extraction): ~60,000 tokens (15MB text)

**Cost:**
- Input: (1,234 / 1M) × $0.075 = $0.0001
- Output: (60,000 / 1M) × $0.30 = $0.0180
- **Total: $0.0181**

**Comparison with chunked:**
- Chunked Flash: ~$0.024 (3 chunks × $0.008)
- **File API saves: ~24%**

---

## 🚨 Known Limitations

### 1. File Size Limit
- **Max:** 20 MB per file (Gemini API limit)
- **Workaround:** For >20MB, use chunked extraction

### 2. File Expiration
- **Auto-delete:** 48 hours after upload
- **Impact:** Need to re-upload for re-extraction
- **Mitigation:** We delete immediately after extraction

### 3. Network Dependency
- **Upload step:** Requires stable internet
- **Timeout:** 30s max for file processing
- **Mitigation:** Auto-fallback to chunked if upload fails

---

## 🔍 Debugging

### Enable File API Logs

```typescript
// Already included in gemini-file-upload.ts
console.log('📤 [File API] ...')  // Upload step
console.log('⏳ [File API] ...')  // Processing wait
console.log('📖 [File API] ...')  // Extraction step
console.log('✅ [File API] ...')  // Success
console.log('❌ [File API] ...')  // Errors
```

### Common Issues

**Issue 1: "File API not enabled"**
- Check: `ENABLE_GEMINI_FILE_API=true` in .env
- Restart: Server needs restart after .env change

**Issue 2: "File processing timeout"**
- Increase: `maxAttempts` in gemini-file-upload.ts (default: 30s)
- Check: Gemini API status (could be service issue)

**Issue 3: "Upload failed"**
- Network: Check internet connection
- Size: Verify file <20MB
- Format: Ensure valid PDF

---

## ✅ Success Criteria

Feature is successful if:

1. **Corrupt PDFs Extract:** 5 Scania PDFs (13MB) extract successfully
2. **Quality:** Extracted text is complete and accurate
3. **Performance:** Faster than chunked extraction
4. **Cost:** Cheaper than chunked extraction
5. **Fallback Works:** Auto-fallback on File API errors
6. **Backward Compatible:** Flag=false uses existing methods
7. **No Crashes:** Robust error handling

---

## 📚 References

### Internal Documentation
- `src/lib/gemini.ts` - Gemini API patterns
- `src/lib/chunked-extraction.ts` - Existing chunked method
- `.cursor/rules/gemini-api-usage.mdc` - API usage rules

### External Documentation
- [@google/genai v1.23.0 - Files API](https://googleapis.github.io/js-genai/release_docs/classes/files.Files.html)
- [Gemini API File Upload Guide](https://ai.google.dev/gemini-api/docs/file-upload)
- [Gemini API Pricing](https://ai.google.dev/pricing)

---

## 🎯 Next Steps

1. **Test with Scania PDFs** (5 files)
2. **Measure performance** (time, tokens, cost)
3. **Compare with chunked** (before/after)
4. **Monitor in production** (48 hours)
5. **Document findings** (update this file)
6. **Consider defaults** (enable flag by default if successful)

---

**Remember:** This is an **additive feature** with feature flag. Zero risk to existing functionality. Can be disabled instantly if issues arise.




