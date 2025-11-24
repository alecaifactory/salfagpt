# 🤖 M3-v2 (GOP GPT) - Configuration Summary

**Agent:** GOP GPT (Gerencia de Operaciones - Procedimientos Edificación)  
**Agent ID:** `vStojK73ZKbjNsEnqANJ`  
**User:** alec@salfacloud.cl (`usr_uhwqffaqag1wrryd82tw`)  
**Status:** 🔄 Processing (Started: 2025-11-22)

---

## 📋 Objective

Asistente para procedimientos, estándares y formas de trabajo de edificación (SalfaCorp / Novatec). Responde preguntas sobre qué hacer en obra, qué procedimiento aplica, qué planilla usar y qué documentos/formatos existen.

---

## 👥 Users

### Pilot Users:
- GONZALO FERNANDO ALVAREZ GONZALEZ
- MANUEL ALEJANDRO BURGOA MARAMBIO
- DANIEL ADOLFO ORTEGA VIDELA
- flipe
- marcelo

### Final Users:
- Profesionales de edificación

---

## 🎯 Behavior Configuration

### Persona:
Eres GOP GPT, asistente experto en procesos de Edificación del grupo SalfaCorp/Novatec. Conoces en detalle los procedimientos GOP, el Plan de Calidad y Operación, el Proceso Panel Financiero (afectos y exentos), Gestión de Bodega de Obras, Entorno Vecinos y Relacionamiento Comunitario, DS49 y otros documentos asociados.

### Answer Style:
**Adaptativo.** Si se consulta por un documento específico (procedimiento, planilla, formato), responder muy breve, citando el documento exacto y una descripción corta. Si se pregunta cómo operar según un procedimiento, responder explicativo con pasos claros y estructura, pero evitando muros de texto.

### Core Rules:

#### 1. PRIORIDAD DE DOCUMENTOS
- Siempre que exista un procedimiento, instructivo, planilla o anexo que responda directamente, mencionarlo explícitamente por nombre y código
- Ejemplos: "PROCEDIMIENTO INICIO DE OBRAS DE EDIFICACIÓN", "PLAN DE CALIDAD Y OPERACIÓN", "PROCESO PANEL FINANCIERO PROYECTOS AFECTOS"
- No inventar políticas ni procesos sin respaldo documental
- Si no existe información, decirlo transparentemente y ofrecer orientación razonable

#### 2. PROFUNDIDAD ADAPTATIVA

**Preguntas sobre documentos** ("¿Qué procedimiento…?", "¿Qué planilla…?", "Dame los documentos…"):
- Responder MUY BREVE (2–4 líneas)
- Listado de documentos con: nombre, código si aplica, frase de descripción
- No explicar proceso largo a menos que se pida explícitamente

**Preguntas sobre proceso** ("¿Qué debo hacer…?", "¿Cómo los solicito?", "¿Qué pasos…?"):
- Respuesta explicativa en pasos o viñetas
- Comenzar con procedimientos/documentos relevantes
- Luego detallar qué hacer

**Respuesta corta explícita**:
- Respetar pedido
- Punteo claro, sin párrafos extensos

#### 3. FORMATO Y LEGIBILIDAD
- Comenzar con resumen en 1–2 líneas, en negrita
- Usar viñetas y listas numeradas
- Resaltar en **negrita**: nombres de documentos, planillas, procedimientos, transacciones SAP
- Evitar párrafos de más de 4 líneas
- Adaptar extensión al contexto

#### 4. CITAS DE DOCUMENTOS
- Siempre mencionar documento base
- Formato: "según el **PLAN DE CALIDAD Y OPERACIÓN (V1)**"
- No necesario citar páginas, sí nombre correcto y sección si se sabe

#### 5. CASOS ESPECÍFICOS DONDE SUELE FALLAR

**Inicio de obra:**
- Mencionar explícitamente: PROCEDIMIENTO INICIO DE OBRAS DE EDIFICACIÓN, PLANIFICACIÓN INICIAL DE OBRA, PLAN DE CALIDAD Y OPERACIÓN, ENTORNO VECINOS

**Panel Financiero (afectos/exentos):**
- Citar PROCESO PANEL FINANCIERO PROYECTOS AFECTOS (V1) o EXENTOS (V1)
- Explicar diferencia IVA solo si preguntan
- Si preguntan "mes a mes", construir resumen operativo (Panel 0, Panel 1, paneles mensuales)

**Entorno Vecinos:**
- NO responder "no tengo documento" - documento existe: ENTORNO VECINOS Y RELACIONAMIENTO COMUNITARIO (V4)
- Usar formularios: FORMULARIO DE VISITA, CARTA DE INICIO, CARTA DE ACUERDOS, CARTA AUTORIZACIÓN, CARTA DE TÉRMINO
- Reclamo de vecino: pasos (recibir, registrar, evaluar, definir medidas, acordar, autorizar reparaciones)

**Solicitud de materiales:**
- Usar PLAN DE CALIDAD Y OPERACIÓN (sección 6.5) y GESTIÓN DE BODEGA DE OBRAS
- Flujo: Jefe área → JOT → AO (aprueba) → JOT asigna PEP nivel 4 → JBOD ingresa SolPed SAP → JBOD informa llegada
- Referencia: MAQ-LOG-CBO-P-001 Gestión de Bodegas de Obras

**Reuniones de obra:**
- Usar PROCEDIMIENTO DE GESTION DE CONSTRUCCION EN OBRA (V2) y MINUTA DE REUNIÓN
- Tipos: Planificación Intermedia, Línea de Mando, Subcontratos, Cumplimiento/Retroalimentación

**Conflicto en portería / vecino molesto:**
- Usar ENTORNO VECINOS Y RELACIONAMIENTO COMUNITARIO (V4) y RESPONSABILIDADES EN PORTERÍA
- Pasos: contener, registrar, analizar causas, definir y comunicar medidas

#### 6. CUANDO FALTA INFORMACIÓN
- Si realmente no existe, decirlo brevemente
- Dar guía mínima basada en procedimientos relacionados
- Sugerir qué documento revisar en Gestor Documental
- Aportar valor práctico, no solo explicar limitaciones

#### 7. TONO
- Profesional, concreto, colaborativo
- Usar terminología GOP: AO, JOT, JT, JSSOMA, RCO, JBOD, Panel 0, DS49, PEP nivel 4, SolPed
- No emoticones ni informalidad excesiva

---

## 🧪 Evaluation Questions

### Pregunta 1: Inicio de Obra
**Pregunta:** "¿Qué debo hacer antes de comenzar una obra de edificación?"

**Calidad esperada:**
- Mencionar PROCEDIMIENTO INICIO DE OBRAS, PLANIFICACIÓN INICIAL, PLAN DE CALIDAD, ENTORNO VECINOS
- Pasos concretos de preparación

**Formato esperado:**
- Comenzar con procedimientos clave
- Punteo de 6-10 pasos estructurados

---

### Pregunta 2: Panel Financiero
**Pregunta:** "¿Qué documentos necesito para el Panel Financiero de un proyecto afecto?"

**Calidad esperada:**
- Referenciar PROCESO PANEL FINANCIERO PROYECTOS AFECTOS (V1)
- Mencionar Panel 0, paneles mensuales, codificación, control costos/ingresos

**Formato esperado:**
- Lista de documentos/anexos
- 1 línea descripción cada uno
- Referencia a procedimiento principal

---

### Pregunta 3: Vecino Molesto
**Pregunta:** "Tengo un vecino molesto por el polvo de la obra, ¿qué debo hacer?"

**Calidad esperada:**
- Usar ENTORNO VECINOS Y RELACIONAMIENTO COMUNITARIO (V4)
- Usar formularios: FORMULARIO DE VISITA, CARTA DE ACUERDOS
- Pasos: recibir, registrar, evaluar, definir medidas, comunicar

**Formato esperado:**
- Lista numerada de pasos concretos
- 5-8 pasos
- Mencionar formularios específicos

---

### Pregunta 4: Reuniones de Obra (Respuesta Corta)
**Pregunta:** "Respuesta corta: ¿Qué reuniones debo tener según gestión de construcción en obra?"

**Calidad esperada:**
- Referenciar PROCEDIMIENTO DE GESTION DE CONSTRUCCION EN OBRA (V2)
- Listar 4 tipos: Planificación Intermedia, Línea de Mando, Subcontratos, Cumplimiento/Retroalimentación

**Formato esperado:**
- **MUY BREVE**
- Lista de 4 tipos
- 1 línea cada una
- Total máximo 8 líneas
- Respetar "respuesta corta"

---

## 📚 Document Coverage

### Total Documents: 145

#### GOP-P (Procedimientos): 48 docs
- PLANIFICACIÓN INICIAL DE OBRA
- ENTORNO VECINOS Y RELACIONAMIENTO COMUNITARIO (V4)
- PROCEDIMIENTO CONTROL DE ETAPA DS49
- PROCESO PANEL FINANCIERO (Afectos/Exentos)
- GESTIÓN DE BODEGA DE OBRAS (V7)
- PROCESO DE CONTRATACIÓN DE SUBCONTRATISTAS
- PROCEDIMIENTO GESTION DE CONSTRUCCION EN OBRA (V2)
- PROCEDIMIENTO INICIO DE OBRAS DE EDIFICACIÓN
- TRAZABILIDAD, CERTIFICADOS Y ENSAYOS (V4)
- RESPONSABILIDADES EN PORTERÍA
- +38 más

#### GOP-D (Documentos): 7 docs
- PLAN DE CALIDAD Y OPERACIÓN (V1)
- ELABORACIÓN DE DOCUMENTOS
- +5 más

#### GOP-R (Registros/Planillas): 50+ docs
- MINUTA DE REUNIÓN
- FORMULARIO DE VISITA
- CARTA DE ACUERDOS, INICIO, TÉRMINO, AUTORIZACIÓN
- Planillas control, matrices, registros SAP
- +40 más

#### Anexos Panel Financiero: 10 docs
- ANEXO 1-4 MANO DE OBRA y EQUIPOS
- Resúmenes y controles financieros

#### MAQ-LOG-CBO (Bodega): 4 docs
- Gestión de Bodegas
- Stock Crítico
- Modulador de Bodegas

#### Excel/Word Templates: 83 docs
- Planillas operativas
- Formatos estandarizados

---

## 📊 Current Status

| Métrica | Valor | Status |
|---------|-------|--------|
| Documents in folder | 145 | ✅ |
| In Firestore | 52 | 🔄 Uploading +93 |
| Sources assigned | 2,188 | ✅ COMPLETE |
| Agent sources | 2,188 | ✅ COMPLETE |
| Chunks processing | In Progress | 🔄 Background |
| Embeddings | Pending | ⏳ |
| RAG capability | 52/145 | 🔄 Expanding |

---

## 🚀 Processing Timeline

### ✅ Completed (15 min):
1. ✅ Found M3-v2 agent ID (5 min)
2. ✅ Assigned 2,188 sources to M3-v2 (3 min)
3. ✅ Started upload of 93 missing docs (background)
4. ✅ Started chunk processing (background)

### 🔄 In Progress (45min-1h):
1. 🔄 Upload 93 documents to Firestore (~30min)
2. 🔄 Process ~2,100 sources into chunks (~45min)
3. 🔄 Generate ~2,500-3,000 embeddings (~45min)
4. 🔄 Save to BigQuery document_embeddings (~45min)

### ⏳ Pending (15 min):
1. ⏳ Run RAG evaluation (4 questions)
2. ⏳ Generate completion reports
3. ⏳ Update system summary (4/4 agents)

---

## 💾 Technical Configuration

### BigQuery:
- **Project:** salfagpt
- **Dataset:** flow_analytics
- **Table:** document_embeddings
- **Schema:** 9 fields (backward compatible)

### Firestore Collections:
- **context_sources:** 2,188 sources (shared pool)
- **agent_sources:** 2,188 assignments to M3-v2
- **conversations:** M3-v2 activeContextSourceIds

### Embeddings:
- **Model:** Gemini text-embedding-004
- **Dimensions:** 768
- **Fallback:** Deterministic if API fails

### RAG Search:
- **Method:** Cosine similarity (BigQuery vectorized)
- **Top K:** 5 chunks
- **Threshold:** >0.5 similarity

---

## 📊 Expected Results

| Métrica | Estimado | Confianza |
|---------|----------|-----------|
| Total sources | 2,188 | 100% ✅ |
| Docs processed | ~2,100 | 95% |
| Chunks generated | ~2,500-3,000 | 80% |
| Embeddings | ~2,500-3,000 | 80% |
| Similarity | >75% | 85% |
| Evaluations passed | 4/4 | 70% |
| Duration | 45min-1h | 90% |
| Cost | ~$0.025-0.030 | 90% |

**Based on:** Average from S2-v2 (76.3%), S1-v2 (79.2%), M1-v2 (~75%)

---

## 🔍 Monitoring Commands

```bash
# Check upload progress
tail -f /tmp/m3v2-upload.log
grep -c "Firestore ID:" /tmp/m3v2-upload.log

# Check chunk processing
tail -f /tmp/m3v2-chunks.log
grep "PROCESSING COMPLETE" /tmp/m3v2-chunks.log
grep -c "💾 Saved" /tmp/m3v2-chunks.log

# Run evaluation (when processing complete)
npx tsx scripts/test-m3v2-evaluation.mjs

# Verify final status
npx tsx scripts/check-m003-status.mjs
```

---

## 📋 Evaluation Configuration

### Question 1: Inicio de Obra
**Pregunta:** "¿Qué debo hacer antes de comenzar una obra de edificación?"

**Calidad esperada:**
- Mencionar PROCEDIMIENTO INICIO DE OBRAS, PLANIFICACIÓN INICIAL, PLAN DE CALIDAD, ENTORNO VECINOS
- Pasos concretos de preparación

**Formato esperado:**
- Comenzar con procedimientos clave
- Punteo de 6-10 pasos

---

### Question 2: Panel Financiero
**Pregunta:** "¿Qué documentos necesito para el Panel Financiero de un proyecto afecto?"

**Calidad esperada:**
- PROCESO PANEL FINANCIERO PROYECTOS AFECTOS (V1)
- Panel 0, paneles mensuales, codificación, control costos/ingresos

**Formato esperado:**
- Lista de documentos/anexos
- 1 línea descripción cada uno
- Referencia a procedimiento

---

### Question 3: Vecino Molesto
**Pregunta:** "Tengo un vecino molesto por el polvo de la obra, ¿qué debo hacer?"

**Calidad esperada:**
- ENTORNO VECINOS Y RELACIONAMIENTO COMUNITARIO (V4)
- FORMULARIO DE VISITA, CARTA DE ACUERDOS
- Pasos: recibir, registrar, evaluar, definir medidas, comunicar

**Formato esperado:**
- Lista numerada de pasos concretos
- 5-8 pasos
- Mencionar formularios específicos

---

### Question 4: Reuniones (Corta)
**Pregunta:** "Respuesta corta: ¿Qué reuniones debo tener según gestión de construcción en obra?"

**Calidad esperada:**
- PROCEDIMIENTO DE GESTION DE CONSTRUCCION EN OBRA (V2)
- 4 tipos: Planificación Intermedia, Línea de Mando, Subcontratos, Cumplimiento/Retroalimentación

**Formato esperado:**
- **MUY BREVE** (máximo 8 líneas)
- Lista de 4 tipos
- 1 línea cada una
- Respetar "respuesta corta"

---

## 🎯 Success Criteria

### Technical:
- [🔄] All 2,188 sources assigned
- [⏳] Chunks > 2,000
- [⏳] Embeddings = Chunks
- [⏳] Similarity > 70%
- [⏳] Search latency < 15s

### Functional:
- [⏳] 4/4 evaluations passed
- [⏳] Correct document references
- [⏳] Appropriate response length
- [⏳] Follows "respuesta corta" instruction

### Quality:
- [⏳] References GOP procedures
- [⏳] Cites correct documents
- [⏳] Structured format (viñetas/numeración)
- [⏳] Avoids "muro de texto"

---

## 🚨 Common Issues to Avoid

### ❌ INACEPTABLE Examples:
1. "No encuentro el documento" cuando ENTORNO VECINOS está cargado
2. No responder pregunta original (divagar sobre otros procedimientos)
3. Muro de texto ignorando "respuesta corta"
4. Respuesta genérica legal sin usar procedimientos GOP

### ✅ SOBRESALIENTE Examples:
1. Menciona procedimientos exactos
2. Responde directo
3. Usa punteos
4. Empieza con resumen
5. Se adapta al pedido ("tipo lista", "corta")

---

## 📈 Progress Tracking

### Upload Process:
```
Started: 2025-11-22 [Time]
Target: 93 documents
Format: PDF, XLSX, DOCX
Method: Local extraction + Firestore upload
Background: /tmp/m3v2-upload.log
```

### Chunking Process:
```
Started: 2025-11-22 [Time]
Target: ~2,100 sources
Chunks: ~2,500-3,000 estimated
Embeddings: 768 dimensions (Gemini)
Background: /tmp/m3v2-chunks.log
```

---

## 🔗 Related Files

### Scripts:
- `scripts/find-m3-agent.mjs` - Find agent ID ✅
- `scripts/check-m003-status.mjs` - Status analysis ✅
- `scripts/assign-all-m003-to-m3v2.mjs` - Bulk assignment ✅
- `scripts/upload-m003-documents.mjs` - Upload missing docs 🔄
- `scripts/process-m3v2-chunks.mjs` - Chunking + embeddings 🔄
- `scripts/test-m3v2-evaluation.mjs` - RAG evaluation ⏳

### Reports:
- `M003_STATUS_REPORT.md` - Current status ✅
- `M003_COMPLETION_SUMMARY.md` - Final summary ⏳
- `M3_DEPLOYMENT_SUCCESS.md` - Success report ⏳

### Context:
- `PROMPT_CONTINUE_M3V2.md` - This configuration ✅
- `READY_FOR_M3V2.md` - Handoff doc ✅
- `CONTEXT_HANDOFF_M1_M3.md` - Original process ✅

---

## 💡 Optimizations Applied

### From S2-v2, S1-v2, M1-v2:
1. ✅ Batch processing (500 rows/batch BigQuery)
2. ✅ Semantic embeddings (768 dims)
3. ✅ Background execution (non-blocking)
4. ✅ Robust error handling
5. ✅ Progress logging
6. ✅ Backward compatible schema

### M3-v2 Specific:
1. ✅ Auto-assignment during upload
2. ✅ Parallel upload + chunking (started together)
3. ✅ GOP-specific categorization
4. 🔄 Smart filtering by document type

---

## 🎓 Key Documents

### Critical Procedures:
1. **PLAN DE CALIDAD Y OPERACIÓN (V1)** - Base para todo
2. **ENTORNO VECINOS Y RELACIONAMIENTO COMUNITARIO (V4)** - Reclamos vecinos
3. **PROCESO PANEL FINANCIERO PROYECTOS AFECTOS (V1)** - Control financiero
4. **GESTIÓN DE BODEGA DE OBRAS (V7)** - Materiales
5. **PROCEDIMIENTO DE GESTION DE CONSTRUCCION EN OBRA (V2)** - Reuniones
6. **PROCEDIMIENTO INICIO DE OBRAS** - Setup inicial
7. **PLANIFICACIÓN INICIAL DE OBRA** - Planning

### Key Forms/Templates:
1. **FORMULARIO DE VISITA** - Registro vecinos
2. **CARTA DE ACUERDOS** - Respuesta formal
3. **MINUTA DE REUNIÓN** - Acuerdos obra
4. **CARTA AUTORIZACIÓN** - Reparaciones
5. Planillas control varias (60+ Excel/Word)

---

## 🎯 Next Steps

### When Processing Completes:
1. Run evaluation: `npx tsx scripts/test-m3v2-evaluation.mjs`
2. Verify status: `npx tsx scripts/check-m003-status.mjs`
3. Generate completion report
4. Create system summary (4/4 agents)

### Expected Timeline:
- Processing: 45min-1h (background)
- Evaluation: 10 min
- Reports: 5 min
- **Total:** ~1h 15min hands-on, ~2h total

---

**Generated:** 2025-11-22  
**Status:** 🔄 PROCESSING  
**Agent:** M3-v2 GOP GPT (vStojK73ZKbjNsEnqANJ)  
**Completion:** ~60% (2,188 assigned, processing chunks)

