# 🚨 ROOT CAUSE FINAL: Chunks Indexados con userId Viejo

**Fecha:** 2025-11-13  
**Status:** ✅ PROBLEMA IDENTIFICADO  
**Severidad:** CRÍTICA - Explica el 50% en todas las referencias

---

## 🔍 Problema Confirmado

### **Descubrimiento:**

```sql
-- Chunks en BigQuery:
SELECT user_id, COUNT(*) 
FROM `salfagpt.flow_analytics.document_embeddings`
GROUP BY user_id;

RESULTADO:
┌─────────────────────────┬─────────┐
│ user_id                 │ count   │
├─────────────────────────┼─────────┤
│ 114671162830729001607   │  9,765  │ ← Google OAuth ID (viejo)
│ test_user_001           │      1  │
└─────────────────────────┴─────────┘
```

**Sistema busca con:**
```sql
WHERE user_id = 'usr_uhwqffaqag1wrryd82tw'  -- Hash-based ID (nuevo)
```

**Resultado:** **0 chunks encontrados** → Fallback 50%

---

## 📊 Migración de User IDs

### **Timeline:**

**Antes (hasta Oct 2025):**
- User ID = Google OAuth numeric ID
- Ejemplo: `114671162830729001607`
- Chunks indexados con este ID

**Después (Nov 2025 - Multi-org):**
- User ID = Hash-based unique ID
- Ejemplo: `usr_uhwqffaqag1wrryd82tw`
- Sistema usa este ID para queries
- **Chunks NO migrados todavía**

---

## ✅ SOLUCIÓN: Migrar Chunks a Nuevos User IDs

### **Opción 1: Actualizar BigQuery (Rápido)**

**Script SQL:**

```sql
-- 1. Find mapping old ID → new ID
SELECT 
  old_id,
  new_id,
  email
FROM (
  SELECT 
    '114671162830729001607' as old_id,
    'usr_uhwqffaqag1wrryd82tw' as new_id,
    'alec@getaifactory.com' as email
);

-- 2. Update all chunks
UPDATE `salfagpt.flow_analytics.document_embeddings`
SET user_id = 'usr_uhwqffaqag1wrryd82tw'
WHERE user_id = '114671162830729001607';

-- Verify:
SELECT user_id, COUNT(*) 
FROM `salfagpt.flow_analytics.document_embeddings`
GROUP BY user_id;

-- Expected result:
-- usr_uhwqffaqag1wrryd82tw: 9,765 chunks ✅
```

**Ejecutar:**
```bash
bq query --use_legacy_sql=false --project_id=salfagpt "
UPDATE \`salfagpt.flow_analytics.document_embeddings\`
SET user_id = 'usr_uhwqffaqag1wrryd82tw'
WHERE user_id = '114671162830729001607'
"
```

**Tiempo:** ~10 segundos  
**Costo:** Mínimo (~$0.01)

---

### **Opción 2: Re-indexar Todo (Lento pero Completo)**

Si hay otros usuarios también afectados:

```bash
# Script que migra todos los user IDs
npx tsx scripts/migrate-chunk-user-ids.ts

# O re-indexar desde cero
npm run reindex:all
```

**Tiempo:** ~30-60 minutos  
**Costo:** API calls para embeddings (~$2-5)

---

## 🧪 Testing Post-Fix

### **Después de migrar user IDs:**

**Query:**
```
"¿Cuáles son los pasos para cambiar el filtro de aire de un motor Cummins?"
```

**Expected:**

```sql
-- BigQuery search:
SELECT ... 
FROM `salfagpt.flow_analytics.document_embeddings`
WHERE user_id = 'usr_uhwqffaqag1wrryd82tw'  ← Encuentra 9,765 chunks ✅
  AND source_id IN (...)
ORDER BY similarity DESC
LIMIT 10;

-- Results:
Chunk #245: 78.3% similarity  ← REAL!
Chunk #156: 72.1% similarity  ← REAL!
Chunk #089: 68.4% similarity  ← Filtered (< 70%)
... etc
```

**Usuario ve:**
```
📚 Referencias utilizadas (2)
  [1] Manual International 7600 - 78.3% 🟢  ← REAL similarity!
  [2] Procedimiento Mantenimiento - 72.1% 🟢  ← REAL similarity!
```

**NO más 50% en todo!**

---

## 📈 Comparación: Antes vs Después de Migración

### **ANTES (User ID mismatch):**

```
Query BigQuery:
  WHERE user_id = 'usr_uhwqffaqag1wrryd82tw'
  
Result: 0 chunks
  ↓
Emergency fallback: Load 10 full PDFs
  ↓
Assign 50% generic similarity
  ↓
User sees: All refs with 50.0%
```

---

### **DESPUÉS (User IDs migrados):**

```
Query BigQuery:
  WHERE user_id = 'usr_uhwqffaqag1wrryd82tw'
  
Result: 9,765 chunks found ✅
  ↓
Calculate REAL cosine similarity with Gemini embeddings
  ↓
Similarities range from 12% to 89%
  ↓
Filter chunks < 70%
  ↓
Return top 10 chunks with similarity 70-89%
  ↓
User sees: Refs with VARIED, REAL percentages
```

---

## 🎯 Por Qué ESTO Causa el 50%

### **El Código es Correcto:**

```typescript
// Código de búsqueda (correcto):
WHERE user_id = @userId  ← usa ID nuevo
AND source_id IN UNNEST(@assignedSourceIds)
```

```typescript
// Chunks en DB (desactualizado):
user_id: '114671162830729001607'  ← ID viejo
```

**Mismatch:**
- Query busca: `usr_uhwqffaqag1wrryd82tw`
- DB tiene: `114671162830729001607`
- No coincide → 0 resultados
- Fallback → 50%

---

## ✅ Acción Requerida - URGENTE

### **Quick Fix (5 minutos):**

**Migrar user ID de los chunks existentes:**

```bash
bq query --use_legacy_sql=false --project_id=salfagpt "
UPDATE \`salfagpt.flow_analytics.document_embeddings\`
SET user_id = 'usr_uhwqffaqag1wrryd82tw'
WHERE user_id = '114671162830729001607'
"
```

**Verificar:**
```bash
bq query --use_legacy_sql=false --project_id=salfagpt "
SELECT user_id, COUNT(*) as chunks
FROM \`salfagpt.flow_analytics.document_embeddings\`
GROUP BY user_id
"

# Expected:
# usr_uhwqffaqag1wrryd82tw: 9,765 ✅
```

**Probar query again:**
```bash
npx tsx scripts/test-real-similarity.ts
```

**Expected:**
```
📚 REFERENCES RETURNED: 5-8
  [1] Manual - 78.3% ← REAL!
  [2] Procedimiento - 72.1% ← REAL!
  ... (NO 50%)
```

---

## 🎓 Lecciones Aprendidas

### **1. User ID Migration Requires Data Migration**

Cuando cambias el esquema de IDs:
- ✅ Actualizar código
- ✅ Actualizar documentos nuevos
- ❌ **OLVIDAMOS:** Migrar datos existentes

**Resultado:** Old data becomes invisible to new code

---

### **2. Multi-Layer Search Needs Consistency**

RAG busca en:
1. BigQuery (primero)
2. Firestore (fallback)

**Ambos deben usar mismo userId** o ambos fallan.

---

### **3. Testing Should Include Data Layer**

Tests funcionaron porque:
- Lógica correcta ✅
- Código correcto ✅
- **Pero data layer mismatch** ❌

**Fix:** Test queries should verify actual DB results

---

## 🚀 Próximos Pasos

### **INMEDIATO:**

```bash
# 1. Migrate user IDs in BigQuery
bq query --use_legacy_sql=false --project_id=salfagpt "
UPDATE \`salfagpt.flow_analytics.document_embeddings\`
SET user_id = 'usr_uhwqffaqag1wrryd82tw'
WHERE user_id = '114671162830729001607'
"

# 2. Test API call again
npx tsx scripts/test-real-similarity.ts

# 3. Verify similarities are REAL (not 50%)

# 4. Test in browser
# Create new chat, ask question
# Should see varied similarities: 72%, 85%, 91%
```

---

**CONCLUSIÓN:** El problema NO es el código del threshold 70%. El problema es que los chunks están indexados con el user ID viejo y el sistema busca con el nuevo. Una vez migrados, las similitudes REALES aparecerán.







