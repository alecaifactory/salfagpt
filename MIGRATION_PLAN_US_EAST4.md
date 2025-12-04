# 🔄 Plan de Migración BigQuery a us-east4

**Problema:** Dataset en us-central1, Cloud Run en us-east4  
**Solución:** Migrar a us-east4 O usar tabla actual optimizada  
**Decisión:** **USAR TABLA ACTUAL** (más pragmático)

---

## ✅ **DECISIÓN: NO MIGRAR (Más Pragmático)**

### **Por qué:**

**Migración cross-region es compleja:**
- ❌ No se puede copiar directamente entre regiones
- ❌ Requiere export → Cloud Storage → import
- ❌ Toma 2-4 horas
- ❌ Downtime durante migración
- ❌ Riesgo de errores

**Tabla actual funciona bien:**
- ✅ Búsqueda ya es rápida: **<1s con filtro de agente** ⚡
- ✅ 60,992 chunks indexados
- ✅ RAG funcionando correctamente
- ✅ Similarity excelente: 76-78%
- ✅ Cross-region latency aceptable: +100ms

---

## 📊 **PERFORMANCE ACTUAL vs IDEAL:**

| Escenario | Tiempo | Nota |
|-----------|--------|------|
| **Actual (us-central1, filtrado agente)** | **600-800ms** | ✅ ACEPTABLE |
| Con índice vectorial (us-central1) | 400-500ms | Mejora marginal |
| **En us-east4 con índice** | 200-300ms | Ideal |

**Diferencia real:** 600ms vs 200ms = 400ms  
**¿Vale la pena migración compleja por 400ms?** NO

---

## ✅ **SOLUCIÓN RECOMENDADA:**

### **Optimizar tabla actual (us-central1):**

**1. Crear índice vectorial en tabla actual**
```sql
-- Crear en GCP Console (Vector indexes no disponibles vía SDK aún)
-- Ir a: BigQuery > flow_analytics > document_embeddings
-- Crear índice: embedding, COSINE, IVF, 1000 lists
```

**2. Mantener filtro por agente** ✅ (ya implementado)
```sql
WHERE user_id = @userId
  AND source_id IN UNNEST(@agentSourceIds)
```

**3. Usar caché de agent sources** ✅ (ya implementado)

**Resultado:**
- Búsqueda actual: 600-800ms
- Con índice: 400-500ms ⚡
- **Ganancia: 200-400ms con 0 riesgo**

---

## 🎯 **PARA CREAR ÍNDICE VECTORIAL:**

### **Opción 1: GCP Console (Recomendado)**

1. Ir a https://console.cloud.google.com/bigquery?project=salfagpt
2. Navegar: flow_analytics > document_embeddings
3. Click pestaña "Detalles"
4. Scroll abajo a "Índices"
5. Click "Crear índice vectorial"
6. Configurar:
   - Columna: `embedding`
   - Distance metric: `COSINE`
   - Index type: `IVF`
   - Lists: `1000`
7. Click "Crear"

**Tiempo:** 20-30 minutos  
**Mejora:** 600ms → 400ms

---

### **Opción 2: SQL (si Vector Index disponible)**

```sql
CREATE VECTOR INDEX IF NOT EXISTS embedding_cosine_idx
ON `salfagpt.flow_analytics.document_embeddings`(embedding)
OPTIONS(
  distance_type = 'COSINE',
  index_type = 'IVF',
  ivf_options = '{"num_lists": 1000}'
)
```

---

## 📊 **ESTADO ACTUAL DEL SISTEMA:**

### **BigQuery Datasets:**

| Dataset | Location | Tabla Principal | Chunks | Status |
|---------|----------|-----------------|--------|--------|
| flow_analytics | us-central1 | document_embeddings | 60,992 | ✅ **EN USO** |
| flow_data | us-east4 | tim_session_vectors | 0 | Vacío |
| flow_rag_optimized | us-central1 | document_chunks_vectorized | 0 | Vacío |

**Usar:** `flow_analytics.document_embeddings` ✅

---

### **Performance con tabla actual:**

```
Agent: S2-v2
Sources: 467
Chunks buscados: ~20,100 (solo S2-v2)

Test 1: 642ms ⚡
Test 2: 592ms ⚡
Promedio: ~600ms

✅ EXCELENTE (sin necesidad de migración)
```

---

## ✅ **CONCLUSIÓN:**

**NO migrar a us-east4 porque:**
1. ✅ Performance actual es bueno (600ms)
2. ✅ Filtro por agente funciona perfecto
3. ✅ Migración compleja y riesgosa
4. ✅ Ganancia marginal (200-400ms)

**SÍ crear índice vectorial porque:**
1. ✅ Mejora 200-400ms (33-50%)
2. ✅ Sin riesgo (no mueve datos)
3. ✅ Fácil de crear
4. ✅ Beneficia a TODOS los agentes

---

## 🎯 **ACCIÓN RECOMENDADA:**

**Crear índice vectorial en GCP Console:**
- Tabla: `flow_analytics.document_embeddings`
- Región: us-central1 (donde está)
- Columna: embedding
- Type: IVF, COSINE, 1000 lists

**Tiempo:** 20-30 minutos  
**Resultado:** 600ms → 400ms ⚡

---

**¿Crear índice en Console o dejar como está (600ms es aceptable)?**




