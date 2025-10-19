# Panel de Prueba Interactiva de Documentos
**Date:** October 19, 2025  
**Feature:** Test directo de chunks y validación de referencias  
**Status:** ✅ Implementado

---

## 🎯 ¿Qué Es Esto?

Un panel de prueba integrado que te permite:

1. **Ver todos los chunks** del documento lado a lado
2. **Seleccionar un chunk específico** como objetivo
3. **Hacer preguntas** sobre ese chunk
4. **Verificar automáticamente** si el AI referenció el chunk correcto
5. **Ver las referencias** con scores de similitud
6. **Probar la calidad** del RAG sin salir del modal

---

## 🚀 Cómo Usarlo

### Paso 1: Abrir el Panel

1. **Abre** la configuración de un documento (settings ⚙️)
2. **Scroll** hasta "Indexación RAG"
3. **Busca** el botón morado/púrpura:
   ```
   🎯 Probar Documento Interactivamente ✨
   ```
4. **Click** → Se abre panel fullscreen dividido en 2

### Paso 2: Seleccionar un Chunk

**Panel Izquierdo - Lista de Chunks:**

```
┌────────────────────────────────────┐
│ 📄 Chunks del Documento (3)       │
├────────────────────────────────────┤
│                                    │
│ ┌──────────────────────────────┐   │
│ │ Chunk #0        Página 1-2  │   │
│ │ 450 tokens                   │   │
│ │                              │   │
│ │ La Circular DDU-ESPECÍFICA   │   │
│ │ Nº 75 establece que para     │   │
│ │ el cálculo de la superficie  │   │
│ │ edificada de escaleras...    │   │
│ └──────────────────────────────┘   │
│                                    │
│ ┌──────────────────────────────┐   │
│ │ Chunk #1        Página 3-4  │   │
│ │ 380 tokens                   │   │
│ │ ...                          │   │
│ └──────────────────────────────┘   │
└────────────────────────────────────┘
```

**Click en cualquier chunk** → Se selecciona (fondo azul)

**Opcional:** Selecciona texto dentro del chunk con el mouse → Genera preguntas sugeridas

### Paso 3: Hacer una Pregunta

**Panel Derecho - Chat de Prueba:**

```
┌────────────────────────────────────┐
│ 💬 Chat de Prueba                 │
│ Chunk #0 seleccionado como objetivo│
├────────────────────────────────────┤
│                                    │
│ [Área de mensajes vacía]           │
│                                    │
│ ✨ Selecciona un chunk y haz una  │
│    pregunta                        │
│                                    │
├────────────────────────────────────┤
│ 💡 Preguntas sugeridas:            │
│ • ¿Qué dice sobre escaleras?       │
│ • ¿Cómo se calcula la superficie?  │
│ • Resume este fragmento            │
│                                    │
│ ┌────────────────────┬──────┐      │
│ │ Pregunta aquí...   │Probar│      │
│ └────────────────────┴──────┘      │
│                                    │
│ 🎯 Chunk #0 seleccionado           │
└────────────────────────────────────┘
```

**Opciones:**
- Click en una pregunta sugerida → Se llena automáticamente
- Escribe tu propia pregunta
- Presiona Enter o click "Probar"

### Paso 4: Ver el Resultado

**El AI responde mostrando:**

```
┌────────────────────────────────────┐
│ Usuario:                           │
│ ┌────────────────────────────┐     │
│ │ ¿Cómo se calcula la        │     │
│ │ superficie de escaleras?   │     │
│ │ 🎯 Objetivo: Chunk #0      │     │
│ └────────────────────────────┘     │
│                                    │
│ Respuesta de Prueba                │
│ ✓ Chunk objetivo referenciado      │ ← Indicador de éxito!
│ ┌────────────────────────────┐     │
│ │ Según la Circular [1], el  │     │
│ │ cálculo debe considerar... │     │
│ │                            │     │
│ │ ━━━━━━━━━━━━━━━━━━━━━━━━  │     │
│ │ 📚 Referencias utilizadas   │     │
│ │                            │     │
│ │ [1] DDU-ESP-075-07.pdf     │     │
│ │     87.3% similar          │     │
│ │     Chunk #0 ← ¡MATCH! ✅  │     │
│ └────────────────────────────┘     │
└────────────────────────────────────┘
```

**Indicadores Automáticos:**

- **Verde "✓ Chunk objetivo referenciado"** → El AI usó el chunk que seleccionaste ✅
- **Naranja "⚠ Chunk objetivo NO usado"** → El AI usó otros chunks ⚠️

### Paso 5: Validar Calidad

**En la consola del navegador (F12), verás:**

```javascript
🎯 Test Result: ✅ MATCHED
   Target: 0
   Referenced: [0, 1]
```

O si no coincide:

```javascript
🎯 Test Result: ❌ NOT MATCHED
   Target: 0
   Referenced: [1, 2]  // Usó otros chunks
```

---

## 🎨 Características del Panel

### Panel Izquierdo (Chunks)

**Features:**
- ✅ Lista completa de chunks del documento
- ✅ Muestra texto completo de cada chunk
- ✅ Número de chunk y páginas
- ✅ Token count
- ✅ Click para seleccionar
- ✅ Selección visual (fondo azul cuando activo)
- ✅ Scrolleable (si hay muchos chunks)

**Interaction:**
- Click en chunk → Selecciona como objetivo
- Selecciona texto dentro del chunk → Genera preguntas sugeridas

### Panel Derecho (Chat)

**Features:**
- ✅ Chat de prueba aislado (no afecta historial principal)
- ✅ Preguntas sugeridas basadas en contenido
- ✅ Input directo con Enter para enviar
- ✅ Muestra indicador "🎯 Chunk #X seleccionado"
- ✅ Respuestas con referencias completas
- ✅ Validación automática (verde/naranja)
- ✅ MessageRenderer completo (markdown, badges, footer)

**Validation:**
- Badge verde si chunk objetivo fue referenciado
- Badge naranja si AI usó otros chunks
- Logs en consola con detalles exactos

---

## 🔬 Casos de Uso

### Caso 1: Validar Cobertura de Chunks

**Objetivo:** ¿Todos los chunks son útiles o hay chunks que nunca se usan?

**Proceso:**
1. Selecciona Chunk #0
2. Pregunta: "¿Qué dice sobre escaleras?"
3. Verifica si [1] apunta a Chunk #0
4. Selecciona Chunk #1
5. Pregunta: "¿Qué dice sobre superficie?"
6. Verifica referencias
7. Repite para cada chunk

**Resultado:** Identificas qué chunks son "descubiertos" vs "huérfanos"

### Caso 2: Probar Precisión del RAG

**Objetivo:** ¿El RAG selecciona el chunk correcto basado en la pregunta?

**Proceso:**
1. Lee Chunk #1 (habla sobre "métodos de cálculo")
2. Pregunta: "¿Cuáles son los métodos de cálculo?"
3. Espera que [1] referencie Chunk #1
4. Verifica score de similitud (debería ser >80%)

**Resultado:** Validas que RAG funciona correctamente

### Caso 3: Ajustar Threshold

**Objetivo:** Encontrar el threshold óptimo de similitud

**Proceso:**
1. Selecciona Chunk #2 (contenido específico)
2. Haz pregunta muy específica sobre ese contenido
3. Observa % de similitud reportado
4. Si es <60% pero aún correcto → Threshold puede ser más bajo
5. Ajusta en configuración RAG

**Resultado:** Optimizas configuración del sistema

### Caso 4: Debugging de Respuestas

**Objetivo:** Entender por qué AI respondió de cierta manera

**Proceso:**
1. AI dio respuesta inesperada en chat principal
2. Abre documento en panel de prueba
3. Lee cada chunk para encontrar de dónde vino
4. Haz pregunta similar
5. Ve qué chunk selecciona RAG
6. Compara con chunk esperado

**Resultado:** Identificas si problema es chunking, RAG, o prompt

---

## 💡 Tips de Uso

### Preguntas Efectivas

**✅ Buenas preguntas:**
- "¿Qué dice sobre [tema específico del chunk]?"
- "Explica el [concepto mencionado en el chunk]"
- "Resume esta sección"
- Preguntas que SOLO pueden responderse con ese chunk

**❌ Preguntas muy genéricas:**
- "¿De qué trata el documento?" (puede usar cualquier chunk)
- "Resume todo" (usará múltiples chunks)
- "¿Qué dice?" (demasiado vago)

### Interpretar Resultados

**Scenario A: Match Perfecto ✅**
```
Pregunta sobre Chunk #0
Referencias: [1] Chunk #0, 87% similar
Badge: ✓ Chunk objetivo referenciado
```
**Interpretación:** RAG funcionando perfectamente

**Scenario B: Match Parcial ⚠️**
```
Pregunta sobre Chunk #0
Referencias: [1] Chunk #0 (85%), [2] Chunk #1 (72%)
Badge: ✓ Chunk objetivo referenciado
```
**Interpretación:** Encontró el objetivo + contexto adicional (normal)

**Scenario C: No Match ❌**
```
Pregunta sobre Chunk #0
Referencias: [1] Chunk #1 (78%), [2] Chunk #2 (65%)
Badge: ⚠ Chunk objetivo NO usado
```
**Interpretación:**
- Pregunta no fue lo suficientemente específica, O
- Chunk #1 y #2 tienen contenido más relevante, O
- Threshold demasiado alto (bajar a 0.3)

---

## 🧪 Ejemplo de Sesión de Prueba

### Documento: DDU-ESP-075-07.pdf (3 chunks)

**Chunk #0:**
```
La Circular DDU-ESPECÍFICA Nº 75 / 2007 establece que, para escaleras 
que no forman parte de una vía de evacuación, se debe calcular el 100% 
de su superficie en cada piso.
```

**Chunk #1:**
```
Se presentan dos métodos para realizar este cálculo del 100% de la 
superficie edificada: Método 1 calcula hasta el descanso en el primer 
piso...
```

**Chunk #2:**
```
Método 2 considera toda la superficie de la escalera en cada piso, como 
si se abatiera la escalera hacia el primer piso...
```

### Test 1: Pregunta sobre Chunk #0

**Selecciono:** Chunk #0  
**Pregunta:** "¿Qué porcentaje de la superficie de escaleras se debe calcular?"  
**Respuesta:** "Según la circular [1], se debe calcular el 100% de la superficie..."  
**Referencias:** [1] Chunk #0, 89.2% similar  
**Resultado:** ✅ MATCH - RAG seleccionó el chunk correcto

### Test 2: Pregunta sobre Chunk #1

**Selecciono:** Chunk #1  
**Pregunta:** "¿Cuáles son los métodos de cálculo mencionados?"  
**Respuesta:** "Existen dos métodos [1][2]. El Método 1 calcula hasta el descanso..."  
**Referencias:**  
  - [1] Chunk #1, 85.7% similar  
  - [2] Chunk #2, 71.3% similar  
**Resultado:** ✅ MATCH - Chunk objetivo está en [1]

### Test 3: Pregunta Genérica (Multi-chunk)

**Selecciono:** Chunk #0  
**Pregunta:** "Resume el documento completo"  
**Respuesta:** "La circular [1] establece el cálculo [2] usando dos métodos [3]..."  
**Referencias:**  
  - [1] Chunk #0, 45.2%  
  - [2] Chunk #1, 52.8%  
  - [3] Chunk #2, 48.5%  
**Resultado:** ⚠️ NO MATCH - Pregunta muy amplia, usó todos los chunks (esperado)

---

## 🎨 Interfaz

### Layout

```
┌──────────────────────────────────────────────────────────────┐
│ 🎯 Prueba Interactiva de Documento                       [X]│
│ DDU-ESP-075-07.pdf                                           │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌──────────────────────┬───────────────────────────────────┐│
│ │ 📄 Chunks (3)        │ 💬 Chat de Prueba                ││
│ │                      │ Chunk #0 seleccionado            ││
│ ├──────────────────────┼───────────────────────────────────┤│
│ │                      │                                  ││
│ │ [Chunk #0] ← Activo  │ [Mensajes de prueba]             ││
│ │ Texto completo...    │                                  ││
│ │                      │ Usuario: ¿Qué dice sobre...?     ││
│ │ [Chunk #1]           │                                  ││
│ │ Texto completo...    │ AI: Según [1], el cálculo...     ││
│ │                      │    ✓ Chunk objetivo referenciado ││
│ │ [Chunk #2]           │    📚 Referencias:               ││
│ │ Texto completo...    │    [1] 87% - Chunk #0 ✅         ││
│ │                      │                                  ││
│ ├──────────────────────┼───────────────────────────────────┤│
│ │                      │ 💡 Preguntas sugeridas           ││
│ │                      │ • ¿Qué dice sobre escaleras?     ││
│ │                      │                                  ││
│ │                      │ [Escribe pregunta...] [Probar]   ││
│ │                      │ 🎯 Chunk #0 seleccionado         ││
│ └──────────────────────┴───────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘
```

### Colores y Estados

**Chunks:**
- Seleccionado: Fondo azul claro, borde azul
- No seleccionado: Fondo blanco, borde gris
- Hover: Fondo gris muy claro

**Badges de Validación:**
- Verde "✓ Chunk objetivo referenciado" → Éxito
- Naranja "⚠ Chunk objetivo NO usado" → No coincide

**Referencias:**
- Verde: ≥80% similitud
- Amarillo: 60-80% similitud
- Naranja: <60% similitud

---

## 🔧 Technical Details

### API Call

**Endpoint usado:**
```
POST /api/conversations/temp-test/messages
```

**Body:**
```json
{
  "userId": "...",
  "message": "¿Qué dice sobre escaleras?",
  "model": "gemini-2.5-flash",
  "systemPrompt": "Eres un asistente experto...",
  "contextSources": [{
    "id": "sourceId",
    "name": "DDU.pdf",
    "type": "pdf",
    "content": "Chunk #0\n\nChunk #1\n\nChunk #2..."
  }],
  "ragEnabled": true,
  "ragTopK": 3,
  "ragMinSimilarity": 0.3
}
```

**Response:**
```json
{
  "assistantMessage": {
    "content": {
      "text": "Según [1], el cálculo..."
    }
  },
  "references": [
    {
      "id": 1,
      "sourceId": "...",
      "sourceName": "DDU.pdf",
      "chunkIndex": 0,
      "similarity": 0.873,
      "fullText": "..."
    }
  ]
}
```

### Validation Logic

```typescript
if (selectedChunkIndex !== null && references.length > 0) {
  const referencedChunks = references.map(r => r.chunkIndex);
  const matched = referencedChunks.includes(selectedChunkIndex);
  
  console.log(`🎯 Target: ${selectedChunkIndex}`);
  console.log(`📚 Referenced: [${referencedChunks.join(', ')}]`);
  console.log(`✅ Match: ${matched ? 'YES' : 'NO'}`);
}
```

---

## 📊 What You Can Learn

### 1. Chunk Quality

**Preguntas:**
- ¿Cada chunk es auto-contenido?
- ¿Se puede responder preguntas con un solo chunk?
- ¿Hay chunks que nunca se usan?

**Acción:** Re-chunk con tamaño diferente si hay problemas

### 2. RAG Performance

**Preguntas:**
- ¿Los scores de similitud son altos (>70%)?
- ¿RAG selecciona los chunks correctos?
- ¿Threshold de 0.5 es apropiado?

**Acción:** Ajustar threshold o modelo de embeddings

### 3. Document Coverage

**Preguntas:**
- ¿Todos los chunks son accesibles vía preguntas?
- ¿Hay secciones que nunca se referencian?
- ¿El documento está bien estructurado?

**Acción:** Mejorar estructura del documento original

---

## ✅ Próximos Pasos

### Ahora Que Tienes el Panel:

1. **Cerrar** el modal de configuración
2. **Volver a abrir** (settings del documento DDU)
3. **Scroll** hasta "Indexación RAG"
4. **Buscar** botón morado "Probar Documento Interactivamente"
5. **Click** → Panel se abre
6. **Seleccionar** Chunk #0
7. **Click** en pregunta sugerida o escribe una
8. **Presionar** "Probar"
9. **Observar** si el badge verde "✓ Chunk objetivo referenciado" aparece
10. **Ver** referencias en el footer con similitud

---

## 🐛 Troubleshooting

### "No veo el botón de Probar Documento"

**Causas:**
- Documento no tiene chunks indexados
- `chunksData` está null

**Solución:**
- Re-indexar el documento primero
- Esperar a que complete
- Cerrar y reabrir modal

### "Referencias no coinciden con chunk seleccionado"

**Esto es NORMAL si:**
- Pregunta es muy genérica
- Otros chunks son más relevantes
- Pregunta menciona conceptos de múltiples chunks

**Esto es PROBLEMA si:**
- Pregunta es MUY específica del chunk
- Similitud del chunk objetivo es baja (<50%)
- Nunca coincide incluso con preguntas directas

**Solución:** Bajar threshold a 0.2 temporalmente para testing

---

## 📝 Ejemplo Completo de Testing

```
1. Abrir modal de documento DDU-ESP-075-07.pdf
2. Click "Probar Documento Interactivamente"
3. Ver 3 chunks en panel izquierdo
4. Click en Chunk #0
5. Ver preguntas sugeridas en panel derecho
6. Click "¿Qué dice sobre escaleras?"
7. Click "Probar"
8. Ver pasos animados: Pensando → Buscando → Seleccionando → Generando
9. Ver respuesta streaming
10. Ver badge: "✓ Chunk objetivo referenciado" (verde) ✅
11. Scroll en respuesta → Ver footer "📚 Referencias utilizadas (1)"
12. Ver: [1] DDU.pdf - 87.3% similar - Chunk #0 ← ¡MATCH!
13. Click en [1] → Panel derecho se abre con texto completo del chunk
14. Verificar que es el mismo texto que viste en Chunk #0
15. ✅ VALIDACIÓN COMPLETA - RAG funciona correctamente!
```

---

**Status:** ✅ Listo para usar

**Comando para probar:**
```
1. Abre http://localhost:3000/chat
2. Settings del documento DDU-ESP-075-07.pdf
3. Scroll a "Indexación RAG"
4. Click botón morado "Probar Documento Interactivamente"
5. ¡A probar! 🚀
```

**Expected result:** Panel fullscreen con chunks a la izquierda y chat de prueba a la derecha, con validación automática de referencias.

