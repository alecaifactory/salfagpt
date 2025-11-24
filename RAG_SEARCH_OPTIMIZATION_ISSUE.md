# 🚨 RAG Search Optimization Issue - Critical

**Fecha:** 24 noviembre 2025  
**Problema:** Búsqueda RAG muy lenta (60+ segundos)  
**Causa:** Busca en TODOS los chunks del usuario, no solo del agente  
**Impacto:** Experiencia de usuario pobre

---

## 🔍 **EL PROBLEMA:**

### **Búsqueda Actual (LENTA):**

```sql
-- ❌ INCORRECTO: Busca en TODOS los chunks del usuario
SELECT ...
FROM `salfagpt.flow_analytics.document_embeddings`
WHERE user_id = 'usr_uhwqffaqag1wrryd82tw'  -- 60,992 chunks!
ORDER BY similarity DESC
LIMIT 5

-- Tiempo: 60-75 segundos ❌
```

**Chunks buscados:**
- Total usuario: **60,992 chunks**
- De todos los agentes (S1, S2, M1, M3)
- Incluso chunks no asignados a ningún agente

---

### **Búsqueda Correcta (RÁPIDA):**

```sql
-- ✅ CORRECTO: Busca solo en sources del agente
SELECT ...
FROM `salfagpt.flow_analytics.document_embeddings`
WHERE user_id = 'usr_uhwqffaqag1wrryd82tw'
  AND source_id IN UNNEST(@s2v2SourceIds)  -- Solo 467 sources!
ORDER BY similarity DESC
LIMIT 5

-- Tiempo esperado: 2-5 segundos ✅
```

**Chunks buscados:**
- S2-v2 sources: **467 sources**
- S2-v2 chunks: **~13,496 chunks** (vs 60,992)
- **4.5x menos datos** = **~12x más rápido**

---

## 📊 **IMPACTO POR AGENTE:**

### **Datos Actuales:**

| Agente | Sources | Chunks Estimados | Búsqueda Actual | Búsqueda Correcta | Mejora |
|--------|---------|------------------|-----------------|-------------------|--------|
| **S2-v2** | 467 | ~13,500 | 60s (60K chunks) | **~3s** (13.5K) | **20x** ✨ |
| **S1-v2** | 75 | ~1,200 | 60s (60K chunks) | **<1s** (1.2K) | **60x** ✨ |
| **M1-v2** | 623 | ~10,000 | 60s (60K chunks) | **~2s** (10K) | **30x** ✨ |
| **M3-v2** | 52 | ~12,000 | 60s (60K chunks) | **~3s** (12K) | **20x** ✨ |

---

## 🔧 **DÓNDE ARREGLAR:**

### **Archivos que necesitan corrección:**

1. **`src/lib/bigquery-agent-search.ts`** ✅ (ya tiene lógica correcta)
2. **`src/pages/api/conversations/[id]/messages-stream.ts`** (debe usar agent search)
3. **Scripts de test:** Deben filtrar por source IDs del agente

---

### **Código Correcto (Ya existe en bigquery-agent-search.ts):**

```typescript
// ✅ CORRECTO - Ya implementado
export async function searchByAgent(
  userId: string,
  agentId: string,
  query: string
) {
  // 1. Get agent's source IDs (cached)
  const { sourceIds } = await getCachedAgentSources(agentId, userId);
  
  // 2. Search ONLY in those sources
  const sqlQuery = `
    SELECT ...
    WHERE user_id = @userId
      AND source_id IN UNNEST(@sourceIds)  -- ✅ Filtro por agente
    ORDER BY similarity DESC
    LIMIT 8
  `;
  
  // Resultado: Busca solo en chunks del agente
}
```

---

## ✅ **SOLUCIÓN:**

### **Para Scripts de Test:**

El script que creé (`test-s2v2-rag-optimized.mjs`) YA usa este enfoque:

```javascript
// 1. Obtener sources del agente
const agentDoc = await db.collection('conversations').doc(S2V2_ID).get();
const sourceIds = agentDoc.data()?.activeContextSourceIds || [];

// 2. Buscar SOLO en esos sources
WHERE user_id = @userId 
  AND source_id IN UNNEST(@sourceIds)  // ✅ Filtra a 467 sources
```

**Mejora esperada:** 60s → 3-5s (**12-20x más rápido**)

---

### **Para la UI/API:**

El sistema debe usar `searchByAgent()` de `bigquery-agent-search.ts`:

```typescript
// En messages-stream.ts:

// ❌ NO USAR:
const results = await searchAllUserChunks(userId, query);

// ✅ USAR:
const results = await searchByAgent(userId, agentId, query);
```

---

## 📈 **BENEFICIOS:**

### **Performance:**
- ✅ 12-20x más rápido
- ✅ Menos carga en BigQuery
- ✅ Costos menores
- ✅ Mejor experiencia usuario

### **Precisión:**
- ✅ Solo documentos relevantes al agente
- ✅ No contamina con docs de otros agentes
- ✅ Referencias más específicas
- ✅ Respuestas más enfocadas

### **Escalabilidad:**
- ✅ Tiempo constante por agente (no crece con total chunks)
- ✅ Soporta 100+ agentes sin degradación
- ✅ Queries más eficientes

---

## 🎯 **VERIFICACIÓN:**

### **El script optimizado debería mostrar:**

```
Test 1: Grúa Sany
🧮 Embedding... (1s)
🔍 Searching BigQuery... 
✅ Found 5 results (3-5s) ⚡  // <-- NO 60s!

Test 2: Frenos TCBY-56
🧮 Embedding... (1s)
🔍 Searching BigQuery...
✅ Found 5 results (3-5s) ⚡  // <-- Rápido!
```

**Si sigue tomando 60s → el filtro no está funcionando**

---

## 📋 **ACTION ITEMS:**

### **Inmediato:**
1. ✅ Script test optimizado creado (`test-s2v2-rag-optimized.mjs`)
2. ⏳ Ejecutar y verificar tiempo (debería ser <5s)
3. ⏳ Aplicar mismo filtro a otros agentes

### **Para Producción:**
1. Verificar que `messages-stream.ts` use `searchByAgent()`
2. Verificar que frontend pase `agentId` en cada búsqueda
3. Verificar cache de agent sources funcione

---

## 🔑 **CÓDIGO CLAVE:**

### **Filtro Correcto:**

```sql
-- ✅ RÁPIDO: Solo chunks del agente
WHERE user_id = @userId
  AND source_id IN UNNEST(@agentSourceIds)
  
-- Chunks buscados: ~13K (S2-v2) vs 60K (total)
-- Tiempo: ~3s vs 60s
-- Mejora: 20x más rápido
```

### **Obtener Source IDs del Agente:**

```javascript
// Opción 1: Desde activeContextSourceIds (más rápido)
const agentDoc = await db.collection('conversations').doc(agentId).get();
const sourceIds = agentDoc.data()?.activeContextSourceIds || [];

// Opción 2: Desde agent_sources (más preciso)
const snapshot = await db.collection('agent_sources')
  .where('agentId', '==', agentId)
  .get();
const sourceIds = snapshot.docs.map(d => d.data().sourceId);
```

---

## ✅ **ESTA ES LA OPTIMIZACIÓN CRÍTICA**

**Sin filtro por agente:**
- Busca 60K chunks
- Toma 60 segundos
- Mala experiencia

**Con filtro por agente:**
- Busca 13K chunks (S2-v2)
- Toma 3-5 segundos
- ✅ Excelente experiencia

**Esta optimización se aplica a TODOS los agentes.**

---

**Próximo paso:** Ejecutar `test-s2v2-rag-optimized.mjs` y verificar tiempo <5s

