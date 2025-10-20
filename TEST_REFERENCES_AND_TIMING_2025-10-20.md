# Testing Guide: References & Timing Fix - 2025-10-20

## 🧪 Test Plan

### Pre-requisitos
- ✅ Dev server running on localhost:3000
- ✅ Usuario autenticado
- ✅ Agente con documento indexado con RAG (Cir32.pdf)
- ✅ RAG Mode activado en el agente

---

## Test 1: Timing de Thinking Steps

### Objetivo
Verificar que cada paso de "pensando" se muestre durante 3 segundos con puntos progresivos.

### Pasos:
1. Abrir chat con agente que tiene RAG activo
2. Enviar mensaje: "que sabemos de esto?"
3. **Observar progreso visual**

### Esperado:

```
⏱️  00:00 - 00:03
   🔄 Pensando...
   🔄 Pensando..
   🔄 Pensando.
   (puntos se animan cada 500ms)

⏱️  00:03 - 00:06
   ✓ Pensando...
   🔄 Buscando Contexto Relevante...
   🔄 Buscando Contexto Relevante..
   🔄 Buscando Contexto Relevante.

⏱️  00:06 - 00:09
   ✓ Pensando...
   ✓ Buscando Contexto Relevante...
   🔄 Seleccionando Chunks...
   🔄 Seleccionando Chunks..
   🔄 Seleccionando Chunks.

⏱️  00:09+
   ✓ Pensando...
   ✓ Buscando Contexto Relevante...
   ✓ Seleccionando Chunks...
   🔄 Generando Respuesta...
   [respuesta aparece en streaming]
```

### Verificar:
- [ ] Cada paso dura mínimo 3 segundos
- [ ] Los puntos se animan (1, 2, 3 puntos rotan)
- [ ] Estados cambian: pending → active → complete
- [ ] Iconos cambian: ⭕ → 🔄 (spinner) → ✓

### Console logs esperados:
```
🔍 [Streaming] Attempting RAG search...
  Configuration: topK=5, minSimilarity=0.5
✅ RAG: Using 3 relevant chunks (2023 tokens)
  Avg similarity: 76.3%
📚 Built references for message: 3
  [1] Cir32.pdf - 85.0% - Chunk #6
  [2] Cir32.pdf - 73.0% - Chunk #9
  [3] Cir32.pdf - 68.0% - Chunk #12
```

---

## Test 2: Uso de Chunks RAG (Sin Fallback)

### Objetivo
Verificar que cuando existen chunks, se usan sin caer a "fallback to full documents".

### Pasos:
1. Verificar que el documento tiene chunks en Firestore
2. Enviar mensaje que debe encontrar chunks relevantes
3. **Revisar console logs**

### Esperado en Console:
```
✅ RAG: Using X relevant chunks (Y tokens)
  Avg similarity: Z%

📚 Built references for message: X
  [1] Cir32.pdf - 85.0% - Chunk #6
  ...
```

### NO debe aparecer:
```
❌ "⚠️ RAG: No results above similarity threshold, falling back to full documents"
❌ "⚠️ RAG search failed, using full documents"
❌ "📎 Including full context from ... (full-text mode)"
```

### Verificar en Context Log:
```
Modo: 🔍 RAG (3 chunks) ← Debe decir RAG
Habilitado: Sí
Realmente usado: Sí ← NO debe decir "No (fallback)"
Fallback: No ← Debe ser "No"
```

---

## Test 3: Referencias Inline Clickeables

### Objetivo
Verificar que la respuesta incluye referencias [1], [2] clickeables que abren panel derecho.

### Pasos:
1. Enviar mensaje que requiere información de documentos
2. Esperar respuesta completa
3. **Verificar badges en el texto**

### Esperado en la respuesta:
```
La Ley N°19.537 [1] derogó la Ley N°6.071 [2]. 
                ^^^                      ^^^
            (badge azul)             (badge azul)
```

### Verificar visualmente:
- [ ] Números [1], [2], [3] son **badges azules** con border
- [ ] Badges tienen **hover effect** (bg-blue-200)
- [ ] Badges tienen **cursor pointer**
- [ ] Badges están en **superscript** (arriba del texto)

### Verificar interactividad:
1. **Hover sobre [1]**:
   - Debe cambiar color a más claro
   - Cursor cambia a pointer
   - Tooltip dice "Click para ver fuente"

2. **Click en [1]**:
   - Panel derecho aparece desde la derecha
   - Backdrop semitransparente
   - Panel muestra detalles del chunk

---

## Test 4: Panel Derecho (ReferencePanel)

### Objetivo
Verificar que el panel derecho muestra toda la información del chunk correctamente.

### Pasos:
1. Click en referencia [1]
2. **Verificar contenido del panel**

### Esperado:

```
┌─────────────────────────────────────────┐
│ 📄 Referencia [1]                    ✕ │
│ Cir32.pdf                               │
├─────────────────────────────────────────┤
│                                         │
│ Similitud: ████████░░ 85.0%            │
│            (barra verde si >80%)        │
│                                         │
│ Chunk #6 • 450 tokens                  │
│ 📄 Páginas 3-4                         │
│                                         │
│ Texto del chunk utilizado:              │
│                                         │
│ ┌─────────────────────────────────────┐│
│ │ [Texto completo del chunk]          ││
│ │ [Con fondo amarillo destacado]      ││
│ │ [Scroll si es muy largo]            ││
│ └─────────────────────────────────────┘│
│                                         │
│ 💡 Nota: Este extracto fue utilizado...│
│                                         │
│ ┌─────────────────────────────────────┐│
│ │ 🔗 Ver documento completo           ││
│ └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

### Verificar:
- [ ] Título muestra "Referencia [X]"
- [ ] Nombre de fuente visible (Cir32.pdf)
- [ ] Similitud con barra de progreso y %
- [ ] Chunk number visible (ej: Chunk #6)
- [ ] Token count visible
- [ ] Páginas visibles si hay metadata
- [ ] Texto completo del chunk con fondo amarillo
- [ ] Botón "Ver documento completo" funciona

### Cerrar panel:
- [ ] Click en X cierra
- [ ] Click en backdrop cierra  
- [ ] Presionar ESC cierra

---

## Test 5: Referencias Footer en Mensaje

### Objetivo
Verificar que al final de cada respuesta se muestra lista de referencias usadas.

### Esperado al final de la respuesta:

```
[Respuesta del AI con badges inline...]

────────────────────────────────────────

📚 Referencias utilizadas (3)

┌────────────────────────────────────────┐
│ [1] Cir32.pdf              85.0% ✓    │ ← Click abre panel
│     "las construcciones en..."         │
│     Chunk #6 • 450 tokens              │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ [2] Cir32.pdf              73.0% ✓    │
│     "la ley antigua ya no..."          │
│     Chunk #9 • 380 tokens              │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ [3] Cir32.pdf              68.0% ✓    │
│     "se aplica a las comunidades..."   │
│     Chunk #12 • 290 tokens             │
└────────────────────────────────────────┘
```

### Verificar:
- [ ] Sección "📚 Referencias utilizadas (X)" visible
- [ ] Muestra el número correcto de referencias
- [ ] Cada referencia es clickeable (hover effect)
- [ ] Similitud muestra con colores:
  - Verde: ≥80%
  - Amarillo: 60-79%
  - Naranja: <60%
- [ ] Snippet muestra preview del texto
- [ ] Click abre ReferencePanel

---

## Test 6: Context Log con Referencias

### Objetivo
Verificar que el log de contexto registra y muestra las referencias utilizadas.

### Pasos:
1. Después de recibir respuesta
2. Click en botón "Contexto: X%"
3. Scroll a "📊 Log de Contexto por Interacción"
4. Click en "▼ Ver detalles completos"
5. **Verificar sección de referencias**

### Esperado en tabla principal:

```
┌──────┬──────────┬───────┬──────┬───────┬────────┐
│ Hora │ Pregunta │ Modelo│ Modo │ Input │ Output │
├──────┼──────────┼───────┼──────┼───────┼────────┤
│12:35 │ que sa...│ Flash │🔍RAG │   40  │   453  │  ← Badge verde "RAG"
│      │          │       │3 chk │       │        │  ← Indica 3 chunks
└──────┴──────────┴───────┴──────┴───────┴────────┘
```

### Esperado en detalles expandidos:

```
#1 - 12:35:22 PM

Pregunta: "que sabemos de esto?"
Modelo: gemini-2.5-flash
System Prompt: Eres un asistente...

Fuentes activas:
• 🔍 Cir32.pdf (2,023 tokens - RAG) ← Indica modo RAG

🔍 Configuración RAG:
  Habilitado: Sí
  Realmente usado: Sí ← NO debe decir "No (fallback)"
  Fallback: No ← Debe ser "No"
  TopK: 5
  Similaridad mínima: 0.5
  ⚠️ Fallback: RAG no encontró chunks relevantes... ← NO debe aparecer

📚 Referencias utilizadas (3 chunks): ← NUEVA SECCIÓN
  ┌────────────────────────────────────┐
  │ [1] Cir32.pdf          85.0% ✓    │ ← Click abre panel
  │     "las construcciones en..."     │
  │     Chunk #6 • 450 tokens          │
  └────────────────────────────────────┘
  ...
```

### Verificar:
- [ ] Modo muestra "🔍 RAG (X chunks)"
- [ ] Configuración RAG correcta
- [ ] "Realmente usado: Sí" (no "fallback")
- [ ] Sección "📚 Referencias utilizadas" visible
- [ ] Cada referencia clickeable
- [ ] Click abre panel derecho

---

## Test 7: Retry Logic (Chunks con Baja Similitud)

### Objetivo
Verificar que si la primera búsqueda no encuentra chunks, hace retry con threshold más bajo.

### Setup:
1. Enviar pregunta muy específica o en diferente lenguaje
2. Que probablemente tenga similarity < 0.5 en primera búsqueda

### Expected Console Logs:
```
🔍 RAG Search starting...
  ✓ Loaded 45 chunks (156ms)
  ✓ Found 0 similar chunks (89ms)  ← Primera búsqueda vacía
⚠️ RAG: No chunks found above similarity threshold
  Checking if documents have chunks available...
  ✓ Chunks exist ← Chunks SÍ existen en Firestore
  Chunks exist, retrying with lower similarity threshold (0.3)...
🔍 RAG Search starting... ← RETRY
  ✓ Found 2 similar chunks (78ms) ← Encontró con threshold 0.3
✅ RAG (retry): Using 2 chunks with lower threshold
```

### NO debe aparecer:
```
❌ "⚠️ No chunks exist - using full documents as fallback"
```

### Verificar:
- [ ] Primera búsqueda intenta con threshold configurado (ej: 0.5)
- [ ] Si no encuentra, verifica si chunks existen
- [ ] Si existen, hace retry con threshold 0.3 y topK x2
- [ ] Usa chunks encontrados en retry
- [ ] Solo hace fallback si NO existen chunks o retry falla

---

## Test 8: Integration Test Completo

### Objetivo
Test end-to-end del flujo completo.

### Pasos:

1. **Setup inicial**:
   ```
   - Agente: M001
   - Contexto: Cir32.pdf (indexado con RAG)
   - RAG Mode: Activado
   - TopK: 5
   - MinSimilarity: 0.5
   ```

2. **Enviar mensaje**:
   ```
   "que sabemos de esto? Lo expuesto hasta ahora lleva a una 
   primera conclusión cual es que el caso en consulta debe 
   resolverse teniendo presente la Ley N°19.537"
   ```

3. **Observar progreso** (9-12 segundos):
   ```
   [00-03s] Pensando...
   [03-06s] Buscando Contexto Relevante...
   [06-09s] Seleccionando Chunks...
   [09s+]   Generando Respuesta...
   ```

4. **Verificar respuesta**:
   ```
   La frase "Lo expuesto hasta ahora lleva a una primera 
   conclusión cual es que el caso en consulta debe resolverse 
   teniendo presente la Ley N°19.537" significa lo siguiente, 
   según el contexto del documento:

   1. **Antecedentes Legales:** [1]
   2. **Derogación de la Ley Antigua:** [2]
   3. **Aplicación de la Nueva Ley:** [3]
   ...
   
   ────────────────────────────────────────
   📚 Referencias utilizadas (3)
   
   [1] Cir32.pdf - 85.0% • Chunk #6
       "El documento está analizando..."
   
   [2] Cir32.pdf - 73.0% • Chunk #9
       "Se establece en el punto 3..."
   
   [3] Cir32.pdf - 68.0% • Chunk #12
       "El punto 4 indica que..."
   ```

5. **Click en [1]**:
   - Panel derecho aparece
   - Muestra detalles del Chunk #6
   - Texto completo destacado
   - Similitud 85.0%

6. **Verificar Context Log**:
   - Click en "Contexto: X%"
   - Ver tabla con interacción
   - Modo: 🔍 RAG (3 chunks)
   - Click en "▼ Ver detalles completos"
   - Ver sección "📚 Referencias utilizadas (3 chunks)"
   - Click en referencia abre panel

### Checklist completo:
- [ ] Timing correcto (3s por paso)
- [ ] RAG encuentra chunks (no fallback)
- [ ] Respuesta incluye [1], [2], [3] inline
- [ ] Badges son clickeables
- [ ] Panel derecho muestra chunk completo
- [ ] Footer muestra lista de referencias
- [ ] Context log registra referencias
- [ ] Referencias en log son clickeables

---

## 🐛 Troubleshooting

### Issue 1: No aparecen badges [1], [2]

**Diagnóstico:**
```bash
# Ver console logs
# Buscar: "📚 MessageRenderer received references"
```

**Posibles causas:**
- AI no incluyó referencias en texto (revisar system instruction)
- Referencias no se pasaron a MessageRenderer
- Regex no encontró [X] en el texto

**Solución:**
- Verificar que `msg.references` tiene datos
- Verificar que MessageRenderer recibe `references` prop
- Ver console logs de MessageRenderer

---

### Issue 2: Dice "fallback" aunque hay chunks

**Diagnóstico:**
```bash
# Ver console logs
# Buscar: "⚠️ RAG:" o "falling back"
```

**Posibles causas:**
- Similarity threshold muy alto (>0.5)
- Query muy diferente del contenido de chunks
- Embeddings no generados correctamente

**Solución:**
- Verificar que retry logic se ejecuta
- Buscar: "Chunks exist, retrying with lower similarity"
- Si no aparece, chunks no existen en Firestore
- Correr: `npm run tsx scripts/check-embeddings-status.ts`

---

### Issue 3: Panel derecho no abre

**Diagnóstico:**
```bash
# Ver console
# Buscar: "🔍 Opening reference panel"
```

**Posibles causas:**
- Event listener no attached
- `onReferenceClick` no pasado como prop
- `setSelectedReference` no definido

**Solución:**
- Verificar que MessageRenderer tiene `onReferenceClick` prop
- Verificar que ChatInterface pasa callback
- Ver console.error

---

### Issue 4: Referencias no en Context Log

**Diagnóstico:**
```
Ver detalles expandibles del log
Buscar sección "📚 Referencias utilizadas"
```

**Posibles causas:**
- `log.references` es undefined o []
- Completion event no incluyó references
- Frontend no agregó references a log

**Solución:**
- Ver console log cuando se crea el log
- Buscar: "📚 Message saved with references: X"
- Verificar `data.references` en completion event

---

## ✅ Success Criteria

### Todos estos deben cumplirse:

#### Timing:
- [x] Pensando: 3 segundos
- [x] Buscando: 3 segundos  
- [x] Seleccionando: 3 segundos
- [x] Generando: variable (streaming)

#### RAG:
- [x] Usa chunks cuando existen
- [x] Hace retry si similarity baja
- [x] Solo fallback si NO existen chunks
- [x] Console logs claros sobre qué está pasando

#### Referencias:
- [x] AI incluye [1], [2], [3] inline
- [x] Badges son clickeables
- [x] Panel derecho muestra detalles
- [x] Footer muestra lista de referencias
- [x] Context log registra referencias

#### UX:
- [x] Progreso visual claro
- [x] Referencias fáciles de identificar
- [x] Click abre información detallada
- [x] Todo queda registrado en log

---

## 📝 Notas de Testing

### Documento de test recomendado:
- **Cir32.pdf**: Ya indexado, tiene chunks
- **Query test**: "que sabemos de esto? Lo expuesto hasta ahora..."
- **Expected**: 3 referencias con alta similitud

### Configuración RAG recomendada:
- TopK: 5
- MinSimilarity: 0.5
- Mode: RAG (no full-text)

### Browsers recomendados:
- Chrome/Edge: Para ver console logs
- DevTools abierto para monitoring

---

## 🎯 Estado Final Esperado

Después de todos los tests:

```
✅ Timing: 3s por paso con puntos progresivos
✅ RAG: Usa chunks sin reindexar
✅ References: Inline clickeables [1], [2], [3]
✅ Panel: Muestra chunk completo con metadata
✅ Footer: Lista de referencias
✅ Log: Registra y muestra referencias
✅ Backward compat: Mensajes viejos funcionan
```

**Status:** READY FOR USER TESTING 🚀

