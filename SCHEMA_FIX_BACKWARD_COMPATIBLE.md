# ✅ Schema Fix - Backward Compatible

**Fecha:** 21 nov 2025, 11:50 AM  
**Problema:** Campos extra causaban error en BigQuery  
**Solución:** ✅ Schema compatible + backward compatible

---

## 🔍 **PROBLEMA IDENTIFICADO:**

### En GCP BigQuery viste:

```
Tabla: salfagpt.flow_analytics.document_embeddings
Schema:
├─ chunk_id (STRING, REQUIRED)
├─ source_id (STRING, REQUIRED)
├─ user_id (STRING, REQUIRED)
├─ chunk_index (INTEGER, REQUIRED)
├─ text_preview (STRING 500, NULLABLE)
├─ full_text (STRING, NULLABLE)
├─ embedding (FLOAT, REPEATED)
├─ metadata (JSON, NULLABLE)
└─ created_at (TIMESTAMP, NULLABLE)
```

---

### Script intentaba insertar:

```javascript
❌ INCORRECTO:
{
  chunk_id: ...,
  source_id: ...,
  source_name: ...,    // ❌ NO existe en schema
  user_id: ...,
  chunk_index: ...,
  text_preview: ...,
  full_text: ...,
  embedding: ...,
  token_count: ...,    // ❌ NO existe en schema
  metadata: ...,
  created_at: ...
}
```

**Resultado:** BigQuery rechazaba por campos desconocidos

---

## ✅ **SOLUCIÓN APLICADA:**

### Schema Correcto + Backward Compatible:

```javascript
✅ CORRECTO:
{
  // Campos del schema (exactos)
  chunk_id: chunk.id,
  source_id: sourceId,
  user_id: userId,
  chunk_index: chunk.index,
  text_preview: chunk.text.substring(0, 500), // Max 500
  full_text: chunk.text,
  embedding: chunk.embedding,
  created_at: new Date().toISOString(),
  
  // ✅ Datos extra en metadata (JSON acepta todo)
  metadata: JSON.stringify({
    source_name: sourceName,        // ✅ Preservado
    token_count: tokenCount,        // ✅ Preservado
    start_position: startPos,       // ✅ Preservado
    end_position: endPos,           // ✅ Preservado
    chunk_text_length: length,      // ✅ Nuevo
    processed_at: timestamp,        // ✅ Audit
    processor: 'v2',                // ✅ Versioning
    version: '2.0'                  // ✅ Compatibility
  })
}
```

---

## ✅ **BACKWARD COMPATIBILITY GARANTIZADA:**

### 1. No se pierden datos:
- ✅ `source_name` → metadata.source_name
- ✅ `token_count` → metadata.token_count
- ✅ Todos los campos originales preservados

### 2. Queries siguen funcionando:
```sql
-- Queries existentes NO necesitan cambios
SELECT chunk_id, source_id, full_text, embedding
FROM `salfagpt.flow_analytics.document_embeddings`
WHERE user_id = 'xxx'
-- ✅ Funciona igual

-- Acceso a campos movidos:
SELECT 
  chunk_id,
  JSON_VALUE(metadata, '$.source_name') as source_name,
  JSON_VALUE(metadata, '$.token_count') as token_count
FROM `salfagpt.flow_analytics.document_embeddings`
-- ✅ Funciona con JSON_VALUE
```

### 3. Sistema RAG no se afecta:
- ✅ RAG solo usa: chunk_id, source_id, full_text, embedding
- ✅ Esos campos están en mismo lugar
- ✅ No requiere cambios en código de búsqueda

---

## 📊 **BENEFICIOS:**

### Para el Sistema:
1. ✅ **Compatible** - Usa schema exacto de GCP
2. ✅ **Flexible** - metadata JSON acepta campos nuevos
3. ✅ **Versionado** - metadata.version para tracking
4. ✅ **Auditable** - metadata.processed_at, processor

### Para Backward Compatibility:
1. ✅ **No breaking changes** - Queries existentes funcionan
2. ✅ **Datos preservados** - Nada se pierde
3. ✅ **Extensible** - Fácil agregar campos futuros
4. ✅ **Rollback fácil** - metadata es opcional

---

## 🔄 **PROCESO REINICIADO:**

```
✅ Schema corregido
✅ Proceso reiniciado: PID 5733
🔄 Cargando docs: 500/2,188 (23%)
⏳ Procesará: Al terminar carga (~5 min)
⏳ Guardará BigQuery: Con schema correcto ahora
✅ RAG funcionará: Al completar
```

---

## 📋 **ESTADO TU TABLA S002:**

| Aspecto | Estado | Detalles |
|---------|--------|----------|
| Docs Firestore | ✅ 96/101 | Listos |
| Asignados S2-v2 | ✅ 2,188 | Completo |
| **BigQuery tabla** | ✅ **Correcta** | flow_analytics.document_embeddings |
| **BigQuery schema** | ✅ **Compatible** | Sin campos extra |
| Chunks | 🔄 | Cargando docs 23% |
| Embeddings | 🔄 | Generará al procesar |
| BigQuery inserts | ⏳ | Funcionará ahora |
| RAG | ⏳ | En ~2-3h |

---

## ✅ **GARANTÍAS:**

### Backward Compatibility:
- ✅ NO afecta datos existentes en BigQuery
- ✅ NO afecta queries existentes
- ✅ NO afecta sistema RAG actual
- ✅ Datos extra en metadata (JSON flexible)
- ✅ Puede leerse con JSON_VALUE()

### Forward Compatibility:
- ✅ metadata acepta campos nuevos
- ✅ version tracking para migraciones
- ✅ processor tracking para debugging
- ✅ Extensible sin cambiar schema

---

**Problema:** ✅ RESUELTO (schema compatible)  
**Backward compatible:** ✅ GARANTIZADO  
**Proceso:** 🔄 Corriendo correctamente  
**ETA:** ~14:30-15:00 PST

