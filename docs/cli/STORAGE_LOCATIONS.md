# 📍 Dónde Quedan Almacenados los Archivos - SalfaGPT CLI

## 🎯 Resumen Rápido

Cuando subes documentos con el CLI, los datos se almacenan en **3 lugares diferentes** en GCP:

1. **GCP Storage** - Archivo original
2. **Firestore** - Metadata + texto extraído
3. **Firestore Events** - Logs de la operación

---

## 📦 1. GCP Cloud Storage - Archivos Originales

### Ubicación

**Bucket:**
```
gs://gen-lang-client-0986191192-context-documents
```

**Ruta completa:**
```
gs://gen-lang-client-0986191192-context-documents/{userId}/{agentId}/{nombre-archivo.pdf}
```

**Ejemplo:**
```
gs://gen-lang-client-0986191192-context-documents/114671162830729001607/cli-upload/manual-producto.pdf
```

### Ver en Consola

**URL del bucket:**
```
https://console.cloud.google.com/storage/browser/gen-lang-client-0986191192-context-documents
```

**Navegación:**
1. Abre el link arriba
2. Navega a tu userId: `114671162830729001607/`
3. Navega al agentId: `cli-upload/`
4. Verás todos tus archivos subidos

**Por línea de comandos:**
```bash
# Listar todos tus archivos
gsutil ls gs://gen-lang-client-0986191192-context-documents/114671162830729001607/

# Listar archivos de un agente específico
gsutil ls gs://gen-lang-client-0986191192-context-documents/114671162830729001607/cli-upload/

# Descargar un archivo
gsutil cp gs://gen-lang-client-0986191192-context-documents/114671162830729001607/cli-upload/manual.pdf ./
```

---

## 🔥 2. Firestore - Metadata y Texto Extraído

### Colección: `context_sources`

**Ubicación en Firebase Console:**
```
https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore/data/~2Fcontext_sources
```

**Estructura del documento:**
```typescript
{
  id: "source-abc123",              // ID auto-generado
  userId: "114671162830729001607",  // Tu usuario
  name: "manual-producto.pdf",
  type: "pdf",
  enabled: true,
  status: "active",
  addedAt: Timestamp,
  
  // ⭐ TEXTO EXTRAÍDO COMPLETO
  extractedData: "Todo el texto del documento aquí...\n\nIncluye tablas, descripciones de imágenes, etc.",
  
  assignedToAgents: ["cli-upload"],
  
  metadata: {
    originalFileName: "manual-producto.pdf",
    originalFileSize: 1270000,
    uploadedVia: "cli",              // ⭐ Origen: CLI
    cliVersion: "0.2.0",
    
    // ⭐ Ubicación del archivo original
    gcsPath: "gs://bucket-name/path/to/file.pdf",
    
    extractionDate: Timestamp,
    extractionTime: 8700,             // ms
    
    // ⭐ Detalles de extracción
    model: "gemini-2.5-flash",
    charactersExtracted: 15234,
    tokensEstimate: 3809,
    inputTokens: 1234,
    outputTokens: 3809,
    estimatedCost: 0.001234,
  },
  
  source: "localhost" | "production"
}
```

### Ver el Texto Extraído

**Opción 1: Firebase Console (GUI)**
1. Abre: https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore/data/~2Fcontext_sources
2. Busca tu documento por nombre
3. Click en el documento
4. Scroll a `extractedData` field
5. Click para expandir y ver todo el texto

**Opción 2: CLI Query (Código)**
```typescript
import { firestore } from './src/lib/firestore';

// Buscar por nombre de archivo
const docs = await firestore
  .collection('context_sources')
  .where('metadata.originalFileName', '==', 'manual-producto.pdf')
  .where('userId', '==', '114671162830729001607')
  .get();

if (!docs.empty) {
  const doc = docs.docs[0];
  const data = doc.data();
  
  console.log('Texto extraído:');
  console.log(data.extractedData);
  
  console.log('\nMetadata:');
  console.log('- Caracteres:', data.metadata.charactersExtracted);
  console.log('- Modelo:', data.metadata.model);
  console.log('- Costo:', data.metadata.estimatedCost);
  console.log('- GCS Path:', data.metadata.gcsPath);
}
```

**Opción 3: Script de consulta rápida**
```bash
# Crear script temporal
cat > ver-texto-extraido.js << 'EOF'
import { firestore } from './src/lib/firestore.js';

const fileName = process.argv[2];
const docs = await firestore
  .collection('context_sources')
  .where('metadata.originalFileName', '==', fileName)
  .where('userId', '==', '114671162830729001607')
  .limit(1)
  .get();

if (docs.empty) {
  console.log('No encontrado');
} else {
  const data = docs.docs[0].data();
  console.log('=== TEXTO EXTRAÍDO ===');
  console.log(data.extractedData);
  console.log('\n=== METADATA ===');
  console.log('Caracteres:', data.metadata.charactersExtracted);
  console.log('Tokens:', data.metadata.tokensEstimate);
  console.log('Modelo:', data.metadata.model);
  console.log('Costo:', data.metadata.estimatedCost);
  console.log('GCS:', data.metadata.gcsPath);
}
process.exit(0);
EOF

# Ejecutar
npx tsx ver-texto-extraido.js "manual-producto.pdf"
```

---

## 📊 3. Firestore - Eventos del CLI

### Colección: `cli_events`

**Ubicación:**
```
https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore/data/~2Fcli_events
```

**Qué contiene:**
- Cada operación del CLI (start, upload, extract, complete)
- Timestamps de cada paso
- Duración de cada operación
- Costos por operación
- Errores si los hubo

**Ejemplo de documento:**
```typescript
{
  eventType: "cli_file_extracted",
  userId: "114671162830729001607",
  userEmail: "alec@getaifactory.com",
  source: "cli",
  cliVersion: "0.2.0",
  
  operation: "extract",
  fileName: "manual-producto.pdf",
  
  model: "gemini-2.5-flash",
  inputTokens: 1234,
  outputTokens: 3809,
  estimatedCost: 0.001234,
  
  duration: 8700,  // ms
  success: true,
  
  timestamp: Timestamp,
  sessionId: "cli-session-123",
  hostname: "cli-machine",
  nodeVersion: "v20.11.0",
  platform: "darwin"
}
```

### Colección: `cli_sessions`

**Ubicación:**
```
https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore/data/~2Fcli_sessions
```

**Qué contiene:**
- Resumen de cada ejecución del CLI
- Comando completo ejecutado
- Total de archivos procesados
- Costo total de la sesión
- Duración total

---

## 🔍 Cómo Verificar que Todo Se Subió

### Paso 1: Revisar Terminal Output

Después de ejecutar el CLI, verás:

```
☁️  Recursos Creados en GCP:
   Storage: 3 archivo(s) en gs://gen-lang-client-0986191192-context-documents/
   Firestore: 3 documento(s) en collection 'context_sources'
```

### Paso 2: Verificar GCP Storage

```bash
# Lista archivos en el bucket
gsutil ls -lh gs://gen-lang-client-0986191192-context-documents/114671162830729001607/cli-upload/

# Deberías ver:
# 1.24 MB  2025-10-19  manual-producto.pdf
# 854 KB   2025-10-19  politicas-atencion.pdf
# 432 KB   2025-10-19  faq-cliente.pdf
```

**O en la consola web:**
https://console.cloud.google.com/storage/browser/gen-lang-client-0986191192-context-documents

### Paso 3: Verificar Firestore

**Query para tus documentos:**
```bash
# Crear script de verificación
cat > verificar-subida.js << 'EOF'
import { firestore } from './src/lib/firestore.js';

const docs = await firestore
  .collection('context_sources')
  .where('userId', '==', '114671162830729001607')
  .where('metadata.uploadedVia', '==', 'cli')
  .orderBy('addedAt', 'desc')
  .limit(10)
  .get();

console.log(`\n📊 Encontrados ${docs.size} documentos subidos via CLI:\n`);

docs.forEach(doc => {
  const data = doc.data();
  console.log(`📄 ${data.name}`);
  console.log(`   ID: ${doc.id}`);
  console.log(`   GCS: ${data.metadata.gcsPath}`);
  console.log(`   Caracteres: ${data.metadata.charactersExtracted.toLocaleString()}`);
  console.log(`   Modelo: ${data.metadata.model}`);
  console.log(`   Costo: $${data.metadata.estimatedCost.toFixed(6)}`);
  console.log(`   Fecha: ${data.addedAt.toDate().toLocaleString()}`);
  console.log('');
});

process.exit(0);
EOF

# Ejecutar
npx tsx verificar-subida.js
```

### Paso 4: Verificar en la Webapp

1. Abre: http://localhost:3000/chat
2. Login como alec@getaifactory.com
3. Abre panel "Fuentes de Contexto"
4. Deberías ver los documentos subidos via CLI
5. Toggle ON para activarlos en un agente
6. Envía mensaje y verifica que usa el contexto

---

## 🗺️ Mapa Completo de Almacenamiento

```
📄 Documento Local: manual-producto.pdf
    ↓
    📤 UPLOAD via CLI
    ↓
┌─────────────────────────────────────────────────┐
│                                                 │
│  1️⃣  GCP STORAGE (Archivo Original)            │
│  ╔═══════════════════════════════════════╗      │
│  ║ Bucket: gen-lang-client-...-documents ║      │
│  ║ Path: {userId}/{agentId}/file.pdf     ║      │
│  ║ Tamaño: 1.24 MB                       ║      │
│  ║ MIME: application/pdf                 ║      │
│  ╚═══════════════════════════════════════╝      │
│                                                 │
│  2️⃣  FIRESTORE (Texto Extraído + Metadata)     │
│  ╔═══════════════════════════════════════╗      │
│  ║ Collection: context_sources           ║      │
│  ║ Document ID: source-abc123            ║      │
│  ║                                       ║      │
│  ║ extractedData: "Todo el texto..."     ║      │
│  ║   (15,234 caracteres completos)       ║      │
│  ║                                       ║      │
│  ║ metadata: {                           ║      │
│  ║   gcsPath: "gs://..."                 ║      │
│  ║   model: "gemini-2.5-flash"           ║      │
│  ║   charactersExtracted: 15234          ║      │
│  ║   tokensEstimate: 3809                ║      │
│  ║   estimatedCost: 0.001234             ║      │
│  ║   uploadedVia: "cli" ⭐               ║      │
│  ║ }                                     ║      │
│  ╚═══════════════════════════════════════╝      │
│                                                 │
│  3️⃣  FIRESTORE (Eventos CLI)                   │
│  ╔═══════════════════════════════════════╗      │
│  ║ Collection: cli_events                ║      │
│  ║                                       ║      │
│  ║ Event 1: cli_upload_start             ║      │
│  ║ Event 2: cli_file_uploaded            ║      │
│  ║ Event 3: cli_file_extracted           ║      │
│  ║ Event 4: cli_upload_complete          ║      │
│  ║                                       ║      │
│  ║ Cada evento tiene:                    ║      │
│  ║ - userEmail: alec@getaifactory.com ⭐ ║      │
│  ║ - source: "cli" ⭐                     ║      │
│  ║ - sessionId: "cli-session-..." ⭐     ║      │
│  ║ - timestamp, duration, costs          ║      │
│  ╚═══════════════════════════════════════╝      │
│                                                 │
│  4️⃣  FIRESTORE (Sesión CLI)                    │
│  ╔═══════════════════════════════════════╗      │
│  ║ Collection: cli_sessions              ║      │
│  ║                                       ║      │
│  ║ Session Summary:                      ║      │
│  ║ - command: "upload contextos/..."     ║      │
│  ║ - filesProcessed: 3                   ║      │
│  ║ - totalCost: $0.0041                  ║      │
│  ║ - duration: 45.3s                     ║      │
│  ║ - userEmail: alec@getaifactory.com ⭐ ║      │
│  ╚═══════════════════════════════════════╝      │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 🔗 Enlaces Directos (Consola Web)

### GCP Storage
```
https://console.cloud.google.com/storage/browser/gen-lang-client-0986191192-context-documents
```

### Firestore - Context Sources
```
https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore/data/~2Fcontext_sources
```

### Firestore - CLI Events
```
https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore/data/~2Fcli_events
```

### Firestore - CLI Sessions
```
https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore/data/~2Fcli_sessions
```

---

## 🔍 Queries Útiles

### Ver todos tus documentos subidos via CLI

```typescript
const myDocs = await firestore
  .collection('context_sources')
  .where('userId', '==', '114671162830729001607')
  .where('metadata.uploadedVia', '==', 'cli')
  .orderBy('addedAt', 'desc')
  .get();

console.log(`Tienes ${myDocs.size} documentos subidos via CLI`);
```

### Ver eventos de una sesión específica

```typescript
const sessionEvents = await firestore
  .collection('cli_events')
  .where('sessionId', '==', 'cli-session-1760917821117-s9011')
  .orderBy('timestamp', 'asc')
  .get();

console.log('Timeline de la sesión:');
sessionEvents.forEach(doc => {
  const data = doc.data();
  console.log(`${data.timestamp.toDate().toLocaleTimeString()} - ${data.eventType}`);
});
```

### Calcular costo total de tus uploads

```typescript
const sessions = await firestore
  .collection('cli_sessions')
  .where('userId', '==', '114671162830729001607')
  .get();

const totalCost = sessions.docs.reduce((sum, doc) => {
  return sum + (doc.data().totalCost || 0);
}, 0);

console.log(`Costo total CLI: $${totalCost.toFixed(4)}`);
```

---

## 📝 Formato del Log Local

**Archivo:** `salfagpt-cli-log.md` (en la raíz del proyecto)

**Contiene:**
```markdown
## Upload Session - 2025-10-19T10:30:45.123Z

**Session ID:** `cli-session-1760917821117-s9011`
**User:** alec@getaifactory.com (`114671162830729001607`)
**Source:** CLI v0.2.0

### Files Processed

| File | GCS Path | Firestore ID | Chars | Model | Cost |
|------|----------|--------------|-------|-------|------|
| manual.pdf | `gs://...` | `source-abc123` | 15,234 | flash | $0.001234 |

### Recursos en GCP

#### manual-producto.pdf
- **GCS:** gs://bucket/path/manual-producto.pdf
- **Firestore:** `context_sources/source-abc123`
- **Texto Extraído:** 15,234 caracteres
```

---

## 🎯 Verificación Completa

### Checklist después de ejecutar el CLI:

- [ ] **Terminal:** Mensaje "✅ Proceso completado!"
- [ ] **Terminal:** URLs mostradas para GCS y Firestore
- [ ] **GCS:** Archivo visible en el bucket
- [ ] **Firestore context_sources:** Documento creado con extractedData
- [ ] **Firestore cli_events:** Eventos de la sesión registrados
- [ ] **Firestore cli_sessions:** Sesión summary creado
- [ ] **Log Local:** `salfagpt-cli-log.md` actualizado con detalles
- [ ] **Webapp:** Documento visible en panel de contexto

### Si algo falla:

1. **Check Terminal Output** - Busca mensajes ❌
2. **Check salfagpt-cli-log.md** - Detalles del error
3. **Check Firestore cli_events** - Eventos de error
4. **Check Permissions** - `gcloud auth application-default login`

---

## 💡 Tips

### Ver sólo los IDs de documentos subidos hoy

```bash
npx tsx -e "
import { firestore } from './src/lib/firestore.js';

const today = new Date();
today.setHours(0, 0, 0, 0);

const docs = await firestore
  .collection('context_sources')
  .where('userId', '==', '114671162830729001607')
  .where('addedAt', '>=', today)
  .get();

console.log('Documentos subidos hoy:');
docs.forEach(doc => {
  console.log(\`- \${doc.id}: \${doc.data().name}\`);
});
process.exit(0);
"
```

### Descargar texto extraído a archivo local

```bash
npx tsx -e "
import { firestore } from './src/lib/firestore.js';
import { writeFile } from 'fs/promises';

const docId = 'source-abc123'; // Replace with actual ID

const doc = await firestore.collection('context_sources').doc(docId).get();
if (doc.exists) {
  const data = doc.data();
  await writeFile(\`extracted-\${data.name}.txt\`, data.extractedData);
  console.log('Texto guardado en:', \`extracted-\${data.name}.txt\`);
} else {
  console.log('Documento no encontrado');
}
process.exit(0);
"
```

---

## 🚀 Próximos Pasos (v0.3+)

### RAG & Embeddings

**Dónde se almacenarán:**

1. **BigQuery** - Embeddings vectors
   ```
   Dataset: flow_analytics
   Table: document_embeddings
   
   Schema: {
     chunk_id, document_id, user_id, agent_id,
     chunk_text, embedding (768 dimensions),
     metadata
   }
   ```

2. **Vertex AI Vector Search** (alternativa)
   - Index name: `flow-documents-index`
   - Namespace: por agente
   - Vectors: 768-dim embeddings

**Query de ejemplo:**
```sql
-- Buscar chunks similares
SELECT
  chunk_id,
  chunk_text,
  ML.DISTANCE(
    embedding,
    (SELECT embedding FROM query_vector)
  ) AS distance
FROM `gen-lang-client-0986191192.flow_analytics.document_embeddings`
WHERE agent_id = 'agent-M001'
ORDER BY distance ASC
LIMIT 5;
```

---

**Last Updated:** 2025-10-19  
**CLI Version:** 0.2.0  
**User:** alec@getaifactory.com

---

**Recuerda:** Todo queda en GCP. Nada se pierde. El CLI solo automatiza lo que harías manualmente en la webapp.

