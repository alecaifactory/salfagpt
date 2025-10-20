# 🗄️ Arquitectura de Almacenamiento RAG - 2025-10-20

## 🎯 Dónde Se Guarda Cada Componente

### 1. 📄 Documento Fuente (Archivo Original)

**Ubicación:** Google Cloud Storage (GCS)

**Bucket:** `gen-lang-client-0986191192-context-documents`

**Path completo:**
```
gs://gen-lang-client-0986191192-context-documents/
  └── {userId}/
      └── {agentId}/
          └── Cir32.pdf  ← Archivo PDF original
```

**Ejemplo real:**
```
gs://gen-lang-client-0986191192-context-documents/114671162830729001607/HIMCaJozzNU2GF8RzwrY/Cir32.pdf
```

**URL pública:** Disponible en el campo `gcsUri` del documento en Firestore

**Acceso:**
- Web: Firebase Console > Storage
- CLI: `gsutil ls gs://gen-lang-client-0986191192-context-documents/`
- Código: `storage.bucket('gen-lang-client-0986191192-context-documents').file(path)`

**Metadata almacenada:**
- Tamaño original (bytes)
- Content-Type: application/pdf
- Fecha de subida
- Uploaded by: CLI version

---

### 2. 📝 Metadata del Documento + Texto Extraído

**Ubicación:** Firestore

**Collection:** `context_sources`

**Document ID:** `8tjgUceVZW0A46QYYRfW` (ejemplo)

**Estructura:**
```typescript
{
  // Identidad
  id: "8tjgUceVZW0A46QYYRfW",
  userId: "114671162830729001607",
  name: "Cir32.pdf",
  type: "pdf",
  
  // Texto extraído (COMPLETO)
  extractedData: "Aquí está el texto completo del documento, incluyendo su estructura...", // 8,091 caracteres
  
  // Assignment (a qué agentes pertenece)
  assignedToAgents: ["HIMCaJozzNU2GF8RzwrY"],
  
  // Metadata de extracción
  metadata: {
    originalFileName: "Cir32.pdf",
    originalFileSize: 14400, // bytes
    extractionDate: Timestamp,
    model: "gemini-2.5-flash",
    charactersExtracted: 8091,
    tokensEstimate: 2023,
    uploadMethod: "cli", // Via CLI v0.3.0
  },
  
  // RAG Metadata (CRÍTICO)
  ragEnabled: true,
  ragMetadata: {
    chunkCount: 5,  ← Cuántos chunks tiene
    totalTokens: 2018,
    avgChunkSize: 404, // tokens promedio por chunk
    indexedAt: Timestamp("2025-10-20 08:45"),
    embeddingModel: "text-embedding-004",  ← Gemini AI
    embeddingType: "gemini-ai-semantic",  ← SEMANTIC, no deterministic
    lastReindexed: Timestamp("2025-10-20 15:05"),
  },
  
  // GCS reference
  gcsUri: "gs://gen-lang-client-0986191192-context-documents/.../Cir32.pdf",
  
  // Estado
  status: "active",
  enabled: true,
  addedAt: Timestamp,
  source: "localhost",
}
```

**Acceso:**
- Web: https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore/data/~2Fcontext_sources~2F8tjgUceVZW0A46QYYRfW
- Código: `firestore.collection('context_sources').doc('8tjgUceVZW0A46QYYRfW').get()`

---

### 3. 🧩 Chunks (Fragmentos del Documento)

**Ubicación:** Firestore

**Collection:** `document_chunks`

**Cantidad:** 5 documentos (1 por chunk)

**Document IDs:** Auto-generados por Firestore

**Estructura de CADA chunk:**
```typescript
{
  // Identidad
  id: "auto-generated-id-1",
  sourceId: "8tjgUceVZW0A46QYYRfW",  ← Link al documento fuente
  userId: "114671162830729001607",
  
  // Índice del chunk
  chunkIndex: 0,  // 0, 1, 2, 3, 4
  
  // Texto del chunk (fragmento específico)
  text: "Aquí está el texto completo del documento, incluyendo su estructura y la tabla en formato Markdown: --- DDU 32 **CIRCULAR ORD. N° 0177**...",  // ~1,492 caracteres
  
  // Embedding semántico (VECTOR DE 768 DIMENSIONES)
  embedding: [
    0.0234, -0.0567, 0.0891, 0.0123, -0.0445, ...  // 768 números
  ],
  
  // Metadata del chunk
  metadata: {
    startChar: 0,
    endChar: 1492,
    tokenCount: 371,
    startPage: 1,
    endPage: 1,
  },
  
  // Metadata de indexación
  indexedAt: Timestamp("2025-10-20 08:45"),
  reindexedAt: Timestamp("2025-10-20 15:05"),  ← Última re-indexación
  embeddingType: "gemini-ai-semantic",  ← Tipo de embedding
  embeddingModel: "text-embedding-004",  ← Modelo usado
}
```

**Los 5 chunks de Cir32.pdf:**

| Chunk | Start Char | End Char | Tokens | Text Preview |
|-------|-----------|----------|--------|--------------|
| #0 | 0 | 1,492 | 371 | "Aquí está el texto completo..." |
| #1 | 1,492 | 3,352 | 465 | "4. Conforme al artículo 49..." |
| #2 | 3,352 | 5,067 | 429 | "7. La conclusión anterior..." |
| #3 | 5,067 | 7,119 | 512 | "9. A mayor abundamiento..." |
| #4 | 7,119 | 8,083 | 241 | "Saluda atentamente..." |

**Acceso:**
- Web: https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore/data/~2Fdocument_chunks
- Código: `firestore.collection('document_chunks').where('sourceId', '==', '8tjgUceVZW0A46QYYRfW').get()`

---

### 4. 🧮 Embeddings (Vectores Semánticos)

**Ubicación:** DENTRO de cada documento chunk en Firestore

**Campo:** `embedding` (array de 768 números)

**Formato:**
```javascript
// Cada chunk tiene su embedding:
embedding: [
  0.02340912,   // Dimensión 0
  -0.05671234,  // Dimensión 1
  0.08912345,   // Dimensión 2
  0.01234567,   // Dimensión 3
  -0.04456789,  // Dimensión 4
  ... // 763 dimensiones más
  0.00891234    // Dimensión 767
]
```

**Tipo de Embedding:**
- **Antes (malo):** `generateDeterministicEmbedding()` - Hash de caracteres
- **Ahora (bueno):** Gemini AI `text-embedding-004` - Semántico REAL

**Cómo se calcula:**
```
Text del chunk → Gemini AI API → Vector de 768 dimensiones
```

**Ejemplo:**
```
"La Ley N°19.537 derogó..." 
  ↓ Gemini AI embedContent
[0.234, -0.567, 0.891, ...]  ← Captura significado de "ley", "derogación", "legal"
```

---

### 5. 🔗 Tabla de Relaciones (Trazabilidad)

**No hay una tabla única**, sino **relaciones entre colecciones**:

```
┌─────────────────────────────────────────────────────────┐
│                  RELACIONES FIRESTORE                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  context_sources (1 documento)                          │
│  ├─ id: "8tjgUceVZW0A46QYYRfW"                         │
│  ├─ userId: "114671..."                                 │
│  ├─ name: "Cir32.pdf"                                   │
│  ├─ extractedData: "texto completo" (8,091 chars)      │
│  ├─ ragEnabled: true                                    │
│  ├─ ragMetadata.chunkCount: 5  ← Cuántos chunks        │
│  └─ gcsUri: "gs://bucket/path/Cir32.pdf"               │
│                                                         │
│          ↓ sourceId                                     │
│                                                         │
│  document_chunks (5 documentos)                         │
│  ├─ Chunk #0                                            │
│  │  ├─ sourceId: "8tjgUceVZW0A46QYYRfW"  ← Link arriba │
│  │  ├─ chunkIndex: 0                                    │
│  │  ├─ text: "Aquí está..." (371 tokens)                │
│  │  └─ embedding: [0.023, -0.056, ...]  ← 768 dims     │
│  │                                                      │
│  ├─ Chunk #1                                            │
│  │  ├─ sourceId: "8tjgUceVZW0A46QYYRfW"  ← Link arriba │
│  │  ├─ chunkIndex: 1                                    │
│  │  ├─ text: "4. Conforme..." (465 tokens)              │
│  │  └─ embedding: [0.034, -0.078, ...]  ← 768 dims     │
│  │                                                      │
│  ├─ Chunk #2, #3, #4 (similar structure)               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Queries para Unir los Datos:**

```typescript
// 1. Get source metadata
const source = await firestore
  .collection('context_sources')
  .doc('8tjgUceVZW0A46QYYRfW')
  .get();

console.log('Source:', source.data().name);  // "Cir32.pdf"
console.log('Has RAG:', source.data().ragEnabled);  // true
console.log('Chunk count:', source.data().ragMetadata.chunkCount);  // 5

// 2. Get all chunks for this source
const chunks = await firestore
  .collection('document_chunks')
  .where('sourceId', '==', '8tjgUceVZW0A46QYYRfW')
  .orderBy('chunkIndex', 'asc')
  .get();

chunks.forEach(doc => {
  const chunk = doc.data();
  console.log(`Chunk #${chunk.chunkIndex}: ${chunk.text.substring(0, 50)}...`);
  console.log(`  Embedding dimensions: ${chunk.embedding.length}`);
  console.log(`  Tokens: ${chunk.metadata.tokenCount}`);
});
```

---

## 🔍 Flujo RAG Completo (Usando Estas Tablas)

### Cuando Usuario Pregunta:

```
1. Usuario: "¿Qué dice sobre la Ley 19.537?"
   ↓
   
2. generateEmbedding(query)
   ↓ Gemini AI API
   queryEmbedding: [0.229, -0.571, 0.887, ...]  (768 dims)
   ↓
   
3. Firestore Query:
   collection('document_chunks')
   .where('userId', '==', userId)
   .where('sourceId', 'in', activeSourceIds)
   .get()
   ↓
   Returns: 5 chunks con sus embeddings
   ↓
   
4. Calculate Similarity:
   for each chunk:
     similarity = cosineSimilarity(queryEmbedding, chunk.embedding)
   ↓
   Results:
     Chunk #1: 0.923 (92.3%) ← ALTA similitud!
     Chunk #0: 0.768 (76.8%)
     Chunk #2: 0.612 (61.2%)
     Chunk #3: 0.445 (44.5%)
     Chunk #4: 0.123 (12.3%)
   ↓
   
5. Filter & Sort:
   - Filter: similarity >= minSimilarity (0.0)
   - Sort: By similarity descending
   - Take: Top 5
   ↓
   Selected: Chunks #1, #0, #2, #3, #4 (all 5 in this case)
   ↓
   
6. Build Context for AI:
   "=== Cir32.pdf (RAG: 5 fragmentos relevantes) ===
    [Fragmento 1, Relevancia: 92.3%]
    {text from chunk #1}
    [Fragmento 0, Relevancia: 76.8%]
    {text from chunk #0}
    ..."
   ↓
   
7. Send to AI with Instructions:
   System Prompt: "Te he proporcionado fragmentos 1, 0, 2, 3, 4.
                   DEBES citar cada uno con [1], [2], [3], [4], [5]"
   ↓
   
8. AI Response:
   "La Ley N°19.537 derogó[1] la anterior[2]..."
   ↓
   
9. Create References:
   references: [
     { id: 1, sourceId: "8tjg...", chunkIndex: 1, similarity: 0.923 },
     { id: 2, sourceId: "8tjg...", chunkIndex: 0, similarity: 0.768 },
     ...
   ]
   ↓
   
10. Save to Firestore (messages collection)
```

---

## 📊 Schema Completo en Firestore

### Collection: `context_sources`

**Purpose:** Metadata de documentos originales

**Key Fields:**
- `name`: Nombre del archivo
- `extractedData`: Texto COMPLETO del documento
- `ragEnabled`: ¿Tiene chunks?
- `ragMetadata.chunkCount`: Cuántos chunks
- `ragMetadata.embeddingType`: Tipo de embedding
- `gcsUri`: Dónde está el archivo original

**Query Example:**
```typescript
const source = await firestore
  .collection('context_sources')
  .doc('8tjgUceVZW0A46QYYRfW')
  .get();
```

---

### Collection: `document_chunks`

**Purpose:** Fragmentos indexados con embeddings para RAG

**Key Fields:**
- `sourceId`: Link a `context_sources`
- `chunkIndex`: Posición en el documento (0, 1, 2, ...)
- `text`: Texto de ESTE fragmento específico
- `embedding`: Vector de 768 dimensiones (SEMANTIC)
- `metadata.tokenCount`: Tokens de este chunk
- `embeddingType`: "gemini-ai-semantic"

**Query Example:**
```typescript
const chunks = await firestore
  .collection('document_chunks')
  .where('sourceId', '==', '8tjgUceVZW0A46QYYRfW')
  .orderBy('chunkIndex', 'asc')
  .get();
```

---

### Collection: `messages`

**Purpose:** Mensajes de conversación con referencias

**Key Fields:**
- `conversationId`: A qué agente pertenece
- `role`: 'user' | 'assistant'
- `content`: Texto del mensaje
- `references`: Array de referencias a chunks usados

**Example:**
```typescript
{
  id: "ZE4BKT0GutJDQn4MviJf",
  conversationId: "HIMCaJozzNU2GF8RzwrY",
  role: "assistant",
  content: "La Ley N°19.537 derogó[1] la anterior[2]...",
  references: [
    {
      id: 1,
      sourceId: "8tjgUceVZW0A46QYYRfW",
      sourceName: "Cir32.pdf",
      chunkIndex: 1,  ← Chunk #1 fue usado
      similarity: 0.923,  ← 92.3% de similitud
      snippet: "4. Conforme al artículo 49...",
      fullText: "texto completo del chunk #1",
      metadata: {
        tokenCount: 465,
        isRAGChunk: true,  ← Marca que es RAG
      }
    },
    // ... más referencias
  ]
}
```

---

## 🗺️ Diagrama Visual de Almacenamiento

```
┌──────────────────────────────────────────────────────────────┐
│                    GOOGLE CLOUD STORAGE                       │
│                                                              │
│  Bucket: gen-lang-client-0986191192-context-documents       │
│  ├─ userId/agentId/Cir32.pdf  ← ARCHIVO ORIGINAL (14.4 KB)  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
                              ↓ gcsUri
┌──────────────────────────────────────────────────────────────┐
│                         FIRESTORE                             │
│                                                              │
│  Collection: context_sources                                 │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Document: 8tjgUceVZW0A46QYYRfW                          │  │
│  │ ├─ name: "Cir32.pdf"                                    │  │
│  │ ├─ extractedData: "texto completo" (8,091 chars)       │  │
│  │ ├─ ragEnabled: true                                     │  │
│  │ ├─ ragMetadata:                                         │  │
│  │ │  ├─ chunkCount: 5                                     │  │
│  │ │  ├─ embeddingType: "gemini-ai-semantic"              │  │
│  │ │  └─ embeddingModel: "text-embedding-004"             │  │
│  │ └─ gcsUri: "gs://..."                                   │  │
│  └────────────────────────────────────────────────────────┘  │
│                              ↓ sourceId                       │
│  Collection: document_chunks                                 │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Chunk #0 (chunkIndex: 0)                                │  │
│  │ ├─ sourceId: "8tjgUceVZW0A46QYYRfW"  ← Link            │  │
│  │ ├─ text: "Aquí está..." (371 tokens)                   │  │
│  │ ├─ embedding: [0.023, -0.056, ...] ← 768 dims         │  │
│  │ └─ metadata: { tokenCount: 371, startChar: 0, ... }    │  │
│  └────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Chunk #1 (chunkIndex: 1)                                │  │
│  │ ├─ sourceId: "8tjgUceVZW0A46QYYRfW"  ← Link            │  │
│  │ ├─ text: "4. Conforme..." (465 tokens)                 │  │
│  │ ├─ embedding: [0.034, -0.078, ...] ← 768 dims         │  │
│  │ └─ embeddingType: "gemini-ai-semantic" ✨              │  │
│  └────────────────────────────────────────────────────────┘  │
│  ... Chunks #2, #3, #4 (similar)                             │
│                                                              │
│  Collection: messages                                        │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Message (AI response)                                   │  │
│  │ ├─ content: "La Ley derogó[1]..."                      │  │
│  │ └─ references: [                                        │  │
│  │    { id: 1, sourceId: "8tjg...", chunkIndex: 1,        │  │
│  │      similarity: 0.923, text: "...", ... }             │  │
│  │    ]                                                    │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔍 Verificación de Datos

### Ver Documento Fuente en Firestore

```bash
npx tsx -e "
import { firestore } from './src/lib/firestore.js';
const source = await firestore.collection('context_sources').doc('8tjgUceVZW0A46QYYRfW').get();
console.log('Nombre:', source.data()?.name);
console.log('RAG habilitado:', source.data()?.ragEnabled);
console.log('Chunks:', source.data()?.ragMetadata?.chunkCount);
console.log('Embedding type:', source.data()?.ragMetadata?.embeddingType);
process.exit(0);
"
```

---

### Ver Chunks en Firestore

```bash
npx tsx -e "
import { firestore } from './src/lib/firestore.js';
const chunks = await firestore
  .collection('document_chunks')
  .where('sourceId', '==', '8tjgUceVZW0A46QYYRfW')
  .orderBy('chunkIndex', 'asc')
  .get();

console.log('Total chunks:', chunks.size);
chunks.forEach(doc => {
  const data = doc.data();
  console.log(\`Chunk #\${data.chunkIndex}:\`);
  console.log(\`  Text: \${data.text.substring(0, 60)}...\`);
  console.log(\`  Embedding dims: \${data.embedding?.length || 0}\`);
  console.log(\`  Embedding type: \${data.embeddingType || 'unknown'}\`);
  console.log(\`  First 5 values: \${data.embedding?.slice(0, 5)}\`);
});
process.exit(0);
"
```

---

### Ver Embeddings Específicos

```bash
npx tsx -e "
import { firestore } from './src/lib/firestore.js';

const chunk = await firestore
  .collection('document_chunks')
  .where('sourceId', '==', '8tjgUceVZW0A46QYYRfW')
  .where('chunkIndex', '==', 1)  // Chunk que contiene 'Lo expuesto hasta ahora...'
  .limit(1)
  .get();

const data = chunk.docs[0].data();
console.log('Chunk #1 (el que contiene la frase buscada):');
console.log('Text:', data.text.substring(0, 200));
console.log('');
console.log('Embedding (primeras 10 dimensiones):');
console.log(data.embedding.slice(0, 10));
console.log('');
console.log('Embedding type:', data.embeddingType);
console.log('Embedding model:', data.embeddingModel);
process.exit(0);
"
```

---

## 📋 Resumen de Almacenamiento

| Dato | Dónde | Collection | Campo | Tamaño |
|------|-------|------------|-------|--------|
| **Archivo PDF original** | GCS | - | - | 14.4 KB |
| **Texto completo extraído** | Firestore | context_sources | extractedData | 8,091 chars |
| **Metadata del documento** | Firestore | context_sources | metadata, ragMetadata | ~500 bytes |
| **Chunk #0 text** | Firestore | document_chunks | text | 1,492 chars |
| **Chunk #0 embedding** | Firestore | document_chunks | embedding | 768 floats = ~6KB |
| **Chunk #1 text** | Firestore | document_chunks | text | 1,860 chars |
| **Chunk #1 embedding** | Firestore | document_chunks | embedding | 768 floats = ~6KB |
| ... (chunks #2, #3, #4) | ... | ... | ... | ~30KB total |
| **Referencias en mensajes** | Firestore | messages | references | ~1KB por mensaje |

**Total por documento:**
- GCS: 14.4 KB (archivo original)
- Firestore: ~50 KB (texto + chunks + embeddings)
- **Grand Total: ~65 KB** por documento con RAG completo

---

## 🎯 Trazabilidad Completa

### Ejemplo: Rastrear Referencia [1] hasta su Origen

```
1. Usuario ve en UI:
   [1] Cir32.pdf - 92.3% similar - Fragmento 1 - 🔍 RAG
   
2. Click en [1] abre ReferencePanel con:
   - sourceId: "8tjgUceVZW0A46QYYRfW"
   - chunkIndex: 1
   - similarity: 0.923
   
3. Frontend busca chunk en memoria (ya cargado)
   O hace query:
   collection('document_chunks')
   .where('sourceId', '==', '8tjgUceVZW0A46QYYRfW')
   .where('chunkIndex', '==', 1)
   
4. Muestra texto completo del chunk
   
5. Usuario puede ver documento original:
   - sourceId → context_sources → gcsUri
   - Download desde GCS
```

---

## 🚀 Comandos Útiles

### Ver TODO almacenado para Cir32.pdf

```bash
# 1. Metadata en Firestore
echo "=== Context Source ==="
npx tsx -e "
import { firestore } from './src/lib/firestore.js';
const doc = await firestore.collection('context_sources').doc('8tjgUceVZW0A46QYYRfW').get();
console.log(JSON.stringify(doc.data(), null, 2));
process.exit(0);
"

# 2. Chunks en Firestore
echo ""
echo "=== Document Chunks ==="
npx tsx -e "
import { firestore } from './src/lib/firestore.js';
const chunks = await firestore.collection('document_chunks')
  .where('sourceId', '==', '8tjgUceVZW0A46QYYRfW')
  .orderBy('chunkIndex', 'asc')
  .get();
chunks.forEach(doc => {
  const data = doc.data();
  console.log(\`Chunk #\${data.chunkIndex}: \${data.text.substring(0, 80)}...\`);
  console.log(\`  Embedding type: \${data.embeddingType}\`);
  console.log(\`  Dimensions: \${data.embedding?.length}\`);
  console.log('');
});
process.exit(0);
"

# 3. Archivo en GCS
echo ""
echo "=== GCS File ==="
gsutil ls -l gs://gen-lang-client-0986191192-context-documents/**/Cir32.pdf
```

---

**Created:** 2025-10-20  
**Document Example:** Cir32.pdf (sourceId: 8tjgUceVZW0A46QYYRfW)  
**Storage:** GCS (original) + Firestore (chunks + embeddings)  
**Ready:** YES ✅

