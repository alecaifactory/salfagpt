# 🧪 Testing Guide: Pipeline Detail View

**Fecha:** 2025-10-19  
**Status:** ✅ Listo para probar  
**Server:** Running en http://localhost:3000

---

## 🚀 Quick Start

### Paso 1: Abrir Context Management

```
1. Navega a: http://localhost:3000/chat
2. Login como admin (alec@getaifactory.com)
3. Click en el menú de usuario (abajo izquierda)
4. Click en "Context Management"
```

---

## 🎯 Escenarios de Testing

### Test 1: Ver Pipeline de Documento Existente

**Objetivo:** Ver los detalles completos de un documento ya procesado

**Pasos:**
1. ✅ Modal "Context Management" está abierto
2. ✅ En el panel izquierdo, ves "Pipeline de Procesamiento (13)"
3. ✅ Busca un documento completado (todos los steps verdes): **DDU-ESP-009-07.pdf** ✅ 16.6s
4. ✅ **Click en la card del documento** (no en checkbox, en el card completo)

**Resultado Esperado:**

Panel derecho se abre mostrando:

```
┌─────────────────────────────────────────────┐
│  [X] Vista Detallada            [🗑️]        │
│      Pipeline completo y contenido          │
├─────────────────────────────────────────────┤
│  ☑️ PUBLIC - Auto-assign a nuevos agentes   │
├─────────────────────────────────────────────┤
│  Asignar a Agentes          [Assign (0)]   │
│  [ ] Agente 1                               │
│  [ ] Agente 2                               │
│  ...                                        │
├─────────────────────────────────────────────┤
│                                             │
│  📊 Tabs:                                   │
│  [Pipeline Details] [Extracted Text] [RAG]  │
│                                             │
│  ⏱️ Tiempo Total: 16.6s                     │
│  💰 Costo Total: $0.000123                  │
│  ✅ Estado: Activo                          │
│                                             │
│  Pipeline Steps (todos expandidos):         │
│                                             │
│  ✅ Upload to Cloud Storage    ⏱️ 2.1s      │
│     📦 2.34 MB                              │
│     📍 gs://bucket/file.pdf  [🔗]           │
│                                             │
│  ✅ Extract with Gemini AI     ⏱️ 8.3s  [v] │
│     🤖 Gemini 2.5 Flash                     │
│     📊 Input: 12,345 tokens                 │
│     📊 Output: 8,901 tokens                 │
│     💰 $0.000234                            │
│                                             │
│  ✅ Chunk for RAG              ⏱️ 3.2s  [v] │
│     📑 24 chunks                            │
│     📏 ~500 tokens avg                      │
│                                             │
│  ✅ Generate Embeddings        ⏱️ 2.9s  [v] │
│     🧮 24 embeddings                        │
│     🔢 text-embedding-004                   │
│                                             │
│  ✅ Ready for Use                           │
│     ¡Documento Listo!                       │
└─────────────────────────────────────────────┘
```

**Validar:**
- [ ] Todos los steps muestran ✅ verde
- [ ] Duraciones son realistas
- [ ] Costos se muestran
- [ ] Detalles son expandibles/colapsables

---

### Test 2: Ver Texto Extraído

**Pasos:**
1. ✅ Documento seleccionado (panel derecho abierto)
2. ✅ Click en tab **"Extracted Text"**

**Resultado Esperado:**

```
┌─────────────────────────────────────────────┐
│  📄 Texto Extraído        [⬇️ Descargar]    │
│  45,678 caracteres                          │
├─────────────────────────────────────────────┤
│  ┌───────────────────────────────────────┐ │
│  │  DECRETO SUPREMO N° 009                │ │
│  │                                       │ │
│  │  MINISTERIO DE ...                    │ │
│  │                                       │ │
│  │  Artículo 1.- ...                     │ │
│  │                                       │ │
│  │  (Texto completo con scroll)          │ │
│  │                                       │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  📄 5 páginas • 🔢 ~8,901 tokens            │
│  Extraído: 19/10/2025                       │
└─────────────────────────────────────────────┘
```

**Validar:**
- [ ] Texto se muestra completo
- [ ] Scroll funciona
- [ ] Click "Descargar" → archivo .txt se descarga
- [ ] Abrir archivo → contenido es correcto
- [ ] Stats abajo son precisas

---

### Test 3: Ver RAG Chunks

**Pasos:**
1. ✅ Documento seleccionado
2. ✅ Click en tab **"RAG Chunks (24)"**

**Resultado Esperado:**

```
┌─────────────────────────────────────────────┐
│  🧩 RAG Chunks (24)                         │
├─────────────────────────────────────────────┤
│  ┌─────────┐ ┌──────────┐ ┌─────────┐      │
│  │  24     │ │  500     │ │  768    │      │
│  │ Chunks  │ │ Avg Size │ │  Dims   │      │
│  └─────────┘ └──────────┘ └─────────┘      │
├─────────────────────────────────────────────┤
│  Document Chunks                            │
│  Click para ver detalles                    │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ Chunk #1 • 487 tokens • Pág. 1  👁️ │   │ ← CLICKABLE
│  │ DECRETO SUPREMO N° 009...           │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ Chunk #2 • 512 tokens • Pág. 1-2 👁️│   │ ← CLICKABLE
│  │ MINISTERIO DE ECONOMÍA...           │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ... (scroll para ver todos)                │
└─────────────────────────────────────────────┘
```

**Validar:**
- [ ] Summary cards muestran números correctos
- [ ] Lista completa de chunks carga
- [ ] Cada chunk muestra preview de texto
- [ ] Tokens y páginas se muestran

---

### Test 4: Inspeccionar Chunk Individual

**Pasos:**
1. ✅ En tab "RAG Chunks"
2. ✅ **Click en cualquier chunk** (ej: Chunk #1)

**Resultado Esperado:**

Modal se abre:

```
┌─────────────────────────────────────────────┐
│  Chunk #1                              [X]  │
│  487 tokens • Chars 0-2,345 • Pág. 1        │
├─────────────────────────────────────────────┤
│                                             │
│  Texto del Chunk                            │
│  ┌───────────────────────────────────────┐ │
│  │  DECRETO SUPREMO N° 009               │ │
│  │                                       │ │
│  │  MINISTERIO DE ECONOMÍA Y FINANZAS   │ │
│  │                                       │ │
│  │  Considerando:                        │ │
│  │  Que es necesario...                  │ │
│  │  (texto completo del chunk)           │ │
│  │                                       │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  Embedding Vector (768 dimensiones)        │
│  ┌───────────────────────────────────────┐ │
│  │  0.1234  0.5678  -0.2345  0.8901      │ │
│  │  0.3456  -0.1234  0.6789  0.2345      │ │
│  │  ... (primeros 100 de 768)            │ │
│  └───────────────────────────────────────┘ │
│                                             │
│                              [Cerrar]       │
└─────────────────────────────────────────────┘
```

**Validar:**
- [ ] Modal aparece con backdrop oscuro
- [ ] Texto del chunk es correcto
- [ ] Embedding values se muestran (números decimales)
- [ ] Metadata es precisa
- [ ] Botón "Cerrar" funciona
- [ ] Click fuera del modal lo cierra

---

### Test 5: Documentos Sin RAG

**Pasos:**
1. ✅ Selecciona un documento que NO tiene RAG habilitado
2. ✅ Observa tab "RAG Chunks"

**Resultado Esperado:**

```
Tab "RAG Chunks ()" está DISABLED (gris, no clickable)

Si logras hacer click:
┌─────────────────────────────────────────────┐
│  🧩 RAG Chunks                              │
├─────────────────────────────────────────────┤
│                                             │
│         🔲 Grid icon (gris)                 │
│                                             │
│  RAG no está habilitado para este          │
│  documento                                  │
│                                             │
│  Habilita RAG para fragmentar el            │
│  documento y generar embeddings             │
│                                             │
└─────────────────────────────────────────────┘
```

**Validar:**
- [ ] Tab está disabled o muestra mensaje apropiado
- [ ] No intenta cargar chunks
- [ ] Mensaje claro al usuario

---

### Test 6: Expandir/Colapsar Steps

**Pasos:**
1. ✅ En tab "Pipeline Details"
2. ✅ Click en **"Extract with Gemini AI"** (el header)
3. ✅ Observa el chevron cambiar
4. ✅ Detalles se ocultan
5. ✅ Click de nuevo
6. ✅ Detalles se muestran

**Resultado Esperado:**

```
Colapsado:
  ✅ Extract with Gemini AI  ⏱️ 8.3s  [>]
     Texto extraído con Gemini AI

Expandido:
  ✅ Extract with Gemini AI  ⏱️ 8.3s  [v]
     Texto extraído con Gemini AI
     ┌─────────────────────────────────┐
     │  Modelo: Gemini 2.5 Flash       │
     │  Input: 12,345 tokens           │
     │  Output: 8,901 tokens           │
     │  💰 $0.000234                   │
     │  ℹ️ Gemini procesó el PDF...     │
     └─────────────────────────────────┘
```

**Validar:**
- [ ] Click toggle funciona suavemente
- [ ] Chevron rota (> vs v)
- [ ] Detalles aparecen/desaparecen
- [ ] Múltiples steps pueden expandirse

---

### Test 7: Download Extracted Text

**Pasos:**
1. ✅ Tab "Extracted Text" activo
2. ✅ Click **"Descargar .txt"**

**Resultado Esperado:**
- [ ] Browser descarga archivo
- [ ] Nombre: `DDU-ESP-009-07.pdf_extracted.txt`
- [ ] Contenido es el texto completo extraído
- [ ] No hay caracteres raros o corrupciones

---

## 🐛 Troubleshooting

### Panel derecho está vacío

**Diagnóstico:**
```javascript
// Abrir DevTools Console
console.log('Selected source:', selectedSource);
```

**Fix:**
- Asegúrate de hacer click en la **card del documento**, no en el checkbox
- El documento debe tener `pipelineLogs` guardados

### Chunks no cargan

**Diagnóstico:**
```javascript
// Network tab
GET /api/context-sources/{id}/chunks?userId={userId}
```

**Fix:**
- Verifica que `ragEnabled: true` en el source
- Verifica que existen chunks en Firestore collection `document_chunks`
- Verifica que el userId es correcto

### Tab "RAG Chunks" disabled

**Esto es correcto** si:
- `source.ragEnabled === false`
- El documento no ha sido procesado con RAG

**Para habilitar RAG:**
1. Click en toggle RAG en la source card
2. Espera que termine el procesamiento
3. Reload sources
4. Ahora tab debe estar enabled

---

## ✅ Checklist de Validación Completa

### Funcionalidad Core

- [ ] **Pipeline tab** muestra todos los 5 steps
- [ ] **Steps expandibles** funcionan (click para toggle)
- [ ] **Duraciones** se muestran correctamente
- [ ] **Costos** son precisos
- [ ] **Extracted text tab** muestra texto completo
- [ ] **Download .txt** funciona
- [ ] **RAG chunks tab** carga chunks
- [ ] **Chunk modal** muestra detalles completos
- [ ] **Embedding preview** se renderiza

### User Experience

- [ ] **Loading states** durante carga de chunks
- [ ] **Empty states** si no hay datos
- [ ] **Error states** si algo falla
- [ ] **Smooth transitions** entre tabs
- [ ] **Responsive scroll** en áreas largas
- [ ] **Hover effects** en elementos clickables
- [ ] **Clear CTAs** (botones con labels claros)

### Trust Building

- [ ] Usuario puede **verificar upload** (Cloud Storage path)
- [ ] Usuario puede **validar extracción** (descargar texto)
- [ ] Usuario puede **inspeccionar chunks** (clickables)
- [ ] Usuario puede **ver embeddings** (vectores)
- [ ] Usuario puede **entender costos** (transparentes)
- [ ] Usuario puede **confiar en el proceso** (todo visible)

---

## 📸 Screenshots Esperados

### 1. Pipeline Tab (Expandido)

![Mockup - ver PIPELINE_DETAIL_VIEW_GUIDE.md línea 95]

✅ **Elementos Visibles:**
- Summary cards arriba (tiempo, costo, estado)
- 5 steps con líneas conectoras
- Steps expandidos muestran detalles
- Cada step tiene ícono, estado, duración
- Info boxes explicativos

### 2. Extracted Text Tab

![Mockup - ver PIPELINE_DETAIL_VIEW_GUIDE.md línea 148]

✅ **Elementos Visibles:**
- Header con contador de caracteres
- Botón "Descargar .txt"
- Área de texto con scroll
- Stats bar abajo (páginas, tokens, fecha)

### 3. RAG Chunks Tab

![Mockup - ver PIPELINE_DETAIL_VIEW_GUIDE.md línea 164]

✅ **Elementos Visibles:**
- 3 summary cards (chunks, avg size, dimensions)
- Lista scrollable de chunks
- Cada chunk clickable con eye icon
- Preview de texto (2 líneas)

### 4. Chunk Detail Modal

![Mockup - ver PIPELINE_DETAIL_VIEW_GUIDE.md línea 190]

✅ **Elementos Visibles:**
- Header con metadata
- Texto completo del chunk
- Embedding vector preview
- Botón cerrar

---

## 🎬 Demo Video Script

### Narración Sugerida

```
"Acabamos de implementar una vista detallada que muestra 
TODO lo que pasa con tus documentos.

[Click en documento]

Cuando haces click en un documento, el panel derecho se 
abre mostrando el pipeline completo:

[Tab Pipeline Details]

Aquí vemos que el archivo fue:
1. Subido a Cloud Storage - 2.1 segundos ✅
2. Procesado con Gemini Flash - 8.3 segundos, costó $0.0002 ✅
3. Fragmentado en 24 chunks para RAG ✅
4. Cada chunk convertido a un vector semántico ✅

[Click en step Extract - expande]

Podemos ver exactamente cuántos tokens usó Gemini,
tanto de input como de output.

[Tab Extracted Text]

Podemos ver el texto completo extraído, e incluso
descargarlo como archivo .txt para validar su calidad.

[Click Descargar]

[Tab RAG Chunks]

Y finalmente, podemos inspeccionar cada uno de los 24
fragmentos generados para búsqueda semántica.

[Click en Chunk #1]

Incluso podemos ver el vector de embeddings de 768
dimensiones que permite la búsqueda inteligente.

[Cerrar modal]

Todo el proceso es completamente transparente y
verificable. Sin cajas negras. Sin misterios.
Solo confianza a través de la transparencia.
"
```

---

## 🎯 Qué Decir al Usuario

### Mensaje de Éxito

```
✅ Pipeline Detail View Implementado

Ahora cuando hagas click en un documento procesado,
verás en el panel derecho:

📊 Pipeline Details
- Todos los pasos del procesamiento
- Duraciones exactas
- Costos reales
- Expandible para ver más

📄 Extracted Text
- Texto completo extraído
- Descargable como .txt
- Verificable

🧩 RAG Chunks
- Lista de todos los fragmentos
- Clickable para ver detalles
- Embeddings inspeccionables

Pruébalo ahora:
1. Abre Context Management
2. Click en cualquier documento verde
3. Explora las 3 tabs

¡Todo es transparente! 🔍✨
```

---

## 🚨 Known Issues / Limitations

### Limitación 1: Solo Documentos Procesados

- Documents **sin pipelineLogs** solo mostrarán info básica
- Solution: Re-procesar documentos viejos si es necesario

### Limitación 2: Chunks On-Demand Loading

- Chunks se cargan solo cuando se abre el tab
- Primera vez puede tomar 1-2 segundos
- Solution: Mostrar loading spinner (ya implementado)

### Limitación 3: Large Embeddings

- Embeddings de 768 dimensiones son grandes
- Solo mostramos primeros 100 valores
- Solution: Suficiente para verificación, no necesita todos

---

## 📈 Métricas de Éxito

### Confianza del Usuario

**Antes:**
- "No sé qué pasó con mi documento" 😕
- "¿Se procesó correctamente?" 🤷
- "¿Cuánto costó?" ❓

**Ahora:**
- "Veo exactamente qué pasó" ✅
- "Puedo verificar el texto extraído" ✅
- "Conozco el costo exacto" ✅
- "Entiendo cómo funciona RAG" ✅
- "Confío en el sistema" 🎯

### KPIs

- **Time to Trust:** < 30 segundos (ver pipeline completo)
- **Verification Rate:** 100% (todo es verificable)
- **Transparency Score:** 10/10 (nada oculto)
- **User Confidence:** ⭐⭐⭐⭐⭐

---

## 🔮 Próximos Pasos

### Después de Validar

1. [ ] **Git commit** los cambios
2. [ ] **Deploy** a staging para testing con usuarios reales
3. [ ] **Recoger feedback** sobre qué más quieren ver
4. [ ] **Iterar** basado en uso real

### Posibles Extensiones

- [ ] Export pipeline summary as PDF report
- [ ] Email notification cuando processing completa
- [ ] Slack/webhook notifications
- [ ] API para third-party integrations
- [ ] Webhooks para pipeline events

---

## 📚 Archivos Relacionados

**Componentes:**
- `src/components/PipelineDetailView.tsx` ⭐ **NUEVO**
- `src/components/ContextManagementDashboard.tsx` (modificado)
- `src/components/PipelineStatusPanel.tsx` (existente, más simple)

**API:**
- `src/pages/api/context-sources/[id]/chunks.ts` (añadido GET endpoint)

**Tipos:**
- `src/types/context.ts` (PipelineLog, ContextSource)

**Documentación:**
- `PIPELINE_DETAIL_VIEW_GUIDE.md` (arquitectura completa)
- `PIPELINE_UPLOAD_FLOW_2025-10-18.md` (flujo original)

---

**🎉 Ready to Test!**

Server running: http://localhost:3000  
Login: alec@getaifactory.com  
Action: Click en un documento del pipeline  

**¡Explora las 3 tabs y verifica que todo funciona!** 🚀

