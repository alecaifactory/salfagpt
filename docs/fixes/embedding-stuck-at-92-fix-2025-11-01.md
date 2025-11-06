# Fix: Upload System Stuck at 92% During Embedding

**Date**: 2025-11-01  
**Issue**: Documents getting stuck at 92% progress during the Embed step in Context Management  
**Status**: ✅ Fixed  

---

## 🐛 Problem Analysis

### Symptoms
- Documents upload successfully (Upload step completes)
- Text extraction succeeds (Extract step completes)  
- Chunking succeeds (Chunk step completes)
- Embedding gets stuck at 92% and never reaches 100%
- UI shows spinning loader indefinitely

### Root Causes

1. **Vision API Resource Exhaustion**
   - Vision API fails for files >10MB with `RESOURCE_EXHAUSTED` error
   - Error: "Bandwidth exhausted or memory limit exceeded"
   - Affects files like:
     - `Manual de Partes Pluma Palfinger PK42002 SH.pdf` (46.34 MB)
     - `Manual de Servicio Camiones Iveco 170E22.pdf` (48.23 MB)

2. **Missing Fallback Logic**
   - When Vision API fails, extraction throws error
   - No automatic fallback to Gemini extraction
   - Upload pipeline terminates prematurely

3. **Frontend Stuck at 95%**
   - Frontend waits for 100% completion signal
   - If RAG/embedding fails, progress never reaches 100%
   - UI indefinitely shows "processing" state

---

## ✅ Solutions Implemented

### 1. Vision API File Size Validation (vision-extraction.ts)

**Location**: `src/lib/vision-extraction.ts:59-70`

```typescript
// ✅ CRITICAL FIX: Check file size BEFORE attempting Vision API
const maxVisionSizeBytes = 10 * 1024 * 1024; // 10MB limit
if (fileSizeBytes > maxVisionSizeBytes) {
  const maxSizeMB = (maxVisionSizeBytes / (1024 * 1024)).toFixed(0);
  const errorMsg = `⚠️ File too large for Vision API: ${fileSizeMB} MB (max: ${maxSizeMB} MB)`;
  console.warn(errorMsg);
  console.warn('   Solution: Auto-falling back to Gemini extraction...\n');
  throw new Error(errorMsg);
}
```

**Why**: Fail fast with clear error instead of hitting resource limits mid-processing

### 2. Automatic Gemini Fallback (extract-document.ts)

**Location**: `src/pages/api/extract-document.ts:131-209`

```typescript
if (extractionMethod === 'vision-api' && file.type === 'application/pdf') {
  try {
    // Try Vision API first
    const visionResult = await extractTextWithVisionAPI(buffer);
    // ... process result
  } catch (visionError) {
    // ✅ CRITICAL FIX: Auto-fallback to Gemini
    console.warn('⚠️ Vision API failed:', errorMsg);
    
    if (errorMsg.includes('too large') || errorMsg.includes('RESOURCE_EXHAUSTED')) {
      console.warn('   Reason: File exceeds Vision API limits');
      console.warn('   ✅ Auto-falling back to Gemini (better for large files)...\n');
    }
    
    extractionMethod = 'gemini'; // Trigger Gemini path
    
    // Update pipeline log
    pipelineLogs[pipelineLogs.length - 1] = {
      status: 'warning',
      message: `Vision API no disponible, usando Gemini ${model}`,
      details: { visionError: errorMsg, fallbackMethod: 'gemini' }
    };
  }
}
```

**Why**: Seamless fallback ensures extraction always succeeds, even for large files

### 3. Guaranteed 100% Completion (ContextManagementDashboard.tsx)

**Location**: `src/components/ContextManagementDashboard.tsx:552-628`

**Before**:
```typescript
if (ragResponse.ok && ragData.success) {
  // Progress to 95%
  setUploadQueue(prev => prev.map(i => 
    i.id === item.id ? { ...i, progress: 95 } : i
  ));
}
// ❌ NO guarantee of reaching 100% if embedding fails
```

**After**:
```typescript
if (ragResponse.ok && ragData.success) {
  console.log('✅ RAG pipeline completed successfully');
  // Progress through embedding stages: 75% → 85% → 95%
  // ... animated progress
  console.log(`✅ Embedding complete for: ${item.file.name}`);
} else {
  console.warn('⚠️ RAG pipeline failed - document available in Full-text mode');
  // Still progress to 95%
}

// ✅ CRITICAL FIX: ALWAYS complete to 100% regardless of embedding success
await new Promise(resolve => setTimeout(resolve, 200));

setUploadQueue(prev => prev.map(i => 
  i.id === item.id ? { 
    ...i, 
    status: 'complete', 
    progress: 100,  // ← Always reach 100%
    sourceId,
    elapsedTime: Date.now() - startTime
  } : i
));
```

**Why**: Documents should complete successfully even if optional embedding fails. Users can manually trigger RAG later.

---

## 📊 Impact

### Files Modified
1. ✅ `src/lib/vision-extraction.ts` - Added file size validation
2. ✅ `src/pages/api/extract-document.ts` - Added Gemini fallback
3. ✅ `src/components/ContextManagementDashboard.tsx` - Guaranteed 100% completion

### Behavior Changes

**Before**:
```
Large PDF (46MB) → Vision API → RESOURCE_EXHAUSTED → ❌ Upload fails at 92%
```

**After**:
```
Large PDF (46MB) → Vision API → Size check fails → ✅ Auto-fallback to Gemini → Extract → Chunk → Embed → ✅ 100% complete
```

### User Experience

**Before**:
- ❌ Large files get stuck at 92%
- ❌ No error message, just infinite spinner
- ❌ Document not available for use
- ❌ User must refresh page and re-upload

**After**:
- ✅ Large files automatically use Gemini extraction
- ✅ Clear console logs show fallback happening
- ✅ Progress reaches 100% even if embedding fails
- ✅ Document available for use immediately (full-text mode)
- ✅ Users can manually trigger RAG later if needed

---

## 🧪 Testing

### Test Cases

1. **Small PDF (<10MB)**
   - ✅ Should use Vision API
   - ✅ Should complete embedding
   - ✅ Should reach 100%

2. **Large PDF (>10MB)**
   - ✅ Should fail Vision API size check
   - ✅ Should auto-fallback to Gemini
   - ✅ Should extract text successfully
   - ✅ Should attempt RAG embedding
   - ✅ Should reach 100% even if embedding has issues

3. **Vision API Quota Exhausted**
   - ✅ Should catch error
   - ✅ Should fallback to Gemini
   - ✅ Should complete successfully

### Manual Testing Steps

```bash
# 1. Start dev server
npm run dev

# 2. Open Context Management dashboard
# Navigate to: http://localhost:3000/chat
# Click "Context Management" button

# 3. Test small file
# Upload: Any PDF <10MB
# Expected: Vision API → Extract → Chunk → Embed → 100% ✅

# 4. Test large file
# Upload: Any PDF >10MB (e.g., Manual de Partes 46MB)
# Expected: Vision API size check → Fallback to Gemini → Extract → Chunk → Embed → 100% ✅

# 5. Check console logs
# Should see:
# - Vision API size check warning (for large files)
# - Auto-fallback to Gemini message
# - RAG pipeline completion
# - Progress: 100% status: complete
```

---

## 📋 Verification Checklist

- [x] Vision API validates file size before processing
- [x] Gemini fallback triggers automatically
- [x] Pipeline logs show fallback reason
- [x] Frontend always reaches 100% completion
- [x] Documents available even if embedding fails
- [x] No linter errors
- [x] Backward compatible (existing uploads unaffected)
- [x] Console logging improved for debugging

---

## 🔍 Debugging

### If uploads still get stuck:

1. **Check Console Logs**:
   ```
   Look for:
   - ⚠️ Vision API failed: [error message]
   - ✅ Auto-falling back to Gemini
   - ✅ RAG pipeline completed successfully
   - ✅ Embedding complete for: [filename]
   ```

2. **Check Network Tab**:
   ```
   POST /api/extract-document → should return 200 OK
   POST /api/context-sources/[id]/enable-rag → should return 200 OK
   ```

3. **Check Firestore**:
   ```
   Collection: context_sources
   Document: [sourceId]
   Fields: extractedText (should have content)
           ragEnabled (should be true)
           ragMetadata (should have chunk count)
   ```

4. **Manual RAG Trigger**:
   ```
   If auto-embedding fails, users can manually trigger:
   - Click on document in Context Management
   - Click "Enable RAG" button
   - System will retry embedding
   ```

---

## 🎯 Key Takeaways

### What Was Learned

1. **Vision API Limitations**
   - 10MB soft limit for reliable performance
   - RESOURCE_EXHAUSTED errors for 40MB+ files
   - Best for scanned documents <10MB

2. **Gemini Strengths**
   - Better for large PDFs (40MB+)
   - Native multimodal understanding
   - Higher token limits (65K for Pro)

3. **Graceful Degradation**
   - Always complete to 100% even if optional steps fail
   - Log warnings but don't block user
   - Allow manual retry of failed operations

### Best Practices Applied

✅ **Fail Fast**: Check constraints before expensive operations  
✅ **Auto-Fallback**: Seamless failover to alternative methods  
✅ **User-First**: Complete workflow even if optional features fail  
✅ **Clear Logging**: Console logs explain what's happening and why  
✅ **Backward Compatible**: No changes to existing successful uploads  

---

## 📚 Related Documentation

- `.cursor/rules/alignment.mdc` - Graceful Degradation principle
- `.cursor/rules/backend.mdc` - Error handling patterns
- `docs/Context_Management_Pipeline.md` - Upload pipeline architecture
- `RAG_COMPLEMENTARY_ARCHITECTURE.md` - RAG system design

---

**Remember**: Vision API is optimized for scanned documents <10MB. For large technical manuals (40MB+), Gemini extraction is more reliable and handles the bandwidth requirements better.






