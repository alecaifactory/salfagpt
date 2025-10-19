# 📊 Pipeline Visual Flow - Drag & Drop con Visibilidad Completa

## 🎨 Interfaz Visual - Context Management Dashboard

```
┌───────────────────────────────────────────────────────────────────────────┐
│  Context Management                                                    [X]│
├─────────────────────────────┬─────────────────────────────────────────────┤
│                             │                                             │
│  📤 DRAG & DROP ZONE        │  📋 SOURCE DETAILS                          │
│                             │                                             │
│  ┌─────────────────────┐    │  documento.pdf                              │
│  │     📤              │    │  Status: active                             │
│  │                     │    │                                             │
│  │  Arrastra PDFs aquí │    │  ─────────────────────────────────────     │
│  │   o haz click       │    │                                             │
│  │                     │    │  📊 Pipeline de Procesamiento               │
│  │ Múltiples archivos  │    │                                             │
│  │ Extract→Chunk→Embed │    │  ┌─────────────────────────────────────┐   │
│  │                     │    │  │  ✅  📤 Upload                       │   │
│  │  ⚡ Flash • Auto    │    │  │      Archivo guardado               │   │
│  └─────────────────────┘    │  │      • 2.5 MB                       │   │
│                             │  │      • ⏱️  1.2s                      │   │
│  📥 UPLOAD QUEUE            │  │  ┃                                   │   │
│                             │  │  ✅  📄 Extract Text                 │   │
│  ┌─────────────────────┐    │  │      12,543 caracteres extraídos   │   │
│  │ 📄 doc1.pdf         │    │  │      • Flash                        │   │
│  │ Extracting... 45%   │    │  │      • 45,231 → 3,456 tokens       │   │
│  │ ████████░░░░░░      │    │  │      • $0.000234                   │   │
│  │ ⚡ Flash            │    │  │      • ⏱️  8.7s                      │   │
│  └─────────────────────┘    │  │  ┃                                   │   │
│                             │  │  ✅  🔲 Chunk Document               │   │
│  ┌─────────────────────┐    │  │      23 chunks creados             │   │
│  │ 📄 doc2.pdf         │    │  │      • Promedio: 512 tokens        │   │
│  │ Queued              │    │  │      • ⏱️  0.3s                      │   │
│  │ ░░░░░░░░░░░░░░      │    │  │  ┃                                   │   │
│  │ ⚡ Flash            │    │  │  ✅  ⚡ Generate Embeddings          │   │
│  └─────────────────────┘    │  │      23 embeddings generados       │   │
│                             │  │      • embedding-001                │   │
│  ALL SOURCES (12)           │  │      • ⏱️  3.2s                      │   │
│                             │  │  ┃                                   │   │
│  ☑ doc1.pdf ✓              │  │  ✅  ✓ Complete                      │   │
│  ☑ doc2.pdf                │  │      Pipeline completado            │   │
│  ☐ manual.pdf              │  │  └─────────────────────────────────────┘   │
│  ☐ contrato.pdf            │  │                                             │
│  ...                        │  │  ✅ Pipeline Completo                      │
│                             │  │  Tiempo total: 13.4s                       │
│                             │  │  Costo total: $0.000234                    │
│                             │  │                                             │
│                             │  │  ─────────────────────────────────────     │
│                             │  │                                             │
│                             │  │  Asignar a Agentes (3 selected)            │
│                             │  │  ☑ Agent 1                                 │
│                             │  │  ☑ Agent 2                                 │
│                             │  │  ☐ Agent 3                                 │
│                             │  │                                             │
│                             │  │  ─────────────────────────────────────     │
│                             │  │                                             │
│                             │  │  📄 Extracted Data Preview                 │
│                             │  │  [texto extraído aquí...]                  │
│                             │  │                                             │
└─────────────────────────────┴─────────────────────────────────────────────┘
```

---

## 🔄 Flujo Técnico Completo

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         TECHNICAL FLOW                                    │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Frontend: ContextManagementDashboard.tsx                                │
│  ─────────────────────────────────────────────────────────────────       │
│                                                                          │
│  1. User drags PDF → Drag & Drop Zone                                   │
│     ├─ onDragOver: setIsDragging(true)                                  │
│     ├─ Visual: zona azul, scale-105, shadow-lg                          │
│     └─ onDrop: handleFileSelect(files)                                  │
│                                                                          │
│  2. Staging Area                                                         │
│     ├─ Preview de archivos                                              │
│     ├─ Tags (opcional)                                                   │
│     ├─ Modelo (Flash/Pro)                                               │
│     └─ Confirmar → processQueue()                                       │
│                                                                          │
│  3. processQueue() - Per File                                           │
│     │                                                                    │
│     ├─ Progress: 0% → "Queued"                                          │
│     │                                                                    │
│     ├─ POST /api/extract-document                                       │
│     │  ├─ FormData: { file, userId, model }                             │
│     │  │                                                                 │
│     │  │  Backend: extract-document.ts                                  │
│     │  │  ───────────────────────────────                               │
│     │  │                                                                 │
│     │  │  Step 1: Upload to Cloud Storage                               │
│     │  │  ├─ uploadFile(buffer, name, type)                             │
│     │  │  ├─ Log: { step: 'upload', status: 'in_progress' }             │
│     │  │  ├─ Save to gs://...                                           │
│     │  │  ├─ Duration: ~1.2s                                            │
│     │  │  └─ Log: { status: 'success', details: { fileSize, path } }   │
│     │  │                                                                 │
│     │  │  Step 2: Extract with Gemini                                   │
│     │  │  ├─ Log: { step: 'extract', status: 'in_progress' }            │
│     │  │  ├─ genAI.models.generateContent({ model, contents })          │
│     │  │  ├─ Prompt: Extrae TODO con máxima fidelidad                  │
│     │  │  ├─ Duration: ~8.7s                                            │
│     │  │  ├─ Calculate tokens & cost                                    │
│     │  │  └─ Log: { status: 'success', details: {                       │
│     │  │       model, inputTokens, outputTokens, cost                   │
│     │  │     }}                                                          │
│     │  │                                                                 │
│     │  └─ Response: {                                                   │
│     │       success: true,                                              │
│     │       extractedText: "...",                                       │
│     │       metadata: { ... },                                          │
│     │       pipelineLogs: [ upload, extract ]                           │
│     │     }                                                              │
│     │                                                                    │
│     ├─ Progress: 35% → "Processing" (extraction in progress)            │
│     │                                                                    │
│     ├─ POST /api/context-sources                                        │
│     │  ├─ Body: {                                                       │
│     │  │    userId, name, type: 'pdf',                                  │
│     │  │    extractedData,                                              │
│     │  │    metadata,                                                   │
│     │  │    pipelineLogs  ← LOGS GUARDADOS                             │
│     │  │  }                                                             │
│     │  └─ Response: { source: { id } }                                 │
│     │                                                                    │
│     ├─ Progress: 90% → "Saving to database"                             │
│     │                                                                    │
│     ├─ POST /api/context-sources/:id/enable-rag                         │
│     │  ├─ Auto-triggered after source creation                          │
│     │  │                                                                 │
│     │  │  Backend: enable-rag.ts                                        │
│     │  │  ─────────────────────                                         │
│     │  │                                                                 │
│     │  │  Step 3: Chunk the text                                        │
│     │  │  ├─ Log: { step: 'chunk', status: 'in_progress' }              │
│     │  │  ├─ chunkTextSmart(text, 500, 50)                              │
│     │  │  ├─ Duration: ~0.3s                                            │
│     │  │  └─ Log: { status: 'success', details: {                       │
│     │  │       chunkCount: 23, avgChunkSize: 512                        │
│     │  │     }}                                                          │
│     │  │                                                                 │
│     │  │  Step 4: Generate Embeddings                                   │
│     │  │  ├─ Log: { step: 'embed', status: 'in_progress' }              │
│     │  │  ├─ generateEmbeddingsBatch(chunkTexts, 5)                     │
│     │  │  ├─ Parallel processing (5 at a time)                          │
│     │  │  ├─ Duration: ~3.2s                                            │
│     │  │  └─ Log: { status: 'success', details: {                       │
│     │  │       embeddingCount: 23, embeddingModel                       │
│     │  │     }}                                                          │
│     │  │                                                                 │
│     │  │  Step 5: Store in Firestore                                    │
│     │  │  ├─ Batches of 500 chunks                                      │
│     │  │  ├─ Collection: document_chunks                                │
│     │  │  └─ Duration: ~0.8s                                            │
│     │  │                                                                 │
│     │  │  Step 6: Update source metadata                                │
│     │  │  ├─ ragEnabled: true                                           │
│     │  │  ├─ ragMetadata: { chunks, model, ... }                        │
│     │  │  ├─ pipelineLogs: [...existingLogs, chunk, embed, complete]   │
│     │  │  └─ Save to Firestore                                          │
│     │  │                                                                 │
│     │  └─ Response: {                                                   │
│     │       success: true,                                              │
│     │       chunksCreated: 23,                                          │
│     │       pipelineLogs: [ upload, extract, chunk, embed, complete ]   │
│     │     }                                                              │
│     │                                                                    │
│     └─ Progress: 100% → "Complete" ✅                                   │
│                                                                          │
│  4. User clicks on source                                               │
│     └─ Right panel shows PipelineStatusPanel                            │
│        └─ Visual timeline with all 5 steps                              │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Estados Visuales del Drag & Drop

### Estado 1: Normal (Esperando archivo)

```css
border: 2px dashed gray-300
background: white
hover: border-gray-400, bg-gray-50
```

```
┌─────────────────────────────────────┐
│           📤                        │
│    Arrastra PDFs aquí o haz click   │
│                                     │
│    Múltiples archivos •             │
│    Extract → Chunk → Embed          │
│                                     │
│    ⚡ Flash  •  Pipeline automático │
└─────────────────────────────────────┘
```

### Estado 2: Dragging (Archivo sobre la zona)

```css
border: 2px dashed blue-500
background: blue-50
transform: scale(1.05)
shadow: shadow-lg
```

```
╔═════════════════════════════════════╗
║           📤  (AZUL, GRANDE)        ║
║   ¡Suelta los archivos aquí!        ║
║                                     ║
║    (Zona azul, más grande)          ║
║    (Animación de escala)            ║
║                                     ║
║    ⚡ Flash  •  Pipeline automático ║
╚═════════════════════════════════════╝
```

### Estado 3: Processing (Archivo en cola)

```
┌─────────────────────────────────────┐
│  📄 documento.pdf        🔄 8.5s    │
│  Extracting...                      │
│  ████████░░░░░░░░░░ 45%             │
│  ⚡ Flash                           │
└─────────────────────────────────────┘
```

### Estado 4: Complete (Pipeline finalizado)

```
┌─────────────────────────────────────┐
│  📄 documento.pdf        ✓ 13.4s   │
│  Complete                           │
│  ██████████████████ 100%            │
│  ⚡ Flash                           │
└─────────────────────────────────────┘
```

---

## 📊 Pipeline Status Panel - Visual Timeline

```
┌───────────────────────────────────────────────────────────────┐
│  📄 Pipeline de Procesamiento                                 │
│     documento.pdf                                             │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  ✅  📤 Upload                               ⏱️  1.2s    │ │
│  │      Archivo guardado exitosamente en Cloud Storage     │ │
│  │      • Tamaño: 2.5 MB                                   │ │
│  │      • Storage: uploads/abc123.pdf                      │ │
│  └─────────────────────────────────────────────────────────┘ │
│  ┃ (línea verde conectora)                                   │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  ✅  📄 Extract Text                         ⏱️  8.7s    │ │
│  │      Texto extraído: 12,543 caracteres                  │ │
│  │      • Modelo: Flash                                    │ │
│  │      • Input: 45,231 tokens                             │ │
│  │      • Output: 3,456 tokens                             │ │
│  │      • 💲 Costo: $0.000234                              │ │
│  └─────────────────────────────────────────────────────────┘ │
│  ┃                                                            │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  ✅  🔲 Chunk Document                       ⏱️  0.3s    │ │
│  │      Documento dividido en 23 chunks                    │ │
│  │      • Chunks: 23                                       │ │
│  │      • Promedio: 512 tokens                             │ │
│  └─────────────────────────────────────────────────────────┘ │
│  ┃                                                            │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  ✅  ⚡ Generate Embeddings                  ⏱️  3.2s    │ │
│  │      23 embeddings generados exitosamente               │ │
│  │      • Embeddings: 23                                   │ │
│  │      • Modelo: embedding-001                            │ │
│  └─────────────────────────────────────────────────────────┘ │
│  ┃                                                            │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  ✅  ✓ Complete                                          │ │
│  │      Pipeline completado exitosamente                   │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  ✅ Pipeline Completo                                    │ │
│  │                                                          │ │
│  │  Tiempo total: 13.4s                                    │ │
│  │  Costo total: $0.000234                                 │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

---

## 🎨 Paleta de Colores por Estado

### Upload Step
```css
• Icon: Upload (blue-600)
• Border success: green-500
• Background success: green-50
• In progress: blue-500, blue-50, animate-pulse
```

### Extract Step
```css
• Icon: FileText (purple-600)
• Model Flash: green-700, green-100
• Model Pro: purple-700, purple-100
• Cost: gray-900 (destacado)
```

### Chunk Step
```css
• Icon: Grid (indigo-600)
• Metrics: gray-700
• Success: green indicators
```

### Embed Step
```css
• Icon: Zap (yellow-600)
• Progress: blue-500
• Success: green-500
```

### Complete Step
```css
• Icon: CheckCircle (green-600)
• Background: gradient green-50 to emerald-50
• Border: green-200
```

---

## 📐 Responsive Design

### Desktop (>1024px)
```
┌────────────┬────────────┐
│  Sources   │  Details   │
│  (50%)     │  (50%)     │
│            │            │
│  Drag Zone │  Pipeline  │
│  Upload Q  │  Status    │
│  Sources   │  Preview   │
└────────────┴────────────┘
```

### Tablet (768-1024px)
```
┌────────────┬────────────┐
│  Sources   │  Details   │
│  (40%)     │  (60%)     │
│            │            │
│  Compact   │  Pipeline  │
│  List      │  Expanded  │
└────────────┴────────────┘
```

### Mobile (<768px)
```
┌──────────────────────┐
│  Sources (full)      │
│                      │
│  Drag Zone           │
│  Upload Queue        │
│  Sources List        │
└──────────────────────┘
   ↓ (tap on source)
┌──────────────────────┐
│  Details (modal)     │
│                      │
│  Pipeline Status     │
│  Preview             │
└──────────────────────┘
```

---

## 🔍 Interacciones del Usuario

### 1. Drag & Drop

```javascript
Event: onDragOver
├─ e.preventDefault()
├─ setIsDragging(true)
└─ Visual: zona se pone azul y crece

Event: onDragLeave
├─ setIsDragging(false)
└─ Visual: zona vuelve a normal

Event: onDrop
├─ e.preventDefault()
├─ setIsDragging(false)
├─ files = e.dataTransfer.files
└─ handleFileSelect(files)
```

### 2. Revisar Staging

```javascript
handleFileSelect(files)
├─ setStagedFiles([...files])
├─ setShowUploadStaging(true)
└─ Modal muestra:
    ├─ Preview de archivos (nombre, tamaño)
    ├─ Input de tags
    ├─ Selector de modelo
    └─ Botones: [Cancelar] [Upload]
```

### 3. Confirmar Upload

```javascript
handleSubmitUpload()
├─ Para cada archivo staged:
│  ├─ Crear UploadQueueItem
│  ├─ Agregar a uploadQueue
│  └─ mostrar en UI
├─ setShowUploadStaging(false)
└─ processQueue(queueItems)
```

### 4. Ver Pipeline Details

```javascript
Click en source card
├─ setSelectedSourceIds([sourceId])
└─ Panel derecho muestra:
    ├─ Source metadata
    ├─ Pipeline Status Panel ← NUEVO
    │  └─ Timeline de 5 pasos
    ├─ Agent assignment
    └─ Extracted data preview
```

---

## 💾 Persistencia en Firestore

### Collection: context_sources

```typescript
{
  id: 'source-abc123',
  userId: 'user-456',
  name: 'documento.pdf',
  type: 'pdf',
  status: 'active',
  extractedData: '...',
  
  // ✅ NUEVO: Pipeline execution logs
  pipelineLogs: [
    {
      step: 'upload',
      status: 'success',
      startTime: Timestamp,
      endTime: Timestamp,
      duration: 1200, // ms
      message: 'Archivo guardado exitosamente',
      details: {
        fileSize: 2621440,
        storagePath: 'uploads/abc123.pdf'
      }
    },
    {
      step: 'extract',
      status: 'success',
      startTime: Timestamp,
      endTime: Timestamp,
      duration: 8700,
      message: 'Texto extraído: 12,543 caracteres',
      details: {
        model: 'gemini-2.5-flash',
        inputTokens: 45231,
        outputTokens: 3456,
        charactersExtracted: 12543,
        cost: 0.000234
      }
    },
    {
      step: 'chunk',
      status: 'success',
      startTime: Timestamp,
      endTime: Timestamp,
      duration: 300,
      message: 'Documento dividido en 23 chunks',
      details: {
        chunkCount: 23,
        avgChunkSize: 512
      }
    },
    {
      step: 'embed',
      status: 'success',
      startTime: Timestamp,
      endTime: Timestamp,
      duration: 3200,
      message: '23 embeddings generados',
      details: {
        embeddingCount: 23,
        embeddingModel: 'embedding-001'
      }
    },
    {
      step: 'complete',
      status: 'success',
      startTime: Timestamp,
      endTime: Timestamp,
      duration: 0,
      message: 'Pipeline completado exitosamente'
    }
  ],
  
  ragEnabled: true,
  ragMetadata: {
    totalChunks: 23,
    embeddingModel: 'text-embedding-004',
    indexedAt: Timestamp,
    // ...
  }
}
```

---

## 🚀 Performance Optimizations

### Upload Phase
- Validación local antes de enviar (tipo, tamaño)
- Progress updates cada 200ms (smooth)
- Retry automático en caso de fallo

### Extraction Phase
- Dynamic `maxOutputTokens` basado en tamaño de archivo
- Parallel processing si múltiples archivos
- Timeout de 60s (Cloud Run)

### Chunking Phase
- Algoritmo optimizado O(n)
- Respeta límites de párrafos
- Overlap configurable

### Embedding Phase
- Batch processing (5 embeddings en paralelo)
- Rate limiting incorporado
- Firestore batches de 500 (performance)

---

## 📈 Métricas Típicas

### PDF Pequeño (1-2 MB, ~10 páginas)

```
Upload:    ~1s
Extract:   ~5-8s (Flash) / ~8-12s (Pro)
Chunk:     ~0.2s (10-20 chunks)
Embed:     ~1-2s
Total:     ~7-12s

Costo:     ~$0.0001-$0.0003 (Flash)
           ~$0.002-$0.005 (Pro)
```

### PDF Mediano (5-10 MB, ~50 páginas)

```
Upload:    ~2s
Extract:   ~15-25s (Flash) / ~20-35s (Pro)
Chunk:     ~0.5s (40-80 chunks)
Embed:     ~4-8s
Total:     ~22-35s

Costo:     ~$0.0005-$0.001 (Flash)
           ~$0.008-$0.015 (Pro)
```

### PDF Grande (>10 MB, 100+ páginas)

```
Upload:    ~3-5s
Extract:   ~30-50s (Flash) / ~40-60s (Pro)
Chunk:     ~1s (100-200 chunks)
Embed:     ~10-20s
Total:     ~45-75s

Costo:     ~$0.001-$0.003 (Flash)
           ~$0.015-$0.030 (Pro)

⚠️  Recomendación: Usar Pro para mejor calidad
```

---

## 🎯 UX Highlights

### Feedback Inmediato
- ✅ Drag visual feedback (<50ms)
- ✅ Progress bar smooth (updates cada 200ms)
- ✅ Elapsed time en tiempo real
- ✅ Estado de cada paso visible

### Información Transparente
- ✅ Modelo usado mostrado
- ✅ Tokens y costos calculados
- ✅ Duración de cada paso
- ✅ Métricas detalladas

### Error Handling
- ✅ Mensajes de error claros
- ✅ Sugerencias de solución
- ✅ Botón de retry
- ✅ Logs de error persistidos

---

**Última Actualización**: 2025-10-18  
**Implementado por**: Alec  
**Testeado**: Pendiente (próximo paso: testing en localhost)

