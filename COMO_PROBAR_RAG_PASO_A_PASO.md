# 🚀 Cómo Probar RAG - Guía Paso a Paso

**Objetivo:** Ver el sistema RAG funcionando desde cero hasta query

---

## 📋 Opción 1: Modo Rápido (15 minutos)

### Paso 1: Habilitar RAG por Default (5 min)

**Editar archivo:** `src/pages/api/conversations/[id]/messages.ts`

**Línea 74:** Cambiar de:
```typescript
const ragEnabled = body.ragEnabled === true; // Explicit opt-in
```

**A:**
```typescript
const ragEnabled = body.ragEnabled !== false; // Enabled by default
```

**Guardar archivo** ✅

---

### Paso 2: Habilitar RAG para un Documento Existente (5 min)

**Ejecuta este comando** (reemplaza SOURCE_ID y USER_ID):

```bash
# Primero, obtén el ID de un documento existente:
npx tsx -e "
import { firestore } from './src/lib/firestore.js';
const sources = await firestore.collection('context_sources')
  .where('userId', '==', 'YOUR_USER_ID')
  .limit(1)
  .get();

if (sources.docs.length > 0) {
  const source = sources.docs[0];
  console.log('Source ID:', source.id);
  console.log('Name:', source.data().name);
  console.log('');
  console.log('Run this command:');
  console.log('');
  console.log('curl -X POST http://localhost:3000/api/context-sources/' + source.id + '/enable-rag \\\\');
  console.log('  -H \"Content-Type: application/json\" \\\\');
  console.log('  -d \\'{\"userId\":\"YOUR_USER_ID\",\"chunkSize\":500,\"overlap\":50}\\'');
}
process.exit(0);
"
```

**Luego ejecuta el curl que te da** ✅

**Verás:**
```json
{
  "success": true,
  "chunksCreated": 100,
  "totalTokens": 50000,
  "indexingTime": 15234,
  "message": "RAG enabled successfully with 100 chunks"
}
```

---

### Paso 3: Hacer una Query y Ver RAG en Acción (5 min)

**En tu browser:**

1. Abre http://localhost:3000/chat
2. Selecciona el agente que tiene el documento activo
3. Asegúrate que el documento está enabled (toggle ON)
4. Haz una pregunta específica sobre el documento

**En la consola del browser verás:**
```
🔍 Attempting RAG search...
🔍 RAG Search starting...
  1/4 Generating query embedding...
  ✓ Query embedding generated (234ms)
  2/4 Loading document chunks...
  ✓ Loaded 100 chunks (123ms)
  3/4 Calculating similarities...
  ✓ Found 5 similar chunks (45ms)
  4/4 Loading source metadata...
  ✓ Loaded metadata (23ms)
✅ RAG Search complete - 5 results
  1. Document.pdf (chunk 23) - 89.3% similar
  2. Document.pdf (chunk 45) - 84.1% similar
  3. Document.pdf (chunk 67) - 79.5% similar
✅ RAG: Using 5 relevant chunks (2,487 tokens)
  Avg similarity: 81.0%
```

**En el Context Panel verás:**
- Tokens usados: ~2,500 (antes: 50,000)
- Reducción: ~95%
- Chunks: 5 de 100

**¡RAG funcionando!** ✅

---

## 📋 Opción 2: Testing Completo (30 minutos)

### Paso 1: Verificar Setup (5 min)

```bash
# Verificar Vertex AI API
gcloud services list --enabled --project=gen-lang-client-0986191192 | grep aiplatform

# Verificar Firestore indexes
gcloud firestore indexes composite list --project=gen-lang-client-0986191192 | grep document_chunks

# Ambos deben mostrar resultados ✅
```

---

### Paso 2: Upload Nuevo Documento con Enhanced Extraction (10 min)

1. Abre Context Management
2. Upload un PDF (preferiblemente con gráficos y tablas)
3. Espera a que complete (verás progress bar smooth)
4. **Nuevo:** El extractedText ahora incluirá:
   - Tablas en markdown
   - ASCII visuals de gráficos
   - Mejor estructura

**Para verificar:**
```bash
# Ver el extractedData del documento:
npx tsx -e "
import { firestore } from './src/lib/firestore.js';
const sources = await firestore.collection('context_sources')
  .orderBy('addedAt', 'desc')
  .limit(1)
  .get();

const source = sources.docs[0].data();
console.log('Extracted text preview:');
console.log(source.extractedData.substring(0, 500));
console.log('...');
console.log('');
console.log('Has ASCII visuals:', /[┤┴┬┼╭╮╰╯─│├┐└┘]/.test(source.extractedData));
console.log('Has markdown tables:', /\|.*\|.*\|/.test(source.extractedData));
process.exit(0);
"
```

---

### Paso 3: Habilitar RAG para el Documento (5 min)

**Script automatizado:**

```bash
# Guarda esto en: test-enable-rag.sh
cat > test-enable-rag.sh << 'EOF'
#!/bin/bash

# Get latest source
SOURCE_DATA=$(npx tsx -e "
import { firestore } from './src/lib/firestore.js';
const sources = await firestore.collection('context_sources')
  .orderBy('addedAt', 'desc')
  .limit(1)
  .get();
const source = sources.docs[0];
console.log(JSON.stringify({
  id: source.id,
  userId: source.data().userId,
  name: source.data().name
}));
process.exit(0);
" 2>/dev/null)

SOURCE_ID=$(echo $SOURCE_DATA | jq -r '.id')
USER_ID=$(echo $SOURCE_DATA | jq -r '.userId')
SOURCE_NAME=$(echo $SOURCE_DATA | jq -r '.name')

echo "📄 Enabling RAG for: $SOURCE_NAME"
echo "ID: $SOURCE_ID"
echo ""

# Enable RAG
curl -X POST "http://localhost:3000/api/context-sources/$SOURCE_ID/enable-rag" \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"$USER_ID\",\"chunkSize\":500,\"overlap\":50}"

echo ""
echo ""
echo "✅ Check Firestore for chunks:"
echo "npx tsx -e \"import { firestore } from './src/lib/firestore.js'; const c = await firestore.collection('document_chunks').where('sourceId','==','$SOURCE_ID').count().get(); console.log('Chunks:', c.data().count); process.exit(0);\""
EOF

chmod +x test-enable-rag.sh
./test-enable-rag.sh
```

**Verás:**
```
📄 Enabling RAG for: DDU-ESP-019-07.pdf
ID: abc123xyz

{"success":true,"chunksCreated":100,"totalTokens":50000,...}

✅ Check Firestore for chunks:
Chunks: 100
```

---

### Paso 4: Hacer Query con RAG (5 min)

**En browser:**

1. Abre el agente que tiene ese documento
2. Activa el documento (toggle ON)
3. Haz una pregunta específica: "¿Qué dice sobre X?"

**Verás en consola:**
```
🔍 Attempting RAG search...
✅ RAG: Using 5 relevant chunks (2,487 tokens)
```

**En Context Panel:**
- Context: 0.5% usado (antes: 5%)
- RAG activo indicator
- Tokens ahorrados: ~47,500

**¡RAG funcionando!** 🎉

---

### Paso 5: Verificar Chunks en Firestore (5 min)

```bash
# Ver chunks creados:
npx tsx -e "
import { firestore } from './src/lib/firestore.js';

const chunks = await firestore.collection('document_chunks')
  .limit(3)
  .get();

console.log('Total chunks found:', chunks.size);
console.log('');

chunks.docs.forEach((doc, i) => {
  const data = doc.data();
  console.log(\`Chunk \${i + 1}:\`);
  console.log('  Source ID:', data.sourceId);
  console.log('  Chunk index:', data.chunkIndex);
  console.log('  Text length:', data.text.length);
  console.log('  Embedding dims:', data.embedding.length);
  console.log('  Tokens:', data.metadata.tokenCount);
  console.log('');
});

process.exit(0);
"
```

**Verás:**
```
Total chunks found: 100

Chunk 1:
  Source ID: abc123xyz
  Chunk index: 0
  Text length: 2041
  Embedding dims: 768
  Tokens: 510

Chunk 2:
  ...
```

---

## 📋 Opción 3: Testing Visual (Browser Only - 20 min)

### Paso 1: Upload y Ver Enhanced Extraction

1. **Upload PDF nuevo:**
   - Context Management → Upload
   - Selecciona PDF con gráficos/tablas
   - Espera extracción

2. **Ver extraction preview** (cuando se implemente modal):
   - Click en el documento
   - Ver extraction preview
   - Verifica ASCII visuals
   - Verifica tablas markdown

---

### Paso 2: Habilitar RAG (UI - Cuando se integre botón)

1. Click en settings del documento
2. Click "Enable RAG"
3. Ver progress de indexación
4. Esperar confirmación

---

### Paso 3: Query y Ver Attribution

1. Hacer pregunta sobre el documento
2. Ver respuesta con chunks usados
3. Ver similarity scores
4. Click en chunks para detalles

---

### Paso 4: Calificar con CSAT

1. Después de respuesta, ver widget de estrellas
2. Click en rating (1-5)
3. Expandir para categorías
4. Agregar comentario
5. Submitir

---

### Paso 5: Ver Dashboards Admin

1. User menu → "Configuración RAG"
2. Tab: Statistics → Ver métricas
3. Tab: Maintenance → Ver health
4. User menu → "Analytics" (cuando se integre)
5. Ver cost breakdown
6. Ver optimization suggestions

---

## 🎯 Modo RÁPIDO para Probar HOY

**Lo más fácil:**

```bash
# 1. Modificar 1 línea para enable RAG:
# src/pages/api/conversations/[id]/messages.ts línea 74:
const ragEnabled = body.ragEnabled !== false;

# 2. Restart server:
npm run dev

# 3. Enable RAG para documento existente:
./test-enable-rag.sh  # (script de arriba)

# 4. Hacer query en browser
# 5. Ver logs de RAG search
```

**Total: 10 minutos para ver RAG funcionando** ✅

---

## 📊 Qué Esperar Ver

### Sin RAG (Actual)
```
Console:
📎 Including full context from 1 active sources (full-text mode)

Context Panel:
Context: 5.2% usado
Tokens: 52,000
```

### Con RAG (Después de habilitar)
```
Console:
🔍 Attempting RAG search...
✅ RAG: Using 5 relevant chunks (2,487 tokens)
  Avg similarity: 81.0%

Context Panel:
Context: 0.5% usado
🔍 Búsqueda Vectorial Activa
Tokens: 2,487 (95% reducción)
```

---

## 🎯 Resumen de Opciones

**Opción A: Enable RAG default + Test** (10 min)
- Cambiar 1 línea
- Restart server
- Enable-rag via curl
- Query y ver logs

**Opción B: Testing completo** (30 min)
- Verificar setup
- Upload nuevo con extraction mejorada
- Enable RAG
- Query con RAG
- Verificar chunks

**Opción C: Esperar integración UI** (mañana)
- Botones en UI para enable RAG
- Preview modal integrado
- CSAT widgets en chat
- Dashboards accessibles

---

## 💡 Recomendación INMEDIATA

**Para ver RAG funcionando YA:**

```bash
# 1. Edita este archivo:
# src/pages/api/conversations/[id]/messages.ts

# Línea 74, cambia a:
const ragEnabled = body.ragEnabled !== false;

# 2. Guarda y restart server (se reinicia automático)

# 3. Ve a Firestore console:
https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore

# 4. Encuentra un document_id en context_sources

# 5. Ejecuta:
curl -X POST "http://localhost:3000/api/context-sources/DOCUMENT_ID/enable-rag" \
  -H "Content-Type: application/json" \
  -d '{"userId":"YOUR_USER_ID","chunkSize":500}'

# 6. Haz una query en el chat
# 7. Mira la consola del browser - verás RAG search logs!
```

**Tiempo:** 10 minutos total

**Verás 95% reducción de tokens INMEDIATAMENTE** ✅

---

**¿Quieres que te ayude con estos pasos ahora?** 🚀

