# Flujo Completo de RAG - Sistema de Trazabilidad

## 🎯 Objetivo

Asegurar trazabilidad completa del uso de chunks en conversaciones con el agente, mostrando:
1. **Estado RAG correcto** en el UI (sin cargar todos los chunks)
2. **Búsqueda semántica** durante la conversación (RAG real)
3. **Referencias a chunks usados** con % de similitud
4. **Historia completa** de qué contexto se usó en cada respuesta

---

## 🔄 Flujo Completo del Sistema

### 1. Carga Inicial del Agente

```
Usuario selecciona agente "Context 32"
  ↓
loadContextForConversation(conversationId)
  ↓
1. Carga fuentes desde /api/context-sources?userId=...
2. Filtra fuentes asignadas al agente
3. Para cada fuente:
   - Si tiene ragMetadata.chunkCount > 0 → ragEnabled = true
   - Si no, verifica con /api/context-sources/${id}/chunks (solo stats)
4. Actualiza estado con ragEnabled correcto
  ↓
UI muestra estado correcto:
  ✅ "Indexado con RAG - 5 chunks" (si tiene chunks)
  ⚠️ "RAG no indexado" (si no tiene chunks)
```

**Clave:** Solo verificamos que existen chunks, **NO los cargamos todos**.

---

### 2. Usuario Envía Mensaje

```
Usuario escribe: "¿Cuál es la política de copropiedad?"
  ↓
sendMessage() en ChatInterfaceWorking.tsx
  ↓
POST /api/conversations/${id}/messages-stream
  Body: {
    userId,
    message,
    model,
    systemPrompt,
    contextSources: [{ id, name, content: extractedData }],
    ragEnabled: true,  // ← Modo RAG habilitado
    ragTopK: 5,        // ← Top 5 chunks más relevantes
    ragMinSimilarity: 0.5  // ← Umbral mínimo de similitud
  }
```

---

### 3. Búsqueda Semántica RAG (Backend)

```
API Endpoint: messages-stream.ts
  ↓
Si ragEnabled === true:
  ↓
  searchRelevantChunks(userId, message, {
    topK: 5,
    minSimilarity: 0.5,
    activeSourceIds: ['source-id-1', 'source-id-2']
  })
  ↓
  🔍 Búsqueda semántica en Firestore:
    - Genera embedding de la pregunta del usuario
    - Busca en colección 'content_chunks'
    - Filtra por sourceId IN activeSourceIds
    - Calcula similitud coseno
    - Ordena por similitud DESC
    - Toma top 5 chunks que cumplan minSimilarity >= 0.5
  ↓
  Devuelve: [
    {
      sourceId: 'abc123',
      sourceName: 'Cir32.pdf',
      chunkIndex: 2,
      text: '...texto del chunk relevante...',
      similarity: 0.87,  // ← 87% de similitud
      metadata: { ... }
    },
    {
      sourceId: 'abc123',
      sourceName: 'Cir32.pdf',
      chunkIndex: 4,
      text: '...otro chunk relevante...',
      similarity: 0.73,  // ← 73% de similitud
      metadata: { ... }
    }
  ]
```

**Resultado:** Solo los chunks **más relevantes** se usan (no todo el documento).

---

### 4. Construcción del Prompt para Gemini

```
buildRAGContext(ragResults)
  ↓
Contexto construido:
"""
=== Fragmentos Relevantes del Contexto ===

[Fuente: Cir32.pdf - Fragmento #2 - Similitud: 87%]
...texto del chunk 2...

[Fuente: Cir32.pdf - Fragmento #4 - Similitud: 73%]
...texto del chunk 4...
"""
  ↓
Prompt completo para Gemini:
  - System Prompt
  - Historia de conversación (últimos 10 mensajes)
  - Contexto RAG (solo chunks relevantes)
  - Pregunta del usuario
  ↓
Total tokens del contexto: ~2,500 tokens
(vs. ~2,023 tokens si fuera documento completo)
```

---

### 5. Respuesta del AI con Referencias

```
Gemini genera respuesta
  ↓
Backend construye referencias:
  references = ragResults.map((result, index) => ({
    id: index + 1,
    sourceId: result.sourceId,
    sourceName: result.sourceName,
    chunkIndex: result.chunkIndex,
    similarity: result.similarity,
    snippet: result.text.substring(0, 200),
    fullText: result.text,
    metadata: result.metadata
  }))
  ↓
Guarda mensaje en Firestore:
  {
    role: 'assistant',
    content: '...respuesta del AI...',
    references: [
      { id: 1, sourceName: 'Cir32.pdf', chunkIndex: 2, similarity: 0.87 },
      { id: 2, sourceName: 'Cir32.pdf', chunkIndex: 4, similarity: 0.73 }
    ]
  }
  ↓
Devuelve al frontend
```

---

### 6. Visualización en el UI

```
MessageRenderer recibe:
  - content: "...respuesta del AI..."
  - references: [{ id: 1, sourceName: 'Cir32.pdf', chunkIndex: 2, similarity: 0.87 }, ...]
  ↓
Renderiza:
  1. Contenido de la respuesta en Markdown
  2. Badges inline: [1] [2] (clickables)
  3. Sección "📚 Referencias utilizadas (2)":
     ┌─────────────────────────────────────┐
     │ [1] Cir32.pdf - Chunk #2            │
     │     87.0% similar                   │
     │     "...snippet del chunk..."       │
     └─────────────────────────────────────┘
     ┌─────────────────────────────────────┐
     │ [2] Cir32.pdf - Chunk #4            │
     │     73.0% similar                   │
     │     "...snippet del chunk..."       │
     └─────────────────────────────────────┘
```

---

### 7. Panel de Referencias (Click en [1])

```
Usuario hace click en badge [1]
  ↓
onReferenceClick(reference)
  ↓
setSelectedReference(reference)
  ↓
ReferencePanel se abre mostrando:
  - Fuente: Cir32.pdf
  - Chunk: #2 de 5
  - Similitud: 87.0% ⭐
  - Texto completo del chunk
  - Metadata del chunk
  - Opción de ir al documento original
```

---

## 📊 Log de Contexto - Trazabilidad Completa

Cada interacción se registra en `contextLogs`:

```typescript
{
  id: 'log-123',
  timestamp: new Date(),
  userMessage: '¿Cuál es la política de copropiedad?',
  model: 'gemini-2.5-flash',
  systemPrompt: '...',
  contextSources: [
    { 
      name: 'Cir32.pdf', 
      tokens: 2500,
      mode: 'rag'  // ← Indica que se usó RAG
    }
  ],
  totalInputTokens: 3049,  // system + history + RAG context + user message
  totalOutputTokens: 567,
  aiResponse: '...respuesta completa...',
  
  // ✅ NUEVO: Configuración RAG usada
  ragConfiguration: {
    enabled: true,
    actuallyUsed: true,  // ← RAG se usó exitosamente
    hadFallback: false,  // ← NO hubo fallback a full-text
    topK: 5,
    minSimilarity: 0.5,
    stats: {
      totalChunks: 2,  // ← Solo 2 chunks usados de 5 disponibles
      totalTokens: 2500,
      avgSimilarity: 0.80,  // ← Promedio: 80% similitud
      sources: [
        {
          id: 'abc123',
          name: 'Cir32.pdf',
          chunkCount: 2,  // ← 2 chunks de este documento
          tokens: 2500,
          chunks: [  // ← Detalle de qué chunks específicos
            { chunkIndex: 2, similarity: 0.87, tokens: 1200 },
            { chunkIndex: 4, similarity: 0.73, tokens: 1300 }
          ]
        }
      ]
    }
  }
}
```

---

## 🎨 Visualización en el UI

### Panel de "Desglose del Contexto" (Expandido)

```
┌────────────────────────────────────────────────────────┐
│ Desglose del Contexto              0.3% usado         │
├────────────────────────────────────────────────────────┤
│ Total Tokens: 3,049                                    │
│ Disponible: 996,951                                    │
│ Capacidad: 1000K                                       │
├────────────────────────────────────────────────────────┤
│ 📊 Desglose Detallado                                  │
│                                                        │
│ System Prompt:                          49 tokens      │
│ Historial (0 mensajes):                 0 tokens       │
│ Contexto de Fuentes:  🔍 1 RAG    2,500 tokens       │
│ Mensaje del Usuario:                   500 tokens      │
├────────────────────────────────────────────────────────┤
│ Fuentes de Contexto    1 activas • ~2,500 tokens      │
│                                                        │
│ ┌────────────────────────────────────────────────┐   │
│ │ 📄 Cir32.pdf                                   │   │
│ │ ✓ Validado  🔵 RAG  🔄 CLI                    │   │
│ │                                                 │   │
│ │ ✅ Indexado con RAG        5 chunks            │   │
│ │ Estimado por consulta:     ~2,500 tokens       │   │
│ │ Full-text sería:           2,023 tokens        │   │
│ │ 💰 Ahorro: ~0%                                  │   │
│ └────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────┘
```

### Respuesta del AI con Referencias

```
┌────────────────────────────────────────────────────────┐
│ 🤖 Gemini 2.5 Flash                                    │
├────────────────────────────────────────────────────────┤
│                                                        │
│ Según la información proporcionada [1], la política   │
│ de copropiedad establece que... [2]                   │
│                                                        │
│ ───────────────────────────────────────────────────    │
│ 📚 Referencias utilizadas (2)                          │
│                                                        │
│ ┌──────────────────────────────────────────────┐      │
│ │ [1] 📄 Cir32.pdf - Chunk #2                  │      │
│ │     87.0% similar ⭐⭐⭐                         │      │
│ │     "COPROPIEDAD INMOBILIARIA; SUBDIVISION..."│      │
│ └──────────────────────────────────────────────┘      │
│                                                        │
│ ┌──────────────────────────────────────────────┐      │
│ │ [2] 📄 Cir32.pdf - Chunk #4                  │      │
│ │     73.0% similar ⭐⭐                          │      │
│ │     "...mat.:++ Ley N°19.537..."             │      │
│ └──────────────────────────────────────────────┘      │
└────────────────────────────────────────────────────────┘
```

---

## ✅ Qué Hace la Solución Actual

### Verificación de Estado (Lo que acabamos de arreglar)

```typescript
// Al cargar agente, verificamos que existan chunks:
const sourcesWithVerifiedRAG = await Promise.all(
  filteredSources.map(async (source) => {
    // Si ya tiene ragMetadata.chunkCount > 0, confiamos en eso
    if (source.ragMetadata?.chunkCount > 0) {
      return { ...source, ragEnabled: true };
    }
    
    // Si no, verificamos rápidamente con el endpoint de stats
    const chunksResponse = await fetch(`/api/context-sources/${source.id}/chunks`);
    const chunksData = await chunksResponse.json();
    
    return {
      ...source,
      ragEnabled: chunksData.stats.totalChunks > 0,
      ragMetadata: {
        chunkCount: chunksData.stats.totalChunks,
        avgChunkSize: chunksData.stats.avgChunkSize,
        // ...
      }
    };
  })
);
```

**Resultado:** UI muestra "✅ Indexado con RAG - 5 chunks" correctamente.

---

### Búsqueda Semántica durante Conversación (Ya implementado)

```typescript
// En messages-stream.ts líneas 84-109:
if (ragEnabled && activeSourceIds.length > 0) {
  // 1. Búsqueda semántica
  const ragResults = await searchRelevantChunks(userId, message, {
    topK: 5,              // ← Solo top 5 chunks más relevantes
    minSimilarity: 0.5,   // ← Mínimo 50% de similitud
    activeSourceIds       // ← Solo de fuentes activas
  });
  
  // 2. Si encuentra chunks relevantes
  if (ragResults.length > 0) {
    // Usar SOLO esos chunks (no documento completo)
    additionalContext = buildRAGContext(ragResults);
    ragUsed = true;
    ragStats = getRAGStats(ragResults);
    
    // 3. Construir referencias para mostrar en UI
    references = ragResults.map((result, index) => ({
      id: index + 1,
      sourceId: result.sourceId,
      sourceName: result.sourceName,
      chunkIndex: result.chunkIndex,
      similarity: result.similarity,  // ← % de similitud
      snippet: result.text.substring(0, 200),
      fullText: result.text
    }));
  } else {
    // Fallback a documento completo si no hay chunks relevantes
    ragHadFallback = true;
  }
}
```

**Resultado:** Solo chunks relevantes se usan en el prompt.

---

### Referencias en la Respuesta (Ya implementado)

```typescript
// MessageRenderer.tsx líneas 312-342:
{references.length > 0 && (
  <div className="mt-6 pt-4 border-t border-slate-200">
    <h4 className="text-xs font-semibold text-slate-600 mb-3">
      📚 Referencias utilizadas ({references.length})
    </h4>
    <div className="space-y-2">
      {references.map(ref => (
        <button onClick={() => onReferenceClick(ref)}>
          <div className="flex items-center justify-between">
            <div>
              <FileText className="w-3.5 h-3.5" />
              <p className="text-xs font-semibold">{ref.sourceName}</p>
              <p className="text-xs text-slate-500">Chunk #{ref.chunkIndex}</p>
            </div>
            {ref.similarity !== undefined && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                ref.similarity >= 0.8 ? 'bg-green-100 text-green-700' :
                ref.similarity >= 0.6 ? 'bg-yellow-100 text-yellow-700' :
                'bg-orange-100 text-orange-700'
              }`}>
                {(ref.similarity * 100).toFixed(1)}% similar
              </span>
            )}
          </div>
          <p className="text-xs text-slate-600 mt-1 line-clamp-2">
            {ref.snippet}
          </p>
        </button>
      ))}
    </div>
  </div>
)}
```

**Resultado:** Referencias visibles con % de similitud en colores.

---

## 📋 Trazabilidad Completa

### En cada ContextLog

```typescript
interface ContextLog {
  // Pregunta del usuario
  userMessage: string,
  
  // Historia usada
  conversationHistory: Message[],  // Últimos 10 mensajes
  
  // Contexto usado
  contextSources: [
    { 
      name: 'Cir32.pdf', 
      tokens: 2500,
      mode: 'rag'  // ← Indica que se usó RAG
    }
  ],
  
  // Configuración RAG
  ragConfiguration: {
    enabled: true,
    actuallyUsed: true,
    hadFallback: false,
    topK: 5,
    minSimilarity: 0.5,
    stats: {
      totalChunks: 2,      // ← 2 chunks usados
      avgSimilarity: 0.80, // ← 80% similitud promedio
      sources: [
        {
          name: 'Cir32.pdf',
          chunkCount: 2,
          chunks: [
            { chunkIndex: 2, similarity: 0.87, tokens: 1200 },
            { chunkIndex: 4, similarity: 0.73, tokens: 1300 }
          ]
        }
      ]
    }
  },
  
  // Respuesta generada
  aiResponse: '...',
  
  // Tokens usados
  totalInputTokens: 3049,
  totalOutputTokens: 567,
}
```

---

## 🔍 Panel de Log de Contexto - Vista Expandible

### Tabla Compacta (Vista Principal)

```
┌──────────┬─────────────┬───────┬───────┬────────┬───────┬──────────┬──────┐
│ Hora     │ Pregunta    │ Modelo│ Input │ Output │ Total │ Disponib │ Uso% │
├──────────┼─────────────┼───────┼───────┼────────┼───────┼──────────┼──────┤
│ 10:30:45 │ ¿Cuál es... │ Flash │ 3,049 │   567  │ 3,616 │  996,384 │ 0.4% │
│          │             │🔍 RAG │       │        │       │          │      │
└──────────┴─────────────┴───────┴───────┴────────┴───────┴──────────┴──────┘
          ▼ Click para expandir
```

### Fila Expandida (Detalle Completo)

```
┌──────────────────────────────────────────────────────────────────┐
│ 🕐 10:30:45                                                      │
├──────────────────────────────────────────────────────────────────┤
│ 💬 Pregunta del Usuario:                                         │
│ "¿Cuál es la política de copropiedad según el DDU 32?"          │
├──────────────────────────────────────────────────────────────────┤
│ 📚 Contexto RAG Utilizado:                     2 chunks - 2,500t│
│                                                                  │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ [1] Cir32.pdf - Chunk #2          87.0% ⭐⭐⭐            │   │
│ │     1,200 tokens                                         │   │
│ │     "COPROPIEDAD INMOBILIARIA; SUBDIVISION TERRENO..."   │   │
│ └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ [2] Cir32.pdf - Chunk #4          73.0% ⭐⭐             │   │
│ │     1,300 tokens                                         │   │
│ │     "++mat.:++ Ley N°19.537 Copropiedad Inmobiliaria"   │   │
│ └──────────────────────────────────────────────────────────┘   │
├──────────────────────────────────────────────────────────────────┤
│ 🤖 Respuesta Generada:                                   567t   │
│                                                                  │
│ "Según el DDU 32, la copropiedad inmobiliaria se rige por..."  │
│ [Ver respuesta completa]                                        │
├──────────────────────────────────────────────────────────────────┤
│ 📊 Tokens Breakdown:                                             │
│ • System Prompt:        49t                                     │
│ • Historia:              0t (nueva conversación)                │
│ • RAG Context:      2,500t (2 chunks de 5 disponibles)         │
│ • User Message:       500t                                      │
│ • AI Response:        567t                                      │
│ ───────────────────────                                         │
│ Total Input:        3,049t                                      │
│ Total Output:         567t                                      │
│ Total:              3,616t                                      │
└──────────────────────────────────────────────────────────────────┘
```

---

## ✅ Resumen del Sistema Completo

### 1. Estado RAG (UI)
- ✅ Verifica existencia de chunks sin cargarlos
- ✅ Muestra "Indexado con RAG - X chunks"
- ✅ Consistente en todas las vistas

### 2. Búsqueda Semántica (Backend)
- ✅ RAG search con embeddings
- ✅ Top K chunks más relevantes
- ✅ Umbral de similitud mínima
- ✅ Fallback a full-text si no hay resultados

### 3. Referencias (UI)
- ✅ Badges inline [1] [2] clickables
- ✅ Sección de referencias con % similitud
- ✅ Panel detallado al hacer click

### 4. Trazabilidad (Logs)
- ✅ Qué chunks se usaron exactamente
- ✅ % de similitud de cada chunk
- ✅ Tokens por chunk
- ✅ Historia completa de interacciones

---

## 🧪 Próximos Pasos para Verificar

1. **Refrescar navegador** (Cmd + Shift + R)
2. **Seleccionar agente "Context 32"**
3. **Verificar en consola** el log de RAG status
4. **Verificar en panel de contexto** que muestre "✅ Indexado con RAG"
5. **Enviar un mensaje** relacionado con el contenido de Cir32.pdf
6. **Verificar en la respuesta** las referencias con % de similitud
7. **Hacer click en una referencia** para ver el chunk completo

---

**Estado:** ✅ Sistema completo implementado  
**Próximo paso:** Verificación del usuario







