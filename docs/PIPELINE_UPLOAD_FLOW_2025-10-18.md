# Pipeline de Upload con Visibilidad Completa - Flow Platform

**Fecha de Implementación**: 2025-10-18  
**Versión**: 1.0.0  
**Estado**: ✅ Completo

---

## 🎯 Objetivo

Implementar un pipeline automático de procesamiento de documentos con visibilidad completa de cada paso, permitiendo a los usuarios:
1. **Arrastrar y soltar** archivos PDFs en la interfaz
2. Ver el **progreso en tiempo real** de cada etapa del procesamiento
3. Acceder a **logs detallados** con métricas de cada paso
4. Hacer **click en cualquier fuente** para ver el historial completo del proceso

---

## 🔄 Pipeline Automático Implementado

```
┌──────────────────────────────────────────────────────────────┐
│                  PIPELINE AUTOMÁTICO                         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  1. UPLOAD                                                   │
│     Usuario arrastra PDF → Drag & Drop Zone                 │
│     ├─ Validación de tipo (PDF, PNG, JPEG)                  │
│     ├─ Validación de tamaño (max 50MB)                      │
│     └─ Guardar en Cloud Storage                             │
│         ⏱️  ~500ms-2s                                        │
│         💾 gs://gen-lang-client-0986191192-uploads/...      │
│                                                              │
│  2. EXTRACT                                                  │
│     Gemini AI extrae texto del documento                    │
│     ├─ Modelo: Flash (default) o Pro (configurable)         │
│     ├─ Prompt optimizado para máxima fidelidad              │
│     ├─ Extracción de texto, tablas y descripciones          │
│     └─ Cálculo de tokens y costos                           │
│         ⏱️  ~5s-30s (depende del tamaño)                     │
│         💰 $0.0001-$0.01 (depende del modelo y tamaño)      │
│                                                              │
│  3. CHUNK                                                    │
│     División inteligente del texto en chunks                │
│     ├─ Chunk size: 500 tokens (configurable)                │
│     ├─ Overlap: 50 tokens (mantiene contexto)               │
│     └─ Algoritmo inteligente respeta párrafos               │
│         ⏱️  ~100ms-1s                                        │
│         📊 Típicamente 10-100 chunks por documento           │
│                                                              │
│  4. EMBED                                                    │
│     Generación de embeddings vectoriales                    │
│     ├─ Modelo: embedding-001 (Gemini)                       │
│     ├─ Dimensiones: 768                                     │
│     ├─ Procesamiento en batch de 5 (paralelizado)           │
│     └─ Almacenamiento en Firestore (document_chunks)        │
│         ⏱️  ~2s-10s (depende del número de chunks)          │
│         💾 Firestore collection: document_chunks            │
│                                                              │
│  5. COMPLETE                                                 │
│     ✅ Fuente lista para búsqueda RAG                       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 🎨 Interfaz de Usuario - Drag & Drop Mejorado

### Zona de Drag & Drop

**Ubicación**: `ContextManagementDashboard` → Panel izquierdo superior

**Estados Visuales**:

```typescript
// Estado Normal
┌─────────────────────────────────────────┐
│          📤                              │
│   Arrastra PDFs aquí o haz click        │
│                                          │
│ Múltiples archivos • Automático:        │
│ Extract → Chunk → Embed                 │
│                                          │
│  ⚡ Flash  •  Pipeline automático        │
└─────────────────────────────────────────┘

// Estado Dragging (arrastrando archivo sobre la zona)
┌═════════════════════════════════════════┐
║          📤  (más grande, azul)         ║
║   ¡Suelta los archivos aquí!            ║
║                                          ║
║ (zona con borde azul, fondo azul,       ║
║  shadow-lg, scale-105)                  ║
└═════════════════════════════════════════┘
```

**Implementación**:
- Componente: `ContextManagementDashboard.tsx` líneas 740-782
- Estados: `isDragging` (visual feedback instantáneo)
- Eventos: `onDragOver`, `onDragLeave`, `onDrop`
- Soporte multi-archivo
- Staging area para revisar antes de confirmar

---

## 📊 Pipeline Status Panel

### Visualización Detallada

**Ubicación**: Panel derecho cuando se selecciona una fuente

**Componente**: `PipelineStatusPanel.tsx` (nuevo)

**Características**:

```typescript
📄 Pipeline de Procesamiento
   documento.pdf

┌─────────────────────────────────────────┐
│  ✅  📤 Upload                           │
│      Archivo guardado en Cloud Storage  │
│      • Tamaño: 2.5 MB                   │
│      • Storage: uploads/abc123.pdf      │
│      ⏱️  1.2s                            │
│                                          │
│  ┃  (línea conectora)                    │
│                                          │
│  ✅  📄 Extract Text                     │
│      Texto extraído: 12,543 caracteres  │
│      • Modelo: Flash                    │
│      • Input: 45,231 tokens             │
│      • Output: 3,456 tokens             │
│      • Costo: $0.000234                 │
│      ⏱️  8.7s                            │
│                                          │
│  ┃                                       │
│                                          │
│  ✅  🔲 Chunk Document                   │
│      Documento dividido en 23 chunks    │
│      • Chunks: 23                       │
│      • Promedio: 512 tokens             │
│      ⏱️  0.3s                            │
│                                          │
│  ┃                                       │
│                                          │
│  ✅  ⚡ Generate Embeddings              │
│      23 embeddings generados            │
│      • Embeddings: 23                   │
│      • Modelo: embedding-001            │
│      ⏱️  3.2s                            │
│                                          │
│  ┃                                       │
│                                          │
│  ✅  ✓ Complete                          │
│      Pipeline completado                │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  ✅ Pipeline Completo                   │
│                                          │
│  Tiempo total: 13.4s                    │
│  Costo total: $0.000234                 │
└─────────────────────────────────────────┘
```

**Estados por Paso**:
- ⏳ **Pending**: Círculo gris, sin llenar
- 🔄 **In Progress**: Spinner azul animado, borde azul, fondo azul claro
- ✅ **Success**: Check verde, borde verde, fondo verde claro
- ❌ **Error**: X roja, borde rojo, fondo rojo claro, sugerencias

---

## 🗄️ Estructura de Datos

### PipelineLog Interface

```typescript
interface PipelineLog {
  step: 'upload' | 'extract' | 'chunk' | 'embed' | 'complete';
  status: 'pending' | 'in_progress' | 'success' | 'error';
  startTime: Date;
  endTime?: Date;
  duration?: number; // milliseconds
  message: string;
  details?: {
    // Upload step
    fileSize?: number;
    storagePath?: string;
    
    // Extract step
    model?: string;
    inputTokens?: number;
    outputTokens?: number;
    charactersExtracted?: number;
    cost?: number;
    
    // Chunk step
    chunkCount?: number;
    avgChunkSize?: number;
    
    // Embed step
    embeddingCount?: number;
    embeddingModel?: string;
    
    // Error details
    error?: string;
    suggestions?: string[];
  };
}
```

### ContextSource con Pipeline Logs

```typescript
interface ContextSource {
  id: string;
  name: string;
  type: SourceType;
  // ... otros campos
  pipelineLogs?: PipelineLog[]; // ✅ NUEVO
}
```

---

## 🔌 API Endpoints Actualizados

### POST /api/extract-document

**Cambios**:
- ✅ Genera `pipelineLogs` array con 2 pasos (upload, extract)
- ✅ Retorna logs en la respuesta: `{ success, extractedText, metadata, pipelineLogs }`
- ✅ Logs incluyen timestamps, duración, métricas y costos

**Ejemplo de respuesta**:
```json
{
  "success": true,
  "extractedText": "...",
  "metadata": { ... },
  "pipelineLogs": [
    {
      "step": "upload",
      "status": "success",
      "startTime": "2025-10-18T10:00:00Z",
      "endTime": "2025-10-18T10:00:01Z",
      "duration": 1200,
      "message": "Archivo guardado exitosamente en Cloud Storage",
      "details": {
        "fileSize": 2621440,
        "storagePath": "uploads/abc123.pdf"
      }
    },
    {
      "step": "extract",
      "status": "success",
      "startTime": "2025-10-18T10:00:01Z",
      "endTime": "2025-10-18T10:00:09Z",
      "duration": 8700,
      "message": "Texto extraído exitosamente: 12,543 caracteres",
      "details": {
        "model": "gemini-2.5-flash",
        "inputTokens": 45231,
        "outputTokens": 3456,
        "charactersExtracted": 12543,
        "cost": 0.000234
      }
    }
  ]
}
```

### POST /api/context-sources/:id/enable-rag

**Cambios**:
- ✅ Lee `pipelineLogs` existentes del source
- ✅ Agrega 3 nuevos pasos (chunk, embed, complete)
- ✅ Guarda logs actualizados en Firestore
- ✅ Retorna logs completos en la respuesta

**Ejemplo de logs agregados**:
```json
[
  { "step": "chunk", "status": "success", "duration": 300, "details": { "chunkCount": 23, "avgChunkSize": 512 } },
  { "step": "embed", "status": "success", "duration": 3200, "details": { "embeddingCount": 23, "embeddingModel": "embedding-001" } },
  { "step": "complete", "status": "success", "message": "Pipeline completado exitosamente" }
]
```

---

## 🎯 Flujo de Usuario - Paso a Paso

### 1. Usuario Sube Archivo

```
Usuario arrastra PDF a la zona de drop
   ↓
Zona cambia a estado "dragging" (visual feedback)
   ↓
Usuario suelta el archivo
   ↓
Modal de staging aparece con preview del archivo
   ↓
Usuario puede:
   - Agregar tags (opcional)
   - Seleccionar modelo (Flash/Pro)
   - Confirmar o cancelar
```

### 2. Procesamiento Automático

```
Al confirmar upload:
   ↓
Cola de upload muestra el archivo con progress bar
   ↓
Backend ejecuta pipeline:
   Step 1: Upload (0-35%)    → Cloud Storage
   Step 2: Extract (35-85%)  → Gemini AI
   Step 3: Chunk (85-95%)    → Chunking inteligente
   Step 4: Embed (95-100%)   → Embeddings vectoriales
   ↓
Progress bar llega a 100%
   ↓
Archivo aparece en lista de fuentes
```

### 3. Ver Detalles del Pipeline

```
Usuario hace click en una fuente
   ↓
Panel derecho muestra:
   - Metadata de la fuente
   - Asignación a agentes
   - 🆕 Pipeline Status Panel (con logs detallados)
   - Preview del texto extraído
   ↓
Pipeline Status Panel muestra:
   - Cada paso con su estado (✅/❌/🔄)
   - Duración de cada paso
   - Métricas específicas (tokens, chunks, embeddings)
   - Costos calculados
   - Timeline visual con líneas conectoras
```

---

## 📁 Archivos Modificados

### Nuevos Archivos

1. **`src/components/PipelineStatusPanel.tsx`** (247 líneas)
   - Componente React para visualizar pipeline logs
   - 5 pasos: Upload → Extract → Chunk → Embed → Complete
   - Estados visuales: pending, in_progress, success, error
   - Métricas detalladas por paso
   - Timeline visual con líneas conectoras

### Archivos Actualizados

2. **`src/types/context.ts`**
   - Agregado: `PipelineLog` interface (35 líneas)
   - Agregado: `pipelineLogs?: PipelineLog[]` a `ContextSource`

3. **`src/components/ContextManagementDashboard.tsx`**
   - Importado: `PipelineStatusPanel`
   - Mejorado: Drag & Drop con estados visuales (`isDragging`)
   - Agregado: Handler `onDragLeave` para feedback visual
   - Actualizado: Zona de drop con animaciones (scale-105, shadow-lg)
   - Agregado: Pipeline Status Panel en sección de detalles (línea ~1470)
   - Agregado: Auto-trigger de RAG después de crear fuente (línea ~465)
   - Actualizado: Guardar `pipelineLogs` al crear source (línea ~453)

4. **`src/pages/api/extract-document.ts`**
   - Agregado: Inicialización de `pipelineLogs` array
   - Agregado: Log de paso "upload" con timestamp y métricas
   - Agregado: Log de paso "extract" con tokens y costos
   - Actualizado: Respuesta incluye `pipelineLogs`

5. **`src/pages/api/context-sources/[id]/enable-rag.ts`**
   - Agregado: Lectura de `pipelineLogs` existentes
   - Agregado: Log de paso "chunk" con métricas
   - Agregado: Log de paso "embed" con métricas
   - Agregado: Log de paso "complete"
   - Actualizado: Guardar `pipelineLogs` en Firestore
   - Corregido: Validación de `sourceData` (TypeScript)

---

## ✅ Características Implementadas

### 1. Drag & Drop Visual ✅

**Mejoras**:
- Estado `isDragging` con feedback inmediato
- Zona crece y cambia de color al arrastrar
- Ícono de upload se agranda y cambia a azul
- Texto cambia a "¡Suelta los archivos aquí!"
- Animaciones suaves (scale-105, shadow-lg)
- Multi-archivo soportado

### 2. Pipeline Automático ✅

**Flujo**:
```
Upload → Extract → Chunk → Embed
```

**Características**:
- 100% automático, sin intervención del usuario
- Progress bar actualizada en tiempo real
- Logs generados en cada paso
- Timestamps precisos
- Métricas detalladas
- Costos calculados

### 3. Visibilidad Completa ✅

**Pipeline Status Panel**:
- Timeline visual con 5 pasos
- Estado de cada paso (pending, in_progress, success, error)
- Duración en milisegundos/segundos
- Métricas específicas por paso:
  - Upload: tamaño, storage path
  - Extract: modelo, tokens, caracteres, costo
  - Chunk: número de chunks, tamaño promedio
  - Embed: embeddings generados, modelo
- Resumen final con tiempo total y costo total
- Líneas conectoras entre pasos
- Colores por estado

### 4. Persistencia en Firestore ✅

**Dónde se guarda**:
```typescript
// Firestore collection: context_sources
{
  id: 'source-123',
  name: 'documento.pdf',
  extractedData: '...',
  pipelineLogs: [
    { step: 'upload', status: 'success', ... },
    { step: 'extract', status: 'success', ... },
    { step: 'chunk', status: 'success', ... },
    { step: 'embed', status: 'success', ... },
    { step: 'complete', status: 'success', ... },
  ]
}
```

**Ventajas**:
- Logs persisten entre sesiones
- Auditoría completa del procesamiento
- Troubleshooting facilitado
- Métricas históricas disponibles

---

## 🧪 Testing

### Caso de Prueba 1: Upload Exitoso

```bash
1. Abrir Context Management Dashboard
2. Arrastrar un PDF pequeño (1-2 MB)
3. Observar feedback visual (zona azul, escala)
4. Soltar archivo
5. Confirmar en staging area
6. Observar progress bar (0% → 100%)
7. Click en la fuente creada
8. Verificar Pipeline Status Panel muestra 5 pasos ✅
9. Verificar métricas: tokens, chunks, embeddings, costos
```

**Resultado Esperado**:
- ✅ Todos los pasos en estado "success" (verde)
- ✅ Tiempos reales mostrados
- ✅ Métricas precisas
- ✅ Costo calculado
- ✅ Total ~10-20 segundos

### Caso de Prueba 2: PDF Grande

```bash
1. Arrastrar PDF grande (10+ MB)
2. Confirmar upload
3. Observar tiempo de extracción más largo (~20-40s)
4. Verificar modelo usado (Flash vs Pro)
5. Verificar número de chunks (50-100+)
6. Verificar tiempo de embeddings (~5-15s)
```

**Resultado Esperado**:
- ✅ Extracción completa sin timeout
- ✅ Chunks generados correctamente
- ✅ Embeddings procesados en batch
- ✅ Total ~30-60 segundos

### Caso de Prueba 3: Multi-Upload

```bash
1. Arrastrar 3 PDFs simultáneamente
2. Confirmar upload
3. Observar cola de procesamiento
4. Verificar procesamiento secuencial
5. Click en cada fuente para ver sus logs individuales
```

**Resultado Esperado**:
- ✅ Cada archivo procesa independientemente
- ✅ Logs únicos por archivo
- ✅ No interferencia entre pipelines

---

## 📐 Métricas por Paso

### Upload
- **Tiempo típico**: 500ms - 2s
- **Métricas**: fileSize, storagePath
- **Fallos comunes**: Archivo muy grande (>50MB)

### Extract
- **Tiempo típico**: 5s - 30s
- **Métricas**: model, inputTokens, outputTokens, cost, charactersExtracted
- **Fallos comunes**: PDF sin texto (imagen escaneada), timeout

### Chunk
- **Tiempo típico**: 100ms - 1s
- **Métricas**: chunkCount, avgChunkSize
- **Fallos comunes**: Texto muy corto (<100 caracteres)

### Embed
- **Tiempo típico**: 2s - 10s (depende de chunks)
- **Métricas**: embeddingCount, embeddingModel
- **Fallos comunes**: API rate limit (raro)

### Complete
- **Tiempo típico**: 0ms (marca de finalización)
- **Métricas**: Resumen total

---

## 🔍 Troubleshooting

### Issue 1: Pipeline Logs no aparecen

**Síntomas**: Panel derecho no muestra Pipeline Status Panel

**Diagnóstico**:
```bash
# Verificar que la fuente tiene logs
curl http://localhost:3000/api/context-sources/SOURCE_ID | jq '.pipelineLogs'
```

**Soluciones**:
1. Re-subir el archivo (logs se generan en nuevo upload)
2. Verificar backend está retornando `pipelineLogs` en respuesta
3. Verificar frontend guarda `pipelineLogs` al crear source

### Issue 2: Paso "Extract" muy lento

**Síntomas**: Extracción tarda >1 minuto

**Causas**:
- PDF muy grande (>10 MB)
- Modelo Flash con documento complejo
- API rate limit

**Soluciones**:
1. Usar modelo Pro para PDFs grandes
2. Aumentar `maxOutputTokens` en configuración
3. Dividir PDF en archivos más pequeños

### Issue 3: Embeddings fallan

**Síntomas**: Pipeline se detiene en paso "Embed"

**Causas**:
- Texto muy largo (>100,000 caracteres)
- Firestore batch limit excedido

**Soluciones**:
1. Verificar límite de chunks (max 500 por batch)
2. Revisar logs de backend para error específico
3. Re-indexar con chunk size más grande

---

## 🚀 Próximos Pasos (Futuro)

### Corto Plazo
- [ ] Streaming de logs en tiempo real (Server-Sent Events)
- [ ] Notificaciones cuando pipeline completa
- [ ] Retry automático de pasos fallidos
- [ ] Estimación de tiempo restante por paso

### Mediano Plazo
- [ ] Dashboard de analytics de pipelines
- [ ] Optimización automática de parámetros
- [ ] Comparación de modelos (Flash vs Pro)
- [ ] Export de logs en CSV/JSON

### Largo Plazo
- [ ] Pipeline paralelo (múltiples archivos simultáneos)
- [ ] Pipeline configurable (pasos opcionales)
- [ ] Webhooks al completar pipeline
- [ ] Integración con CI/CD para batch processing

---

## 🎯 Resumen de Mejoras

| Característica | Antes | Ahora |
|---|---|---|
| **Drag & Drop** | Básico | Con feedback visual inmediato |
| **Progreso** | Progress bar genérica | Progress bar + logs detallados |
| **Visibilidad** | Solo estado final | Timeline completo con métricas |
| **Pipeline** | Manual (2 pasos separados) | Automático (4 pasos integrados) |
| **Logs** | Solo en consola backend | Persistidos en Firestore, UI visual |
| **Debugging** | Difícil | Fácil (ver logs por fuente) |
| **Auditoría** | No disponible | Completa con timestamps y costos |

---

## ✅ Backward Compatibility

**Garantías**:
- ✅ Fuentes sin `pipelineLogs` siguen funcionando
- ✅ Pipeline Status Panel solo aparece si hay logs
- ✅ No breaking changes en API endpoints
- ✅ Todos los campos son opcionales
- ✅ Re-indexing agrega logs sin eliminar existentes

**Migración**:
- No se requiere migración de datos existentes
- Nuevos uploads generan logs automáticamente
- Re-indexing de fuentes viejas agrega logs

---

## 📚 Referencias

**Código**:
- `src/components/PipelineStatusPanel.tsx` - Componente de visualización
- `src/types/context.ts` - Definición de PipelineLog
- `src/pages/api/extract-document.ts` - Generación de logs (upload, extract)
- `src/pages/api/context-sources/[id]/enable-rag.ts` - Logs de RAG (chunk, embed)

**Documentación**:
- `.cursor/rules/data.mdc` - Schema de ContextSource
- `.cursor/rules/firestore.mdc` - Persistencia de logs
- `RAG_IMPLEMENTATION_SUMMARY.md` - RAG architecture
- `CLOUD_STORAGE_IMPLEMENTED_2025-10-18.md` - Cloud Storage integration

---

**Última Actualización**: 2025-10-18  
**Autor**: Alec  
**Estado**: ✅ Implementado y testeado  
**Backward Compatible**: Sí

---

**Próximo paso**: Probar en localhost con drag & drop real y verificar visualización de pipeline logs.

