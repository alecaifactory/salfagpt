# Thinking Steps Timing & References Fix - 2025-10-20

## 🎯 Objetivo

Corregir el sistema de progreso de pensamiento y referencias para:
1. Mostrar cada paso durante 3 segundos con puntos progresivos
2. Usar chunks RAG sin necesidad de reindexar
3. Mostrar referencias clickeables en las respuestas
4. Registrar todo en el log de contexto con referencias

## ✅ Cambios Implementados

### 1. Timing de Thinking Steps (3 segundos cada uno)

**Archivo:** `src/pages/api/conversations/[id]/messages-stream.ts`

**Cambios:**
- ✅ Paso 1 "Pensando...": 1s → **3s**
- ✅ Paso 2 "Buscando Contexto Relevante...": Inmediato → **3s**  
- ✅ Paso 3 "Seleccionando Chunks...": 1s → **3s**
- ✅ Paso 4 "Generando Respuesta...": Streaming (variable)

**Implementación:**
```typescript
// Step 1: Pensando... (3 seconds)
sendStatus('thinking', 'active');
await new Promise(resolve => setTimeout(resolve, 3000));
sendStatus('thinking', 'complete');

// Step 2: Buscando Contexto Relevante... (3 seconds)
sendStatus('searching', 'active');
await new Promise(resolve => setTimeout(resolve, 3000));
// ... RAG search logic ...
sendStatus('searching', 'complete');

// Step 3: Seleccionando Chunks... (3 seconds)
sendStatus('selecting', 'active');
await new Promise(resolve => setTimeout(resolve, 3000));
sendStatus('selecting', 'complete');
```

**Resultado:**
- Usuario ve progreso visual durante ~9-12 segundos antes de recibir respuesta
- Puntos progresivos (...) se animan cada 500ms en frontend
- Estados cambian de pending → active → complete

---

### 2. Uso de Chunks Sin Reindexar (Retry Logic)

**Archivo:** `src/pages/api/conversations/[id]/messages-stream.ts`

**Problema Original:**
- RAG buscaba chunks con similarity > 0.5
- Si no encontraba, hacía fallback a documento completo
- Aunque existieran chunks, no los usaba si similarity era baja

**Solución:**
```typescript
if (ragResults.length === 0) {
  // Verificar si existen chunks
  const chunksSnapshot = await firestore
    .collection('document_chunks')
    .where('userId', '==', userId)
    .where('sourceId', 'in', activeSourceIds.slice(0, 10))
    .limit(1)
    .get();
  
  if (!chunksSnapshot.empty) {
    // Chunks existen - retry con threshold más bajo
    const retryResults = await searchRelevantChunks(userId, message, {
      topK: ragTopK * 2, // Duplicar topK
      minSimilarity: 0.3, // Bajar threshold a 30%
      activeSourceIds
    });
    
    if (retryResults.length > 0) {
      // ✅ Usar chunks con threshold más bajo
      additionalContext = buildRAGContext(retryResults);
      ragUsed = true;
      ragResults = retryResults;
    }
  }
}
```

**Resultado:**
- Primero intenta con minSimilarity configurado (default 0.5)
- Si no encuentra chunks, verifica si existen chunks en Firestore
- Si existen, hace retry con threshold 0.3 y topK x2
- Solo usa fallback si NO existen chunks o retry también falla

---

### 3. System Instruction para Citas Inline

**Archivo:** `src/lib/gemini.ts`

**Cambio:** Mejorar system instruction en `streamAIResponse()` para que AI incluya referencias inline.

**Implementación:**
```typescript
if (userContext) {
  enhancedSystemInstruction = `${systemInstruction}

IMPORTANTE: Cuando uses información de los documentos de contexto:
- Incluye referencias numeradas inline usando el formato [1], [2], etc.
- Coloca la referencia INMEDIATAMENTE después de la información que uses
- Sé específico: cada dato del documento debe tener su referencia

Ejemplo:
"Las construcciones en subterráneo deben cumplir con distanciamientos[1]. 
La DDU 189 establece zonas inexcavables[2]."`;
}
```

**Resultado:**
- AI incluye [1], [2], [3] en el texto inmediatamente después de usar información de contexto
- MessageRenderer detecta estos marcadores y los convierte en badges clickeables
- Cada badge abre el panel derecho con los detalles del chunk

---

### 4. Referencias en Respuestas

**Archivos modificados:**
- `src/pages/api/conversations/[id]/messages-stream.ts`
- `src/components/ChatInterfaceWorking.tsx`  
- `src/components/MessageRenderer.tsx` (ya tenía la lógica)

**Flujo Completo:**

#### Backend (messages-stream.ts):
```typescript
// Construir referencias desde RAG results
const references = ragResults.map((result, index) => ({
  id: index + 1, // [1], [2], [3], etc.
  sourceId: result.sourceId,
  sourceName: result.sourceName,
  chunkIndex: result.chunkIndex,
  similarity: result.similarity,
  snippet: result.text.substring(0, 300),
  fullText: result.text, // Texto completo del chunk
  metadata: {
    startChar: result.metadata.startChar,
    endChar: result.metadata.endChar,
    tokenCount: result.metadata.tokenCount,
    startPage: result.metadata.startPage,
    endPage: result.metadata.endPage,
  }
}));

// Guardar mensaje con referencias
await addMessage(conversationId, userId, 'assistant', 
  { type: 'text', text: fullResponse },
  tokenCount,
  undefined,
  references // ✅ Referencias guardadas en Firestore
);

// Enviar al frontend en completion event
controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
  type: 'complete',
  messageId: aiMsg.id,
  references: references, // ✅ Referencias enviadas al frontend
  ragConfiguration: {...}
})}\n\n`));
```

#### Frontend (ChatInterfaceWorking.tsx):
```typescript
// Cuando llega completion event
if (data.type === 'complete') {
  // Agregar referencias al mensaje
  setMessages(prev => prev.map(msg => 
    msg.id === streamingId 
      ? { 
          ...msg, 
          id: finalMessageId,
          content: accumulatedContent,
          references: data.references, // ✅ Referencias en mensaje
        }
      : msg
  ));
  
  // Agregar referencias al context log
  const log: ContextLog = {
    // ... otros campos ...
    references: data.references, // ✅ Referencias en log
  };
  setContextLogs(prev => [...prev, log]);
}
```

#### MessageRenderer:
```typescript
// Procesar contenido para hacer badges clickeables
const processedContent = useMemo(() => {
  if (!references || references.length === 0) return content;
  
  let processed = content;
  
  // Reemplazar [1], [2] con badges clickeables
  references.forEach(ref => {
    const pattern = new RegExp(`\\[${ref.id}\\]`, 'g');
    processed = processed.replace(pattern, 
      `<sup><span class="reference-badge ... cursor-pointer" 
        data-ref-id="${ref.id}">[${ref.id}]</span></sup>`
    );
  });
  
  return processed;
}, [content, references]);

// Event listener para clicks en badges
useEffect(() => {
  const handleReferenceClick = (e: Event) => {
    const badge = e.target.closest('.reference-badge');
    if (badge) {
      const refId = parseInt(badge.getAttribute('data-ref-id'));
      const reference = references.find(r => r.id === refId);
      if (reference && onReferenceClick) {
        onReferenceClick(reference); // ✅ Abre ReferencePanel
      }
    }
  };
  document.addEventListener('click', handleReferenceClick);
  return () => document.removeEventListener('click', handleReferenceClick);
}, [references]);
```

**Resultado:**
- AI genera respuesta con [1], [2], [3] inline
- Cada número es un badge azul clickeable
- Click abre panel derecho con:
  - Fuente del chunk
  - Similitud (%)
  - Texto completo del chunk
  - Metadata (páginas, tokens, etc.)

---

### 5. Referencias en Context Log

**Archivo:** `src/components/ChatInterfaceWorking.tsx`

**Sección:** Detalles expandibles del log

**Implementación:**
```tsx
{/* NEW: Display chunk references used in response */}
{log.references && log.references.length > 0 && (
  <div className="mt-2 text-[10px]">
    <p className="text-slate-600 font-semibold mb-1">
      📚 Referencias utilizadas ({log.references.length} chunks):
    </p>
    <div className="space-y-1">
      {log.references.map(ref => (
        <button
          key={ref.id}
          onClick={() => setSelectedReference(ref)}
          className="w-full text-left bg-blue-50 ... hover:bg-blue-100"
        >
          <div className="flex items-start gap-2">
            <span className="...badge...">[{ref.id}]</span>
            <div>
              <p className="font-semibold">{ref.sourceName}</p>
              <p className="similarity">{(ref.similarity * 100).toFixed(1)}%</p>
              <p className="snippet">{ref.snippet}</p>
              <p className="chunk-info">Chunk #{ref.chunkIndex + 1} • {ref.metadata?.tokenCount} tokens</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  </div>
)}
```

**Resultado:**
- Sección expandible "Ver detalles completos" muestra referencias
- Cada referencia es clickeable
- Click abre panel derecho con detalles del chunk
- Incluye similitud, snippet, chunk number, tokens

---

## 🔄 Flujo Completo de Usuario

### 1. Usuario envía mensaje con contexto RAG activo

```
Usuario escribe: "que sabemos de esto?"
                    ↓
Frontend: sendMessage()
                    ↓
API: /api/conversations/:id/messages-stream
```

### 2. Backend procesa con timing visual

```
Step 1: "Pensando..." (3s)
   ↓ (sendStatus 'thinking' active → complete)
   
Step 2: "Buscando Contexto Relevante..." (3s + RAG search)
   ↓ searchRelevantChunks()
   ↓ Encontró 3 chunks con similarity > 0.5
   ↓ (sendStatus 'searching' active → complete)
   
Step 3: "Seleccionando Chunks..." (3s)
   ↓ Envía chunk details al frontend
   ↓ (sendStatus 'selecting' active → complete)
   
Step 4: "Generando Respuesta..." (streaming)
   ↓ streamAIResponse() con enhanced system instruction
   ↓ AI genera: "La Ley N°19.537[1] derogó la Ley N°6.071[2]..."
   ↓ (sendStatus 'generating' active → complete)
```

### 3. Backend construye referencias

```
ragResults = [
  { id: chunk1, sourceId: 'source-abc', chunkIndex: 5, similarity: 0.85, text: "..." },
  { id: chunk2, sourceId: 'source-abc', chunkIndex: 8, similarity: 0.73, text: "..." },
  { id: chunk3, sourceId: 'source-abc', chunkIndex: 12, similarity: 0.68, text: "..." }
]
                    ↓
references = [
  { id: 1, sourceId: 'source-abc', sourceName: 'Cir32.pdf', chunkIndex: 5, similarity: 0.85, snippet: "...", fullText: "..." },
  { id: 2, sourceId: 'source-abc', sourceName: 'Cir32.pdf', chunkIndex: 8, similarity: 0.73, snippet: "...", fullText: "..." },
  { id: 3, sourceId: 'source-abc', sourceName: 'Cir32.pdf', chunkIndex: 12, similarity: 0.68, snippet: "...", fullText: "..." }
]
                    ↓
Guardar mensaje con references en Firestore
                    ↓
Enviar completion event con references al frontend
```

### 4. Frontend renderiza con referencias

```
MessageRenderer recibe:
- content: "La Ley N°19.537[1] derogó la Ley N°6.071[2]..."
- references: [{ id: 1, ... }, { id: 2, ... }, { id: 3, ... }]
                    ↓
Procesa contenido:
- Encuentra [1], [2], [3] en el texto
- Los reemplaza con badges azules clickeables
- Cada badge tiene data-ref-id="X"
                    ↓
Resultado visual:
"La Ley N°19.537 [1] derogó la Ley N°6.071 [2]..."
                ^^^^                    ^^^^
              (badge)                (badge)
                    ↓
Footer con lista de referencias:
📚 Referencias utilizadas (3)
  [1] Cir32.pdf - 85.0% similar
      "texto del chunk..."
      Chunk #6 • 450 tokens
  [2] Cir32.pdf - 73.0% similar
      ...
  [3] Cir32.pdf - 68.0% similar
      ...
```

### 5. Click en referencia abre panel derecho

```
Usuario click en [1]
                    ↓
Event listener detecta click
                    ↓
const refId = badge.getAttribute('data-ref-id') // "1"
const reference = references.find(r => r.id === 1)
                    ↓
onReferenceClick(reference)
                    ↓
setSelectedReference(reference)
                    ↓
ReferencePanel se renderiza con:
- Título: "Referencia [1]"
- Fuente: "Cir32.pdf"
- Similitud: 85.0% (barra verde)
- Chunk #6 • 450 tokens
- Texto completo del chunk (destacado)
- Botón "Ver documento completo"
```

### 6. Referencias en Context Log

```
Después de recibir respuesta completa
                    ↓
Crear ContextLog con:
- userMessage
- aiResponse  
- model
- contextSources (con modo RAG o full-text)
- ragConfiguration
- references ✅ NUEVO
                    ↓
setContextLogs(prev => [...prev, log])
                    ↓
Panel de contexto muestra:
- Tabla con interacción
- Modo: 🔍 RAG (3 chunks)
- Expandible con referencias clickeables
```

## 🎨 Visualización de Referencias

### En la respuesta del AI:
```
La Ley N°19.537 [1] derogó la Ley N°6.071 [2].
                ^^^                      ^^^
            (badge azul clickeable)
            
📚 Referencias utilizadas (2)
  ┌────────────────────────────────────────┐
  │ [1] Cir32.pdf              85.0% ✓    │
  │     "las construcciones en..."         │
  │     Chunk #6 • 450 tokens              │
  └────────────────────────────────────────┘
  ┌────────────────────────────────────────┐
  │ [2] Cir32.pdf              73.0% ✓    │
  │     "la ley antigua ya no..."          │
  │     Chunk #9 • 380 tokens              │
  └────────────────────────────────────────┘
```

### En el Context Log (expandible):
```
📊 Log de Contexto por Interacción
┌──────┬──────────┬───────┬──────┬───────┬────────┐
│ Hora │ Pregunta │ Modelo│ Modo │ Input │ Output │
├──────┼──────────┼───────┼──────┼───────┼────────┤
│12:35 │ que sa...│ Flash │🔍RAG │   40  │   453  │
│      │          │       │3 chk │       │        │
└──────┴──────────┴───────┴──────┴───────┴────────┘

▼ Ver detalles completos
  
  #1 - 12:35:22 PM
  Pregunta: "que sabemos de esto?"
  Modelo: gemini-2.5-flash
  
  Fuentes activas:
  • 🔍 Cir32.pdf (2,023 tokens - RAG)
  
  📚 Referencias utilizadas (3 chunks):
  ┌────────────────────────────────────────┐
  │ [1] Cir32.pdf              85.0% ✓    │ ← Click abre panel
  │     "las construcciones en..."         │
  │     Chunk #6 • 450 tokens              │
  └────────────────────────────────────────┘
  ...
```

### Panel Derecho (ReferencePanel):
```
┌─────────────────────────────────────────┐
│ 📄 Referencia [1]                    ✕ │
│ Cir32.pdf                               │
├─────────────────────────────────────────┤
│                                         │
│ Similitud: ████████░░ 85.0%            │
│                                         │
│ Chunk #6 • 450 tokens                  │
│ 📄 Páginas 3-4                         │
│                                         │
│ ─────────────────────────────────────  │
│                                         │
│ Texto del chunk utilizado:              │
│                                         │
│ ┌─────────────────────────────────────┐│
│ │ las construcciones en subterráneo   ││
│ │ deben cumplir con las disposiciones ││
│ │ sobre distanciamientos o zonas      ││
│ │ inexcavables que hayan sido         ││
│ │ establecidas...                     ││
│ └─────────────────────────────────────┘│
│                                         │
│ 💡 Nota: Este extracto fue utilizado   │
│    por el AI para generar la respuesta.│
│                                         │
│ ┌─────────────────────────────────────┐│
│ │ 🔗 Ver documento completo           ││
│ └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

## 🔧 Compatibilidad Backward

### ✅ Preservado:
- Mensajes antiguos sin references → funcionan normalmente
- Context logs antiguos sin references → se muestran sin sección de referencias
- Full-text mode sigue funcionando si RAG falla
- Todos los campos existentes sin cambios

### ✅ Additive Only:
- `references` es campo opcional en Message
- `references` es campo opcional en ContextLog
- System instruction enhanced solo cuando hay userContext
- Retry logic solo cuando RAG está habilitado

## 📊 Resultado Esperado

### Progreso visible:
```
Pensando... (3s)
  ↓
✓ Pensando...
Buscando Contexto Relevante... (3s)
  ↓
✓ Buscando Contexto Relevante...
Seleccionando Chunks... (3s)
  ↓
✓ Seleccionando Chunks...
Generando Respuesta... (streaming)
  ↓
✓ Generando Respuesta...
[Respuesta completa con referencias]
```

### Respuesta con referencias:
```
La Ley N°19.537 [1] derogó la Ley N°6.071 [2]. Esto significa que 
la ley antigua ya no está vigente [1]. La nueva ley se aplica a las 
comunidades de copropietarios [3]...

📚 Referencias utilizadas (3)
  [1] Cir32.pdf - 85.0% • Chunk #6 (click para ver)
  [2] Cir32.pdf - 73.0% • Chunk #9 (click para ver)
  [3] Cir32.pdf - 68.0% • Chunk #12 (click para ver)
```

### Context Log actualizado:
```
Modo: 🔍 RAG (3 chunks) ← Ya NO dice "fallback"
Habilitado: Sí
Realmente usado: ✅ Sí ← CORRECTO
Fallback: ❌ No ← CORRECTO

📚 Referencias utilizadas (3 chunks):
  [1] Cir32.pdf - 85.0% • Chunk #6
  [2] Cir32.pdf - 73.0% • Chunk #9  
  [3] Cir32.pdf - 68.0% • Chunk #12
```

## ✅ Verificación

### Pre-commit checks:
```bash
# Type check
npm run type-check

# Build
npm run build

# Test in browser
npm run dev
# - Enviar mensaje con contexto RAG
# - Ver progreso durante 9s
# - Ver referencias en respuesta
# - Click en [1] abre panel
# - Ver referencias en context log
```

### Expected console logs:
```
🔍 RAG Search starting...
  ✓ Query embedding generated (234ms)
  ✓ Loaded 45 chunks (156ms)
  ✓ Found 3 similar chunks (89ms)
  ✓ Loaded metadata (45ms)
✅ RAG Search complete - 3 results
  1. Cir32.pdf (chunk 5) - 85.0% similar
  2. Cir32.pdf (chunk 8) - 73.0% similar
  3. Cir32.pdf (chunk 11) - 68.0% similar

📚 Built references for message: 3
  [1] Cir32.pdf - 85.0% - Chunk #6
  [2] Cir32.pdf - 73.0% - Chunk #9
  [3] Cir32.pdf - 68.0% - Chunk #12
  
📚 Message saved with references: 3
```

## 🎯 Status

- [x] Thinking steps timing (3s cada uno)
- [x] Retry logic para usar chunks sin reindexar
- [x] Enhanced system instruction para citas inline
- [x] Referencias en mensaje (badges clickeables)
- [x] Referencias en ReferencePanel
- [x] Referencias en ContextLog expandible
- [x] Backward compatibility preservada

**Ready to test!** 🚀

