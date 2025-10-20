# 🔧 Solución Temporal RAG - Bajar Threshold - 2025-10-20

## 🎯 Problema ROOT CAUSE

**Los embeddings determinísticos NO capturan similitud semántica.**

Resultado:
- Query: "¿Qué dice sobre la Ley 19.537?"
- Chunk: "La Ley N°19.537 derogó..."
- Similitud: ~0% (porque el texto no es idéntico)
- Threshold: 30% (minSimilarity = 0.3)
- Result: ❌ No matches, fallback a full-text

---

## ✅ Solución Temporal: Bajar Threshold

Mientras implementamos embeddings semánticos reales (Vertex AI), podemos **bajar el threshold** para forzar el uso de chunks.

### Cambio 1: Default minSimilarity a 0.05 (5%)

**Archivo:** `src/lib/rag-search.ts`

**Línea 42:**
```typescript
// ANTES:
minSimilarity = 0.5,  // 50% threshold

// DESPUÉS:
minSimilarity = 0.05,  // 5% threshold (temporal para embeddings determinísticos)
```

**Justification:**
- Los embeddings determinísticos dan ~1-10% de similitud incluso para texto relacionado
- Threshold de 5% permite encontrar chunks "casi relacionados"
- Mejor usar chunks aproximados que documento completo (ahorro de tokens)

---

### Cambio 2: Comentario Explicativo

**Agregar al inicio de generateDeterministicEmbedding():**

```typescript
/**
 * TEMPORARY DETERMINISTIC EMBEDDING
 * 
 * ⚠️ WARNING: This is a placeholder until we implement real semantic embeddings.
 * 
 * Current behavior:
 * - Generates embedding based on character positions (hash)
 * - Only gives high similarity (~80%+) for near-identical text
 * - Gives low similarity (~1-10%) for semantically similar but different text
 * 
 * Impact:
 * - RAG threshold must be very low (0.05 instead of 0.5)
 * - Chunk selection is not optimal
 * - Better than nothing, worse than real embeddings
 * 
 * TODO: Replace with Vertex AI text-embedding-004 for production
 */
function generateDeterministicEmbedding(text: string): number[] {
```

---

### Cambio 3: RAG Config Default en Frontend

**Archivo:** `src/components/ChatInterfaceWorking.tsx`

**Buscar línea con:**
```typescript
const [ragMinSimilarity, setRagMinSimilarity] = useState(0.3);
```

**Cambiar a:**
```typescript
const [ragMinSimilarity, setRagMinSimilarity] = useState(0.05); // TEMP: Low for deterministic embeddings
```

---

### Cambio 4: Warning en RAG Config Panel

**Archivo:** `src/components/RAGConfigPanel.tsx`

**Agregar warning:**
```tsx
<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
  <p className="text-xs text-yellow-800">
    <span className="font-bold">⚠️ Nota Temporal:</span> Los embeddings actuales son 
    determinísticos (no semánticos). Threshold bajo (5%) es necesario para encontrar matches.
    Estamos trabajando en embeddings semánticos reales con Vertex AI.
  </p>
</div>
```

---

## 🧪 Testing con Threshold Bajo

### Expected Behavior

Con `minSimilarity = 0.05`:

**Backend Logs:**
```
🔍 RAG Search starting...
  TopK: 10, MinSimilarity: 0.05
  ✓ Found 5 similar chunks (0ms)

✅ RAG: Using 5 relevant chunks (2,500 tokens)
  Avg similarity: 6.8%  ← Low pero al menos encuentra algo
  1. Cir32.pdf (chunk 3) - 8.9% similar
  2. Cir32.pdf (chunk 1) - 7.6% similar
  3. Cir32.pdf (chunk 4) - 6.8% similar
```

**UI:**
- ✅ Muestra "🔍 RAG" en log
- ✅ Muestra "5 chunks" 
- ✅ Referencias con ~6-9% similarity
- ✅ NO muestra "📝 Full"

**Benefit:**
- RAG se usa (aunque con similitud baja)
- Sistema funciona end-to-end
- Podemos probar todo el flujo de referencias

---

## 📋 Implementation Checklist

- [ ] `src/lib/rag-search.ts` - minSimilarity default = 0.05
- [ ] `src/lib/embeddings.ts` - Agregar warning comment
- [ ] `src/components/ChatInterfaceWorking.tsx` - minSimilarity state = 0.05
- [ ] `src/components/RAGConfigPanel.tsx` - Agregar warning UI
- [ ] Testing con threshold bajo
- [ ] Verificar RAG funciona (aunque con baja similitud)

---

## 🚀 Solución Permanente (TODO Futuro)

### Opción A: Vertex AI Embeddings (Recomendado)

**Package:** `@google-cloud/aiplatform`

**API:**
```typescript
import { PredictionServiceClient } from '@google-cloud/aiplatform';

const client = new PredictionServiceClient();

async function generateEmbedding(text: string): Promise<number[]> {
  const endpoint = `projects/${PROJECT_ID}/locations/us-central1/publishers/google/models/text-embedding-004`;
  
  const request = {
    endpoint,
    instances: [{ content: text }]
  };
  
  const [response] = await client.predict(request);
  return response.predictions[0].embeddings.values;
}
```

**Dimensions:** 768
**Cost:** $0.025 per 1M characters
**Quality:** ⭐⭐⭐⭐⭐ (Best)

---

### Opción B: OpenAI Embeddings (Alternative)

**Package:** `openai`

**API:**
```typescript
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateEmbedding(text: string): Promise<number[]> {
  const result = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text
  });
  
  return result.data[0].embedding;
}
```

**Dimensions:** 1536
**Cost:** $0.020 per 1M tokens
**Quality:** ⭐⭐⭐⭐⭐ (Excellent)

---

### Opción C: Sentence Transformers (Local)

**Package:** `@xenova/transformers` (runs in Node.js)

**API:**
```typescript
import { pipeline } from '@xenova/transformers';

const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

async function generateEmbedding(text: string): Promise<number[]> {
  const output = await embedder(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}
```

**Dimensions:** 384
**Cost:** FREE (local)
**Quality:** ⭐⭐⭐ (Good for Spanish)

---

## 🎯 Recommendation

### For Now (Today):
1. ✅ Bajar threshold a 0.05
2. ✅ Agregar warning UI
3. ✅ Sistema funciona end-to-end
4. ✅ Podemos testear referencias

### For Production (Next Week):
1. 🔜 Implement Vertex AI embeddings
2. 🔜 Re-index all documents
3. 🔜 Raise threshold back to 0.3-0.5
4. 🔜 Remove warning
5. 🔜 RAG works optimally

---

**Created:** 2025-10-20  
**Priority:** HIGH - Blocker for RAG functionality  
**ETA Temporal Fix:** 10 minutes  
**ETA Real Fix:** 2-3 hours (Vertex AI implementation)

