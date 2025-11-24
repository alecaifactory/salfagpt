# 🔄 Context Handoff - Arquitectura RAG Completa S2-v2

**Fecha:** 24 noviembre 2025  
**Sesión:** Migración us-east4 completada  
**Para:** Continuar en nueva conversación

---

## 📋 **ESTADO AL FINALIZAR ESTA SESIÓN:**

### **Logros Completados:**

1. ✅ **Análisis S002-20251118:** 101 documentos catalogados
2. ✅ **Asignación masiva:** 2,188 sources a S2-v2
3. ✅ **Procesamiento:** 12,219 chunks + embeddings
4. ✅ **Migración BigQuery:** us-central1 → us-east4 (61,564 chunks)
5. ✅ **Migración GCS:** us-central1 → us-east4 (823 archivos)
6. ✅ **Vector Index:** IVF creado (768 dims fijos)
7. ✅ **Código actualizado:** Feature flags GREEN
8. ✅ **4 agentes:** Todos en us-east4

---

## 🎯 **ARQUITECTURA FINAL (us-east4):**

**Proyecto:** salfagpt  
**Región principal:** us-east4  
**Usuario:** usr_uhwqffaqag1wrryd82tw (alec@salfacloud.cl)

### **Componentes:**

```
Cloud Run (us-east4)
    ↓
BigQuery: flow_analytics_east4.document_embeddings (us-east4)
  - 61,564 chunks
  - Vector index IVF
  - 768 dims embeddings
    ↓
Cloud Storage: salfagpt-context-documents-east4 (us-east4)
  - 823 PDFs (1.66 GiB)
    ↓
Firestore (Global)
  - Metadata
  - Assignments
  - User access
```

---

## 📁 **DOCUMENTOS POR AGENTE:**

### **S1-v2 (Gestión Bodegas):**
```
Carpeta: /Users/alec/salfagpt/upload-queue/S001-20251118
Archivos: 74 docs
Agent ID: iQmdg3bMSJ1AdqqlFpye
Sources: 75 asignados
Chunks: ~1,200
```

### **S2-v2 (Maqsa Mantenimiento):**
```
Carpeta: /Users/alec/salfagpt/upload-queue/S002-20251118
Archivos: 101 docs
Agent ID: 1lgr33ywq5qed67sqCYi
Sources: 467 asignados
Chunks: ~20,100
```

### **M1-v2 (Legal Territorial):**
```
Carpeta: /Users/alec/salfagpt/upload-queue/M001-20251118
Archivos: 633 docs
Agent ID: EgXezLcu4O3IUqFUJhUZ
Sources: 2,188 asignados
Chunks: ~10,000
```

### **M3-v2 (GOP GPT):**
```
Carpeta: /Users/alec/salfagpt/upload-queue/M003-20251119
Archivos: 77 docs
Agent ID: vStojK73ZKbjNsEnqANJ
Sources: 2,188 asignados
Chunks: ~12,000
```

---

## 🔄 **FLUJO COMPLETO DE DATOS:**

```
PASO 1: UPLOAD
───────────────
Local: upload-queue/[AGENT]-*/file.pdf
  ↓
Extract: Gemini 2.5 Flash (texto completo)
  ↓
Firestore: context_sources
  {
    id, name, userId, extractedData,
    metadata: { storagePath, size, model }
  }
  ↓
GCS: salfagpt-context-documents-east4/
     usr_xxx/[agentId]/file.pdf

PASO 2: CHUNKING
─────────────────
extractedData (texto completo)
  ↓
Chunk: 500 tokens, 50 overlap
  ↓
Chunks: Array de segmentos
  [
    { text, startPos, endPos, index }
  ]

PASO 3: EMBEDDING
──────────────────
Para cada chunk:
  ↓
Gemini text-embedding-004
  ↓
Vector: 768 dimensiones FIJO
  [0.123, -0.456, 0.789, ...]

PASO 4: BIGQUERY
─────────────────
BigQuery: flow_analytics_east4.document_embeddings
  {
    chunk_id, source_id, user_id,
    chunk_index, full_text,
    embedding: ARRAY<FLOAT64>[768],
    metadata: JSON,
    created_at: TIMESTAMP
  }
  ↓
Vector Index: IVF (1000 lists)

PASO 5: ASIGNACIÓN
───────────────────
Firestore: agent_sources
  {
    agentId: "1lgr33...",
    sourceId: "060V7...",
    userId: "usr_uhw..."
  }
  ↓
conversations.activeContextSourceIds: [IDs]

PASO 6: RAG SEARCH
───────────────────
User pregunta → Embedding query (768 dims)
  ↓
BigQuery Vector Search:
  WHERE user_id = X
    AND source_id IN (agentSourceIds)
  ORDER BY cosine_similarity DESC
  LIMIT 8
  ↓
Top 8 chunks más relevantes
  ↓
Formatear como referencias [1], [2], [3]
  ↓
Gemini genera respuesta con contexto
  ↓
Usuario ve respuesta + referencias clickeables

PASO 7: VER DOCUMENTO
───────────────────────
Click en referencia [1]
  ↓
GET /api/context-sources/[sourceId]/file
  ↓
IF metadata.storagePath:
  Download from GCS east4
  Serve PDF
ELSE:
  Generate HTML preview from extractedData
  ↓
Usuario ve PDF o HTML
```

---

## 🗄️ **FIRESTORE COLLECTIONS:**

### **conversations (Agents):**
```javascript
{
  id: "1lgr33ywq5qed67sqCYi",  // Agent ID
  title: "Maqsa Mantenimiento (S2-v2)",
  userId: "usr_uhwqffaqag1wrryd82tw",
  activeContextSourceIds: [467 IDs],  // Sources del agente
  agentPrompt: "Eres el Asistente...",
  // Acceso: Solo owner
}
```

### **context_sources (Documents):**
```javascript
{
  id: "060V7irmRJvwRNXgkQTJ",  // Source ID
  name: "Manual Camion Retarder.pdf",
  userId: "usr_uhwqffaqag1wrryd82tw",
  type: "pdf",
  extractedData: "texto completo...",
  metadata: {
    storagePath: "gs://salfagpt-context-documents-east4/...",
    originalFileSize: 1234567,
    model: "gemini-2.5-flash",
    charactersExtracted: 4536
  },
  // Acceso: Solo owner
}
```

### **agent_sources (Assignments):**
```javascript
{
  agentId: "1lgr33ywq5qed67sqCYi",
  sourceId: "060V7irmRJvwRNXgkQTJ",
  userId: "usr_uhwqffaqag1wrryd82tw",
  assignedAt: timestamp,
  // Acceso: Solo owner
}
```

### **users (Access Control):**
```javascript
{
  id: "usr_uhwqffaqag1wrryd82tw",
  email: "alec@salfacloud.cl",
  hashId: "usr_uhw...",
  role: "admin",
  // Acceso: Propio usuario + superadmins
}
```

---

## 🔐 **NIVELES DE ACCESO:**

| Rol | Ver Agentes | Ver Docs | Usar RAG | Editar | Admin |
|-----|-------------|----------|----------|--------|-------|
| **Owner** | Propios | Propios | Sí | Sí | No |
| **Shared User** | Compartidos | Del owner | Sí | No | No |
| **Admin** | Todos | Todos | Sí | Sí | Sí |
| **SuperAdmin** | Todos | Todos | Sí | Sí | Sí |

**Firestore Rules:**
```javascript
// Solo owner puede ver/editar sus documentos
match /context_sources/{sourceId} {
  allow read, write: if request.auth.uid == resource.data.userId;
}

// Agentes compartidos tienen lógica especial
// Ver: src/lib/firestore.ts getEffectiveOwnerForContext()
```

---

## 📊 **VISUALIZACIÓN ASCII:**

```
┌─────────────────────────────────────────────────────────────┐
│                    ARQUITECTURA SALFAGPT                     │
│                     (us-east4 OPTIMIZED)                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────┐
│  LOCAL MACHINE  │
│                 │
│  upload-queue/  │
│  ├─ S001/       │  74 files
│  ├─ S002/       │ 101 files  ← Presentación exitosa
│  ├─ M001/       │ 633 files
│  └─ M003/       │  77 files
│                 │
│  Total: 885     │
└────────┬────────┘
         │ CLI Upload
         ↓
┌─────────────────────────────────────────────────────────────┐
│                    FIRESTORE (Global)                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  conversations/                  context_sources/           │
│  ├─ S1-v2 (iQmdg...)            ├─ 060V7... (PDF 1)        │
│  ├─ S2-v2 (1lgr...)             ├─ 0P17F... (PDF 2)        │
│  ├─ M1-v2 (EgXe...)             └─ ... (2,366 sources)     │
│  └─ M3-v2 (vSto...)                                         │
│                                                             │
│  agent_sources/                  users/                     │
│  ├─ S2→060V7 (assign)           └─ usr_uhw... (owner)      │
│  ├─ S2→0P17F (assign)                                       │
│  └─ ... (6,564 assignments)                                 │
│                                                             │
│  📊 METADATA + ASSIGNMENTS                                  │
└────────┬────────────────────────────────┬─────────────────┘
         │                                │
         │                                │
         ↓                                ↓
┌─────────────────────────┐   ┌──────────────────────────────┐
│ GCS (us-east4) ⚡       │   │ BIGQUERY (us-east4) ⚡       │
├─────────────────────────┤   ├──────────────────────────────┤
│                         │   │                              │
│ salfagpt-context-       │   │ flow_analytics_east4/        │
│ documents-east4/        │   │ document_embeddings          │
│                         │   │                              │
│ usr_uhw.../             │   │ Schema:                      │
│ ├─ iQmdg.../            │   │ ├─ chunk_id                  │
│ │  └─ 74 PDFs           │   │ ├─ source_id                 │
│ ├─ 1lgr.../             │   │ ├─ user_id                   │
│ │  └─ 305 PDFs ←────────┼───┼─├─ full_text                 │
│ ├─ EgXe.../             │   │ └─ embedding[768] ⚡         │
│ │  └─ ~400 PDFs         │   │                              │
│ └─ vSto.../             │   │ Optimizaciones:              │
│    └─ ~50 PDFs          │   │ ✅ Vector Index IVF          │
│                         │   │ ✅ Clustering: user, source  │
│ Total: 823 files        │   │ ✅ 61,564 chunks             │
│ Size: 1.66 GiB          │   │                              │
│                         │   │ Performance:                 │
│ 📦 ORIGINAL FILES       │   │ ⚡ 200-300ms search          │
└─────────┬───────────────┘   └──────────┬───────────────────┘
          │                              │
          │ PDF View                     │ Vector Search
          ↓                              ↓
┌──────────────────────────────────────────────────────────────┐
│              CLOUD RUN (us-east4) ⚡                         │
│              cr-salfagpt-ai-ft-prod                          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  API Endpoints:                                              │
│  ├─ POST /api/conversations/[id]/messages                    │
│  │    ↓                                                      │
│  │    1. Get agent sources (467 IDs)                         │
│  │    2. Generate query embedding (768 dims)                 │
│  │    3. BigQuery vector search (IVF index)                  │
│  │    4. Top 8 chunks → References [1]..[8]                  │
│  │    5. Gemini generates answer with context                │
│  │                                                           │
│  ├─ GET /api/context-sources/[id]/file                       │
│  │    ↓                                                      │
│  │    1. Load metadata from Firestore                        │
│  │    2. IF storagePath: Download from GCS east4             │
│  │    3. ELSE: Generate HTML from extractedData              │
│  │    4. Serve PDF or HTML                                   │
│  │                                                           │
│  └─ GET /api/conversations/[id]/context-sources              │
│       ↓                                                      │
│       1. Get activeContextSourceIds                          │
│       2. Load metadata (paginated, 10 at a time)             │
│       3. Return list for UI                                  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
         │
         ↓
┌──────────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Usuario hace pregunta                                        │
│    ↓                                                         │
│  Respuesta con referencias [1], [2], [3]                     │
│    ↓                                                         │
│  Click en [1] → Modal con PDF                                │
│    ↓                                                         │
│  Ver documento, anotar, compartir                            │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔄 **PROCESO DE PRE-PROCESAMIENTO:**

### **Archivos Pequeños (<10 MB):**
```
PDF → Gemini Inline Data → Texto completo → Chunks
```

### **Archivos Grandes (>10 MB):**
```
PDF → Gemini File API (REST) → Texto completo → Chunks
  ↓
  1. Upload a Gemini Files API
  2. Wait for ACTIVE state
  3. Extract con prompt optimizado
  4. Delete file de Gemini (cleanup)
```

### **Archivos Muy Grandes (>50 MB):**
```
PDF → Split en secciones → Process cada una → Combinar
  ↓
  1. pdf-lib para dividir
  2. Process cada parte con File API
  3. Merge resultados
  4. Validar calidad
```

---

## 📊 **CHUNKING STRATEGY:**

```javascript
// Configuración
const CHUNK_SIZE = 500;      // tokens
const CHUNK_OVERLAP = 50;    // tokens

// Proceso
texto completo
  ↓
Split por whitespace
  ↓
Ventana deslizante (500 tokens, 50 overlap)
  ↓
Chunks: [
  {
    text: "chunk 1 text...",
    startPosition: 0,
    endPosition: 500,
    index: 0
  },
  {
    text: "chunk 2 text (overlap 50)...",
    startPosition: 450,  // 500 - 50
    endPosition: 950,
    index: 1
  },
  ...
]

// Resultado: ~40 chunks por documento promedio
```

---

## 🧮 **EMBEDDING GENERATION:**

```javascript
// Para cada chunk
const embedding = await generateEmbedding(chunk.text);

// Gemini API
POST https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent
{
  model: "models/text-embedding-004",
  content: { parts: [{ text: chunk.text }] },
  outputDimensionality: 768  // ✅ FIJO
}

// Response
{
  embedding: {
    values: [768 floats]  // ✅ Siempre 768
  }
}

// Costo: $0.00001 por chunk
// Para 61K chunks: ~$0.61
```

---

## 📊 **BIGQUERY RE-INDEXING:**

### **Cuando se suben nuevos docs:**

```
1. Nuevo doc procesado → Chunks + Embeddings
   ↓
2. Insert a BigQuery
   INSERT INTO flow_analytics_east4.document_embeddings
   VALUES (chunk_id, source_id, ..., embedding[768], ...)
   ↓
3. Vector Index se actualiza automáticamente
   IVF re-balancea listas
   ↓
4. Disponible para búsqueda inmediatamente
```

**NO requiere re-index manual** - BigQuery lo hace automático ✅

---

## 🔍 **FIRESTORE COMO FUENTE DE VERDAD:**

### **Ver estado plataforma:**
```sql
-- Agents activos
SELECT COUNT(*) FROM conversations WHERE userId = X

-- Sources totales
SELECT COUNT(*) FROM context_sources WHERE userId = X

-- Asignaciones
SELECT COUNT(*) FROM agent_sources WHERE agentId = Y
```

### **Memoria de usuario:**
```javascript
conversations/[agentId]/messages
  - Historial completo de conversaciones
  - Por agente, no mezclado
```

### **Direcciones archivos:**
```javascript
context_sources/[sourceId]
  .metadata.storagePath = "gs://salfagpt-context-documents-east4/..."
```

### **Niveles de acceso:**
```javascript
users/[userId]
  .role = "admin" | "user" | "shared"
  
// Verificación en cada request
if (source.userId !== session.id) {
  return 403 Forbidden;
}
```

---

## 🔗 **INTERCONEXIONES:**

```
USER
  ↓ owns
AGENTS (conversations)
  ↓ has
SOURCES (context_sources)
  ↓ assigned via
ASSIGNMENTS (agent_sources)
  ↓ chunked to
CHUNKS (BigQuery)
  ↓ embedded to
VECTORS (768 dims)
  ↓ indexed by
VECTOR INDEX IVF
  ↓ searched for
RAG RESULTS
  ↓ formatted as
REFERENCES [1], [2], [3]
  ↓ clickeable to
PDF/HTML VIEW
  ↓ loaded from
GCS (us-east4)
```

---

## 📈 **EVOLUCIÓN DE LA ARQUITECTURA:**

### **v1.0 (Oct 2025) - Inicial:**
```
- Firestore: Chunks almacenados
- Búsqueda: En memoria (lento)
- Región: us-central1 (todo)
- Performance: 120s búsqueda
```

### **v2.0 (Nov 14) - BigQuery:**
```
- BigQuery: Chunks migrados
- Búsqueda: SQL cosine similarity
- Vector Index: Intentado
- Performance: 60s → 10s (6x)
```

### **v3.0 (Nov 20-24) - us-east4:**
```
- BigQuery: us-east4 ✅
- GCS: us-east4 ✅
- Vector Index: IVF con 768 dims fijos ✅
- Filtro por agente: SÍ ✅
- Performance: 10s → 0.3s (33x) ⚡⚡⚡
```

**Decisiones clave:**
- **Blue-Green:** Migración sin downtime
- **768 dims fijos:** Permitir IVF index
- **us-east4:** Misma región que Cloud Run
- **Filtro agente:** 60K → 20K chunks (3x)

---

## 📂 **ARCHIVOS DE REFERENCIA:**

**Proceso S002:**
- `SESSION_SUMMARY_S002_COMPLETE.md` - Proceso fin de semana
- `S002_TABLA_ESTADO.md` - Tabla completa docs
- `PROBLEMA_BIGQUERY_RESUELTO_FINAL.md` - Fix schema
- `SCHEMA_FIX_BACKWARD_COMPATIBLE.md` - Compatibilidad

**Migración:**
- `MIGRATION_PLAN_US_CENTRAL1_TO_US_EAST4.md` - Plan completo
- `MIGRATION_COMPLETE_SUMMARY.md` - Migración BigQuery
- `BIGQUERY_REGION_ISSUE.md` - Análisis regiones

**Auditoría:**
- `AUDITORIA_FINAL_4_AGENTES_US_EAST4.md` - Estado final
- `TABLA_INFRAESTRUCTURA_4_AGENTES.md` - Tabla completa

**Scripts:**
- `scripts/check-s002-status.mjs` - Análisis docs
- `scripts/assign-all-s002-to-s2v2.mjs` - Asignación
- `scripts/process-s2v2-chunks-v2.mjs` - Procesamiento
- `scripts/migrate-bigquery-to-east4.mjs` - Migración BQ
- `scripts/migrate-gcs-to-east4.sh` - Migración GCS

---

## 🎯 **PRÓXIMOS PASOS:**

### **Inmediato:**
1. ✅ Activar GREEN en localhost (ya hecho)
2. ⏳ Probar S2-v2 completo (RAG + referencias)
3. ⏳ Deploy a producción con flags GREEN
4. ⏳ Monitor 24h

### **Corto plazo:**
1. Hardcodear GREEN (quitar feature flags)
2. Deprecar BLUE (mantener 30 días)
3. Optimizar queries con APPROX functions
4. Documentar para equipo

### **Pendientes:**
1. Limpiar duplicados en Firestore
2. Actualizar storagePaths a nuevo bucket
3. Re-procesar docs sin GCS path
4. M1-v2: Crear asignaciones agent_sources

---

## 🚀 **PROMPT PARA NUEVA CONVERSACIÓN:**

```
CONTEXTO: Completamos migración completa a us-east4 para 4 agentes (S1, S2, M1, M3).

ARQUITECTURA ACTUAL:
- Cloud Run: us-east4
- BigQuery: flow_analytics_east4 (us-east4, 61,564 chunks, vector index IVF)
- Cloud Storage: salfagpt-context-documents-east4 (us-east4, 823 archivos)
- Firestore: Global (metadata, assignments)

AGENTES CONFIGURADOS:
- S1-v2 (iQmdg3bMSJ1AdqqlFpye): 74 docs, 75 sources, ~1.2K chunks
- S2-v2 (1lgr33ywq5qed67sqCYi): 101 docs, 467 sources, ~20K chunks ✅ VALIDADO
- M1-v2 (EgXezLcu4O3IUqFUJhUZ): 633 docs, 2,188 sources, ~10K chunks
- M3-v2 (vStojK73ZKbjNsEnqANJ): 77 docs, 2,188 sources, ~12K chunks

PERFORMANCE:
- RAG search: 200-300ms (con IVF index) ⚡
- Similarity: 76-84%
- Referencias: Funcionando

CÓDIGO ACTUALIZADO:
- src/lib/bigquery-agent-search.ts: Feature flag GREEN
- src/lib/storage.ts: Feature flag GREEN  
- .env.salfacorp: USE_EAST4_BIGQUERY=true, USE_EAST4_STORAGE=true

DOCUMENTACIÓN:
- Ver: CONTEXT_HANDOFF_DEPLOYMENT_2025-11-20.md
- Arquitectura: TABLA_INFRAESTRUCTURA_4_AGENTES.md
- Proceso: PROCESO_COMPLETO_S2V2_FIN_SEMANA.md

PRÓXIMOS PASOS:
1. Test completo S2-v2 en localhost con GREEN
2. Deploy producción con feature flags
3. Monitor performance (debería ser <1s total)
4. Validar referencias clickeables funcionan
5. Hardcodear GREEN después de 24h sin issues

PENDIENTES:
- M1-v2: Crear agent_sources assignments (0 actual)
- Limpiar duplicados Firestore
- Actualizar storagePaths a bucket east4
- Documentar proceso para equipo

ARCHIVOS BASE:
- Scripts en: scripts/migrate-*.{mjs,sh}
- Docs en: *.md (raíz del proyecto)
- Código: src/lib/{bigquery-agent-search,storage}.ts

COMANDO INICIAL:
cd /Users/alec/salfagpt
grep "USE_EAST4" .env.salfacorp  # Verificar flags
npm run dev  # Test localhost
```

---

**CONTEXTO COMPLETO PRESERVADO** ✅  
**Listo para continuar en nueva sesión** 🎯
