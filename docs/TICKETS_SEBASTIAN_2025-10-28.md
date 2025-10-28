# 🎫 Tickets Creados - Feedback Sebastian

**Fecha:** 2025-10-28  
**Usuario:** Sebastian (Salfacorp)  
**Tickets Creados:** 5  
**Lane Inicial:** Roadmap (next)  
**Estado Inicial:** Ready

---

## 📊 Resumen de Tickets

| ID | Título | Agente | Prioridad | Effort | Status |
|---|---|---|---|---|---|
| `Vs5ZAj5HSN5EAO12Q6lT` | Referencias no aparecen | S1 | 🔴 High | M | 🗺️ Roadmap |
| `8fgFByaZXFQrpz5EwrdY` | AI inventa referencias [FIXED] | M1 | 🔴 Critical | S | 🗺️ Roadmap |
| `m7hnfk49hxa59qWkCcW8` | 80% fragmentos basura [FIXED] | M1 | 🔴 Critical | M | 🗺️ Roadmap |
| `6lOqVHY2MvUB8ItdL6Hr` | Modal "Ver documento" no abre | M1 | 🟡 Medium | S | 🗺️ Roadmap |
| `seMry1cyyVT3VNrcSBID` | AI solo menciona docs sin contenido | S1 | 🔴 High | M | 🗺️ Roadmap |

---

## 🎯 Workflow de Kanban

### Estado Actual: Todos en **Roadmap (next)**

```
┌─────────────┬──────────┬─────────┬─────────┐
│   Backlog   │ Roadmap  │   Now   │  Done   │
│             │  (next)  │         │         │
├─────────────┼──────────┼─────────┼─────────┤
│             │ FB-001   │         │         │
│             │ FB-002✅ │         │         │
│             │ FB-003✅ │         │         │
│             │ FB-004   │         │         │
│             │ FB-005   │         │         │
└─────────────┴──────────┴─────────┴─────────┘
```

### Flujo de Estados

```
Roadmap (next) → Now (in_progress) → Review (testing) → Done (completed)
     ↑              ↑                      ↑                   ↑
  Ready to      Being worked on      User testing        Sebastian
  prioritize                                              confirms OK
```

### Comandos para Mover Tickets

```bash
# Cuando empezamos a trabajar en uno:
# move <ticket-id> --lane now --status in_progress

# Cuando está listo para testing:
# move <ticket-id> --lane now --status review

# Cuando Sebastian confirma que funciona:
# move <ticket-id> --lane done --status done
```

---

## 📋 Detalle de Cada Ticket

### **Ticket 1: FB-001** `Vs5ZAj5HSN5EAO12Q6lT`

**Título:** [S1] Referencias no aparecen en respuestas  
**Agente:** S1 (GESTION BODEGAS GPT - S001)  
**Prioridad:** 🔴 High  
**Effort:** M (Medium)  
**Tags:** `s1`, `referencias`, `rag`, `sebastian-feedback`

**User Story:**
> Como usuario de S1, quiero ver referencias clickeables en las respuestas, para poder verificar las fuentes de información

**Acceptance Criteria:**
- [ ] S1 muestra referencias clickeables tipo [1], [2], [3]
- [ ] Referencias aparecen tanto en usuario admin como usuario final
- [ ] Panel de Referencias muestra fragmentos utilizados
- [ ] Click en referencia abre detalle del fragmento

**Estado:** 🗺️ Roadmap → Requiere investigación

---

### **Ticket 2: FB-002** `8fgFByaZXFQrpz5EwrdY` ✅

**Título:** [M1] AI inventa referencias que no existen (FIXED)  
**Agente:** M1 (Legal Territorial - M001)  
**Prioridad:** 🔴 Critical  
**Effort:** S (Small)  
**Tags:** `m1`, `referencias`, `alucinacion`, `rag`, `sebastian-feedback`, `fixed`

**User Story:**
> Como usuario de M1, quiero que las referencias sean solo a fragmentos que existen, para poder confiar en las citas

**Acceptance Criteria:**
- [ ] AI solo usa referencias que existen (ej: [1-5] si hay 5 fragmentos)
- [ ] NO aparecen referencias inventadas ([6], [7], etc.)
- [ ] Testing con pregunta "¿Qué es un OGUC?" pasa
- [ ] Sebastian confirma que funciona correctamente

**Fix Implementado:** ✅ Commit `ce47110`  
**Estado:** 🗺️ Roadmap → Pendiente testing por Sebastian

**Testing:**
```
1. Abrir M1
2. Preguntar: "¿Qué es un OGUC?"
3. Verificar: Solo usa [1][2][3][4][5], NO [7]
4. Sebastian confirma OK → Move to Done
```

---

### **Ticket 3: FB-003** `m7hnfk49hxa59qWkCcW8` ✅

**Título:** [M1] 80% de fragmentos RAG son basura (FIXED)  
**Agente:** M1 (Legal Territorial - M001)  
**Prioridad:** 🔴 Critical  
**Effort:** M (Medium)  
**Tags:** `m1`, `rag`, `chunks`, `calidad`, `sebastian-feedback`, `fixed`, `requiere-reindex`

**User Story:**
> Como usuario de M1, quiero que los fragmentos RAG sean útiles y relevantes, para obtener respuestas de calidad basadas en documentos

**Acceptance Criteria:**
- [ ] Fragmentos NO contienen headers TOC ("INTRODUCCIÓN ...")
- [ ] Fragmentos NO contienen números de página ("Página X de Y")
- [ ] Fragmentos NO contienen solo separadores o puntos
- [ ] Al menos 80% de fragmentos devueltos son útiles
- [ ] Pregunta "¿Qué es un OGUC?" devuelve 4-5 de 5 útiles
- [ ] Sebastian confirma mejora en calidad

**Fix Implementado:** ✅ Commit `ce47110`  
**Estado:** 🗺️ Roadmap → Pendiente re-indexing + testing

**Requiere:**
```bash
# 1. Re-indexar documentos de M1
npx tsx scripts/reindex-m001-documents.ts

# 2. Testing
Preguntar: "¿Qué es un OGUC?"
Verificar: 4-5 de 5 fragmentos útiles (no TOC/páginas)

# 3. Sebastian confirma → Move to Done
```

---

### **Ticket 4: FB-004** `6lOqVHY2MvUB8ItdL6Hr`

**Título:** [M1] Modal "Ver documento original" no abre  
**Agente:** M1 (Legal Territorial - M001)  
**Prioridad:** 🟡 Medium  
**Effort:** S (Small)  
**Tags:** `m1`, `modal`, `ui`, `referencias`, `sebastian-feedback`

**User Story:**
> Como usuario, quiero ver el documento completo al hacer click en "Ver documento original", para entender el contexto completo del fragmento

**Acceptance Criteria:**
- [ ] Click en "Ver documento original" abre modal
- [ ] Modal muestra documento completo
- [ ] Modal tiene opción de cerrar (X o ESC)
- [ ] Modal muestra nombre del documento en header

**Estado:** 🗺️ Roadmap → Requiere investigación

**Investigación:**
- Verificar si modal está implementado
- Verificar event handler onClick
- Implementar o arreglar según hallazgos

---

### **Ticket 5: FB-005** `seMry1cyyVT3VNrcSBID`

**Título:** [S1] AI menciona documentos pero no usa su contenido  
**Agente:** S1 (GESTION BODEGAS GPT - S001)  
**Prioridad:** 🔴 High  
**Effort:** M (Medium)  
**Tags:** `s1`, `documentos`, `contenido`, `referencias-cruzadas`, `sebastian-feedback`

**User Story:**
> Como usuario de S1, quiero que el AI use el contenido de los documentos para responder, no solo mencionar que existen otros documentos

**Acceptance Criteria:**
- [ ] AI responde con el contenido de documentos, no solo menciones
- [ ] Todos los documentos referenciados están subidos al sistema
- [ ] Pregunta sobre procedimientos obtiene pasos concretos
- [ ] No dice "consulta el instructivo X" si X no está disponible

**Estado:** 🗺️ Roadmap → Requiere subir documentos faltantes

**Root Cause:**
- Documento MAQ-LOG-CBO-I-002 está subido ✅
- Documento menciona MAQ-LOG-CBO-PP-009 ✅
- Documento PP-009 NO está subido ❌

**Solución:**
```bash
# 1. Identificar documentos faltantes mencionados
# 2. Conseguir PDFs de documentos referenciados
# 3. Subir vía CLI o webapp
# 4. Asignar a agente S001
# 5. Activar toggles
# 6. Testing
```

---

## 🔗 Links Útiles

### Firestore Console
- **Todos los tickets:** https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore/data/~2Fbacklog_items

### Tickets Individuales
- **FB-001:** https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore/data/~2Fbacklog_items~2FVs5ZAj5HSN5EAO12Q6lT
- **FB-002:** https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore/data/~2Fbacklog_items~2F8fgFByaZXFQrpz5EwrdY
- **FB-003:** https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore/data/~2Fbacklog_items~2Fm7hnfk49hxa59qWkCcW8
- **FB-004:** https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore/data/~2Fbacklog_items~2F6lOqVHY2MvUB8ItdL6Hr
- **FB-005:** https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore/data/~2Fbacklog_items~2FseMry1cyyVT3VNrcSBID

### Webapp Roadmap View
- **Kanban Board:** http://localhost:3000/roadmap

---

## 📅 Timeline

### Creación
- **Creados:** 2025-10-28 16:30
- **Fuente:** Feedback directo de Sebastian vía WhatsApp
- **Commit de Fixes:** `ce47110`

### Próximos Hitos

**Hoy (2025-10-28):**
- [x] Crear tickets en backlog
- [x] Documentar cada issue
- [ ] Testing de FB-002 (anti-alucinación)
- [ ] Testing de FB-003 (filtro basura)

**Mañana (2025-10-29):**
- [ ] Re-indexar documentos M1
- [ ] Investigar FB-001 (S1 sin referencias)
- [ ] Investigar FB-004 (modal documento)
- [ ] Investigar FB-005 (documentos faltantes)

**Esta Semana:**
- [ ] Sebastian testing de los 2 fixes
- [ ] Sebastian confirma si funcionan
- [ ] Mover tickets a Review o Done según feedback

---

## 🎬 Cómo Proceder

### Para Developer (Alec):

**Cuando trabajas en un ticket:**
```typescript
// Mover a Now lane
await fetch('/api/backlog/move', {
  method: 'POST',
  body: JSON.stringify({
    itemId: 'Vs5ZAj5HSN5EAO12Q6lT',
    lane: 'now',
    status: 'in_progress'
  })
});
```

**Cuando terminas el fix:**
```typescript
// Mover a Review
await fetch('/api/backlog/move', {
  method: 'POST',
  body: JSON.stringify({
    itemId: 'Vs5ZAj5HSN5EAO12Q6lT',
    lane: 'now',
    status: 'review'
  })
});
```

### Para Sebastian (Usuario):

**Cuando testas un fix:**
```
1. Seguir acceptance criteria
2. Verificar cada checkbox
3. Si funciona: Decir "OK" o confirmar
4. Si no funciona: Más feedback específico
```

**Cuando confirmas que funciona:**
```typescript
// Developer mueve a Done
await fetch('/api/backlog/move', {
  method: 'POST',
  body: JSON.stringify({
    itemId: '8fgFByaZXFQrpz5EwrdY',
    lane: 'done',
    status: 'done',
    completedAt: new Date()
  })
});
```

---

## 🏷️ Tags por Agente

**S1 (GESTION BODEGAS):**
- `s1`
- `referencias`
- `documentos`
- `contenido`

**M1 (Legal Territorial):**
- `m1`
- `referencias`
- `alucinacion`
- `rag`
- `chunks`
- `modal`
- `ui`

**General:**
- `sebastian-feedback`
- `fixed` (para tickets ya resueltos pending testing)
- `requiere-reindex`

---

## 📈 Métricas de Impacto

### CSAT Impact (Customer Satisfaction)
- **Total Estimado:** +42 puntos
- **Critical Issues:** +19 puntos (FB-002, FB-003)
- **High Issues:** +17 puntos (FB-001, FB-005)
- **Medium Issues:** +6 puntos (FB-004)

### NPS Impact (Net Promoter Score)
- **Total Estimado:** +90 puntos
- **Critical Issues:** +45 puntos (FB-002, FB-003)
- **High Issues:** +35 puntos (FB-001, FB-005)
- **Medium Issues:** +10 puntos (FB-004)

### Usuarios Afectados
- **Total:** 2 (Sebastian + admin)
- **Potencial:** Todos los usuarios de S1 y M1

---

## ✅ Fixes Ya Implementados (Pending Testing)

### FB-002: Anti-Alucinación ✅
**Commit:** `ce47110`  
**Archivos:** `src/lib/gemini.ts`  
**Testing:** Pregunta "¿Qué es un OGUC?" en M1

### FB-003: Filtro Basura ✅
**Commit:** `ce47110`  
**Archivos:** 
- `src/lib/chunking.ts`
- `src/lib/rag-indexing.ts`
- `cli/lib/embeddings.ts`

**Testing:** Re-indexar M1 + pregunta "¿Qué es un OGUC?"

---

## 🔄 Próximas Acciones

### Inmediato (Hoy)
- [ ] Notificar a Sebastian que tickets están creados
- [ ] Compartir link al Kanban: http://localhost:3000/roadmap
- [ ] Solicitar testing de FB-002 y FB-003
- [ ] Esperar confirmación o más feedback

### Corto Plazo (Esta Semana)
- [ ] Re-indexar documentos M1
- [ ] Investigar FB-001 (verificar contexto S1)
- [ ] Investigar FB-004 (modal documento)
- [ ] Identificar documentos faltantes para FB-005

### Testing con Sebastian
- [ ] FB-002: Testing pregunta "¿Qué es un OGUC?"
- [ ] FB-003: Verificar fragmentos útiles
- [ ] FB-001: Screenshot panel contexto S1
- [ ] FB-004: Intentar abrir modal
- [ ] FB-005: Identificar qué documentos faltan

---

## 📊 Visualización en Roadmap

**Ver todos los tickets en:**
```
http://localhost:3000/roadmap
```

**Esperado en la UI:**
```
📋 Roadmap (5 items)
┌────────────────────────────────────────┐
│ 🔴 [M1] AI inventa referencias [FIXED]│
│    Priority: Critical | Effort: S      │
│    ✅ Fix implementado - Pending test  │
├────────────────────────────────────────┤
│ 🔴 [M1] 80% fragmentos basura [FIXED] │
│    Priority: Critical | Effort: M      │
│    ✅ Fix implementado - Pending test  │
├────────────────────────────────────────┤
│ 🔴 [S1] Referencias no aparecen        │
│    Priority: High | Effort: M          │
│    🔍 Investigación requerida          │
├────────────────────────────────────────┤
│ 🔴 [S1] AI solo menciona docs          │
│    Priority: High | Effort: M          │
│    📦 Requiere subir docs faltantes    │
├────────────────────────────────────────┤
│ 🟡 [M1] Modal no abre                  │
│    Priority: Medium | Effort: S        │
│    🔍 Investigación requerida          │
└────────────────────────────────────────┘
```

---

## 🔐 Firestore Collection

**Collection:** `backlog_items`  
**Project:** gen-lang-client-0986191192  
**Database:** (default)

**Query para ver estos tickets:**
```javascript
firestore.collection('backlog_items')
  .where('companyId', '==', 'salfacorp')
  .where('tags', 'array-contains', 'sebastian-feedback')
  .orderBy('priority', 'desc')
  .get()
```

---

## 📝 Notas Adicionales

### Testing con Fichas
Sebastian mencionó:
- S1 tiene ~70 preguntas en su ficha
- M1 tiene lista de preguntas en su ficha
- Criterio: Respuesta relevante + con sentido
- Objetivo: Al menos 50% respondan bien

**Próximo paso después de estos 5 tickets:**
- Implementar testing automático con las 70 preguntas
- Generar reporte de coverage
- Identificar gaps de conocimiento

### Documentación
- ✅ `docs/FEEDBACK_SEBASTIAN_2025-10-28.md` - Análisis técnico
- ✅ `docs/MENSAJE_SEBASTIAN_2025-10-28.md` - Comunicación usuario
- ✅ `docs/TICKETS_SEBASTIAN_2025-10-28.md` - Este archivo (tracking)

---

**Última actualización:** 2025-10-28 16:35  
**Creados por:** Sistema automático vía API  
**Fuente:** Feedback WhatsApp de Sebastian  
**Commit de Fixes:** `ce47110`

