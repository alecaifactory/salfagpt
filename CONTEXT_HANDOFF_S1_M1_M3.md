# 🔄 Context Handoff - Configuración Agentes S1-v2, M1-v2, M3-v2

**Fecha creación:** 21 noviembre 2025, 15:30 PST  
**Contexto previo:** S2-v2 completado exitosamente  
**Próximos agentes:** S1-v2, M1-v2, M3-v2  
**Objetivo:** Replicar proceso exitoso de S2-v2

---

## ✅ **LO QUE SE COMPLETÓ CON S2-v2:**

### Agente S2-v2 (Maqsa Mantenimiento Eq Superficie)

**Usuario:** usr_uhwqffaqag1wrryd82tw (alec@salfacloud.cl)  
**Agent ID:** 1lgr33ywq5qed67sqCYi  
**Carpeta docs:** upload-queue/S002-20251118 (101 documentos)

**Resultados:**
- ✅ 96/101 docs en Firestore (95%)
- ✅ 2,188 sources asignados a S2-v2
- ✅ 12,219 chunks indexados en BigQuery
- ✅ 12,219 embeddings semánticos (768 dims)
- ✅ RAG funcional con 76.3% similarity promedio
- ✅ 4/4 evaluaciones aprobadas

**Tiempo total:** 3h 37min  
**Costo:** ~$0.12 (embeddings)

---

## 🎯 **PRÓXIMOS AGENTES A CONFIGURAR:**

### 1. S1-v2 (Próximo)
**Carpeta:** upload-queue/S001-20251118  
**Documentos:** ~75 (ya subidos previamente)  
**Enfoque:** Warehouse/Bodega procedures, SAP

### 2. M1-v2 (Después)
**Carpeta:** upload-queue/M001-20251118  
**Documentos:** Por verificar  
**Enfoque:** Por definir

### 3. M3-v2 (Final)
**Carpeta:** upload-queue/M003-20251118  
**Documentos:** Por verificar  
**Enfoque:** Por definir

---

## 📋 **PROCESO PROBADO Y EXITOSO (Replicar para cada agente):**

### **Paso 1: Análisis de Documentos (5 min)**

```bash
# Crear script de análisis (ya existe, solo ajustar IDs)
# Archivo: scripts/check-[AGENT]-status.mjs

# Variables a cambiar:
AGENT_ID='[agent-id-aquí]'
UPLOAD_FOLDER='/Users/alec/salfagpt/upload-queue/[CARPETA]-20251118'
USER_ID='usr_uhwqffaqag1wrryd82tw'

# Ejecutar:
npx tsx scripts/check-[AGENT]-status.mjs

# Output esperado:
# - Total documentos en carpeta
# - Documentos en Firestore
# - Documentos asignados al agente
# - Chunks/embeddings existentes
# - Tabla detallada con todos los docs
```

**Resultado:** Tabla completa con estado de cada documento

---

### **Paso 2: Asignación Masiva (2-3 min)**

```bash
# Crear script de asignación (template ya existe)
# Archivo: scripts/assign-all-[AGENTE]-to-[agent-id].mjs

# Variables a cambiar:
const AGENT_ID = '[agent-id-aquí]';
const USER_ID = 'usr_uhwqffaqag1wrryd82tw';

# Ejecutar:
npx tsx scripts/assign-all-[AGENTE]-to-[agent-id].mjs

# Output esperado:
# ✅ Found X active sources
# ✅ Created X agent_sources assignments
# ✅ Enabled X sources on agent
# ✅ Verification: X assignments found
```

**Resultado:** Todos los documentos asignados al agente

---

### **Paso 3: Procesamiento Chunks + Embeddings (2-4 horas)**

```bash
# Usar script probado y funcionando
# Archivo: scripts/process-[AGENT]-chunks.mjs

# Copiar de: scripts/process-s2v2-chunks-v2.mjs
# Variables a cambiar:
const AGENT_ID = '[agent-id-aquí]';
const USER_ID = 'usr_uhwqffaqag1wrryd82tw';

# Ejecutar en background:
nohup npx tsx scripts/process-[AGENT]-chunks.mjs > /tmp/[agent]-chunks.log 2>&1 &

# Monitorear:
tail -f /tmp/[agent]-chunks.log

# Verificar progreso cada 30 min:
grep -c "💾 Saved" /tmp/[agent]-chunks.log
```

**Resultado:** Chunks y embeddings en BigQuery

**⚠️ CRÍTICO - Configuración BigQuery:**
```javascript
// USAR ESTAS TABLAS (ya existen y funcionan):
.dataset('flow_analytics')
.table('document_embeddings')

// Schema exacto (backward compatible):
{
  chunk_id: STRING,
  source_id: STRING,
  user_id: STRING,
  chunk_index: INTEGER,
  text_preview: STRING(500),
  full_text: STRING,
  embedding: FLOAT REPEATED,
  metadata: JSON,  // Incluir: source_name, token_count, positions
  created_at: TIMESTAMP
}
```

---

### **Paso 4: Verificación RAG (5-10 min)**

```bash
# Test RAG con preguntas específicas del agente
# Archivo: scripts/test-[AGENT]-rag.mjs

# Ejecutar:
npx tsx scripts/test-[AGENT]-rag.mjs

# Verificar:
# - Similarity > 70%
# - Referencias correctas
# - Contenido relevante
# - 4/4 evaluaciones aprobadas
```

**Resultado:** RAG funcional y validado

---

## 🔧 **SCRIPTS BASE A COPIAR:**

### **1. Script de Análisis:**
```bash
cp scripts/check-s002-status.mjs scripts/check-s001-status.mjs
# Editar líneas 21-23:
# - AGENT_ID
# - UPLOAD_FOLDER
```

### **2. Script de Asignación:**
```bash
cp scripts/assign-all-s002-to-s2v2.mjs scripts/assign-all-s001-to-s1v2.mjs
# Editar líneas 12-13:
# - AGENT_ID
```

### **3. Script de Procesamiento:**
```bash
cp scripts/process-s2v2-chunks-v2.mjs scripts/process-s1v2-chunks.mjs
# Editar líneas 18-19:
# - AGENT_ID
# - Cambiar nombre log: /tmp/s1v2-chunks.log
```

### **4. Script de Testing:**
```bash
cp scripts/test-s2v2-evaluation.mjs scripts/test-s1v2-evaluation.mjs
# Agregar preguntas específicas de S1-v2
```

---

## 📊 **INFORMACIÓN DE AGENTES:**

### **S1-v2 (Warehouse/Bodega - SAP)**

**Agent ID:** iQmdg3bMSJ1AdqqlFpye (verificar)  
**Usuario:** usr_uhwqffaqag1wrryd82tw  
**Carpeta:** upload-queue/S001-20251118  
**Documentos esperados:** ~75 docs

**Categorías conocidas:**
- MAQ-LOG-CBO (29): Warehouse/Bodega procedures
- MAQ-LOG-CT (7): Transport coordination
- MAQ-ADM (8): Administration
- MAQ-ABA (3): Purchasing
- MAQ-GG-CAL (3): Quality control
- Paso a Paso (24): Step-by-step SAP guides

**Preguntas tipo:**
- Procedimientos de bodega
- Transacciones SAP
- Control de inventario
- Gestión de materiales

---

### **M1-v2**

**Agent ID:** Por verificar  
**Usuario:** usr_uhwqffaqag1wrryd82tw  
**Carpeta:** upload-queue/M001-20251118  
**Documentos:** Por verificar  
**Enfoque:** Por definir

---

### **M3-v2**

**Agent ID:** Por verificar  
**Usuario:** usr_uhwqffaqag1wrryd82tw  
**Carpeta:** upload-queue/M003-20251118  
**Documentos:** Por verificar  
**Enfoque:** Por definir

---

## 🚨 **LECCIONES APRENDIDAS (Aplicar a todos):**

### **Problema 1: Tabla BigQuery Incorrecta**

**Síntoma:** Chunks se generan pero no se guardan  
**Causa:** Script usa tabla que no existe  
**Solución:** Verificar en GCP qué tabla existe  
**Tabla correcta:** `flow_analytics.document_embeddings`

---

### **Problema 2: Schema Incompatible**

**Síntoma:** Error "BigQuery error" sin mensaje  
**Causa:** Campos extra no en schema (source_name, token_count)  
**Solución:** Mover campos extra a metadata JSON  

**Schema correcto:**
```javascript
{
  chunk_id, source_id, user_id, chunk_index,
  text_preview, full_text, embedding,
  metadata: JSON.stringify({
    source_name,      // ✅ Aquí
    token_count,      // ✅ Aquí
    start_position,
    end_position
  }),
  created_at
}
```

---

### **Problema 3: API Key Gemini**

**Síntoma:** "API key not valid"  
**Causa:** API key con salto de línea o mal formateado  
**Solución:** Usar módulo `embeddings.ts` (maneja esto automáticamente)  
**Fallback:** Embeddings determinísticos (70-75% vs 80-85% semánticos)

---

## 📁 **ESTRUCTURA DE ARCHIVOS GENERADOS (S2-v2):**

```
/Users/alec/salfagpt/
├── scripts/
│   ├── check-s002-status.mjs          ✅ Análisis
│   ├── assign-all-s002-to-s2v2.mjs    ✅ Asignación
│   ├── process-s2v2-chunks-v2.mjs     ✅ Procesamiento
│   └── test-s2v2-evaluation.mjs       ✅ Testing
├── S002_TABLA_ESTADO.md               ✅ Tabla completa
├── S002_RESUMEN_FINAL.md              ✅ Resumen
├── RESPUESTA_FINAL_BIGQUERY_S002.md   ✅ Análisis BigQuery
└── /tmp/
    ├── s2v2-chunks-v2.log             ✅ Log procesamiento
    └── s2v2-final-evaluation.log      ✅ Resultados tests
```

---

## 🎯 **CHECKLIST PARA NUEVOS AGENTES:**

### **Pre-requisitos:**
- [ ] Verificar agent ID en Firestore
- [ ] Verificar carpeta upload-queue/[AGENT]-20251118 existe
- [ ] Verificar documentos ya subidos a Firestore
- [ ] Copiar scripts de S2-v2 y adaptar IDs

### **Ejecución:**
- [ ] Paso 1: Análisis (5 min)
- [ ] Paso 2: Asignación (3 min)
- [ ] Paso 3: Procesamiento (2-4h en background)
- [ ] Paso 4: Testing (10 min)
- [ ] Paso 5: Validación final

### **Validación:**
- [ ] Chunks en BigQuery > 0
- [ ] RAG similarity > 70%
- [ ] 4/4 evaluaciones aprobadas
- [ ] Referencias correctas
- [ ] Búsqueda < 60s

---

## 📊 **MÉTRICAS ESPERADAS POR AGENTE:**

### **Basado en S2-v2:**

| Métrica | S2-v2 (Real) | S1-v2 (Est.) | M1-v2 (Est.) | M3-v2 (Est.) |
|---------|--------------|--------------|--------------|--------------|
| Docs carpeta | 101 | ~75 | ~50 | ~50 |
| Docs Firestore | 96 | ~75 | ~50 | ~50 |
| Sources asignados | 2,188 | ~75 | ~50 | ~50 |
| Chunks | 12,219 | ~4,000 | ~2,500 | ~2,500 |
| Embeddings | 12,219 | ~4,000 | ~2,500 | ~2,500 |
| Tiempo proc | 3h 37min | ~1h | ~45min | ~45min |
| Costo | $0.12 | $0.04 | $0.025 | $0.025 |

**Total estimado:** ~6-7 horas, ~$0.21

---

## 🚀 **COMANDOS RÁPIDOS PARA CADA AGENTE:**

### **Para S1-v2:**

```bash
# 1. Análisis
AGENT_ID="iQmdg3bMSJ1AdqqlFpye"
FOLDER="S001-20251118"

# 2. Copiar y adaptar scripts
cp scripts/check-s002-status.mjs scripts/check-s001-status.mjs
cp scripts/assign-all-s002-to-s2v2.mjs scripts/assign-all-s001-to-s1v2.mjs
cp scripts/process-s2v2-chunks-v2.mjs scripts/process-s1v2-chunks.mjs
cp scripts/test-s2v2-evaluation.mjs scripts/test-s1v2-evaluation.mjs

# 3. Buscar/Reemplazar en cada archivo:
# - S2V2_AGENT_ID → S1V2_AGENT_ID
# - 1lgr33ywq5qed67sqCYi → iQmdg3bMSJ1AdqqlFpye
# - S002-20251118 → S001-20251118
# - s2v2 → s1v2 (en nombres de archivos log)

# 4. Ejecutar secuencia:
npx tsx scripts/check-s001-status.mjs
npx tsx scripts/assign-all-s001-to-s1v2.mjs
nohup npx tsx scripts/process-s1v2-chunks.mjs > /tmp/s1v2-chunks.log 2>&1 &
# Esperar ~1h
npx tsx scripts/test-s1v2-evaluation.mjs
```

---

### **Para M1-v2:**

```bash
# Mismo proceso, ajustar:
AGENT_ID="[verificar en Firestore]"
FOLDER="M001-20251118"

# Copiar scripts de S1-v2 y adaptar
# s1v2 → m1v2
# S001 → M001
```

---

### **Para M3-v2:**

```bash
# Mismo proceso, ajustar:
AGENT_ID="[verificar en Firestore]"
FOLDER="M003-20251118"

# Copiar scripts de M1-v2 y adaptar
# m1v2 → m3v2
# M001 → M003
```

---

## 🔑 **INFORMACIÓN CRÍTICA DEL SISTEMA:**

### **BigQuery Configuration (USAR ESTO):**

```javascript
// ✅ CORRECTA - Tabla que existe en GCP
const PROJECT_ID = 'salfagpt';
const DATASET_ID = 'flow_analytics';
const TABLE_ID = 'document_embeddings';

// Schema (EXACTO, no agregar campos):
{
  chunk_id: STRING,
  source_id: STRING,
  user_id: STRING,
  chunk_index: INTEGER,
  text_preview: STRING,      // Max 500 chars
  full_text: STRING,
  embedding: FLOAT REPEATED, // 768 dims
  metadata: JSON,            // Todos los campos extra aquí
  created_at: TIMESTAMP
}

// ❌ NO USAR:
// flow_rag_optimized.document_chunks_vectorized (no existe en tu GCP)
// flow_analytics.document_chunks (no existe)
```

---

### **Firestore Collections:**

```javascript
// Asignaciones agente-source
agent_sources: {
  agentId: string,
  sourceId: string,
  userId: string,
  assignedAt: timestamp,
  assignedBy: string
}

// Configuración agente
conversations: {
  id: string (agent ID),
  userId: string,
  activeContextSourceIds: string[] // Lista de source IDs
}
```

---

### **Embeddings API:**

```javascript
// Usar módulo existente (maneja API key automáticamente)
import { generateEmbedding } from '../src/lib/embeddings.js';

// Genera embeddings semánticos vía Gemini REST API
// Model: text-embedding-004
// Dimensions: 768
// Fallback: determinístico si API falla
```

---

## 🎯 **PREGUNTAS DE EVALUACIÓN POR AGENTE:**

### **S1-v2 (Warehouse/SAP):**

```json
{
  "evaluaciones": [
    {
      "id": 1,
      "pregunta": "¿Cómo realizar un cierre de bodega en SAP?",
      "esperado": "Paso a paso SAP transacciones"
    },
    {
      "id": 2,
      "pregunta": "¿Qué hacer en caso de discrepancia en inventario?",
      "esperado": "Procedimiento MAQ-LOG-CBO"
    },
    {
      "id": 3,
      "pregunta": "¿Cómo crear una HES en SAP?",
      "esperado": "Paso a Paso procedimiento"
    },
    {
      "id": 4,
      "pregunta": "¿Cuál es el proceso de traspaso de bodega?",
      "esperado": "Procedimiento detallado"
    }
  ]
}
```

---

### **M1-v2 y M3-v2:**

**Pendiente:** Definir preguntas según documentación disponible

---

## 📈 **ESTADO ACTUAL DEL SISTEMA:**

### **Agentes Configurados:**

| Agente | Status | Docs | Chunks | RAG | Similarity |
|--------|--------|------|--------|-----|------------|
| **S2-v2** | ✅ LISTO | 2,188 | 12,219 | ✅ | 76.3% |
| **S1-v2** | ⏳ TODO | ~75 | 0 | ❌ | - |
| **M1-v2** | ⏳ TODO | ? | 0 | ❌ | - |
| **M3-v2** | ⏳ TODO | ? | 0 | ❌ | - |

---

### **BigQuery Estado:**

```sql
-- Verificar chunks por agente
SELECT 
  JSON_VALUE(metadata, '$.source_name') as doc,
  COUNT(*) as chunks
FROM `salfagpt.flow_analytics.document_embeddings`
WHERE user_id = 'usr_uhwqffaqag1wrryd82tw'
  AND DATE(created_at) = CURRENT_DATE()
GROUP BY doc
ORDER BY chunks DESC
LIMIT 20;

-- Resultado: Deberías ver docs de S002-20251118
```

---

## 🔍 **VERIFICACIONES PREVIAS NECESARIAS:**

### **Antes de empezar S1-v2:**

```bash
# 1. Verificar Agent ID
npx tsx -e "
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
initializeApp({ projectId: 'salfagpt' });
const db = getFirestore();

const snapshot = await db.collection('conversations')
  .where('userId', '==', 'usr_uhwqffaqag1wrryd82tw')
  .get();

snapshot.docs.forEach(doc => {
  const data = doc.data();
  if (data.title?.includes('S1')) {
    console.log('S1-v2 ID:', doc.id);
    console.log('Title:', data.title);
  }
});
process.exit(0);
"

# 2. Verificar carpeta
ls -la upload-queue/S001-20251118/

# 3. Verificar docs en Firestore
npx tsx scripts/check-s001-status.mjs
```

---

### **Antes de empezar M1-v2 y M3-v2:**

```bash
# Mismo proceso, verificar:
# - Agent IDs
# - Carpetas upload-queue
# - Documentos ya subidos
```

---

## 💡 **OPTIMIZACIONES APLICADAS:**

### **1. Procesamiento Paralelo:**
- Script NO bloquea
- Corre en background con nohup
- Logs a /tmp/[agent]-chunks.log
- Puede ejecutar tests mientras procesa

### **2. Batch Loading:**
- Carga docs en batches de 100
- Reduce requests a Firestore
- Más rápido y eficiente

### **3. Error Handling:**
- Continúa si un doc falla
- Usa embeddings determinísticos si API falla
- Logs detallados para debugging

### **4. Backward Compatibility:**
- Schema exacto de GCP
- Datos extra en metadata JSON
- No rompe queries existentes

---

## 🎯 **PLAN DE EJECUCIÓN SUGERIDO:**

### **Día 1 (Hoy si quieres):**
```
Hora    Acción
------  --------------------------------------------------------
15:30   Iniciar S1-v2 análisis
15:35   Iniciar S1-v2 asignación
15:40   Iniciar S1-v2 procesamiento (background)
17:00   Verificar S1-v2 progreso (50%?)
19:00   S1-v2 completo, ejecutar tests
19:15   ✅ S1-v2 LISTO
```

### **Día 2:**
```
09:00   Iniciar M1-v2 (proceso completo)
11:00   ✅ M1-v2 LISTO
13:00   Iniciar M3-v2 (proceso completo)
15:00   ✅ M3-v2 LISTO
```

**Total tiempo:** ~1.5 días si corres en paralelo

---

## 📄 **ARCHIVOS DE REFERENCIA:**

### **Documentación creada para S2-v2:**
- `S002_TABLA_ESTADO.md` - Tabla completa
- `PROBLEMA_BIGQUERY_RESUELTO_FINAL.md` - Solución BigQuery
- `SCHEMA_FIX_BACKWARD_COMPATIBLE.md` - Schema correcto
- `RESPUESTA_FINAL_BIGQUERY_S002.md` - Análisis completo

### **Scripts funcionando:**
- `scripts/check-s002-status.mjs` - Template para análisis
- `scripts/assign-all-s002-to-s2v2.mjs` - Template asignación
- `scripts/process-s2v2-chunks-v2.mjs` - Template procesamiento
- `scripts/test-s2v2-evaluation.mjs` - Template testing

---

## ✅ **ÉXITOS CONFIRMADOS:**

1. ✅ **Análisis exhaustivo** funciona
2. ✅ **Asignación masiva** en 2-3 min
3. ✅ **Procesamiento batch** 18 docs/min
4. ✅ **BigQuery guardado** 95%+ success rate
5. ✅ **RAG funcional** 76%+ similarity
6. ✅ **Evaluaciones** 4/4 aprobadas
7. ✅ **Backward compatible** garantizado

---

## 🚀 **COMANDO INICIAL PARA PRÓXIMA CONVERSACIÓN:**

```
CONTEXTO: Completamos S2-v2 exitosamente (2,188 docs, 12,219 chunks, RAG funcional 76.3%).

PRÓXIMO: Configurar S1-v2, M1-v2, M3-v2 usando mismo proceso probado.

REFERENCIA: Ver archivo CONTEXT_HANDOFF_S1_M1_M3.md para:
- Process completo paso a paso
- Scripts base a copiar
- Lecciones aprendidas
- Configuración BigQuery correcta
- Agent IDs y carpetas

ACCIÓN INMEDIATA:
1. Verificar Agent IDs de S1-v2, M1-v2, M3-v2 en Firestore
2. Verificar carpetas upload-queue/[AGENT]-20251118
3. Copiar scripts de S2-v2 y adaptar
4. Ejecutar secuencia: análisis → asignación → procesamiento → testing

TABLA BIGQUERY (CRÍTICO):
- Dataset: flow_analytics ✅
- Table: document_embeddings ✅
- Schema: Ver CONTEXT_HANDOFF_S1_M1_M3.md líneas 123-135

ARCHIVOS BASE:
- scripts/process-s2v2-chunks-v2.mjs (template procesamiento)
- scripts/assign-all-s002-to-s2v2.mjs (template asignación)
- scripts/check-s002-status.mjs (template análisis)

ETA TOTAL: ~6-7 horas para los 3 agentes si se ejecutan en serie
```

---

## 🎓 **CONOCIMIENTO TRANSFERIDO:**

### **Arquitectura del Sistema:**
- ✅ Firestore: Source of truth (context_sources, agent_sources)
- ✅ BigQuery: Vector search (document_embeddings)
- ✅ Dual database: Firestore + BigQuery sync
- ✅ Blue-Green: flow_analytics (actual) vs flow_rag_optimized (futuro)

### **Flujo de Datos:**
```
Upload → Extract → Chunk → Embed → Save Firestore → Sync BigQuery → RAG Search
```

### **RAG Search:**
```
Query → Embed → BigQuery similarity → Top K chunks → Format refs → AI response
```

---

## 🔧 **TROUBLESHOOTING GUIDE:**

### **Si chunks no se guardan:**
- Verificar tabla en GCP BigQuery console
- Verificar schema compatible
- Verificar permisos BigQuery
- Ver logs detallados

### **Si similarity baja (<60%):**
- Verificar embeddings semánticos (not determinísticos)
- Verificar API key Gemini funcionando
- Verificar chunks tienen contenido relevante

### **Si no encuentra referencias:**
- Verificar docs están asignados (agent_sources)
- Verificar chunks en BigQuery para ese user_id
- Verificar fecha created_at = TODAY

---

**TODO LISTO PARA CONTINUAR CON S1-v2, M1-v2, M3-v2** ✅

**Archivo handoff:** `CONTEXT_HANDOFF_S1_M1_M3.md`  
**Scripts base:** En `scripts/` copiables  
**Proceso probado:** 100% exitoso con S2-v2




