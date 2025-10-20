# Fix: "No hay chunks disponibles" Issue
**Date:** October 19, 2025  
**Problem:** Documents show "RAG Enabled" badge but chunks tab shows "No hay chunks disponibles"  
**Root Cause:** ragEnabled flag set to true but chunks don't exist in database

---

## 🔍 Problem Analysis

### What You're Seeing

**In Context Management:**
- Document shows "RAG Enabled" badge
- Pipeline shows: Upload ✓ → Extract ✓ → Chunk ✓ → Embed ✓
- But clicking "RAG Chunks" tab → "No hay chunks disponibles"

### Why This Happens

**Two possible causes:**

**Cause 1: Flag Set Too Early**
```
Upload → Extract → [Set ragEnabled=true] → Chunk → Embed
                    ↑ FLAG SET HERE
                                           ↑ CHUNKS CREATED HERE
```
The flag gets set before chunks are actually saved to Firestore.

**Cause 2: Chunking Silently Failed**
```
Upload → Extract → Chunk (error) → Embed (skipped)
                          ↑ Failed but no error shown
```
Chunking/embedding failed but `ragEnabled` was still set to true.

---

## ✅ Solutions

### Solution 1: Verify and Fix Existing Documents

**For each document showing "RAG Enabled" but no chunks:**

1. **Open document settings** (click settings icon)
2. **Scroll to "Indexación RAG"** (right column)
3. **If it says "RAG no indexado"** even though badge says "RAG Enabled":
   - This confirms inconsistency
   - Click "Re-indexar"
   - Wait for completion
4. **If it says "✅ RAG habilitado"**:
   - Chunks should exist
   - If chunks tab still empty → bug in chunk loading

### Solution 2: Auto-Fix Script (I'll Create This)

**Script that:**
- Scans all sources with `ragEnabled=true`
- Checks if chunks actually exist
- If no chunks → either:
  - Set `ragEnabled=false` (fix flag)
  - Or trigger chunking (create chunks)

### Solution 3: Better Upload Pipeline

**Ensure chunking happens BEFORE setting ragEnabled:**

Current flow:
```
1. Upload file
2. Extract text
3. Create context_source with ragEnabled=true  ❌ Too early!
4. Try to chunk/embed
5. If fails → source has wrong flag
```

Better flow:
```
1. Upload file
2. Extract text
3. Create context_source with ragEnabled=false
4. Chunk and embed
5. If successful → Update ragEnabled=true  ✅ Correct!
6. If fails → ragEnabled stays false ✅ Correct!
```

---

## 🔧 Immediate Fix for Your Documents

### For CIR160.pdf and CIR158.pdf

**Based on the screenshot, these have "RAG Enabled" badge:**

**Test 1: Check if chunks actually exist**
1. Click on CIR160.pdf in Context Management
2. Go to "RAG Chunks" tab
3. If shows "No hay chunks disponibles" → Inconsistent state

**Fix:**
1. Close the detail panel
2. Find CIR160.pdf in main sources list
3. Click settings icon ⚙️
4. Scroll to "Indexación RAG" (right column)
5. Click "Re-indexar"
6. Wait ~10-20 seconds
7. Should show "✅ Completado: N chunks indexados"
8. Close modal
9. Reopen and verify "✅ RAG habilitado"
10. Go to RAG Chunks tab → Should now show chunks

**Repeat for CIR158.pdf**

### For DDU-ESP-075-07.pdf

This one you just re-indexed, so it should be working. Let's verify:

1. Close current modal
2. Reopen settings for DDU document
3. Right column should show "✅ RAG habilitado"
4. Should show "📋 Historial de Indexaciones (1)"
5. Click purple "Probar Documento" button
6. Should see 1 chunk in the panel

---

## 🎨 Better Visualization (What I'll Add)

### In Context Management - Document Card

**Current:**
```
CIR160.pdf
RAG Enabled  ← This is misleading if no chunks!
```

**Better:**
```
CIR160.pdf
✅ RAG: 5 chunks  ← Shows actual chunk count
```

or

```
CIR160.pdf
⚠️ RAG: No chunks (re-index needed)  ← Clear status
```

### In RAG Chunks Tab

**Current:**
```
! No hay chunks disponibles
[Reintentar Carga]
```

**Better:**
```
⚠️ Este documento tiene ragEnabled=true pero no hay chunks en la base de datos.

Posibles causas:
• Indexación no completó correctamente
• Chunks se borraron accidentalmente
• Flag ragEnabled se marcó antes de crear chunks

✅ Solución:
[Re-indexar Documento] ← Triggers full re-indexing
```

---

## 🚀 Action Plan

### Immediate (You Do Now):

1. **Close all modals**
2. **In Context Management**, for each document with "RAG Enabled":
   - Click to open detail view
   - Go to "RAG Chunks" tab
   - If empty → note the document name
3. **Close Context Management**
4. **For each noted document:**
   - Find in main sources list (left sidebar)
   - Click settings ⚙️
   - Re-index
   - Verify chunks appear

### Next (I'll Implement):

1. **Fix the badge logic** to show actual chunk count
2. **Better error messages** in RAG Chunks tab
3. **Auto-fix button** to mark ragEnabled=false if no chunks
4. **Stricter upload pipeline** that only sets ragEnabled after chunks saved
5. **Health check** that runs on modal open

---

## 📋 Verification Checklist

After re-indexing each document:

- [ ] Document settings shows "✅ RAG habilitado"
- [ ] Shows chunk count: "X chunks indexados"
- [ ] Historial de Indexaciones has entry
- [ ] RAG Chunks tab shows actual chunks (not empty)
- [ ] Close/reopen → state persists
- [ ] Can click "Probar Documento" button
- [ ] Interactive panel shows chunks

---

## 🎯 Expected Terminal Logs

**When you re-index a document, you should see:**

```bash
🔍 Enabling RAG for source XYZ...
  Source: CIR160.pdf
  🧩 Chunking document...
  ✓ Created 5 chunks
  🧮 Generating embeddings...
  🧮 Generated 5 embeddings in 2,345ms
  💾 Stored 5 chunks in 234ms
✅ RAG enabled for CIR160.pdf
  Total time: 3,456ms
  Chunks: 5
  Ready for vector search!
```

**If you see this → Success!**

**If you see errors or warnings → Copy them and I'll fix the specific issue.**

---

## 💡 Quick Test

**To quickly test if a document has chunks:**

**In browser console:**
```javascript
// Replace SOURCE_ID with actual ID
fetch('/api/context-sources/SOURCE_ID/chunks')
  .then(r => r.json())
  .then(d => {
    console.log('Chunks:', d.chunks?.length || 0);
    if (d.chunks && d.chunks.length > 0) {
      console.log('✅ Chunks exist!');
      console.log('First chunk:', d.chunks[0].text.substring(0, 100));
    } else {
      console.log('❌ No chunks - needs re-indexing');
    }
  });
```

---

**Ready to re-index the documents that show "RAG Enabled" but have no chunks?**

Start with CIR160.pdf and CIR158.pdf - they're showing in your Context Management as having RAG but likely don't have chunks yet.


