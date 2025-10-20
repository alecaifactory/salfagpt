# 🧪 Plan de Testing: Referencias RAG con % Similitud - 2025-10-20

## 🎯 Objetivo

Verificar que el sistema de referencias RAG funciona correctamente, mostrando:
1. ✅ Chunks específicos usados (no documento completo)
2. ✅ % de similitud real de cada chunk
3. ✅ Referencias inline clickeables [1], [2], [3]
4. ✅ Todas las referencias aparecen debajo de la respuesta
5. ✅ Log de contexto muestra modo RAG correcto

---

## 📋 Pre-Testing Checklist

### Verify Codebase Changes Applied
```bash
# 1. Check gemini.ts has RAG-specific system prompt
grep -A10 "MODO RAG ACTIVADO" src/lib/gemini.ts
# Should show: "Te he proporcionado X fragmentos..."

# 2. Check messages-stream.ts sends fragmentMapping
grep "fragmentMapping" src/pages/api/conversations/\[id\]/messages-stream.ts
# Should show: type: 'fragmentMapping'

# 3. Check ChatInterfaceWorking has fragmentMappingRef
grep "fragmentMappingRef" src/components/ChatInterfaceWorking.tsx
# Should show: useRef definition and usage

# 4. Check SourceReference includes isRAGChunk
grep "isRAGChunk" src/lib/gemini.ts
# Should show in metadata interface
```

### Start Development Server
```bash
# Terminal 1: Start server
cd /Users/alec/salfagpt
npm run dev

# Terminal 2: Monitor logs
# Keep this open to watch console output
```

---

## 🧪 Test Suite

### Test 1: Verificar RAG Selecciona Chunks Específicos

**Setup:**
- Agente: Context 32
- Fuente: Cir32.pdf (debe tener 5 chunks indexados)
- Modo: RAG habilitado (toggle verde)

**Steps:**
1. Abrir http://localhost:3000/chat
2. Seleccionar agente "Context 32"
3. Verificar en "Desglose del Contexto":
   - ✅ Estado: "✅ Indexado con RAG - 5 chunks"
   - ✅ Toggle está en posición verde (RAG)
4. Enviar pregunta: **"¿Qué dice sobre la Ley 19.537?"**

**Expected Backend Logs:**
```
🔍 [Streaming] Attempting RAG search...
  Configuration: topK=5, minSimilarity=0.5
✅ RAG: Using 3 relevant chunks (1,234 tokens)
  Avg similarity: 78.5%
  1. Cir32.pdf (chunk 3) - 89.2% similar
  2. Cir32.pdf (chunk 1) - 76.5% similar
  3. Cir32.pdf (chunk 4) - 68.3% similar
🗺️ Sending fragment mapping to client: 3 chunks
```

**Expected Frontend Logs:**
```
🗺️ Fragment mapping received: (3) [{…}, {…}, {…}]
📋 Expected citations in response: [1], [2], [3]
  [1] → Fragmento 3 (Cir32.pdf) - 89.2%
  [2] → Fragmento 1 (Cir32.pdf) - 76.5%
  [3] → Fragmento 4 (Cir32.pdf) - 68.3%
```

**Expected Result:**
- ✅ Backend usa 3 chunks específicos (NO todo el documento)
- ✅ % de similitud es real (NO 100%)
- ✅ Frontend recibe mapping de fragmentos esperados

---

### Test 2: Verificar AI Incluye Citas Inline

**Continuing from Test 1...**

**Wait for AI response to complete**

**Expected Frontend Logs:**
```
📋 Citation validation:
  Expected: [1], [2], [3]
  Found in text: [1], [2], [3]
  Coverage: 3/3 (100%)
✅ All fragments were cited correctly by the AI!
```

**Expected in Response Text:**
```
La Ley N°19.537, publicada el 16 de diciembre de 1997[1], derogó expresamente 
la Ley N°6.071 sobre Propiedad Horizontal[2]. Esta nueva ley se aplica a las 
comunidades de copropietarios que estaban acogidas a la Ley N°6.071 antes de 
su entrada en vigor[3].
```

**Verify:**
- ✅ [1], [2], [3] aparecen como **badges azules** (no texto negro)
- ✅ Cada badge es **clickeable** (cursor pointer on hover)
- ✅ Hover shows tooltip: "Click para ver fuente"

---

### Test 3: Verificar Referencias Son Clickeables

**Steps:**
1. Click en badge [1] en el texto
2. Debe abrir ReferencePanel a la derecha

**Expected Panel Content:**
```
Referencia [1]
Cir32.pdf

┌─────────────────────────────┐
│ Similitud                   │
│ [████████░░] 89.2%          │
└─────────────────────────────┘

Fragmento 3 • 512 tokens
🔍 RAG Chunk

Texto del chunk utilizado:
┌─────────────────────────────┐
│ La Ley N°19.537, publicada  │
│ el 16 de diciembre de 1997, │
│ derogó expresamente la Ley  │
│ N°6.071...                  │
└─────────────────────────────┘

💡 Nota: Este fragmento específico fue 
identificado como relevante (89.2% de 
similitud) por la búsqueda vectorial RAG...
```

**Verify:**
- ✅ Panel opens on right side
- ✅ Shows "Fragmento 3" (not "Chunk #0" or "Documento Completo")
- ✅ Shows "89.2%" similarity (not "100%")
- ✅ Shows "🔍 RAG Chunk" badge (green)
- ✅ Shows exact text from chunk
- ✅ Press ESC closes panel

**Repeat for [2] and [3]:**
- Each should show different chunk number
- Each should show different similarity %
- Each should show different text

---

### Test 4: Verificar Todas las Referencias Debajo del Mensaje

**Steps:**
1. Scroll down to see section "📚 Referencias utilizadas"
2. Count references shown

**Expected:**
```
📚 Referencias utilizadas (3)

[1] Cir32.pdf                    89.2% similar
    Fragmento 3 • 512 tokens
    🔍 RAG
    La Ley N°19.537, publicada el 16...
    
[2] Cir32.pdf                    76.5% similar
    Fragmento 1 • 487 tokens
    🔍 RAG
    Esta ley se aplica a las comunidades...
    
[3] Cir32.pdf                    68.3% similar
    Fragmento 4 • 523 tokens
    🔍 RAG
    Las construcciones en subterráneo deben...
```

**Verify:**
- ✅ Muestra **3 referencias** (todas las que hay en el texto)
- ✅ Cada una muestra **% de similitud real** (diferente)
- ✅ Cada una muestra **Fragmento N** (número de chunk real)
- ✅ Cada una muestra badge **🔍 RAG** (verde)
- ✅ Cada una es **clickeable** (hover changes background)

---

### Test 5: Verificar Log de Contexto Muestra Modo Correcto

**Steps:**
1. Abrir "Desglose del Contexto" (button arriba del input)
2. Scroll down to "📊 Log de Contexto por Interacción"
3. Find row for your question
4. Check "Modo" column

**Expected Row:**
```
Hora    Pregunta           Modelo  Modo      Input  Output  Total  Disponible  Uso%
13:14   ¿Qué dice sobre... Flash   🔍 RAG    40     477     517    999,483     0.05%
                                    3 chunks
```

**Verify:**
- ✅ Modo column shows **"🔍 RAG"** (green badge)
- ✅ Below badge shows **"3 chunks"**
- ✅ NO muestra "📝 Full" o "⚠️ Full"
- ✅ Tooltip on hover shows:
  ```
  RAG Optimizado: 3 chunks relevantes con 78.0% de similaridad promedio
  ```

---

### Test 6: Expandir Detalles de Interacción

**Steps:**
1. In Context Log table, click "Ver detalles completos de cada interacción"
2. Expand the details section

**Expected:**
```
#1 - 13:14:20
Pregunta: ¿Qué dice sobre la Ley 19.537?
Modelo: gemini-2.5-flash
System Prompt: Eres un asistente de IA útil...

Fuentes activas:
• 🔍 Cir32.pdf (1,234 tokens)

Referencias utilizadas:
[1] Cir32.pdf - Fragmento 3 - 89.2%
[2] Cir32.pdf - Fragmento 1 - 76.5%
[3] Cir32.pdf - Fragmento 4 - 68.3%
```

**Verify:**
- ✅ Fuente muestra **🔍** emoji (RAG mode)
- ✅ Tokens shown are RAG tokens (1,234), NOT full document tokens (2,023)
- ✅ Referencias section lists all 3 with real chunk numbers and similarity

---

## 🚨 Failure Scenarios

### Scenario 1: AI No Incluye Citas Inline

**If this happens:**
```
📋 Citation validation:
  Expected: [1], [2], [3]
  Found in text: 
  Coverage: 0/3 (0%)
⚠️ WARNING: AI did not include any inline citations
```

**Diagnosis:**
- El AI no siguió las instrucciones del system prompt
- Posible causa: System prompt no se construyó correctamente

**Fix:**
1. Check console for: "🔍 MODO RAG ACTIVADO" in system instruction
2. Verify fragmentNumbers were extracted correctly
3. May need to make instructions even more explicit

**Fallback:**
- Referencias aún se mostrarán debajo del mensaje
- Usuario puede clickear las referencias
- Sistema funciona, pero UX no es óptima

---

### Scenario 2: RAG Falls Back to Full-Text

**If this happens:**
```
⚠️ RAG: No chunks found above similarity threshold, falling back to full documents
```

**Expected References:**
```
[1] Cir32.pdf - 100.0% similar
    Documento Completo • 2,023 tokens
    📝 Full-Text Mode
```

**This is OK IF:**
- No chunks were above minSimilarity threshold (0.5)
- Question is too generic or doesn't match document content
- Document has no relevant sections for this query

**Not OK IF:**
- Question clearly relates to document
- Chunks should match but don't

**Fix if Not OK:**
1. Lower minSimilarity threshold
2. Check embedding quality
3. Re-index document with better chunking

---

### Scenario 3: No Chunks Exist (Documents Not Indexed)

**If this happens:**
```
⚠️ No chunks exist - documents need indexing
```

**Expected:**
- System falls back to full documents
- UI shows warning: "⚠️ RAG no indexado - usará Full-Text"

**Fix:**
1. Go to source settings (gear icon)
2. Click "Indexar con RAG"
3. Wait for indexing to complete
4. Retry question

---

## ✅ Success Criteria

All tests pass if:

### Backend (Console Logs)
- [ ] RAG search runs and finds chunks
- [ ] Real similarity scores logged (not all 100%)
- [ ] Fragment mapping sent to client
- [ ] References built with isRAGChunk: true

### Frontend (UI)
- [ ] AI response includes inline citations [1], [2], [3]
- [ ] Citations are blue badges (clickeable)
- [ ] All references appear below message
- [ ] Each reference shows real chunk number
- [ ] Each reference shows real % similarity
- [ ] ReferencePanel shows correct chunk on click

### Context Log
- [ ] "Modo" column shows "🔍 RAG" with chunk count
- [ ] Token count reflects RAG chunks (not full document)
- [ ] RAG configuration shows actuallyUsed: true

---

## 🐛 Common Issues & Fixes

### Issue: "100% similar" Still Appears

**Cause:** References are being built from full documents (fallback mode)

**Diagnosis:**
```bash
# Check backend logs for:
"⚠️ RAG: No chunks found"
# or
"⚠️ Falling back to full documents"
```

**Fix:**
- Verify chunks exist in Firestore: `document_chunks` collection
- Check ragEnabled is true for source
- Verify activeSourceIds includes this source
- Lower minSimilarity if needed

---

### Issue: No Inline Citations [1], [2]

**Cause:** AI didn't follow system prompt instructions

**Diagnosis:**
```bash
# Check frontend logs for:
"⚠️ WARNING: AI did not include any inline citations"
```

**Fix:**
- Verify system prompt includes RAG instructions
- Check fragmentNumbers were extracted
- AI may need stronger prompt or examples
- Consider adding few-shot examples to prompt

---

### Issue: Only First Reference Shows

**Cause:** This should NOT happen with current code

**Diagnosis:**
- Check MessageRenderer is receiving all references
- Verify references.length in console

**Fix:**
- If happens, check MessageRenderer.tsx line 318
- Should be: `{references.map(ref => ...)}`
- NOT: `{references[0] && ...}`

---

## 📊 Metrics to Track

### RAG Performance
- **Citation Coverage**: % of expected citations found in AI response
  - Target: >90%
- **Similarity Accuracy**: Are similarity scores realistic?
  - Target: Range from 60-95%, not all 100%
- **Chunk Selection**: Are chunks actually used?
  - Target: chunkIndex >=0, not -1 (full doc)

### User Experience
- **Reference Clickability**: All [N] are clickeable?
  - Target: 100%
- **Reference Panel Accuracy**: Shows correct chunk?
  - Target: 100%
- **Mode Display**: Log shows RAG when RAG is used?
  - Target: 100%

---

## 🎯 Expected vs Actual Comparison

### ANTES (Problemas):
```
Respuesta: "La Ley derogó la anterior..."
Referencias: [1] 100.0% - Chunk #0 - 📝 Full-Text (Completo)
Log: 📝 Full
```

### DESPUÉS (Correcto):
```
Respuesta: "La Ley derogó[1] la anterior[2]..."
            ↑ clickeable   ↑ clickeable

Referencias: 
[1] 89.2% - Fragmento 3 - 🔍 RAG
[2] 76.5% - Fragmento 1 - 🔍 RAG  
[3] 68.3% - Fragmento 4 - 🔍 RAG

Log: 🔍 RAG
     3 chunks
```

---

## 🔧 Debugging Commands

### Check Chunks Exist
```typescript
// En browser console:
fetch('/api/context-sources/SOURCE_ID/chunks')
  .then(r => r.json())
  .then(data => console.log('Chunks:', data.chunkCount))
```

### Check RAG Search
```bash
# Backend should log:
grep "RAG:" logs/server.log | tail -20
```

### Check References Received
```typescript
// En browser console después de recibir respuesta:
console.log('Last message:', messages[messages.length - 1]);
// Should show: references: [{id:1, similarity:0.892, ...}, ...]
```

---

## 📝 Test Results Template

```markdown
## Test Results - [Date/Time]

**Tester:** [Name]
**Environment:** localhost:3000

### Test 1: RAG Chunk Selection
- [ ] PASS / FAIL
- Backend logs: [paste logs]
- Chunks found: X
- Avg similarity: Y%

### Test 2: AI Inline Citations
- [ ] PASS / FAIL
- Expected: [1], [2], [3]
- Found: [paste actual]
- Coverage: X/Y

### Test 3: Reference Clickability
- [ ] PASS / FAIL
- Clickeable badges: Y/N
- Panel opens: Y/N
- Correct chunk shown: Y/N

### Test 4: All References Shown
- [ ] PASS / FAIL
- Expected count: X
- Actual count: Y
- All show correct %: Y/N

### Test 5: Context Log Mode
- [ ] PASS / FAIL
- Shows RAG: Y/N
- Shows chunk count: Y/N
- Tokens are RAG tokens: Y/N

### Overall
- [ ] ALL TESTS PASS
- [ ] SOME TESTS FAIL (list failures)
- [ ] CRITICAL ISSUES (block deployment)

Notes:
[Any observations, issues, or suggestions]
```

---

## 🚀 Next Steps After Testing

### If All Tests Pass ✅
1. Document success in `docs/features/rag-references-working-2025-10-20.md`
2. Update `RAG_FLUJO_COMPLETO_2025-10-20.md` with status
3. Consider deploying to staging/production
4. Monitor real usage for edge cases

### If Tests Fail ❌
1. Document failures in `TESTING_RESULTS_2025-10-20.md`
2. Prioritize failures by severity:
   - Critical: No citations at all
   - High: Wrong similarity scores
   - Medium: Some citations missing
   - Low: UI polish issues
3. Fix critical/high severity first
4. Re-test after fixes
5. Iterate until all pass

---

**Created:** 2025-10-20  
**Status:** Ready for Testing  
**Estimated Testing Time:** 30-45 minutes

