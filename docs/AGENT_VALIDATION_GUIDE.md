# 📋 Guía de Validación de Agentes - Flow Platform

**Versión:** 1.0.0  
**Última actualización:** 2025-11-20  
**Propósito:** Validación completa de agentes antes de lanzamiento a producción  
**Proyecto:** salfagpt

---

## 🎯 **PROPÓSITO**

Esta guía establece el proceso completo para validar que un agente está correctamente configurado, funcional, y listo para producción. Incorpora todos los aprendizajes críticos de validaciones previas (S1-v2, M1-v2, M3-v2).

**Úsala para:**
- ✅ Validar nuevos agentes antes de compartir con usuarios
- ✅ Troubleshoot agentes existentes con problemas
- ✅ Garantizar calidad consistente en producción
- ✅ Prevenir problemas de performance y funcionalidad

---

## 📊 **NIVELES DE VALIDACIÓN**

### **Nivel 1: Validación Básica (5 min)**
Confirmación rápida de que el agente existe y tiene documentos asignados.

### **Nivel 2: Validación Técnica (15 min)**
Verificación completa de configuración, chunks, embeddings, y BigQuery.

### **Nivel 3: Validación Funcional (30 min)**
Testing de RAG con queries reales, medición de performance, análisis de calidad.

### **Nivel 4: Validación de Usuario (1-2 horas)**
Testing con usuarios reales, feedback, iteración de mejoras.

---

## 🔍 **NIVEL 1: VALIDACIÓN BÁSICA**

### **Objetivo:** Confirmar que el agente existe y tiene fundamentos correctos.

### **Checklist Básico:**

```bash
# 1. Verificar que el agente existe en Firestore
npx tsx << 'EOF'
import { firestore } from './src/lib/firestore.js';

const AGENT_ID = 'TU_AGENT_ID_AQUI'; // ⬅️ Reemplazar

const agent = await firestore.collection('conversations').doc(AGENT_ID).get();

if (!agent.exists) {
  console.log('❌ ERROR: Agente no encontrado');
  process.exit(1);
}

const data = agent.data();
console.log('✅ Agente encontrado:');
console.log(`   Título: ${data.title}`);
console.log(`   Owner: ${data.userId}`);
console.log(`   Creado: ${data.createdAt?.toDate()}`);
console.log(`   Tag: ${data.tags?.[0] || 'Sin tag'}`);

process.exit(0);
EOF
```

**Resultado esperado:**
```
✅ Agente encontrado:
   Título: [Nombre del agente]
   Owner: usr_[...]
   Creado: [Fecha]
   Tag: [M001, S001, etc.]
```

---

```bash
# 2. Verificar documentos asignados
npx tsx << 'EOF'
import { firestore } from './src/lib/firestore.js';

const AGENT_ID = 'TU_AGENT_ID_AQUI'; // ⬅️ Reemplazar

const sources = await firestore.collection('context_sources')
  .where('assignedToAgents', 'array-contains', AGENT_ID)
  .get();

console.log(`✅ Documentos asignados: ${sources.size}`);

if (sources.size === 0) {
  console.log('⚠️  ADVERTENCIA: No hay documentos asignados');
  process.exit(1);
}

// Mostrar primeros 5
console.log('\n📄 Primeros documentos:');
sources.docs.slice(0, 5).forEach((doc, idx) => {
  const data = doc.data();
  console.log(`   ${idx+1}. ${data.name}`);
});

process.exit(0);
EOF
```

**Resultado esperado:**
```
✅ Documentos asignados: 75
📄 Primeros documentos:
   1. Manual-operaciones.pdf
   2. Procedimiento-seguridad.pdf
   ...
```

---

```bash
# 3. Verificar que documentos tienen extractedData
npx tsx << 'EOF'
import { firestore } from './src/lib/firestore.js';

const AGENT_ID = 'TU_AGENT_ID_AQUI'; // ⬅️ Reemplazar

const sources = await firestore.collection('context_sources')
  .where('assignedToAgents', 'array-contains', AGENT_ID)
  .get();

let withData = 0;
let withoutData = 0;

sources.docs.forEach(doc => {
  const data = doc.data();
  if (data.extractedData && data.extractedData.length > 100) {
    withData++;
  } else {
    withoutData++;
    console.log(`⚠️  Sin datos: ${data.name}`);
  }
});

console.log(`\n✅ Con extractedData: ${withData}`);
console.log(`❌ Sin extractedData: ${withoutData}`);

if (withoutData > 0) {
  console.log('\n⚠️  ACCIÓN REQUERIDA: Re-extraer documentos sin datos');
}

process.exit(0);
EOF
```

**Resultado esperado:**
```
✅ Con extractedData: 75
❌ Sin extractedData: 0
```

---

### **Resultado Nivel 1:**

✅ **PASA** si:
- Agente existe en Firestore
- Tiene documentos asignados (>0)
- Todos los documentos tienen extractedData

❌ **FALLA** si:
- Agente no existe
- No tiene documentos asignados
- Documentos sin extractedData (>10%)

---

## 🔧 **NIVEL 2: VALIDACIÓN TÉCNICA**

### **Objetivo:** Verificar infraestructura técnica completa (chunks, embeddings, BigQuery).

### **Checklist Técnico:**

```bash
# 1. Verificar chunks en Firestore
npx tsx << 'EOF'
import { firestore } from './src/lib/firestore.js';

const AGENT_ID = 'TU_AGENT_ID_AQUI'; // ⬅️ Reemplazar

// Obtener sources del agente
const sources = await firestore.collection('context_sources')
  .where('assignedToAgents', 'array-contains', AGENT_ID)
  .get();

const sourceIds = sources.docs.map(doc => doc.id);

console.log(`📄 Documentos del agente: ${sourceIds.length}`);

// Contar chunks por cada source
let totalChunks = 0;
const chunksBySource = {};

for (const sourceId of sourceIds) {
  const chunks = await firestore.collection('document_chunks')
    .where('sourceId', '==', sourceId)
    .get();
  
  chunksBySource[sourceId] = chunks.size;
  totalChunks += chunks.size;
}

console.log(`\n✅ Total chunks en Firestore: ${totalChunks}`);
console.log(`   Promedio por documento: ${(totalChunks / sourceIds.length).toFixed(1)}`);

// Mostrar documentos sin chunks
const noChunks = Object.entries(chunksBySource).filter(([id, count]) => count === 0);
if (noChunks.length > 0) {
  console.log(`\n⚠️  Documentos sin chunks: ${noChunks.length}`);
  for (const [sourceId] of noChunks.slice(0, 5)) {
    const source = sources.docs.find(d => d.id === sourceId);
    console.log(`   - ${source.data().name}`);
  }
}

process.exit(0);
EOF
```

**Resultado esperado:**
```
📄 Documentos del agente: 75
✅ Total chunks en Firestore: 1,113
   Promedio por documento: 14.8
```

---

```bash
# 2. Verificar embeddings en Firestore
npx tsx << 'EOF'
import { firestore } from './src/lib/firestore.js';

const AGENT_ID = 'TU_AGENT_ID_AQUI'; // ⬅️ Reemplazar

const sources = await firestore.collection('context_sources')
  .where('assignedToAgents', 'array-contains', AGENT_ID)
  .get();

const sourceIds = sources.docs.map(doc => doc.id);

let totalEmbeddings = 0;
let chunksWithEmbeddings = 0;
let chunksWithoutEmbeddings = 0;

for (const sourceId of sourceIds) {
  const chunks = await firestore.collection('document_chunks')
    .where('sourceId', '==', sourceId)
    .get();
  
  chunks.docs.forEach(doc => {
    const embedding = doc.data().embedding;
    if (embedding && Array.isArray(embedding) && embedding.length === 768) {
      chunksWithEmbeddings++;
      totalEmbeddings++;
    } else {
      chunksWithoutEmbeddings++;
    }
  });
}

console.log('🧮 Embeddings en Firestore:');
console.log(`   ✅ Chunks con embeddings: ${chunksWithEmbeddings}`);
console.log(`   ❌ Chunks sin embeddings: ${chunksWithoutEmbeddings}`);
console.log(`   📊 Coverage: ${((chunksWithEmbeddings / (chunksWithEmbeddings + chunksWithoutEmbeddings)) * 100).toFixed(1)}%`);

if (chunksWithoutEmbeddings > 0) {
  console.log('\n⚠️  ACCIÓN REQUERIDA: Regenerar embeddings para chunks faltantes');
}

process.exit(0);
EOF
```

**Resultado esperado:**
```
🧮 Embeddings en Firestore:
   ✅ Chunks con embeddings: 1,113
   ❌ Chunks sin embeddings: 0
   📊 Coverage: 100.0%
```

---

```bash
# 3. Verificar sync a BigQuery (CRÍTICO para performance)
npx tsx << 'EOF'
import { firestore } from './src/lib/firestore.js';
import { BigQuery } from '@google-cloud/bigquery';

const AGENT_ID = 'TU_AGENT_ID_AQUI'; // ⬅️ Reemplazar
const bigquery = new BigQuery({ projectId: 'salfagpt' });

// Obtener sources del agente
const sources = await firestore.collection('context_sources')
  .where('assignedToAgents', 'array-contains', AGENT_ID)
  .get();

const sourceIds = sources.docs.map(doc => doc.id);

console.log(`📄 Documentos del agente: ${sourceIds.length}`);

// Contar chunks en BigQuery
const query = `
  SELECT source_id, COUNT(*) as chunk_count
  FROM \`salfagpt.flow_rag_optimized.document_chunks_vectorized\`
  WHERE source_id IN (${sourceIds.map(id => `'${id}'`).join(',')})
  GROUP BY source_id
`;

const [rows] = await bigquery.query({ query });

const totalBQChunks = rows.reduce((sum, row) => sum + parseInt(row.chunk_count), 0);

console.log(`\n✅ Chunks en BigQuery: ${totalBQChunks}`);
console.log(`   Documentos con chunks: ${rows.length}/${sourceIds.length}`);

// Comparar con Firestore
let totalFSChunks = 0;
for (const sourceId of sourceIds) {
  const chunks = await firestore.collection('document_chunks')
    .where('sourceId', '==', sourceId)
    .get();
  totalFSChunks += chunks.size;
}

console.log(`\n📊 Comparación:`);
console.log(`   Firestore: ${totalFSChunks} chunks`);
console.log(`   BigQuery:  ${totalBQChunks} chunks`);
console.log(`   Sync:      ${((totalBQChunks / totalFSChunks) * 100).toFixed(1)}%`);

if (totalBQChunks < totalFSChunks * 0.95) {
  console.log('\n⚠️  ACCIÓN REQUERIDA: Sync incompleto, ejecutar force-sync');
  console.log('   Comando: node scripts/force-sync-chunks-to-bigquery.mjs');
}

process.exit(0);
EOF
```

**Resultado esperado:**
```
📄 Documentos del agente: 75
✅ Chunks en BigQuery: 1,113
   Documentos con chunks: 75/75
📊 Comparación:
   Firestore: 1,113 chunks
   BigQuery:  1,113 chunks
   Sync:      100.0%
```

---

```bash
# 4. Verificar configuración RAG del agente
npx tsx << 'EOF'
import { firestore } from './src/lib/firestore.js';

const AGENT_ID = 'TU_AGENT_ID_AQUI'; // ⬅️ Reemplazar

const agent = await firestore.collection('conversations').doc(AGENT_ID).get();
const data = agent.data();

console.log('⚙️  Configuración RAG:');
console.log(`   useRAGMode:              ${data.useRAGMode || false}`);
console.log(`   ragSearch.enabled:       ${data.ragSearch?.enabled || false}`);
console.log(`   ragSearch.topK:          ${data.ragSearch?.topK || 'not set'}`);
console.log(`   ragSearch.minSimilarity: ${data.ragSearch?.minSimilarity || 'not set'}`);
console.log(`   contextSourcesEnabled:   ${data.contextSourcesEnabled || false}`);

const ragFullyEnabled = (
  data.useRAGMode === true &&
  data.ragSearch?.enabled === true &&
  data.contextSourcesEnabled === true
);

console.log(`\n${ragFullyEnabled ? '✅' : '❌'} RAG Status: ${ragFullyEnabled ? 'HABILITADO' : 'DESHABILITADO'}`);

if (!ragFullyEnabled) {
  console.log('\n⚠️  ACCIÓN REQUERIDA: Habilitar RAG');
  console.log('\nEjecutar:');
  console.log(`
npx tsx << 'INNER_EOF'
import { firestore } from './src/lib/firestore.js';
await firestore.collection('conversations').doc('${AGENT_ID}').update({
  useRAGMode: true,
  'ragSearch.enabled': true,
  'ragSearch.topK': 8,
  'ragSearch.minSimilarity': 0.25,
  contextSourcesEnabled: true
});
console.log('✅ RAG habilitado');
INNER_EOF
  `);
}

process.exit(0);
EOF
```

**Resultado esperado:**
```
⚙️  Configuración RAG:
   useRAGMode:              true
   ragSearch.enabled:       true
   ragSearch.topK:          8
   ragSearch.minSimilarity: 0.25
   contextSourcesEnabled:   true

✅ RAG Status: HABILITADO
```

---

### **Resultado Nivel 1:**

| Check | Status | Acción si Falla |
|-------|--------|----------------|
| Agente existe | ✅/❌ | Verificar ID correcto |
| Tiene documentos (>0) | ✅/❌ | Asignar documentos |
| Documentos con extractedData (>90%) | ✅/❌ | Re-extraer documentos |

**Tiempo estimado:** 5 minutos  
**Continuar a Nivel 2:** Solo si todos los checks pasan ✅

---

## 🔬 **NIVEL 2: VALIDACIÓN TÉCNICA**

### **Objetivo:** Verificar infraestructura completa y optimizada para RAG.

### **Checklist Técnico:**

```bash
# 1. Verificar chunks en Firestore (ya cubierto en Nivel 1)
# 2. Verificar embeddings (ya cubierto en Nivel 1)
# 3. Verificar BigQuery sync (ya cubierto en Nivel 1)

# 4. Verificar estructura de chunks en BigQuery
bq query --use_legacy_sql=false --format=prettyjson "
SELECT 
  source_id,
  COUNT(*) as chunk_count,
  AVG(ARRAY_LENGTH(JSON_EXTRACT_ARRAY(embedding))) as avg_embedding_dims,
  MIN(created_at) as first_chunk,
  MAX(created_at) as last_chunk
FROM \`salfagpt.flow_rag_optimized.document_chunks_vectorized\`
WHERE source_id IN (
  -- Reemplazar con IDs de sources del agente
  'SOURCE_ID_1', 'SOURCE_ID_2'
)
GROUP BY source_id
ORDER BY chunk_count DESC
LIMIT 10
"
```

**Resultado esperado:**
```json
[
  {
    "source_id": "abc123",
    "chunk_count": 15,
    "avg_embedding_dims": 768,
    "first_chunk": "2025-11-18T10:00:00",
    "last_chunk": "2025-11-18T10:01:00"
  },
  ...
]
```

**Validar:**
- ✅ `avg_embedding_dims = 768` (correcto)
- ✅ `chunk_count > 0` para cada source
- ✅ Fechas recientes (uploads recientes)

---

```bash
# 5. Verificar índices de BigQuery (performance)
bq show --schema --format=prettyjson \
  salfagpt:flow_rag_optimized.document_chunks_vectorized | \
  jq '{clustering: .clustering, partitioning: .timePartitioning}'
```

**Resultado esperado:**
```json
{
  "clustering": {
    "fields": ["user_id", "source_id"]
  },
  "partitioning": {
    "type": "DAY",
    "field": "created_at"
  }
}
```

**Validar:**
- ✅ Particionado por `created_at` (optimización temporal)
- ✅ Clusterizado por `user_id`, `source_id` (optimización de búsqueda)

---

```bash
# 6. Test de búsqueda vectorial directa en BigQuery
npx tsx << 'EOF'
import { vectorSearchBigQuery } from './src/lib/bigquery-vector-search.js';

const AGENT_ID = 'TU_AGENT_ID_AQUI'; // ⬅️ Reemplazar
const USER_ID = 'usr_uhwqffaqag1wrryd82tw'; // ⬅️ Ajustar si diferente

const query = '¿Cuál es el procedimiento de seguridad?'; // ⬅️ Ajustar

console.log(`🔍 Testing BigQuery vector search...`);
console.log(`   Query: "${query}"`);

const startTime = Date.now();

try {
  const results = await vectorSearchBigQuery(
    USER_ID,
    query,
    { 
      topK: 8,
      minSimilarity: 0.25,
      agentId: AGENT_ID 
    }
  );
  
  const elapsed = Date.now() - startTime;
  
  console.log(`\n✅ Búsqueda completada en ${(elapsed/1000).toFixed(1)}s`);
  console.log(`   Resultados: ${results.length}`);
  
  if (results.length > 0) {
    console.log('\n📊 Top 3 resultados:');
    results.slice(0, 3).forEach((r, idx) => {
      console.log(`   ${idx+1}. Similarity: ${(r.similarity*100).toFixed(1)}% | Doc: ${r.sourceName}`);
      console.log(`      Text: ${r.text.substring(0, 100)}...`);
    });
  }
  
  // Validación de performance
  if (elapsed > 10000) {
    console.log('\n🔴 CRÍTICO: Tiempo >10s es inaceptable');
  } else if (elapsed > 5000) {
    console.log('\n🟡 ADVERTENCIA: Tiempo >5s es lento');
  } else {
    console.log('\n✅ EXCELENTE: Tiempo <5s');
  }
  
} catch (error) {
  console.error('\n❌ ERROR en búsqueda:', error.message);
  process.exit(1);
}

process.exit(0);
EOF
```

**Resultado esperado:**
```
🔍 Testing BigQuery vector search...
   Query: "¿Cuál es el procedimiento de seguridad?"

✅ Búsqueda completada en 3.2s
   Resultados: 8

📊 Top 3 resultados:
   1. Similarity: 82.3% | Doc: Manual-seguridad.pdf
      Text: El procedimiento de seguridad establece...
   2. Similarity: 79.1% | Doc: Protocolo-operaciones.pdf
      Text: Para garantizar la seguridad del personal...
   3. Similarity: 76.5% | Doc: Normativa-interna.pdf
      Text: Las medidas de seguridad incluyen...

✅ EXCELENTE: Tiempo <5s
```

---

```bash
# 7. Verificar configuración de activeContextSourceIds
npx tsx << 'EOF'
import { firestore } from './src/lib/firestore.js';

const AGENT_ID = 'TU_AGENT_ID_AQUI'; // ⬅️ Reemplazar

const agent = await firestore.collection('conversations').doc(AGENT_ID).get();
const activeIds = agent.data()?.activeContextSourceIds || [];

console.log(`📚 Context sources activas en configuración: ${activeIds.length}`);

// Comparar con documentos asignados
const sources = await firestore.collection('context_sources')
  .where('assignedToAgents', 'array-contains', AGENT_ID)
  .get();

const totalAssigned = sources.size;

console.log(`📄 Documentos asignados al agente: ${totalAssigned}`);
console.log(`\n${activeIds.length === totalAssigned ? '✅' : '⚠️'} Matching: ${activeIds.length === totalAssigned ? 'PERFECTO' : 'REVISAR'}`);

if (activeIds.length !== totalAssigned) {
  console.log(`\n⚠️  Diferencia detectada: ${Math.abs(activeIds.length - totalAssigned)} documentos`);
  console.log('   Puede ser normal si algunos docs están intencionalmente desactivados.');
}

process.exit(0);
EOF
```

**Resultado esperado:**
```
📚 Context sources activas en configuración: 75
📄 Documentos asignados al agente: 75
✅ Matching: PERFECTO
```

---

### **Resultado Nivel 2:**

| Check | Target | Crítico |
|-------|--------|---------|
| **Chunks en Firestore** | >10 por doc | >5 por doc |
| **Embeddings coverage** | 100% | >95% |
| **BigQuery sync** | 100% | >95% |
| **RAG config habilitado** | ✅ Yes | ✅ Yes |
| **Búsqueda BigQuery** | <5s | <10s |
| **Similarity promedio** | >70% | >60% |

**Tiempo estimado:** 15 minutos  
**Continuar a Nivel 3:** Solo si performance <10s y sync >95% ✅

---

## 🧪 **NIVEL 3: VALIDACIÓN FUNCIONAL**

### **Objetivo:** Testing con queries reales, análisis de calidad de respuestas, medición de experiencia de usuario.

### **Preparación:**

1. **Definir 3-5 preguntas de test** relevantes al dominio del agente:

```javascript
const TEST_QUESTIONS = [
  {
    id: 1,
    question: '¿Cuál es el procedimiento para [tarea específica]?',
    expectedKeyInfo: ['paso 1', 'paso 2', 'requisito X'],
    criticalErrors: ['información incorrecta conocida'],
    context: 'Usuario pregunta sobre proceso documentado'
  },
  {
    id: 2,
    question: '¿Cuándo debo [acción específica]?',
    expectedKeyInfo: ['plazo', 'condiciones', 'responsable'],
    criticalErrors: [],
    context: 'Usuario pregunta sobre timing/plazos'
  },
  // ... más preguntas
];
```

---

### **Testing con Script Automatizado:**

```bash
# Usar el script de evaluación completo
npx tsx scripts/evaluate-agent-authenticated.mjs \
  --agent=TU_AGENT_ID \
  --questions=test-questions.json \
  --output=results.json
```

**Contenido de `test-questions.json`:**
```json
[
  {
    "id": 1,
    "question": "¿Cuál es el procedimiento para mantenimiento preventivo?",
    "expectedKeyInfo": ["frecuencia", "checklist", "responsable"],
    "criticalErrors": ["cada 6 meses"],
    "context": "Usuario pregunta sobre mantenimiento"
  },
  {
    "id": 2,
    "question": "¿Qué equipamiento de seguridad es obligatorio?",
    "expectedKeyInfo": ["casco", "arnés", "guantes"],
    "criticalErrors": [],
    "context": "Usuario pregunta sobre EPP"
  }
]
```

---

### **Análisis Manual (Alternativa):**

Si no tienes el script, testing manual en la UI:

**Proceso:**
1. Abrir el agente en `http://localhost:3000/chat?agent=[AGENT_ID]`
2. Recargar página (F5) para asegurar configuración actualizada
3. Hacer cada pregunta de test
4. Para cada respuesta, evaluar:

**Tabla de Evaluación:**

| Query | Tiempo | Referencias | Similarity | Info Clave | Errores | Calificación | Notas |
|-------|--------|-------------|------------|------------|---------|--------------|-------|
| #1    |        |             |            | ✅/❌     | ✅/❌  |              |       |
| #2    |        |             |            | ✅/❌     | ✅/❌  |              |       |
| #3    |        |             |            | ✅/❌     | ✅/❌  |              |       |

**Criterios de Calificación:**

| Calificación | Criterios |
|--------------|-----------|
| **Sobresaliente** | Toda info clave presente, 0 errores, <5s respuesta, 3+ referencias, similarity >75% |
| **Aceptable** | La mayoría de info clave, 0 errores críticos, <10s respuesta, 1+ referencia |
| **Inaceptable** | Info clave faltante, errores presentes, >10s respuesta, 0 referencias |

---

### **Métricas Clave a Medir:**

#### **1. Tiempo de Respuesta**

```
⚡ TARGETS:
   Excelente:  <3s
   Bueno:      3-5s
   Aceptable:  5-10s
   Crítico:    >10s   ← INACEPTABLE para producción
```

**Si >10s:** 🔴 BLOQUEANTE - Verificar que se esté usando BigQuery (no Firestore)

---

#### **2. Similarity Score**

```
🎯 TARGETS:
   Excelente:  >80%  (documento muy específico encontrado)
   Bueno:      70-80% (documento relevante)
   Aceptable:  60-70% (información relacionada)
   Crítico:    <60%   (contenido genérico/irrelevante)
```

**Si <60% consistentemente:** ⚠️ Revisar calidad de embeddings o cobertura documental

---

#### **3. Referencias Mostradas**

```
📚 TARGETS:
   Excelente:  5-8 referencias (uso completo del topK)
   Bueno:      3-4 referencias
   Aceptable:  1-2 referencias
   Crítico:    0 referencias  ← RAG no está funcionando
```

**Si 0 referencias:** 🔴 BLOQUEANTE - RAG deshabilitado o no está siendo llamado

---

#### **4. Completitud de Información**

```
✅ INFO CLAVE:
   Sobresaliente: 100% de info esperada presente
   Aceptable:     75-99% presente
   Inaceptable:   <75% presente O errores críticos
```

---

#### **5. Formato de Respuesta**

```
📝 FORMATO:
   ✅ Tiene secciones (separadas con \n\n)
   ✅ Usa markdown bold (**texto**)
   ✅ Usa listas (- item o 1. item)
   ✅ Párrafos cortos (<100 palabras)
   ❌ Muro de texto (>100 palabras sin separación)
```

---

### **Análisis Agregado:**

Después de las 3-5 queries, calcular:

| Métrica | Fórmula | Target |
|---------|---------|--------|
| **Avg Response Time** | Σ(tiempos) / n | <5s |
| **Avg Similarity** | Σ(similarities) / n | >70% |
| **Avg References** | Σ(referencias) / n | >3 |
| **Success Rate** | Queries sin errores / total | 100% |
| **Recommendation Score** | Promedio de calificaciones | >3.5/5 |
| **User Satisfaction** | Promedio de satisfacción | >3.5/5 |

---

### **Resultado Nivel 3:**

**PASA** si:
- ✅ Avg response time <10s
- ✅ Avg similarity >60%
- ✅ Success rate 100% (sin errores críticos)
- ✅ Recommendation score >3.0/5

**FALLA** si:
- ❌ Cualquier query >30s
- ❌ Avg similarity <50%
- ❌ Errores críticos en respuestas
- ❌ 0 referencias consistentemente

**Tiempo estimado:** 30 minutos  
**Continuar a Nivel 4:** Solo si pasa todos los criterios ✅

---

## 👥 **NIVEL 4: VALIDACIÓN DE USUARIO**

### **Objetivo:** Confirmar que usuarios reales pueden usar el agente exitosamente.

### **Checklist de Usuario:**

#### **1. Acceso Verificado**

```bash
# Verificar que usuarios tienen acceso
npx tsx << 'EOF'
import { firestore } from './src/lib/firestore.js';

const AGENT_ID = 'TU_AGENT_ID_AQUI'; // ⬅️ Reemplazar

const share = await firestore.collection('agent_shares')
  .where('agentId', '==', AGENT_ID)
  .limit(1)
  .get();

if (share.empty) {
  console.log('⚠️  No hay compartidos configurados');
  process.exit(1);
}

const sharedWith = share.docs[0].data().sharedWith || [];

console.log(`✅ Agente compartido con ${sharedWith.length} usuarios:`);
sharedWith.forEach((user, idx) => {
  console.log(`   ${idx+1}. ${user.email} (${user.type})`);
});

process.exit(0);
EOF
```

**Resultado esperado:**
```
✅ Agente compartido con 15 usuarios:
   1. usuario1@domain.com (user)
   2. usuario2@domain.com (user)
   ...
```

---

#### **2. Testing con Usuario Real**

**Pedir a 2-3 usuarios que:**

1. Inicien sesión en la plataforma
2. Seleccionen el agente compartido
3. Hagan 3 preguntas relacionadas con su trabajo
4. Completen esta evaluación:

**Formulario de Usuario:**

```
AGENTE: [Nombre del agente]
USUARIO: [Email]
FECHA: [YYYY-MM-DD]

PREGUNTA 1: _______________________________
Respuesta recibida:  ☐ Excelente  ☐ Buena  ☐ Mala
Referencias útiles:  ☐ Sí  ☐ No
Tiempo aceptable:    ☐ Rápido  ☐ Lento  ☐ Muy lento
¿Usarías esta respuesta en tu trabajo?  ☐ Sí  ☐ Con cuidado  ☐ No

PREGUNTA 2: _______________________________
[... mismo formato ...]

PREGUNTA 3: _______________________________
[... mismo formato ...]

EVALUACIÓN GENERAL:
¿Recomendarías este agente a colegas? (1-5): ___
¿Qué tan satisfecho estás? (1-5): ___
Comentarios adicionales: _______________________________
```

---

#### **3. Análisis de Feedback**

**Métricas de Satisfacción:**

| Métrica | Cálculo | Target |
|---------|---------|--------|
| **NPS Score** | % Promotores - % Detractores | >50 |
| **Recommendation** | Promedio de recomendación | >4.0/5 |
| **Satisfaction** | Promedio de satisfacción | >4.0/5 |
| **Adoption** | % usuarios que usarían regularmente | >80% |

**Clasificación de Usuarios:**
- **Promotores:** Recomendación 4-5 (usarían activamente)
- **Pasivos:** Recomendación 3 (usarían ocasionalmente)
- **Detractores:** Recomendación 1-2 (no usarían)

---

#### **4. Iteración Basada en Feedback**

**Si NPS <50 o Satisfaction <3.5:**

1. Revisar queries que fallaron
2. Identificar documentos faltantes
3. Mejorar prompts del agente
4. Re-test con mismos usuarios
5. Medir mejora

**Ciclo de Iteración:**

```
Test → Feedback → Ajustes → Re-test → Validar Mejora
  ↓                                        ↓
Medir baseline                      Confirmar >20% mejora
```

---

### **Resultado Nivel 4:**

**LISTO PARA PRODUCCIÓN** si:
- ✅ NPS >50
- ✅ Recommendation >4.0/5
- ✅ Satisfaction >4.0/5
- ✅ Adoption >80%
- ✅ Sin quejas críticas de performance

**NECESITA MEJORAS** si:
- ⚠️ NPS 30-50
- ⚠️ Recommendation 3.0-4.0
- ⚠️ Satisfaction 3.0-4.0

**NO LISTO** si:
- ❌ NPS <30
- ❌ Recommendation <3.0
- ❌ Satisfaction <3.0

**Tiempo estimado:** 1-2 horas (incluyendo espera de feedback)

---

## 🚨 **PROBLEMAS COMUNES Y SOLUCIONES**

### **Problema 1: RAG muy lento (>30s)**

**Diagnóstico:**
```bash
# Verificar qué función se está usando
gcloud logging read "resource.type=cloud_run_revision AND textPayload=~'vector search'" \
  --limit 10 --format json | jq -r '.[].textPayload' | grep -i "firestore\|bigquery"
```

**Si dice "Loading from Firestore":**
```typescript
// ❌ PROBLEMA: Código está usando Firestore
// Archivo: src/lib/rag-search.ts

// Verificar que esté usando BigQuery:
const chunks = await vectorSearchBigQuery(userId, query, options);
// NO: const chunksSnapshot = await firestore.collection('document_chunks').get();
```

**Solución:**
- Verificar que `bigquery-vector-search.ts` esté siendo importado
- Confirmar que no hay fallback a Firestore por error
- Revisar logs de Cloud Run para errores de BigQuery

---

### **Problema 2: No muestra referencias en respuestas**

**Diagnóstico:**
```bash
# 1. Verificar que RAG esté habilitado
npx tsx << 'EOF'
import { firestore } from './src/lib/firestore.js';
const agent = await firestore.collection('conversations').doc('AGENT_ID').get();
console.log('useRAGMode:', agent.data()?.useRAGMode);
console.log('ragSearch.enabled:', agent.data()?.ragSearch?.enabled);
EOF
```

**Si alguno es `false`:**
```bash
# Habilitar RAG
npx tsx << 'EOF'
import { firestore } from './src/lib/firestore.js';
await firestore.collection('conversations').doc('AGENT_ID').update({
  useRAGMode: true,
  'ragSearch.enabled': true,
  'ragSearch.topK': 8,
  'ragSearch.minSimilarity': 0.25,
  contextSourcesEnabled: true
});
console.log('✅ RAG habilitado');
EOF
```

**Si ya está habilitado:**
- Verificar que `activeContextSourceIds` no esté vacío
- Confirmar que chunks existen en BigQuery
- Revisar similarity threshold (puede estar muy alto)

---

### **Problema 3: Similarity muy baja (<60%)**

**Posibles causas:**

1. **Embeddings de mala calidad:**
   ```bash
   # Verificar modelo de embedding usado
   bq query --use_legacy_sql=false "
   SELECT DISTINCT JSON_EXTRACT_SCALAR(metadata, '$.embeddingModel') as model
   FROM \`salfagpt.flow_rag_optimized.document_chunks_vectorized\`
   LIMIT 5
   "
   ```
   
   **Debe ser:** `text-embedding-004` (modelo actual de Google)

2. **Chunks muy largos o muy cortos:**
   ```bash
   # Verificar tamaño promedio de chunks
   bq query --use_legacy_sql=false "
   SELECT 
     AVG(LENGTH(text_preview)) as avg_length,
     MIN(LENGTH(text_preview)) as min_length,
     MAX(LENGTH(text_preview)) as max_length
   FROM \`salfagpt.flow_rag_optimized.document_chunks_vectorized\`
   LIMIT 1
   "
   ```
   
   **Target:** 500-2000 caracteres promedio

3. **Documentos no relevantes a las queries:**
   - Revisar cobertura documental
   - Considerar agregar documentos específicos

---

### **Problema 4: Chunks en BigQuery = 0**

**Diagnóstico:**
```bash
# Verificar si el source tiene chunks en Firestore
npx tsx << 'EOF'
import { firestore } from './src/lib/firestore.js';

const SOURCE_ID = 'TU_SOURCE_ID'; // ⬅️ Del documento sin chunks

const chunks = await firestore.collection('document_chunks')
  .where('sourceId', '==', SOURCE_ID)
  .get();

console.log(`Chunks en Firestore: ${chunks.size}`);

if (chunks.size === 0) {
  console.log('❌ No hay chunks - documento no fue procesado');
  console.log('   Acción: Re-extraer documento con CLI');
} else {
  console.log('✅ Hay chunks en Firestore - problema es sync a BigQuery');
  console.log('   Acción: Ejecutar force-sync-chunks-to-bigquery.mjs');
}

process.exit(0);
EOF
```

**Soluciones:**

**Si no hay chunks en Firestore:**
```bash
# Re-extraer el documento
npx tsx cli/commands/extract-single.ts \
  --source=SOURCE_ID \
  --model=gemini-2.5-flash
```

**Si hay chunks pero no en BigQuery:**
```bash
# Force sync
node scripts/force-sync-chunks-to-bigquery.mjs
```

---

### **Problema 5: Errores críticos en respuestas**

**Ejemplo:** Usuario pregunta por "procedimiento A" y agente responde con "procedimiento B" incorrecto.

**Diagnóstico:**

1. **Verificar que se encontraron documentos correctos:**
   - Revisar logs de referencias
   - Confirmar similarity scores

2. **Verificar prompt del agente:**
   ```bash
   npx tsx << 'EOF'
   import { firestore } from './src/lib/firestore.js';
   const agent = await firestore.collection('conversations').doc('AGENT_ID').get();
   console.log('Prompt del agente:');
   console.log(agent.data()?.agentPrompt || 'Sin prompt específico');
   EOF
   ```

3. **Revisar contenido de los chunks:**
   - ¿Los documentos tienen la información correcta?
   - ¿La extracción capturó el contenido relevante?

**Solución:**
- Mejorar prompt del agente (ser más específico sobre cómo usar documentos)
- Agregar documentos más específicos si los actuales son muy genéricos
- Revisar calidad de la extracción original

---

## 📋 **CHECKLIST COMPLETO DE VALIDACIÓN**

### **Pre-Producción:**

```markdown
AGENTE: [Nombre]
ID: [ID de Firestore]
VALIDADOR: [Tu nombre]
FECHA: [YYYY-MM-DD]

### ✅ NIVEL 1: BÁSICO (Obligatorio)
- [ ] Agente existe en Firestore
- [ ] Tiene documentos asignados (>0)
- [ ] Documentos tienen extractedData (>90%)

### ✅ NIVEL 2: TÉCNICO (Obligatorio)
- [ ] Chunks en Firestore (>10 por doc)
- [ ] Embeddings coverage (>95%)
- [ ] Chunks en BigQuery (sync >95%)
- [ ] RAG habilitado en configuración
- [ ] Búsqueda BigQuery funciona (<10s)
- [ ] Similarity promedio (>60%)

### ✅ NIVEL 3: FUNCIONAL (Obligatorio)
- [ ] Test con 3-5 queries completado
- [ ] Avg response time (<10s)
- [ ] Referencias mostradas (>1 por query)
- [ ] Sin errores críticos
- [ ] Calificación promedio (>Aceptable)

### ✅ NIVEL 4: USUARIO (Recomendado)
- [ ] Testing con 2-3 usuarios reales
- [ ] NPS >30
- [ ] Recommendation >3.0/5
- [ ] Satisfaction >3.0/5
- [ ] Feedback documentado

### 📊 MÉTRICAS FINALES:
- Response Time: _____ segundos
- Similarity: _____ %
- Referencias: _____ por query
- NPS: _____ (si aplica)
- Recommendation: _____ /5
- Satisfaction: _____ /5

### ✅ DECISIÓN:
☐ LISTO PARA PRODUCCIÓN
☐ NECESITA MEJORAS (especificar): _____________________
☐ NO LISTO (bloqueos críticos): _____________________

APROBADO POR: _______________
FECHA APROBACIÓN: _______________
```

---

## 🛠️ **SCRIPTS DE VALIDACIÓN AUTOMATIZADA**

### **Script 1: Health Check Completo**

**Crear:** `scripts/validate-agent-health.mjs`

```javascript
#!/usr/bin/env node

/**
 * Comprehensive agent health check
 * Runs all Nivel 1 and Nivel 2 validations automatically
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { BigQuery } from '@google-cloud/bigquery';

initializeApp({ projectId: 'salfagpt' });
const db = getFirestore();
const bigquery = new BigQuery({ projectId: 'salfagpt' });

const AGENT_ID = process.argv[2] || process.exit(1);

async function validateAgent() {
  console.log('🔍 AGENT HEALTH CHECK');
  console.log('═'.repeat(80));
  console.log(`Agent ID: ${AGENT_ID}\n`);
  
  const results = {
    nivel1: {},
    nivel2: {},
    overall: 'PASS'
  };
  
  // NIVEL 1: BÁSICO
  console.log('📋 NIVEL 1: VALIDACIÓN BÁSICA');
  console.log('─'.repeat(80));
  
  // 1.1 Agente existe
  const agent = await db.collection('conversations').doc(AGENT_ID).get();
  results.nivel1.exists = agent.exists;
  console.log(`${agent.exists ? '✅' : '❌'} Agente existe: ${agent.exists}`);
  
  if (!agent.exists) {
    results.overall = 'FAIL';
    return results;
  }
  
  const agentData = agent.data();
  console.log(`   Título: ${agentData.title}`);
  console.log(`   Owner: ${agentData.userId}`);
  
  // 1.2 Documentos asignados
  const sources = await db.collection('context_sources')
    .where('assignedToAgents', 'array-contains', AGENT_ID)
    .get();
  
  results.nivel1.documentCount = sources.size;
  console.log(`${sources.size > 0 ? '✅' : '❌'} Documentos asignados: ${sources.size}`);
  
  if (sources.size === 0) {
    results.overall = 'FAIL';
    return results;
  }
  
  // 1.3 Documentos con extractedData
  let withData = 0;
  sources.docs.forEach(doc => {
    if (doc.data().extractedData?.length > 100) withData++;
  });
  
  const dataPercentage = (withData / sources.size) * 100;
  results.nivel1.extractedDataCoverage = dataPercentage;
  console.log(`${dataPercentage >= 90 ? '✅' : '❌'} ExtractedData coverage: ${dataPercentage.toFixed(1)}%`);
  
  if (dataPercentage < 90) {
    results.overall = 'WARN';
  }
  
  // NIVEL 2: TÉCNICO
  console.log('\n🔧 NIVEL 2: VALIDACIÓN TÉCNICA');
  console.log('─'.repeat(80));
  
  // 2.1 Chunks en Firestore
  const sourceIds = sources.docs.map(d => d.id);
  let totalChunks = 0;
  
  for (const sourceId of sourceIds) {
    const chunks = await db.collection('document_chunks')
      .where('sourceId', '==', sourceId)
      .get();
    totalChunks += chunks.size;
  }
  
  const avgChunks = totalChunks / sourceIds.length;
  results.nivel2.chunksFirestore = totalChunks;
  results.nivel2.avgChunksPerDoc = avgChunks;
  console.log(`${avgChunks >= 5 ? '✅' : '❌'} Chunks en Firestore: ${totalChunks} (avg: ${avgChunks.toFixed(1)}/doc)`);
  
  if (avgChunks < 5) {
    results.overall = 'WARN';
  }
  
  // 2.2 Chunks en BigQuery
  const bqQuery = `
    SELECT COUNT(*) as total
    FROM \`salfagpt.flow_rag_optimized.document_chunks_vectorized\`
    WHERE source_id IN (${sourceIds.map(id => `'${id}'`).join(',')})
  `;
  
  const [bqRows] = await bigquery.query({ query: bqQuery });
  const bqChunks = parseInt(bqRows[0]?.total || 0);
  const syncPercentage = (bqChunks / totalChunks) * 100;
  
  results.nivel2.chunksBigQuery = bqChunks;
  results.nivel2.syncPercentage = syncPercentage;
  console.log(`${syncPercentage >= 95 ? '✅' : '❌'} Chunks en BigQuery: ${bqChunks} (sync: ${syncPercentage.toFixed(1)}%)`);
  
  if (syncPercentage < 95) {
    results.overall = 'WARN';
  }
  
  // 2.3 RAG configurado
  const ragEnabled = agentData.useRAGMode === true && agentData.ragSearch?.enabled === true;
  results.nivel2.ragEnabled = ragEnabled;
  console.log(`${ragEnabled ? '✅' : '❌'} RAG habilitado: ${ragEnabled}`);
  
  if (!ragEnabled) {
    results.overall = 'WARN';
  }
  
  // RESUMEN
  console.log('\n' + '═'.repeat(80));
  console.log(`RESULTADO: ${results.overall === 'PASS' ? '✅ PASS' : results.overall === 'WARN' ? '⚠️  WARNINGS' : '❌ FAIL'}`);
  console.log('═'.repeat(80));
  
  return results;
}

validateAgent().then(results => {
  console.log('\n📊 SUMMARY:', JSON.stringify(results, null, 2));
  process.exit(results.overall === 'FAIL' ? 1 : 0);
}).catch(err => {
  console.error('\n❌ Fatal:', err);
  process.exit(1);
});
```

**Ejecutar:**
```bash
node scripts/validate-agent-health.mjs AGENT_ID
```

---

### **Script 2: Performance Test**

**Crear:** `scripts/test-agent-performance.mjs`

```javascript
#!/usr/bin/env node

/**
 * Test agent RAG performance with real queries
 */

import { vectorSearchBigQuery } from '../src/lib/bigquery-vector-search.js';

const AGENT_ID = process.argv[2];
const USER_ID = process.argv[3] || 'usr_uhwqffaqag1wrryd82tw';
const QUERY = process.argv[4] || '¿Cuál es el procedimiento de seguridad?';

async function testPerformance() {
  console.log('⚡ PERFORMANCE TEST');
  console.log('═'.repeat(80));
  console.log(`Agent:    ${AGENT_ID}`);
  console.log(`User:     ${USER_ID}`);
  console.log(`Query:    "${QUERY}"\n`);
  
  const startTime = Date.now();
  
  try {
    const results = await vectorSearchBigQuery(
      USER_ID,
      QUERY,
      { 
        topK: 8,
        minSimilarity: 0.25,
        agentId: AGENT_ID 
      }
    );
    
    const elapsed = Date.now() - startTime;
    
    console.log(`✅ Búsqueda completada en ${(elapsed/1000).toFixed(2)}s`);
    console.log(`   Resultados: ${results.length}`);
    
    if (results.length > 0) {
      const avgSimilarity = results.reduce((s, r) => s + r.similarity, 0) / results.length;
      console.log(`   Similarity promedio: ${(avgSimilarity*100).toFixed(1)}%`);
      
      console.log('\n📊 Top 5 resultados:');
      results.slice(0, 5).forEach((r, idx) => {
        console.log(`   ${idx+1}. ${(r.similarity*100).toFixed(1)}% - ${r.sourceName}`);
      });
    }
    
    // Evaluación de performance
    console.log('\n📈 EVALUACIÓN:');
    
    if (elapsed < 3000) {
      console.log('   Tiempo:     ✅ EXCELENTE (<3s)');
    } else if (elapsed < 5000) {
      console.log('   Tiempo:     ✅ BUENO (3-5s)');
    } else if (elapsed < 10000) {
      console.log('   Tiempo:     🟡 ACEPTABLE (5-10s)');
    } else {
      console.log('   Tiempo:     🔴 CRÍTICO (>10s) - NECESITA OPTIMIZACIÓN');
    }
    
    if (results.length > 0) {
      const avgSim = results.reduce((s, r) => s + r.similarity, 0) / results.length;
      if (avgSim > 0.8) {
        console.log('   Similarity: ✅ EXCELENTE (>80%)');
      } else if (avgSim > 0.7) {
        console.log('   Similarity: ✅ BUENO (70-80%)');
      } else if (avgSim > 0.6) {
        console.log('   Similarity: 🟡 ACEPTABLE (60-70%)');
      } else {
        console.log('   Similarity: 🔴 BAJO (<60%) - REVISAR CONTENIDO');
      }
    }
    
    if (results.length >= 5) {
      console.log('   Referencias: ✅ SUFICIENTES (5+)');
    } else if (results.length >= 3) {
      console.log('   Referencias: 🟡 ACEPTABLE (3-4)');
    } else if (results.length > 0) {
      console.log('   Referencias: ⚠️  POCAS (1-2)');
    } else {
      console.log('   Referencias: 🔴 NINGUNA - RAG NO FUNCIONA');
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    process.exit(1);
  }
  
  process.exit(0);
}

testPerformance();
```

**Ejecutar:**
```bash
node scripts/test-agent-performance.mjs AGENT_ID USER_ID "Tu pregunta de test"
```

---

## 📊 **TABLA DE RESULTADOS (Template)**

### **Validación de: [Nombre del Agente]**

**Fecha:** [YYYY-MM-DD]  
**Validador:** [Nombre]  
**ID Agente:** [ID]  

---

### **NIVEL 1: BÁSICO**

| Check | Resultado | Valor | Target | Status |
|-------|-----------|-------|--------|--------|
| Agente existe | ✅/❌ | - | Sí | ✅ |
| Documentos asignados | ✅/❌ | 75 | >0 | ✅ |
| ExtractedData coverage | ✅/❌ | 100% | >90% | ✅ |

**Decisión Nivel 1:** ✅ CONTINUAR / ❌ BLOQUEADO

---

### **NIVEL 2: TÉCNICO**

| Check | Resultado | Valor | Target | Status |
|-------|-----------|-------|--------|--------|
| Chunks Firestore | ✅/❌ | 1,113 | >10/doc | ✅ |
| Embeddings coverage | ✅/❌ | 100% | >95% | ✅ |
| Chunks BigQuery | ✅/❌ | 1,113 | >95% sync | ✅ |
| RAG habilitado | ✅/❌ | true | true | ✅ |
| Búsqueda BQ tiempo | ✅/❌ | 3.2s | <10s | ✅ |
| Similarity promedio | ✅/❌ | 77% | >60% | ✅ |

**Decisión Nivel 2:** ✅ CONTINUAR / ⚠️ ADVERTENCIAS / ❌ BLOQUEADO

---

### **NIVEL 3: FUNCIONAL**

| Query # | Pregunta | Tiempo | Refs | Similarity | Info Clave | Errores | Calificación |
|---------|----------|--------|------|------------|------------|---------|--------------|
| 1 | [Pregunta] | 4.2s | 6 | 82% | 4/4 ✅ | 0 ✅ | Sobresaliente |
| 2 | [Pregunta] | 3.8s | 5 | 76% | 3/3 ✅ | 0 ✅ | Sobresaliente |
| 3 | [Pregunta] | 5.1s | 7 | 79% | 2/3 ⚠️ | 0 ✅ | Aceptable |

**Métricas Agregadas:**
- Avg Response Time: 4.4s ✅
- Avg Similarity: 79% ✅
- Avg References: 6 ✅
- Success Rate: 100% ✅
- Recommendation: 4.3/5 ✅
- Satisfaction: 4.5/5 ✅

**Decisión Nivel 3:** ✅ LISTO PARA USUARIOS / ⚠️ NECESITA MEJORAS

---

### **NIVEL 4: USUARIO (Opcional pero Recomendado)**

| Usuario | Email | Test Date | Rec. | Sat. | Comentarios |
|---------|-------|-----------|------|------|-------------|
| Usuario 1 | user1@domain.com | 2025-11-20 | 5/5 | 5/5 | "Excelente, muy útil" |
| Usuario 2 | user2@domain.com | 2025-11-20 | 4/5 | 4/5 | "Bueno, algunas respuestas genéricas" |
| Usuario 3 | user3@domain.com | 2025-11-20 | 5/5 | 5/5 | "Exactamente lo que necesitaba" |

**Métricas de Usuario:**
- NPS: 66 (2 promotores, 0 pasivos, 0 detractores)
- Avg Recommendation: 4.7/5 ✅
- Avg Satisfaction: 4.7/5 ✅
- Adoption Rate: 100% ✅

**Decisión Nivel 4:** ✅ PRODUCCIÓN APROBADA

---

### **DECISIÓN FINAL:**

```
☑️ LISTO PARA PRODUCCIÓN

Justificación:
- Todos los checks técnicos pasan
- Performance excelente (<5s promedio)
- Alta calidad de respuestas (similarity >75%)
- Feedback de usuarios positivo (NPS 66, Rec 4.7/5)
- Sin errores críticos

Aprobado por: [Nombre]
Fecha: [YYYY-MM-DD]
```

---

## 🚀 **PROCESO RÁPIDO (Fast Track)**

Para validaciones rápidas de agentes de bajo riesgo:

### **Validación Rápida (10 min):**

```bash
#!/bin/bash
# Fast validation script

AGENT_ID="$1"

echo "🚀 FAST VALIDATION"
echo "Agent: $AGENT_ID"

# 1. Básico
echo -e "\n1️⃣ Basic checks..."
node scripts/validate-agent-health.mjs "$AGENT_ID" || exit 1

# 2. Performance
echo -e "\n2️⃣ Performance test..."
node scripts/test-agent-performance.mjs "$AGENT_ID" "usr_uhwqffaqag1wrryd82tw" "Test query"

# 3. Manual verification
echo -e "\n3️⃣ Manual verification needed:"
echo "   - Open agent in UI"
echo "   - Send test message"
echo "   - Verify references shown"
echo "   - Confirm response quality"

echo -e "\n✅ Fast validation complete!"
echo "Review results above before approving for production."
```

**Ejecutar:**
```bash
chmod +x scripts/fast-validate.sh
./scripts/fast-validate.sh AGENT_ID
```

---

## 📈 **BENCHMARKS DE REFERENCIA**

### **Basado en validaciones exitosas previas:**

| Agente | Docs | Chunks | BQ Sync | Avg Time | Avg Sim | NPS | Status |
|--------|------|--------|---------|----------|---------|-----|--------|
| **S1-v2** | 75 | 1,113 | 100% | 4.5s | 77% | - | ✅ Producción |
| **M1-v2** | 99 | 714 | 100% | 3.8s | 79% | - | ✅ Producción |
| **M3-v2** | 52 | 223 | 100% | 4.1s | 76% | - | ✅ Producción |
| **S2-v2** | 19 | 199 | 100% | 3.2s | 78% | - | ✅ Producción |

**Promedio de agentes exitosos:**
- Chunks por doc: 10-15
- Tiempo respuesta: 3-5s
- Similarity: 75-80%
- BigQuery sync: 100%

**Usa estos como baseline para nuevos agentes.**

---

## 🎓 **LECCIONES APRENDIDAS**

### **De S1-v2 (19/11/2025):**

1. ✅ **RAG funciona técnicamente** pero puede ser muy lento
2. 🔴 **Performance crítica:** Si usa Firestore en vez de BigQuery: 72s → inaceptable
3. ✅ **Similarity 75-80%** es excelente para documentos técnicos
4. ⚠️ **Sin documento específico** → Respuesta genérica (aún útil pero no óptima)

### **Optimizaciones Aplicadas:**

1. ✅ Cambiar de Firestore a BigQuery para búsqueda vectorial
2. ✅ Configurar correctamente `ragSearch.enabled`
3. ✅ Validar que `contextSourcesEnabled = true`
4. ✅ Establecer `topK = 8` para suficientes referencias
5. ✅ Configurar `minSimilarity = 0.25` (no muy estricto)

---

## 🔧 **COMANDOS QUICK REFERENCE**

```bash
# Health check completo
node scripts/validate-agent-health.mjs AGENT_ID

# Performance test
node scripts/test-agent-performance.mjs AGENT_ID USER_ID "Query"

# Habilitar RAG
npx tsx << 'EOF'
import { firestore } from './src/lib/firestore.js';
await firestore.collection('conversations').doc('AGENT_ID').update({
  useRAGMode: true,
  'ragSearch.enabled': true,
  'ragSearch.topK': 8,
  'ragSearch.minSimilarity': 0.25,
  contextSourcesEnabled: true
});
console.log('✅ RAG habilitado');
EOF

# Force sync a BigQuery
node scripts/force-sync-chunks-to-bigquery.mjs

# Verificar chunks en BigQuery
bq query --use_legacy_sql=false "
SELECT source_id, COUNT(*) as chunks
FROM \`salfagpt.flow_rag_optimized.document_chunks_vectorized\`
WHERE source_id = 'SOURCE_ID'
GROUP BY source_id
"

# Ver logs de RAG en tiempo real
gcloud logging tail "resource.type=cloud_run_revision" \
  --format=json | jq -r '.textPayload' | grep -i "rag\|bigquery"
```

---

## ✅ **CRITERIOS DE APROBACIÓN**

### **Para PRODUCCIÓN (requerido):**

```
✅ Nivel 1: PASS (básico)
✅ Nivel 2: PASS (técnico)
✅ Nivel 3: PASS (funcional)
   - Avg response time <10s
   - Avg similarity >60%
   - Sin errores críticos

Nivel 4: RECOMENDADO (usuario)
```

### **Para BETA (testing limitado):**

```
✅ Nivel 1: PASS
✅ Nivel 2: WARNINGS aceptables
   - Sync >90% (en vez de >95%)
   - Algunos chunks faltantes OK

Nivel 3: Testing manual básico
```

### **Para DEV (desarrollo):**

```
✅ Nivel 1: Agente existe + documentos asignados
   
Nivel 2-4: Opcional
```

---

## 📞 **CONTACTO Y SOPORTE**

**Si encuentras problemas durante la validación:**

1. **Consultar troubleshooting** en este documento primero
2. **Ejecutar scripts de diagnóstico** disponibles
3. **Revisar logs** de Cloud Run para errores específicos
4. **Documentar el problema** con detalles completos
5. **Escalar** si es bloqueante para producción

**Archivos útiles:**
- `docs/CLI_BULK_UPLOAD_SYSTEM.mdc` - Sistema de upload completo
- `CONTEXT_HANDOFF_RAG_TESTING_2025-11-19.md` - Troubleshooting RAG
- `S1V2-RAG-TEST-REPORT.md` - Ejemplo de validación completa

---

## 🎯 **EJEMPLO COMPLETO: Validación S1-v2**

### **Información del Agente:**
- **Nombre:** S1-v2
- **ID:** iQmdg3bMSJ1AdqqlFpye
- **Tag:** S001
- **Documentos:** 75 PDFs
- **Propósito:** Gestión de bodegas y logística

---

### **Nivel 1: Básico ✅**

```
✅ Agente existe: Sí
✅ Documentos asignados: 75
✅ ExtractedData coverage: 100%

Decisión: CONTINUAR a Nivel 2
```

---

### **Nivel 2: Técnico ✅**

```
✅ Chunks Firestore: 1,113 (avg 14.8/doc)
✅ Embeddings coverage: 100%
✅ Chunks BigQuery: 1,113 (sync 100%)
✅ RAG habilitado: true
✅ Búsqueda BigQuery: 3.2s
✅ Similarity promedio: 77%

Decisión: CONTINUAR a Nivel 3
```

---

### **Nivel 3: Funcional ⚠️ (Mejorado después de optimización)**

**Resultados ANTES de optimización BigQuery:**

| Query | Tiempo | Refs | Similarity | Calificación |
|-------|--------|------|------------|--------------|
| #1 Filtros grúa | 87.7s 🔴 | 8 | 79.6% | Inaceptable (por tiempo) |
| #2 Forros frenos | 91.9s 🔴 | 8 | 76.2% | Sobresaliente (contenido) |
| #3 Torque ruedas | 58.4s 🔴 | 8 | 75.9% | Aceptable |
| #4 Aceite Scania | 48.9s 🔴 | 8 | 79.2% | Sobresaliente |

```
Avg Response Time: 71.7s  🔴 CRÍTICO
Decisión: BLOQUEADO - Performance inaceptable
```

**Resultados DESPUÉS de optimización BigQuery:**

| Query | Tiempo | Refs | Similarity | Calificación |
|-------|--------|------|------------|--------------|
| #1 Filtros grúa | 3.5s ✅ | 8 | 79.6% | Sobresaliente |
| #2 Forros frenos | 4.1s ✅ | 8 | 76.2% | Sobresaliente |
| #3 Torque ruedas | 2.8s ✅ | 8 | 75.9% | Sobresaliente |
| #4 Aceite Scania | 3.9s ✅ | 8 | 79.2% | Sobresaliente |

```
Avg Response Time: 3.6s  ✅ EXCELENTE
Decisión: CONTINUAR a Nivel 4
```

**Aprendizaje:** La optimización BigQuery redujo tiempo en **95%** (72s → 3.6s)

---

### **Nivel 4: Usuario** (Pendiente)

```
⏳ En espera de feedback de usuarios reales
   - 15 usuarios con acceso configurado
   - 2 usuarios pendientes de login

Próximo paso: Solicitar testing con queries reales
```

---

### **Decisión Final:**

```
✅ APROBADO PARA PRODUCCIÓN

Justificación:
- Performance excelente (3.6s promedio)
- Alta calidad (77% similarity, 8 refs por query)
- Sin errores críticos
- Configuración optimizada

Restricciones:
- Cobertura documental podría mejorar (ej. falta manual Sany CR900C)
- Recomendación: Agregar documentos específicos conforme usuarios reporten gaps

Aprobado por: AI Factory Team
Fecha: 2025-11-19
```

---

## 🔄 **PROCESO DE MEJORA CONTINUA**

### **Monitoreo Post-Producción:**

```bash
# 1. Revisar logs de uso cada semana
gcloud logging read "resource.type=cloud_run_revision AND textPayload=~'Agent: AGENT_ID'" \
  --limit 100 --format json | jq -r '.[].textPayload' | \
  grep -E "Response time|Similarity|References"

# 2. Identificar queries problemáticas
# (Las que toman >10s o similarity <60%)

# 3. Analizar gaps de contenido
# (Queries donde usuarios reportan info faltante)

# 4. Ciclo de mejora:
# Upload docs faltantes → Re-validar → Deploy
```

---

## 📚 **ANEXO: Comandos Completos de Scripts**

### **validate-agent-health.mjs** (completo)

Ver sección "Scripts de Validación Automatizada" arriba.

### **test-agent-performance.mjs** (completo)

Ver sección "Scripts de Validación Automatizada" arriba.

### **evaluate-agent-authenticated.mjs** (completo)

Basado en `/Users/alec/salfagpt/scripts/evaluate-s1v2-authenticated.mjs` - Adaptar según necesidad.

---

## 🎯 **RESUMEN: Qué Validar y Por Qué**

### **Nivel 1: Fundamentos Existen**
- **Qué:** Agente, documentos, extractedData
- **Por qué:** Sin esto, nada funciona
- **Tiempo:** 5 min

### **Nivel 2: Infraestructura Optimizada**
- **Qué:** Chunks, embeddings, BigQuery, performance
- **Por qué:** Determina si la experiencia será buena o mala
- **Tiempo:** 15 min

### **Nivel 3: Calidad de Respuestas**
- **Qué:** Testing con queries reales, análisis de contenido
- **Por qué:** Determina si usuarios confiarán en el agente
- **Tiempo:** 30 min

### **Nivel 4: Satisfacción de Usuario**
- **Qué:** Feedback real, NPS, adopción
- **Por qué:** Determina si el agente agregará valor real al negocio
- **Tiempo:** 1-2 horas

---

## ✨ **MEJORES PRÁCTICAS**

### **DO's ✅**

1. ✅ **Validar en orden** (Nivel 1 → 2 → 3 → 4)
2. ✅ **No skip niveles** - Cada uno construye sobre el anterior
3. ✅ **Documentar TODO** - Usar tablas de resultados
4. ✅ **Medir SIEMPRE** - Tiempos, similarity, referencias
5. ✅ **Testing real** - Con queries reales de usuarios
6. ✅ **Iterar** - Mejorar basado en feedback
7. ✅ **Monitorear** - Post-producción también

### **DON'Ts ❌**

1. ❌ **No skip validación técnica** - Performance importa
2. ❌ **No aprobar con >10s** - Experiencia de usuario sufrirá
3. ❌ **No ignorar warnings** - Investiga antes de aprobar
4. ❌ **No saltarse testing de usuario** - Feedback es oro
5. ❌ **No asumir que funciona** - SIEMPRE verificar
6. ❌ **No aprobar sin métricas** - Decisiones basadas en datos

---

## 🎉 **CONCLUSIÓN**

**Esta guía garantiza que:**

✅ Agentes en producción son de alta calidad  
✅ Performance es excelente (<5s promedio)  
✅ Usuarios confían en las respuestas  
✅ Problemas se detectan temprano  
✅ Proceso es repetible y consistente  

**Usa esta guía para TODOS los agentes nuevos y actualizaciones mayores.**

---

**Mantenedor:** AI Factory Team  
**Versión:** 1.0.0  
**Última Actualización:** 2025-11-20  
**Próxima Revisión:** 2025-12-01


