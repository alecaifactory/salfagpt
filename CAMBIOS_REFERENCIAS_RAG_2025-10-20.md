# 📝 Cambios Implementados: Referencias RAG con % Similitud Real - 2025-10-20

## 🎯 Problemas Resueltos

### 1. ✅ AI Ahora Sabe Qué Fragmentos Recibió
**Antes:** System prompt genérico pedía citas, pero el AI no sabía qué fragmentos tenía disponibles.

**Ahora:** System prompt explícitamente lista los números de fragmento disponibles y exige citar cada uno.

**Cambio:** `src/lib/gemini.ts` líneas 386-446

---

### 2. ✅ Frontend Recibe Mapping de Fragmentos Esperados
**Antes:** Frontend no sabía qué citas esperar del AI.

**Ahora:** Backend envía `fragmentMapping` event con lista completa de fragmentos enviados al AI.

**Cambio:** `src/pages/api/conversations/[id]/messages-stream.ts` líneas 191-206

---

### 3. ✅ Referencias Incluyen Metadata de RAG
**Antes:** Referencias no distinguían entre RAG chunk y full document.

**Ahora:** Referencias incluyen `metadata.isRAGChunk: true` para chunks RAG.

**Cambio:** `src/pages/api/conversations/[id]/messages-stream.ts` líneas 267-290

---

### 4. ✅ Frontend Valida Citas del AI
**Antes:** No verificábamos si el AI citó correctamente.

**Ahora:** Frontend valida que todas las citas esperadas aparezcan en el texto.

**Cambio:** `src/components/ChatInterfaceWorking.tsx` líneas 1095-1125

---

### 5. ✅ Context Log Usa Modo Real
**Antes:** Mode se determinaba por chunkIndex === -1 (inexacto).

**Ahora:** Mode se determina por `ragConfiguration.actuallyUsed` (preciso).

**Cambio:** `src/components/ChatInterfaceWorking.tsx` líneas 1166-1217

---

### 6. ✅ UI Distingue Chunks RAG de Full-Text
**Antes:** Todo mostraba "Chunk #0" sin distinción.

**Ahora:** 
- RAG chunks: "Fragmento N" con badge verde "🔍 RAG"
- Full-text: "Documento Completo" con badge azul "📝 Full"

**Cambios:**
- `src/components/MessageRenderer.tsx` líneas 346-371
- `src/components/ReferencePanel.tsx` líneas 93-119, 178-193

---

## 📊 Archivos Modificados

### Backend (3 archivos)
1. **`src/lib/gemini.ts`**
   - Detecta modo RAG vs Full-Text en contexto
   - System prompt específico para RAG con lista de fragmentos
   - System prompt diferenciado para Full-Text

2. **`src/pages/api/conversations/[id]/messages-stream.ts`**
   - Envía `fragmentMapping` event al frontend
   - Marca referencias con `isRAGChunk: true`
   - Mejora logging de referencias

3. **`src/lib/rag-search.ts`**
   - Sin cambios (ya funciona correctamente)

### Frontend (3 archivos)
4. **`src/components/ChatInterfaceWorking.tsx`**
   - Nuevo `fragmentMappingRef` para almacenar mapping esperado
   - Captura `fragmentMapping` event
   - Valida citas del AI
   - Context log usa `ragConfiguration.actuallyUsed`
   - Limpia fragmentMapping al enviar nuevo mensaje

5. **`src/components/MessageRenderer.tsx`**
   - Mejora display de chunk number: "Fragmento N" vs "Doc. Completo"
   - Muestra badge "🔍 RAG" para chunks RAG
   - Muestra badge "📝 Full" para documentos completos

6. **`src/components/ReferencePanel.tsx`**
   - Verde para RAG chunks, azul para full-text
   - Muestra "Fragmento N" en lugar de "Chunk #N+1"
   - Nota explicativa diferenciada por modo

### Types (1 archivo)
7. **`src/lib/gemini.ts` (SourceReference interface)**
   - Agregado `metadata.isRAGChunk?: boolean`
   - Agregado `metadata.isFullDocument?: boolean`

---

## 🔄 Flujo Completo (DESPUÉS de cambios)

### 1. Usuario Envía Pregunta

```
Usuario: "¿Qué dice sobre la Ley 19.537?"
  ↓
sendMessage() en ChatInterfaceWorking
  ↓
POST /api/conversations/${id}/messages-stream
  ragEnabled: true
  ragTopK: 5
  ragMinSimilarity: 0.5
```

---

### 2. Backend Realiza RAG Search

```
API Endpoint
  ↓
searchRelevantChunks(userId, query, options)
  ↓
Firestore: document_chunks collection
  WHERE userId == userId
  WHERE sourceId IN activeSourceIds
  ↓
Generate embedding for query
  ↓
Calculate cosine similarity vs all chunks
  ↓
Select top 5 chunks above 0.5 similarity
  ↓
Return: [
  { chunkIndex: 3, similarity: 0.892, text: "..." },
  { chunkIndex: 1, similarity: 0.765, text: "..." },
  { chunkIndex: 4, similarity: 0.683, text: "..." }
]
```

---

### 3. Backend Construye Contexto RAG

```
buildRAGContext(ragResults)
  ↓
Output:
"
=== Cir32.pdf (RAG: 3 fragmentos relevantes) ===

[Fragmento 3, Relevancia: 89.2%]
La Ley N°19.537, publicada el 16 de diciembre de 1997...

[Fragmento 1, Relevancia: 76.5%]
Esta ley se aplica a las comunidades de copropietarios...

[Fragmento 4, Relevancia: 68.3%]
Las construcciones en subterráneo deben cumplir...
"
```

---

### 4. Backend Envía Fragment Mapping al Frontend

```
SSE Event: fragmentMapping
{
  type: 'fragmentMapping',
  mapping: [
    { refId: 1, chunkIndex: 3, sourceName: 'Cir32.pdf', similarity: 0.892, tokens: 512 },
    { refId: 2, chunkIndex: 1, sourceName: 'Cir32.pdf', similarity: 0.765, tokens: 487 },
    { refId: 3, chunkIndex: 4, sourceName: 'Cir32.pdf', similarity: 0.683, tokens: 523 }
  ]
}
  ↓
Frontend: fragmentMappingRef.current = mapping
  ↓
Console: 
"🗺️ Fragment mapping received: 3 chunks
 📋 Expected citations in response: [1], [2], [3]
   [1] → Fragmento 3 (Cir32.pdf) - 89.2%
   [2] → Fragmento 1 (Cir32.pdf) - 76.5%
   [3] → Fragmento 4 (Cir32.pdf) - 68.3%"
```

---

### 5. Backend Construye System Prompt RAG-Specific

```
System Instruction:
"
Eres un asistente de IA útil, preciso y amigable...

🔍 MODO RAG ACTIVADO - INSTRUCCIONES CRÍTICAS:

Te he proporcionado 3 fragmentos específicos y relevantes del documento, 
numerados como: 3, 1, 4.

DEBES OBLIGATORIAMENTE:
1. ✅ Citar cada fragmento que uses con su número exacto entre corchetes [N]
2. ✅ Colocar la cita INMEDIATAMENTE después del dato específico...
...

Fragmentos disponibles para citar: 3, 1, 4
RECUERDA: Cada dato del documento DEBE llevar su número de fragmento entre corchetes.
"
```

---

### 6. AI Genera Respuesta con Citas

```
AI Response (streaming):
"La Ley N°19.537, publicada el 16 de diciembre de 1997[1], derogó 
expresamente la Ley N°6.071 sobre Propiedad Horizontal[2]. Esta nueva 
ley se aplica a las comunidades de copropietarios que estaban acogidas 
a la Ley N°6.071 antes de su entrada en vigor[3]."
```

---

### 7. Frontend Valida Citas

```
Citation Validation:
  Expected: [1], [2], [3]
  Found in text: [1], [2], [3]
  Coverage: 3/3 (100%)
  ✅ All fragments were cited correctly by the AI!
```

---

### 8. Frontend Procesa Referencias

```
MessageRenderer:
  Busca [1], [2], [3] en el texto
  ↓
  Reemplaza con badges HTML:
  <span class="reference-badge ...>[1]</span>
  ↓
  Agrega event listener para clicks
  ↓
  Muestra referencias debajo del mensaje:
  
  📚 Referencias utilizadas (3)
  
  [1] Cir32.pdf - 89.2% similar
      Fragmento 3 • 512 tokens
      🔍 RAG
  
  [2] Cir32.pdf - 76.5% similar
      Fragmento 1 • 487 tokens
      🔍 RAG
  
  [3] Cir32.pdf - 68.3% similar
      Fragmento 4 • 523 tokens
      🔍 RAG
```

---

### 9. Usuario Clickea Referencia

```
User clicks [1]
  ↓
MessageRenderer event handler
  ↓
onReferenceClick(reference)
  ↓
ChatInterfaceWorking: setSelectedReference(ref)
  ↓
ReferencePanel opens
  ↓
Shows:
  - Fragmento 3
  - 89.2% de similitud (barra verde)
  - 512 tokens
  - 🔍 RAG Chunk badge
  - Texto completo del chunk
  - Páginas del documento
```

---

## 🎓 Key Technical Decisions

### Decision 1: Explicit Fragment Numbers in System Prompt
**Why:** AI needs to know which fragments it has access to.

**Alternative Considered:** Let AI cite naturally.

**Chosen Because:** Explicit numbers ensure consistency and traceability.

---

### Decision 2: Fragment Mapping Event
**Why:** Frontend needs to validate AI followed instructions.

**Alternative Considered:** Trust AI blindly.

**Chosen Because:** Validation enables debugging and quality assurance.

---

### Decision 3: Differentiate isRAGChunk vs isFullDocument
**Why:** User needs to know if RAG was actually used.

**Alternative Considered:** Show same UI for both.

**Chosen Because:** Transparency builds trust and helps with debugging.

---

## 🔍 Code Snippets

### New System Prompt (RAG Mode)
```typescript
enhancedSystemInstruction = `${systemInstruction}

🔍 MODO RAG ACTIVADO - INSTRUCCIONES CRÍTICAS:

Te he proporcionado ${fragmentNumbers.length} fragmentos específicos y relevantes del documento, numerados como: ${fragmentNumbers.join(', ')}.

DEBES OBLIGATORIAMENTE:
1. ✅ Citar cada fragmento que uses con su número exacto entre corchetes [N]
2. ✅ Colocar la cita INMEDIATAMENTE después del dato específico que proviene de ese fragmento
...
`;
```

### Fragment Mapping Event
```typescript
const fragmentMapping = ragResults.map((result, index) => ({
  refId: index + 1,
  chunkIndex: result.chunkIndex,
  sourceName: result.sourceName,
  similarity: result.similarity,
  tokens: result.metadata.tokenCount
}));

const mappingData = `data: ${JSON.stringify({ 
  type: 'fragmentMapping',
  mapping: fragmentMapping
})}\n\n`;
controller.enqueue(encoder.encode(mappingData));
```

### Citation Validation
```typescript
if (fragmentMappingRef.current && fragmentMappingRef.current.length > 0) {
  const expectedCitations = fragmentMappingRef.current.map(m => `[${m.refId}]`);
  const foundCitations: string[] = [];
  
  for (const citation of expectedCitations) {
    if (accumulatedContent.includes(citation)) {
      foundCitations.push(citation);
    }
  }
  
  console.log('📋 Citation validation:');
  console.log(`  Expected: ${expectedCitations.join(', ')}`);
  console.log(`  Found: ${foundCitations.join(', ')}`);
  console.log(`  Coverage: ${foundCitations.length}/${expectedCitations.length}`);
}
```

---

## ✅ Backward Compatibility

### No Breaking Changes
- ✅ Full-text mode still works
- ✅ Existing messages load correctly
- ✅ Documents without chunks work (fallback to full-text)
- ✅ Old references still display

### Additive Changes Only
- ✅ New fields are optional (`isRAGChunk?`, `isFullDocument?`)
- ✅ Fragment mapping is only sent when RAG is used
- ✅ Validation only runs when mapping exists

### Graceful Degradation
- ✅ If AI doesn't cite: references still shown below
- ✅ If RAG fails: falls back to full-text
- ✅ If chunks missing: uses documents
- ✅ If validation fails: user still sees response

---

## 📈 Expected Improvements

### User Experience
- **Before:** Confusing "100% similar" for everything
- **After:** Real similarity scores (60-95% range)

- **Before:** "Chunk #0" didn't make sense
- **After:** "Fragmento 3" matches actual chunk

- **Before:** No way to know if RAG was used
- **After:** Clear badges: 🔍 RAG vs 📝 Full

### Transparency
- **Before:** Not clear what context was sent
- **After:** Exact chunks listed with similarity %

### Debugging
- **Before:** Hard to know if RAG worked
- **After:** Validation logs show citation coverage

### Token Efficiency
- **Before:** Sometimes used full docs unnecessarily
- **After:** Clear feedback when RAG is working

---

## 🚦 Testing Status

- [x] Code changes implemented
- [x] TypeScript errors fixed
- [x] Linting errors resolved
- [ ] Manual testing (see TESTING_PLAN_REFERENCIAS_RAG_2025-10-20.md)
- [ ] User acceptance testing
- [ ] Production deployment

---

## 📚 Related Documentation

- **Solution Design:** `SOLUCION_REFERENCIAS_RAG_2025-10-20.md`
- **Testing Plan:** `TESTING_PLAN_REFERENCIAS_RAG_2025-10-20.md`
- **RAG Flow:** `RAG_FLUJO_COMPLETO_2025-10-20.md`
- **Previous Work:** `SOLUCION_COMPLETA_REFERENCIAS_2025-10-20.md`

---

## 🎯 Next Actions

1. **Test Locally** (30-45 min)
   - Follow TESTING_PLAN_REFERENCIAS_RAG_2025-10-20.md
   - Document results

2. **Iterate if Needed**
   - Fix any issues found
   - Re-test

3. **Deploy** (after tests pass)
   - Commit changes
   - Deploy to production
   - Monitor real usage

---

**Implemented:** 2025-10-20  
**Files Changed:** 6  
**Lines Changed:** ~150  
**Breaking Changes:** None  
**Backward Compatible:** Yes ✅

