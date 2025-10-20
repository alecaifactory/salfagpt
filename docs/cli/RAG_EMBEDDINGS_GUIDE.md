# 🧬 RAG & Embeddings - Guía Completa

## 🎯 ¿Qué es RAG?

**RAG (Retrieval-Augmented Generation)** es el proceso de:
1. **Chunk:** Dividir documentos en pedazos semánticos
2. **Embed:** Convertir cada chunk en vector (embedding)
3. **Index:** Almacenar vectores para búsqueda rápida
4. **Search:** Encontrar chunks relevantes por similitud semántica
5. **Generate:** Usar chunks como contexto para el AI

---

## 🔬 Proceso Completo en el CLI

### Pipeline de 5 Pasos

```
📄 Documento → 📤 Upload GCS → 🤖 Extracción → 📐 Chunking → 🧬 Embeddings → 💾 Index
```

**Detalles:**

#### Paso 1: Upload a GCS
- Archivo original guardado
- Path: `gs://bucket/{userId}/{agentId}/file.pdf`

#### Paso 2: Extracción con Gemini
- Texto completo extraído
- Tablas convertidas a Markdown
- Imágenes descritas

#### Paso 3: Guardado en Firestore
- Metadata + texto completo
- Collection: `context_sources`

#### Paso 4: Chunking Inteligente ⭐ NUEVO
- Texto dividido en chunks semánticos
- Tamaño: ~512 tokens por chunk
- Estrategia: Por párrafo primero, luego por oración si es necesario
- Resultado: Array de chunks con texto + posición

#### Paso 5: Generación de Embeddings ⭐ NUEVO
- Cada chunk → embedding de 768 dimensiones
- Modelo: `text-embedding-004`
- Almacenado en collection `document_embeddings`
- **Incluye user attribution:** alec@getaifactory.com
- **Incluye source tracking:** 'cli'

---

## 📊 Estructura de Datos

### Collection: `document_embeddings`

```typescript
{
  id: "embedding-abc123",
  
  // Referencias
  documentId: "source-xyz789",        // Link a context_sources
  fileName: "manual-producto.pdf",
  userId: "114671162830729001607",
  agentId: "cli-upload",
  
  // Chunk info
  chunkIndex: 0,                      // Orden del chunk (0, 1, 2, ...)
  chunkText: "# Manual de Producto\n\nBienvenido al manual...",
  tokenCount: 487,                    // Tokens en este chunk
  
  // Vector embedding
  embedding: [0.123, -0.456, 0.789, ...],  // 768 números (dimensiones)
  embeddingModel: "text-embedding-004",
  
  // ⭐ TRACEABILIDAD
  uploadedVia: "cli",                 // Fuente: CLI
  cliVersion: "0.3.0",                // Versión del CLI
  userEmail: "alec@getaifactory.com", // Usuario que solicitó
  source: "cli",                      // Source tracking
  
  // Timestamps
  createdAt: Timestamp,
  indexedAt: Timestamp,
}
```

---

## 🔍 Dónde Quedan los Vectores

### Firestore Collection: `document_embeddings`

**URL:**
```
https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore/data/~2Fdocument_embeddings
```

**Estructura por documento:**
```
document_embeddings/
├── embedding-1: { chunkIndex: 0, text: "...", embedding: [...768 dims], userEmail: "alec@..." }
├── embedding-2: { chunkIndex: 1, text: "...", embedding: [...768 dims], userEmail: "alec@..." }
├── embedding-3: { chunkIndex: 2, text: "...", embedding: [...768 dims], userEmail: "alec@..." }
└── ...
```

**Cada documento de 10 páginas genera ~15-20 chunks/embeddings**

---

## 📐 Algoritmo de Chunking

### Estrategia

1. **Split por párrafos** (`\n\n`)
2. Si párrafo > 512 tokens → **split por oraciones**
3. Acumular hasta llegar a 512 tokens
4. Crear nuevo chunk
5. Mantener contexto (no cortar palabras/oraciones)

### Ejemplo

**Texto original:**
```
# Manual de Producto

Bienvenido al manual completo de nuestro producto estrella...
(5,000 palabras)
```

**Resultado:**
```
Chunk 0 (487 tokens):
"# Manual de Producto\n\nBienvenido al manual..."

Chunk 1 (512 tokens):
"...continuación del manual. Características principales..."

Chunk 2 (498 tokens):
"...instrucciones de instalación..."

...

Chunk N (412 tokens):
"...conclusión y contacto."
```

**Total:** ~10-15 chunks por documento de 10 páginas

---

## 🧬 Generación de Embeddings

### Modelo: `text-embedding-004`

**Características:**
- **Dimensiones:** 768
- **Input máximo:** 2,048 tokens
- **Output:** Array de 768 números flotantes
- **Precio:** $0.00002 per 1K tokens
- **Latencia:** ~100-200ms por chunk

### Proceso

```typescript
Para cada chunk:
  1. Enviar texto a Gemini Embedding API
  2. Recibir vector de 768 dimensiones
  3. Guardar en Firestore con metadata completa
  4. Incluir:
     - userEmail: "alec@getaifactory.com" ⭐
     - uploadedVia: "cli" ⭐
     - source: "cli" ⭐
```

### Ejemplo de Embedding

**Input (chunk de texto):**
```
# Manual de Producto

Bienvenido al manual completo de nuestro producto...
```

**Output (vector de 768 dimensiones):**
```
[
  0.123456,
  -0.234567,
  0.345678,
  -0.456789,
  ...
  (768 números en total)
]
```

Este vector captura el **significado semántico** del texto.

---

## 🔍 Búsqueda Semántica (Próximamente)

### Cómo Funciona

1. **Query del usuario:** "política de devoluciones"
2. **Convertir query a embedding:** [0.111, -0.222, ...]
3. **Buscar vectores similares:** Calcular distancia coseno
4. **Ordenar por relevancia:** Top 5 chunks más similares
5. **Usar como contexto:** Enviar chunks al AI

### Query Example (Firestore)

```typescript
// Simplified version (real implementation uses vector similarity)
const embeddings = await firestore
  .collection('document_embeddings')
  .where('userId', '==', '114671162830729001607')
  .where('agentId', '==', 'agent-M001')
  .where('userEmail', '==', 'alec@getaifactory.com')  // ⭐ Filter by user
  .get();

// Calculate cosine similarity
const queryEmbedding = await generateEmbedding(userQuery);
const results = embeddings.docs
  .map(doc => ({
    chunk: doc.data().chunkText,
    similarity: cosineSimilarity(queryEmbedding, doc.data().embedding),
    uploadedVia: doc.data().uploadedVia,  // ⭐ Know it came from CLI
    userEmail: doc.data().userEmail,      // ⭐ Know who uploaded it
  }))
  .sort((a, b) => b.similarity - a.similarity)
  .slice(0, 5);  // Top 5

// Use results as context for AI
```

---

## 💰 Costos

### Por Documento (Promedio)

**Documento de 10 páginas (~5,000 palabras):**

| Paso | Operación | Tokens | Costo |
|------|-----------|--------|-------|
| 1. Upload GCS | - | - | $0.00001 |
| 2. Extracción | Gemini Flash | ~4,000 out | $0.001200 |
| 3. Chunking | - | - | $0 |
| 4. Embeddings | 15 chunks × 500 tokens | 7,500 | $0.000150 |
| **TOTAL** | | | **$0.001350** |

**11 documentos:** ~$0.015 total

---

## 📍 Verificación de Vectores

### Check document_embeddings Collection

```bash
# Ver cuántos embeddings tienes
npx tsx -e "
import { firestore } from './src/lib/firestore.js';

const embeds = await firestore
  .collection('document_embeddings')
  .where('userEmail', '==', 'alec@getaifactory.com')
  .count()
  .get();

console.log('📊 Total embeddings:', embeds.data().count);
process.exit(0);
"
```

### Ver embeddings de un documento

```bash
npx tsx -e "
import { firestore } from './src/lib/firestore.js';

const documentId = 'YOUR_DOC_ID';  // From CLI output

const embeds = await firestore
  .collection('document_embeddings')
  .where('documentId', '==', documentId)
  .orderBy('chunkIndex', 'asc')
  .get();

console.log(\`📦 Chunks del documento \${documentId}:\n\`);

embeds.forEach(doc => {
  const d = doc.data();
  console.log(\`Chunk \${d.chunkIndex}:\`);
  console.log(\`  Texto: \${d.chunkText.substring(0, 100)}...\`);
  console.log(\`  Tokens: \${d.tokenCount}\`);
  console.log(\`  Embedding: [\${d.embedding.slice(0, 5).join(', ')}, ...] (768 dims)\`);
  console.log(\`  Usuario: \${d.userEmail}\`);
  console.log(\`  Fuente: \${d.source}\`);
  console.log('');
});

process.exit(0);
"
```

---

## 🎯 User Attribution en Vectores

### Todos los embeddings incluyen:

```typescript
{
  // ⭐ TRACEABILIDAD
  userEmail: "alec@getaifactory.com",    // Quien subió el documento
  uploadedVia: "cli",                     // Cómo se subió (cli vs webapp)
  source: "cli",                          // Source tracking
  cliVersion: "0.3.0",                    // Versión del CLI usado
  
  // También en el documento padre (context_sources)
  metadata: {
    userEmail: "alec@getaifactory.com",
    uploadedVia: "cli",
    ragProcessedBy: "alec@getaifactory.com",  // Quien procesó RAG
  }
}
```

### Por qué esto es importante:

1. **Auditoría:** Saber quién creó qué vectores
2. **Costos:** Atribuir costos por usuario
3. **Debugging:** Identificar problemas por fuente
4. **Analytics:** CLI vs webapp usage patterns
5. **Compliance:** Trazabilidad completa para regulación

---

## 📊 Estadísticas del Proceso

### Output del CLI (v0.3)

```
🧬 RAG & Vector Indexing:
   Total Chunks: 45
   Total Embeddings: 45 (768-dim cada uno)
   Modelo Embeddings: text-embedding-004
   Tiempo Total RAG: 8.3s
   Promedio por Archivo: 8.3s

💰 Costos:
   Extracción (Gemini): $0.001234
   Embeddings (RAG): $0.000180
   Total: $0.001414
   Promedio por Archivo: $0.001414

☁️  Recursos Creados en GCP:
   Storage: 1 archivo(s) en gs://...
   Firestore context_sources: 1 documento(s)
   Firestore document_embeddings: 45 chunks vectorizados ⭐
   🔍 Búsqueda semántica: Habilitada para 1 documentos
```

---

## 🔮 Próximos Pasos (v0.4+)

### Búsqueda Semántica

**Comando (futuro):**
```bash
npx tsx cli/index.ts search "política de devoluciones" --agent M001
```

**Output:**
```
🔍 Buscando: "política de devoluciones"
🎯 Top 5 resultados:

1. manual-producto.pdf (Chunk 3) - Similitud: 92%
   "...las políticas de devolución permiten..."
   
2. faq-cliente.pdf (Chunk 7) - Similitud: 87%
   "...para devolver un producto contacte..."

...
```

### BigQuery Migration (v0.5+)

Para mejor performance con >10,000 chunks:

```sql
CREATE TABLE `gen-lang-client-0986191192.flow_analytics.document_embeddings` (
  chunk_id STRING,
  document_id STRING,
  user_id STRING,
  user_email STRING,       -- ⭐ User attribution
  agent_id STRING,
  chunk_index INT64,
  chunk_text STRING,
  embedding ARRAY<FLOAT64>,  -- 768 dimensions
  token_count INT64,
  
  -- Traceability
  uploaded_via STRING,     -- 'cli' or 'webapp'
  cli_version STRING,
  source STRING,           -- 'cli'
  
  created_at TIMESTAMP,
  indexed_at TIMESTAMP
)
PARTITION BY DATE(created_at)
CLUSTER BY user_email, agent_id;
```

---

**Last Updated:** 2025-10-19  
**CLI Version:** 0.3.0  
**Status:** ✅ RAG Implemented

