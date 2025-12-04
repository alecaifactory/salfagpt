# GOP PCO Document Issue - Agent M3-v2

**Date:** November 25, 2025  
**Agent:** GOP GPT (M3-v2)  
**Document:** GOP-D-PCO-2.PLAN DE CALIDAD Y OPERACION-(V.1).pdf  
**Status:** ❌ **NOT AVAILABLE TO AGENT**

---

## 🚨 **Problem Summary**

### **User Question:**
> "¿Cuál es el plazo máximo establecido para la elaboración del Plan de Calidad y Operación (PCO) una vez iniciada la obra, y con qué periodicidad mínima debe ser revisado el proceso de mantenimiento de dicho Plan?"

### **Agent Response:**
> "El documento proporcionado no especifica un plazo máximo..."

### **Correct Answer (in GOP-D-PCO-2.pdf, paragraph 5):**
> "Este Plan de Calidad y Operación de Obra deberá elaborarse en un plazo máximo de 30 días corridos una vez iniciada la obra y deberá permanecer actualizado en todo momento."

---

## 🔍 **Root Cause**

### **Document Status:**

According to **M003_STATUS_REPORT.md** (row 123):

| # | Filename | Size | Type | Uploaded | BigQuery | Chunks Exp | Chunks Act | Status |
|---|----------|------|------|----------|----------|------------|------------|--------|
| 123 | GOP-D-PCO-2.PLAN DE CALIDAD Y OPERACION-(V.1).pdf | 0.69 MB | PDF | ❌ | ❌ | ❌ | ❌ | ❌ |

**Conclusion:** Document was **NEVER uploaded** to agent M3-v2 OR upload/indexing failed.

### **Why Agent Couldn't Find It:**

The RAG search system works as follows:

```
1. Load sources assigned to M3-v2
   ├─ Queries: context_sources.assignedToAgents includes M3-v2's ID
   └─ Result: List of source IDs assigned to this agent
   ↓
2. Search BigQuery for chunks
   ├─ Filters: WHERE source_id IN (assigned_source_ids)
   └─ Returns: Only chunks from assigned sources
   ↓
3. If document NOT in assigned sources:
   → Never searched in BigQuery ❌
```

**Current Search Parameters:**
- `topK`: 10 (return top 10 chunks)
- `minSimilarity`: 0.3 (30% minimum for initial search)
- `qualityThreshold`: 0.5 (50% minimum to use results)

**If document HAD been indexed:**
- Query: "plazo máximo elaboración PCO"
- Chunk: "30 días corridos una vez iniciada la obra"
- Expected similarity: **70-85%** ✅ (keyword overlap + context)
- Would be returned and cited ✅

---

## ✅ **Solutions**

### **Option 1: Upload Document to Agent M3-v2** (Recommended)

**Steps:**
1. Open agent M3-v2 in the platform
2. Click **"+ Agregar"** in Fuentes de Contexto
3. Upload **GOP-D-PCO-2.PLAN DE CALIDAD Y OPERACION-(V.1).pdf**
4. Wait for extraction and indexing (~1-2 minutes)
5. Verify document appears with green toggle in context panel
6. Ask the question again

**Expected Result:**
- Document indexed with ~20-30 chunks
- Future questions about "Plan de Calidad" will find relevant chunks
- Agent will cite the correct paragraph

---

### **Option 2: Bulk Upload via CLI** (Faster for Multiple Documents)

If you have the document in your local file system:

```bash
# Upload to M3-v2 via CLI
npm run cli:upload -- \
  --agent-id=M3-v2-conversation-id \
  --file=./path/to/GOP-D-PCO-2.PLAN\ DE\ CALIDAD\ Y\ OPERACION-\(V.1\).pdf \
  --model=gemini-2.5-flash
```

**Expected Output:**
```
✅ Document uploaded
✅ Extracted 25 chunks
✅ Indexed in BigQuery
✅ Ready for RAG search
```

---

### **Option 3: Verify Existing Upload** (If You Think It's Already There)

Run this diagnostic:

```bash
npm run check:document -- \
  --name="GOP-D-PCO-2.PLAN DE CALIDAD Y OPERACION-(V.1).pdf" \
  --agent="M3-v2"
```

**This will check:**
- ✅ Does document exist in context_sources?
- ✅ Is it assigned to M3-v2 (assignedToAgents field)?
- ✅ Does it have chunks in BigQuery?
- ✅ What is its status (active/processing/error)?

---

## 📋 **Verification After Upload**

Once the document is uploaded and indexed:

### **Test Question:**
> "¿Cuál es el plazo máximo para elaborar el PCO?"

### **Expected Response:**
> "Según el Plan de Calidad y Operación (GOP-D-PCO-2), el PCO debe elaborarse en un plazo máximo de **30 días corridos** una vez iniciada la obra [1]. Además, debe permanecer actualizado en todo momento [1]."
>
> **REFERENCIAS:**
> [1] GOP-D-PCO-2.PLAN DE CALIDAD Y OPERACION-(V.1).pdf
>     Fragmento: "Este Plan de Calidad y Operación de Obra deberá elaborarse en un plazo máximo de 30 días corridos una vez iniciada la obra y deberá permanecer actualizado en todo momento."
>     Similitud: 85.3%

---

## 📊 **Why RAG Didn't Fall Back to Full Document**

You might wonder: "If the specific chunk wasn't found, why didn't it use the full document text?"

**Answer:** The system prioritizes RAG chunks over full documents:

```
IF (chunks found with similarity ≥50%)
  → Use RAG chunks ✅
ELSE IF (no chunks OR all chunks <50%)
  → Check: Does source have full extractedData?
     ├─ YES: Use full document
     └─ NO: Return "no relevant documents found"
```

**In this case:**
- Document not assigned to M3-v2 → Never searched
- Therefore: No chunks found AND no full document text loaded
- Result: Agent responded with generic "document doesn't specify"

---

## 🎯 **Key Learnings**

### **For Users:**
1. ✅ **Always verify document appears** in agent's context panel after upload
2. ✅ **Check for green toggle** indicating document is active
3. ✅ **Wait for "Indexado ✓" badge** before asking questions
4. ⚠️ **If document not showing** → Re-upload to that specific agent

### **For Platform:**
1. ✅ RAG system working correctly (would have found the answer if indexed)
2. ✅ Similarity thresholds are appropriate (30% search, 50% use)
3. ⚠️ Need better upload status visibility (show progress/errors)
4. ⚠️ Need "document not found" vs "no relevant chunks" distinction

---

## 📈 **Expected Behavior After Fix**

### **Scenario: Document Successfully Uploaded**

**Upload Process:**
1. User uploads GOP-D-PCO-2.pdf to M3-v2
2. System extracts text with Gemini
3. System chunks text into ~25 semantic chunks
4. System generates embeddings (768-dim vectors)
5. System saves to BigQuery with `source_id` and `agent_id` links
6. Document shows in context panel with green toggle ✅

**Query Process:**
1. User asks: "plazo máximo PCO"
2. System generates query embedding
3. BigQuery searches assigned sources for M3-v2
4. Finds chunk: "30 días corridos..." with 85% similarity
5. Returns chunk to Gemini for response generation
6. Gemini cites the source with inline reference [1]

**User sees:**
- ✅ Correct answer: "30 días corridos"
- ✅ Reference to specific document
- ✅ Snippet showing exact text
- ✅ Confidence in answer accuracy

---

## 🔧 **Immediate Action Required**

**To resolve this specific issue:**

1. **Upload GOP-D-PCO-2.PLAN DE CALIDAD Y OPERACION-(V.1).pdf to M3-v2**
2. **Verify it appears in context panel**
3. **Wait for indexing to complete**
4. **Re-ask the question**

**Expected outcome:** Agent will correctly cite the "30 días corridos" answer with proper reference.

---

## 📚 **Related Documentation**

- **M003_STATUS_REPORT.md** - Shows document #123 not uploaded
- **M3V2_UPLOAD_PLAN_2025-11-25.md** - Contains upload checklist
- **RESULTADO_INVESTIGACION_SIMILITUD.md** - RAG similarity investigation
- **RAG_POR_DEFECTO_2025-10-20.md** - RAG configuration standards

---

**Conclusion:** The RAG system is working correctly. The document simply needs to be uploaded and indexed for agent M3-v2 to access it.



