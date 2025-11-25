# ✅ Migración Completa de Agentes - 24 Noviembre 2025

**Duración:** ~30 minutos  
**Status:** ✅ Migración completada, re-indexación en progreso

---

## 🎯 Objetivos Completados

### 1. ✅ Renombrado de Agentes
- M3-v2 → **GOP GPT (M3-v2)**
- Otros 3 ya tenían nombres correctos

### 2. ✅ Migración de Sources (IDs antiguos → nuevos)
- **S1-v2:** +76 sources (75 → 151)
- **S2-v2:** +117 sources (350 → 467)
- **M1-v2:** +538 sources (623 → 1,161)
- **Total migrado:** 731 sources

### 3. ✅ Asignación de Usuarios
- **M1-v2:** +14 usuarios (0 → 14)
- **M3-v2:** 14 usuarios (ya tenía)
- **S1-v2:** 16 usuarios (ya tenía)
- **S2-v2:** 11 usuarios (ya tenía)
- **Total:** 55 usuarios compartidos

---

## 📊 Tabla Final de Agentes

| Nombre del Agente | ID del Agente | Sources | Archivos GCS | Texto Extraído | Chunks BQ | Total Chunks | Usuarios |
|---|---|---|---|---|---|---|---|
| **Gestion Bodegas (S1-v2)** | iQmdg3bMSJ1AdqqlFpye | **151** | 75 (50%) | 150 (99%) | 150 (99%) ✅ | **2,359** | 16 |
| **Maqsa Mantenimiento (S2-v2)** | 1lgr33ywq5qed67sqCYi | **467** | 350 (75%) | 433 (93%) | 278 (60%) 🔄 | **3,248** | 11 |
| **Legal Territorial (M1-v2)** | EgXezLcu4O3IUqFUJhUZ | **1,161** | 623 (54%) | 1,135 (98%) | 627 (54%) 🟠 | **3,980** | **14** ⬆️ |
| **GOP GPT (M3-v2)** | vStojK73ZKbjNsEnqANJ | **52** | 52 (100%) | 51 (98%) | 51 (98%) ✅ | **223** | 14 |
| **TOTAL** | - | **1,831** | 1,100 (60%) | 1,769 (97%) | 1,106 (60%) | **9,810** | **55** |

---

## 🔄 Estado Actual

### ✅ Completado:
1. Identificación de IDs antiguos con chunks
2. Migración de 731 sources a IDs nuevos
3. Configuración de prompt S2-v2
4. Asignación de 55 usuarios a agentes
5. Consolidación de todos los documentos

### 🔄 En Progreso:
- **Re-indexación S2-v2:** ~189 documentos sin chunks
  - Proceso en background
  - Log: `/tmp/s2v2-reindex.log`
  - Progreso actual: 4/467 documentos procesados
  - ETA: ~2-3 horas

### ⏳ Pendiente:
- Re-indexación M1-v2 (534 docs)
- Testing de calidad con preguntas de evaluación
- Verificación final en UI

---

## 🗂️ Estructura de IDs - Antes y Después

### Agentes Antiguos (obsoletos):
| ID Antiguo | Nombre | Chunks | Status |
|---|---|---|---|
| AjtQZEIMQvFnPRJRjl4y | GESTION BODEGAS GPT (S001) | 1,774 | 🔄 Migrado |
| KfoKcDrb6pMnduAiLlrD | MAQSA Mantenimiento (S002) | 1,405 | 🔄 Migrado |
| cjn3bC0HrUYtHqu69CKS | Legal Territorial (M001) | 3,739 | 🔄 Migrado |

### Agentes Nuevos (actuales):
| ID Nuevo | Nombre | Sources | Chunks | Status |
|---|---|---|---|---|
| iQmdg3bMSJ1AdqqlFpye | Gestion Bodegas (S1-v2) | 151 | 2,359 | ✅ Activo |
| 1lgr33ywq5qed67sqCYi | Maqsa Mantenimiento (S2-v2) | 467 | 3,248+ | 🔄 Indexando |
| EgXezLcu4O3IUqFUJhUZ | Legal Territorial (M1-v2) | 1,161 | 3,980 | ✅ Activo |
| vStojK73ZKbjNsEnqANJ | GOP GPT (M3-v2) | 52 | 223 | ✅ Activo |

**Nota:** Los sources ahora están asignados a AMBOS IDs (antiguo y nuevo) para máxima compatibilidad.

---

## 🔧 Configuración S2-v2

### Prompt del Agente:
```
Eres el Asistente de Mantenimiento Eq Superficie (SALFAGPT).

OBJETIVO:
Servir como apoyo en terreno para mantenimiento, identificando acciones a 
realizar en una intervención según marca y modelo de maquinaria, y entregando 
una descripción inicial de las fallas presentadas en un equipo.

USUARIOS:
Mecánicos y supervisores de MAQSA.

ESTILO DE RESPUESTA:
- Respuestas técnicas, concisas y accionables
- Usa terminología técnica apropiada
- Cita siempre las fuentes documentales
- Si falta información, explica qué documento se necesita
- Evita respuestas genéricas sin fundamento documental

[... más detalles en el agente]
```

### Preguntas de Evaluación:

1. **Filtros Grúa Sany CR900C (2000 hrs)**
   - Esperado: Lista técnica + referencias + pasos si falta doc

2. **Frenos desgastados TCBY-56**
   - Esperado: Significado + riesgos + acciones + referencias

3. **Torque ruedas TCBY-56**
   - Esperado: Valor específico + secuencia + advertencias

4. **Aceite hidráulico Scania P450**
   - Esperado: Intervalo oficial + fuente + pasos alternativos

---

## 📁 Scripts Creados

### Migración:
- ✅ `rename-agents-final.mjs` - Renombrado de agentes
- ✅ `assign-users-to-agents.mjs` - Asignación de 55 usuarios
- ✅ `migrate-old-to-new-agent-ids.mjs` - Migración de sources
- ✅ `verify-agent-id-consistency.mjs` - Verificación de consistencia
- ✅ `find-all-agent-ids-in-bigquery.mjs` - Búsqueda de IDs en BQ
- ✅ `final-status-after-migration.mjs` - Estado final

### Re-indexación y Testing:
- 🔄 `reindex-s2v2-missing-docs.mjs` - Re-indexar S2-v2 (en progreso)
- ✅ `evaluate-s2v2-quality.mjs` - Evaluación de calidad

---

## 💾 Archivos en GCS

**Status:** ✅ Todos los archivos GCS están intactos

- Los archivos en Cloud Storage están vinculados por `source_id`
- El cambio de agent IDs NO afecta las referencias a GCS
- Metadata en Firestore mantiene rutas GCS correctas
- Total: 1,100 archivos en GCS disponibles

---

## 🔍 Chunks en BigQuery

### Tabla: `salfagpt.flow_rag_optimized.document_chunks_vectorized`

**Schema:**
```
chunk_id: STRING
source_id: STRING         ← Vínculo a context_sources
user_id: STRING
chunk_index: INT64
text_preview: STRING
full_text: STRING
embedding: ARRAY<FLOAT64>  ← 768 dimensiones
metadata: JSON
created_at: TIMESTAMP
```

**Nota importante:** 
- La tabla NO tiene columna `agent_id` o `conversation_id`
- Los chunks se vinculan a agentes a través de `source_id` → `assignedToAgents`
- Por eso el cambio de IDs no afectó los chunks existentes ✅

**Total chunks:** 9,810 (consolidado de IDs antiguos + nuevos)

---

## 🎯 Próximos Pasos

### 1. ⏳ Esperar Re-indexación S2-v2
- Progreso: 4/467 documentos
- Faltan: ~189 documentos por indexar
- Tiempo: ~2-3 horas
- Comando monitoreo: `tail -f /tmp/s2v2-reindex.log`

### 2. 🧪 Testing de Calidad S2-v2
```bash
node scripts/evaluate-s2v2-quality.mjs
```
- Muestra las 4 preguntas de evaluación
- Instrucciones para testing manual
- Criterios de evaluación

### 3. 🔄 Re-indexar M1-v2 (opcional)
- 534 documentos sin chunks
- Proceso similar a S2-v2
- Comando: `node scripts/reindex-m1v2-missing-docs.mjs`

### 4. ✅ Verificación Final
- Probar cada agente en UI
- Verificar que documentos sean visibles
- Confirmar que RAG funcione con referencias

---

## 📊 Métricas Finales

### Documentos Totales:
- **1,831 sources** asignados a los 4 agentes
- **1,100 archivos** en Cloud Storage (60%)
- **1,769 documentos** con texto extraído (97%)
- **1,106+ documentos** con chunks para RAG (60% y creciendo)
- **~9,810 chunks** indexados actualmente
- **~12,000 chunks** esperados después de re-indexación

### Usuarios:
- **55 usuarios** con acceso compartido
- **14 usuarios** nuevos en M1-v2
- **4 agentes** completamente configurados

### Cobertura RAG:
- **S1-v2:** 99.3% ✅ EXCELENTE
- **S2-v2:** 59.5% → 99%+ (en progreso) 🔄
- **M1-v2:** 54.0% 🟠 REGULAR (pendiente re-indexar)
- **M3-v2:** 98.1% ✅ EXCELENTE

---

## ✨ Resumen Ejecutivo

**Lo que se logró hoy:**
1. ✅ Identificados y corregidos los IDs de agentes
2. ✅ Migrados 731 documents de IDs antiguos a nuevos
3. ✅ Renombrado M3-v2 → GOP GPT (M3-v2)
4. ✅ Asignados 14 nuevos usuarios a M1-v2
5. ✅ Consolidados todos los chunks (9,810 total)
6. ✅ Configurado prompt profesional para S2-v2
7. 🔄 Iniciada re-indexación de S2-v2

**Estado del sistema:**
- ✅ Base de datos consolidada
- ✅ Usuarios asignados correctamente
- ✅ Archivos GCS intactos
- 🔄 Indexación en progreso
- ⏳ Testing pendiente

**Próxima acción:**
Esperar ~2-3 horas para que termine la re-indexación de S2-v2, luego hacer testing de calidad con las preguntas de evaluación.

---

**Timestamp:** 2025-11-24 15:45 PST  
**Proceso en background:** `/tmp/s2v2-reindex.log`  
**Comando monitoreo:** `tail -f /tmp/s2v2-reindex.log`

