# 🚨 BigQuery Region Mismatch - Critical Issue

**Fecha:** 24 noviembre 2025  
**Problema:** Dataset en región incorrecta  
**Impacto:** Latencia adicional en búsquedas RAG

---

## 🔍 **PROBLEMA IDENTIFICADO:**

### **Proyecto y Servicio:**
```
Proyecto: salfagpt
Cloud Run: us-east4 ✅ (donde corre la app)
```

### **Datasets BigQuery:**
```
flow_analytics: us-central1 ❌ (INCORRECTO)
flow_data: us-east4 ✅ (CORRECTO)
flow_rag_optimized: us-central1 ❌ (INCORRECTO)
```

### **Tabla que usamos:**
```
flow_analytics.document_embeddings
  Location: us-central1 ❌
  Chunks: 60,992
  Sources: 2,366
```

---

## 🚨 **IMPACTO:**

### **Latencia Adicional:**

**Búsqueda actual:**
```
1. Cloud Run (us-east4) → BigQuery (us-central1): +50-100ms
2. BigQuery procesa: 592-642ms
3. BigQuery (us-central1) → Cloud Run (us-east4): +50-100ms
Total: ~700-850ms vs ~600ms ideal
```

**Transferencia de datos cross-region:**
- ✅ Funciona pero más lento
- ⚠️ Latencia adicional 100-200ms
- ⚠️ Costos de egress

---

## ✅ **SOLUCIONES:**

### **Opción 1: Mover dataset a us-east4 (RECOMENDADO)**

**Beneficios:**
- ✅ Misma región que Cloud Run
- ✅ Latencia mínima
- ✅ Sin costos egress
- ✅ Mejor performance

**Pasos:**
```bash
# 1. Crear dataset en us-east4
bq mk --dataset --location=us-east4 salfagpt:flow_analytics_east4

# 2. Copiar tabla
bq cp \
  salfagpt:flow_analytics.document_embeddings \
  salfagpt:flow_analytics_east4.document_embeddings

# 3. Crear vector index en nueva tabla
CREATE VECTOR INDEX embedding_idx
ON `salfagpt.flow_analytics_east4.document_embeddings`(embedding)
OPTIONS(distance_type = 'COSINE', index_type = 'IVF')

# 4. Actualizar código para usar nueva tabla
# src/lib/bigquery-agent-search.ts:
const DATASET_ID = 'flow_analytics_east4';

# 5. Verificar performance
# Búsqueda debería ser <500ms
```

**Tiempo:** 1-2 horas (copiar + crear índice)  
**Mejora:** 700ms → 400ms (**1.7x más rápido**)

---

### **Opción 2: Usar flow_data (ya en us-east4)**

**Beneficios:**
- ✅ Ya está en us-east4
- ✅ Sin migración necesaria
- ✅ Inmediato

**Pasos:**
```bash
# 1. Crear tabla en flow_data
CREATE TABLE `salfagpt.flow_data.document_embeddings` AS
SELECT * FROM `salfagpt.flow_analytics.document_embeddings`

# 2. Crear vector index
CREATE VECTOR INDEX embedding_idx
ON `salfagpt.flow_data.document_embeddings`(embedding)
OPTIONS(distance_type = 'COSINE', index_type = 'IVF')

# 3. Actualizar código
const DATASET_ID = 'flow_data';
```

**Tiempo:** 30 minutos  
**Mejora:** Inmediata

---

### **Opción 3: Dejar como está + crear índice**

**Beneficios:**
- ✅ Sin cambios en estructura
- ✅ Sin migración

**Pasos:**
```bash
# Solo crear índice en tabla actual
CREATE VECTOR INDEX embedding_idx
ON `salfagpt.flow_analytics.document_embeddings`(embedding)
OPTIONS(
  distance_type = 'COSINE',
  index_type = 'IVF',
  ivf_options = '{"num_lists": 1000}'
)
```

**Tiempo:** 20-30 minutos (build index)  
**Mejora:** 700ms → 500ms (índice acelera pero cross-region persiste)

---

## 📊 **COMPARACIÓN DE OPCIONES:**

| Opción | Tiempo Setup | Latencia Final | Complejidad | Recomendación |
|--------|--------------|----------------|-------------|---------------|
| **1. Mover a us-east4** | 1-2h | **~400ms** ⚡⚡ | Media | ✅ MEJOR |
| **2. Usar flow_data** | 30min | **~400ms** ⚡⚡ | Baja | ✅ RÁPIDO |
| **3. Índice actual** | 20min | ~500ms ⚡ | Mínima | ⚠️ OK |

---

## 🎯 **RECOMENDACIÓN:**

### **Opción 2 (flow_data) - Más Pragmática:**

**Por qué:**
- ✅ Dataset ya existe en us-east4
- ✅ Solo copiar datos (30 min)
- ✅ Sin romper nada existente
- ✅ Performance óptimo
- ✅ Reversible fácilmente

**Ejecutar:**
```bash
# 1. Copiar chunks a flow_data
npx tsx scripts/migrate-to-flow-data.mjs

# 2. Crear índice vectorial
npx tsx scripts/create-index-flow-data.mjs

# 3. Actualizar configuración
# Cambiar DATASET_ID a 'flow_data'

# 4. Probar
npx tsx scripts/test-s2v2-rag-optimized.mjs
# Debería ser <500ms
```

---

## 📋 **ESTADO ACTUAL vs IDEAL:**

### **Actual (us-central1, sin índice):**
```
Cloud Run (us-east4) ←100ms→ BigQuery (us-central1)
                              ↓
                         Scan 20K chunks (600ms)
                              ↓
Cloud Run (us-east4) ←100ms← Results
Total: ~800ms
```

### **Ideal (us-east4, con índice):**
```
Cloud Run (us-east4) ←5ms→ BigQuery (us-east4)
                            ↓
                       IVF index lookup (200ms)
                            ↓
Cloud Run (us-east4) ←5ms← Results
Total: ~210ms ⚡⚡⚡
```

**Mejora: 800ms → 210ms (3.8x más rápido)**

---

## ✅ **LO QUE HAY QUE HACER:**

### **Paso 1: Verificar región correcta**
✅ **Ya hecho** - Confirmado us-central1

### **Paso 2: Decidir estrategia**
**Recomiendo:** Opción 2 (usar flow_data en us-east4)

### **Paso 3: Migrar datos**
```bash
# Copiar 60K chunks a flow_data
# Toma ~30 minutos
```

### **Paso 4: Crear índice vectorial**
```sql
CREATE VECTOR INDEX ON flow_data.document_embeddings
-- Toma ~20 minutos
```

### **Paso 5: Actualizar código**
```javascript
const DATASET_ID = 'flow_data'; // Cambiar de 'flow_analytics'
```

### **Paso 6: Verificar**
```bash
# Búsqueda debería ser <500ms
npx tsx scripts/test-s2v2-rag-optimized.mjs
```

---

## 🎯 **RESPUESTA A TU PREGUNTA:**

> "¿Por qué dataset en otra región? ¿Es el correcto? ¿Debería estar en us-east4? ¿Necesita índice?"

**Respuestas:**
1. ❌ **Dataset en us-central1** (debería ser us-east4)
2. ✅ **Es el correcto** (tiene los 60K chunks de últimos días)
3. ✅ **SÍ debería estar en us-east4** (misma región que Cloud Run)
4. ✅ **SÍ necesita índice vectorial** (para <500ms)

**Acción:** Migrar a us-east4 + crear índice = **3-4x más rápido**

---

**¿Quieres que ejecute la migración a flow_data (us-east4)?** 🚀




