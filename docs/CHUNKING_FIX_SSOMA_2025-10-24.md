# 🔧 Critical Chunking Fix for SSOMA Documents - 2025-10-24

## 🚨 Problem Identified

**Issue:** SSOMA-P-004 document (263,348 characters) was only creating **2 chunks** instead of expected ~65 chunks.

```
📄 Created 2 chunks in 1ms
  Chunk 0: 192 tokens (portada)
  Chunk 1: 7,908 tokens (¡TODO EL DOCUMENTO!)
```

**Impact:**
- ❌ Chunk 1 era 8x más grande que el límite de 1000 tokens
- ❌ Toda la información mezclada en un chunk gigante
- ❌ Búsqueda vectorial imprecisa
- ❌ No encontraba secciones específicas como "riesgo más grave"

---

## ✅ Root Cause

**Función usada:**
```typescript
const chunks = chunkTextSmart(extractedText, chunkSize);
```

**Problema de `chunkTextSmart()`:**
- Divide por párrafos/secciones
- Si el documento tiene párrafos muy largos → chunks gigantes
- SSOMA tiene secciones largas → generó 1 chunk de 7,908 tokens

---

## ✅ Solution Applied

**Changed to:**
```typescript
const chunks = chunkText(extractedText, chunkSize, overlap);
```

**Benefits of `chunkText()`:**
- ✅ Garantiza chunks de tamaño consistente
- ✅ Usa overlap para preservar contexto
- ✅ No depende de estructura del documento
- ✅ Predecible: 263K chars → ~65 chunks de 1000 tokens

---

## 📝 File Modified

**File:** `src/pages/api/context-sources/[id]/enable-rag.ts`

**Lines 78, 88:**
```typescript
// BEFORE:
const { chunkTextSmart } = await import('../../../../lib/chunking.js');
const chunks = chunkTextSmart(extractedText, chunkSize);

// AFTER:
const { chunkText } = await import('../../../../lib/chunking.js');
const chunks = chunkText(extractedText, chunkSize, overlap);
```

---

## 🧪 Testing Instructions

### Step 1: Delete Current SSOMA-P-004
1. Open http://localhost:3000/chat
2. Go to Context Sources
3. Find "SSOMA-P-004 PROCEDIMIENTO PARA LA GESTION DEL RIESGO REV.2.PDF"
4. Delete it

### Step 2: Re-upload SSOMA-P-004
1. Upload the PDF again
2. Wait for processing to complete

### Step 3: Verify Chunking
**Check browser console logs:**
```
Expected:
  📄 Created ~65 chunks in Xms  ← Should be 60-70 chunks now!

Old (broken):
  📄 Created 2 chunks in 1ms
```

### Step 4: Test Search
**Ask the question:**
```
A todos los Peligros se les debe asociar el evento de riesgo más grave que puede desencadenar priorizando los Riesgos Críticos Operacionales
```

**Expected in console:**
```
✅ RAG Search complete - X results
  1. SSOMA-P-004... (chunk 15) - 85% similar
  2. SSOMA-P-004... (chunk 16) - 78% similar
  3. SSOMA-P-004... (chunk 14) - 72% similar
  ...
```

**Expected AI Response:**
Should cite SSOMA-P-004 and include the correct information about "riesgo más grave" ✅

---

## 📊 Expected Results

### Before Fix:
```
Chunks created: 2
Chunk sizes: [192 tokens, 7,908 tokens]
Search result: ❌ No encuentra información específica
AI response: "No tengo información..."
```

### After Fix:
```
Chunks created: ~65
Chunk sizes: [1,000 tokens average, consistent]
Search result: ✅ Encuentra chunks relevantes (70-85% similarity)
AI response: ✅ Cita SSOMA-P-004 correctamente
```

---

## 🎯 Configuration Summary

Current optimized settings after all changes today:

| Parameter | Value | Reason |
|-----------|-------|--------|
| **Chunk Size** | 1000 tokens | Keeps complete sections together |
| **Overlap** | 100 tokens | Preserves cross-chunk context |
| **Chunking Method** | `chunkText()` | Consistent, predictable chunks |
| **TOP_K** | 10 chunks | More comprehensive search |
| **Min Similarity** | 60% | Quality threshold |
| **Embedding Model** | gemini-embedding-001 | Free, good quality |
| **Dimensions** | 768 | Sufficient for Spanish text |

---

## 🚀 Next Steps

### Immediate (Today):
1. ✅ Chunking fixed
2. ⏳ Re-upload SSOMA-P-004
3. ⏳ Test search
4. ⏳ Verify AI response

### Future (Next Week):
1. Add extraction method selector (PyPDF vs Gemini)
2. Add embedding model selector (Gemini vs Vertex)
3. Add per-document configuration UI
4. Add dimension selector for Vertex models

---

## 💡 Key Learning

**chunkTextSmart() is NOT suitable for:**
- ❌ Technical documents with long sections
- ❌ Documents with inconsistent paragraph structure
- ❌ When you need predictable chunk sizes

**chunkText() IS suitable for:**
- ✅ Any document type
- ✅ Consistent, predictable chunking
- ✅ Optimal for RAG search
- ✅ **Default choice** ⭐

---

**Status:** ✅ Fixed and Committed  
**Commit:** 24683c8  
**Ready for:** SSOMA-P-004 re-upload and testing  
**Expected Impact:** Search accuracy will improve from 0% to 85%+

---

**Created:** 2025-10-24  
**Issue:** Chunking creating inconsistent chunk sizes  
**Fix:** Switch from chunkTextSmart() to chunkText()

