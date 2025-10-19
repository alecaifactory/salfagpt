# 📊 Pipeline Detail View - Complete Implementation Guide

**Created:** 2025-10-19  
**Status:** ✅ Implemented  
**Purpose:** Build user trust through complete visibility of document processing pipeline

---

## 🎯 Objetivo

Cuando el usuario hace clic en un documento en el pipeline de procesamiento, ahora puede ver en el panel derecho **TODOS** los detalles del procesamiento end-to-end:

1. ✅ **Upload** - Archivo subido correctamente a Cloud Storage con URL pública
2. ✅ **Extract** - Inferencia con Gemini AI, texto extraído, tokens y costos
3. ✅ **Chunk** - Documento fragmentado para RAG con estadísticas
4. ✅ **Embed** - Vectores semánticos generados, modelo usado
5. ✅ **Complete** - Todo listo para usar en agentes

---

## 🏗️ Componentes Nuevos

### 1. `PipelineDetailView.tsx`

**Ubicación:** `src/components/PipelineDetailView.tsx`

**Props:**
```typescript
interface PipelineDetailViewProps {
  source: ContextSource;      // Fuente de contexto seleccionada
  userId?: string;            // Para cargar chunks
  onClose?: () => void;       // Callback opcional
}
```

**Tabs:**

#### Tab 1: Pipeline Details
- Vista cronológica de los 5 pasos
- Cada paso es expandible/colapsable
- Muestra:
  - Estado (pending/in_progress/success/error)
  - Duración de cada paso
  - Detalles específicos por paso
  - Costos y tokens
  - Mensajes de error con sugerencias

#### Tab 2: Extracted Text
- Texto completo extraído por Gemini
- Scroll vertical para textos largos
- Botón "Descargar .txt" para guardar localmente
- Estadísticas (caracteres, tokens, páginas)
- Formato mono-espaced para legibilidad

#### Tab 3: RAG Chunks
- Lista de todos los chunks generados
- Estadísticas: Total chunks, tamaño promedio, dimensiones
- Cada chunk es clickable para ver detalles
- Modal con:
  - Texto del chunk completo
  - Preview del vector de embeddings (primeros 100 valores)
  - Metadata (posición, página, tokens)

---

## 📊 Detalles por Paso del Pipeline

### Step 1: Upload to Cloud Storage

**Información Mostrada:**
```typescript
{
  fileSize: number;           // Tamaño en MB
  storagePath: string;        // Path en Cloud Storage
  duration: number;           // Tiempo de upload
}
```

**Visual:**
- ✅ Tamaño del archivo formateado (ej: "2.34 MB")
- ✅ Path de Cloud Storage con ícono de link externo
- ✅ Botón para abrir archivo original (si disponible)
- ✅ Badge verde "Archivo subido correctamente"

**Build Trust:**
> "El usuario ve que su archivo está seguro en Google Cloud Storage, con path verificable"

---

### Step 2: Extract with Gemini AI

**Información Mostrada:**
```typescript
{
  model: 'gemini-2.5-flash' | 'gemini-2.5-pro';
  inputTokens: number;
  outputTokens: number;
  charactersExtracted: number;
  cost: number;               // Costo exacto en USD
  duration: number;
}
```

**Visual:**
- ✅ Modelo usado (Flash verde / Pro morado)
- ✅ Tokens de input y output (formato mono)
- ✅ Caracteres extraídos (número grande)
- ✅ Costo exacto con 6 decimales ($0.000123)
- ✅ Info box explicando que Gemini procesó el PDF completo

**Build Trust:**
> "Transparencia total: el usuario ve exactamente qué modelo se usó, cuántos tokens costó, y cuánto dinero"

---

### Step 3: Chunk for RAG

**Información Mostrada:**
```typescript
{
  chunkCount: number;         // Total de chunks
  avgChunkSize: number;       // Tamaño promedio en tokens
  duration: number;
}
```

**Visual:**
- ✅ Número total de chunks creados
- ✅ Tamaño promedio por chunk (~500 tokens)
- ✅ Info box explicando fragmentación para RAG

**Build Trust:**
> "El usuario entiende que su documento fue dividido inteligentemente para búsqueda eficiente"

---

### Step 4: Generate Embeddings

**Información Mostrada:**
```typescript
{
  embeddingCount: number;     // Número de vectores generados
  embeddingModel: string;     // Modelo usado (text-embedding-004)
  duration: number;
}
```

**Visual:**
- ✅ Número de embeddings (debe igualar chunks)
- ✅ Modelo de embeddings usado
- ✅ Info box explicando vectores semánticos

**Build Trust:**
> "El usuario ve que cada fragmento fue convertido a un vector para búsqueda semántica"

---

### Step 5: Complete

**Visual:**
- ✅ Banner verde grande "¡Documento Listo!"
- ✅ Mensaje confirmando que está disponible para agentes
- ✅ Instrucciones claras sobre siguiente paso

**Build Trust:**
> "Confirmación clara de que todo el proceso terminó exitosamente"

---

## 📖 Extracted Text Tab

### Funcionalidades

1. **Vista Completa del Texto**
   ```typescript
   <pre className="whitespace-pre-wrap font-mono">
     {source.extractedData}
   </pre>
   ```
   - Texto formateado con saltos de línea preservados
   - Scroll vertical para textos largos
   - Font mono para legibilidad

2. **Botón de Descarga**
   ```typescript
   onClick={downloadExtractedText}
   ```
   - Genera archivo `.txt` con el contenido
   - Nombre: `{source.name}_extracted.txt`
   - Download automático

3. **Estadísticas**
   - Número de caracteres
   - Páginas del PDF original
   - Fecha de extracción

**Build Trust:**
> "El usuario puede descargar y verificar el texto extraído, asegurándose de su calidad"

---

## 🧩 RAG Chunks Tab

### Funcionalidades

1. **Summary Cards**
   ```typescript
   - Total Chunks: Grande, azul
   - Tamaño Promedio: Indigo
   - Dimensiones Vector: Amarillo (768)
   ```

2. **Lista de Chunks**
   - Scroll vertical con todos los chunks
   - Cada chunk muestra:
     - Número de chunk (#1, #2, ...)
     - Tokens del chunk
     - Páginas del PDF (si disponible)
     - Preview del texto (primeras 2 líneas)
   - Click para ver detalles completos

3. **Chunk Detail Modal**
   - Texto completo del chunk
   - Vector de embeddings (preview primeros 100 valores)
   - Metadata completa
   - Botón cerrar

**Build Trust:**
> "El usuario puede inspeccionar cada fragmento individualmente, verificando que la fragmentación fue correcta"

---

## 🔄 Flujo de Uso

### Escenario 1: Durante el Upload

```
1. Usuario arrastra PDF al modal
   ↓
2. Upload comienza - Pipeline visual aparece
   ↓
3. Usuario hace click en el funnel/card del documento
   ↓
4. Panel derecho se abre con PipelineDetailView
   ↓
5. Tab "Pipeline Details" está activo
   ↓
6. Usuario ve progreso en tiempo real:
   - Upload: 25% → Success ✅
   - Extract: In progress 🔄 → Success ✅
   - Chunk: In progress 🔄 → Success ✅
   - Embed: In progress 🔄 → Success ✅
   - Complete: Success ✅
```

### Escenario 2: Después del Upload

```
1. Upload ya completado
   ↓
2. Usuario hace click en el documento
   ↓
3. Panel derecho muestra:
   - Tab "Pipeline Details" con timeline completo
   - Todos los pasos en estado Success ✅
   - Duración total y costo total
   ↓
4. Usuario hace click en "Extracted Text"
   ↓
5. Ve el texto completo extraído
   ↓
6. Click en "Descargar .txt" para guardar
   ↓
7. Usuario hace click en "RAG Chunks"
   ↓
8. Ve lista de todos los chunks
   ↓
9. Click en un chunk específico
   ↓
10. Modal muestra texto del chunk y preview del embedding
```

---

## 🎨 Visual Design

### Pipeline Tab

```
┌─────────────────────────────────────────────┐
│  📊 Summary Stats                           │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  │ ⏱️ 16.6s│ │ 💲 $0.00│ │ ✅ Activo│       │
│  │  Time   │ │  Cost   │ │  Status │       │
│  └─────────┘ └─────────┘ └─────────┘       │
├─────────────────────────────────────────────┤
│                                             │
│  ✅  ─┬─ Upload to Cloud Storage           │
│       │  ⏱️ 2.1s                            │
│       │  📦 2.34 MB                         │
│       │  📍 gs://bucket/file.pdf            │
│       │  🔗 View original                   │
│       ▼                                     │
│  ✅  ─┬─ Extract with Gemini AI     [v]    │
│       │  ⏱️ 8.3s                            │
│       │  🤖 Gemini 2.5 Flash                │
│       │  📊 Input: 12,345 tokens            │
│       │  📊 Output: 8,901 tokens            │
│       │  💰 $0.000234                       │
│       │  ℹ️ Gemini procesó el PDF...        │
│       ▼                                     │
│  ✅  ─┬─ Chunk for RAG              [v]    │
│       │  ⏱️ 3.2s                            │
│       │  📑 24 chunks                       │
│       │  📏 ~500 tokens avg                 │
│       │  ℹ️ Dividido para búsqueda...       │
│       ▼                                     │
│  ✅  ─┬─ Generate Embeddings        [v]    │
│       │  ⏱️ 2.9s                            │
│       │  🧮 24 embeddings                   │
│       │  🔢 text-embedding-004              │
│       │  ℹ️ Vectores semánticos...          │
│       ▼                                     │
│  ✅  ─── Ready for Use                     │
│         ¡Documento Listo!                  │
│         Disponible para tus agentes        │
└─────────────────────────────────────────────┘
```

### Extracted Text Tab

```
┌─────────────────────────────────────────────┐
│  📄 Texto Extraído        [⬇️ Descargar]    │
│  8,234 caracteres                           │
├─────────────────────────────────────────────┤
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │  Extracted text appears here...       │ │
│  │  With proper formatting...            │ │
│  │  Line breaks preserved...             │ │
│  │  Scrollable if long...                │ │
│  │  Mono-spaced font for readability...  │ │
│  │                                       │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  📄 5 páginas • 🔢 ~8,901 tokens            │
│  Extraído: 19/10/2025                       │
└─────────────────────────────────────────────┘
```

### RAG Chunks Tab

```
┌─────────────────────────────────────────────┐
│  🧩 RAG Chunks (24)                         │
├─────────────────────────────────────────────┤
│  ┌─────────┐ ┌──────────┐ ┌─────────┐      │
│  │  24     │ │  500     │ │  768    │      │
│  │ Chunks  │ │ Avg Size │ │  Dims   │      │
│  └─────────┘ └──────────┘ └─────────┘      │
├─────────────────────────────────────────────┤
│  Document Chunks                            │
│  Click para ver detalles                    │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ Chunk #1 • 487 tokens • Pág. 1  👁️ │   │
│  │ Este es el inicio del documento...  │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ Chunk #2 • 512 tokens • Pág. 1-2 👁️│   │
│  │ Continuación del primer chunk...    │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ Chunk #3 • 495 tokens • Pág. 2  👁️ │   │
│  │ Información sobre el tema...        │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ... (más chunks)                           │
└─────────────────────────────────────────────┘

Click en chunk → Modal:

┌─────────────────────────────────────────────┐
│  Chunk #1                              [X]  │
│  487 tokens • Chars 0-2,345 • Pág. 1        │
├─────────────────────────────────────────────┤
│                                             │
│  Texto del Chunk                            │
│  ┌─────────────────────────────────────┐   │
│  │ Complete chunk text appears here... │   │
│  │ With all formatting preserved...    │   │
│  │                                     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Embedding Vector (768 dimensiones)        │
│  ┌─────────────────────────────────────┐   │
│  │ 0.1234 0.5678 -0.2345 0.8901 ...    │   │
│  │ (primeros 100 de 768)                │   │
│  └─────────────────────────────────────┘   │
│                                             │
│                              [Cerrar]       │
└─────────────────────────────────────────────┘
```

---

## 🔄 Flujo de Datos

### 1. Carga de Chunks (On-Demand)

```typescript
// Cuando usuario hace click en tab "RAG Chunks"
useEffect(() => {
  if (activeTab === 'chunks' && source.ragEnabled && chunks.length === 0) {
    loadChunks();
  }
}, [activeTab, source.ragEnabled]);

// API Call
const loadChunks = async () => {
  const response = await fetch(
    `/api/context-sources/${source.id}/chunks?userId=${userId}`
  );
  const data = await response.json();
  setChunks(data.chunks);
};
```

**Endpoint:** `GET /api/context-sources/:id/chunks?userId=xxx`

**Response:**
```json
{
  "success": true,
  "chunks": [
    {
      "id": "chunk-id-1",
      "chunkIndex": 0,
      "text": "Texto del chunk...",
      "embedding": [0.1234, 0.5678, ...], // 768 valores
      "metadata": {
        "startChar": 0,
        "endChar": 2345,
        "tokenCount": 487,
        "startPage": 1,
        "endPage": 1
      }
    },
    // ... más chunks
  ],
  "count": 24
}
```

---

### 2. Pipeline Logs (Ya Guardados)

Los logs del pipeline se guardan durante el procesamiento:

```typescript
// En /api/extract-document
const pipelineLogs: PipelineLog[] = [];

// Step 1: Upload
pipelineLogs.push({
  step: 'upload',
  status: 'success',
  startTime: new Date(startUploadTime),
  endTime: new Date(),
  duration: uploadDuration,
  message: 'Archivo subido a Cloud Storage',
  details: {
    fileSize: file.size,
    storagePath: `gs://bucket/${fileName}`,
  }
});

// Step 2: Extract
pipelineLogs.push({
  step: 'extract',
  status: 'success',
  startTime: new Date(startExtractTime),
  endTime: new Date(),
  duration: extractDuration,
  message: 'Texto extraído con Gemini AI',
  details: {
    model: 'gemini-2.5-flash',
    inputTokens: 12345,
    outputTokens: 8901,
    charactersExtracted: 45678,
    cost: 0.000234,
  }
});

// ... etc para chunk, embed, complete

// Guardar en Firestore
await createContextSource(userId, {
  name: fileName,
  pipelineLogs: pipelineLogs, // ✅ Se guarda completo
  // ... otros campos
});
```

---

## 🎨 Interacciones UX

### 1. Steps Expandibles

**Default State:**
- Extract, Chunk, Embed: Expandidos
- Upload, Complete: Colapsados

**Click en Step:**
- Toggle expand/collapse
- Animación suave
- Ícono chevron cambia (down/right)

### 2. Tabs con Estado

**Indicadores:**
- Tab activo: Borde azul inferior, fondo azul claro
- Tab inactivo: Gris, hover efecto
- Tab disabled: Gris, no clickable (si RAG no habilitado)

### 3. Chunk Modal

**Apertura:**
- Click en cualquier chunk card
- Modal overlay con backdrop oscuro
- Animación slide-up

**Cierre:**
- Click en X
- Click en botón "Cerrar"
- ESC key (si implementas useModalClose)

---

## 💾 Estructura de Datos en Firestore

### Collection: `context_sources`

```typescript
{
  id: 'source-abc123',
  userId: 'user-456',
  name: 'DDU-ESP-009-07.pdf',
  type: 'pdf',
  status: 'active',
  
  // Texto extraído
  extractedData: 'Texto completo extraído...',
  
  // Pipeline execution logs ✅ NUEVO
  pipelineLogs: [
    {
      step: 'upload',
      status: 'success',
      startTime: Timestamp,
      endTime: Timestamp,
      duration: 2100,
      message: 'Archivo subido a Cloud Storage',
      details: { fileSize: 2456789, storagePath: 'gs://...' }
    },
    {
      step: 'extract',
      status: 'success',
      startTime: Timestamp,
      endTime: Timestamp,
      duration: 8300,
      message: 'Texto extraído con Gemini AI',
      details: {
        model: 'gemini-2.5-flash',
        inputTokens: 12345,
        outputTokens: 8901,
        charactersExtracted: 45678,
        cost: 0.000234
      }
    },
    // ... chunk, embed, complete
  ],
  
  // RAG metadata
  ragEnabled: true,
  ragMetadata: {
    chunkCount: 24,
    avgChunkSize: 500,
    indexedAt: Timestamp,
    embeddingModel: 'text-embedding-004'
  },
  
  // Cloud Storage
  originalFileUrl: 'https://storage.googleapis.com/...',
}
```

### Collection: `document_chunks`

```typescript
{
  id: 'chunk-xyz789',
  sourceId: 'source-abc123',
  userId: 'user-456',
  sourceName: 'DDU-ESP-009-07.pdf', // For display
  chunkIndex: 0,
  text: 'Texto completo del chunk...',
  embedding: [0.1234, 0.5678, ...], // 768 valores
  metadata: {
    startChar: 0,
    endChar: 2345,
    tokenCount: 487,
    startPage: 1,
    endPage: 1
  },
  createdAt: Timestamp
}
```

**Indexes Required:**
```
- userId + sourceId + chunkIndex ASC
- sourceId + chunkIndex ASC
```

---

## 🧪 Testing Checklist

### Test 1: Upload Nuevo Documento

- [ ] Arrastra PDF al modal
- [ ] Click en funnel durante procesamiento
- [ ] Panel derecho se abre
- [ ] Ver progreso en tiempo real
- [ ] Steps cambian de pending → in_progress → success
- [ ] Duraciones se muestran
- [ ] Costos se calculan
- [ ] Complete step muestra banner verde

### Test 2: Ver Documento Completado

- [ ] Click en documento ya procesado
- [ ] Pipeline tab muestra todos los steps en success
- [ ] Click para expandir/colapsar steps funciona
- [ ] Detalles se muestran correctamente
- [ ] Estadísticas son precisas

### Test 3: Extracted Text

- [ ] Click en tab "Extracted Text"
- [ ] Texto se muestra completo
- [ ] Scroll funciona para textos largos
- [ ] Click "Descargar .txt"
- [ ] Archivo se descarga con nombre correcto
- [ ] Contenido del archivo es correcto

### Test 4: RAG Chunks

- [ ] Click en tab "RAG Chunks"
- [ ] Summary cards muestran datos correctos
- [ ] Lista de chunks carga
- [ ] Click en chunk abre modal
- [ ] Modal muestra texto completo
- [ ] Embedding preview se muestra (primeros 100)
- [ ] Cerrar modal funciona

### Test 5: Manejo de Errores

- [ ] Documento sin RAG: Tab "RAG Chunks" disabled
- [ ] Documento sin extractedData: Mensaje apropiado
- [ ] Error en pipeline: Step muestra error rojo
- [ ] Sugerencias de error se muestran

---

## 🚀 Beneficios para el Usuario

### Transparencia Total ✅

> "Veo exactamente qué pasó con mi documento en cada paso"

- Upload verificado con Cloud Storage path
- Extracción con modelo específico y costos reales
- Fragmentación con estadísticas claras
- Embeddings generados con modelo documentado

### Control Total ✅

> "Puedo verificar que el procesamiento fue correcto"

- Descargar texto extraído para validar
- Inspeccionar cada chunk individualmente
- Ver embeddings generados
- Entender costos exactos

### Confianza Total ✅

> "El sistema me muestra todo, no esconde nada"

- Proceso completamente visible
- Sin "cajas negras"
- Datos verificables
- Trazabilidad completa

---

## 📈 Métricas de Confianza

### Antes (Sin Detail View)

```
Usuario sube PDF
  ↓
"Processing..."
  ↓
"Complete ✅"
  ↓
¿Qué pasó? 🤷 (Caja negra)
```

**Confianza:** ⭐⭐ (2/5)

### Ahora (Con Detail View)

```
Usuario sube PDF
  ↓
Pipeline visual con 5 pasos
  ↓
Click en documento
  ↓
Ve TODOS los detalles:
- Upload path verificable
- Modelo y costos reales
- Texto completo descargable
- Chunks inspeccionables
  ↓
"¡Wow! Todo está claro y verificable"
```

**Confianza:** ⭐⭐⭐⭐⭐ (5/5)

---

## 🔧 Implementación Técnica

### Archivos Creados/Modificados

1. ✅ **Nuevo:** `src/components/PipelineDetailView.tsx`
   - Componente principal con 3 tabs
   - Lógica de carga de chunks
   - Modal para chunk details

2. ✅ **Modificado:** `src/components/ContextManagementDashboard.tsx`
   - Importa PipelineDetailView
   - Pasa source y userId como props
   - Layout compacto para fitting

3. ✅ **Modificado:** `src/pages/api/context-sources/[id]/chunks.ts`
   - Añadido GET endpoint
   - Retorna chunks ordenados por chunkIndex
   - Filtra por userId para seguridad

### Dependencies

- ✅ Lucide React icons (ya instalado)
- ✅ @google-cloud/firestore (ya instalado)
- ✅ Tailwind CSS (ya configurado)

---

## 🎓 Lecciones de Diseño

### 1. Progressive Disclosure

No mostramos todo de una vez. Usamos tabs y expandibles:
- Tab pipeline para timeline
- Tab extracted para texto
- Tab chunks para fragmentos
- Steps expandibles para detalles

### 2. Information Hierarchy

Información más importante primero:
- Summary stats arriba (tiempo, costo, estado)
- Pipeline steps en orden cronológico
- Detalles solo cuando se expanden

### 3. Visual Feedback

Estado siempre claro:
- Colores por estado (verde/azul/rojo/gris)
- Iconos por tipo de step
- Animaciones para progreso
- Badges para éxito/error

### 4. Trust Through Transparency

Todo es verificable:
- Cloud Storage path con link
- Costos exactos, no estimados
- Texto descargable
- Chunks inspeccionables

---

## 🔮 Futuro: Posibles Mejoras

### Corto Plazo

- [ ] Export pipeline summary as PDF
- [ ] Copy chunk text to clipboard
- [ ] Search within chunks
- [ ] Highlight search terms
- [ ] Chunk similarity heatmap

### Mediano Plazo

- [ ] Compare chunks across documents
- [ ] Visualize embedding vectors (t-SNE/UMAP)
- [ ] Re-chunk with different sizes
- [ ] Re-embed with different models
- [ ] A/B test chunk strategies

### Largo Plazo

- [ ] Interactive chunk editing
- [ ] Manual chunk merging/splitting
- [ ] Custom embedding models
- [ ] Multi-modal embeddings (text + images)
- [ ] Semantic search within UI

---

## ✅ Success Criteria

**Un usuario debe poder:**

1. ✅ Ver el progreso en tiempo real durante el upload
2. ✅ Entender qué modelo procesó su documento
3. ✅ Saber cuánto costó el procesamiento
4. ✅ Descargar el texto extraído para validar
5. ✅ Inspeccionar chunks individuales
6. ✅ Ver los embeddings generados
7. ✅ Confirmar que todo está listo para RAG
8. ✅ Asignar el documento a agentes específicos
9. ✅ Elegir entre full-text o RAG mode

**Métrica de Éxito:**
> "El usuario dice: 'Entiendo perfectamente qué pasó con mi documento y confío en el resultado'"

---

## 📚 Referencias

### Documentos Relacionados

- `PIPELINE_UPLOAD_FLOW_2025-10-18.md` - Flujo original del pipeline
- `RAG_READY_TO_DEPLOY.md` - Arquitectura RAG
- `STORAGE_ARCHITECTURE.md` - Cloud Storage setup
- `src/components/PipelineStatusPanel.tsx` - Panel original (más simple)
- `.cursor/rules/alignment.mdc` - Principio "Feedback & Visibility"

### Componentes Relacionados

- `ContextManagementDashboard.tsx` - Modal padre
- `PipelineStatusPanel.tsx` - Vista compacta del pipeline
- `src/types/context.ts` - Tipos TypeScript

---

**Implementación Completa:** ✅  
**Build Trust:** ✅  
**Transparency:** ✅  
**User Control:** ✅  

---

**Remember:** Trust is built through transparency. Show the user EVERYTHING. No black boxes. 🔍✨

