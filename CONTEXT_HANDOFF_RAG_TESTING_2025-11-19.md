# 🔍 Context Handoff: RAG Testing & BigQuery Verification

**Fecha:** 2025-11-19  
**Propósito:** Verificar que RAG esté correctamente configurado y funcionando con BigQuery para todos los agentes con documentos.

---

## 📋 Resumen de Trabajo Completado

### ✅ Acciones Realizadas:

1. **Habilitado RAG en 15 agentes** con documentos (configurado `useRAGMode: true` y `ragEnabled: true` en Firestore)
2. **Sincronizado chunks a BigQuery** para 3 agentes críticos:
   - **M1-v2**: 714 chunks ✅
   - **S1-v2**: 1,375 chunks ✅ (incluye 585 que ya existían + 790 nuevos)
   - **S2-v2**: 534 chunks ✅ (incluye 94 que ya existían + 440 nuevos)
3. **M3-v2** ya estaba sincronizado: 223 chunks ✅

### 🔧 Configuración BigQuery:
- **Dataset:** `flow_rag_optimized`
- **Tabla:** `document_chunks_vectorized`
- **Esquema:** `chunk_id`, `source_id`, `user_id`, `chunk_index`, `text_preview`, `full_text`, `embedding` (768 dims), `metadata`, `created_at`

---

## 🎯 Tarea Actual: Testing & Verificación RAG

### Objetivo:
Verificar que cada agente con documentos tiene:
1. ✅ RAG habilitado en Firestore (`useRAGMode: true`, `ragEnabled: true`)
2. ✅ Chunks correctamente almacenados en Firestore (`document_chunks` collection)
3. ✅ Chunks sincronizados en BigQuery para búsqueda vectorial optimizada
4. ✅ RAG funcionando en la UI (mostrando referencias a documentos en las respuestas)

---

## 📊 Estado Actual de Agentes

### Agentes con RAG Habilitado y Sincronizados (4):

| Agente | ID | Docs | Chunks (FS) | Chunks (BQ) | Status |
|--------|-----|------|-------------|-------------|--------|
| **M3-v2** | `vStojK73ZKbjNsEnqANJ` | 52 | 223 | 223 | ✅ OK |
| **M1-v2** | `EgXezLcu4O3IUqFUJhUZ` | 279 | 714 | 714 | ✅ OK |
| **S1-v2** | `iQmdg3bMSJ1AdqqlFpye` | 75 | 1,113 | 1,375 | ✅ OK |
| **S2-v2** | `1lgr33ywq5qed67sqCYi` | 108 | 440 | 534 | ✅ OK |

### Agentes con RAG Habilitado pero Necesitan Sync (3):

| Agente | ID | Docs | Chunks (FS) | Chunks (BQ) | Acción |
|--------|-----|------|-------------|-------------|--------|
| **Test Upload Agent (S001)** | `TestApiUpload_S001` | 18 | 576 | 0 | ⚠️ Sync! |
| **TestApiUpload_S0012** | `Jm0XK2BdydVH6KVBqh5I` | 2 | 2 | 0 | ⚠️ Sync! |
| **TestApiUpload_S001** | `rzEqb17ZwSjk99bZHbTv` | 16 | 0 | 0 | ✅ OK (sin chunks) |

### Agentes con Anomalías (8):

Estos tienen chunks en BigQuery pero **0 en Firestore** (posible problema de indexación de `agentId`):

| Agente | ID | Docs | Chunks (FS) | Chunks (BQ) |
|--------|-----|------|-------------|-------------|
| **GESTION BODEGAS GPT (S001)** | `AjtQZEIMQvFnPRJRjl4y` | 76 | 0 | 1,774 |
| **Nueva Conversación** | `EHNGIfk9N6OKiQbqmsvs` | 538 | 0 | 3,739 |
| **MAQSA Mantenimiento (S002)** | `KfoKcDrb6pMnduAiLlrD` | 117 | 0 | 1,405 |
| **Asistente Legal Territorial RDI (M001)** | `cjn3bC0HrUYtHqu69CKS` | 538 | 0 | 3,739 |
| **SSOMA** | `fAPZHQaocTYLwInZlVaQ` | 89 | 0 | 968 |
| **SSOMA v2** | `nlmQBqdCKMEL8d0ZO8eP` | 2 | 0 | 62 |
| **Nuevo Agente** | `RS9g3CNXjEJoxdcmfHWw` | 1 | 0 | 2 |
| **M004** | `eamdq8blenqlvPaThOLC` | 1 | 0 | 2 |

---

## 🧪 Plan de Testing

### 1. Verificar RAG en UI (Testing Funcional)

**Para cada agente principal (M1-v2, M3-v2, S1-v2, S2-v2):**

1. Abrir el agente en la UI
2. Recargar la página (F5) para asegurar nueva configuración
3. Hacer una pregunta específica relacionada con los documentos del agente
4. **Verificar que la respuesta incluya:**
   - ✅ Referencias a documentos (formato: `📄 Según [nombre-documento.pdf]...`)
   - ✅ Citas específicas del contenido
   - ✅ Respuesta basada en los documentos, no respuesta genérica

**Preguntas de Test Sugeridas:**
- **M3-v2 (GOP):** "¿Cuál es el proceso para la planificación inicial de obra?"
- **M1-v2:** "¿Cuáles son los procedimientos de seguridad documentados?"
- **S1-v2:** "¿Qué lineamientos hay para gestión de bodegas?"
- **S2-v2:** "¿Cuáles son los protocolos de mantenimiento?"

### 2. Verificar Chunks en BigQuery (Testing Técnico)

**Script disponible:** Ejecutar para verificar estado actual:

```bash
cd /Users/alec/salfagpt && node -e "
const admin = require('firebase-admin');
const { BigQuery } = require('@google-cloud/bigquery');
admin.initializeApp({ credential: admin.credential.applicationDefault(), projectId: 'salfagpt' });
const firestore = admin.firestore();
const bigquery = new BigQuery({ projectId: 'salfagpt' });

// [Copiar el script de checkChunksStatus() que ya usamos]
"
```

**O usar el script completo guardado en el historial de esta conversación.**

### 3. Testing de Búsqueda Vectorial

**Verificar en Cloud Run logs:**

```bash
gcloud logging read "resource.type=cloud_run_revision" \
  --limit 50 --format json | jq -r '.[] | .textPayload' | \
  grep -E "BigQuery|RAG|vector search"
```

**Buscar estos logs al hacer una pregunta:**
- `🚀 Attempting BigQuery vector search...`
- `✓ BigQuery search complete`
- `Found X results`

---

## 🛠️ Scripts Útiles

### Script 1: Verificar Estado de Todos los Agentes

```bash
cd /Users/alec/salfagpt && node scripts/check-rag-status.mjs
```

*(Este script NO existe aún - puedes pedirme que lo cree)*

### Script 2: Force-Sync Agentes Específicos

Ya existe en: `/Users/alec/salfagpt/scripts/force-sync-multiple-agents.mjs`

Modificar el array `AGENTS_TO_SYNC` para los agentes que necesites:

```javascript
const AGENTS_TO_SYNC = [
  { id: 'TestApiUpload_S001', name: 'Test Upload Agent', expectedChunks: 576 },
  { id: 'Jm0XK2BdydVH6KVBqh5I', name: 'TestApiUpload_S0012', expectedChunks: 2 }
];
```

Luego ejecutar:

```bash
node scripts/force-sync-multiple-agents.mjs
```

### Script 3: Verificar BigQuery Directamente

```bash
bq query --use_legacy_sql=false "
SELECT 
  SUBSTR(source_id, 1, 20) as source_short,
  COUNT(*) as chunk_count,
  MIN(created_at) as first_chunk,
  MAX(created_at) as last_chunk
FROM \`salfagpt.flow_rag_optimized.document_chunks_vectorized\`
GROUP BY source_id
ORDER BY chunk_count DESC
LIMIT 20
"
```

---

## ⚠️ Problemas Conocidos

### 1. Agentes con Chunks en BQ pero no en Firestore

**Síntoma:** Chunks existen en BigQuery pero Firestore muestra 0 chunks para el `agentId`.

**Posible Causa:** 
- Los chunks fueron creados antes de que se implementara el campo `agentId` en `document_chunks`
- O el `agentId` no se asignó correctamente durante el upload

**Solución:** 
1. Verificar si los chunks tienen `agentId` asignado:
```javascript
const chunks = await firestore.collection('document_chunks')
  .where('sourceId', '==', 'DOCUMENT_ID')
  .limit(5)
  .get();

chunks.forEach(doc => {
  console.log(doc.data().agentId); // ¿Está definido?
});
```

2. Si no tienen `agentId`, necesitarás actualizar los chunks en Firestore.

### 2. Diferencias en Conteo de Chunks

**Síntoma:** Firestore muestra X chunks pero BigQuery muestra Y chunks (diferente).

**Causas posibles:**
- Chunks duplicados en BigQuery (si se sincronizó múltiples veces)
- Chunks filtrados por validación (embeddings incorrectos, dimensiones != 768)
- Chunks de documentos que ya no están asignados al agente

**Verificación:**
```bash
# Ver chunks duplicados en BigQuery
bq query --use_legacy_sql=false "
SELECT chunk_id, COUNT(*) as count
FROM \`salfagpt.flow_rag_optimized.document_chunks_vectorized\`
GROUP BY chunk_id
HAVING count > 1
LIMIT 10
"
```

---

## 🎯 Tareas Pendientes

### Prioritarias:
- [ ] **Testing funcional:** Verificar RAG en UI para M1-v2, M3-v2, S1-v2, S2-v2
- [ ] **Force-sync:** Sincronizar los 2 agentes de test restantes (Test Upload Agent, TestApiUpload_S0012)
- [ ] **Investigar anomalías:** ¿Por qué 8 agentes tienen chunks en BQ pero no en Firestore?

### Secundarias:
- [ ] Crear script automatizado de health check para RAG
- [ ] Documentar proceso de troubleshooting RAG
- [ ] Verificar que no haya chunks duplicados en BigQuery
- [ ] Limpiar agentes de test obsoletos (si aplica)

---

## 📝 Comandos Quick Reference

```bash
# 1. Verificar estado actual de chunks
cd /Users/alec/salfagpt && node -e "[SCRIPT DE VERIFICACIÓN]"

# 2. Ver logs de RAG en tiempo real
gcloud logging tail --format=json | jq -r '.textPayload' | grep -i "rag\|bigquery"

# 3. Contar chunks por agente en BigQuery (aproximado, vía source_ids)
bq query --use_legacy_sql=false "
SELECT COUNT(*) as total_chunks
FROM \`salfagpt.flow_rag_optimized.document_chunks_vectorized\`
"

# 4. Verificar configuración de un agente específico
firebase firestore:get conversations/AGENT_ID

# 5. Force-sync múltiples agentes
node scripts/force-sync-multiple-agents.mjs
```

---

## 🔗 Archivos Relevantes

- **Scripts de sync:** `/Users/alec/salfagpt/scripts/force-sync-*`
- **Configuración BigQuery:** `/Users/alec/salfagpt/src/lib/bigquery-vector-search.ts`
- **CLI upload (incluye RAG):** `/Users/alec/salfagpt/cli/commands/upload.ts`
- **Embeddings logic:** `/Users/alec/salfagpt/cli/lib/embeddings.ts`
- **API endpoints (RAG search):** `/Users/alec/salfagpt/src/pages/api/conversations/[id]/messages.ts`

---

## 🚀 Para Comenzar el Testing

**Copia este prompt en tu próxima conversación:**

```
Hola! Vengo del context handoff de RAG Testing:
/Users/alec/salfagpt/CONTEXT_HANDOFF_RAG_TESTING_2025-11-19.md

Lee ese archivo completo para tener contexto.

Necesito:
1. Verificar que RAG esté funcionando correctamente en los 4 agentes principales (M1-v2, M3-v2, S1-v2, S2-v2)
2. Crear una tabla actualizada del estado de chunks en Firestore vs BigQuery
3. Investigar por qué 8 agentes tienen chunks en BigQuery pero 0 en Firestore
4. Hacer force-sync de los agentes restantes que lo necesiten

Por favor, comienza mostrándome una tabla actualizada del estado actual de todos los agentes.
```

---

## 📞 Contacto/Notas

- **Usuario owner:** `usr_uhwqffaqag1wrryd82tw`
- **Proyecto:** `salfagpt`
- **Región:** `us-central1`
- **Timestamp del último sync:** 2025-11-19 (M1-v2, S1-v2, S2-v2)


