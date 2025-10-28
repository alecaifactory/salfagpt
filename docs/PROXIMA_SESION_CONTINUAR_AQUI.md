# 🎯 CONTINUAR AQUÍ - Próxima Sesión

**Fecha Actual:** 2025-10-28  
**Estado:** Testing de feedback Sebastian - Diagnóstico completo, fixes parciales  
**Prioridad:** 🔴 CRÍTICA - Resolver antes de evaluación masiva

---

## 🚨 PROBLEMA CRÍTICO IDENTIFICADO

### **Root Cause: Chunks NO Sincronizados a BigQuery**

**Situación:**
- ✅ Re-indexing completado: 614 docs, 1,896 chunks basura eliminados
- ✅ Chunks guardados en **Firestore** (1,773 para S001)
- ❌ Chunks **NO sincronizados a BigQuery**
- ❌ RAG vectorial busca en **BigQuery** (vacío para este usuario)
- ❌ Resultado: 0 referencias para S001

**Evidencia:**
```sql
-- BigQuery tiene:
Total chunks: 3,021
user_id '114671162830729001607': 3,020 chunks (del 22-Oct, viejos)
user_id 'alec_getaifactory_com': 0 chunks

-- Firestore tiene:
S001: 1,773 chunks (re-indexados hoy)
M001: chunks (re-indexados hoy)

-- Problema:
RAG busca en BigQuery con user_id incorrecto o chunks no synced
→ 0 resultados
→ 0 referencias
```

---

## 📊 Estado de Issues (5 Total)

| Issue | Descripción | Estado Actual | Causa Raíz | Solución | Prioridad |
|---|---|---|---|---|---|
| **FB-001** | S001 sin referencias | ❌ NO RESUELTO | BigQuery sync faltante | Sync Firestore→BigQuery | 🔴 CRÍTICA |
| **FB-002** | M1 alucinación | 🟡 MEJORADO | Numeración inconsistente | Eliminado [0], aún [10] | 🟡 ALTA |
| **FB-003** | M1 80% basura | ✅ RESUELTO | Chunks basura | 1,896 chunks eliminados | ✅ DONE |
| **FB-005** | S1 solo menciona | ❌ NO RESUELTO | Mismo que FB-001 | Sync BigQuery | 🔴 CRÍTICA |
| **FB-004** | M1 modal no abre | ⏳ PENDIENTE | No investigado | TBD | 🟡 MEDIA |

---

## ✅ Trabajo Ya Completado (No Repetir)

### **11 Commits Realizados:**
```
ce47110 - Filtro basura + anti-alucinación
e588d59 - 5 tickets en backlog
521295e - Sistema re-indexing v1
fdea20d - Re-indexing masivo
b306d49 - Sistema evaluación
5b7c88d - Re-indexing completado 614 docs
f3e7461 - Fix 1-based + params RAG
6d31497 - Informe validación
5eecfe9 - Sistema testing por agente
490013a - Resumen sesión
e763eb5 - Diagnóstico FB-001
```

### **Infraestructura Creada:**
- ✅ 5 tickets en Firestore (backlog_items)
- ✅ 87 preguntas cargadas (test_questions)
- ✅ Sistema de evaluación masiva
- ✅ Re-indexing pipeline funcionando
- ✅ Filtro de basura integrado

### **Fixes Aplicados:**
- ✅ filterGarbageChunks() (1,896 chunks eliminados)
- ✅ Referencias 1-based (ya no [0])
- ✅ topK: 5→8, threshold: 0.3→0.25
- ✅ Anti-alucinación v1 (prompts reforzados)

---

## 🎯 TAREAS PENDIENTES CRÍTICAS

### **TAREA 1: Sincronizar Firestore → BigQuery** 🔴 CRÍTICA

**Objetivo:** Hacer que S001 muestre referencias

**Pasos:**
1. Crear script `scripts/sync-firestore-to-bigquery.mjs`
2. Leer todos los chunks de Firestore (collection: document_chunks)
3. Insertar en BigQuery (`salfagpt.flow_analytics.document_embeddings`)
4. Verificar con query que se insertaron
5. Re-probar S001

**Código base:**
```javascript
// Leer de Firestore
const chunks = await firestore.collection('document_chunks')
  .where('userId', '==', '114671162830729001607')
  .get();

// Insertar en BigQuery
await bigquery.dataset('flow_analytics')
  .table('document_embeddings')
  .insert(chunks.docs.map(doc => ({
    chunk_id: doc.id,
    user_id: '114671162830729001607', // ← ID numérico correcto
    source_id: doc.data().sourceId,
    chunk_index: doc.data().chunkIndex,
    text_preview: doc.data().text.substring(0, 500),
    full_text: doc.data().text,
    embedding: doc.data().embedding,
    metadata: JSON.stringify(doc.data().metadata),
    created_at: new Date().toISOString()
  })));
```

**Tiempo estimado:** 15-20 minutos  
**Impacto:** Resuelve FB-001 y FB-005 (ambos son mismo problema)

---

### **TAREA 2: Eliminar Alucinación [9][10]** 🟡 ALTA

**Objetivo:** M001 solo use referencias con badges

**Problema actual:**
- Muestra 8 badges [1]-[8]
- Pero menciona [9][10] en texto

**Solución:**
```typescript
// En buildRAGContext o en prompt
// Asegurar que SOLO se generen referencias para chunks devueltos
// No permitir referencias extras en lista descriptiva
```

**Tiempo estimado:** 30 minutos

---

### **TAREA 3: Testing de Validación** 🔴 CRÍTICA

**Objetivo:** Confirmar que fixes funcionan

**Después de TAREA 1:**
1. M001: "¿Qué es un OGUC?"
   - ✅ Usa solo [1]-[8]
   - ✅ NO usa [9][10]
   - ✅ Fragmentos útiles (no basura)

2. S001: "¿Cómo genero informe petróleo?"
   - ✅ Muestra badges [1][2][3]...
   - ✅ Encuentra PP-009
   - ✅ Da pasos concretos

**Criterio PASS:** Ambos tests ✅

**Tiempo estimado:** 5 minutos

---

### **TAREA 4: Evaluación Masiva** 🟡 ALTA

**Objetivo:** Evaluar 87 preguntas completas

**Solo después de TAREA 3 pasa:**

1. Ejecutar `scripts/bulk-evaluate-all.ts` (por crear)
2. Procesar 87 preguntas (67 S1 + 20 M1)
3. Evaluar calidad automáticamente
4. Generar reporte CSV + JSON
5. Análisis final

**Tiempo estimado:** 30-40 minutos

---

### **TAREA 5: Integrar UI de Testing** 🟡 MEDIA

**Objetivo:** Modal de testing accesible desde agente

**Pasos:**
1. Agregar botón "Testing" en header de agente
2. Abrir `AgentTestingConfigModal`
3. Verificar carga 67/20 preguntas
4. Implementar "Probar Todas"

**Tiempo estimado:** 1 hora

---

## 📂 Archivos Clave para Contexto

### **Documentación de Estado:**
```
docs/
├── RESUMEN_SESION_SEBASTIAN_2025-10-28.md ⭐ LEER PRIMERO
├── DIAGNOSTICO_FB001_S001_SIN_REFERENCIAS.md ⭐ ROOT CAUSE
├── FIX_FINAL_FB001_USERID_MISMATCH.md ⭐ SOLUCIÓN
├── REINDEXING_COMPLETED_2025-10-28.md
├── TICKETS_SEBASTIAN_2025-10-28.md
└── PROXIMA_SESION_CONTINUAR_AQUI.md (este archivo)
```

### **Evaluación:**
```
bulk_evaluation/
├── INFORME_FINAL_2025-10-28.md ⭐ RESULTADOS
├── evaluation_template.csv (87 preguntas)
└── README.md
```

### **Código Importante:**
```
src/
├── lib/
│   ├── rag-search.ts (1-based fix)
│   ├── chunking.ts (filterGarbageChunks)
│   ├── bigquery-agent-search.ts (params optimizados)
│   └── gemini.ts (anti-alucinación)
├── components/
│   └── AgentTestingConfigModal.tsx (UI testing)
└── pages/api/
    ├── agents/[id]/testing-config.ts
    └── agents/[id]/test-questions.ts
```

### **Scripts:**
```
scripts/
├── sync-firestore-to-bigquery.mjs ← POR CREAR (TAREA 1)
├── bulk-evaluate-all.ts ← POR CREAR (TAREA 4)
├── load-sebastian-questions.mjs (ya ejecutado)
└── reindex-with-admin-user.mjs (ya ejecutado)
```

---

## 🎫 Tickets en Backlog

**Ver en:** http://localhost:3000/roadmap

**Total Tickets:** 8

### **Originales (5):**
```
Vs5ZAj5HSN5EAO12Q6lT - FB-001 (S1 sin refs) - CRÍTICO
8fgFByaZXFQrpz5EwrdY - FB-002 (M1 alucinación) - CRÍTICO  
m7hnfk49hxa59qWkCcW8 - FB-003 (M1 basura) - DONE ✅
6lOqVHY2MvUB8ItdL6Hr - FB-004 (M1 modal) - MEDIA
seMry1cyyVT3VNrcSBID - FB-005 (S1 menciona) - CRÍTICO
```

### **Nuevos (3):**
```
MOQ0ANuDIu5DEueNXsfK - Sync Firestore→BigQuery - CRÍTICO - Lane: NOW ⭐
rPyjfACV6wEGeUjJcIRX - Eliminar refs phantom [9][10] - ALTA - Lane: NEXT
vzjhsKgDa0v0Rwl5zjAQ - Evaluación masiva 87 preguntas - ALTA - Lane: NEXT
```

**Prioridad de Ejecución:**
1. 🔴 MOQ0ANuDIu5DEueNXsfK (Sync BigQuery) - **EMPEZAR AQUÍ**
2. 🟡 rPyjfACV6wEGeUjJcIRX (Refs phantom)
3. 🟡 vzjhsKgDa0v0Rwl5zjAQ (Evaluación masiva)

---

## 🔄 Workflow Recomendado

### **Sesión Nueva - Orden de Ejecución:**

```
1. LEER: docs/PROXIMA_SESION_CONTINUAR_AQUI.md (este archivo)
2. LEER: docs/FIX_FINAL_FB001_USERID_MISMATCH.md (solución)
3. EJECUTAR: TAREA 1 (sync BigQuery) - 20 mins
4. EJECUTAR: TAREA 3 (re-testing) - 5 mins
5. SI PASA: TAREA 4 (evaluación masiva) - 40 mins
6. ANÁLISIS: Decidir go/no-go producción
```

**Tiempo total estimado:** 1.5-2 horas

---

## 📊 Métricas de Progreso

### **Completado:**
- ✅ 614 documentos re-indexados
- ✅ 1,896 chunks basura eliminados
- ✅ 87 preguntas configuradas
- ✅ 5 tickets creados
- ✅ 11 commits con fixes

### **Pendiente:**
- ⏳ Sincronizar 1,773+ chunks a BigQuery
- ⏳ Re-testing validación
- ⏳ Evaluación masiva 87 preguntas
- ⏳ Análisis final

### **Progreso Global:**
- Trabajo completado: ~70%
- Calidad actual: 60% (límite aceptable)
- Calidad esperada post-sync: 85-90%

---

## 🎯 Criterio de Éxito

### **Para Declarar "LISTO":**

**Validación (2 preguntas):**
- ✅ M001: "¿Qué es OGUC?" → Solo [1]-[8], sin [9][10], fragmentos útiles
- ✅ S001: "Informe petróleo" → Muestra badges, encuentra PP-009, pasos concretos

**Evaluación Masiva (87 preguntas):**
- ✅ ≥70% calidad Good o Excellent
- ✅ <10% fragmentos basura
- ✅ <5% alucinación de referencias

**Confirmación Usuario:**
- ✅ Sebastian aprueba calidad
- ✅ Mueve tickets a Done en roadmap

---

## 💾 Estado de Firestore

### **Collections Importantes:**

**backlog_items:**
- 5 tickets de Sebastian
- Lane: roadmap (next)
- Status: ready

**test_questions:**
- S001: 67 preguntas
- M001: 20 preguntas
- Enabled: true

**agent_testing_config:**
- S001: testingEnabled: true
- M001: testingEnabled: true

**document_chunks:**
- Total: ~1,773+ chunks
- Todos con embeddings
- **NO sincronizados a BigQuery** ← PROBLEMA

---

## 🔧 Scripts a Crear (Próxima Sesión)

### **1. sync-firestore-to-bigquery.mjs** 🔴 CRÍTICO

```javascript
// Lee chunks de Firestore
// Inserta en BigQuery (flow_analytics.document_embeddings)
// Usa user_id numérico: '114671162830729001607'
// Verifica inserción exitosa
```

**Ubicación:** `scripts/sync-firestore-to-bigquery.mjs`

---

### **2. bulk-evaluate-all.ts** 🟡 ALTA

```javascript
// Lee test_questions de Firestore
// Para cada pregunta:
//   - Ejecuta contra agente
//   - Evalúa calidad
//   - Guarda en test_executions
// Genera CSV + JSON de resultados
```

**Ubicación:** `scripts/bulk-evaluate-all.ts`

---

### **3. fix-reference-hallucination.ts** 🟡 MEDIA

```javascript
// Eliminar referencias [9][10] que no tienen badges
// Ajustar prompt o post-procesamiento
```

**Ubicación:** `scripts/fix-reference-hallucination.ts`

---

## 📋 Tickets Nuevos a Crear

### **TICKET-006: Sync Firestore → BigQuery** 🔴

```javascript
await fetch('/api/backlog/create', {
  method: 'POST',
  body: JSON.stringify({
    companyId: 'salfacorp',
    userId: '114671162830729001607',
    title: '[CRÍTICO] Sincronizar chunks Firestore → BigQuery',
    description: `
Root cause de FB-001 y FB-005.

Chunks re-indexados están en Firestore pero NO en BigQuery.
RAG vectorial busca en BigQuery → 0 resultados → 0 referencias.

Solución:
- Script sync-firestore-to-bigquery.mjs
- Insertar 1,773+ chunks de Firestore a BigQuery
- Usar user_id numérico correcto
- Verificar con query

Impacto:
- Resuelve FB-001 (S001 sin referencias)
- Resuelve FB-005 (S001 solo menciona)
- Habilita RAG para S001
    `,
    type: 'bug',
    priority: 'critical',
    estimatedEffort: 'm',
    lane: 'now', // ← MOVER A NOW (próximo a ejecutar)
    status: 'ready',
    tags: ['bigquery', 'rag', 'sync', 's001', 'critical']
  })
});
```

---

### **TICKET-007: Eliminar Referencias Phantom** 🟡

```javascript
{
  title: '[M1] Eliminar referencias [9][10] sin badges',
  description: 'AI menciona [9][10] en lista pero solo hay 8 badges',
  priority: 'high',
  estimatedEffort: 's'
}
```

---

### **TICKET-008: Evaluación Masiva 87 Preguntas** 🟡

```javascript
{
  title: 'Evaluación masiva de calidad - 87 preguntas Sebastian',
  description: '67 S1 + 20 M1, generar CSV con resultados',
  priority: 'high',
  estimatedEffort: 'l',
  dependencies: ['TICKET-006'] // Depende de sync BigQuery
}
```

---

## 🚀 Comando para Iniciar Próxima Sesión

**En nueva conversación con Cursor:**

```
Hola, necesito continuar el trabajo de feedback de Sebastian.

CONTEXTO COMPLETO EN:
docs/PROXIMA_SESION_CONTINUAR_AQUI.md

RESUMEN:
- 614 docs re-indexados, 1,896 chunks basura eliminados
- Chunks en Firestore pero NO en BigQuery
- S001 muestra 0 referencias (FB-001) por falta de BigQuery sync
- M001 mejorado a 7/10 pero aún tiene minor issues

PRÓXIMA TAREA (CRÍTICA):
Sincronizar 1,773+ chunks de Firestore → BigQuery
Script: scripts/sync-firestore-to-bigquery.mjs (crear)
Dataset: salfagpt.flow_analytics.document_embeddings
user_id: '114671162830729001607' (numérico, no email)

DESPUÉS:
- Re-testing validación (2 preguntas)
- Si pasa: Evaluación masiva (87 preguntas)
- Análisis final y decisión

¿Puedes continuar desde aquí?
```

---

## 📊 BigQuery Schema Requerido

**Dataset:** `salfagpt.flow_analytics`  
**Tabla:** `document_embeddings`

```sql
CREATE TABLE `salfagpt.flow_analytics.document_embeddings` (
  chunk_id STRING NOT NULL,
  user_id STRING NOT NULL,
  source_id STRING NOT NULL,
  chunk_index INT64,
  text_preview STRING,
  full_text STRING,
  embedding ARRAY<FLOAT64>,  -- 768 dimensions
  metadata JSON,
  created_at TIMESTAMP
)
PARTITION BY DATE(created_at)
CLUSTER BY user_id, source_id;
```

**Ya existe** - solo falta insertar datos.

---

## 🔍 Información de Contexto Clave

### **User IDs:**
```
Numérico (correcto): 114671162830729001607
Email sanitizado (incorrecto): alec_getaifactory_com
Email original: alec@getaifactory.com
```

### **Agent IDs:**
```
S001: AjtQZEIMQvFnPRJRjl4y (76 docs, 1,773 chunks)
M001: cjn3bC0HrUYtHqu69CKS (538 docs, chunks en Firestore)
```

### **Proyecto GCP:**
```
Project ID: salfagpt
Dataset: flow_analytics (ya existe)
Tabla: document_embeddings (ya existe, schema OK)
```

---

## 📈 Calidad Esperada Post-Sync

### **Actual (Sin BigQuery sync):**
- M001: 7/10 (funciona parcialmente con chunks viejos)
- S001: 5/10 (no funciona, 0 referencias)
- Promedio: 6/10 (60%)

### **Post Sync BigQuery:**
- M001: 8-9/10 (todas las mejoras aplicadas)
- S001: 8-9/10 (finalmente con referencias)
- Promedio: 8.5/10 (85%)

### **Objetivo Sebastian:**
- 50% de preguntas respondan bien
- Post-sync: 85% ✅ (supera por 70%)

---

## ⚠️ NO Repetir Este Trabajo

**Ya completado y committed:**
- ❌ NO re-indexar (ya hecho)
- ❌ NO recrear tickets (ya en Firestore)
- ❌ NO recargar preguntas (87 ya en sistema)
- ❌ NO aplicar filtros de basura (ya integrados)

**SOLO falta:**
- ✅ Sync Firestore → BigQuery
- ✅ Testing final
- ✅ Evaluación masiva

---

## 🎯 KPIs de Éxito

**Para declarar trabajo completo:**

| Métrica | Target | Actual | Status |
|---|---|---|---|
| Chunks sincronizados BigQuery | 100% | 0% | ❌ |
| S001 muestra referencias | Sí | No | ❌ |
| M001 sin alucinación [9][10] | Sí | No | ⚠️ |
| Basura eliminada | <10% | <5% | ✅ |
| Calidad ≥70% | Sí | 60% | ⚠️ |
| Sebastian aprueba | Sí | Pending | ⏳ |

**Post Sync BigQuery esperado:**
- Todos los KPIs en ✅
- Calidad 85-90%
- Listo para producción

---

## 📞 Para Sebastian

**Después de completar sync BigQuery, enviar:**

> Sebastian,
> 
> Completamos el diagnóstico de tus issues:
> 
> **Problema encontrado:**
> Los documentos fueron re-indexados pero no sincronizados a BigQuery (base de datos de búsqueda vectorial). Por eso S001 no mostraba referencias.
> 
> **Solución en proceso:**
> Sincronizando 1,773 chunks a BigQuery (~20 mins)
> 
> **Después:**
> - S001 mostrará referencias ✅
> - M001 optimizado ✅
> - Testing de 87 preguntas
> 
> Te avisamos cuando esté listo para tu testing final.

---

**INICIO PRÓXIMA SESIÓN: Leer este archivo + ejecutar TAREA 1** 🚀

