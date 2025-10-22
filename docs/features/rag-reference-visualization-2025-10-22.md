# RAG Reference Visualization Enhancement - 2025-10-22

## 🎯 Feature Overview

Enhanced RAG (Retrieval-Augmented Generation) reference display to build user trust by showing:
1. **Similarity scores** for each chunk (semantic relevance)
2. **Clickable reference badges** inline in text `[1]` `[2]` with color-coded similarity
3. **Detailed reference panel** that opens on click showing full chunk context
4. **Trust indicators** explaining how and why each chunk was selected

---

## ✨ Key Enhancements

### 1. Inline Reference Badges (in text)

**Before:** `[1]` - plain blue badge
**After:** `[1] 87%` - color-coded badge with similarity score

**Color Coding:**
- 🟢 **Green** (≥80%): High relevance - highly similar to query
- 🟡 **Yellow** (60-79%): Medium relevance - partial match
- 🟠 **Orange** (<60%): Low relevance - weak match

**Example in text:**
```
Las construcciones en subterráneo deben cumplir con distanciamientos[1 87%]. 
La DDU 189 establece zonas inexcavables[2 92%].
```

**Behavior:**
- **Hover**: Badge scales slightly, shadow increases
- **Click**: Opens ReferencePanel with full chunk details

---

### 2. References Footer Section

At the end of each AI message that uses RAG, a comprehensive references section displays:

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│ 📚 Referencias utilizadas [3]                            │
│                                                          │
│ ┌──────────────────────────────────────────────────┐   │
│ │ [1]  Manual de Construcción                      │   │
│ │      ━━━━━━━━━━━━━ 87% │ 87%                     │   │
│ │      Fragmento 5 • 245 tokens • 🔍 RAG           │   │
│ │      "Las construcciones en subterráneo..."      │   │
│ └──────────────────────────────────────────────────┘   │
│                                                          │
│ ┌──────────────────────────────────────────────────┐   │
│ │ [2]  Normas DDU 189                               │   │
│ │      ━━━━━━━━━━━━━━━━━ 92% │ 92%                 │   │
│ │      Fragmento 12 • 189 tokens • 🔍 RAG          │   │
│ │      "Las zonas inexcavables están clarificadas" │   │
│ └──────────────────────────────────────────────────┘   │
│                                                          │
│ 💡 Los números entre corchetes [1] [2] son clickables   │
└─────────────────────────────────────────────────────────┘
```

**Features:**
- Progress bar showing similarity visually
- Large, bold percentage number
- Chunk index and token count
- RAG/Full-Text mode badge
- Clickable to open detail panel

---

### 3. Reference Detail Panel (Right Pane)

Opens when user clicks on any `[N]` reference badge (inline or in footer).

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│ 📄 Referencia [1]                               [X]    │
│ Manual de Construcción.pdf                              │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ ┌────────────────────────────────────────────────────┐ │
│ │         SIMILITUD SEMÁNTICA                         │ │
│ │                                                      │ │
│ │                 87.3%                                │ │
│ │         ━━━━━━━━━━━━━━━━━━━                        │ │
│ │                                                      │ │
│ │        ✅ Alta relevancia                           │ │
│ │ Este fragmento fue seleccionado por búsqueda        │ │
│ │ vectorial RAG                                        │ │
│ └────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌────────────────────────────────────────────────────┐ │
│ │ 📊 Información del fragmento  │ 🔍 Modo RAG        │ │
│ │ • Posición: Fragmento 5       │ Fragmento          │ │
│ │ • Tokens: 245                 │ seleccionado por   │ │
│ │ • Páginas: 12-13              │ búsqueda semántica │ │
│ │ • Caracteres: 2450-3891       │ Relevancia: Alta   │ │
│ └────────────────────────────────────────────────────┘ │
│                                                          │
│ 📄 Texto del fragmento utilizado                        │
│ ┌────────────────────────────────────────────────────┐ │
│ │ ⬆️ Contexto anterior                                │ │
│ │ ...establece que las obras deben cumplir...        │ │
│ │                                                      │ │
│ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━    │ │
│ │ 📍 Texto exacto utilizado por el AI                │ │
│ │                                                      │ │
│ │ "Las construcciones en subterráneo deben cumplir   │ │
│ │ con las disposiciones sobre distanciamientos       │ │
│ │ mínimos establecidos en el artículo 5.1.12 de la   │ │
│ │ OGUC o zonas inexcavables que hayan sido           │ │
│ │ establecidas según normativa vigente."             │ │
│ │                                                      │ │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━    │ │
│ │                                                      │ │
│ │ ⬇️ Contexto posterior                               │ │
│ │ Estas disposiciones aplican a todas las...         │ │
│ └────────────────────────────────────────────────────┘ │
│                                                          │
│ 🔒 Verificación de Confianza                            │
│ Este fragmento fue seleccionado automáticamente por     │
│ el sistema RAG. La alta similitud semántica (87.3%)     │
│ indica que es altamente relevante para tu pregunta.     │
│                                                          │
│ [Ver documento completo]                                 │
└─────────────────────────────────────────────────────────┘
```

---

## 🎨 Visual Design

### Similarity Score Display

**Large & Prominent:**
- 5xl font size (48px)
- Bold weight (font-black)
- Color-coded:
  - Green ≥80%: High confidence
  - Yellow 60-79%: Medium confidence
  - Orange <60%: Low confidence
- Progress bar below percentage
- Trust level text: "✅ Alta relevancia", "⚠️ Relevancia moderada", etc.

### Inline Badges

**Enhanced visibility:**
- Larger padding: `px-2 py-1` (vs previous `px-1.5 py-0.5`)
- Border: `border-2` (vs previous `border`)
- Shadow: `shadow-sm` with `hover:shadow-md`
- Color-coded by similarity (same as large display)
- Shows similarity inline: `[1] 87%`

### Chunk Text Display

**Yellow highlight box:**
- Gradient background: `from-yellow-100 to-amber-100`
- Thick left border: `border-l-4 border-yellow-600`
- Shadow: `shadow-md`
- Pulsing indicator dot
- Label: "📍 Texto exacto utilizado por el AI"

### Context Display

**Before/After sections:**
- Separated with borders
- Italic text in gray
- Clear labels: "⬆️ Contexto anterior", "⬇️ Contexto posterior"
- Helps user understand chunk placement in document

---

## 🔒 Trust Building Features

### 1. Transparency

Users see EXACTLY:
- Which chunk was used
- How relevant it is (similarity %)
- What text the AI saw
- Context before and after chunk
- Whether it's RAG or full-text mode

### 2. Color-Coded Confidence

**Visual hierarchy:**
- 🟢 Green (≥80%): "Trust this - highly relevant"
- 🟡 Yellow (60-79%): "Moderate confidence - verify"
- 🟠 Orange (<60%): "Low confidence - double-check"

### 3. Detailed Explanations

**Trust indicator boxes explain:**
- How the chunk was selected (RAG vs manual)
- What the similarity score means
- Whether to trust the information
- When to verify manually

**Examples:**

**High similarity (≥80%):**
> La **alta similitud semántica de 87.3%** indica que este fragmento es **altamente relevante** para tu pregunta y el AI basó su respuesta en esta información específica.

**Medium similarity (60-79%):**
> La **similitud moderada de 68.5%** sugiere **relevancia parcial** - el fragmento contiene información relacionada pero puede no responder completamente tu pregunta. Verifica cuidadosamente.

**Low similarity (<60%):**
> La **similitud baja de 45.2%** indica que este fragmento puede **no ser completamente relevante** - el sistema lo seleccionó entre las opciones disponibles pero verifica la información con cuidado.

---

## 🔄 Data Flow

### Step 1: User sends question
```
User: "¿Cuáles son los distanciamientos en construcciones subterráneas?"
```

### Step 2: RAG search finds chunks
```
🔍 RAG Search:
  1. Query embedding generated
  2. 3 chunks found:
     - Chunk 5: 87.3% similar (Manual de Construcción)
     - Chunk 12: 92.1% similar (DDU 189)
     - Chunk 8: 71.5% similar (OGUC)
```

### Step 3: AI response with references
```
Las construcciones en subterráneo deben cumplir con distanciamientos[1 87%]. 
La DDU 189 establece zonas inexcavables[2 92%]. Según la OGUC[3 72%]...
```

### Step 4: References saved with message
```typescript
message: {
  content: "Las construcciones...",
  references: [
    {
      id: 1,
      sourceId: "source-abc",
      sourceName: "Manual de Construcción.pdf",
      chunkIndex: 5,
      similarity: 0.873,
      fullText: "Las construcciones en subterráneo...",
      metadata: {
        startChar: 2450,
        endChar: 3891,
        tokenCount: 245,
        startPage: 12,
        endPage: 13,
        isRAGChunk: true
      }
    },
    // ... more references
  ]
}
```

### Step 5: User clicks `[1 87%]`
```
→ ReferencePanel opens
→ Shows full chunk text
→ Shows similarity: 87.3%
→ Shows context before/after
→ Shows trust indicators
→ Shows metadata (pages, tokens, position)
```

---

## 🧪 Testing

### Manual Testing Checklist

**Test with RAG-enabled agent:**

1. **Upload a PDF with multiple pages**
   - Ensure it gets indexed (creates chunks in `document_chunks`)
   - Verify chunks are created: Check Firestore `document_chunks` collection

2. **Enable RAG mode**
   - Agent config: RAG mode = ON
   - TopK = 5, MinSimilarity = 0.5

3. **Ask a specific question**
   - Example: "¿Cuáles son los requisitos de distanciamiento?"
   - Should trigger RAG search

4. **Verify inline references appear**
   - Look for `[1]`, `[2]` badges in response
   - Should show similarity: `[1 87%]`, `[2 92%]`
   - Badges should be color-coded (green/yellow/orange)

5. **Click inline reference badge**
   - ReferencePanel should open on right side
   - Should show large similarity percentage
   - Should show full chunk text with yellow highlight
   - Should show context before/after (if available)
   - Should show trust indicator with explanation

6. **Verify references footer**
   - Should appear at bottom of message
   - Should list all references with similarity
   - Each should be clickable
   - Should match inline references

7. **Test with different similarity levels**
   - High (≥80%): Green color, "Alta relevancia"
   - Medium (60-79%): Yellow color, "Relevancia moderada"
   - Low (<60%): Orange color, "Baja relevancia"

8. **Test full-text fallback**
   - Ask question with no relevant chunks
   - Should fall back to full document
   - References should show "100%" (full doc) or "Doc. Completo"
   - Should show blue badge indicating Full-Text mode

---

## 📊 Component Changes

### Modified Files:

1. **`src/lib/gemini.ts`**
   - Updated RAG system instruction to request references section at end
   - Added template for expected reference format

2. **`src/components/MessageRenderer.tsx`**
   - Enhanced inline reference badges with similarity % and color coding
   - Redesigned references footer with prominent similarity display
   - Added visual progress bars for similarity
   - Enhanced hover states and click affordances

3. **`src/components/ReferencePanel.tsx`**
   - Made similarity score VERY prominent (5xl font, centered)
   - Added visual progress bar for similarity
   - Enhanced chunk text display with yellow highlight
   - Added before/after context sections
   - Added detailed trust indicators with explanations
   - Added technical details grid (chunk info, RAG status)

4. **`src/pages/api/conversations/[id]/messages-stream.ts`**
   - Already building complete references with similarity scores ✅
   - Already including fullText, chunkIndex, metadata ✅
   - Already sending references in completion event ✅

5. **`src/components/ChatInterfaceWorking.tsx`**
   - Already has selectedReference state ✅
   - Already renders ReferencePanel ✅
   - Already handles reference clicks ✅

---

## 🎯 User Experience Flow

### Scenario: User asks about construction requirements

**Step 1: User question**
```
User: "¿Cuáles son los requisitos de distanciamiento en construcciones subterráneas?"
```

**Step 2: Thinking steps (visual feedback)**
```
✅ Pensando...
✅ Buscando Contexto Relevante...
✅ Seleccionando Chunks...
⏳ Generando Respuesta...
```

**Step 3: AI response appears with inline references**
```
Las construcciones en subterráneo deben cumplir con las disposiciones sobre 
distanciamientos mínimos[1 87%] establecidos en el artículo 5.1.12 de la OGUC. 
La DDU 189 establece zonas inexcavables[2 92%] que deben respetarse...
```

**User sees:**
- Green badge `[1 87%]` - clicks it
- ReferencePanel slides in from right
- Shows **87.3%** in large green text
- Shows full chunk text with highlight
- Shows context before and after
- Shows trust explanation: "✅ Alta relevancia - Este fragmento es altamente relevante..."

**Step 4: User verifies information**
- Reads full chunk text
- Sees it's from page 12-13 of Manual
- Sees it's chunk #5 with 245 tokens
- Understands this is RAG mode (not full document)
- Trust level: ✅ High confidence

**Step 5: User closes panel**
- Clicks X or presses ESC or clicks backdrop
- Can click another reference `[2 92%]`
- Repeat verification process

---

## 🔒 Trust Building Elements

### Why This Builds Trust:

1. **Transparency**: User sees EXACTLY what text the AI used
2. **Quantified Relevance**: Similarity score is objective, not subjective
3. **Contextual Understanding**: Before/after text shows chunk placement
4. **Source Traceability**: Can view full document if needed
5. **Method Disclosure**: Clear indication of RAG vs Full-Text
6. **Confidence Calibration**: Color coding + explanations help user assess confidence

### What Users Learn:

**High Similarity (Green 87%):**
- ✅ "I can trust this answer - it's based on highly relevant info"
- ✅ "The AI found the exact section I need"
- ✅ "87% similarity means strong semantic match"

**Medium Similarity (Yellow 68%):**
- ⚠️ "The AI found related info but it's not perfect match"
- ⚠️ "I should verify this information"
- ⚠️ "68% is decent but not conclusive"

**Low Similarity (Orange 45%):**
- 🚨 "This might not fully answer my question"
- 🚨 "The AI used what was available, but it's not very relevant"
- 🚨 "I should ask a different question or add better context"

---

## 💡 Implementation Details

### Reference Badge Styling

```html
<sup>
  <span class="reference-badge inline-flex items-center px-2 py-1 mx-1 
               bg-green-100 text-green-700 border-2 border-green-400 
               hover:bg-green-200 hover:border-green-500
               rounded-lg font-bold text-sm cursor-pointer 
               transition-all shadow-sm hover:shadow-md" 
        data-ref-id="1" 
        title="Click para ver detalles - Similitud: 87.3%">
    [1]<span class="ml-1 text-[9px] font-black">87%</span>
  </span>
</sup>
```

**Key attributes:**
- `data-ref-id`: Links to reference object
- Color classes: Dynamic based on similarity
- Hover states: Shadow and color intensity increase
- Title tooltip: Shows similarity on hover

### Similarity Score Formula

```typescript
// From src/lib/embeddings.ts
similarity = cosineSimilarity(queryEmbedding, chunkEmbedding)
// Returns value 0-1 (0% to 100%)

// Display:
displayPercent = (similarity * 100).toFixed(1)
// Example: 0.873 → "87.3%"
```

### Color Thresholds

```typescript
const getSimilarityColor = (similarity: number) => {
  if (similarity >= 0.8) return 'green';  // High confidence
  if (similarity >= 0.6) return 'yellow'; // Medium confidence
  return 'orange';                         // Low confidence
};
```

---

## 📈 Expected Outcomes

### User Benefits:
- ✅ **Increased trust**: Users can verify AI claims
- ✅ **Better understanding**: See why AI said what it said
- ✅ **Informed decisions**: Color coding guides confidence level
- ✅ **Traceability**: Can trace any claim to source
- ✅ **Learning**: Users learn about RAG quality through similarity scores

### Technical Benefits:
- ✅ **Debugging**: Easy to see if RAG is working well
- ✅ **Quality monitoring**: Low similarity scores indicate issues
- ✅ **User feedback**: Users can report irrelevant chunks
- ✅ **Optimization**: Can tune topK and minSimilarity based on patterns

---

## 🔮 Future Enhancements

### Potential additions:
- [ ] Similarity score explanation tooltip (what does 87% mean?)
- [ ] Multiple chunk view (compare all referenced chunks)
- [ ] Highlight matching keywords in chunk
- [ ] Document preview with chunk location highlighted
- [ ] Feedback: "Was this reference helpful?" (thumbs up/down)
- [ ] Analytics: Track which references users click most
- [ ] Export references as bibliography

---

## ✅ Success Criteria

Feature is successful if:

1. **Visibility**: Every reference has visible similarity score
2. **Clickability**: All `[N]` badges are clickable (inline and footer)
3. **Details**: ReferencePanel shows comprehensive information
4. **Trust**: Users understand and trust the references
5. **Performance**: Panel opens instantly (<100ms)
6. **Accessibility**: Keyboard navigation works (ESC to close)

---

## 📚 Related Documentation

- `src/lib/rag-search.ts` - RAG search implementation
- `src/lib/embeddings.ts` - Similarity calculation
- `RAG_COMPLEMENTARY_ARCHITECTURE.md` - RAG architecture
- `docs/fixes/agent-m001-context-not-used-fix-2025-10-22.md` - Recent RAG fixes

---

**Created**: 2025-10-22  
**Status**: ✅ Implemented  
**Impact**: High - Builds user trust in AI responses  
**Backward Compatible**: Yes - Falls back gracefully if no references

