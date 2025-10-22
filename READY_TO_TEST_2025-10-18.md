# ✅ Ready to Test - Cloud Storage + RAG

**Date:** October 18, 2025  
**Status:** 🚀 DEV SERVER RUNNING

---

## ✅ What's Ready

### 1. Cloud Storage Integration
- ✅ Original files now saved to Cloud Storage
- ✅ Files preserved for re-indexing
- ✅ No need to re-upload

### 2. RAG Toggle
- ✅ Pure toggle switch (no opening settings)
- ✅ Works even without RAG chunks
- ✅ Shows warning if not indexed

### 3. Re-indexing Capability
- ✅ Downloads from Cloud Storage
- ✅ Re-extracts with Gemini
- ✅ Creates RAG chunks
- ✅ Updates metadata

### 4. Audit System
- ✅ Tracks RAG vs Full-Text usage
- ✅ Shows actual tokens used
- ✅ Complete configuration details

---

## 🧪 Test Now

### Test 1: Upload NEW Document (Will save to Cloud Storage)

```
1. Go to http://localhost:3000/chat
2. Click "+ Agregar" (Add Source)
3. Upload a PDF
4. Watch console logs:
   📤 Uploading to Cloud Storage...
   ✅ File uploaded successfully
   
5. Document appears with metadata
```

---

### Test 2: Re-index for RAG

```
1. Find the ANEXOS document (no RAG chunks yet)
2. It shows: 🔍 RAG [──●] (RAG toggle OFF, purple)
3. Click the toggle to turn ON RAG
4. See warning: ⚠️ RAG no indexado - usará Full-Text
5. Click "Re-extraer"
6. Wait ~1-2 minutes
7. Document updates to show: 🔍 46 chunks
8. RAG toggle now green and functional
```

---

### Test 3: Use RAG in Query

```
1. After re-indexing, toggle should be: 🔍 RAG [●──] (green)
2. Send specific question: "¿Qué dice sobre participación ciudadana?"
3. Open Context Panel
4. Check log shows: 🔍 RAG (green badge)
5. Verify tokens ~2,500 (not ~54,000)
```

---

## 📊 What to Look For

### In Console Logs

**Upload:**
```
📤 Uploading to Cloud Storage: documents/...
✅ File uploaded successfully
📍 URL: https://storage.googleapis.com/...
```

**Re-index:**
```
📥 Downloading from Cloud Storage: documents/...
✅ File downloaded: 2458912 bytes
✅ Fresh extraction complete: 45123 characters
🔍 Starting RAG indexing...
✅ RAG indexing complete!
```

**Query with RAG:**
```
🔍 Attempting RAG search...
  Configuration: topK=5, minSimilarity=0.5
✅ RAG: Using 5 relevant chunks (2500 tokens)
  Avg similarity: 87.3%
```

---

### In UI

**Document card:**
```
📄 ANEXOS-Manual...
   🔍 46 chunks        🔍 RAG [●──]
                              └─ Green toggle
```

**Context log:**
```
Modo: 🔍 RAG (green badge)
Tokens: ~2,500
```

**Detalles expandibles:**
```
🔍 Configuración RAG:
  Habilitado: Sí
  Realmente usado: Sí ✓
  Chunks usados: 5
  Similaridad: 87.3%
```

---

## 🎯 Quick Start

**Right now:**

1. **Refresh browser** (F5)
2. **Open** http://localhost:3000/chat
3. **Test** upload a new document
4. **Verify** Cloud Storage logs appear
5. **Try** re-indexing ANEXOS document

---

## 📋 Troubleshooting

**If upload fails:**
```bash
# Check Cloud Storage permissions
gcloud storage buckets get-iam-policy \
  gs://gen-lang-client-0986191192-uploads
```

**If re-index fails:**
```bash
# Check file exists in storage
gsutil ls gs://gen-lang-client-0986191192-uploads/documents/
```

**If RAG toggle doesn't work:**
- Check browser console for errors
- Verify toggle state updates
- Check backend logs

---

## ✅ Checklist

- [x] Dev server restarted
- [x] Cloud Storage integrated
- [x] RAG toggle is pure toggle
- [x] Re-index endpoint ready
- [x] Build successful
- [x] No TypeScript errors
- [ ] Test upload (do now)
- [ ] Test re-index (do now)
- [ ] Test RAG query (do after re-index)

---

**Server running at:** http://localhost:3000

**Ready to test!** 🚀














