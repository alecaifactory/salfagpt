# 📋 S001 Complete Testing Guide

**Agent:** GESTION BODEGAS GPT (S001)  
**Total Questions:** 66  
**Already Tested:** 1 (Q004)  
**To Test:** 65  
**Date:** 2025-10-29

---

## 🎯 Testing Strategy

### Recommended Approach: Phased Testing

**Phase 1: Critical Questions (9 questions) - 30-45 mins**
- Covers most important operational procedures
- Highest impact on user experience
- Should complete first

**Phase 2: High Priority (24 questions) - 2 hours**
- Important but less critical than Phase 1
- Covers day-to-day operations
- Complete after Phase 1

**Phase 3: Medium/Low Priority (32 questions) - 2 hours**
- Edge cases and less frequent operations
- Complete if time permits

---

## 📝 Testing Procedure (Per Question)

### Step 1: Setup
1. Open browser: http://localhost:3000/chat
2. Login with: alec@getaifactory.com
3. Select agent: **GESTION BODEGAS GPT (S001)**
4. Start new conversation: Click "+ Nuevo Agente"

### Step 2: Send Question
1. Copy question text exactly from list below
2. Paste into chat input
3. Click "Enviar" or press Enter
4. Wait for response (30-60 seconds)

### Step 3: Verify Response
1. Click "📚 Referencias utilizadas [N]" button
2. Count reference badges: [1] [2] [3]...
3. Check for phantom refs (numbers > total badges)
4. Read response completeness
5. Evaluate usefulness for warehouse specialist

### Step 4: Document
Create file: `docs/evaluations/evaluations/EVAL-S001-2025-10-29-v1/responses/Q0XX-response.md`

Use template:
```markdown
# S001-Q0XX - [Question]

**Evaluation:** EVAL-S001-2025-10-29-v1
**Timestamp:** [ISO timestamp]
**Model:** gemini-2.5-flash
**Status:** ✅ TESTED

---

## 📋 Pregunta

**ID:** S001-Q0XX
**Categoría:** [Category]
**Prioridad:** [CRITICAL/HIGH/MEDIUM/LOW]

```
[Question text]
```

---

## 💬 Respuesta del Agente

[Full response in markdown]

---

## 📚 Referencias Utilizadas ([N])

### [1] [Document name] ([X]% similitud)
- **Chunks:** [N] consolidados
- **Tokens:** [N]
- **Preview:** [text preview]

[Repeat for each reference]

---

## ✅ Validación Técnica

### Numeración:
- Phantom refs: NO ✅ / SÍ ❌
- Referencias en rango: SÍ ✅
- Máx ref usado: [N]
- Total badges: [N]
- Consistencia: 100%

### Calidad:
- Respuesta completa: SÍ
- Contenido técnico: SÍ
- Referencias relevantes: SÍ
- Útil para especialista: SÍ

### Calificación Técnica: __/10

**Motivos:**
- [Explain rating]

---

## 👥 Evaluación de Experto

**Status:** ⏳ PENDIENTE

---

**Última Actualización:** [timestamp]
```

### Step 5: Rate Quality (1-10)
- **10:** Perfect - complete, accurate, actionable with SAP specifics
- **9:** Excellent - very good with minor gaps
- **8:** Very good - useful but could be more detailed
- **7:** Good - functional but basic
- **6:** Acceptable - minimal but works
- **5 or below:** Insufficient

---

## 📊 PHASE 1: CRITICAL Questions (9)

Test these first - most important for operations:

### 1. S001-Q001 - Códigos de Materiales
**Category:** Códigos y Catálogos  
**Priority:** CRITICAL  
**Question:**
```
¿Dónde busco los códigos de materiales?
```
**Expected:** SAP transaction codes, material catalog references

---

### 2. S001-Q002 - Pedido de Convenio
**Category:** Procedimientos SAP  
**Priority:** CRITICAL  
**Question:**
```
¿Cómo hago una pedido de convenio?
```
**Expected:** SAP procedure, step-by-step, transaction codes

---

### 3. S001-Q008 - Calendario Inventarios PEP
**Category:** Inventarios  
**Priority:** CRITICAL  
**Question:**
```
¿Cuál es el calendario de inventarios para el PEP?
```
**Expected:** Schedule, dates, PEP reference

---

### 4. S001-Q009 - Guía de Despacho
**Category:** Guías de Despacho  
**Priority:** CRITICAL  
**Question:**
```
¿Cómo genero una guía de despacho?
```
**Expected:** SAP procedure, steps, transaction codes

---

### 5. S001-Q011 - Qué es ST
**Category:** Transporte y Logística  
**Priority:** CRITICAL  
**Question:**
```
¿Qué es una ST?
```
**Expected:** Definition (Solicitud de Transporte), format, usage

---

### 6. S001-Q012 - Qué es SIM
**Category:** Transporte y Logística  
**Priority:** CRITICAL  
**Question:**
```
¿Qué es una SIM?
```
**Expected:** Definition (Solicitud Interna de Materiales), format, fields

---

### 7. S001-Q052 - Generar Guía de Despacho (duplicate)
**Category:** Guías de Despacho  
**Priority:** CRITICAL  
**Question:**
```
¿Cómo puedo generar una guía de despacho?
```
**Expected:** Same as Q009, verify consistency

---

### 8. S001-Q058 - Traspaso de Bodega
**Category:** Traspasos  
**Priority:** CRITICAL  
**Question:**
```
¿Cómo se realiza un traspaso de bodega?
```
**Expected:** Complete procedure, SAP steps, email requirements

---

### 9. S001-Q063 - Encontrar Procedimientos
**Category:** Documentación  
**Priority:** CRITICAL  
**Question:**
```
¿Cómo encuentro un Procedimiento, Instructivo o Paso a Paso?
```
**Expected:** Search locations, SharePoint, document types

---

## 📊 PHASE 2: HIGH Priority (Sample from 24)

### Category: Códigos y Catálogos (2 questions)

#### 10. S001-Q006 - Códigos de Servicios
**Question:**
```
¿Dónde busco los códigos de los diferentes tipos de servicios?
```
**Expected:** ZSER transaction, service codes catalog

---

#### 11. S001-Q007 - Códigos de Equipos
**Question:**
```
¿Dónde busco los códigos de los diferentes tipos de equipo?
```
**Expected:** Equipment catalog, SAP transaction

---

### Category: Procedimientos SAP (3 questions)

#### 12. S001-Q023 - Solicitud de Materiales
**Question:**
```
¿Cómo puedo generar una solicitud de materiales?
```
**Expected:** SIM procedure, SAP steps

---

#### 13. S001-Q024 - Compra por Convenio
**Question:**
```
¿Cómo puedo generar una compra por convenio?
```
**Expected:** Purchase procedure, agreement codes

---

#### 14. S001-Q031 - Creación de Proveedores
**Question:**
```
¿Cómo solicito la creación de Proveedores?
```
**Expected:** Provider creation request, requirements, process

---

### Category: Gestión Combustible (2 questions)

#### 15. S001-Q003 - Envío Informe Petróleo
**Question:**
```
¿Cuándo debo enviar el informe de consumo de petróleo?
```
**Expected:** 4to día hábil deadline, recipients

---

#### 16. S001-Q049 - Descargar Reporte Combustible
**Question:**
```
¿Cómo descargo un reporte de consumo de combustible?
```
**Expected:** SAP transaction, download procedure

---

### Category: Transporte y Logística (2 questions)

#### 17. S001-Q010 - Solicitud de Transporte
**Question:**
```
¿Cómo hago una solicitud de transporte?
```
**Expected:** SAMEX, LE-TRA references, request format

---

#### 18. S001-Q047 - Transporte SAMEX
**Question:**
```
¿Cómo solicito un transporte SAMEX?
```
**Expected:** SAMEX procedure, ST format

---

### Category: Inventarios (2 questions)

#### 19. S001-Q055 - Descargar Inventario SAP
**Question:**
```
¿Cómo puedo descargar un inventario de sistema SAP?
```
**Expected:** Report transaction, download steps

---

#### 20. S001-Q056 - Realizar Inventario
**Question:**
```
¿Cómo realizo un inventario de materiales?
```
**Expected:** Inventory procedure, count process, SAP recording

---

### Category: Guías de Despacho (1 question)

#### 21. S001-Q053 - Instructivo Guías
**Question:**
```
¿Existe algún instructivo para la emisión de guías de despacho?
```
**Expected:** Document references, instructive availability

---

### Category: Traspasos (2 questions)

#### 22. S001-Q059 - Copia en Traspaso
**Question:**
```
¿Debo copiar a alguien cuando genero un traspaso de bodega?
```
**Expected:** Email recipients, copy requirements

---

#### 23. S001-Q060 - Traspaso Entre Obras
**Question:**
```
¿Cómo se puede hacer un traspaso de materiales entre obras?
```
**Expected:** Inter-site transfer procedure

---

### Category: Documentación (2 questions)

#### 24. S001-Q062 - Procedimientos SSOMA
**Question:**
```
¿Cómo encuentro los procedimientos actualizados de SSOMA?
```
**Expected:** SharePoint location, SSOMA documents

---

#### 25. S001-Q064 - Verificar Última Versión
**Question:**
```
¿Cómo se si es la última versión de un Procedimiento, Instructivo o Paso a Paso?
```
**Expected:** Version control, document metadata

---

## 📊 PHASE 3: MEDIUM/LOW Priority (Sample from 32)

### Bodega Fácil (2 questions)

#### 26. S001-Q016 - Implementos BF
**Question:**
```
¿Cómo solicito los implementos para activar bodega fácil?
```
**Expected:** BF activation, implements request

---

#### 27. S001-Q022 - Capacitación BF
**Question:**
```
¿Cómo solicito una capacitación de bodega fácil (BF)?
```
**Expected:** Training request procedure

---

### Equipos Terceros (1 question)

#### 28. S001-Q041 - Ingreso Equipo Tercero
**Question:**
```
¿Cómo ingreso un equipo de tercero a sistema SAP?
```
**Expected:** Third-party equipment registration, SAP steps

---

### Additional Coverage (2 questions)

#### 29. S001-Q025 - Formato SIM
**Question:**
```
¿Cuál es el formato de solicitud interna de materiales (SIM)?
```
**Expected:** SIM format fields, structure

---

#### 30. S001-Q034 - Creación Código Material
**Question:**
```
¿Cómo solicito la creación de un código de material?
```
**Expected:** Material code creation request, maestro materiales

---

## 📈 Progress Tracking

Create file: `docs/evaluations/EVAL-S001-PROGRESS.md`

Track completion:
```markdown
## Testing Progress

**Started:** [timestamp]
**Current Phase:** Phase X
**Questions Completed:** X/66 (XX%)
**Average Quality:** X.X/10
**Phantom Refs Detected:** X

### Phase 1 (Critical): X/9 complete
- [ ] Q001 - Códigos de materiales
- [ ] Q002 - Pedido convenio
- [ ] Q008 - Calendario inventarios
- [ ] Q009 - Guía de despacho
- [ ] Q011 - Qué es ST
- [ ] Q012 - Qué es SIM
- [ ] Q052 - Generar guía despacho
- [ ] Q058 - Traspaso bodega
- [ ] Q063 - Encontrar procedimientos

[Update after each question tested]
```

---

## 🎯 Quality Metrics Targets

Based on initial testing (Q004: 10/10):

- **Target Average:** ≥ 8.5/10
- **Target Phantom Refs:** 0
- **Target Coverage Critical:** 100% (9/9)
- **Target Coverage High:** ≥ 80% (20/24)
- **Target Overall:** ≥ 60% (40/66)

---

## 📊 Quick Test Template

For rapid testing, use this abbreviated documentation:

```
Q0XX | [Question] | Rating: X/10 | Refs: N | Phantoms: NO/SÍ | Notes: [brief]
```

Example:
```
Q001 | Códigos materiales | 9/10 | Refs: 5 | Phantoms: NO | Good SAP guidance
Q002 | Pedido convenio | 8/10 | Refs: 7 | Phantoms: NO | Complete but verbose
```

Full documentation can be created for:
- Critical questions (all 9)
- Failed questions (quality < 7)
- Questions with phantom refs
- Exceptional questions (quality = 10)

---

## 🚀 Efficient Testing Tips

1. **Batch Similar Questions:**
   - Test all "códigos" questions together
   - Test all "solicitar" questions together
   - Reduces context switching

2. **Use Browser Features:**
   - Keep questions list in one tab
   - Keep chat in another tab
   - Copy-paste quickly

3. **Document as You Go:**
   - Note quality rating immediately
   - Full docs can wait for critical/failed cases
   - Maintain momentum

4. **Track Patterns:**
   - If all "código" questions score 9+, likely others similar
   - If procedimientos SAP are strong, document that
   - Helps prioritize full documentation

---

## 📋 ALL 66 QUESTIONS (Complete List)

### CRITICAL Priority (9 questions) ⚠️ TEST FIRST

1. **S001-Q001** (cat-01) - ¿Dónde busco los códigos de materiales?
2. **S001-Q002** (cat-02) - ¿Cómo hago una pedido de convenio?
3. **S001-Q008** (cat-06) - ¿Cuál es el calendario de inventarios para el PEP?
4. **S001-Q009** (cat-05) - ¿Cómo genero una guía de despacho?
5. **S001-Q011** (cat-04) - ¿Qué es una ST?
6. **S001-Q012** (cat-04) - ¿Qué es una SIM?
7. **S001-Q052** (cat-05) - ¿Cómo puedo generar una guía de despacho?
8. **S001-Q058** (cat-07) - ¿Cómo se realiza un traspaso de bodega?
9. **S001-Q063** (cat-10) - ¿Cómo encuentro un Procedimiento, Instructivo o Paso a Paso?

### HIGH Priority (24 questions)

10. **S001-Q003** (cat-03) - ¿Cuándo debo enviar el informe de consumo de petróleo?
11. **S001-Q006** (cat-01) - ¿Dónde busco los códigos de los diferentes tipos de servicios?
12. **S001-Q007** (cat-01) - ¿Dónde busco los códigos de los diferentes tipos de equipo?
13. **S001-Q010** (cat-04) - ¿Cómo hago una solicitud de transporte?
14. **S001-Q013** (cat-01) - ¿Dónde busco la información de un PEP, Centro y almacén?
15. **S001-Q016** (cat-08) - ¿Cómo solicito los implementos para activar bodega fácil?
16. **S001-Q017** (cat-08) - ¿Cómo solicito los equipos para activar bodega fácil?
17. **S001-Q018** (cat-08) - ¿Cómo solicito los insumos para activar bodega fácil?
18. **S001-Q023** (cat-02) - ¿Cómo puedo generar una solicitud de materiales?
19. **S001-Q024** (cat-02) - ¿Cómo puedo generar una compra por convenio?
20. **S001-Q027** (cat-02) - ¿Cómo se realiza la solicitud de "servicios"
21. **S001-Q031** (cat-02) - ¿Cómo solicito la creación de Proveedores?
22. **S001-Q032** (cat-02) - ¿Qué requisitos hay para crear proveedores?
23. **S001-Q034** (cat-02) - ¿Cómo solicito la creación de un código de material?
24. **S001-Q035** (cat-01) - ¿Cómo puedo revisar los códigos de servicios vigentes para las ZSER?
25. **S001-Q036** (cat-02) - ¿Cómo ingreso una guía de despacho (GD) por SAP o PDA de bodega fácil?
26. **S001-Q037** (cat-02) - ¿Cómo ingreso un vale de Consumo a SAP o una reserva por bodega fácil?
27. **S001-Q040** (cat-02) - ¿Cómo solicito el arriendo o compra de un equipo?
28. **S001-Q047** (cat-04) - ¿Cómo solicito un transporte SAMEX?
29. **S001-Q055** (cat-06) - ¿Cómo puedo descargar un inventario de sistema SAP?
30. **S001-Q056** (cat-06) - ¿Cómo realizo un inventario de materiales?
31. **S001-Q060** (cat-07) - ¿Cómo se puede hacer un traspaso de materiales entre obras?
32. **S001-Q062** (cat-10) - ¿Cómo encuentro los procedimientos actualizados de SSOMA?
33. **S001-Q064** (cat-10) - ¿Cómo se si es la última versión de un Procedimiento, Instructivo o Paso a Paso?

### MEDIUM Priority (25 questions)

34. **S001-Q005** (cat-03) - ¿Para qué genero el informe de consumo de petróleo?
35. **S001-Q014** (cat-01) - ¿Cuál es código de servicio de catering?
36. **S001-Q015** (cat-01) - ¿Cuál es el código para solicitar un rotomartillo?
37. **S001-Q019** (cat-08) - ¿Cómo actualizo las cantidades en bodega fácil, si no me calza el físico con sistema?
38. **S001-Q020** (cat-08) - ¿Cómo solicito el arriendo de insumos tecnológicos?
39. **S001-Q022** (cat-08) - ¿Cómo solicito una capacitación de bodega fácil (BF)?
40. **S001-Q025** (cat-02) - ¿Cuál es el formato de solicitud interna de materiales (SIM)?
41. **S001-Q026** (cat-02) - ¿Cómo se genera una regularización de materiales?
42. **S001-Q028** (cat-02) - ¿Cómo se realiza una HES, en relación a un estado de pago?
43. **S001-Q030** (cat-02) - ¿Cómo controlo la entrega de EPP en obra?
44. **S001-Q033** (cat-02) - ¿A quién se le debe enviar la posible acreditación de un proveedor?
45. **S001-Q038** (cat-02) - ¿Cómo reviso y soluciono facturas del ZMONITOR?
46. **S001-Q039** (cat-02) - ¿Cuál es la TRX para revisar las facturas?
47. **S001-Q041** (cat-09) - ¿Cómo ingreso un equipo de tercero a sistema SAP?
48. **S001-Q042** (cat-06) - ¿Cómo puedo ver mi inventario de equipos?
49. **S001-Q044** (cat-09) - ¿Cómo se genera una regularización de equipos?
50. **S001-Q045** (cat-04) - ¿Cómo solicito el arriendo de un camión SUBCARGO?
51. **S001-Q046** (cat-04) - ¿Cómo solicito mi usuario LE-TRA?
52. **S001-Q048** (cat-04) - ¿Cómo solicito una cuenta SAMEX?
53. **S001-Q049** (cat-03) - ¿Cómo descargo un reporte de consumo de combustible?
54. **S001-Q053** (cat-05) - ¿Existe algún instructivo para la emisión de guías de despacho?
55. **S001-Q059** (cat-07) - ¿Debo copiar a alguien cuando genero un traspaso de bodega?
56. **S001-Q061** (cat-10) - ¿Cómo puedo obtener una mejor evaluación como jefatura de bodega?
57. **S001-Q065** (cat-10) - ¿Cómo encuentro un registro de gestión bodegas?
58. **S001-Q066** (cat-10) - ¿Cómo se si es la última versión de un registro de gestión bodegas?

### LOW Priority (8 questions)

59. **S001-Q021** (cat-08) - ¿Cómo solicito una cuenta PBI para maestro de materiales?
60. **S001-Q029** (cat-02) - ¿Cómo borro las posiciones de una SolPed?
61. **S001-Q043** (cat-09) - ¿Cómo puedo sacar de mi inventario de equipos, los que ya se han devuelto al proveedor de tercero?
62. **S001-Q050** (cat-03) - ¿Cómo anulo un consumo de petróleo?
63. **S001-Q051** (cat-03) - ¿Cómo hago para cargar el petróleo al generador que queda en el edificio?
64. **S001-Q054** (cat-05) - ¿A quién se debe solicitar instructivo para emitir guías de despacho internas?
65. **S001-Q057** (cat-06) - ¿Cómo borro una posición del inventario en SAP?

### Already Tested (1 question) ✅

66. **S001-Q004** (cat-03) - ¿Cómo genero el informe de consumo de petróleo? - **10/10** ⭐

---

## 📊 Suggested Testing Schedule

### Session 1 (45 mins): Critical Questions
- Test Q001-Q063 (9 CRITICAL questions)
- Document all thoroughly
- Expected: 8.5-9.5/10 average

### Session 2 (60-90 mins): High Priority Sample
- Test 15-20 HIGH questions
- Mix from different categories
- Quick documentation

### Session 3 (Optional): Comprehensive
- Test remaining questions
- Focus on gaps or low performers
- Complete documentation

---

## 🎯 Success Criteria

**Minimum (30 questions tested):**
- All 9 CRITICAL: ✅
- 15-20 HIGH: ✅
- Sample MEDIUM: ✅
- Average ≥ 8.5/10
- 0 phantom refs

**Ideal (All 66 questions):**
- Complete coverage: 66/66
- Category analysis complete
- Pattern identified
- Improvement roadmap created

---

## 📁 Output Files

Create these as you test:

```
docs/evaluations/evaluations/EVAL-S001-2025-10-29-v1/
├── responses/
│   ├── Q001-response.md (create for each)
│   ├── Q002-response.md
│   ├── Q004-response.md (already exists - 10/10)
│   └── ... (up to Q066)
│
├── references/
│   ├── Q001-references.json (optional)
│   └── ...
│
└── progress.md (track daily)
```

Update metadata.json after each session:
- questionsTested count
- coverage percentage  
- averageQuality
- qualityDistribution

---

## ✅ When Complete

Generate final report:
- Overall quality score
- Quality by category
- Phantom refs incidents
- Recommendations
- Comparison with M001
- Expert validation checklist

File: `docs/evaluations/reports/S001-EVALUATION-REPORT-2025-10-29.md`

---

**Ready to start testing!** 🚀

Open http://localhost:3000/chat, login, select S001, and begin with the 9 CRITICAL questions.

