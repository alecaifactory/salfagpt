# 📋 Plan: Optimización + Auto-RAG en Bulk Upload

**Fecha:** 18 de Octubre, 2025  
**Estado:** 🎯 PLAN COMPLETO

---

## 🎯 Objetivos

### 1. Optimizar Proceso de Indexado (Reduce tiempo)

**Problema actual:**
- 155 chunks = ~23 segundos
- 65 chunks = ~23 segundos
- 74 chunks = ~31 segundos

**Tiempo similar independiente de chunks** → Problema de rate limiting o latencia

### 2. Integrar RAG Automático en Bulk Upload

**Flujo deseado:**
```
Usuario sube archivos en bulk (5 PDFs)
  ↓
Por cada archivo:
  1. Upload a Cloud Storage
  2. Extraer texto con Gemini
  3. Chunking automático
  4. Embeddings automáticos
  5. Save en Firestore
  ↓
Resultado: 5 documentos listos con RAG habilitado
```

---

## 🚀 Optimizaciones Propuestas

### Optimización 1: Batch Embeddings en Paralelo

**Actual (secuencial):**
```typescript
for (const chunk of chunks) {
  const embedding = await generateEmbedding(chunk.text);  // Espera cada uno
  batch.set(...);
}
```

**Optimizado (paralelo):**
```typescript
// Generate all embeddings in parallel
const embeddingPromises = chunks.map(chunk => 
  generateEmbedding(chunk.text)
);
const embeddings = await Promise.all(embeddingPromises);

// Then save all at once
chunks.forEach((chunk, idx) => {
  batch.set(..., embedding: embeddings[idx]);
});
```

**Ahorro estimado:** 50-70% del tiempo

---

### Optimización 2: Usar Texto Existente (No Re-extraer)

**Actual:**
```
Re-indexar:
  1. Descarga archivo (2s)
  2. Re-extrae con Gemini (40-160s) ← LENTO
  3. Chunk (1s)
  4. Embeddings (23s)
```

**Optimizado:**
```
Re-indexar:
  1. Usa extractedData existente (0s)  ← SKIP re-extracción
  2. Chunk (1s)
  3. Embeddings (23s)
```

**Ahorro:** ~40-160 segundos (solo re-extrae si se pide explícitamente)

---

### Optimización 3: Aumentar Batch Size

**Actual:**
```
Batch size: 10 chunks
Delay entre batches: 100ms
```

**Optimizado:**
```
Batch size: 20 chunks (más embeddings en paralelo)
Delay entre batches: 50ms (menos espera)
```

**Ahorro:** ~30% del tiempo

---

## 📦 Auto-RAG en Bulk Upload

### Flujo Nuevo (Integrado)

```
Usuario en Context Management:
  1. Select múltiples PDFs
  2. Choose tags (ej: "PUBLIC")
  3. Choose model (Flash/Pro)
  4. Click "Upload"
  ↓
Por cada archivo (en paralelo hasta 3 simultáneos):
  
  Archivo 1:
  [████░░░░░░] 40% - Extrayendo con Gemini...
  
  Archivo 2:
  [██████░░░░] 60% - Generando embeddings (batch 3/7)...
  
  Archivo 3:
  [█░░░░░░░░░] 10% - Subiendo a Cloud Storage...
  
  ↓
  
Resultado final:
  ✅ 3 archivos subidos
  ✅ 3 archivos extraídos
  ✅ 3 archivos indexados con RAG
  ✅ Listos para usar
```

---

### Interface de Upload Queue

**Antes (solo extracción):**
```
Upload Queue (3)

┌────────────────────────────────────────┐
│ 📄 Document1.pdf                       │
│ [██████████] 100% - Completado         │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ 📄 Document2.pdf                       │
│ [████████░░] 80% - Extrayendo...       │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ 📄 Document3.pdf                       │
│ [██░░░░░░░░] 20% - En cola...          │
└────────────────────────────────────────┘
```

**Ahora (extracción + RAG):**
```
Upload Queue (3)

┌────────────────────────────────────────┐
│ 📄 Document1.pdf                       │
│ [██████████] 100% ✅                   │
│ ✓ Subido  ✓ Extraído  ✓ Indexado     │
│ 🔍 74 chunks creados                   │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ 📄 Document2.pdf                       │
│ [██████░░░░] 65%                       │
│ ✓ Subido  ✓ Extraído  ⟳ Indexando... │
│ Generando embeddings (batch 4/8)...   │
│ ✓ Guardados 30/74 chunks               │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ 📄 Document3.pdf                       │
│ [███░░░░░░░] 30%                       │
│ ✓ Subido  ⟳ Extrayendo...  ○ Pendiente│
│ Procesando con Gemini AI...            │
└────────────────────────────────────────┘
```

**Detalle expandible por archivo:**
```
[˅] Ver detalles

[17:40:22] Upload started
[17:40:23] Uploaded to Cloud Storage (5.91 MB)
[17:40:24] Extraction started
[17:41:32] Extraction complete (235,346 chars)
[17:41:33] Chunking: 74 chunks created
[17:41:34] Indexing started
[17:41:35] Batch 1/8: Processing chunks 1-10...
[17:41:36] Batch 1/8: ✓ Saved 10/74
... (continúa)
```

---

## 🔧 Implementación

### Paso 1: Optimizar rag-indexing.ts

```typescript
// src/lib/rag-indexing.ts

// NEW: Parallel embeddings
async function generateEmbeddingsInParallel(
  chunks: TextChunk[],
  maxParallel: number = 5
): Promise<number[][]> {
  const results: number[][] = [];
  
  for (let i = 0; i < chunks.length; i += maxParallel) {
    const batch = chunks.slice(i, i + maxParallel);
    const embeddings = await Promise.all(
      batch.map(chunk => generateEmbedding(chunk.text))
    );
    results.push(...embeddings);
  }
  
  return results;
}

// Update chunkAndIndexDocument to use parallel
export async function chunkAndIndexDocument(options: IndexingOptions) {
  const chunks = chunkText(text, chunkSize, overlap);
  
  // Generate ALL embeddings in parallel (5 at a time)
  const embeddings = await generateEmbeddingsInParallel(chunks, 5);
  
  // Then save in batches
  for (let i = 0; i < chunks.length; i += 10) {
    const batch = firestore.batch();
    chunks.slice(i, i + 10).forEach((chunk, idx) => {
      batch.set(..., embedding: embeddings[i + idx]);
    });
    await batch.commit();
  }
}
```

**Resultado:** ~50% más rápido

---

### Paso 2: Crear endpoint bulk-upload-with-rag

```typescript
// src/pages/api/context-sources/bulk-upload-with-rag.ts

export const POST: APIRoute = async ({ request }) => {
  const formData = await request.formData();
  const files = formData.getAll('files') as File[];
  const userId = formData.get('userId') as string;
  const tags = formData.get('tags')?.split(',') || [];
  const model = formData.get('model') as string || 'gemini-2.5-flash';
  
  // Create SSE stream
  const stream = new ReadableStream({
    async start(controller) {
      const sendProgress = (fileIndex: number, stage: string, progress: number, message: string) => {
        controller.enqueue(encoder.encode(
          `data: ${JSON.stringify({ fileIndex, fileName: files[fileIndex].name, stage, progress, message })}\n\n`
        ));
      };
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Step 1: Upload to Cloud Storage
        sendProgress(i, 'uploading', 0, 'Subiendo a Cloud Storage...');
        const storageResult = await uploadFile(...);
        sendProgress(i, 'uploading', 20, 'Archivo subido');
        
        // Step 2: Extract with Gemini
        sendProgress(i, 'extracting', 25, 'Extrayendo texto...');
        const extracted = await extractWithGemini(file, model);
        sendProgress(i, 'extracting', 50, `Extraídos ${extracted.length} caracteres`);
        
        // Step 3: Index with RAG
        sendProgress(i, 'indexing', 55, 'Creando chunks...');
        const result = await chunkAndIndexDocument({
          sourceId: newSourceId,
          userId,
          sourceName: file.name,
          text: extracted,
        });
        
        sendProgress(i, 'indexing', 100, `✅ ${result.chunksCreated} chunks creados`);
      }
      
      controller.close();
    }
  });
  
  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream' }
  });
};
```

---

### Paso 3: UI con Barras de Progreso por Archivo

```tsx
{uploadQueue.map((item, idx) => (
  <div key={item.id} className="border rounded p-3">
    {/* File header */}
    <div className="flex items-center justify-between mb-2">
      <span className="font-medium">{item.file.name}</span>
      <span className="text-xs text-slate-500">
        {item.status === 'complete' ? '✅' : item.status === 'failed' ? '❌' : '⟳'}
      </span>
    </div>
    
    {/* Progress bar */}
    <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
      <div 
        className="bg-blue-600 h-2 rounded-full transition-all"
        style={{ width: `${item.progress}%` }}
      />
    </div>
    
    {/* Current stage */}
    <div className="text-xs text-slate-600 mb-1">
      {item.currentMessage || 'En cola...'}
    </div>
    
    {/* Stage checklist */}
    <div className="flex items-center gap-4 text-[10px]">
      <span className={item.stages?.uploading ? 'text-green-600' : 'text-slate-400'}>
        {item.stages?.uploading ? '✓' : '○'} Subir
      </span>
      <span className={item.stages?.extracting ? 'text-green-600' : 'text-slate-400'}>
        {item.stages?.extracting ? '✓' : '○'} Extraer
      </span>
      <span className={item.stages?.indexing ? 'text-green-600' : 'text-slate-400'}>
        {item.stages?.indexing ? '✓' : '○'} Indexar
      </span>
    </div>
    
    {/* RAG info if complete */}
    {item.status === 'complete' && item.chunksCreated && (
      <div className="mt-2 text-xs text-green-600 font-medium">
        🔍 {item.chunksCreated} chunks • {item.totalTokens.toLocaleString()} tokens
      </div>
    )}
    
    {/* Expandable logs */}
    {item.logs && item.logs.length > 0 && (
      <details className="mt-2">
        <summary className="text-xs text-blue-600 cursor-pointer">
          Ver logs ({item.logs.length})
        </summary>
        <div className="mt-1 bg-slate-50 rounded p-2 max-h-32 overflow-y-auto font-mono text-[9px]">
          {item.logs.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
        </div>
      </details>
    )}
  </div>
))}
```

---

## ⏱️ Timing Optimizado

### Antes (Actual)

| Archivo | Extracción | Indexado | Total |
|---------|------------|----------|-------|
| Doc1 (155 chunks) | 160s | 23s | 183s |
| Doc2 (74 chunks) | 80s | 31s | 111s |
| Doc3 (65 chunks) | 120s | 23s | 143s |

**Total secuencial:** ~437 segundos (7.3 minutos)

---

### Después (Optimizado + Paralelo)

| Archivo | Extracción | Indexado | Total |
|---------|------------|----------|-------|
| Doc1 (155 chunks) | 160s | 12s | 172s |
| Doc2 (74 chunks) | 80s | 6s | 86s |
| Doc3 (65 chunks) | 120s | 5s | 125s |

**Total paralelo (3 simultáneos):** ~172 segundos (2.9 minutos)

**Ahorro:** ~60% del tiempo (4.4 minutos)

---

## 📊 URLs de GCP para Monitoreo

### Cloud Storage

**Ver archivos subidos:**
```
https://console.cloud.google.com/storage/browser/gen-lang-client-0986191192-uploads/documents?project=gen-lang-client-0986191192
```

**Métricas de storage:**
```
https://console.cloud.google.com/storage/browser/gen-lang-client-0986191192-uploads;tab=live_object_monitoring?project=gen-lang-client-0986191192
```

---

### Firestore

**Ver chunks indexados:**
```
https://console.cloud.google.com/firestore/databases/-default-/data/panel/document_chunks?project=gen-lang-client-0986191192
```

**Ver context sources:**
```
https://console.cloud.google.com/firestore/databases/-default-/data/panel/context_sources?project=gen-lang-client-0986191192
```

**Query por userId:**
```
https://console.cloud.google.com/firestore/databases/-default-/data/query;collection=document_chunks;structuredQuery=%7B%22where%22:%7B%22fieldFilter%22:%7B%22field%22:%7B%22fieldPath%22:%22userId%22%7D,%22op%22:%22EQUAL%22,%22value%22:%7B%22stringValue%22:%22114671162830729001607%22%7D%7D%7D%7D?project=gen-lang-client-0986191192
```

---

### Cloud Run Logs

**Logs en tiempo real:**
```
https://console.cloud.google.com/run/detail/us-central1/flow-chat/logs?project=gen-lang-client-0986191192
```

**Filtrar por indexing:**
```
https://console.cloud.google.com/logs/query;query=resource.type%3D%22cloud_run_revision%22%0A(textPayload%3D~%22RAG%20indexing%22%20OR%20textPayload%3D~%22Saved.*chunks%22)?project=gen-lang-client-0986191192
```

**Filtrar por uploads:**
```
https://console.cloud.google.com/logs/query;query=resource.type%3D%22cloud_run_revision%22%0AtextPayload%3D~%22Uploading%20to%20Cloud%20Storage%22?project=gen-lang-client-0986191192
```

**Filtrar por extracciones:**
```
https://console.cloud.google.com/logs/query;query=resource.type%3D%22cloud_run_revision%22%0AtextPayload%3D~%22Fresh%20extraction%20complete%22?project=gen-lang-client-0986191192
```

---

### Logging Explorer - Query Avanzada

**Todo el pipeline:**
```
Query:

resource.type="cloud_run_revision"
(
  textPayload=~"Uploading to Cloud Storage" OR
  textPayload=~"File uploaded successfully" OR
  textPayload=~"Fresh extraction complete" OR
  textPayload=~"Starting RAG indexing" OR
  textPayload=~"Saved.*chunks" OR
  textPayload=~"RAG indexing complete"
)
timestamp >= "2025-10-18T17:00:00Z"
```

**Ver en:**
```
https://console.cloud.google.com/logs/query?project=gen-lang-client-0986191192
```

---

### Monitoring Dashboard

**Cloud Run metrics:**
```
https://console.cloud.google.com/run/detail/us-central1/flow-chat/metrics?project=gen-lang-client-0986191192
```

**Request latency graph:**
- Eje X: Tiempo
- Eje Y: Latencia (segundos)
- Línea: `/api/reindex-source` requests
- Esperado: 20-30 segundos después de optimización

**CPU utilization:**
- Ver si CPU está al 100% (cuello de botella)
- Ver si memoria es suficiente

---

## 🎯 Plan de Implementación

### Fase 1: Optimizar Indexado (1 hora)

- [ ] Parallel embeddings (5 simultáneos)
- [ ] Batch size 20 en vez de 10
- [ ] Delay 50ms en vez de 100ms
- [ ] Skip re-extracción (usar extractedData existente)

**Resultado:** 155 chunks en ~10s (antes: ~23s)

---

### Fase 2: Auto-RAG en Upload (2 horas)

- [ ] Modificar `processQueue` para llamar indexing automático
- [ ] SSE endpoint para cada archivo
- [ ] UI con 3 checkmarks (Subir, Extraer, Indexar)
- [ ] Logs expandibles por archivo
- [ ] Parallel upload (max 3 simultáneos)

**Resultado:** Bulk upload de 5 archivos en ~3 minutos (todo automático)

---

### Fase 3: UI Mejorada (1 hora)

- [ ] Barra de progreso por archivo
- [ ] Contador de chunks en tiempo real
- [ ] Expandible logs por archivo
- [ ] Estimación de tiempo restante

---

## 💰 Costo Optimizado

**Antes:**
- 155 chunks × 768 dims × API calls = Tiempo + rate limits

**Después:**
- Parallel requests = Menos tiempo
- Batch operations = Menos overhead
- Costo similar pero ~50% más rápido

---

## ✅ Beneficios

### Usuario

- ✅ Upload + RAG automático (1 click)
- ✅ 5 archivos → 5 documentos con RAG listos
- ✅ Progreso detallado por archivo
- ✅ No pasos manuales

### Sistema

- ✅ 50-60% más rápido
- ✅ Parallel processing
- ✅ Mejor uso de recursos
- ✅ Menos rate limiting

---

## 🎯 Decisión

**¿Quieres que implemente esto ahora?**

**Tiempo estimado:** 4 horas total
- Optimización: 1 hora
- Auto-RAG: 2 horas  
- UI: 1 hora

**Resultado:**
- Indexado 50% más rápido
- Upload bulk completamente automático
- RAG habilitado por default
- Progreso detallado

**¿Procedemos?**









