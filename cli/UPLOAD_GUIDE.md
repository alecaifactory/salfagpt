# 📤 CLI Batch Upload - Guía Completa

**Creado:** 2025-11-18  
**Versión:** 0.2.0

---

## 🎯 ¿Qué hace?

El comando `upload` permite cargar múltiples documentos PDF de una carpeta directamente al sistema SalfaGPT, ejecutando todo el pipeline de procesamiento:

1. ✅ **Upload a Cloud Storage** - Guarda archivos en GCS
2. ✅ **Extracción con Gemini AI** - Extrae texto completo
3. ✅ **Guardado en Firestore** - Almacena metadata y contenido
4. ✅ **Chunking + Embeddings** - Prepara para RAG (búsqueda semántica)
5. ✅ **Asignación a Agente** - Asigna y activa en agente específico
6. ✅ **Test Query** (opcional) - Verifica que la búsqueda funcione

---

## 🚀 Uso Básico

```bash
npx tsx cli/commands/upload.ts \
  --folder=/path/to/folder \
  --tag=TAG-NAME \
  --agent=AGENT_ID \
  --user=USER_ID \
  --email=user@example.com
```

### Parámetros Requeridos

| Parámetro | Descripción | Ejemplo |
|-----------|-------------|---------|
| `--folder` | Ruta a carpeta con PDFs | `/Users/alec/docs/S001` |
| `--tag` | Etiqueta para agrupar documentos | `S001-20251118-1545` |
| `--agent` | ID del agente receptor | `TestApiUpload_S001` |
| `--user` | ID de usuario (Google UID) | `114671162830729001607` |
| `--email` | Email del usuario | `alec@getaifactory.com` |

### Parámetros Opcionales

| Parámetro | Descripción | Default | Valores |
|-----------|-------------|---------|---------|
| `--model` | Modelo de Gemini | `gemini-2.5-flash` | `flash` o `pro` |
| `--test` | Pregunta de prueba | _(none)_ | Cualquier pregunta |

---

## 📋 Ejemplo Real

```bash
npx tsx cli/commands/upload.ts \
  --folder=/Users/alec/salfagpt/upload-queue/salfacorp/S001-20251118 \
  --tag=S001-20251118-1545 \
  --agent=TestApiUpload_S001 \
  --user=114671162830729001607 \
  --email=alec@getaifactory.com \
  --model=gemini-2.5-flash \
  --test="¿Cuáles son los requisitos de seguridad?"
```

### Salida Esperada

```
🚀 SalfaGPT CLI - Batch Document Upload
═══════════════════════════════════════

📋 Configuration:
   📁 Folder: /Users/alec/salfagpt/upload-queue/salfacorp/S001-20251118
   🏷️  Tag: S001-20251118-1545
   🤖 Agent: TestApiUpload_S001
   👤 User: 114671162830729001607 (alec@getaifactory.com)
   ⚡ Model: gemini-2.5-flash
   🔑 Session: cli-upload-1700312345-abc123xyz

📦 Checking GCS bucket...
✅ Bucket ready

📂 Scanning folder for PDFs...
✅ Found 3 PDF files

============================================================
📄 File 1/3: Manual_Seguridad_SSOMA.pdf
============================================================

📤 Paso 1/5: Subiendo a Cloud Storage...
   📤 100.0% (2.45 MB/2.45 MB)
   ✅ Subido en 1.2s: gs://bucket/path/to/file.pdf

🤖 Paso 2/5: Extrayendo contenido con Gemini AI...
   🤖 Extrayendo con gemini-2.5-flash...
   📄 Leyendo archivo: /path/to/file.pdf
   📊 Tamaño: 2456.32 KB
   🔄 Enviando a Gemini AI...
   ✅ Extracción completa en 8.3s
   📝 124,523 caracteres extraídos
   🎯 ~31,131 tokens estimados
   💰 Costo estimado: $0.004671
   👁️  Preview: MANUAL DE SEGURIDAD Y SALUD OCUPACIONAL...

💾 Paso 3/5: Guardando en Firestore...
   ✅ Guardado como: source-abc123xyz (0.3s)

🧬 Paso 4/5: Procesando para RAG (chunking + embeddings)...
   🔬 Paso 4/5: Preparando para RAG (Retrieval-Augmented Generation)...
   📐 Chunking text (max 1000 tokens/chunk)...
   ✅ Created 45 chunks
   🧬 Generating embeddings for 45 chunks...
   ✅ Embeddings generated in 2.1s
   💾 Storing embeddings in vector database...
   ✅ 45 embeddings stored successfully
   ✅ Paso 4/5: RAG process completado en 3.2s

📝 Paso 5/5: Actualizando metadata RAG...
   ✅ Metadata actualizada

🔗 Asignando a agente...
   ✅ Asignado y activado en agente: TestApiUpload_S001

✅ Manual_Seguridad_SSOMA.pdf uploaded successfully
   ⏱️  Total time: 13.1s

[... repite para archivos 2 y 3 ...]

═══════════════════════════════════════════════════════════
📊 RESUMEN DE CARGA
═══════════════════════════════════════════════════════════

📁 Total de archivos: 3
✅ Exitosos: 3 (100.0%)
❌ Fallidos: 0
⏱️  Tiempo total: 42.5s
💰 Costo estimado: $0.0142

✅ Archivos Exitosos:
   --------------------------------------------------------
   📄 Manual_Seguridad_SSOMA.pdf
      🆔 Source ID: source-abc123
      📝 Chars: 124,523
      📐 Chunks: 45
      🧬 Embeddings: 45
      ⏱️  Duration: 13.1s

   📄 Procedimiento_Emergencias.pdf
      🆔 Source ID: source-def456
      📝 Chars: 89,342
      📐 Chunks: 32
      🧬 Embeddings: 32
      ⏱️  Duration: 11.2s

   📄 Plan_Evacuacion_2024.pdf
      🆔 Source ID: source-ghi789
      📝 Chars: 67,890
      📐 Chunks: 24
      🧬 Embeddings: 24
      ⏱️  Duration: 9.8s

═══════════════════════════════════════════════════════════

📝 Running test query...

📝 Test Query:
   🔍 Pregunta: "¿Cuáles son los requisitos de seguridad?"

   🔍 Buscando chunks relevantes...
   ✅ Encontrados 5 chunks en 0.42s

   📄 Top 3 Chunks Relevantes:

   1. Manual_Seguridad_SSOMA.pdf (similarity: 89.3%)
      Los requisitos de seguridad para personal en faena incluyen: 
      uso obligatorio de EPP (casco, zapatos de seguridad, lentes...

   2. Procedimiento_Emergencias.pdf (similarity: 85.7%)
      Todo el personal debe cumplir con los siguientes requisitos 
      mínimos de seguridad: capacitación en primeros auxilios...

   3. Plan_Evacuacion_2024.pdf (similarity: 82.1%)
      Los requisitos de seguridad en caso de evacuación son:
      1) Conocer rutas de escape 2) Identificar puntos de encuentro...

   🤖 Generando respuesta con Gemini...

   💬 Respuesta del AI:

   --------------------------------------------------------
   Según los documentos de seguridad de Salfacorp, los 
   requisitos principales de seguridad incluyen:

   1. **Equipos de Protección Personal (EPP):**
      - Casco de seguridad
      - Zapatos de seguridad con punta de acero
      - Lentes de protección
      - Guantes según la tarea

   2. **Capacitación Obligatoria:**
      - Inducción de seguridad
      - Primeros auxilios básicos
      - Procedimientos de emergencia

   3. **Conocimiento de Evacuación:**
      - Identificar rutas de escape
      - Conocer puntos de encuentro
      - Participar en simulacros

   Todos estos requisitos están documentados en el Manual 
   SSOMA y son de cumplimiento obligatorio para todo el 
   personal que trabaja en faena.
   --------------------------------------------------------

✅ Upload completed successfully!
```

---

## 📊 ¿Qué se Guarda?

### 1. Cloud Storage (GCS)
- **Bucket:** `{project-id}-context-documents`
- **Path:** `{userId}/{agentId}/{fileName}`
- **Metadata:** uploadedBy, uploadedVia, agentId, originalFileName

### 2. Firestore - `context_sources`
```json
{
  "id": "source-abc123",
  "userId": "114671162830729001607",
  "name": "Manual_Seguridad_SSOMA.pdf",
  "type": "pdf",
  "enabled": true,
  "status": "active",
  "addedAt": "2025-11-18T10:30:00Z",
  "extractedData": "MANUAL DE SEGURIDAD...",
  "originalFileUrl": "gs://bucket/path/file.pdf",
  "tags": ["S001-20251118-1545"],
  "assignedToAgents": ["TestApiUpload_S001"],
  "ragEnabled": true,
  "ragMetadata": {
    "chunkCount": 45,
    "avgChunkSize": 692,
    "indexedAt": "2025-11-18T10:30:15Z",
    "embeddingModel": "text-embedding-004",
    "processingTime": 3200
  },
  "useRAGMode": true,
  "metadata": {
    "originalFileName": "Manual_Seguridad_SSOMA.pdf",
    "originalFileSize": 2515763,
    "extractionDate": "2025-11-18T10:30:08Z",
    "extractionTime": 8300,
    "model": "gemini-2.5-flash",
    "charactersExtracted": 124523,
    "tokensEstimate": 31131,
    "inputTokens": 15000,
    "outputTokens": 31131,
    "estimatedCost": 0.004671,
    "uploadedVia": "cli",
    "uploadedBy": "alec@getaifactory.com",
    "sessionId": "cli-upload-1700312345-abc123xyz"
  }
}
```

### 3. Firestore - `document_embeddings`
```json
{
  "id": "embedding-xyz789",
  "sourceId": "source-abc123",
  "sourceName": "Manual_Seguridad_SSOMA.pdf",
  "userId": "114671162830729001607",
  "agentId": "TestApiUpload_S001",
  "chunkIndex": 0,
  "text": "MANUAL DE SEGURIDAD Y SALUD OCUPACIONAL...",
  "embedding": [0.123, -0.456, 0.789, ...],  // 768 dimensions
  "tokenCount": 692,
  "model": "text-embedding-004",
  "uploadedVia": "cli",
  "userEmail": "alec@getaifactory.com",
  "createdAt": "2025-11-18T10:30:15Z"
}
```

### 4. Analytics - `cli_events`
```json
{
  "eventType": "cli_file_uploaded",
  "userId": "114671162830729001607",
  "userEmail": "alec@getaifactory.com",
  "source": "cli",
  "cliVersion": "0.2.0",
  "operation": "upload",
  "fileName": "Manual_Seguridad_SSOMA.pdf",
  "agentId": "TestApiUpload_S001",
  "success": true,
  "duration": 13100,
  "model": "gemini-2.5-flash",
  "inputTokens": 15000,
  "outputTokens": 31131,
  "estimatedCost": 0.004671,
  "gcsPath": "gs://bucket/path/file.pdf",
  "firestoreDocId": "source-abc123",
  "timestamp": "2025-11-18T10:30:15Z",
  "sessionId": "cli-upload-1700312345-abc123xyz",
  "hostname": "cli-machine",
  "nodeVersion": "v20.10.0",
  "platform": "darwin"
}
```

### 5. Analytics - `cli_sessions`
```json
{
  "id": "cli-upload-1700312345-abc123xyz",
  "userId": "114671162830729001607",
  "userEmail": "alec@getaifactory.com",
  "command": "upload --folder=/path --tag=S001 --agent=TestApiUpload_S001",
  "startedAt": "2025-11-18T10:30:00Z",
  "endedAt": "2025-11-18T10:30:42Z",
  "duration": 42500,
  "eventsCount": 3,
  "success": true,
  "cliVersion": "0.2.0"
}
```

---

## 🔍 Cómo Funciona el RAG

### Chunking Inteligente
```typescript
// Dividir por párrafos primero
paragraphs = text.split(/\n\n+/)

// Si un párrafo es muy largo, dividir por oraciones
if (paragraph.tokens > 1000) {
  sentences = paragraph.split(/\. /)
}

// Resultado: chunks de ~1000 tokens
// Ejemplo: 124,523 chars → 45 chunks
```

### Embeddings
```typescript
// Cada chunk → vector de 768 dimensiones
chunk = "Los requisitos de seguridad incluyen..."
embedding = [0.123, -0.456, 0.789, ...]  // 768 floats

// Modelo: text-embedding-004 (Google)
// Costo: $0.00002 por 1K tokens
```

### Búsqueda Semántica
```typescript
// 1. Convertir query a embedding
query = "¿Cuáles son los requisitos de seguridad?"
queryEmbedding = generateEmbedding(query)

// 2. Calcular similitud coseno con todos los chunks
similarity = cosineSimilarity(queryEmbedding, chunkEmbedding)

// 3. Ordenar y devolver top 5
topChunks = chunks.sort(by: similarity).take(5)

// 4. Usar como contexto para AI
context = topChunks.map(c => c.text).join('\n\n')
aiResponse = gemini.generateContent(context + query)
```

---

## 💰 Costos Estimados

### Por Archivo (promedio)

| Operación | Tokens | Costo | % Total |
|-----------|--------|-------|---------|
| Extracción Gemini (input) | ~15,000 | $0.0011 | 24% |
| Extracción Gemini (output) | ~31,000 | $0.0093 | 66% |
| Embeddings (45 chunks) | ~31,000 | $0.0006 | 10% |
| **Total por archivo** | - | **$0.0110** | 100% |

### Por Batch (ejemplo: 3 archivos)
- **Total:** ~$0.033
- **Storage GCS:** Negligible (~$0.0001)
- **Firestore writes:** Incluido en free tier

### Modelos Disponibles

| Modelo | Input | Output | Velocidad | Calidad |
|--------|-------|--------|-----------|---------|
| `gemini-2.5-flash` | $0.075/M | $0.30/M | ⚡⚡⚡ Rápido | ✅ Buena |
| `gemini-2.5-pro` | $1.25/M | $5.00/M | 🐢 Lento | ⭐⭐⭐ Excelente |

**Recomendación:** Usar `flash` para la mayoría de casos. Usar `pro` solo para documentos complejos con tablas, diagramas o texto difícil.

---

## 🛠️ Troubleshooting

### Error: "GOOGLE_AI_API_KEY not configured"
```bash
# Verificar .env
cat .env | grep GOOGLE_AI_API_KEY

# Debe contener:
GOOGLE_AI_API_KEY=AIzaSy...
```

### Error: "Bucket not found"
```bash
# Verificar proyecto GCP
cat .env | grep GOOGLE_CLOUD_PROJECT

# Debe contener:
GOOGLE_CLOUD_PROJECT=gen-lang-client-0986191192
```

### Error: "Agent not found"
El agente debe existir primero en Firestore. Crear desde la UI o verificar el ID.

### Error: "Permission denied"
```bash
# Verificar credenciales GCP
gcloud auth application-default login

# O usar service account
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

### Archivos Fallidos
Si algunos archivos fallan:
1. Revisar el resumen de errores
2. Verificar que el PDF no esté corrupto
3. Intentar con `--model=gemini-2.5-pro` (mejor OCR)
4. Revisar permisos de lectura del archivo

---

## 📈 Monitoreo

### Ver eventos en Firestore Console
```
Firestore → Collections → cli_events
Firestore → Collections → cli_sessions
```

### Query de ejemplo (Firebase Console)
```javascript
// Todos los uploads del día
db.collection('cli_events')
  .where('eventType', '==', 'cli_file_uploaded')
  .where('timestamp', '>=', new Date('2025-11-18'))
  .orderBy('timestamp', 'desc')
  .get()
```

### Métricas útiles
- **Success rate:** `filesSucceeded / filesProcessed`
- **Avg duration:** `totalDuration / filesProcessed`
- **Cost per file:** `totalCost / filesProcessed`
- **Error rate by type:** Group by `errorMessage`

---

## 🚀 Próximas Mejoras

### Versión 0.3.0 (próximamente)
- [ ] Retry automático en caso de fallo
- [ ] Progress bar visual (en vez de logs)
- [ ] Soporte para DOCX, XLSX, TXT
- [ ] Paralelización (3 archivos simultáneos)
- [ ] Config file (`.salfagptrc.json`)
- [ ] Dry-run mode (`--dry-run`)

### Versión 0.4.0 (futuro)
- [ ] Interactive mode (select files)
- [ ] Resume from checkpoint
- [ ] Webhook notifications
- [ ] S3 source (upload from S3 to GCS)
- [ ] Auto-tagging by folder structure

---

## 📚 Documentación Relacionada

- [RAG & Embeddings Guide](./RAG_EMBEDDINGS_GUIDE.md)
- [CLI Analytics](./ANALYTICS.md)
- [Context Management Architecture](../docs/AGENT_VS_CONVERSATION_ARCHITECTURE_2025-10-21.md)
- [PUBLIC Tag Implementation](../PUBLIC_TAG_IMPLEMENTATION.md)

---

## 💡 Casos de Uso

### 1. Onboarding de Cliente Nuevo
```bash
# Upload todos los manuales del cliente
npx tsx cli/commands/upload.ts \
  --folder=/datos/clientes/acme-corp/manuales \
  --tag=ACME-ONBOARDING-2025 \
  --agent=ACME_Support_Agent \
  --user=YOUR_USER_ID \
  --email=you@company.com
```

### 2. Update de Procedimientos SSOMA
```bash
# Upload nuevos procedimientos SSOMA
npx tsx cli/commands/upload.ts \
  --folder=/datos/ssoma/2025/Q4 \
  --tag=SSOMA-2025-Q4 \
  --agent=SSOMA_Expert \
  --user=YOUR_USER_ID \
  --email=you@company.com \
  --test="¿Cuáles son los nuevos procedimientos de seguridad?"
```

### 3. Documentación de Proyecto
```bash
# Upload documentación técnica
npx tsx cli/commands/upload.ts \
  --folder=/proyectos/puente-xyz/documentos \
  --tag=PUENTE-XYZ-DOCS \
  --agent=Project_XYZ_Agent \
  --user=YOUR_USER_ID \
  --email=you@company.com \
  --model=gemini-2.5-pro
```

---

**Versión:** 0.2.0  
**Autor:** Alec Dickinson (alec@getaifactory.com)  
**Fecha:** 2025-11-18  
**Licencia:** Proprietary - SalfaGPT

