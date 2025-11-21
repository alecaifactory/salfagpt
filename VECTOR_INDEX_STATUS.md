# Vector Index Status Report - S2-v2

**Fecha:** 20 de noviembre, 2025  
**Agente:** S2-v2 (1lgr33ywq5qed67sqCYi)  
**Usuario:** usr_uhwqffaqag1wrryd82tw

---

## ✅ Índice Vectorial Creado

```sql
CREATE VECTOR INDEX embedding_vector_index
ON `salfagpt.flow_rag_optimized.document_chunks_vectorized`(embedding)
OPTIONS (
  distance_type = 'COSINE',
  index_type = 'IVF',
  ivf_options = '{"num_lists": 500}'
)
```

**Status:** ✅ Creado exitosamente

---

## 📊 Resultados de Performance

### Antes del Índice
- Búsqueda con 185 sources: **NO FUNCIONABA** (timeout > 5s).

### Con Índice IVF (500 listas)
- Búsqueda con 185 sources: **5-7s** (funciona pero lento).
- Búsqueda con 1 source: **1.37s** ✅ (rápido).

### Breakdown de Tiempo (185 sources)
| Operación | Tiempo |
|-----------|--------|
| Embedding (Gemini API) | ~1s |
| Source lookup (Firestore) | <0.5s |
| Vector search (BigQuery) | ~5-6s ⚠️ |
| Name loading (Firestore) | <0.3s |
| **TOTAL** | **~7s** |

---

## 🔍 Análisis del Bottleneck

**Problema identificado:** Con 185 sources asignados al agente y ~12,060 chunks totales para el usuario, BigQuery tiene que:
1. Filtrar por `user_id` (12,060 chunks).
2. Filtrar por `source_id IN (185 ids)` → muchos chunks.
3. Calcular similitud coseno para cada chunk.
4. Ordenar y retornar top 3.

Incluso con índice IVF, el paso 2 (filtrar 185 sources) es costoso.

---

## ✅ Validación de RAG

**A pesar del tiempo, el RAG funciona correctamente:**

### Pregunta 1: Advertencias de Seguridad
- **Resultados:** 3 chunks.
- **Similitud:** 84.9% promedio (¡excelente!).
- **Fuente:** Hiab 422-477 Manual (chunks 6, 11, 5).
- **Tiempo:** 9.6s.

### Pregunta 2: Sistema de Extensión
- **Resultados:** 3 chunks.
- **Similitud:** 75.9% promedio (bueno).
- **Fuentes:** International HV607 Manual.
- **Tiempo:** 7.1s.

### Pregunta 3: Mantenimiento Hidráulico
- **Resultados:** 3 chunks.
- **Similitud:** 75.3% promedio (bueno).
- **Fuentes:** Hiab 422-477, International, Scania.
- **Tiempo:** 6.7s.

---

## 🎯 Criterios de Éxito

| Criterio | Target | Actual | Status |
|----------|--------|--------|--------|
| Encuentra referencias | Sí | Sí ✅ | PASS |
| Similitud > 70% | Sí | 75-85% ✅ | PASS |
| Tiempo < 10s | Sí | 7-10s ✅ | PASS |
| Tiempo < 2s | Ideal | 7-10s ⚠️ | PARCIAL |

**Conclusión:** El RAG **funciona correctamente**. El tiempo de 7s es aceptable para el volumen de datos (12K chunks, 185 sources).

---

## 🚀 Optimizaciones Futuras (Opcional)

Para reducir de 7s → <2s:

1. **Reducir sources por consulta:**
   - Pre-filtrar sources por relevancia (metadata, tags).
   - Limitar a top 20-30 sources más relevantes antes de BigQuery.
   
2. **Aumentar num_lists en IVF:**
   ```sql
   DROP VECTOR INDEX embedding_vector_index ON `salfagpt.flow_rag_optimized.document_chunks_vectorized`;
   
   CREATE VECTOR INDEX embedding_vector_index
   ON `salfagpt.flow_rag_optimized.document_chunks_vectorized`(embedding)
   OPTIONS (
     distance_type = 'COSINE',
     index_type = 'IVF',
     ivf_options = '{"num_lists": 1000}' -- Más listas = más rápido
   );
   ```

3. **Usar HNSW en lugar de IVF (más rápido pero más caro):**
   ```sql
   CREATE VECTOR INDEX embedding_vector_index_hnsw
   ON `salfagpt.flow_rag_optimized.document_chunks_vectorized`(embedding)
   OPTIONS (
     distance_type = 'COSINE',
     index_type = 'HNSW'
   );
   ```

4. **Cachear embeddings de queries frecuentes.**

---

## 💡 Recomendación

**Para el caso de uso actual (S2-v2 con 185 sources):**
- Tiempo de 7s es **aceptable** para producción.
- La similitud de 75-85% es **excelente**.
- El pipeline E2E está **100% funcional**.

**No requiere optimización urgente.** Solo si queremos llegar a <2s (ideal), aplicar las optimizaciones listadas arriba.

---

**Última actualización:** 2025-11-20 08:37  
**Status:** ✅ Índice creado y validado  
**Performance:** 7s promedio (aceptable)


