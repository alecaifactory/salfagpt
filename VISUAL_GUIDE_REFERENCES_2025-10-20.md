# Visual Guide: References & Timing - 2025-10-20

## 📺 What You Should See

### 1. Thinking Steps Progress (9-12 seconds)

```
┌─────────────────────────────────────┐
│ SalfaGPT:                           │
│                                     │
│ 🔄 Pensando...                      │  ← 3 segundos
│ ⭕ Buscando Contexto Relevante...   │
│ ⭕ Seleccionando Chunks...          │
│ ⭕ Generando Respuesta...           │
└─────────────────────────────────────┘

         ↓ (después de 3s)

┌─────────────────────────────────────┐
│ SalfaGPT:                           │
│                                     │
│ ✓ Pensando...                       │
│ 🔄 Buscando Contexto Relevante...   │  ← 3 segundos
│ ⭕ Seleccionando Chunks...          │
│ ⭕ Generando Respuesta...           │
└─────────────────────────────────────┘

         ↓ (después de 3s más)

┌─────────────────────────────────────┐
│ SalfaGPT:                           │
│                                     │
│ ✓ Pensando...                       │
│ ✓ Buscando Contexto Relevante...    │
│ 🔄 Seleccionando Chunks...          │  ← 3 segundos
│ ⭕ Generando Respuesta...           │
└─────────────────────────────────────┘

         ↓ (después de 3s más)

┌─────────────────────────────────────┐
│ SalfaGPT:                           │
│                                     │
│ ✓ Pensando...                       │
│ ✓ Buscando Contexto Relevante...    │
│ ✓ Seleccionando Chunks...           │
│ 🔄 Generando Respuesta...           │  ← streaming
│                                     │
│ La frase "Lo expuesto hasta ahora   │
│ lleva a una primera conclusión..."  │
│ [texto aparece en tiempo real]      │
└─────────────────────────────────────┘
```

**Detalles importantes:**
- Cada paso muestra **spinner azul** (🔄) cuando está activo
- **Checkmark verde** (✓) cuando completa
- **Círculo gris** (⭕) cuando está pendiente
- Los puntos ... se animan (1, 2, 3 puntos rotan cada 500ms)

---

### 2. Respuesta con Referencias Inline

```
┌──────────────────────────────────────────────────────┐
│ SalfaGPT:                                            │
│                                                      │
│ La frase "Lo expuesto hasta ahora lleva a una        │
│ primera conclusión cual es que el caso en consulta   │
│ debe resolverse teniendo presente la Ley N°19.537"  │
│ significa lo siguiente, según el contexto del        │
│ documento:                                           │
│                                                      │
│ 1. **Antecedentes Legales:** El documento está      │
│    analizando una consulta sobre inmuebles que      │
│    originalmente estaban bajo la Ley N°6.071 sobre  │
│    Propiedad Horizontal [1] .                        │
│                           ^^^                        │
│                      (badge azul clickeable)         │
│                                                      │
│ 2. **Derogación de la Ley Antigua:** Se establece   │
│    en el punto 3 que la Ley N°19.537 sobre          │
│    Copropiedad Inmobiliaria derogó expresamente la   │
│    Ley N°6.071 [2] . Esto significa que la ley      │
│               ^^^                                    │
│          (badge azul clickeable)                     │
│    antigua ya no está vigente.                       │
│                                                      │
│ 3. **Aplicación de la Nueva Ley:** El punto 4       │
│    indica que la Ley N°19.537 se aplica a las       │
│    comunidades de copropietarios que antes estaban   │
│    acogidas a la Ley N°6.071 [3] , excepto en       │
│                               ^^^                    │
│                          (badge azul clickeable)     │
│    algunas materias muy específicas...               │
│                                                      │
│ ──────────────────────────────────────────────────  │
│                                                      │
│ 📚 Referencias utilizadas (3)                        │
│                                                      │
│ ┌──────────────────────────────────────────────┐    │
│ │ [1] Cir32.pdf                    85.0% ✓    │←Click│
│ │     "El documento está analizando una..."    │    │
│ │     Chunk #6 • 450 tokens                    │    │
│ └──────────────────────────────────────────────┘    │
│                                                      │
│ ┌──────────────────────────────────────────────┐    │
│ │ [2] Cir32.pdf                    73.0% ✓    │←Click│
│ │     "Se establece en el punto 3 que la..."   │    │
│ │     Chunk #9 • 380 tokens                    │    │
│ └──────────────────────────────────────────────┘    │
│                                                      │
│ ┌──────────────────────────────────────────────┐    │
│ │ [3] Cir32.pdf                    68.0% ✓    │←Click│
│ │     "El punto 4 indica que la Ley N°19..."  │    │
│ │     Chunk #12 • 290 tokens                   │    │
│ └──────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────┘
```

**Elementos a verificar:**
- [ ] Badges **[1]**, **[2]**, **[3]** son **azules** con border
- [ ] Badges tienen **hover effect** (más claro al pasar mouse)
- [ ] Cursor cambia a **pointer** (manita)
- [ ] Footer muestra **lista de referencias**
- [ ] Cada referencia muestra:
  - Badge [X]
  - Nombre de fuente
  - Similitud % (color-coded)
  - Snippet del texto
  - Chunk number y tokens
- [ ] Click en badge o en referencia del footer abre panel

---

### 3. Panel Derecho al Click en Referencia

```
                      ┌───────────────────────────────────┐
                      │ 📄 Referencia [1]              ✕ │
                      │ Cir32.pdf                         │
                      ├───────────────────────────────────┤
                      │                                   │
                      │ Similitud                         │
                      │ ████████░░ 85.0%                 │
                      │ (barra verde)                     │
                      │                                   │
                      │ Chunk #6 • 450 tokens            │
                      │ 📄 Páginas 3-4                   │
                      │                                   │
                      │ ─────────────────────────────── │
                      │                                   │
                      │ Texto del chunk utilizado:        │
                      │                                   │
                      │ ┌───────────────────────────────┐ │
                      │ │ El documento está analizando  │ │
                      │ │ una consulta (un "caso en     │ │
                      │ │ consulta") sobre inmuebles    │ │
                      │ │ que originalmente estaban     │ │
                      │ │ bajo la Ley N°6.071 sobre     │ │
                      │ │ Propiedad Horizontal. Se      │ │
                      │ │ estableció en el punto 3...   │ │
                      │ └───────────────────────────────┘ │
                      │ (fondo amarillo, scroll si largo) │
                      │                                   │
                      │ ┌───────────────────────────────┐ │
                      │ │ 💡 Este extracto fue usado... │ │
                      │ └───────────────────────────────┘ │
                      │                                   │
                      │ ┌───────────────────────────────┐ │
                      │ │ 🔗 Ver documento completo     │ │
                      │ └───────────────────────────────┘ │
                      │                                   │
                      │ Presiona ESC o click afuera       │
                      └───────────────────────────────────┘
```

**Elementos a verificar:**
- [ ] Panel aparece desde la **derecha**
- [ ] **Backdrop** semitransparente detrás
- [ ] Header con **título "Referencia [X]"**
- [ ] **Nombre de fuente** visible (Cir32.pdf)
- [ ] **Barra de similitud** con color (verde >80%, amarillo >60%, naranja <60%)
- [ ] **Chunk number** visible (ej: Chunk #6)
- [ ] **Token count** visible (ej: 450 tokens)
- [ ] **Páginas** si hay metadata
- [ ] **Texto completo** con fondo amarillo destacado
- [ ] **Botón** "Ver documento completo" presente
- [ ] **Click en X** cierra panel
- [ ] **Click en backdrop** cierra panel
- [ ] **Presionar ESC** cierra panel

---

### 4. Context Log con Referencias

```
┌────────────────────────────────────────────────────────┐
│ Contexto: 0.05% • ✨ Gemini 2.5 Flash • 1 fuentes    │ ← Click aquí
└────────────────────────────────────────────────────────┘
         ↓ (se expande)

┌────────────────────────────────────────────────────────┐
│ Desglose del Contexto                       0.05% usado│
├────────────────────────────────────────────────────────┤
│ Total Tokens: 493 | Disponible: 999,507 | Cap: 1000K  │
│                                                        │
│ 📊 Desglose Detallado                                 │
│   System Prompt: 15 tokens                            │
│   Historial (1 mensajes): 10 tokens                   │
│   Contexto de Fuentes: 🔍 1 RAG • 468 tokens         │
│                        ^^^^^^                          │
│                    (badge verde "RAG")                 │
│                                                        │
│ ─────────────────────────────────────────────────── │
│                                                        │
│ 📊 Log de Contexto por Interacción                    │
│                                                        │
│ ┌─────┬──────────┬──────┬──────┬─────┬──────┬────┐   │
│ │Hora │ Pregunta │Modelo│ Modo │Input│Output│Uso%│   │
│ ├─────┼──────────┼──────┼──────┼─────┼──────┼────┤   │
│ │12:35│ que sa...│Flash │🔍RAG │  40 │  453 │0.05│   │
│ │     │          │      │3 chk │     │      │    │   │
│ └─────┴──────────┴──────┴──────┴─────┴──────┴────┘   │
│                                      ^^^^^^            │
│                                  (verde "RAG")         │
│                                  (NO amarillo "Full")  │
│                                                        │
│ ▼ Ver detalles completos de cada interacción          │
│                                                        │
│ #1 - 12:35:22 PM                                      │
│                                                        │
│ Pregunta: que sabemos de esto? "Lo expuesto hasta..." │
│ Modelo: gemini-2.5-flash                              │
│ System Prompt: Eres un asistente de IA útil...        │
│                                                        │
│ Fuentes activas:                                      │
│ • 🔍 Cir32.pdf (2,023 tokens - RAG)                   │
│       ^^^^^^                                           │
│   (ícono verde "RAG" - NO azul "Full")                │
│                                                        │
│ 🔍 Configuración RAG:                                 │
│   Habilitado: Sí                                      │
│   Realmente usado: Sí ← NO "No (fallback)"           │
│   Fallback: No ← Debe decir "No"                     │
│   TopK: 5                                             │
│   Similaridad mínima: 0.5                             │
│   ✅ RAG Optimizado: 3 chunks relevantes              │
│       Avg Similarity: 76.3%                           │
│       Total Tokens: 1,120                             │
│                                                        │
│ 📚 Referencias utilizadas (3 chunks): ← NUEVA SECCIÓN│
│                                                        │
│ ┌──────────────────────────────────────────────┐     │
│ │ [1] Cir32.pdf                    85.0% ✓    │←Click│
│ │     "El documento está analizando una..."    │     │
│ │     Chunk #6 • 450 tokens                    │     │
│ └──────────────────────────────────────────────┘     │
│                                                        │
│ ┌──────────────────────────────────────────────┐     │
│ │ [2] Cir32.pdf                    73.0% ✓    │←Click│
│ │     "Se establece en el punto 3 que la..."   │     │
│ │     Chunk #9 • 380 tokens                    │     │
│ └──────────────────────────────────────────────┘     │
│                                                        │
│ ┌──────────────────────────────────────────────┐     │
│ │ [3] Cir32.pdf                    68.0% ✓    │←Click│
│ │     "El punto 4 indica que la Ley N°19..."  │     │
│ │     Chunk #12 • 290 tokens                   │     │
│ └──────────────────────────────────────────────┘     │
│                                                        │
│ Respuesta: [ver respuesta completa arriba]           │
└────────────────────────────────────────────────────────┘
```

---

## 🎨 Color Coding

### Thinking Steps:
- **Pending** (⭕): Círculo gris, texto gris claro
- **Active** (🔄): Spinner azul, texto negro bold
- **Complete** (✓): Checkmark verde, texto gris

### RAG Mode Badge:
- **🔍 RAG**: Verde (`bg-green-100 text-green-700`)
- **⚠️ Full**: Amarillo (`bg-yellow-100 text-yellow-700`) - solo si fallback
- **📝 Full**: Azul (`bg-blue-100 text-blue-700`) - si RAG desactivado

### Similarity Colors:
- **≥80%**: Verde (`bg-green-100 text-green-700`)
- **60-79%**: Amarillo (`bg-yellow-100 text-yellow-700`)
- **<60%**: Naranja (`bg-orange-100 text-orange-700`)

### Reference Badges:
- **Default**: `bg-blue-100 text-blue-700 border-blue-300`
- **Hover**: `bg-blue-200 border-blue-400`
- **Font**: Bold, pequeño (text-sm)
- **Position**: Superscript (arriba del texto)

---

## 🖱️ Interacciones

### Hover sobre badge [X]:
```
┌─────────────────────┐
│ [1]                 │ ← Cursor: pointer
│ ^^^                 │ ← Background: más claro
│ Border: más oscuro  │
│ Tooltip: "Click..." │
└─────────────────────┘
```

### Click en badge [X]:
```
[Badge] → Click → onReferenceClick(reference)
                      ↓
                setSelectedReference(reference)
                      ↓
                ReferencePanel appears
                      ↓
                Backdrop dims screen
                      ↓
                Panel slides in from right
```

### Click en referencia del footer:
```
[Referencia card] → Click → Same as badge click
                           ↓
                     Opens ReferencePanel
```

### Click en referencia del context log:
```
[Referencia en log] → Click → Opens ReferencePanel
                              ↓
                        Shows chunk details
```

---

## ⚠️ Lo que NO debe aparecer

### ❌ En Console:
```
❌ "⚠️ RAG: No results above similarity threshold, falling back to full documents"
❌ "⚠️ RAG search failed, using full documents"
❌ "📎 Including full context from X active sources (full-text mode)"
   (si RAG está activado y hay chunks disponibles)
```

### ❌ En UI:
```
❌ Modo: ⚠️ Full (fallback)
        ^^^^^^^^^^^^^^^^
   (si hay chunks disponibles)

❌ Realmente usado: No (fallback)
                   ^^^^^^^^^^^^^^
   (si hay chunks disponibles)

❌ ⚠️ Fallback: RAG no encontró chunks relevantes, usó documentos completos
   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
   (si hay chunks y se hizo retry exitoso)
```

---

## ✅ Lo que SÍ debe aparecer

### ✅ En Console:
```
✅ "🔍 RAG Search starting..."
✅ "✓ Loaded X chunks"
✅ "✓ Found Y similar chunks"
✅ "✅ RAG: Using Y relevant chunks (Z tokens)"
✅ "  Avg similarity: XX.X%"
✅ "📚 Built references for message: Y"
✅ "  [1] Cir32.pdf - 85.0% - Chunk #6"
```

### ✅ En UI - Respuesta:
```
✅ Badges [1], [2], [3] azules inline
✅ Footer "📚 Referencias utilizadas (X)"
✅ Lista de referencias clickeables
```

### ✅ En UI - Context Log:
```
✅ Modo: 🔍 RAG (X chunks) ← Verde
✅ Habilitado: Sí
✅ Realmente usado: Sí ← Sin "fallback"
✅ Fallback: No
✅ Sección "📚 Referencias utilizadas (X chunks)"
✅ Referencias clickeables
```

---

## 🎯 Quick Verification Steps

1. **Start test:**
   - Open http://localhost:3000/chat
   - Login and select agent M001
   - Verify Cir32.pdf is active (toggle ON)

2. **Send message:**
   ```
   que sabemos de esto? "Lo expuesto hasta ahora lleva a una 
   primera conclusión cual es que el caso en consulta debe 
   resolverse teniendo presente la Ley N°19.537"
   ```

3. **Watch progress (should take ~9-12s):**
   - [ ] Pensando... (3s)
   - [ ] Buscando... (3s)
   - [ ] Seleccionando... (3s)
   - [ ] Generando... (streaming)

4. **Check response:**
   - [ ] Has blue badges [1], [2], [3]
   - [ ] Has footer with references
   - [ ] Click badge opens panel
   - [ ] Panel shows chunk details

5. **Check context log:**
   - [ ] Click "Contexto: X%"
   - [ ] Mode shows "🔍 RAG (X chunks)" (green)
   - [ ] Expand details
   - [ ] See "📚 Referencias utilizadas"
   - [ ] Click reference opens panel

6. **Console verification:**
   ```
   ✅ Look for: "✅ RAG: Using X relevant chunks"
   ✅ Look for: "📚 Built references for message: X"
   ❌ Should NOT see: "falling back to full documents"
   ```

---

## 🎬 Expected User Experience

### Timeline:
```
00:00 - User sends message
        ↓
00:00 - Sees "Pensando..." with animated dots
        ↓
00:03 - Changes to "Buscando Contexto Relevante..."
        ↓
00:06 - Changes to "Seleccionando Chunks..."
        ↓
00:09 - Changes to "Generando Respuesta..."
        ↓
00:10 - First words of response appear
        ↓
00:12 - Response complete with [1], [2], [3] badges
        ↓
00:13 - User hovers over [1] - sees it's clickable
        ↓
00:14 - User clicks [1] - panel opens from right
        ↓
00:15 - User reads chunk #6 details
        ↓
00:16 - User clicks X to close panel
        ↓
00:17 - User clicks "Contexto: X%" to see log
        ↓
00:18 - User sees "🔍 RAG (3 chunks)" - no fallback!
        ↓
00:19 - User expands details
        ↓
00:20 - User sees all 3 references listed
        ↓
00:21 - User clicks reference in log
        ↓
00:22 - Panel opens again with chunk details
        ↓
✅ User understands exactly what chunks were used!
```

---

## 💡 Key Improvements

### Before:
- ❌ Steps showed instantly (no timing)
- ❌ Said "fallback" even when chunks existed
- ❌ No inline references in response
- ❌ No way to see which chunks were used
- ❌ No traceability

### After:
- ✅ Each step shows 3 seconds (visual feedback)
- ✅ Uses chunks when they exist (retry logic)
- ✅ Inline references [1], [2], [3] clickeable
- ✅ Panel shows exact chunk used
- ✅ Footer lists all references
- ✅ Context log tracks everything
- ✅ Complete traceability

---

**Estado:** IMPLEMENTED AND READY TO TEST ✅

**Próximo paso:** Test manually in browser - follow checklist above! 🧪

