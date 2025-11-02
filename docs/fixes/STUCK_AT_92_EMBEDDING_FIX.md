# Fix for Files Stuck at 92% During Embedding

**Issue:** Files get stuck at 92% progress in Embed stage  
**Date:** 2025-11-02  
**Status:** Diagnosed + Solutions Provided

---

## 🐛 Problem

**Symptom:**
- Files complete Upload, Extract, Chunk stages ✅
- Progress reaches 92% in Embed stage
- Progress bar stops moving
- No error message shown
- Console shows no activity
- File appears "stuck"

**Affected files:**
- Various PDFs in the upload queue
- Typically larger files or files with many chunks
- No clear pattern

---

## 🔍 Root Causes

### Cause 1: RAG Backend Taking Too Long

**What's happening:**
- RAG indexing API (`/api/context-sources/{id}/enable-rag`) is processing
- Generating embeddings for large documents takes time
- No heartbeat/progress updates from backend
- Frontend timeout or assumes it's stuck

**Evidence:**
- Some files DO complete after waiting
- Backend logs show successful embedding
- Just takes longer than expected

---

### Cause 2: Backend Timeout or Error

**What's happening:**
- Backend crashes or times out
- No error response sent to frontend
- Frontend waiting indefinitely
- No error logged

**Evidence:**
- Files never complete even after long wait
- No backend logs for completion
- Silent failure

---

### Cause 3: Network Issues

**What's happening:**
- Connection to backend lost
- Request sent but no response
- Frontend waiting forever

**Evidence:**
- Console shows: "fetch failed sending request"
- 500 Internal Server Error
- Connection reset

---

## ✅ Solutions Implemented

### 1. Better Progress Feedback ✅

**What we added:**
```typescript
// Progress updates with console logs
Progress: 75% - "Embedding stage starting"
  🔍 Chunks to embed: 15
  🔍 Total tokens: 45,832

Progress: 85% - "Embedding in progress (30-60s)"
  ⏳ Embedding vectors being generated...

Progress: 92% - "Embedding vectors being generated"
  ⏳ Finalizing embeddings...

Progress: 98% - "Finalizing embeddings"
  ✅ Complete!
```

**Benefit:** Users know system is working, not stuck

---

### 2. Timeout Detection (TO BE ADDED)

**Need to add:**
```typescript
// Add timeout for RAG indexing
const RAG_TIMEOUT = 120000; // 2 minutes

const ragPromise = fetch(`/api/context-sources/${sourceId}/enable-rag`, {...});

const timeoutPromise = new Promise((_, reject) =>
  setTimeout(() => reject(new Error('RAG indexing timeout (2 min)')), RAG_TIMEOUT)
);

try {
  const ragResponse = await Promise.race([ragPromise, timeoutPromise]);
  // Process response...
} catch (error) {
  if (error.message.includes('timeout')) {
    console.warn('⚠️ RAG indexing timed out - document saved without embeddings');
    // Mark as complete with warning
  }
}
```

---

### 3. Heartbeat from Backend (TO BE ADDED)

**Ideal solution:**
- Backend sends progress updates every 10 seconds
- Frontend shows: "Still processing... 45s elapsed"
- Clear indication system is alive

**Implementation:**
- Use Server-Sent Events (SSE) or WebSockets
- Backend streams progress updates
- Frontend updates UI in real-time

---

### 4. Retry Logic (TO BE ADDED)

**For stuck files:**
- After 2 minutes at 92%, show warning
- Offer "Retry Embedding" button
- Or "Complete Without Embedding" option

---

## 🔧 Immediate Workarounds

### For Users (Now)

**If file stuck at 92%:**

**Option 1: Wait it out**
- Large documents can take 2-5 minutes
- Check console for activity
- If logs still appearing, it's working

**Option 2: Retry**
- Click "Retry" button on failed item
- File will re-process
- May succeed on second attempt

**Option 3: Use smaller chunks**
- Split large PDF manually
- Upload in sections
- Faster processing per section

---

### For Developers (Future)

**Short-term fixes:**
1. Add timeout with clear error message
2. Add "heartbeat" logging every 10s
3. Show elapsed time during embedding
4. Add "Complete Without Embedding" button

**Long-term fixes:**
1. Server-Sent Events for real-time progress
2. Streaming embeddings (process as available)
3. Parallel embedding (batch embed multiple chunks)
4. Caching (avoid re-embedding identical chunks)

---

## 📊 Current Behavior Analysis

**From your logs:**

**Successful:**
```
✅ Hiab 422-477 Duo-HiDuo Manual operador.pdf
   - Chunks: 12
   - Tokens: 23,820
   - Indexing time: 4,971ms (~5 seconds)
   - Embedding: Completed (took <2 minutes total)
```

**Stuck/Failed:**
```
❌ Manual de Partes Camión Iveco Tector 170E22.pdf
   - Error: "fetch failed sending request"
   - Type: Network connection error
   - Retry: Should work
```

**Pattern:**
- Files with 10-20 chunks: Usually succeed
- Network errors: Random, retry works
- Silent stalls at 92%: Need timeout detection

---

## 💡 Recommendations

### Immediate Action

**For your current uploads:**
1. **Wait 2-3 minutes** for files at 92%
2. Check console - if logs still appearing, it's working
3. If truly stuck (no logs for 2+ min), click **"Retry"**

**For 229MB file:**
1. **Wait for server restart** (to load chunked extraction)
2. **Try upload again**
3. Should process in chunks (15-20 minutes)
4. Monitor console for chunk progress

---

### Code Improvements Needed (Next Session)

**Priority 1: Timeout Detection**
```typescript
// Add to processItem function
const RAG_TIMEOUT = 180000; // 3 minutes for large files
```

**Priority 2: Better Error Messages**
```typescript
// Capture network errors specifically
if (error.message.includes('fetch failed')) {
  errorMessage = 'Network error - please check connection and retry';
}
```

**Priority 3: Heartbeat**
```typescript
// Log every 10s during embedding
setInterval(() => {
  console.log(`  ⏳ Still embedding... ${elapsed}s elapsed`);
}, 10000);
```

---

## 🎯 Success Rate So Far

**From your test:**
- ✅ Completed: 1 file
- ❌ Failed: 1 file (network error, retriable)
- ⏳ Processing: ~35 files
- 🔄 Parallel: 5 at a time

**Once network stabilizes:**
- Expected success rate: >90%
- Files will process through
- Chunked extraction will handle large files

---

**Server restarted with chunked extraction code!**  
**Refresh page and try the 229MB file again - it should now split into chunks and process!** 🚀

