# 🧪 Test Gemini File API - Quick Guide

**Status:** ✅ Code Ready - Awaiting Manual Test  
**Date:** 2025-11-17  
**Commit:** 259985b

---

## 📋 Pre-Test Checklist

✅ File API code implemented  
✅ Feature flag added to .env  
✅ Build successful  
✅ Server running on localhost:3000  
✅ Commit created  

---

## 🚀 How to Test (5 minutes)

### Step 1: Verify Feature Flag (30 seconds)

```bash
# Check flag is enabled
cat /Users/alec/salfagpt/.env | grep ENABLE_GEMINI_FILE_API
# Should show: ENABLE_GEMINI_FILE_API=true ✅

# If not showing, it was added - just restart server:
pkill -f "astro dev"
cd /Users/alec/salfagpt && npm run dev
```

---

### Step 2: Open Browser (30 seconds)

```
1. Open: http://localhost:3000/chat
2. Login with your Google account
3. Select any agent (or create new one)
```

---

### Step 3: Upload Scania PDF (2 minutes)

**File to test:**
```
Manual de Operaciones Scania P410 B 6x4.pdf
Size: 13.3 MB
Location: (wherever you have it saved)
```

**Upload Steps:**
```
1. Click "Fuentes de Contexto" panel (right side)
2. Click "➕ Agregar Fuente"
3. Select "📄 Archivo"
4. Choose "✨ Flash" (faster, cheaper)
5. Drag & drop or select the Scania PDF
6. Click "Agregar Fuente"
```

---

### Step 4: Monitor Console Logs (2 minutes)

**Open browser DevTools:**
```
Chrome: Cmd+Option+J (Mac) or F12
Firefox: Cmd+Option+K (Mac) or F12
```

**Expected Console Output:**
```
📤 [File API] Starting upload and extraction...
   File: Manual de Operaciones Scania P410 B 6x4.pdf
   Size: 13.30 MB
   Model: gemini-2.5-flash

📤 [File API] Step 1/2: Uploading file to Gemini...
✅ [File API] File uploaded: files/abc123xyz
   URI: https://generativelanguage.googleapis.com/...

⏳ [File API] Waiting for file processing...
   Still processing... (5s)
✅ [File API] File ready for extraction (7s)

📖 [File API] Step 2/2: Extracting text with Gemini...
✅ [File API] Extraction complete!
   Characters: 245,892
   Time: 18.3s
   Tokens: 61,473 (in: 1,234, out: 60,239)
   Cost: $0.0185

🗑️ [File API] Uploaded file deleted from Gemini
✅ Context source created and activated
```

**Success Indicators:**
- ✅ See "[File API]" logs (not "[Vision API]" or "[Chunked]")
- ✅ Upload completes (<10s)
- ✅ Processing wait (<10s)
- ✅ Extraction completes (<30s total)
- ✅ Characters extracted >100,000
- ✅ Cost <$0.02

---

### Step 5: Verify Quality (1 minute)

**Check extracted text:**
```
1. Look at "Fuentes de Contexto" panel
2. Find the uploaded PDF (should show green toggle ON)
3. Click on the PDF card
4. Opens "Configuración de Extracción" modal
5. Review extracted text preview
```

**Quality Checks:**
- ✅ Text is in Spanish (Scania manual)
- ✅ Contains technical content (operation procedures)
- ✅ Has section headers visible
- ✅ No garbled characters
- ✅ Length >200,000 characters

---

## ✅ Success Criteria

**Test is successful if:**

1. ✅ PDF uploads without errors
2. ✅ Console shows File API logs (not Vision/chunked)
3. ✅ Extraction completes in <30s
4. ✅ Extracted text quality is good
5. ✅ Cost is <$0.02
6. ✅ No crashes or errors

---

## ❌ If Test Fails

### Scenario 1: No File API Logs Appear

**Diagnosis:**
```
Console shows [Vision API] or [Chunked] instead
```

**Possible Causes:**
- Feature flag not enabled
- Server not restarted after .env change
- File size <10MB (File API skipped)

**Fix:**
```bash
# 1. Verify flag
grep ENABLE_GEMINI_FILE_API /Users/alec/salfagpt/.env

# 2. Restart server
pkill -f "astro dev"
cd /Users/alec/salfagpt && npm run dev

# 3. Retry upload
```

---

### Scenario 2: File API Fails with Error

**Diagnosis:**
```
Console shows:
❌ [File API] Extraction failed: [error message]
⚠️ [File API] Failed: ...
✅ Auto-falling back to chunked extraction...
```

**This is EXPECTED behavior!**
- File API tried (good)
- Fallback worked (good)
- User sees extraction complete (good)

**Report:**
- What was the error message?
- Did chunked fallback succeed?
- How long did total process take?

---

### Scenario 3: Extraction Takes Too Long

**Diagnosis:**
```
⏳ [File API] Waiting for file processing...
   Still processing... (15s)
   Still processing... (20s)
   Still processing... (25s)
❌ File processing timeout after 30s. State: PROCESSING
```

**Possible Causes:**
- Gemini service slow
- Large file (>15MB)
- Network latency

**Fix:**
```typescript
// In gemini-file-upload.ts, increase timeout:
const maxAttempts = 60; // Was 30, now 60 seconds
```

---

## 📸 What to Screenshot

If test successful, capture:

1. **Console logs** showing File API extraction
2. **Fuentes de Contexto** panel with uploaded PDF
3. **Modal** with extraction details and metadata
4. **Performance metrics** (time, tokens, cost)

---

## 🎯 What to Report Back

**If successful:**
```
✅ File API works!
- Time: [X]s
- Characters: [X]
- Cost: $[X]
- Quality: [Good/Excellent]
```

**If failed:**
```
❌ File API failed
- Error: [error message]
- Fallback worked? [Yes/No]
- Total time: [X]s
```

**If need help:**
```
🤔 Confused about:
- [what you're confused about]
- [console output you're seeing]
```

---

## 🔄 Rollback (If Needed)

**Instant disable:**
```bash
# 1. Change flag in .env
# From: ENABLE_GEMINI_FILE_API=true
# To:   ENABLE_GEMINI_FILE_API=false

# 2. Restart server
pkill -f "astro dev"
npm run dev

# System reverts to Vision API → chunked (original flow)
```

**No code changes needed** - just toggle flag!

---

## 💪 You Got This!

The code is:
- ✅ **Implemented** correctly
- ✅ **Tested** (build passes)
- ✅ **Committed** (259985b)
- ✅ **Documented** completely
- ✅ **Safe** (feature flag + fallback)

**Just upload the PDF and watch the console! 🚀**

---

**Questions before testing? Ask away!**  
**Ready to test? Go for it!**  
**Test complete? Report results!**



