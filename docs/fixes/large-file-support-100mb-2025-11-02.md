# Large File Support (100MB) Implementation

**Date:** 2025-11-02  
**Status:** ✅ Implemented  
**Issue:** Files >10MB were failing with 400/500 errors

---

## 🎯 Problem

Upload failures for large PDF files:
- `MANUAL DE SERVICIO INTERNATIONAL HV607.pdf` - **229 MB** ❌ (rejected, too large)
- `Manual de Servicio Camiones Iveco 170E22.pdf` - **50.6 MB** ❌ (failed)
- `Manual de Operaciones HIAB X-HiPro 548-558-638-658.pdf` - **35.2 MB** ❌ (failed)

**Root cause:** Vision API had 10MB limit, backend had 50MB limit

---

## ✅ Solution: Smart File Size Routing

### Tier 1: Small Files (<50MB) - Vision API
- **Method:** Google Cloud Vision API
- **Speed:** Fast
- **Quality:** Excellent OCR
- **Best for:** Scanned PDFs, complex layouts

### Tier 2: Large Files (50-100MB) - Gemini API  
- **Method:** Gemini 2.5 Flash/Pro
- **Speed:** Slower
- **Quality:** Very good for large documents
- **Best for:** Multi-hundred page manuals

### Tier 3: Huge Files (>100MB) - Rejected
- **Error:** Clear message with suggestion to compress
- **Reason:** Memory/performance limits
- **Solution:** User must compress or split PDF

---

## 📝 Changes Made

### 1. Vision API Limits (`src/lib/vision-extraction.ts`)

**Before:**
```typescript
const maxVisionSizeBytes = 10 * 1024 * 1024; // 10MB
```

**After:**
```typescript
const maxVisionSizeBytes = 50 * 1024 * 1024; // 50MB for Vision
const maxGeminiSizeBytes = 100 * 1024 * 1024; // 100MB hard limit

if (file > 100MB) → Error (compress/split)
if (file > 50MB) → Throw error (fallback to Gemini)
if (file <= 50MB) → Process with Vision API
```

---

### 2. Backend API (`src/pages/api/extract-document.ts`)

**File size validation updated:**
```typescript
const maxVisionSize = 50 * 1024 * 1024; // 50MB
const maxGeminiSize = 100 * 1024 * 1024; // 100MB

// Auto-route based on size
if (file.size > maxGeminiSize) {
  return 400 error with helpful message
}

if (file.size > maxVisionSize && extractionMethod === 'vision-api') {
  extractionMethod = 'gemini'; // Auto-switch
}
```

**MaxOutputTokens increased for large files:**
```typescript
// Pro model
if (fileSizeMB > 50) return 65536; // NEW: 50-100MB files
if (fileSizeMB > 20) return 65536; // 20-50MB files
if (fileSizeMB > 10) return 65536; // 10-20MB files

// Flash model  
if (fileSizeMB > 20) return 65536; // NEW: Large files
if (fileSizeMB > 10) return 32768;
```

**Recommendations:**
- Files >20MB with Flash → Warn to use Pro
- Files >5MB with Flash → Suggest Pro

---

### 3. Frontend Validation (`src/components/ContextManagementDashboard.tsx`)

**Pre-upload validation:**
```typescript
const handleFileSelect = (files) => {
  const hugeFiles = files.filter(f => f.size > 100MB);
  const largeFiles = files.filter(f => f.size > 50MB);
  
  if (hugeFiles.length > 0) {
    alert('Files exceed 100MB limit, please compress');
    // Auto-filter out huge files
  }
  
  if (largeFiles.length > 0) {
    console.warn('Large files will use Gemini extraction');
    console.warn('Tip: Use Pro model for better quality');
  }
}
```

**Better error messages:**
```typescript
if (!response.ok) {
  const errorData = await response.json();
  let errorMessage = errorData.error;
  
  if (errorMessage.includes('too large')) {
    errorMessage = `File too large: ${fileSizeMB} MB. ${errorMessage}`;
  }
  
  throw new Error(errorMessage); // Shows in UI
}
```

---

## 📊 File Size Handling Matrix

| File Size | Vision API | Gemini Flash | Gemini Pro | Result |
|-----------|------------|--------------|------------|--------|
| <50 MB | ✅ Default | ⚠️ Available | ✅ Available | Vision API (fast) |
| 50-100 MB | ❌ Skip | ✅ Available | ✅ Recommended | Gemini (slower, robust) |
| >100 MB | ❌ Reject | ❌ Reject | ❌ Reject | Error (compress) |

---

## 🧪 Testing Results

### Test Case 1: 229 MB File

**Before:**
- Upload fails immediately
- Generic error: "Upload failed"
- No explanation

**After:**
- Frontend catches file >100MB
- Alert: "⚠️ MANUAL DE SERVICIO...pdf (229.0 MB) exceeds 100MB limit"
- File filtered out automatically
- Other files proceed ✅

---

### Test Case 2: 50.6 MB File

**Before:**
- Vision API fails (>10MB limit)
- 500 Internal Server Error
- File upload aborted

**After:**
- Backend detects file >50MB
- Auto-switches from Vision to Gemini
- Console: "Auto-switching to Gemini extraction"
- File processes successfully ✅
- Takes longer but completes

---

### Test Case 3: 35 MB File

**Before:**
- Vision API struggles
- May timeout or fail

**After:**
- File <50MB, uses Vision API
- Vision API handles it fine
- Fast extraction ✅

---

## 🎯 User Experience Improvements

**Before uploading:**
- ✅ Frontend validates file sizes
- ✅ Warns about files >50MB (will be slower)
- ✅ Rejects files >100MB (prevents wasted time)
- ✅ Suggests compression

**During upload:**
- ✅ Backend auto-routes to best extraction method
- ✅ Large files automatically use Gemini
- ✅ MaxOutputTokens scales with file size

**On error:**
- ✅ Specific error messages with file size
- ✅ Helpful suggestions (compress, use Pro model)
- ✅ Clear in UI (not generic "Upload failed")

---

## 💡 Recommendations for Users

### For 50-100MB Files
**Best practice:**
1. Use **Gemini Pro** model (not Flash)
2. Expect 2-5x longer processing time
3. Check extraction quality after upload
4. Consider splitting if >80MB

### For >100MB Files
**Options:**
1. **Compress PDF** (Adobe Acrobat, online tools)
   - Often can reduce 50-70% without quality loss
2. **Split PDF** by chapters/sections
   - Upload as separate documents
   - Better for agent context anyway
3. **Remove images/scans** if only text needed
   - Reduces file size dramatically

---

## 🔧 Technical Details

### Vision API
- **Optimal:** <10MB
- **Reliable:** <50MB
- **Limit:** 50MB (throws error if exceeded)
- **Fallback:** Auto-switches to Gemini

### Gemini API
- **Handles:** 50-100MB
- **MaxOutputTokens:** Up to 65,536 tokens
- **Context window:** 1M (Flash), 2M (Pro)
- **Limit:** 100MB (hard limit)

### File Size Detection Points
1. **Frontend** (JavaScript): `file.size` from File object
2. **Backend** (API): `file.size` from FormData
3. **Vision lib** (Node.js): `pdfBuffer.length` after conversion

---

## 📈 Performance Impact

### Small Files (<10MB)
- **No change** - Still uses Vision API
- Same speed, same quality

### Medium Files (10-50MB)
- **Vision API** (was failing, now works)
- Slightly slower but reliable

### Large Files (50-100MB)
- **Gemini API** (was rejected, now works)
- 2-3x slower than Vision
- But processes successfully ✅

### Huge Files (>100MB)
- **Rejected with helpful message**
- User must compress/split
- Prevents backend crashes

---

## ✅ Success Criteria

**Upload system now:**
- ✅ Accepts files up to 100MB (was 10MB)
- ✅ Auto-routes to best extraction method
- ✅ Scales maxOutputTokens with file size
- ✅ Provides clear error messages
- ✅ Warns users about large files
- ✅ Filters out oversized files automatically

---

## 🔮 Future Enhancements

**Potential improvements:**
1. **Streaming extraction** for files >50MB
   - Process in chunks
   - Show partial results
   - Avoid timeouts

2. **Progressive upload** with resumption
   - Upload in chunks
   - Resume if interrupted
   - Better for large files

3. **Client-side compression**
   - Compress before upload
   - Faster upload
   - Less bandwidth

4. **Smart page splitting**
   - Auto-detect chapters
   - Split into logical sections
   - Better for context retrieval

---

## 📚 Related Files

**Modified:**
- `src/lib/vision-extraction.ts` - Vision API limits (10MB → 50MB)
- `src/pages/api/extract-document.ts` - Backend limits (50MB → 100MB), smart routing
- `src/components/ContextManagementDashboard.tsx` - Frontend validation, better errors

**Related:**
- `docs/features/parallel-uploads-skip-2025-11-02.md` - Parallel processing
- `src/lib/gemini.ts` - Gemini extraction implementation

---

**Implementation Time:** ~15 minutes  
**Testing:** Manual with real 50MB+ files  
**Status:** ✅ Ready for production

---

**Now users can upload files up to 100MB with automatic smart routing and clear error messages!** 🚀

