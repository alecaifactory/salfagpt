# Troubleshooting: Referencias No Se Muestran
**Date:** October 19, 2025  
**Issue:** Referencias no aparecen en la UI

---

## 🔍 Pasos de Diagnóstico

### 1. Verificar que RAG está habilitado

**En la UI, revisa:**
- ¿Hay fuentes de contexto activas (toggle verde)?
- ¿El modo RAG está activado? (busca el control RAG en la UI)
- ¿Las fuentes tienen chunks indexados?

**Logs esperados en consola del navegador:**
```
📚 Cargando fuentes de contexto desde Firestore...
✅ 2 fuentes de contexto cargadas desde Firestore
```

### 2. Enviar un mensaje y revisar consola del servidor

**Logs esperados en terminal donde corre `npm run dev`:**

```bash
🔍 [Streaming] Attempting RAG search...
  Configuration: topK=5, minSimilarity=0.5
✅ RAG: Using 5 relevant chunks (2,250 tokens)
  Avg similarity: 78.3%
📚 Built references for message: 5
  [1] Circular DDU.pdf - 87.3% - Chunk #2
  [2] OGUC.pdf - 76.5% - Chunk #5
  [3] Manual.pdf - 68.2% - Chunk #8
```

**Si ves estos logs →** Referencias se están generando ✅

**Si NO ves estos logs →** Problema está en RAG search ❌

### 3. Verificar evento de completion

**Logs esperados en consola del navegador:**

```javascript
✅ Message complete event received
📚 References in completion: 5
📚 Reference details: [
  {
    id: 1,
    sourceId: "...",
    sourceName: "Circular DDU.pdf",
    similarity: 0.873,
    chunkIndex: 2,
    ...
  },
  ...
]
```

**Si ves estos logs →** Referencias llegan al frontend ✅

**Si NO ves estos logs →** Problema está en SSE stream ❌

### 4. Verificar MessageRenderer recibe referencias

**Logs esperados en consola del navegador:**

```javascript
📚 MessageRenderer received references: 5
  [1] Circular DDU.pdf - 87.3% - Chunk #2
  [2] OGUC.pdf - 76.5% - Chunk #5
  [3] Manual.pdf - 68.2% - Chunk #8
```

**Si ves estos logs →** Referencias llegan a MessageRenderer ✅

**Si NO ves "No references received" →** Problema está en props ❌

---

## 🐛 Problemas Comunes

### Problema 1: RAG No Tiene Resultados

**Síntomas:**
- Logs dicen: "⚠️ RAG: No results above similarity threshold"
- No hay referencias generadas

**Causas:**
- Threshold de similitud muy alto (>0.8)
- Query no coincide con contenido de chunks
- Chunks no están indexados (sin embeddings)

**Solución:**
```typescript
// Bajar threshold temporalmente para testing
setRagMinSimilarity(0.3); // Muy permisivo para testing

// O verificar que chunks tienen embeddings
fetch('/api/context-sources/SOURCE_ID/chunks?userId=USER_ID')
  .then(r => r.json())
  .then(data => {
    console.log('Chunks:', data.chunks.length);
    console.log('First chunk has embedding:', !!data.chunks[0]?.embedding);
  });
```

### Problema 2: Referencias No Se Guardan en Firestore

**Síntomas:**
- Referencias se ven en sesión actual
- Desaparecen al recargar página

**Verificar:**
```bash
# Inspeccionar mensaje en Firestore
npx tsx -e "
import { firestore } from './src/lib/firestore.js';

const snapshot = await firestore
  .collection('messages')
  .orderBy('timestamp', 'desc')
  .limit(1)
  .get();

const msg = snapshot.docs[0]?.data();
console.log('Message has references field:', 'references' in msg);
console.log('References:', msg.references);
process.exit(0);
"
```

**Si `references` está undefined →** No se está guardando ❌

**Causas posibles:**
- `addMessage` no recibe referencias
- Referencias es array vacío `[]` (se omite)
- Error en `messageRef.set(message)`

### Problema 3: Referencias No Se Pasan a MessageRenderer

**Síntomas:**
- Backend genera referencias
- Frontend recibe referencias en completion
- Pero MessageRenderer dice "No references received"

**Verificar en ChatInterfaceWorking.tsx línea ~2690:**
```typescript
references={msg.references} // ← Debe estar presente
```

**Agregar debug:**
```typescript
console.log('Message object:', msg);
console.log('Has references:', !!msg.references);
console.log('References count:', msg.references?.length || 0);
```

### Problema 4: Footer No Se Renderiza

**Síntomas:**
- MessageRenderer recibe referencias
- Pero footer no aparece

**Verificar condición en MessageRenderer.tsx línea ~309:**
```typescript
{references.length > 0 && (
  <div className="mt-6 pt-4 border-t border-slate-200">
    ...
  </div>
)}
```

**Agregar debug antes del return:**
```typescript
console.log('Will render footer:', references.length > 0);
console.log('References array:', references);
```

---

## 🔧 Quick Fixes

### Fix 1: Forzar Referencias de Prueba

**En ChatInterfaceWorking.tsx, al recibir complete:**

```typescript
// Temporary: Force test references if none received
if (!data.references || data.references.length === 0) {
  console.warn('⚠️ No references received, using test data');
  data.references = [
    {
      id: 1,
      sourceId: 'test',
      sourceName: 'Test Document.pdf',
      snippet: 'This is a test snippet',
      fullText: 'This is the full test chunk text',
      chunkIndex: 0,
      similarity: 0.85,
      metadata: { tokenCount: 100 }
    }
  ];
}
```

**Esto te mostrará si el problema es:**
- Generación de referencias (backend) ← Si test data se ve, problema es backend
- Renderizado de referencias (frontend) ← Si test data NO se ve, problema es frontend

### Fix 2: Verificar ragResults No Está Vacío

**En messages-stream.ts, después de RAG search:**

```typescript
console.log('ragResults:', ragResults);
console.log('ragResults.length:', ragResults.length);
console.log('ragUsed:', ragUsed);

if (ragResults.length === 0) {
  console.warn('⚠️ RAG returned zero results!');
  console.warn('  Check:');
  console.warn('  - Are chunks indexed?');
  console.warn('  - Is minSimilarity too high?');
  console.warn('  - Does query match document content?');
}
```

### Fix 3: Simplificar para Testing

**Modificar MessageRenderer para SIEMPRE mostrar referencias si existen:**

```typescript
// Al principio de MessageRenderer component
if (references && references.length > 0) {
  console.log('🚨 REFERENCES EXIST:', references);
  console.log('🚨 SHOULD SHOW FOOTER');
}

// En el JSX, agregar fallback visual
{references && references.length > 0 ? (
  <div className="mt-6 pt-4 border-t-4 border-red-500">
    <h4 className="text-2xl font-bold text-red-600">
      ⚠️ REFERENCES EXIST: {references.length}
    </h4>
    {/* ... resto del footer ... */}
  </div>
) : (
  <div className="mt-6 text-gray-400">
    No references (references array length: {references?.length || 0})
  </div>
)}
```

---

## 📋 Checklist de Diagnóstico

Ejecuta estos pasos en orden:

### Backend (Terminal)
- [ ] Servidor corriendo: `lsof -i:3000`
- [ ] Enviar mensaje y buscar: "RAG search"
- [ ] Ver: "Built references for message: N" donde N > 0
- [ ] Si N = 0 → Problema en RAG search

### Frontend (Consola del Navegador)
- [ ] Enviar mensaje
- [ ] Ver: "Message complete event received"
- [ ] Ver: "References in completion: N" donde N > 0
- [ ] Ver: "MessageRenderer received references: N"
- [ ] Si alguno es 0 → Identificar dónde se pierden

### UI Visual
- [ ] Scroll al final del mensaje del AI
- [ ] Buscar línea separadora (border-top)
- [ ] Buscar texto "📚 Referencias utilizadas"
- [ ] Si no está → Problema en renderizado

### Firestore
- [ ] Abrir Firebase Console
- [ ] Ir a collection `messages`
- [ ] Buscar mensaje reciente
- [ ] Ver campo `references`
- [ ] Si no existe → Problema en persistencia

---

## 🚨 Solución Rápida

**Si necesitas referencias YA para una demo:**

### Opción A: Mock References

Agregar en ChatInterfaceWorking.tsx después del mensaje de prueba:

```typescript
// TEMPORARY: Add mock references for testing
const mockMessage: Message = {
  id: 'mock-123',
  role: 'assistant',
  content: 'Esta es una respuesta de prueba. Según el documento [1], debemos considerar [2].',
  timestamp: new Date(),
  references: [
    {
      id: 1,
      sourceId: 'mock-source-1',
      sourceName: 'Circular DDU-ESPECÍFICA N° 75.pdf',
      snippet: 'La circular establece que, para escaleras que no forman parte de una vía de evacuación...',
      fullText: 'La circular establece que, para escaleras que no forman parte de una vía de evacuación, se debe calcular el 100% de su superficie en cada piso. Este cálculo considera el área bajo el plano inclinado de la escalera.',
      chunkIndex: 2,
      similarity: 0.873,
      metadata: {
        tokenCount: 450,
        startPage: 5,
        endPage: 6
      }
    },
    {
      id: 2,
      sourceId: 'mock-source-2',
      sourceName: 'OGUC Artículo 5.1.11.pdf',
      snippet: 'El artículo especifica que el cálculo de superficie edificada debe incluir...',
      fullText: 'El artículo especifica que el cálculo de superficie edificada debe incluir todos los espacios cerrados y cubiertos, excluyendo únicamente aquellos expresamente indicados en las excepciones del mismo artículo.',
      chunkIndex: 5,
      similarity: 0.765,
      metadata: {
        tokenCount: 380,
        startPage: 12,
        endPage: 12
      }
    }
  ]
};

setMessages(prev => [...prev, mockMessage]);
```

### Opción B: Test Endpoint

Crear endpoint temporal que siempre devuelve referencias:

```typescript
// src/pages/api/test-references.ts
export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({
    references: [
      { id: 1, sourceName: 'Test.pdf', similarity: 0.9, chunkIndex: 0, snippet: 'Test chunk' }
    ]
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
};
```

---

## 📊 Matriz de Diagnóstico

| Síntoma | Causa Probable | Solución |
|---------|----------------|----------|
| No logs de RAG search | RAG deshabilitado o sin sources | Activar RAG, verificar sources |
| RAG dice "0 results" | Threshold muy alto | Bajar minSimilarity a 0.3 |
| References=0 en completion | ragResults vacío | Ver logs de RAG search |
| References NO llegan a MessageRenderer | Props no se pasan | Verificar línea 2690 |
| Footer no se renderiza | Condición `references.length > 0` falla | Agregar logs antes del if |
| Referencias en Firestore pero no en UI | Transform no incluye field | Verificar `...msg` spread |

---

## 🎯 Acción Inmediata

**Para debuggear AHORA:**

1. **Abre la consola del navegador** (F12)
2. **Envía un mensaje** con una fuente activa
3. **Busca estos logs en orden:**
   ```
   ✅ Message complete event received
   📚 References in completion: ?
   📚 MessageRenderer received references: ?
   ```
4. **Reporta qué número sale en cada "?"**

**Con esos números puedo identificar exactamente dónde se pierden las referencias.**

---

## 💡 Hipótesis Más Probable

Basado en la implementación, la causa más probable es:

**🎯 `ragResults` está vacío porque:**
1. No hay chunks indexados en las fuentes activas, O
2. El threshold de similitud es muy alto para el contenido, O
3. RAG search está fallando silenciosamente

**Para verificar:**
```bash
# En navegador, ejecuta:
fetch('/api/context-sources?userId=YOUR_USER_ID')
  .then(r => r.json())
  .then(data => {
    console.log('Sources:', data.sources);
    data.sources.forEach(s => {
      console.log(s.name, 'has ragEnabled:', s.ragEnabled);
    });
  });

# Luego para cada source:
fetch('/api/context-sources/SOURCE_ID/chunks?userId=YOUR_USER_ID')
  .then(r => r.json())
  .then(data => {
    console.log('Chunks:', data.chunks.length);
    console.log('Has embeddings:', data.chunks[0]?.embedding?.length > 0);
  });
```

**Si chunks.length === 0 →** ¡Ahí está el problema! Necesitas re-indexar el documento.

---

## 🚀 Solución Definitiva

**Una vez identifiquemos dónde se pierden las referencias, puedo:**

1. Si es problema de RAG → Ajustar configuración o re-indexar
2. Si es problema de persistencia → Arreglar addMessage
3. Si es problema de carga → Arreglar loadMessages
4. Si es problema de renderizado → Arreglar MessageRenderer

**Dime qué logs ves y arreglamos el problema específico.** 🔧


