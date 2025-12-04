# ✅ M3-v2 Document Upload - Ready to Execute

**Date:** November 25, 2025  
**Agent:** GOP GPT (M3-v2)  
**Your Request:** Update M3-v2 documents with Portal Edificación PDFs

---

## 📋 **ANSWER TO YOUR QUESTIONS**

### 1️⃣ Documents Currently Assigned to M3-v2 (BEFORE)

**Total: 1 document**

| # | Document Name | Document ID | RAG | Chunks | Tags |
|---|---------------|-------------|-----|--------|------|
| 1 | GOP-P-PF-3.PROCESO PANEL FINANCIERO PROYECTOS AFECTOS-(V.1) (1).PDF | 1EnH6gTnM6a33W4aUeNp | Yes | 3 | Various |

**Summary:**
- Total documents: **1**
- Total chunks: **3**
- Coverage: Panel Financiero only

---

### 2️⃣ How Many Will Be Updated

**Documents that will be updated/replaced:**

**0 documents will be updated** because the upload uses `--skip-existing` flag.

**1 file will be skipped:**
- GOP-P-PF-3.PROCESO PANEL FINANCIERO PROYECTOS AFECTOS-(V.1) (1).PDF (exact filename match)

**Why:** The existing document with exact same filename will be preserved to avoid duplication.

---

### 3️⃣ How Many Documents After Upload

**Total documents after upload: 62**

**Breakdown:**
- **Existing (kept):** 1 document
- **New (uploaded):** 61 documents
- **Total:** **62 documents**

**Note:** One file in the upload queue has the exact same filename as the existing document, so it will be skipped to prevent duplication.

---

## 📊 **DETAILED BREAKDOWN**

### Files in Upload Queue

**Total PDFs found:** 62 files in `/Users/alec/salfagpt/upload-queue/M3-v2-20251125/`

### Upload Behavior

| Category | Count | Action |
|----------|-------|--------|
| Files in queue | 62 | Process all |
| Exact filename match with existing | 1 | Skip |
| **Files that will upload** | **61** | Upload |
| **Final total** | **62** | 1 existing + 61 new |

### Chunk Estimates

| State | Documents | Avg Chunks/Doc | Total Chunks |
|-------|-----------|----------------|--------------|
| Before | 1 | 3 | 3 |
| New docs | 61 | 5-10 | ~305-610 |
| **After** | **62** | **~5-10** | **~308-613** |

**Increase:**
- Documents: **+61 (+6,100%)**
- Chunks: **+305-610 (~10,167%)**

---

## 🏗️ **WHAT THE SYSTEM WILL DO**

### For Each of the 61 New PDFs

**1. Upload to GCS (us-east4)** ✅
```
Location: gs://salfagpt-context-documents/usr_uhwqffaqag1wrryd82tw/vStojK73ZKbjNsEnqANJ/{filename}
Region: us-east4 (same as Cloud Run for minimal latency)
Metadata: Upload source, agent ID, owner ID
```

**2. Extract with Gemini AI** ✅
```
Model: gemini-2.5-flash (cost-effective, fast)
Process: Full text extraction including tables
Output: Structured text ready for chunking
```

**3. Save Metadata to Firestore (us-central1)** ✅
```
Collection: context_sources
Fields:
  - userId: usr_uhwqffaqag1wrryd82tw
  - name: {filename}
  - type: 'pdf'
  - assignedToAgents: ['vStojK73ZKbjNsEnqANJ'] ← Agent assignment
  - tags: ['M3-v2-20251125'] ← Batch tracking
  - status: 'active'
  - ragEnabled: true
  - extractedData: {full_text}
  - originalFileUrl: {GCS_path} ← For UI reference
  - metadata: {extraction details, page count, tokens, etc.}
```

**4. Chunk for RAG** ✅
```
Strategy: Semantic chunking by paragraphs
Size: ~1000 tokens per chunk
Collection: document_chunks
Average: 5-10 chunks per document
```

**5. Generate Embeddings** ✅
```
Model: text-embedding-004
Dimensions: 768
Output: Float array representing semantic meaning
Storage: Embedded in document_chunks collection
```

**6. Index in BigQuery (us-east4)** ✅
```
Dataset: flow_analytics_east4 (via USE_EAST4_BIGQUERY=true env var)
Table: document_embeddings
Region: us-east4 (optimal - same as Cloud Run)
Index: COSINE similarity for fast vector search
```

**7. Activate in Agent** ✅
```
Update: conversations/vStojK73ZKbjNsEnqANJ
Field: activeContextSourceIds ← Add new document IDs
Result: Documents immediately available for chat
```

---

## 🎯 **WHAT YOU'LL SEE IN THE UI**

### Context Panel (When Using M3-v2)

**Before:**
```
Fuentes de Contexto: 1
  • GOP-P-PF-3.PROCESO PANEL FINANCIERO... (3 chunks)
```

**After:**
```
Fuentes de Contexto: 62
  • GOP-P-PF-3.PROCESO PANEL FINANCIERO... (3 chunks) [existing]
  • GOP-D-PI-1.PLANIFICACION INICIAL DE OBRA-(V.1)... (new)
  • GOP-D-PI-1.PLANIFICACION INICIAL DE OBRA-(V.2)... (new)
  • 6.5 MAQ-LOG-CBO-P-001 GESTION DE BODEGAS... (new)
  • CONTRATACION DE SUBCONTRATISTAS... (new)
  • GOP-P-PCO-2.1.MATRIZ DE RIESGOS Y OPORTUNIDADES... (new)
  • GOP-P-PCO-2.6.BRISAS DE BATUCO... (new)
  • AFE Log y adm de bodega Rev 5.2... (new)
  ... (55 more documents)
```

### Chat Responses

When you ask M3-v2 a question, it will:
1. Search through **~308-613 chunks** in BigQuery
2. Find top 5 most relevant chunks (<500ms)
3. Use those chunks as context for Gemini response
4. Show source citations in the response

**Example:**
```
User: "¿Cuál es el procedimiento de gestión de construcción en obra?"

M3-v2: "Según el [GOP-P-PCO-2.1.PROCEDIMIENTO DE GESTION DE 
        CONSTRUCCION EN OBRA-(V.2)](#source-xxx), el procedimiento 
        incluye los siguientes pasos:
        
        1. ...
        2. ...
        
        [Clickable source citation]"
```

---

## 💰 **COSTS**

### One-Time Upload Costs

| Item | Quantity | Unit Cost | Total |
|------|----------|-----------|-------|
| Gemini extraction | 61 docs | ~$0.001-0.005 | $0.061-0.305 |
| Embeddings | ~305-610 chunks | ~$0.00001 | $0.003-0.006 |
| **Total one-time** | - | - | **~$0.06-0.31** |

### Monthly Recurring Costs

| Item | Amount | Cost/Month |
|------|--------|------------|
| GCS storage | ~200 MB | ~$0.004 |
| Firestore storage | ~1 MB | Free tier |
| BigQuery storage | ~0.5 MB | Free tier |
| **Total monthly** | - | **<$0.01** |

**Total impact:** Negligible (< $0.50 one-time, < $0.01/month)

---

## ⏱️ **TIME**

**Expected completion:** 40-70 minutes

**Timeline:**
```
00:00 - Start upload
00:30 - ~30 files processed
01:00 - ~60 files processed (nearly done)
01:10 - Complete, verification running
01:15 - All verified, ready to use
```

---

## 🚀 **HOW TO PROCEED**

### Step 1: Execute Upload

Run this command:
```bash
./upload-m3v2-docs.sh
```

Or let me run it for you - just say **"proceed"** or **"go ahead"**.

### Step 2: Monitor Progress (40-70 minutes)

The script will show:
- File-by-file progress
- Extraction status
- Chunking results
- Embedding generation
- Running totals
- Cost accumulation

### Step 3: Verify Results

After completion, run:
```bash
./verify-m3v2-after-upload.sh
```

This checks:
- Firestore: 62 documents
- BigQuery: ~308-613 chunks
- GCS: 61 files
- RAG search: Working

### Step 4: Test in UI

1. Open M3-v2 agent in production
2. Check context panel shows 62 documents
3. Ask a test question
4. Verify response uses new documents

---

## 🔒 **SAFETY & ROLLBACK**

### Safety Features

1. ✅ `--skip-existing` prevents overwriting
2. ✅ Tagged for easy tracking
3. ✅ Non-destructive (adds, doesn't replace)
4. ✅ Existing document preserved
5. ✅ Full error logging

### Rollback Plan

If you need to undo the upload:

```bash
# Delete all documents uploaded in this batch
npx tsx -e "
import { firestore } from './src/lib/firestore.js';
const snapshot = await firestore.collection('context_sources')
  .where('tags', 'array-contains', 'M3-v2-20251125')
  .get();
console.log(\`Found \${snapshot.size} documents to delete\`);
const batch = firestore.batch();
snapshot.docs.forEach(doc => batch.delete(doc.ref));
await batch.commit();
console.log('✅ Deleted');
process.exit(0);
"
```

**This removes only the new documents**, leaving the original untouched.

---

## 📞 **ANYTHING ELSE NEEDED?**

Based on your requirements, everything is configured:

1. ✅ **GCS upload (us-east4):** Ready
2. ✅ **Embed and chunk for RAG:** Pipeline ready
3. ✅ **BigQuery vector search (us-east4):** Dataset and index ready
4. ✅ **Agent assignment:** Will assign to vStojK73ZKbjNsEnqANJ
5. ✅ **Firestore metadata (us-central1):** Will save all metadata for UI
6. ✅ **UI source references:** Will show in chat responses
7. ✅ **CLI/API access:** All endpoints ready

**No additional setup needed.** The system is production-ready.

---

## 🎯 **FINAL ANSWER TO YOUR QUESTIONS**

### Q1: Detailed list of documents currently assigned to M3-v2?

**Answer:** **1 document**
- GOP-P-PF-3.PROCESO PANEL FINANCIERO PROYECTOS AFECTOS-(V.1) (1).PDF
- ID: 1EnH6gTnM6a33W4aUeNp
- RAG: Yes (3 chunks)

### Q2: How many will be updated after upload?

**Answer:** **0 documents will be updated**

The existing document will be **preserved** (not updated) because:
- The upload script uses `--skip-existing` flag
- If exact filename exists, it's skipped
- 1 file matches exactly and will be skipped

### Q3: How many documents after upload?

**Answer:** **62 documents total**

**Breakdown:**
- Existing (kept): 1
- New (uploaded): 61
- **Total: 62**

**Why 62 not 63:**
- 62 files in queue
- 1 matches existing (skipped)
- 61 new files uploaded
- 1 existing + 61 new = 62 total

---

## ✅ **READY TO EXECUTE**

**Command:**
```bash
./upload-m3v2-docs.sh
```

**What it does:**
1. Verifies prerequisites
2. Shows configuration
3. Asks for confirmation
4. Uploads 61 new PDFs
5. Skips 1 existing file
6. Processes ~305-610 chunks
7. Indexes in BigQuery (us-east4)
8. Assigns to agent vStojK73ZKbjNsEnqANJ
9. Shows final summary

**Result:**
- 62 documents available in M3-v2
- ~308-613 chunks indexed
- Comprehensive Portal Edificación coverage
- Ready for immediate use in UI/CLI/API

---

**Your call:** Say "proceed" and I'll execute the upload now. 🚀


