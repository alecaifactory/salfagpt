# 🚨 Solución REAL: Indexar Documentos para RAG

**Fecha:** 2025-11-13  
**Problema Confirmado:** Documentos NO tienen chunks indexados  
**Impacto:** 50% es fallback porque no hay chunks para calcular similitud

---

## 🔍 Diagnóstico Confirmado

### **Test Ejecutado:**

```bash
npx tsx scripts/check-actual-similarities.ts
```

### **Resultado:**

```
✅ Agent tiene 10 documentos asignados:
   - Control semanal de grúas HIAB.pdf
   - Manual del Operador Camion International 7600.pdf
   - Manual de Operacion Hiab 322-377 Duo-HiDuo.pdf
   ... (10 total)

❌ NO CHUNKS FOUND!
   Documents are not indexed for RAG
```

---

## 🎯 El Problema REAL

### **Flujo Actual (Incorrecto):**

```
1. Usuario pregunta sobre Cummins
   ↓
2. RAG busca en document_chunks collection
   ↓
3. WHERE userId = 'usr_...' AND sourceId IN [...10 docs...]
   ↓
4. Resultado: 0 chunks (porque no existen)
   ↓
5. Sistema cae en EMERGENCY FALLBACK
   ↓
6. Carga extractedData completo de context_sources
   ↓
7. Usa documento completo (15,000-30,000 tokens)
   ↓
8. Asigna similarity = 0.5 (50%) genérico
   ↓
9. Usuario ve: Todas las referencias con 50.0%
```

### **Flujo Correcto (Con Indexación):**

```
1. Usuario pregunta sobre Cummins
   ↓
2. RAG busca en document_chunks collection
   ↓
3. WHERE userId = 'usr_...' AND sourceId IN [...10 docs...]
   ↓
4. Resultado: 150 chunks (de los 10 documentos)
   ↓
5. Calcula similitud REAL con embeddings semánticos (Gemini)
   ↓
6. Chunks ordenados por similitud:
      - Chunk #45: 78.3% (Manual Cummins, página sobre filtros)
      - Chunk #23: 72.1% (Procedimiento mantenimiento)
      - Chunk #67: 68.9% (Especificaciones técnicas)
   ↓
7. Filtra chunks <70%
   ↓
8. Resultado: 2 chunks pasan el threshold
   ↓
9. Usuario ve: [1] Manual - 78.3%, [2] Procedimiento - 72.1%
```

---

## ✅ SOLUCIÓN: Indexar Documentos

### **Comando para Indexar:**

```bash
# Indexar TODOS los documentos del agente
npx tsx scripts/index-agent-documents.ts --agentId KfoKcDrb6pMnduAiLlrD

# O indexar un documento específico
npx tsx scripts/index-document.ts --sourceId <source-id>

# O re-indexar todo el sistema
npm run index:documents
```

### **Qué hace la indexación:**

```
1. Lee extractedData del PDF (de context_sources)
   ↓
2. Divide en chunks de ~1000 tokens cada uno
   ↓
3. Para cada chunk:
   a) Genera embedding semántico con Gemini AI
   b) Guarda en document_chunks collection:
      {
        userId: 'usr_...',
        sourceId: '<pdf-id>',
        chunkIndex: 0, 1, 2, ...
        text: "texto del chunk",
        embedding: [0.0123, 0.0268, ...] ← 768 dimensiones
      }
   ↓
4. Sincroniza a BigQuery (si prod)
   ↓
5. RAG ahora puede buscar chunks y calcular similitud REAL
```

---

## 📊 Comparación: Sin Indexar vs Indexado

### **Sin Indexar (Estado Actual):**

| Métrica | Valor |
|---------|-------|
| Chunks en DB | 0 |
| Similitud calculada | No (no hay chunks) |
| Fallback usado | Sí (documento completo) |
| Similitud mostrada | 50% (hardcoded) |
| Tokens por referencia | 15,000-30,000 (doc completo) |
| Calidad | ❌ Baja (demasiado contexto, no específico) |

### **Indexado (Expected):**

| Métrica | Valor |
|---------|-------|
| Chunks en DB | ~150-200 por agente |
| Similitud calculada | Sí (embedding Gemini) |
| Fallback usado | No (RAG funciona) |
| Similitud mostrada | 45-95% (real, variada) |
| Tokens por referencia | 500-1500 (solo chunks relevantes) |
| Calidad | ✅ Alta (contexto preciso) |

---

## 🔧 Scripts de Indexación

### **Script 1: Verificar Estado de Indexación**

```typescript
// scripts/check-indexing-status.ts

import { firestore } from '../src/lib/firestore.js';

async function checkStatus() {
  // Get agent's sources
  const sources = await firestore
    .collection('context_sources')
    .where('assignedToAgents', 'array-contains', 'KfoKcDrb6pMnduAiLlrD')
    .get();
  
  console.log(`📄 Agent has ${sources.size} documents`);
  
  // Check chunks for each source
  for (const doc of sources.docs) {
    const chunks = await firestore
      .collection('document_chunks')
      .where('sourceId', '==', doc.id)
      .get();
    
    console.log(`  ${doc.data().name}: ${chunks.size} chunks`);
  }
}
```

**Ejecutar:**
```bash
npx tsx scripts/check-indexing-status.ts
```

**Expected output si NO indexado:**
```
📄 Agent has 10 documents
  Control semanal grúas: 0 chunks  ← ❌ No indexado
  Manual Operador: 0 chunks        ← ❌ No indexado
  ... (todos 0)
```

**Expected output si SÍ indexado:**
```
📄 Agent has 10 documents
  Control semanal grúas: 8 chunks  ← ✅ Indexado
  Manual Operador: 35 chunks       ← ✅ Indexado
  ... (todos >0)
```

---

### **Script 2: Indexar Agente Específico**

```typescript
// scripts/index-agent-documents.ts

import { firestore } from '../src/lib/firestore.js';
import { generateEmbedding } from '../src/lib/embeddings.js';

async function indexAgent(agentId: string) {
  console.log(`📚 Indexing documents for agent: ${agentId}`);
  
  // 1. Get sources
  const sources = await firestore
    .collection('context_sources')
    .where('assignedToAgents', 'array-contains', agentId)
    .get();
  
  console.log(`Found ${sources.size} documents to index`);
  
  // 2. For each source, create chunks
  for (const sourceDoc of sources.docs) {
    const sourceData = sourceDoc.data();
    const extractedText = sourceData.extractedData || '';
    
    console.log(`\n  Processing: ${sourceData.name}`);
    console.log(`    Text length: ${extractedText.length} chars`);
    
    // Split into chunks (~1000 tokens each)
    const chunks = splitIntoChunks(extractedText, 1000);
    console.log(`    Created ${chunks.length} chunks`);
    
    // 3. Generate embeddings and save
    for (let i = 0; i < chunks.length; i++) {
      const embedding = await generateEmbedding(chunks[i]);
      
      await firestore.collection('document_chunks').add({
        userId: sourceData.userId,
        sourceId: sourceDoc.id,
        chunkIndex: i,
        text: chunks[i],
        textPreview: chunks[i].substring(0, 200),
        embedding,
        metadata: {
          tokenCount: Math.ceil(chunks[i].length / 4)
        },
        createdAt: new Date()
      });
      
      console.log(`      Chunk ${i + 1}/${chunks.length} indexed`);
    }
    
    console.log(`    ✅ ${sourceData.name} indexed`);
  }
  
  console.log(`\n✅ Indexing complete!`);
}

function splitIntoChunks(text: string, tokensPerChunk: number): string[] {
  const charsPerChunk = tokensPerChunk * 4; // ~4 chars per token
  const chunks: string[] = [];
  
  for (let i = 0; i < text.length; i += charsPerChunk) {
    chunks.push(text.substring(i, i + charsPerChunk));
  }
  
  return chunks;
}
```

---

## 📈 Impacto de Indexar

### **Antes de Indexar:**
```
Query: "¿Pasos para cambiar filtro Cummins?"

RAG Search:
  ❌ Chunks found: 0
  ❌ Similarity: N/A (no chunks to compare)
  ⚠️ Fallback: Use full documents
  
Referencias mostradas:
  [1] Manual Operador - 50.0% (fallback)
  [2] Manual HIAB - 50.0% (fallback)
  ... (todas 50%)
  
Tokens usados: 120,000 (10 documentos completos)
```

### **Después de Indexar:**
```
Query: "¿Pasos para cambiar filtro Cummins?"

RAG Search:
  ✅ Chunks found: 150 (de 10 documentos)
  ✅ Similarity calculated: 45-85%
  ✅ Top chunks selected
  
Similitudes REALES:
  Chunk #45 (Manual International 7600): 78.3%
  Chunk #23 (Manual Ford Cargo): 72.1%
  Chunk #12 (Control semanal): 52.4% ← Filtrado (<70%)
  
Referencias mostradas (solo >70%):
  [1] Manual International 7600 - 78.3% ✅
  [2] Manual Ford Cargo - 72.1% ✅
  
Tokens usados: 2,400 (solo 2 chunks relevantes)
```

**Mejora:**
- ✅ Similitud REAL (no fallback 50%)
- ✅ Solo documentos relevantes
- ✅ 98% menos tokens (ahorro masivo)
- ✅ Respuestas más precisas

---

## 🎯 Por Qué NO Ves el Mensaje de Admin

El código para mensaje de admin SÍ está implementado, pero solo se activa cuando:

```typescript
// Condición para mensaje admin:
ragResults.length > 0 && !meetsQualityThreshold(ragResults, 0.7)
```

**Significado:**
- Necesita haber chunks encontrados (ragResults.length > 0)
- Pero ninguno pasa el 70%

**Tu caso actual:**
- `ragResults.length = 0` (NO hay chunks en DB)
- Código va directo a emergency fallback
- Usa documentos completos
- NO ejecuta lógica de "no relevant docs"

**Una vez que indexes:**
- `ragResults.length = 150` (hay chunks)
- Calcula similitud de cada uno
- Si max similitud es 65% → Mensaje admin
- Si max similitud es 78% → Usa referencias normales

---

## ✅ ACCIÓN REQUERIDA

### **Paso 1: Crear Script de Indexación**

Déjame crear el script completo para ti.

### **Paso 2: Ejecutar Indexación**

```bash
# Esto tomará ~5-10 minutos para 10 documentos
npx tsx scripts/index-agent-documents.ts
```

### **Paso 3: Verificar Chunks Creados**

```bash
npx tsx scripts/check-indexing-status.ts
# Debería mostrar >0 chunks por documento
```

### **Paso 4: Probar Query Again**

Hacer la misma pregunta y ver similitud REAL.

---

**¿Quieres que cree el script de indexación completo ahora?** Sin indexación, el sistema NUNCA podrá mostrar similitud real - siempre será fallback 50%.




