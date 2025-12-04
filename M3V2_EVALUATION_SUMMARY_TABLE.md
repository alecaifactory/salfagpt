# M3-v2 Agent - Evaluation Summary Table

**Agent:** GOP GPT (M3-v2)  
**Agent ID:** vStojK73ZKbjNsEnqANJ  
**Test Date:** 2025-11-25  
**Test Method:** API (Direct curl to `/api/conversations/:id/messages-stream`)

---

## 📊 Results Table

| ID | Pregunta | Respuesta Encontrada | Referencias | Rating Esperado | Status | Notas |
|---|---|---|---|---|---|---|
| **1** | Plazo PCO elaboración y periodicidad | "30 días naturales desde inicio de obra; revisión anual" | ❌ 0 | Inaceptable | ❌ FAIL | Respuesta genérica, sin referencias a docs SalfaGestión |
| **2** | Responsable coordinación procedimientos inicio obra | "Jefe de Obra; en ausencia Gerente de Construcción" | ❌ 0 | - | ❌ FAIL | Respuesta incorrecta (debería ser AO y Gerente Operaciones) |
| **6** | Responsable actualizar control etapas | "Jefe de Obra" | ❌ 0 | Sobresaliente | ❌ FAIL | Respuesta incorrecta (debería ser Gerente de Proyecto GP) |
| **9** | Calendario control etapas DS49 | "En Manual MINVU (externo)" | ❌ 0 | - | ❌ FAIL | Refiere a docs externos, no procedimiento interno GOP |
| **24** | Jefe terreno solicitar materiales | "Proceso genérico de requisición" | ❌ 0 | Inaceptable | ❌ FAIL | No menciona sección 6.5 Plan Calidad ni formularios específicos |
| **26** | Panel financiero mes a mes | "Proceso genérico mensual" | ❌ 0 | Inaceptable | ❌ FAIL | No detalla fases específicas de Panel Financiero SalfaGestión |
| **27** | Vecino molesto por polvo | "Consejos generales de manejo" | ❌ 0 | Inaceptable | ❌ FAIL | No usa procedimiento ENTORNO VECINOS, no da planillas/anexos |
| **30** | Control de calidad proyectos | "QA/QC framework genérico" | ❌ 0 | Sobresaliente | ⚠️ PARTIAL | Buena respuesta pero sin referencias a docs específicos |

---

## 🎯 Key Findings

### ❌ **CRITICAL: RAG System Not Active**

**Evidence:**
```json
"ragConfiguration": {
  "enabled": true,
  "actuallyUsed": false,  // ❌ NOT USING RAG
  "hadFallback": false,
  "topK": 10,
  "minSimilarity": 0.5,
  "stats": null  // ❌ NO STATS
}
```

### ❌ **Zero Document References**

**Pattern Found:**
- All 7 responses: **0 references**
- Expected: At least 1 reference per response
- Format missing: `[Referencia: DOCUMENT_NAME, Versión X]`

### ❌ **Generic vs Company-Specific Knowledge**

| Question Type | Generic Answer | Company-Specific Expected |
|---|---|---|
| PCO plazo | ✅ (generic) | GOP procedures |
| Responsable roles | ✅ (generic) | Exact GOP roles (AO, GP, GE) |
| Panel financiero | ✅ (generic) | PROCESO PANEL FINANCIERO steps |
| Vecino reclamo | ✅ (generic) | GOP-P-EV-4 + anexos/planillas |
| Control calidad | ✅ (generic) | PLAN DE CALIDAD procedures |

---

## 📈 Comparison with Manual Evaluation

### Questions Rated "Inaceptable" in Manual Eval

| ID | Manual Rating | API Test Result | Match? |
|---|---|---|---|
| 1 | Inaceptable (1/5) | No refs, generic | ✅ YES |
| 24 | Inaceptable (1/5) | No refs, generic | ✅ YES |
| 26 | Inaceptable (1/5) | No refs, generic | ✅ YES |
| 27 | Inaceptable (1/5) | No refs, generic | ✅ YES |

### Questions Rated "Sobresaliente" in Manual Eval

| ID | Manual Rating | API Test Result | Match? |
|---|---|---|---|
| 30 | Sobresaliente (4/5) | Good content, no refs | ⚠️ PARTIAL |

**Observation:** Even "good" answers lack document references, reducing trust and verifiability.

---

## 🔍 Root Cause Hypothesis

### Why RAG Shows "actuallyUsed: false"

**Possible Causes:**

1. **No Chunks Available**
   - Agent has no documents chunked in BigQuery
   - `document_embeddings` table empty for this agent's sources
   - **Check:** Query `flow_data.document_embeddings` for source_ids linked to agent

2. **Agent-Source Link Broken**
   - Agent's `activeContextSourceIds` is empty
   - Sources not assigned to agent (`assignedToAgents` missing agent ID)
   - **Check:** Firestore `conversations` doc and `context_sources` docs

3. **RAG Skip Condition**
   - Code may skip RAG for greetings or simple queries
   - All tested questions may be classified as "simple"
   - **Check:** `isSimpleGreeting()` function logic

4. **Search Returns No Results**
   - Similarity scores all below minSimilarity (0.5)
   - Query embeddings not matching document embeddings
   - **Check:** Lower minSimilarity to 0.3 and retry

5. **Region/Dataset Mismatch**
   - Query hitting wrong BigQuery dataset
   - us-east4 vs US region mismatch
   - **Check:** Verify bigquery-router.ts configuration

---

## 🛠️ Recommended Fixes (Priority Order)

### 1. **URGENT: Verify Agent Has Active Sources**

```bash
# Check Firestore conversation document
- activeContextSourceIds: should have [source IDs]
- Check conversation: vStojK73ZKbjNsEnqANJ
```

### 2. **URGENT: Verify Sources Have Chunks**

```sql
-- Check if sources have embeddings
SELECT 
  s.id as source_id,
  s.name as source_name,
  COUNT(e.chunk_id) as chunk_count
FROM `salfagpt.context_sources` s  -- Firestore export
LEFT JOIN `salfagpt.flow_data.document_embeddings` e
  ON s.id = e.source_id
WHERE s.assignedToAgents CONTAINS 'vStojK73ZKbjNsEnqANJ'
GROUP BY s.id, s.name
```

### 3. **HIGH: Add Debug Logging to RAG**

```typescript
// In messages.ts or messages-stream.ts
console.log('🔍 RAG Debug:', {
  agentId: effectiveAgentId,
  activeSourceIds,
  ragEnabled: useAgentSearch,
  isAlly: isAllyConversation,
  query: message.substring(0, 100)
});

// Before calling searchChunksEast4Direct
console.log('🔎 Calling RAG with:', { topK, minSimilarity });

// After getting results
console.log('📊 RAG Results:', {
  resultCount: ragResults.length,
  topScore: ragResults[0]?.similarity,
  worstScore: ragResults[ragResults.length-1]?.similarity
});
```

### 4. **MEDIUM: Lower Similarity Threshold**

```typescript
// Try more permissive matching
const ragMinSimilarity = body.ragMinSimilarity || 0.3;  // Was 0.5
```

### 5. **MEDIUM: Check Agent Prompt**

- Agent prompt may be instructing "don't use documents"
- Or prompt may be overriding reference format
- **Action:** Review agent's `agentPrompt` field

---

## 🎬 Next Steps

1. Run diagnostics to find why RAG is off
2. Fix RAG integration for M3-v2
3. Re-run all 7 test questions
4. Verify references appear in responses
5. Compare new results with evaluation expectations
6. Test additional questions from full evaluation list

---

## 📞 Questions for User

1. Should M3-v2 agent have active context sources?
2. What documents should be assigned to this agent?
3. Have documents been uploaded and chunked for M3-v2?
4. Is there a working agent we can compare against?

---

**Report Generated:** 2025-11-25 11:50 AM  
**Files:** M3V2_TEST_RESULTS_2025-11-25.md, test-m3v2-comprehensive.sh  
**Status:** ❌ Investigation Required - RAG Not Functioning



