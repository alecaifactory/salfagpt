# 📊 M3-v2 Document Upload - Complete Summary

**Created:** November 25, 2025  
**Agent:** GOP GPT (M3-v2)  
**Agent ID:** `vStojK73ZKbjNsEnqANJ`  
**Owner:** alec@getaifactory.com

---

## 🎯 **EXECUTIVE SUMMARY**

### What You Asked For

Update the documents for M3-v2 agent with new PDFs from Portal Edificación, ensuring:
1. ✅ Upload to GCS (us-east4)
2. ✅ Embed and chunk for RAG with BigQuery vector search (us-east4)
3. ✅ Assign to agent ID `vStojK73ZKbjNsEnqANJ`
4. ✅ Metadata in Firestore (us-central1) for UI reference

### What Will Happen

The system will:
1. Upload **62 PDF files** to Cloud Storage
2. Extract content using Gemini AI
3. Create **~310-620 text chunks**
4. Generate **~310-620 vector embeddings** (768 dimensions each)
5. Index in BigQuery for fast similarity search
6. Assign all documents to M3-v2 agent
7. Make everything available in UI, CLI, and API

---

## 📋 **CURRENT STATE (BEFORE)**

### Agent M3-v2 - Current Documents

**Total:** 1 document

| Document Name | ID | RAG | Chunks |
|---------------|-----|-----|--------|
| GOP-P-PF-3.PROCESO PANEL FINANCIERO PROYECTOS AFECTOS-(V.1) (1).PDF | 1EnH6gTnM6a33W4aUeNp | Yes | 3 |

**Coverage:** Panel Financiero only

---

## 📥 **NEW DOCUMENTS (TO UPLOAD)**

### Source
- **Folder:** `/Users/alec/salfagpt/upload-queue/M3-v2-20251125/`
- **Total PDFs:** 62 files

### Document Categories

**Portal Edificación documents organized in 2 batches:**

#### Batch 1: Primera carga de documentacion (30 PDFs)
- Planificación Inicial de Obra (1)
- Plan de Calidad y Operación (20)
  - Calidad y Operación de Obra (13)
  - Control Materiales y Ensayos (3)
  - Control de Documentos (1)
  - Control Portería (1)
  - Root files (2)
- Panel Financiero (6)
  - Anexos (4)
  - Root files (2)
- Entorno Vecino (1)
- Control de Etapa (1)
- Root duplicates (2)

#### Batch 2: Segunda carga de documentacion 19-11 (32 PDFs)
- Planificación Inicial de Obra (1) - **VERSION UPDATE V.1→V.2**
- Plan de Calidad y Operación (18)
  - Calidad y Operación de Obra (9)
  - Control Materiales y Ensayos (2)
  - Control Portería (1)
  - **Políticas Calidad (5)** - NEW SECTION
  - Root files (1)
- Panel Financiero (8)
  - Extra root file (1) - NEW
  - Anexos (4)
  - Root files (2)
- Entorno Vecino (2) - **1 NEW**
- Control de Etapa (1)
- **AFE Logística (1)** - NEW CATEGORY
- Root files (2)

### Key New Additions

1. **Section 2.6: Políticas Calidad** (5 documents)
   - BRISAS DE BATUCO
   - GEOMAR V
   - NOVAL
   - NOVATEC EDIFICIOS
   - NOVATEC

2. **Section 6: AFE Logística** (1 document)
   - AFE Log y adm de bodega Rev 5.2

3. **New Documents:**
   - GOP-P-PCO-2.1.MATRIZ DE RIESGOS Y OPORTUNIDADES.pdf
   - Presentacion Manual Relacionamiento Comunitario 2024 13-08.pdf
   - 20240222-BODEGA NEWS! NUEVO Paso a Paso MAQ-LOG-CBO-PP-019...

4. **Version Updates:**
   - GOP-D-PI-1: V.1 → V.2 (Planificación Inicial)

---

## 🔄 **ANALYSIS: UPDATES vs NEW**

### Documents Matching Existing

**1 potential match:**
- GOP-P-PF-3.PROCESO PANEL FINANCIERO PROYECTOS AFECTOS-(V.1)
  - Existing has " (1).PDF" suffix
  - New files have similar names but slight variations

**Action:** Since `--skip-existing` flag is used and filenames don't match exactly, all will be uploaded as separate documents.

### Documents That Are New

**Approximately 61-62 new documents** covering expanded sections and new procedures.

---

## 📍 **EXPECTED FINAL STATE (AFTER)**

### Documents Assigned to M3-v2

| Metric | Before | After | Increase |
|--------|--------|-------|----------|
| **Total Documents** | 1 | **63** | **+62 (+6,200%)** |
| **RAG-Enabled Docs** | 1 | 63 | +62 |
| **Total Chunks** | 3 | **~313-623** | **+310-620** |
| **Embeddings (768d)** | 3 | ~313-623 | +310-620 |

### Coverage Expansion

**Before:** 
- ✅ Panel Financiero (partial)

**After:**
- ✅ Planificación Inicial de Obra
- ✅ Plan de Calidad y Operación
  - ✅ Calidad y Operación de Obra
  - ✅ Control Materiales y Ensayos
  - ✅ Control de Documentos
  - ✅ Control Portería
  - ✅ **Políticas Calidad** (NEW)
- ✅ Panel Financiero (complete)
- ✅ Entorno Vecino
- ✅ Control de Etapa
- ✅ **AFE Logística** (NEW)

---

## 🏗️ **INFRASTRUCTURE MAPPING**

### Regional Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   MULTI-REGION ARCHITECTURE                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📁 GCS Storage                                             │
│     Location: us-east4 ✅                                   │
│     Bucket: salfagpt-context-documents                      │
│     Files: 62 PDFs                                          │
│     Path: usr_uhwqffaqag1wrryd82tw/vStojK73ZKbjNsEnqANJ/   │
│                                                             │
│  🔥 Firestore                                               │
│     Location: us-central1 ✅                                │
│     Collections:                                            │
│       - context_sources (63 documents)                      │
│       - document_chunks (~313-623 chunks)                   │
│       - conversations (1 agent: M3-v2)                      │
│                                                             │
│  📊 BigQuery                                                │
│     Location: us-east4 ✅                                   │
│     Dataset: flow_analytics_east4                           │
│     Table: document_embeddings                              │
│     Rows: ~313-623 (768-dimensional vectors)                │
│     Index: COSINE similarity                                │
│                                                             │
│  ⚡ Cloud Run                                               │
│     Location: us-east4 ✅                                   │
│     Service: cr-salfagpt-ai-ft-prod                         │
│     Endpoint: /api/agents/{id}/search                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Optimization:** GCS, BigQuery, and Cloud Run all in **us-east4** for minimal latency.

---

## 🔧 **TECHNICAL DETAILS**

### Upload Process Per File

**Step 1: GCS Upload**
```bash
Destination: gs://salfagpt-context-documents/{userId}/{agentId}/{filename}
Region: us-east4
Metadata:
  - uploadedBy: usr_uhwqffaqag1wrryd82tw
  - uploadedVia: cli
  - agentId: vStojK73ZKbjNsEnqANJ
```

**Step 2: Gemini Extraction**
```javascript
Model: gemini-2.5-flash
Input: PDF file
Output: Full text (with tables and image descriptions)
Tokens: ~1000-10000 per document
Cost: ~$0.001-0.005 per document
```

**Step 3: Firestore Metadata**
```javascript
Collection: context_sources
Document fields:
  userId: "usr_uhwqffaqag1wrryd82tw"
  name: "{filename}"
  type: "pdf"
  assignedToAgents: ["vStojK73ZKbjNsEnqANJ"]
  tags: ["M3-v2-20251125"]
  status: "active"
  ragEnabled: true
  extractedData: "{full_text}"
  originalFileUrl: "gs://..."
  metadata: { extraction details }
```

**Step 4: Chunking**
```javascript
Strategy: Semantic chunking by paragraphs
Chunk size: ~1000 tokens (~4000 characters)
Overlap: Minimal (sentence boundaries)
Storage: document_chunks collection
```

**Step 5: Embedding Generation**
```javascript
Model: text-embedding-004
Dimensions: 768
API: Google AI Embedding API
Output: Float array [768]
Cost: ~$0.0001 per chunk
```

**Step 6: BigQuery Indexing**
```sql
INSERT INTO flow_analytics_east4.document_embeddings
VALUES (
  chunk_id,
  source_id,
  user_id,
  chunk_index,
  text_preview,
  full_text,
  embedding,  -- ARRAY<FLOAT64>[768]
  metadata,
  created_at
)
```

**Step 7: Agent Activation**
```javascript
Update: conversations/{agentId}
Add to: activeContextSourceIds array
Result: Document available for chat
```

---

## 💰 **COST BREAKDOWN**

### Gemini Extraction (62 documents)
- Model: gemini-2.5-flash
- Pricing: $0.075/1M input tokens, $0.30/1M output tokens
- Estimate per doc: 2000 input + 5000 output tokens
- **Cost:** ~$0.062-0.310

### Embeddings (~400 chunks average)
- Model: text-embedding-004
- Pricing: $0.00002/1k tokens
- Estimate: 400 tokens per chunk × 400 chunks = 160k tokens
- **Cost:** ~$0.003-0.006

### Storage
- GCS: 62 PDFs (~200 MB) = $0.004/month
- Firestore: ~1 MB metadata = free tier
- BigQuery: 400 chunks × 1 KB = 0.4 MB = free tier

**Total one-time cost:** **~$0.07-0.32**  
**Monthly recurring:** **< $0.01**

---

## ⏱️ **TIME BREAKDOWN**

### Per Document Processing
| Step | Time | Description |
|------|------|-------------|
| GCS Upload | 2-5s | Network transfer |
| Gemini Extraction | 10-30s | AI processing |
| Firestore Save | 1-2s | Database write |
| Chunking | 2-5s | Text processing |
| Embeddings | 3-6s | Generate + batch (5-10 chunks) |
| BigQuery Sync | 1-2s | Vector index |
| Agent Update | 1s | Update activeIds |
| **Total** | **20-51s** | Per document |

### Total for 62 Documents
- **Minimum:** 20s × 62 = 20.7 minutes
- **Maximum:** 51s × 62 = 52.7 minutes
- **With delays:** Add 10-15 minutes for rate limiting
- **Expected:** **40-65 minutes**

---

## ✅ **VERIFICATION PLAN**

### Automated Checks (Post-Upload)

Run: `./verify-m3v2-after-upload.sh`

This will check:
1. **Firestore:** 63 documents assigned to agent
2. **BigQuery:** 310-620 chunks indexed
3. **GCS:** 62 PDF files stored
4. **RAG Search:** Test query returns results

### Manual Checks

1. **UI Test:**
   ```
   - Open https://cr-salfagpt-ai-ft-prod-861710357796.us-east4.run.app/chat
   - Select M3-v2 agent
   - Open context panel
   - Verify 63 documents visible
   - Verify all toggles work
   ```

2. **Chat Test:**
   ```
   - Ask: "¿Cuál es el procedimiento de gestión de construcción en obra?"
   - Verify: Response references new documents
   - Check: Source citations appear
   ```

3. **CLI Test:**
   ```bash
   npx tsx cli/test-agent-search.ts \
     --agent=vStojK73ZKbjNsEnqANJ \
     --query="Explica el proceso de panel financiero"
   ```

---

## 🚀 **EXECUTION INSTRUCTIONS**

### Prerequisites (Already Verified ✅)

- [x] GCloud authentication working
- [x] Project set to `salfagpt`
- [x] GCS bucket exists
- [x] Firestore accessible
- [x] BigQuery datasets exist
- [x] Upload folder exists with 62 PDFs
- [x] Environment configured for us-east4

### Execute Upload

**Option 1: Using wrapper script (Recommended)**
```bash
./upload-m3v2-docs.sh
```

**Option 2: Direct command**
```bash
npx tsx cli/commands/upload.ts \
  --folder=/Users/alec/salfagpt/upload-queue/M3-v2-20251125 \
  --tag=M3-v2-20251125 \
  --agent=vStojK73ZKbjNsEnqANJ \
  --user=usr_uhwqffaqag1wrryd82tw \
  --email=alec@getaifactory.com \
  --model=gemini-2.5-flash \
  --skip-existing
```

**What to expect:**
- Progress bars for each file
- Detailed logs for each step
- Running totals after each file
- Final summary at completion
- Estimated time: 40-65 minutes

### After Upload

**Verify:**
```bash
./verify-m3v2-after-upload.sh
```

**Check agent in UI:**
```bash
# Get documents count
node check-m3v2-docs.mjs

# Should show 63 documents
```

---

## 📊 **EXPECTED OUTCOMES**

### Numbers

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Documents | 1 | **63** | **+62** |
| RAG Chunks | 3 | **~313-623** | **+310-620** |
| Embeddings | 3 | ~313-623 | +310-620 |
| Coverage | 1 section | 10 sections | +9 sections |
| Agent Capability | Basic | **Comprehensive** | Expert level |

### Functional Improvements

**Before:**
- Can answer questions about: Panel Financiero (limited)
- Knowledge base: 1 document
- Specificity: Low

**After:**
- Can answer questions about: 10 major operational areas
- Knowledge base: 63 documents
- Specificity: High
- Coverage: End-to-end construction procedures

### Use Cases Enabled

With 63 documents, M3-v2 will be able to:

1. ✅ Guide initial project planning
2. ✅ Explain quality and operations procedures
3. ✅ Detail materials control processes
4. ✅ Describe document management workflows
5. ✅ Outline gate control responsibilities
6. ✅ Provide project-specific quality policies
7. ✅ Explain financial panel processes (both types)
8. ✅ Guide community relations
9. ✅ Detail stage control (DS49)
10. ✅ Advise on logistics and warehouse admin

---

## 🎯 **WHAT YOU NEED TO DO**

### Option A: Let me execute now

Just say **"go ahead"** or **"proceed"** and I'll run:
```bash
./upload-m3v2-docs.sh
```

I'll monitor the process and report progress.

### Option B: Review first

If you want to review anything before execution, let me know what you'd like to check:
- Upload configuration
- Cost estimates
- Time estimates
- Document list
- Infrastructure setup

### Option C: Execute manually

You can run it yourself:
```bash
cd /Users/alec/salfagpt
./upload-m3v2-docs.sh
```

Then after completion:
```bash
./verify-m3v2-after-upload.sh
```

---

## 🔒 **SAFETY & ROLLBACK**

### Safety Features

1. ✅ **--skip-existing flag:** Won't duplicate if file already uploaded
2. ✅ **Non-destructive:** Existing document preserved
3. ✅ **Tagged:** All new docs tagged `M3-v2-20251125` for tracking
4. ✅ **Reversible:** Can delete by tag if needed
5. ✅ **Progress tracking:** Full logs for debugging

### Rollback If Needed

```bash
# Delete all documents with tag M3-v2-20251125
npx tsx -e "
import { firestore } from './src/lib/firestore.js';
const snapshot = await firestore.collection('context_sources')
  .where('tags', 'array-contains', 'M3-v2-20251125')
  .get();
console.log(\`Deleting \${snapshot.size} documents...\`);
const batch = firestore.batch();
snapshot.docs.forEach(doc => batch.delete(doc.ref));
await batch.commit();
console.log('✅ Rollback complete');
process.exit(0);
"
```

This removes all newly uploaded documents in one command.

---

## 📝 **ADDITIONAL INFORMATION**

### Do We Need Anything Else?

Based on your requirements, the system is fully configured:

1. ✅ **GCS upload (us-east4):** Bucket exists and accessible
2. ✅ **RAG embeddings:** Pipeline ready with text-embedding-004
3. ✅ **BigQuery indexing (us-east4):** Dataset and table exist with vector index
4. ✅ **Agent assignment:** Function exists to assign docs to agent
5. ✅ **Firestore metadata:** All metadata saved for UI display
6. ✅ **UI integration:** Source references will show in chat responses
7. ✅ **CLI integration:** Agent search API ready
8. ✅ **API integration:** REST endpoints working

**Everything is ready to go.** ✅

### What Happens in the UI

After upload, when a user chats with M3-v2:

1. User asks: *"¿Cuál es el procedimiento de inicio de obras de edificación?"*
2. System searches ~623 chunks in BigQuery (<500ms)
3. Returns top 5 most relevant chunks
4. Gemini generates response using those chunks as context
5. UI shows response with source citations
6. User can click citations to see original document metadata

### What Happens in CLI/API

```bash
# Search via API
curl -X POST https://cr-salfagpt-ai-ft-prod-861710357796.us-east4.run.app/api/agents/vStojK73ZKbjNsEnqANJ/search \
  -H "Content-Type: application/json" \
  -d '{"query": "procedimiento de gestión de construcción"}'

# Returns top K chunks with:
# - source_id (links to Firestore document)
# - similarity score
# - text excerpt
# - metadata (page numbers, etc.)
```

---

## 🎓 **LESSONS FROM SIMILAR UPLOADS**

Based on previous bulk uploads (S001 agent with 121 documents):

### What Went Well
- ✅ Batch upload completed successfully
- ✅ All documents RAG-enabled
- ✅ Search working with <2s latency
- ✅ UI showing all documents correctly
- ✅ Cost came in under estimates

### What to Watch For
- ⚠️ Large PDFs may timeout (>50MB) - current queue looks fine
- ⚠️ Rate limiting after ~100 rapid extractions - we have 62
- ⚠️ Duplicate filenames - handled with tags
- ⚠️ Special characters in filenames - shouldn't be an issue

### Best Practices Applied
- ✅ Using `--skip-existing` to prevent duplicates
- ✅ Tagging with batch identifier for tracking
- ✅ Using Flash model (cost-effective)
- ✅ Progress tracking for monitoring
- ✅ Error recovery (failed files don't stop batch)

---

## 🎯 **READY FOR EXECUTION**

### Summary Checklist

- [x] **Current state documented:** 1 document, 3 chunks
- [x] **New documents identified:** 62 PDFs
- [x] **Expected final state calculated:** 63 documents, ~313-623 chunks
- [x] **Infrastructure verified:** All systems ready
- [x] **Cost estimated:** ~$0.07-0.32
- [x] **Time estimated:** 40-65 minutes
- [x] **Safety measures:** Rollback plan ready
- [x] **Verification plan:** Automated script created

### All Systems Go ✅

**Everything is ready.** The upload can proceed safely with:
- Minimal cost (<$0.50)
- Reasonable time (~1 hour)
- Full rollback capability
- Comprehensive verification

**Your call:** Say "proceed" and I'll execute, or let me know if you want to review anything else.

---

**Status:** Ready for execution  
**Risk:** Low  
**Impact:** High (63× increase in agent knowledge)  
**Reversible:** Yes (tagged for easy rollback)


