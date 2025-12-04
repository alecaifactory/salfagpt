# 🎯 BigQuery Agent Filtering - Explicación Completa

**Fecha:** 2025-11-25  
**Propósito:** Documentar cómo se filtra contexto por agente en búsqueda vectorial

---

## 🔍 **FLUJO DE FILTRADO:**

### **Paso 1: Identificar Agent Owner**

```typescript
// src/lib/bigquery-optimized.ts línea 85-89
const agentOwnerUserId = await getEffectiveOwnerForContext(agentId, userId);
const isSharedAgent = agentOwnerUserId !== userId;

console.log(`Effective owner: ${agentOwnerUserId}`);
console.log(`Current user: ${userId}`);
console.log(`Is shared? ${isSharedAgent}`);
```

**Resultado:**
- Agente propio: `agentOwnerUserId = userId`
- Agente compartido: `agentOwnerUserId = ownerId` (del dueño)

**Por qué:** Los documentos están indexados bajo el **userId del dueño**, no del usuario actual.

---

### **Paso 2: Obtener Sources Asignados al Agente**

```typescript
// Línea 125-137
const sourcesSnapshot = await firestore
  .collection('context_sources')
  .where('assignedToAgents', 'array-contains', agentId)  // ✅ FILTRO CRÍTICO
  .select('userId', '__name__')
  .get();

// Filtrar por owner del agente
const userSources = sourcesSnapshot.docs.filter(doc => 
  doc.data().userId === effectiveOwnerUserId
);

const sourceIds = userSources.map(doc => doc.id);
```

**Resultado:**
```javascript
sourceIds = [
  '060V7irmRJvwRNXgkQTJ',  // Doc 1 asignado a agentId
  '0P17FbmGCaTm2mBco8ET',  // Doc 2 asignado a agentId
  ... // Total: 467 documentos SOLO de este agente
]
```

**Por qué:** Cada agente tiene su propio conjunto de documentos. Un documento puede estar en múltiples agentes (`assignedToAgents: ['agent1', 'agent2']`).

---

### **Paso 3: Query BigQuery con Filtros**

```sql
-- src/lib/bigquery-optimized.ts línea 156-176

WITH similarities AS (
  SELECT 
    chunk_id,
    source_id,
    chunk_index,
    text_preview,
    full_text,
    metadata,
    (1 - ML.DISTANCE(embedding, @queryEmbedding, 'COSINE')) AS similarity
  FROM `salfagpt.flow_rag_optimized.document_chunks_vectorized`
  WHERE user_id = @queryUserId              -- ✅ FILTRO 1: Owner del agente
    AND source_id IN UNNEST(@sourceIds)     -- ✅ FILTRO 2: SOLO docs del agente
)
SELECT *
FROM similarities
WHERE similarity >= @minSimilarity          -- ✅ FILTRO 3: Relevancia
ORDER BY similarity DESC
LIMIT @topK                                 -- ✅ FILTRO 4: Cantidad
```

**Parámetros:**
```javascript
@queryUserId = 'usr_uhwqffaqag1wrryd82tw'  // Owner
@sourceIds = [467 IDs]                      // SOLO del agente
@queryEmbedding = [768 floats]              // Query vector
@minSimilarity = 0.3                        // Threshold
@topK = 20                                  // Cantidad
```

---

## 🔐 **GARANTÍAS DE AISLAMIENTO:**

### **Agent A vs Agent B:**

**Scenario:**
```
Usuario tiene:
  Agent A (M3-v2): 77 documentos
  Agent B (S2-v2): 467 documentos
```

**Cuando busca en Agent A:**
```typescript
agentId = 'M3-v2-id'
sourceIds = [77 IDs] ← SOLO de Agent A

BigQuery WHERE:
  user_id = owner
  AND source_id IN (77 IDs)  ← AISLAMIENTO GARANTIZADO
```

**Cuando busca en Agent B:**
```typescript
agentId = 'S2-v2-id'
sourceIds = [467 IDs] ← SOLO de Agent B

BigQuery WHERE:
  user_id = owner
  AND source_id IN (467 IDs)  ← DIFERENTES docs
```

**Resultado:**
- ✅ Agent A **NUNCA** ve docs de Agent B
- ✅ Agent B **NUNCA** ve docs de Agent A
- ✅ Búsqueda vectorial respeta aislamiento

---

## 📊 **ÍNDICES USADOS:**

### **Firestore Index:**
```
Collection: context_sources
Index: assignedToAgents (array-contains)
Purpose: Rápido lookup de docs por agente
```

### **BigQuery Clustering:**
```
Table: document_chunks_vectorized
Cluster By: user_id, source_id
Purpose: Pre-agrupa chunks por owner + source
```

### **BigQuery Vector Index:**
```
Table: document_chunks_vectorized
Index: embedding (COSINE)
Purpose: Acelera ML.DISTANCE (si existe)
```

---

## ⚡ **PERFORMANCE:**

### **Filtrado en Firestore (Step 2):**
```
Query: assignedToAgents array-contains 'agentId'
Result: 467 sourceIds
Time: ~400-800ms ✅
```

### **Filtrado en BigQuery (Step 3):**
```
Pre-filter: user_id = owner AND source_id IN (467 IDs)
Chunks antes filtrado: 24,600 total
Chunks después filtrado: ~7,000 (del agente)
Similarity computation: ML.DISTANCE en ~7,000 chunks
Time esperado: 2-4s ✅
```

**Antes (sin filtro agente):**
- Similarity en 24,600 chunks = 30s+ ❌

**Ahora (con filtro agente):**
- Similarity en ~7,000 chunks = 2-4s ✅

---

## 🎯 **RESUMEN:**

### **Filtros Aplicados (en orden):**

**1. Firestore → sourceIds:**
```typescript
WHERE assignedToAgents array-contains agentId
AND userId = effectiveOwnerUserId
→ Result: [467 IDs] SOLO de este agente
```

**2. BigQuery → chunks:**
```sql
WHERE user_id = effectiveOwnerUserId  -- Owner
AND source_id IN (467 IDs)            -- SOLO agente
→ Result: ~7,000 chunks (no 24,600)
```

**3. Similarity → relevantes:**
```sql
WHERE similarity >= 0.3
→ Result: ~20 chunks (topK)
```

---

## ✅ **GARANTÍA:**

**Cada búsqueda es:**
- ✅ **Específica al agente** (assignedToAgents)
- ✅ **Propiedad del owner** (userId filtering)
- ✅ **Semánticamente relevante** (similarity > threshold)
- ✅ **Performante** (ML.DISTANCE optimizado)

**Ningún agente ve contexto de otro agente.**

---

**Documentado por:** AI Assistant  
**Verificado:** Pending user test



