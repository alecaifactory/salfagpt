# ✅ Listo Para Probar Referencias
**Date:** October 19, 2025  
**Status:** Esperando re-indexado

---

## 📋 Pasos Siguientes

### 1. **Re-indexar el Documento** (En Progreso)

Has hecho click en "Re-indexar" - esto debería tomar ~5-10 segundos.

**Lo que hace:**
- Usa los chunks existentes (ya creados)
- Verifica embeddings (ya existen)
- **Actualiza `ragEnabled = true`** ← Esto es lo importante
- Actualiza metadata

**Cuando termine:**
- Verás el modal cerrarse
- El documento debería mostrar "RAG: Habilitado" ✅

### 2. **Verificar Estado RAG**

Después del re-indexado, el documento debería mostrar:

```
✅ RAG: Habilitado
   3 chunks indexados
   Embeddings: text-embedding-004
```

### 3. **Enviar Mensaje de Prueba**

**En el chat, escribe:**
```
¿Cómo se calcula la superficie edificada de escaleras según la DDU 75?
```

**Lo que deberías ver:**

**Durante generación:**
```
✓ Pensando...
✓ Buscando Contexto Relevante...
✓ Seleccionando Chunks...
⏳ Generando Respuesta...
```

**En la respuesta:**
```
Según la Circular DDU-ESPECÍFICA N° 75 [1], el cálculo de
la superficie edificada de escaleras se realiza considerando...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📚 Referencias utilizadas (3)

[1] DDU-ESP-075-07.pdf
    87.3% similar | Chunk #0 | 450 tokens
    "La circular establece que..."

[2] DDU-ESP-075-07.pdf  
    76.5% similar | Chunk #1 | 380 tokens
    "Se debe calcular el 100%..."

[3] DDU-ESP-075-07.pdf
    68.2% similar | Chunk #2 | 420 tokens
    "En los pisos siguientes..."
```

**Acciones:**
- Click en cualquier `[1]`, `[2]`, `[3]` badge
- Se abre panel derecho
- Ves:
  - Barra de similitud (87.3%)
  - Chunk #0
  - Texto completo del chunk
  - Metadata (tokens, páginas)

### 4. **Verificar Persistencia**

**Recarga la página (Cmd+R):**
- Abre la misma conversación
- Scroll al mensaje que enviaste
- **Las referencias deberían seguir ahí** ✅
- Click en [1] → panel se abre con la misma info

---

## 🎯 Qué Buscar en los Logs

### Terminal (npm run dev)

```bash
# Cuando envíes el mensaje:
🔍 [Streaming] Attempting RAG search...
  Configuration: topK=5, minSimilarity=0.5
✅ RAG: Using 3 relevant chunks (1,250 tokens)
  Avg similarity: 77.3%
📚 Built references for message: 3
  [1] DDU-ESP-075-07.pdf - 87.3% - Chunk #0
  [2] DDU-ESP-075-07.pdf - 76.5% - Chunk #1  
  [3] DDU-ESP-075-07.pdf - 68.2% - Chunk #2
💬 Message created from localhost: msg_xyz123
```

### Navegador Console (F12)

```javascript
✅ Message complete event received
📚 References in completion: 3
📚 Reference details: [
  { id: 1, sourceName: "DDU-ESP-075-07.pdf", similarity: 0.873, ... },
  { id: 2, sourceName: "DDU-ESP-075-07.pdf", similarity: 0.765, ... },
  { id: 3, sourceName: "DDU-ESP-075-07.pdf", similarity: 0.682, ... }
]
📚 MessageRenderer received references: 3
  [1] DDU-ESP-075-07.pdf - 87.3% - Chunk #0
  [2] DDU-ESP-075-07.pdf - 76.5% - Chunk #1
  [3] DDU-ESP-075-07.pdf - 68.2% - Chunk #2
```

---

## ⚠️ Si Aún No Se Ven

### Problema A: RAG No Encuentra Chunks Relevantes

**Logs mostrarán:**
```
⚠️ RAG: No results above similarity threshold
📚 References in completion: 0
```

**Solución:**
```typescript
// Bajar threshold temporalmente
ragMinSimilarity = 0.3  // Muy permisivo
```

### Problema B: Chunks Sin Similarity Suficiente

**Logs mostrarán:**
```
✅ RAG: Using 0 relevant chunks
```

**Solución:**
- Query no coincide con contenido del PDF
- Prueba con: "¿Qué dice sobre escaleras?" (más genérico)

### Problema C: Referencias Llegan Pero No Se Muestran

**Logs mostrarán:**
```
📚 References in completion: 3  ✅
📚 MessageRenderer: No references received  ❌
```

**Solución:**
- Bug en props
- Avísame y lo arreglo inmediatamente

---

## 🎯 Estado Actual

```
✅ Código implementado completamente
✅ Persistencia configurada
✅ UI lista para mostrar referencias
✅ Logs de debugging activos
⏳ Esperando re-indexado...
⏳ Luego enviar mensaje de prueba
```

---

## 📸 Screenshots Esperados

**1. Durante generación:**
![Thinking steps con spinners y checkmarks]

**2. Respuesta con referencias:**
![Texto con badges azules [1], [2], [3]]

**3. Footer de referencias:**
![Lista de referencias con % de similitud]

**4. Panel derecho:**
![Barra de similitud, chunk#, texto completo]

---

**Avísame cuando:**
1. ✅ Re-indexado complete (modal se cierre)
2. ✅ Veas "RAG: Habilitado" en el documento
3. 🚀 Envíes el mensaje de prueba
4. 📸 Me muestres qué ves (o qué logs aparecen si no funciona)

¡Estamos muy cerca! 🎉


