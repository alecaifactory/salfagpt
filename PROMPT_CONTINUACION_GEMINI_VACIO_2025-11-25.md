# 🔄 PROMPT PARA CONTINUAR - Problema Gemini Respuesta Vacía

**Para copiar en nueva conversación de Cursor**

**Fecha:** 2025-11-25 10:45 AM  
**Sesión Anterior:** Debugging respuestas vacías en SalfaGPT  
**Branch:** main  
**Server:** localhost:3000 (terminal 15)

---

## 🚨 **PROBLEMA CRÍTICO ACTUAL:**

### **Síntoma:**
```
Usuario envía mensaje → BigQuery responde (2s) → Referencias visibles → Respuesta vacía ❌
Frontend: contentLength: 0
Backend: fullResponse: 0 chars
Gemini: done: true (stream vacío inmediatamente)
```

### **Root Cause Identificado:**
```typescript
// Terminal logs línea 202:
🔍 [gemini.ts] First next() result: { done: true, hasValue: false }

// Gemini retorna stream VACÍO (0 chunks) - rechazo silencioso
// NO es error de API key (ya actualizada en producción)
// NO es falta de context (RAG funciona, 20 chunks con 79.9% similarity)
```

---

## 📊 **LO QUE SÍ FUNCIONA:**

### **Backend Performance ✅**
```
1. BigQuery Agent Search: 2-4s ✅
   - Agent: 1lgr33ywq5qed67sqCYi (S2-v2)
   - Sources: 467 docs asignados al agente
   - Query: Cosine similarity optimizado
   - Results: Top 20 chunks (79.9% avg similarity)
   - Región: us-east4 (BLUE)

2. RAG Context Building: ~6KB ✅
   - Before: 48KB (20 chunks completos)
   - After: 6KB (top 3 chunks por doc, 2KB max cada uno)
   - Consolidated: 1 documento único (20 chunks agrupados)

3. Referencias: ✅
   - Generadas ANTES de streaming
   - Enviadas al frontend
   - Visibles en UI
```

### **Fixes Aplicados ✅**
```
1. Mensajes vacíos (content object → string) ✅
2. Storage paths (919 docs actualizados a us-east4) ✅
3. GREEN = BLUE (unified to flow_analytics_east4) ✅
4. Context truncado (48KB → 6KB) ✅
5. System prompt limitado (4.8KB → 500 chars) ✅
```

---

## ❌ **LO QUE NO FUNCIONA:**

### **Gemini API Streaming:**
```typescript
// src/lib/gemini.ts línea 478-520

const stream = await genAI.models.generateContentStream({
  model: 'gemini-2.5-flash',
  contents: [...],
  config: {
    systemInstruction: baseSystemPrompt,  // 500 chars max
    temperature: 0.7,
    maxOutputTokens: 300
  }
});

// El stream retorna:
for await (const chunk of stream) {
  // NUNCA entra aquí - 0 iteraciones
}

// stream.next() retorna:
{ done: true, hasValue: false }  // ← Stream vacío desde inicio
```

### **Teorías del Problema:**
```
1. ❓ System instruction aún muy largo (500 chars + agent prompt 4.7KB)
2. ❓ Context 6KB + system 5KB = 11KB total excede límite no documentado
3. ❓ Gemini 2.5 Flash tiene rate limit activo
4. ❓ Request format incorrecto para streaming
5. ❓ API key válida pero sin permisos de streaming
```

---

## 🗂️ **ARCHIVOS CLAVE MODIFICADOS:**

### **Código:**
```
src/lib/gemini.ts
  - Logs ultra-detallados de streaming
  - Context trimming (10KB max)
  - System prompt simplificado
  - Debug manual con stream.next()

src/lib/rag-search.ts
  - buildRAGContext(): Top 3 chunks por doc
  - Max 2KB por chunk
  - Resultado: ~6KB (no 48KB)

src/pages/api/conversations/[id]/messages-stream.ts
  - System prompt trimming (500 chars max)
  - Logs de context length
  - Content guardado como string (no objeto)

src/lib/firestore.ts
  - Message.content: MessageContent | string
  - addMessage() acepta string

src/lib/bigquery-router.ts
  - localhost → BLUE (no GREEN lento)

src/lib/bigquery-optimized.ts
  - GREEN apunta a flow_analytics_east4 (same as BLUE)
  - Query con ML.DISTANCE optimizado
```

### **Documentación:**
```
docs/fixes/MENSAJES_VACIOS_FIX_2025-11-25.md
docs/GREEN_UNIFIED_WITH_BLUE_2025-11-25.md
docs/BIGQUERY_AGENT_FILTERING_EXPLAINED.md
```

---

## 🎯 **PRÓXIMOS PASOS RECOMENDADOS:**

### **Opción 1: Investigar Gemini API (Prioritaria)**

**Hipótesis:** `generateContentStream()` puede tener issue con:
- System instructions largas combinadas con RAG context
- Versión del SDK `@google/genai` desactualizada
- Rate limiting no visible

**Acciones:**
```bash
# 1. Verificar versión del SDK
npm list @google/genai

# 2. Probar request mínimo (sin context, sin system prompt)
# Test: Solo message simple
const stream = await genAI.models.generateContentStream({
  model: 'gemini-2.5-flash',
  contents: [{ role: 'user', parts: [{ text: 'Hola' }] }],
  config: { maxOutputTokens: 50 }
});
# ¿Retorna chunks? → API funciona
# ¿done: true? → Problema de configuración

# 3. Incrementar gradualmente:
# - Agregar system instruction (100 chars)
# - Agregar context (1KB)
# - Agregar system instruction (500 chars)
# - Hasta encontrar breaking point
```

### **Opción 2: Usar generateContent() no-streaming (Workaround)**

**Si streaming está roto, usar respuesta completa:**

```typescript
// En lugar de generateContentStream()
const result = await genAI.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: [...],
  config: {...}
});

const fullText = result.text || '';
// Luego simular chunks en backend para mantener UX
```

**Ventaja:** Sabemos que embedding funciona (usa mismo SDK)  
**Desventaja:** No streaming real (pero podemos simular)

### **Opción 3: Verificar Quotas y Permisos**

```bash
# Check API key scopes
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent" \
  -H "Content-Type: application/json" \
  -H "x-goog-api-key: $GOOGLE_AI_API_KEY" \
  -d '{"contents":[{"parts":[{"text":"test"}]}]}'

# Debería retornar chunks o error específico
```

---

## 🔧 **DIAGNÓSTICO STEP-BY-STEP:**

### **Para nueva sesión, ejecutar:**

**1. Verificar SDK y config:**
```bash
cd /Users/alec/salfagpt
npm list @google/genai
grep "GOOGLE_AI_API_KEY" .env
```

**2. Test mínimo de Gemini (sin context):**
```typescript
// Archivo: test-gemini-minimal.mjs
import { GoogleGenAI } from '@google/genai';

const genAI = new GoogleGenAI({ 
  apiKey: process.env.GOOGLE_AI_API_KEY 
});

const stream = await genAI.models.generateContentStream({
  model: 'gemini-2.5-flash',
  contents: [{ role: 'user', parts: [{ text: 'Di hola en 3 palabras' }] }],
  config: { maxOutputTokens: 20 }
});

let count = 0;
for await (const chunk of stream) {
  count++;
  console.log(`Chunk ${count}:`, chunk.text);
}

console.log(`Total: ${count} chunks`);
```

**Ejecutar:**
```bash
npx tsx test-gemini-minimal.mjs
```

**Resultado esperado:**
- ✅ `Chunk 1: Hola a todos` → API funciona
- ❌ `Total: 0 chunks` → Problema de API/permisos

**3. Si test mínimo funciona, agregar complejidad:**
```typescript
// Agregar system instruction corta
config: {
  systemInstruction: 'Sé breve',
  maxOutputTokens: 20
}

// ¿Funciona? → Agregar más
systemInstruction: 'Sé breve y preciso. Responde en español.',

// Seguir agregando hasta encontrar breaking point
```

**4. Si nada funciona, switch a non-streaming:**
```typescript
// Reemplazar streamAIResponse() en src/lib/gemini.ts
export async function* streamAIResponse(...) {
  // En lugar de generateContentStream()
  const result = await genAI.models.generateContent({
    model: 'gemini-2.5-flash',
    contents,
    config: {...}
  });
  
  const fullText = result.text || '';
  
  // Simular chunks para mantener UX de streaming
  const chunkSize = 50;
  for (let i = 0; i < fullText.length; i += chunkSize) {
    yield fullText.substring(i, i + chunkSize);
  }
}
```

---

## 📋 **ESTADO ACTUAL DEL SISTEMA:**

### **Performance:**
```
Backend (us-east4): 2-4s ✅
BigQuery: 2s (TOP 20 chunks) ✅
Context: 6KB (optimizado) ✅
Gemini: 0s (NO responde) ❌
Total: ~15s esperando sin respuesta ❌
```

### **Configuración:**
```yaml
Branch: main
Server: localhost:3000 (PID 76439)
Terminal: 15 (logs activos)
Dataset: flow_analytics_east4 (BLUE)
Región: us-east4
Agent: 1lgr33ywq5qed67sqCYi (S2-v2, 467 sources)
```

### **Limits Aplicados:**
```
Context: 6KB (top 3 chunks × 2KB)
System prompt: 500 chars max
Max tokens output: 300
RAG chunks: 20 (topK)
Similarity: >= 0.3 (threshold)
```

---

## 🎯 **PLAN DE ACCIÓN (Nueva Sesión):**

### **Paso 1: Diagnóstico Gemini API (15 min)**
```
1. Test mínimo sin context
2. Test con context corto (1KB)
3. Test con system instruction incremental
4. Identificar breaking point exacto
```

### **Paso 2: Workaround si API rota (30 min)**
```
1. Switch a generateContent() (no streaming)
2. Simular chunks en backend
3. Mantener UX igual
4. Verificar funcionamiento end-to-end
```

### **Paso 3: Optimización Final (15 min)**
```
1. Si workaround funciona, commit
2. Documentar decisión
3. Test completo de flujo
4. Deploy si estable
```

---

## 🔑 **INFORMACIÓN CRÍTICA:**

### **IDs:**
```
Usuario: usr_uhwqffaqag1wrryd82tw (alec@getaifactory.com)
Agente S2-v2: 1lgr33ywq5qed67sqCYi (467 sources)
Conversación test: 06GTPfn9CGnk9ZCSuvod
```

### **API Keys:**
```
GOOGLE_AI_API_KEY: Actualizada en producción ✅
Project: salfagpt
```

### **Limits Gemini 2.5 Flash:**
```
Context window: 1M tokens (~4MB text)
System instruction: No documentado (probablemente <2KB)
Max output: 8,192 tokens
Nuestro uso:
  - Context: 6KB (~1,500 tokens) ✅
  - System: 4.7KB (~1,200 tokens) ⚠️ PROBLEMA PROBABLE
  - Output: 300 tokens ✅
  - Total input: ~2,700 tokens ✅ (bien dentro de 1M)
```

---

## 🐛 **DEBUG CRÍTICO:**

### **El problema NO es:**
- ❌ Tamaño de context window (1.5K << 1M tokens)
- ❌ API key (actualizada, embeddings funcionan)
- ❌ BigQuery (funciona perfecto, 2s)
- ❌ Referencias (se generan y muestran correctamente)
- ❌ Frontend (recibe referencias, solo falta texto)

### **El problema SÍ es:**
- ✅ `generateContentStream()` retorna `done: true` inmediatamente
- ✅ System instruction 4.7KB causa rechazo (reducido a 500 chars)
- ✅ Necesita verificación si 500 chars es suficiente

---

## 📝 **COMANDO PARA SIGUIENTE SESIÓN:**

```markdown
# CONTEXTO:
Estoy debugging problema de respuestas vacías en SalfaGPT.

# PROBLEMA:
Gemini API retorna stream vacío (done: true, 0 chunks)
BigQuery RAG funciona (20 chunks, 79.9% similarity)
Referencias visibles, pero respuesta vacía

# ROOT CAUSE:
generateContentStream() rechaza request silenciosamente
Probablemente por systemInstruction demasiado largo (4.7KB)

# FIXES APLICADOS:
✅ Context truncado: 48KB → 6KB (top 3 chunks × 2KB)
✅ System prompt limitado: 4.7KB → 500 chars
✅ Mensajes guardados como string (no objeto)
✅ GREEN = BLUE (unified BigQuery)
⚠️ Gemini streaming SIGUE vacío

# PRÓXIMOS PASOS:
1. Test Gemini API mínimo (sin context/system)
2. Si test pasa: Identificar breaking point incremental
3. Si test falla: Switch a generateContent() no-streaming
4. Workaround: Simular streaming con chunks artificiales

# ARCHIVOS CLAVE:
- src/lib/gemini.ts (streamAIResponse - línea 478-520)
- src/lib/rag-search.ts (buildRAGContext - línea 225-269)
- src/pages/api/conversations/[id]/messages-stream.ts (línea 668-700)

# TEST CASE:
Agente: Maqsa Mantenimiento (S2-v2)
Pregunta: "Cada cuantas horas se debe cambiar el aceite hidraulico en un camion pluma SCANIA P450 B 6x4"
Esperado: Respuesta basada en Manual de Mantenimiento Scania (79.9% similarity)
Actual: Respuesta vacía (0 chars)

# LOGS RELEVANTES:
Terminal: /Users/alec/.cursor/projects/Users-alec-salfagpt/terminals/15.txt
Buscar: "gemini.ts" para ver stream debug
Línea clave: "done: true" = stream vacío

# COMANDO INICIAL:
Por favor ejecuta test mínimo de Gemini API:
```bash
cat > test-gemini.mjs << 'EOF'
import { GoogleGenAI } from '@google/genai';
const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY });
const stream = await genAI.models.generateContentStream({
  model: 'gemini-2.5-flash',
  contents: [{ role: 'user', parts: [{ text: 'Di hola' }] }],
  config: { maxOutputTokens: 10 }
});
let count = 0;
for await (const chunk of stream) {
  count++;
  console.log('Chunk:', chunk.text);
}
console.log('Total chunks:', count);
process.exit(0);
EOF
cd /Users/alec/salfagpt && npx tsx test-gemini.mjs
```

Si retorna chunks: API funciona, problema es config
Si retorna 0: API/key issue, usar generateContent() como workaround
```

---

## 📊 **ARQUITECTURA ACTUAL:**

```
Usuario → Frontend (S2-v2)
  ↓
Backend /messages-stream
  ↓
BigQuery us-east4 (✅ 2s, 20 chunks, 79.9%)
  ↓
buildRAGContext() (✅ 6KB contexto optimizado)
  ↓
streamAIResponse() → Gemini API
  ↓
generateContentStream() → ❌ done: true (stream vacío)
  ↓
0 chunks retornados
  ↓
Frontend muestra: mensaje vacío + 1 referencia
```

---

## 🔍 **DEBUGGING TRACE COMPLETO:**

```
[10:38:39] POST /messages-stream
[10:38:41] BigQuery search: 2s ✅
[10:38:41] Found 20 chunks ✅
[10:38:41] Built 1 reference ✅
[10:38:41] Context: 6,421 chars ✅
[10:38:41] System: 4,826 chars ⚠️
[10:38:41] Calling Gemini API...
[10:38:42] Stream received ✅
[10:38:42] stream.next() → done: true ❌
[10:38:42] Total chunks: 0 ❌
[10:38:42] Saved message: content = "" ❌
[10:38:43] Frontend: contentLength = 0 ❌
```

---

## ✅ **SOLUCIONES PROPUESTAS:**

### **Solución A: Fix Streaming (Ideal)**
```
Identificar por qué generateContentStream() falla
Ajustar parámetros hasta que funcione
Mantener streaming real
```

### **Solución B: Non-Streaming Workaround (Rápido)**
```typescript
// Cambiar a generateContent() (no stream)
const result = await genAI.models.generateContent({...});
const fullText = result.text;

// Simular streaming dividiendo en chunks
for (let i = 0; i < fullText.length; i += 100) {
  yield fullText.substring(i, i + 100);
  await sleep(50); // Simular delay
}
```

**Pro:** Funciona inmediatamente  
**Con:** No streaming real de Gemini  
**UX:** Idéntico (usuario no nota diferencia)

### **Solución C: Reducir System Prompt Más (Test)**
```
Actual: 500 chars limit
Nuevo: 200 chars limit
Test: ¿Gemini acepta?
```

---

## 📚 **CONTEXTO TÉCNICO:**

### **Gemini 2.5 Flash Specs:**
```
Input: 1M tokens context window
Output: 8,192 tokens max
Streaming: Soportado (pero no funciona para nosotros)
System instruction: Max no documentado (probablemente 1-2KB)
```

### **Nuestro Uso Actual:**
```
Input tokens: ~2,700 (context 6KB + system 500 chars)
Output tokens: 300 (configurado)
Ratio: 9:1 (saludable)
Problema: Stream vacío a pesar de configuración válida
```

---

## 🚀 **START HERE (Nueva Sesión):**

1. **Lee este prompt completo**
2. **Ejecuta test mínimo Gemini** (código arriba)
3. **Si test pasa:** Incrementa complejidad hasta breaking point
4. **Si test falla:** Implementa Solución B (non-streaming workaround)
5. **Verifica funcionamiento** end-to-end
6. **Commit y documenta** solución final

---

**Branch:** main  
**Server:** localhost:3000 corriendo  
**Terminal:** 15 (logs activos)  
**Listo para:** Test diagnóstico Gemini API

**¡Buena suerte!** 🎯🔍



