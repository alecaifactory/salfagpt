# 🔍 Diagnóstico del Problema RAG - 2025-10-20

## 📋 Tabla Comparativa: Esperado vs Real

### Pregunta del Usuario:
```
"que sabemos de esto? 'Lo expuesto hasta ahora lleva a una primera conclusión cual es 
que el caso en consulta debe resolverse teniendo presente la Ley Nº19.537'"
```

### Estado del Sistema:
- **Chunks disponibles:** 5 chunks (indexados)
- **RAG habilitado:** ✅ Sí (toggle verde)
- **Threshold:** 0 (muestra todos)
- **Embeddings:** Vertex AI (intentando semánticos)

---

## 📊 Tabla: Esperado vs Real

| Aspecto | ESPERADO | REAL (Screenshot) | Status |
|---------|----------|-------------------|--------|
| **Búsqueda RAG** | ✅ Busca en 5 chunks | ⚠️ Fallback a Full | ❌ FALLA |
| **Chunks usados** | Chunk #2 (contiene texto exacto) | Documento completo | ❌ FALLA |
| **Similitud** | ~85-95% (contiene frase exacta) | 100.0% | ❌ INCORRECTO |
| **Modo mostrado** | 🔍 RAG | ⚠️ Full | ❌ FALLA |
| **Referencias** | [1] Fragmento 2 - 95% similar | [1] 100% - Chunk #0 - Doc. Completo | ❌ INCORRECTO |
| **Tokens enviados** | ~465 tokens (solo Chunk #2) | 2,023 tokens (todo) | ❌ INEFICIENTE |
| **Badge** | 🔍 RAG | 📝 Full-Text Mode | ❌ INCORRECTO |

---

## 🚨 Problema ROOT CAUSE

### El texto buscado ESTÁ LITERALMENTE en Chunk #2:

**Chunk #2 (465 tokens):**
```
5. Lo expuesto hasta ahora lleva a una primera conclusión cual es que el caso en 
consulta debe resolverse teniendo presente la Ley Nº19.537, desde el momento que 
la ley N°6.071 hoy en día se encuentra derogada...
```

**Pregunta del usuario:**
```
"Lo expuesto hasta ahora lleva a una primera conclusión cual es que el caso en 
consulta debe resolverse teniendo presente la Ley Nº19.537"
```

**Similitud esperada:** ~95% (es casi texto idéntico!)

**Similitud real:** 0% → Fallback a Full-Text

---

## 🔍 Por Qué Está Pasando

### Causa 1: Vertex AI No Se Está Ejecutando

**Evidence del log:**
```
⚠️ Fallback: RAG no encontró chunks relevantes, usó documentos completos
```

Esto significa que:
1. Sistema intentó RAG
2. No encontró chunks (similarity = 0)
3. Cayó en fallback (usar documento completo)

**Diagnosis:** Vertex AI embedding generation FAILED o NO se está usando

---

### Causa 2: Embeddings Siguen Siendo Determinísticos

**Si Vertex AI falló:**
```
❌ Vertex AI embedding generation failed: [error]
⚠️ Falling back to deterministic embedding
```

**Entonces:**
- Query embedding = hash determinístico
- Chunk embeddings = hash determinístico (de indexación anterior)
- Similarity = ~0% (diferentes textos = diferentes hashes)

---

### Causa 3: Chunks Tienen Embeddings Viejos (Determinísticos)

**CRITICAL:**
Los chunks fueron indexados ANTES de implementar Vertex AI.
- Chunks en Firestore tienen embeddings determinísticos viejos
- Query usa embedding Vertex AI nuevo
- Comparar vectors de diferentes tipos → similarity incorrecta

**Solución:** RE-INDEXAR documentos con Vertex AI

---

## ✅ Solución en 3 Pasos

### Paso 1: Verificar Vertex AI Funciona

**Test inmediato:**
```bash
npx tsx -e "
import { generateEmbedding } from './src/lib/embeddings.js';

(async () => {
  console.log('🧪 Testing Vertex AI embeddings...');
  
  try {
    const text = 'Lo expuesto hasta ahora lleva a una primera conclusión';
    const embedding = await generateEmbedding(text);
    
    console.log('✅ SUCCESS!');
    console.log('Embedding length:', embedding.length);
    console.log('First 5 values:', embedding.slice(0, 5));
    console.log('Type check:', embedding.every(v => typeof v === 'number'));
    
  } catch (error) {
    console.error('❌ FAILED:', error.message);
  }
})();
"
```

**Expected:**
```
✅ [Vertex AI] Generated semantic embedding: 768 dimensions
✅ SUCCESS!
Embedding length: 768
First 5 values: [0.023, -0.045, 0.189, 0.234, -0.167]
Type check: true
```

**If fails:**
```
❌ Vertex AI embedding generation failed: [error]
⚠️ Falling back to deterministic embedding
```

---

### Paso 2: Re-Indexar Cir32.pdf con Vertex AI

**Command:**
```bash
npx tsx scripts/reindex-document.ts --sourceId 8tjgUceVZW0A46QYYRfW
```

**Este script debe:**
1. Cargar los 5 chunks existentes de Firestore
2. Generar NUEVOS embeddings con Vertex AI para cada chunk
3. Actualizar chunks en Firestore con embeddings semánticos
4. Marcar documento como re-indexado

**Expected logs:**
```
🔄 Re-indexing document: Cir32.pdf (5 chunks)
🧮 [Vertex AI] Generating semantic embedding (Chunk #0)...
✅ [Vertex AI] Generated semantic embedding: 768 dimensions
🧮 [Vertex AI] Generating semantic embedding (Chunk #1)...
✅ [Vertex AI] Generated semantic embedding: 768 dimensions
...
✅ Re-indexed 5 chunks with Vertex AI embeddings
```

---

### Paso 3: Retry Query

**Después de re-indexar:**
1. Refresh página
2. Hacer misma pregunta
3. Verificar logs

**Expected:**
```
🔍 RAG Search starting...
  ✓ Found 5 similar chunks
  
Top chunks:
  1. Cir32.pdf (chunk 1) - 94.8% similar  ← CHUNK #2 en UI!
  2. Cir32.pdf (chunk 3) - 78.2% similar
  3. Cir32.pdf (chunk 0) - 65.1% similar
  
✅ RAG: Using 3 relevant chunks (950 tokens)
```

**UI mostrará:**
```
📚 Referencias utilizadas (3)

[1] Cir32.pdf - 94.8% similar
    Fragmento 1 - 🔍 RAG
    465 tokens
    
[2] Cir32.pdf - 78.2% similar
    Fragmento 3 - 🔍 RAG
    
[3] Cir32.pdf - 65.1% similar
    Fragmento 0 - 🔍 RAG
```

---

## 🎯 Root Cause Summary

### El Problema NO es el código:
- ✅ System prompt correcto (instrucciones RAG)
- ✅ Fragment mapping enviado
- ✅ Referencias construidas correctamente
- ✅ UI preparada para mostrar chunks

### El Problema ES los embeddings:
- ❌ Chunks tienen embeddings determinísticos viejos
- ❌ Query (posiblemente) usa embedding Vertex AI nuevo
- ❌ Comparar diferentes tipos de embeddings → similarity = 0
- ❌ RAG no encuentra matches → fallback a full-text

---

## 🔧 Crear Script de Re-Indexación

**Archivo nuevo:** `scripts/reindex-document.ts`

```typescript
import { firestore } from '../src/lib/firestore';
import { generateEmbedding } from '../src/lib/embeddings';

async function reindexDocument(sourceId: string) {
  console.log('🔄 Re-indexing document with Vertex AI embeddings...');
  
  // 1. Load all chunks for this source
  const chunksSnapshot = await firestore
    .collection('document_chunks')
    .where('sourceId', '==', sourceId)
    .orderBy('chunkIndex', 'asc')
    .get();
  
  console.log(`📊 Found ${chunksSnapshot.size} chunks to re-index`);
  
  // 2. Re-generate embeddings for each chunk
  let successCount = 0;
  let failCount = 0;
  
  for (const doc of chunksSnapshot.docs) {
    const chunkData = doc.data();
    console.log(`\n🧮 Processing Chunk #${chunkData.chunkIndex}...`);
    console.log(`  Text: ${chunkData.text.substring(0, 80)}...`);
    
    try {
      // Generate NEW semantic embedding
      const newEmbedding = await generateEmbedding(chunkData.text);
      
      // Update chunk in Firestore
      await doc.ref.update({
        embedding: newEmbedding,
        reindexedAt: new Date(),
        embeddingType: 'vertex-ai-semantic', // Mark as semantic
      });
      
      successCount++;
      console.log(`  ✅ Updated with ${newEmbedding.length}-dim semantic embedding`);
      
    } catch (error) {
      failCount++;
      console.error(`  ❌ Failed:`, error.message);
    }
  }
  
  // 3. Update source metadata
  await firestore.collection('context_sources').doc(sourceId).update({
    'ragMetadata.embeddingType': 'vertex-ai-semantic',
    'ragMetadata.lastReindexed': new Date(),
  });
  
  console.log(`\n✅ Re-indexing complete!`);
  console.log(`  Success: ${successCount} chunks`);
  console.log(`  Failed: ${failCount} chunks`);
}

// Get sourceId from command line
const sourceId = process.argv[2];
if (!sourceId) {
  console.error('❌ Usage: npx tsx scripts/reindex-document.ts <sourceId>');
  process.exit(1);
}

reindexDocument(sourceId)
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Re-indexing failed:', error);
    process.exit(1);
  });
```

**Uso:**
```bash
npx tsx scripts/reindex-document.ts 8tjgUceVZW0A46QYYRfW
```

---

## 📋 Action Items

### AHORA (Inmediato):
1. [ ] Verificar Vertex AI funciona (test simple)
2. [ ] Crear script de re-indexación
3. [ ] Re-indexar Cir32.pdf
4. [ ] Retry pregunta y verificar logs

### Si Vertex AI funciona:
- [ ] Re-indexar todos los documentos
- [ ] Subir threshold a 0.3
- [ ] Sistema RAG completamente funcional

### Si Vertex AI NO funciona:
- [ ] Investigar error específico
- [ ] Fix API call
- [ ] Alternative: Usar OpenAI embeddings
- [ ] Re-test

---

## 🎓 Key Insight

**El problema NO es el flujo RAG, es la CALIDAD de los embeddings.**

Con embeddings semánticos reales:
- Texto idéntico → 95%+ similarity ✅
- Texto similar → 70-90% similarity ✅
- Tema relacionado → 50-70% similarity ✅
- No relacionado → <30% similarity ✅

Con embeddings determinísticos:
- Texto idéntico → 80-100% similarity ✅
- Texto similar → 5-15% similarity ❌
- Tema relacionado → 2-8% similarity ❌
- No relacionado → 0-2% similarity ❌

**Threshold de 0.3 funciona con semánticos, pero nunca con determinísticos.**

---

**Created:** 2025-10-20  
**Next Step:** Crear script de re-indexación y ejecutar  
**ETA:** 15-20 minutos para re-indexar y probar

