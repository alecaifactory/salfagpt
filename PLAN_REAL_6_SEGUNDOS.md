# 🎯 PLAN REAL: 6 Segundos + Respuestas Correctas

**Basado en análisis de 4 evaluaciones reales**

---

## 🔍 **DIAGNÓSTICO REAL:**

### Evaluaciones Analizadas

**4 casos evaluados - Todos con problemas:**

1. **Filtros grúa Sany CR900C**
   - Calificación: Inaceptable
   - Problema: "Probablemente no esté cargada las hojas de ruta"
   - Issue UI: "Se puso blanca la pantalla"

2. **Forros de frenos TCBY-56**
   - Calificación: Sobresaliente (pero falta info)
   - Problema: "Falta cargar manual de servicio"
   - Issue UI: "Se puso blanca la pantalla nuevamente"

3. **Torque ruedas TCBY-56**
   - Calificación: Aceptable
   - Problema: "Falta cargar manual de servicio"
   - Issue UI: "Nuevamente debo actualizar la página"

4. **Cambio aceite Scania P450**
   - Calificación: Inaceptable
   - Problema: Respuesta correcta EXISTE en docs pero no la encuentra
   - Issue UI: Normal

---

## 🚨 **PROBLEMAS REALES IDENTIFICADOS:**

### 1. **Documentos Faltantes** (Crítico)

**Manuales que necesitan cargarse:**
- ✅ Hojas de ruta de mantenimiento (grúas)
- ✅ Manuales de servicio específicos por modelo
- ✅ Tablas de torque por fabricante

**Acción:** Cargar estos docs ANTES de optimizar performance

---

### 2. **Pantalla Blanca / Crashes** (Crítico)

**Patrón:** "Se puso blanca la pantalla" (3 de 4 casos)

**Causas posibles:**
- Timeout del request (>30s)
- Error no manejado en UI
- Memory leak en React
- Respuesta muy larga que rompe UI

**Acción:** Fix error handling PRIMERO

---

### 3. **RAG No Encuentra Docs Correctos** (Alta)

**Caso 4:** La info sobre aceite Scania P450 DEBE estar en docs
- Evaluador dice que debería responder lo del fabricante
- Pero RAG no encuentra el doc correcto

**Acción:** Verificar quality de embeddings/search

---

## ✅ **10 PASOS REALES:**

### **PASO 1: Fix Pantalla Blanca (Crash/Timeout)** 🚨

**Problema:** UI se pone blanca → usuario debe refrescar

**Causa probable:**
- Request timeout (>60s sin respuesta)
- Error parsing SSE stream
- Memory overflow en React

**Fix:**
```typescript
// En ChatInterfaceWorking.tsx
// Agregar timeout handler y error boundary

const RESPONSE_TIMEOUT = 30000; // 30s max

const controller = new AbortController();
setTimeout(() => controller.abort(), RESPONSE_TIMEOUT);

fetch(streamingEndpoint, {
  signal: controller.signal,
  // ...
}).catch(error => {
  if (error.name === 'AbortError') {
    // Timeout - show user friendly message
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: 'La respuesta tardó demasiado. Por favor intenta de nuevo.',
      isError: true
    }]);
  }
  // Don't crash - handle gracefully
});
```

**Test:** Enviar pregunta, si tarda >30s debería mostrar error (no crash)

---

### **PASO 2: Verificar Qué Docs Están Cargados en S2-v2**

**Query Firestore:**
```bash
npx tsx -e "
import { firestore } from './src/lib/firestore.js';

const agentDoc = await firestore.collection('conversations').doc('1lgr33ywq5qed67sqCYi').get();
const sourceIds = agentDoc.data()?.activeContextSourceIds || [];

console.log('📊 S2-v2 tiene', sourceIds.length, 'sources activas');

// Get source names
const sources = await firestore.collection('context_sources')
  .where('__name__', 'in', sourceIds.slice(0, 10))
  .get();

sources.docs.forEach(doc => {
  const data = doc.data();
  console.log('  -', data.name);
});

process.exit(0);
" 2>/dev/null
```

**Buscar:**
- ¿Hay manual de servicio Sany?
- ¿Hay hojas de ruta de mantenimiento?
- ¿Hay especificaciones Scania P450?

**Si faltan:** Cargar ANTES de continuar con performance

---

### **PASO 3: Test Búsqueda de "Cambio Aceite Scania P450"**

**Esta pregunta DEBE tener respuesta** según evaluador.

**Test directo:**
```bash
export USE_EAST4_BIGQUERY=true
npx tsx -e "
import { searchByAgent } from './src/lib/bigquery-router.js';

const results = await searchByAgent(
  'usr_uhwqffaqag1wrryd82tw',
  '1lgr33ywq5qed67sqCYi',
  'Cada cuantas horas se debe cambiar el aceite hidraulico en un camion pluma SCANIA P450',
  { topK: 10, minSimilarity: 0.7, requestOrigin: 'http://localhost:3000' }
);

console.log('Resultados:', results.length);
results.forEach(r => {
  console.log(\`  [\${(r.similarity * 100).toFixed(1)}%] \${r.sourceName} - Chunk \${r.chunkIndex}\`);
  console.log(\`     \${r.text.substring(0, 150)}...\`);
});

process.exit(0);
" 2>/dev/null
```

**Esperado:** Debería encontrar manual Scania o HIAB con intervalo de aceite

**Si encuentra:** RAG funciona, problema es threshold  
**Si NO encuentra:** Falta cargar el documento

---

### **PASO 4: Medir Performance REAL del Endpoint Original**

**Con us-east4 flags ya configuradas:**

```
Browser → DevTools → Network tab
Filter: "messages-stream"
Send: "dime 3 preguntas que podría hacerte"
```

**Medir:**
- TTFB (Time to first byte): ¿?ms
- Content download: ¿?ms
- Total: ¿?ms

**Benchmark:**
- <8s = ✅ Suficientemente rápido
- 8-15s = ⚠️ Mejorable
- >15s = ❌ Hay bottleneck

---

### **PASO 5: Si Performance >8s - Profile Específico**

**React DevTools Profiler:**
```
1. Install React DevTools extension
2. Open Profiler tab
3. Record
4. Send message
5. Stop
6. Identify slowest component
```

**Server logs:**
```
tail -f logs | grep "ms)"
```

**Buscar:**
- ¿Embedding tardó >2s?
- ¿BigQuery tardó >3s?
- ¿Gemini tardó >5s?

**Atacar el MÁS lento primero**

---

### **PASO 6: Cargar Documentos Faltantes**

**Basado en evaluaciones:**

**Documentos críticos a cargar:**
1. Hojas de ruta mantenimiento (grúas Sany)
2. Manuales de servicio específicos por modelo
3. Tablas de torque completas
4. Intervalos de mantenimiento Scania

**Script para cargar:**
```bash
# Usar CLI para upload batch
npx tsx cli/upload-batch.ts \
  --agent=1lgr33ywq5qed67sqCYi \
  --folder=/path/to/manuales-servicio \
  --model=gemini-2.5-flash
```

**Verificar después:** Re-test mismas preguntas, deberían tener respuestas

---

### **PASO 7: Optimizar Threshold si es Necesario**

**Si docs están cargados pero RAG no los encuentra:**

```typescript
// En el endpoint, bajar threshold temporalmente para debugging
ragMinSimilarity: 0.5 // vs 0.7

// Verificar qué similarity tienen los chunks relevantes
// Si están en 0.5-0.7, es problema de threshold
// Si están <0.5, es problema de embeddings/indexing
```

---

### **PASO 8: Fix Error Handling (Pantalla Blanca)**

**Agregar error boundary global:**

```typescript
// En ChatInterfaceWorking.tsx
useEffect(() => {
  const handleError = (error: ErrorEvent) => {
    console.error('Global error:', error);
    // Don't let UI crash - show error message instead
    setMessages(prev => [...prev, {
      role: 'system',
      content: '❌ Ocurrió un error. La página se recargará automáticamente.',
      timestamp: new Date()
    }]);
    
    // Auto-reload after 3s
    setTimeout(() => window.location.reload(), 3000);
  };
  
  window.addEventListener('error', handleError);
  return () => window.removeEventListener('error', handleError);
}, []);
```

**Test:** Forzar error, verificar que no se ponga blanca

---

### **PASO 9: Medición Final End-to-End**

**Con TODO arreglado:**

**Test 1: Performance**
```
DevTools → Performance tab → Record
Send message
Stop
Total time: ¿?s
```

**Criterio:**
- ✅ <6s = Perfect
- ✅ 6-8s = Acceptable
- ⚠️ 8-10s = Mejorable
- ❌ >10s = Volver a diagnosticar

**Test 2: Calidad**
```
Preguntas de evaluación:
1. "Indicame que filtros debo utilizar para una mantencion de 2000 Hrs para una grua Sany CR900C"
2. "Camion tolva 10163090 TCBY-56 indica en el panel forros de frenos desgastados"
3. "Cuanto torque se le debe suminstrar a las ruedas del camion tolva 10163090 TCBY-56"
4. "Cada cuantas horas se debe cambiar el aceite hidraulico en un camion pluma SCANIA P450"
```

**Criterio:**
- ✅ Referencias >70% similitud
- ✅ Respuesta basada en docs correctos
- ✅ No crash/pantalla blanca
- ✅ Evaluador puede calificar "Sobresaliente"

---

### **PASO 10: Documentar Configuración Ganadora**

**Crear:** `CONFIGURACION_6S_PRODUCCION.md`

```markdown
# ✅ Configuración de 6 Segundos en Producción

## Environment Variables (.env)
USE_EAST4_BIGQUERY=true
USE_EAST4_STORAGE=true
PUBLIC_USE_OPTIMIZED_STREAMING=false (usar endpoint probado)

## Frontend Optimizations
- DEBUG = false (console logs disabled)
- CHUNK_SIZE_THRESHOLD = 500 (buffered streaming)
- MessageRenderer memoized

## Backend Configuration
- Dataset: flow_analytics_east4
- Location: us-east4
- IVF index: Active
- Embeddings: 768 dims normalized

## Documentos Críticos Cargados
- ✅ Hojas de ruta mantenimiento
- ✅ Manuales de servicio por modelo
- ✅ Tablas de torque
- ✅ Intervalos mantenimiento Scania

## Performance Achieved
- Embedding: ~1s
- BigQuery: ~2s
- Gemini: ~4s
- Frontend overhead: <1s
- TOTAL: <8s consistently

## Quality Achieved
- Referencias: >70% similitud
- Respuestas: Basadas en docs correctos
- Evaluaciones: Majority "Sobresaliente"
- Sin crashes: Error handling robusto
```

---

## 🎯 **PRIORIDADES CORRECTAS:**

### **Prioridad 1: Estabilidad** 🚨
```
❌ Pantalla blanca = Usuario frustrado
✅ Error handling robusto
✅ No crashes nunca
```

### **Prioridad 2: Calidad** 📚
```
❌ Respuestas incompletas = Evaluaciones malas
✅ Docs completos cargados
✅ RAG encuentra info correcta
```

### **Prioridad 3: Performance** ⚡
```
❌ 30s es inaceptable
✅ 6-8s es excelente
✅ <10s es aceptable
```

---

## 🔄 **ORDEN DE EJECUCIÓN CORRECTO:**

```
1. Fix pantalla blanca (PASO 1) → No crashes
2. Verificar docs cargados (PASO 2) → Saber qué falta
3. Cargar docs faltantes (PASO 6) → Contenido completo
4. Test búsqueda (PASO 3) → Verifica RAG funciona
5. Medir performance (PASO 4) → Baseline real
6. Solo SI >10s: Optimize (PASO 5-7)
7. Test calidad (PASO 9) → Evaluaciones mejoran
8. Document (PASO 10) → Para producción
```

---

## 🎯 **EMPEZAR AHORA:**

### **Acción Inmediata - Fix Pantalla Blanca:**

El error más crítico es que usuarios tienen que refrescar la página.

**Necesito ver el error handling actual para arreglarlo.**

**¿Quieres que:**
1. ✅ **Arregle la pantalla blanca primero** (error handling)
2. ✅ **Luego verifique qué docs faltan** (análisis de S2-v2)
3. ✅ **Luego mida performance real** (con docs completos)

**O prefieres:**
- ❌ Seguir intentando optimizar performance sin arreglar crashes?

---

**Mi recomendación:** Arreglar en orden:
1. Crashes (pantalla blanca) - 10 minutos
2. Contenido (docs faltantes) - identificar qué falta
3. Performance (si aún es lento) - optimizar targeted

**¿Procedo con el fix de pantalla blanca?** 🎯

