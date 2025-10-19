# 🎨 RAG Configuration UI - Visual Mockup

---

## 📱 User Settings Modal (New Section)

```
┌─────────────────────────────────────────────────────────────────────┐
│  ⚙️ Configuración de Usuario                                    [X]│
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  [Modelo Preferido] │ [RAG Settings] │ [System Prompt] │ [Theme]   │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  🔍 Búsqueda Vectorial (RAG)                                       │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                                                              │  │
│  │  ¿Qué es RAG?                                                │  │
│  │                                                              │  │
│  │  En vez de enviar documentos completos al AI,               │  │
│  │  RAG busca y envía SOLO los fragmentos más relevantes.      │  │
│  │                                                              │  │
│  │  Resultado: Respuestas más rápidas, precisas y económicas.  │  │
│  │                                                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌─────────────────────────────────────────────────────┐           │
│  │ Activar Búsqueda Vectorial                 [🟢 ON] │           │
│  └─────────────────────────────────────────────────────┘           │
│                                                                     │
│  ┌──────────────┬──────────────┬──────────────┐                    │
│  │  Eficiencia  │   Precisión  │   Velocidad  │                    │
│  │              │              │              │                    │
│  │  📉 95%      │  🎯 Solo lo  │  ⚡ 2-3x     │                    │
│  │  menos       │  relevante   │  más rápido  │                    │
│  │  tokens      │              │              │                    │
│  └──────────────┴──────────────┴──────────────┘                    │
│                                                                     │
│  Configuración Avanzada ↓                                           │
│                                                                     │
│  ┌─────────────────────────────────────────────────────┐           │
│  │ Fragmentos a recuperar                              │           │
│  │ ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐        │           │
│  │ │  3  │  5  │  7  │ 10  │ 15  │ 20  │ 30  │        │           │
│  │ └─────┴─────┴──●──┴─────┴─────┴─────┴─────┘        │           │
│  │        ← Menos     Óptimo     Más →                 │           │
│  │                                                     │           │
│  │ Actualmente: 5 fragmentos                           │           │
│  │ Tokens promedio: 2,500 (vs 50,000 sin RAG)         │           │
│  └─────────────────────────────────────────────────────┘           │
│                                                                     │
│  ┌─────────────────────────────────────────────────────┐           │
│  │ Tamaño de fragmento                                 │           │
│  │ ┌─────┬─────┬─────┬─────┬─────┐                    │           │
│  │ │ 250 │ 500 │ 750 │1000 │1500 │                    │           │
│  │ └─────┴──●──┴─────┴─────┴─────┘                    │           │
│  │  ← Preciso     Balanceado     Contexto →           │           │
│  │                                                     │           │
│  │ Actualmente: 500 tokens por fragmento               │           │
│  │ Chunks totales: ~100 por documento de 100 páginas  │           │
│  └─────────────────────────────────────────────────────┘           │
│                                                                     │
│  ┌─────────────────────────────────────────────────────┐           │
│  │ Similaridad mínima                                  │           │
│  │ ┌──────┬──────┬──────┬──────┬──────┐               │           │
│  │ │ 0.3  │ 0.5  │ 0.7  │ 0.8  │ 0.9  │               │           │
│  │ └──────┴───●──┴──────┴──────┴──────┘               │           │
│  │  ← Permisivo     Estricto →                        │           │
│  │                                                     │           │
│  │ Actualmente: 0.5 (50% similar o más)                │           │
│  │ Fragmentos con menor similaridad serán excluidos    │           │
│  └─────────────────────────────────────────────────────┘           │
│                                                                     │
│                                              [Guardar Configuración]│
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📄 Per-Document Settings (Context Source Modal)

```
┌─────────────────────────────────────────────────────────────────────┐
│  ⚙️ Configuración de Fuente                                     [X]│
│  Normativa OGUC.pdf                                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  [Fuente Original] │ [Extracción] │ [RAG Settings] │ [Validación]  │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  🔍 Configuración de Búsqueda Vectorial                             │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                                                              │  │
│  │  Estado de Indexación                                        │  │
│  │                                                              │  │
│  │  ✅ Indexado para RAG                                        │  │
│  │                                                              │  │
│  │  Detalles:                                                   │  │
│  │  • Total de fragmentos: 89                                   │  │
│  │  • Modelo de embeddings: text-embedding-004                  │  │
│  │  • Dimensiones: 768                                          │  │
│  │  • Tamaño de chunk: 500 tokens                               │  │
│  │  • Indexado: 2025-10-18 14:30:00                             │  │
│  │                                                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌─────────────────────────────────────────────────────┐           │
│  │ Activar RAG para esta fuente           [🟢 ON]     │           │
│  └─────────────────────────────────────────────────────┘           │
│                                                                     │
│  Opciones de RAG:                                                   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────┐           │
│  │ Tamaño de fragmento                                 │           │
│  │ ┌──────────┬──────────┬──────────┐                 │           │
│  │ │   250    │   500    │  1000    │                 │           │
│  │ │ Pequeño  │ Óptimo ● │  Grande  │                 │           │
│  │ └──────────┴──────────┴──────────┘                 │           │
│  └─────────────────────────────────────────────────────┘           │
│                                                                     │
│  ┌─────────────────────────────────────────────────────┐           │
│  │ Fragmentos a recuperar por consulta                 │           │
│  │ [5] ▼  (Rango: 3-20)                                │           │
│  └─────────────────────────────────────────────────────┘           │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                                                              │  │
│  │  💡 Re-indexar con Nueva Configuración                       │  │
│  │                                                              │  │
│  │  Si cambias el tamaño de fragmento, necesitas re-indexar.   │  │
│  │  Esto procesará el documento nuevamente.                    │  │
│  │                                                              │  │
│  │  Costo estimado: $0.01                                       │  │
│  │  Tiempo estimado: 15 segundos                                │  │
│  │                                                              │  │
│  │                       [🔄 Re-indexar Documento]              │  │
│  │                                                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│                                                          [Cerrar]   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 💬 Context Panel (During Chat)

```
┌─────────────────────────────────────────────────────────────────────┐
│  Desglose del Contexto                                      0.5% ✨ │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ 🔍 Búsqueda Vectorial Activa                        [Detalles]│  │
│  │                                                              │  │
│  │ Se encontraron 5 fragmentos relevantes de 234 disponibles   │  │
│  │                                                              │  │
│  │ Ahorro de tokens: 95.2%                                      │  │
│  │ (2,500 tokens enviados vs 52,000 sin RAG)                   │  │
│  │                                                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  Fragmentos Recuperados:                                            │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ 📄 Normativa OGUC.pdf                               [Ver más]│  │
│  │                                                              │  │
│  │ ✓ Chunk 23  (Relevancia: 89%)                    500 tokens │  │
│  │   "Las construcciones en subterráneo deben cumplir..."      │  │
│  │   [Click para ver fragmento completo]                        │  │
│  │                                                              │  │
│  │ ✓ Chunk 45  (Relevancia: 84%)                    487 tokens │  │
│  │   "Los distanciamientos mínimos establecidos..."            │  │
│  │                                                              │  │
│  │ ✓ Chunk 67  (Relevancia: 79%)                    512 tokens │  │
│  │   "Para construcciones de más de 3 pisos..."                │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ 📄 Manual Construcción.pdf                          [Ver más]│  │
│  │                                                              │  │
│  │ ✓ Chunk 12  (Relevancia: 71%)                    495 tokens │  │
│  │   "El proceso de excavación requiere..."                    │  │
│  │                                                              │  │
│  │ ✓ Chunk 89  (Relevancia: 68%)                    506 tokens │  │
│  │   "Las medidas de seguridad incluyen..."                    │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  Total tokens usado: 2,500                                          │
│  Total tokens disponible: 997,500                                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Context Logs Table (New Column)

```
┌────┬──────────┬────────┬───────┬────────┬───────┬──────────┬────────┬──────────┐
│ #  │ Hora     │ Modelo │ Input │ Output │ Total │ Disponib │  Uso%  │   RAG    │
├────┼──────────┼────────┼───────┼────────┼───────┼──────────┼────────┼──────────┤
│ 1  │ 14:32:15 │ Flash  │ 52.5K │  487   │ 53K   │  947K    │  5.3%  │    -     │
│    │          │        │       │        │       │          │        │  Sin RAG │
├────┼──────────┼────────┼───────┼────────┼───────┼──────────┼────────┼──────────┤
│ 2  │ 14:35:22 │ Flash  │  2.8K │  523   │  3.3K │  996.7K  │  0.3%  │ ✓ 5 ch   │
│    │          │        │       │        │       │          │        │ 95% less │
├────┼──────────┼────────┼───────┼────────┼───────┼──────────┼────────┼──────────┤
│ 3  │ 14:38:45 │ Pro    │  3.1K │  612   │  3.7K │ 1,996K   │  0.2%  │ ✓ 7 ch   │
│    │          │        │       │        │       │          │        │ 94% less │
└────┴──────────┴────────┴───────┴────────┴───────┴──────────┴────────┴──────────┘
                                                                         ↑
                                                                   New column:
                                                                   Shows RAG used
                                                                   + chunk count
                                                                   + savings %
```

**Click on RAG cell** → Expands to show which chunks were retrieved

---

## 🎯 Expanded Row Details (On Click)

```
┌─────────────────────────────────────────────────────────────────────┐
│  Detalles de Interacción #2                                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Pregunta del Usuario:                                              │
│  "¿Cuáles son los requisitos para construcciones en subterráneo?"  │
│                                                                     │
│  🔍 RAG Search Results:                                             │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 📄 Normativa OGUC.pdf                                       │   │
│  │                                                             │   │
│  │ 1. Chunk 23 - Relevancia: 89%                    500 tokens│   │
│  │    "Las construcciones en subterráneo deben cumplir con    │   │
│  │     las disposiciones sobre distanciamientos o zonas       │   │
│  │     inexcavables que hayan sido establecidas..."           │   │
│  │    [Ver contexto completo en documento]                     │   │
│  │                                                             │   │
│  │ 2. Chunk 45 - Relevancia: 84%                    487 tokens│   │
│  │    "Los distanciamientos mínimos para construcciones       │   │
│  │     subterráneas son de 3 metros desde el límite..."       │   │
│  │    [Ver contexto completo en documento]                     │   │
│  │                                                             │   │
│  │ 3. Chunk 67 - Relevancia: 79%                    512 tokens│   │
│  │    "Para construcciones de más de 3 pisos bajo nivel       │   │
│  │     de calle, se requiere estudio geotécnico..."           │   │
│  │    [Ver contexto completo en documento]                     │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 📄 Manual Construcción.pdf                                  │   │
│  │                                                             │   │
│  │ 4. Chunk 12 - Relevancia: 71%                    495 tokens│   │
│  │    "El proceso de excavación requiere permisos especiales   │   │
│  │     cuando se supera los 5 metros de profundidad..."       │   │
│  │                                                             │   │
│  │ 5. Chunk 89 - Relevancia: 68%                    506 tokens│   │
│  │    "Las medidas de seguridad para trabajos en subterráneo  │   │
│  │     incluyen sistemas de ventilación y monitoreo..."       │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Resumen de Tokens:                                                 │
│  • RAG chunks: 2,500 tokens                                         │
│  • Sin RAG habría sido: 52,000 tokens                              │
│  • Ahorro: 95.2% 🎉                                                 │
│                                                                     │
│  Respuesta del AI:                                                  │
│  [Respuesta completa aquí...]                                       │
│                                                                     │
│                                                          [Cerrar]   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📈 Analytics Dashboard (Future)

```
┌─────────────────────────────────────────────────────────────────────┐
│  📊 Analytics - RAG Performance                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Last 30 Days                                                       │
│                                                                     │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐     │
│  │ Total Queries│  With RAG    │  Without RAG │  Avg Savings │     │
│  │             │              │              │              │     │
│  │    1,245     │    987       │     258      │     93.4%    │     │
│  │              │  (79.3%)     │   (20.7%)    │              │     │
│  └──────────────┴──────────────┴──────────────┴──────────────┘     │
│                                                                     │
│  Token Usage Comparison:                                            │
│                                                                     │
│  Without RAG:  ████████████████████████████████████████  52,000    │
│  With RAG:     ██  2,500                                            │
│                                                                     │
│  Cost Savings:                                                      │
│                                                                     │
│  ┌──────────────┬──────────────┬──────────────┐                    │
│  │ This Month   │  Last Month  │  Total Saved │                    │
│  │             │              │              │                    │
│  │   $0.42      │   $47.35     │   $46.93     │                    │
│  │  (with RAG)  │ (no RAG)     │  (99.1%)     │                    │
│  └──────────────┴──────────────┴──────────────┘                    │
│                                                                     │
│  Top Documents by RAG Usage:                                        │
│                                                                     │
│  1. Normativa OGUC.pdf         - 234 queries - 96% avg savings     │
│  2. Manual Construcción.pdf    - 189 queries - 94% avg savings     │
│  3. DDU 189.pdf                - 156 queries - 97% avg savings     │
│                                                                     │
│  Search Quality Metrics:                                            │
│                                                                     │
│  ┌──────────────┬──────────────┬──────────────┐                    │
│  │ Avg Chunks   │  Avg Similarity │  Fallbacks  │                    │
│  │             │              │              │                    │
│  │     5.2      │    0.76      │    23 (2.3%) │                    │
│  └──────────────┴──────────────┴──────────────┘                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔔 Notifications/Toasts

### When RAG Indexing Completes

```
┌─────────────────────────────────────────┐
│ ✅ Documento Indexado para RAG          │
│                                         │
│ Normativa OGUC.pdf                      │
│ • 89 fragmentos creados                 │
│ • Listo para búsqueda optimizada        │
│                                         │
│              [Ver Detalles]    [OK]     │
└─────────────────────────────────────────┘
```

### When RAG Search Active

```
┌─────────────────────────────────────────┐
│ 🔍 Búsqueda Vectorial                   │
│                                         │
│ Encontrados 5 fragmentos relevantes     │
│ Ahorro: 95% de tokens                   │
│                                         │
│ ⚡ Respuesta optimizada en proceso...   │
└─────────────────────────────────────────┘
```

### When RAG Disabled (Fallback)

```
┌─────────────────────────────────────────┐
│ ℹ️ Usando Documento Completo            │
│                                         │
│ RAG no disponible para esta fuente      │
│ (puedes re-procesar para activar RAG)   │
│                                         │
│              [Re-procesar]     [OK]     │
└─────────────────────────────────────────┘
```

---

## 🎨 Visual Feedback in Source Card

### Source Card - RAG Enabled

```
┌─────────────────────────────────────────────────────────┐
│ 📄 Normativa OGUC.pdf                        [⚙️] [🟢] │
│                                                         │
│ ✓ Validado                                              │
│ ✓ Indexado para RAG (89 chunks)            ← NEW       │
│                                                         │
│ Extracto: "Las construcciones en subterráneo deben..."  │
│                                                         │
│ ┌─────────────┬─────────────┬─────────────┐             │
│ │ 📊 89 págs  │ 🔍 89 chunks│ ⚡ RAG ON   │             │
│ └─────────────┴─────────────┴─────────────┘             │
└─────────────────────────────────────────────────────────┘
       ↑                ↑              ↑
    Original      Vector Index    Search Active
```

### Source Card - RAG Not Indexed

```
┌─────────────────────────────────────────────────────────┐
│ 📄 Old Document.pdf                          [⚙️] [🟢] │
│                                                         │
│ ⚠️ No indexado para RAG                     ← NEW      │
│ Click "Re-procesar" para activar búsqueda optimizada    │
│                                                         │
│ Extracto: "Contenido del documento viejo..."            │
│                                                         │
│ ┌─────────────┬─────────────┬─────────────┐             │
│ │ 📊 45 págs  │ 📝 Full text│ [Re-procesar]│             │
│ └─────────────┴─────────────┴─────────────┘             │
└─────────────────────────────────────────────────────────┘
```

---

## 🎬 Upload Flow (New Steps)

```
Step 1: Select File
┌─────────────────────────────────────┐
│  📤 Upload Document                  │
│                                     │
│  Drag & drop or click               │
│                                     │
│  [Select File: OGUC.pdf]            │
│                                     │
└─────────────────────────────────────┘

Step 2: Configure Extraction
┌─────────────────────────────────────┐
│  ⚙️ Extraction Settings              │
│                                     │
│  Model: ○ Flash  ● Pro              │
│                                     │
│  NEW: RAG Settings                   │
│  ┌─────────────────────────────┐   │
│  │ Enable Vector Search [🟢 ON]│   │
│  │                             │   │
│  │ • 10x more efficient        │   │
│  │ • Better search             │   │
│  │ • +$0.01 indexing cost      │   │
│  └─────────────────────────────┘   │
│                                     │
│          [Process Document]         │
└─────────────────────────────────────┘

Step 3: Processing (Extended)
┌─────────────────────────────────────┐
│  ⏳ Processing Document              │
│                                     │
│  ✓ Uploaded to Cloud Storage        │
│  ✓ Extracting with Gemini Pro...    │
│    Progress: ████████░░░░ 65%       │
│                                     │
│  NEW: Preparing for RAG Search...   │
│  ┌─────────────────────────────┐   │
│  │ Creating chunks...    [3/4] │   │
│  │ ✓ Split into 89 chunks      │   │
│  │ ⏳ Generating embeddings...  │   │
│  │    Progress: ████░░░░ 45%   │   │
│  │    (40/89 completed)        │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘

Step 4: Complete
┌─────────────────────────────────────┐
│  ✅ Document Ready                  │
│                                     │
│  Normativa OGUC.pdf                 │
│                                     │
│  ✓ Extracted: 48,234 tokens         │
│  ✓ Indexed: 89 chunks               │
│  ✓ Ready for optimized search       │
│                                     │
│  Ahorro estimado: 95% de tokens     │
│  por consulta                       │
│                                     │
│          [Start Using]              │
└─────────────────────────────────────┘
```

---

## 💡 Tooltips & Help

### RAG Toggle (Hover)

```
┌─────────────────────────────────────────────────────────┐
│  🔍 Búsqueda Vectorial (RAG)                [Toggle]    │
│                                                         │
│  ℹ️  ¿Qué es RAG?                          ← Hover     │
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                 │   │
│  │ RAG = Retrieval-Augmented Generation            │   │
│  │                                                 │   │
│  │ En vez de enviar documentos completos:          │   │
│  │                                                 │   │
│  │ ❌ Sin RAG: 50,000 tokens por pregunta          │   │
│  │ ✅ Con RAG: 2,500 tokens (solo lo relevante)    │   │
│  │                                                 │   │
│  │ Beneficios:                                     │   │
│  │ • 95% menos tokens                              │   │
│  │ • Respuestas 2x más rápidas                     │   │
│  │ • 99% más económico                             │   │
│  │ • Soporta 100x más documentos                   │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Chunk Count Slider (Hover)

```
┌─────────────────────────────────────────┐
│ Fragmentos a recuperar:  [5] ▼          │
│                                         │
│ ℹ️  Recomendación                       │
│ ┌───────────────────────────────────┐   │
│ │                                   │   │
│ │ • 3-5: Preguntas específicas      │   │
│ │ • 5-7: Balanceado (recomendado)   │   │
│ │ • 10-15: Preguntas complejas      │   │
│ │ • 20+: Resúmenes/contexto amplio  │   │
│ │                                   │   │
│ └───────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

---

## 🎯 Decision Tree for Users

```
                    ¿Activar RAG?
                         │
        ┌────────────────┴────────────────┐
        │                                 │
        ▼                                 ▼
   Documentos < 5 páginas          Documentos > 10 páginas
   Pocas fuentes activas           Muchas fuentes activas
        │                                 │
        ▼                                 ▼
   [RAG opcional]                    [RAG recomendado]
   Poco beneficio                    Gran beneficio
        │                                 │
        └────────────────┬────────────────┘
                         │
                         ▼
              ¿Cuántos chunks recuperar?
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
   Pregunta         Pregunta        Resumen/
   específica       compleja        Overview
        │                │                │
        ▼                ▼                ▼
      3-5             7-10             15-20
     chunks           chunks           chunks
```

---

## 🔢 Cost Comparison Calculator UI

```
┌─────────────────────────────────────────────────────────┐
│  💰 Calculadora de Ahorro con RAG                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Tu Uso:                                                │
│  • Documentos: [10] ▼                                   │
│  • Páginas promedio: [100] ▼                            │
│  • Preguntas/mes: [100] ▼                               │
│  • Modelo: ○ Flash  ● Pro                               │
│                                                         │
│  ───────────────────────────────────────────────────    │
│                                                         │
│  Resultados:                                            │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │          Sin RAG        │      Con RAG          │   │
│  ├─────────────────────────┼───────────────────────┤   │
│  │ Tokens/pregunta:        │                       │   │
│  │   50,000                │   2,500 ✨           │   │
│  │                         │                       │   │
│  │ Tokens/mes:             │                       │   │
│  │   5,000,000             │   250,000 ✨         │   │
│  │                         │                       │   │
│  │ Costo/mes (Pro):        │                       │   │
│  │   $62.50                │   $0.31 ✨           │   │
│  │                         │                       │   │
│  │ Tiempo respuesta:       │                       │   │
│  │   4.2s                  │   1.8s ⚡            │   │
│  └─────────────────────────┴───────────────────────┘   │
│                                                         │
│  💰 Ahorro Mensual: $62.19 (99.5%)                      │
│  💰 Ahorro Anual: $746.28                               │
│                                                         │
│  Setup único: $0.10 (indexación de documentos)          │
│  ROI: Recuperas inversión en < 1 día 🎉                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## ⚙️ Admin Panel - RAG Status

```
┌─────────────────────────────────────────────────────────┐
│  🔍 RAG System Status                                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Global Stats:                                          │
│                                                         │
│  ┌──────────────┬──────────────┬──────────────┐        │
│  │ Total Chunks │ Total Sources│  RAG Enabled │        │
│  │             │              │              │        │
│  │   15,234     │     234      │   187 (80%)  │        │
│  └──────────────┴──────────────┴──────────────┘        │
│                                                         │
│  Performance:                                           │
│                                                         │
│  ┌──────────────┬──────────────┬──────────────┐        │
│  │ Avg Search   │  Cache Hit   │  Error Rate  │        │
│  │   Latency    │     Rate     │              │        │
│  │             │              │              │        │
│  │   234ms      │    67%       │    0.2%      │        │
│  └──────────────┴──────────────┴──────────────┘        │
│                                                         │
│  Sources Needing Indexing:                              │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 📄 Old Document 1.pdf            [Re-index Now] │   │
│  │ 📄 Old Document 2.pdf            [Re-index Now] │   │
│  │ 📄 Old Document 3.pdf            [Re-index Now] │   │
│  │                                                 │   │
│  │                   [Bulk Re-index All (47)]      │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🎓 User Education

### First-Time RAG Banner

```
┌───────────────────────────────────────────────────────────────┐
│ 🎉 Nueva Funcionalidad: Búsqueda Vectorial (RAG)              │
│                                                               │
│ Ahora tus documentos se buscan de forma más inteligente:      │
│                                                               │
│ ✨ Solo se envía información relevante al AI                   │
│ ⚡ Respuestas 2-3x más rápidas                                 │
│ 💰 99% más económico                                           │
│ 📚 Soporta bibliotecas 100x más grandes                        │
│                                                               │
│ RAG está activado por defecto. Puedes desactivarlo en         │
│ Configuración si prefieres el método tradicional.             │
│                                                               │
│               [Entendido]              [Ver Tutorial]         │
└───────────────────────────────────────────────────────────────┘
```

### Tutorial Overlay (On "Ver Tutorial")

```
┌─────────────────────────────────────────────────────────────────────┐
│  📖 Tutorial: Búsqueda Vectorial                                [X]│
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Paso 1 de 3: ¿Qué es RAG?                                 [Sig →] │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                                                              │  │
│  │         Antes (Sin RAG)          │        Ahora (Con RAG)    │  │
│  │  ────────────────────────────────┼───────────────────────────│  │
│  │                                  │                           │  │
│  │  Documento completo              │  Solo fragmentos          │  │
│  │  ████████████████████            │  ███ relevantes           │  │
│  │  50,000 tokens                   │  2,500 tokens             │  │
│  │                                  │                           │  │
│  │  ↓                               │  ↓                        │  │
│  │                                  │                           │  │
│  │  AI procesa todo                 │  AI procesa solo          │  │
│  │  (95% irrelevante)               │  lo necesario             │  │
│  │                                  │                           │  │
│  │  ↓                               │  ↓                        │  │
│  │                                  │                           │  │
│  │  Respuesta lenta                 │  Respuesta rápida         │  │
│  │  Costoso                         │  Económico                │  │
│  │                                  │                           │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

Paso 2 de 3: ¿Cómo funciona?
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  1. Tu documento se divide en fragmentos pequeños                │
│     "Fragmento 1", "Fragmento 2", etc.                           │
│                                                                  │
│  2. Cada fragmento recibe una "huella digital" (embedding)       │
│     Representa el significado del texto como números             │
│                                                                  │
│  3. Cuando preguntas, el sistema busca fragmentos similares      │
│     Compara el significado de tu pregunta con todos los chunks   │
│                                                                  │
│  4. Solo los fragmentos más relevantes se envían al AI           │
│     Top 5-7 fragmentos con mayor similitud                       │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

Paso 3 de 3: ¿Cuándo usarlo?
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  ✅ Úsalo cuando:                                                │
│  • Tienes documentos grandes (>10 páginas)                       │
│  • Usas múltiples documentos simultáneamente                     │
│  • Haces preguntas específicas                                   │
│  • Quieres respuestas más rápidas                                │
│                                                                  │
│  ⚠️ No es necesario cuando:                                      │
│  • Documentos muy pequeños (<5 páginas)                          │
│  • Un solo documento activo                                      │
│  • Necesitas contexto completo (resúmenes)                       │
│                                                                  │
│  💡 Recomendación: Déjalo activado. El sistema decide            │
│     automáticamente cuándo usarlo para mejores resultados.       │
│                                                                  │
│                                          [Comenzar a Usar RAG]   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🎨 Badge System

### Source Badges

```
Without RAG:
┌─────────────────────────────────┐
│ 📄 Document.pdf                 │
│ ✓ Validado  [📝 Full Text]      │
└─────────────────────────────────┘

With RAG:
┌─────────────────────────────────┐
│ 📄 Document.pdf                 │
│ ✓ Validado  [🔍 RAG: 89 chunks] │
└─────────────────────────────────┘
```

### Message Badges

```
User message:
┌────────────────────────────────────┐
│ ¿Qué dice sobre construcciones?    │
└────────────────────────────────────┘

AI response (with RAG):
┌────────────────────────────────────┐
│ 🔍 RAG Search: 5 chunks            │
│                                    │
│ Según la normativa[1], las         │
│ construcciones en subterráneo...   │
│                                    │
│ [1] OGUC.pdf (Chunk 23, 89% rel)   │
└────────────────────────────────────┘
```

---

## 📱 Mobile View

```
┌─────────────────────────────┐
│  ⚙️ Config              [X]│
├─────────────────────────────┤
│                             │
│  🔍 RAG Search   [🟢 ON]    │
│                             │
│  ┌─────────┬─────────┐      │
│  │ -95%    │  2x     │      │
│  │ tokens  │ rápido  │      │
│  └─────────┴─────────┘      │
│                             │
│  Chunks: [5] ▼              │
│                             │
│         [Guardar]           │
│                             │
└─────────────────────────────┘
```

---

## 🎬 Animation Concepts

### RAG Search In Progress

```
Frame 1:
┌─────────────────────────────────┐
│ 🔍 Buscando...                  │
│ ⚪⚪⚪⚪⚪                          │
└─────────────────────────────────┘

Frame 2:
┌─────────────────────────────────┐
│ 🔍 Buscando fragmentos...       │
│ 🟢⚪⚪⚪⚪  Analizando...         │
└─────────────────────────────────┘

Frame 3:
┌─────────────────────────────────┐
│ 🔍 Encontrados 3 fragmentos     │
│ 🟢🟢🟢⚪⚪  Buscando más...      │
└─────────────────────────────────┘

Frame 4:
┌─────────────────────────────────┐
│ ✅ 5 fragmentos relevantes      │
│ 🟢🟢🟢🟢🟢  Listo               │
└─────────────────────────────────┘
```

---

## 🎯 Quick Actions Menu

### Right-click on Source Card

```
┌─────────────────────────────────┐
│ 📄 Normativa OGUC.pdf           │
│                                 │
│ [Right-click menu:]             │
│ ┌─────────────────────────────┐ │
│ │ 👁️ Ver documento            │ │
│ │ ⚙️ Configurar               │ │
│ │ 🔍 Ver chunks indexados     │ ← NEW
│ │ 🔄 Re-indexar para RAG      │ ← NEW
│ │ ──────────────────────────  │ │
│ │ 🗑️ Eliminar                 │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

### View Chunks Modal

```
┌─────────────────────────────────────────────────────────────────────┐
│  📑 Fragmentos Indexados - Normativa OGUC.pdf                   [X]│
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Total: 89 chunks │ Tokens promedio: 487 │ Total: 43,343 tokens    │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Chunk 0 (500 tokens)                                         │  │
│  │ "Las construcciones en subterráneo deben cumplir con las     │  │
│  │  disposiciones sobre distanciamientos o zonas inexcavables   │  │
│  │  que hayan sido establecidas. La DDU 189 establece..."       │  │
│  │                                              [Copy] [Search]  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Chunk 1 (487 tokens)                                         │  │
│  │ "Los distanciamientos mínimos para construcciones..."        │  │
│  │                                              [Copy] [Search]  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ... (87 more chunks)                                               │
│                                                                     │
│  Search in chunks: [                              ] 🔍              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Smart Recommendations

### When Upload Completes

```
┌─────────────────────────────────────────────────────────┐
│  ✅ Documento Procesado                                 │
│                                                         │
│  Normativa OGUC.pdf (89 páginas)                        │
│                                                         │
│  💡 Recomendación:                                      │
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                 │   │
│  │ Este documento es grande (89 páginas).          │   │
│  │                                                 │   │
│  │ ✨ Activa RAG para:                             │   │
│  │ • Ahorrar 95% de tokens                         │   │
│  │ • Respuestas 2x más rápidas                     │   │
│  │ • Búsquedas más precisas                        │   │
│  │                                                 │   │
│  │ Costo adicional: ~$0.01 (una sola vez)          │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│         [Activar RAG]                    [No, gracias] │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 Comparison Chart in UI

```
┌─────────────────────────────────────────────────────────┐
│  📊 Eficiencia de Contexto                              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Token Usage per Query:                                 │
│                                                         │
│  Sin RAG:                                               │
│  ████████████████████████████████████████  52,000      │
│                                                         │
│  Con RAG:                                               │
│  ██  2,500                                              │
│                                                         │
│  ────────────────────────────────────────────────────   │
│                                                         │
│  Response Time:                                         │
│                                                         │
│  Sin RAG:  ████████  4.2s                               │
│  Con RAG:  ███  1.8s                                    │
│                                                         │
│  ────────────────────────────────────────────────────   │
│                                                         │
│  Cost per 100 Queries (Pro Model):                      │
│                                                         │
│  Sin RAG:  ████████████████████████████  $62.50        │
│  Con RAG:  $0.31                                        │
│                                                         │
│  💰 Ahorro: $62.19 (99.5%)                              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ Visual Success Indicators

### Before Query

```
Estado del contexto:
┌─────────────────────────────────┐
│ 📚 3 fuentes activas            │
│ 📊 234 chunks disponibles       │
│ 🔍 RAG listo para búsqueda      │
└─────────────────────────────────┘
```

### During Query

```
┌─────────────────────────────────┐
│ 🔍 Buscando...                  │
│ ⚡ Encontrados: 5/5 ✓           │
│ 📊 Similaridad promedio: 81%    │
└─────────────────────────────────┘
```

### After Response

```
┌─────────────────────────────────┐
│ ✅ Respuesta completada          │
│ 🎯 5 chunks usados              │
│ 💰 Ahorro: $0.062               │
│ ⚡ Tiempo: 1.8s (2.4s saved)    │
└─────────────────────────────────┘
```

---

**This is what the UI will look like!** 

Ready to implement? Just say "yes" and I'll create all the code! 🚀

