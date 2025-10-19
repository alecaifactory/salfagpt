# ✅ Instrucciones Simples para Probar RAG

**3 pasos simples, 10 minutos total**

---

## Paso 1: Obtener ID de un Documento (2 min)

**Ejecuta:**

```bash
npx tsx -e "
import { firestore } from './src/lib/firestore.js';

const sources = await firestore.collection('context_sources')
  .orderBy('addedAt', 'desc')
  .limit(1)
  .get();

if (sources.docs.length > 0) {
  const source = sources.docs[0];
  const data = source.data();
  
  console.log('Documento encontrado:');
  console.log('  Nombre:', data.name);
  console.log('  ID:', source.id);
  console.log('  Usuario:', data.userId);
  console.log('');
  console.log('Copia estos valores:');
  console.log('  SOURCE_ID=' + source.id);
  console.log('  USER_ID=' + data.userId);
} else {
  console.log('No hay documentos. Upload uno primero.');
}

process.exit(0);
"
```

**Copia los valores que te da:**
- SOURCE_ID=...
- USER_ID=...

---

## Paso 2: Habilitar RAG (3 min)

**Ejecuta** (reemplaza SOURCE_ID y USER_ID):

```bash
curl -X POST "http://localhost:3000/api/context-sources/SOURCE_ID/enable-rag" \
  -H "Content-Type: application/json" \
  -d '{"userId":"USER_ID","chunkSize":500,"overlap":50}'
```

**Ejemplo real:**
```bash
curl -X POST "http://localhost:3000/api/context-sources/abc123xyz/enable-rag" \
  -H "Content-Type: application/json" \
  -d '{"userId":"114671162830729001607","chunkSize":500,"overlap":50}'
```

**Verás:**
```json
{
  "success": true,
  "chunksCreated": 100,
  "totalTokens": 50000,
  "indexingTime": 15234,
  "estimatedCost": 0.00125,
  "message": "RAG enabled successfully with 100 chunks"
}
```

**✅ RAG habilitado!**

---

## Paso 3: Hacer Query y Ver RAG (5 min)

**En browser:**

1. **Abre:** http://localhost:3000/chat

2. **Selecciona agente** que tiene ese documento

3. **Activa documento:** Toggle ON en "Fuentes de Contexto"

4. **Haz pregunta:** "¿De qué trata el documento?"

5. **Abre Console (F12)** y busca:

**Verás:**
```
🔍 Attempting RAG search...
🔍 RAG Search starting...
  ✓ Query embedding generated (23ms)
  ✓ Loaded 100 chunks (123ms)
  ✓ Found 5 similar chunks (12ms)
✅ RAG: Using 5 relevant chunks (2,487 tokens)
  1. Document.pdf (chunk 23) - 89.3% similar
  2. Document.pdf (chunk 45) - 84.1% similar
  ...
```

6. **Abre Context Panel** (botón "Context" arriba del input)

**Verás:**
```
Context: 0.5% usado (antes: 5.2%)
Total Tokens: 2,487
Disponible: 997,513
```

**¡95% de reducción!** 🎉

---

## 📊 Verificar Chunks en Firestore

**Ejecuta:**

```bash
npx tsx -e "
import { firestore } from './src/lib/firestore.js';

const count = await firestore.collection('document_chunks').count().get();
console.log('✅ Total chunks:', count.data().count);

const sample = await firestore.collection('document_chunks').limit(1).get();
if (sample.docs.length > 0) {
  const chunk = sample.docs[0].data();
  console.log('');
  console.log('Sample chunk:');
  console.log('  sourceId:', chunk.sourceId);
  console.log('  chunkIndex:', chunk.chunkIndex);
  console.log('  text:', chunk.text.substring(0, 80) + '...');
  console.log('  embedding dimensions:', chunk.embedding.length);
  console.log('  tokens:', chunk.metadata.tokenCount);
}

process.exit(0);
"
```

**Verás:**
```
✅ Total chunks: 100

Sample chunk:
  sourceId: abc123xyz
  chunkIndex: 0
  text: GOBIERNO DE CHILE MINVU DDU – ESPECIFÍCA...
  embedding dimensions: 768
  tokens: 510
```

---

## ✅ Lista de Verificación

**Después de los 3 pasos:**

- [ ] Script ejecutado sin errores
- [ ] Response: `"success": true, "chunksCreated": 100`
- [ ] Firestore tiene 100 chunks
- [ ] Query en browser muestra RAG logs
- [ ] Context panel muestra 0.5% (no 5%)
- [ ] Respuesta llegó más rápido

**Si todos ✅:** RAG FUNCIONA PERFECTAMENTE! 🎉

---

## 🎯 Qué Esperar

### Logs Completos en Console

```
📥 Cargando conversaciones...
✅ 102 conversaciones cargadas

🔍 Attempting RAG search...  ← NUEVO!
🔍 RAG Search starting...
  Query: "¿De qué trata el documento?"
  TopK: 5, MinSimilarity: 0.5
  
  1/4 Generating query embedding...
  ✓ Query embedding generated (23ms)
  
  2/4 Loading document chunks...
  ✓ Loaded 100 chunks (123ms)
  
  3/4 Calculating similarities...
  ✓ Found 5 similar chunks (12ms)
  
  4/4 Loading source metadata...
  ✓ Loaded metadata (8ms)

✅ RAG Search complete - 5 results
  1. DDU-ESP-019-07.pdf (chunk 23) - 89.3% similar
  2. DDU-ESP-019-07.pdf (chunk 45) - 84.1% similar  
  3. DDU-ESP-019-07.pdf (chunk 67) - 79.5% similar
  4. DDU-ESP-019-07.pdf (chunk 12) - 71.2% similar
  5. DDU-ESP-019-07.pdf (chunk 89) - 68.4% similar

✅ RAG: Using 5 relevant chunks (2,487 tokens)
  Avg similarity: 81.0%

📤 Sending message to Gemini...
✅ Response received
```

### Context Panel

**Antes:**
```
Context: 5.2% usado
Total: 52,000 tokens
Disponible: 948,000
```

**Después:**
```
Context: 0.5% usado  ← 10x menos!
Total: 2,487 tokens  ← 95% reducción!
Disponible: 997,513
```

---

## 🚀 EJECUTA AHORA

```bash
# Un solo comando:
./scripts/test-rag-complete.sh
```

**Luego:**
1. Abre chat
2. Haz query
3. Ve los logs
4. ¡Celebra la reducción de 95%! 🎉

---

**¿Ejecuto el script ahora o prefieres hacerlo manual?** 🤔

