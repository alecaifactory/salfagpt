# 🗺️ Roadmap Flow - Explicación Completa

**Fecha:** 2025-10-29  
**Usuario:** alec@getaifactory.com (SuperAdmin)

---

## 🎯 El Flujo Completo del Roadmap

### Visión General

```
Feedback de Usuario (Stella)
         ↓
    📋 BACKLOG
    Ideas pendientes
         ↓
    🔵 ROADMAP
    Planificado para implementar
         ↓
    🟡 REVISIÓN EXPERTOS
    Expertos validan técnicamente
         ↓
    🟣 APROBACIÓN
    Stakeholders aprueban
         ↓
    🟢 PRODUCCIÓN
    Implementado y desplegado
```

---

## 📊 Las 5 Columnas del Kanban

### 1. 📋 **Backlog** (Slate)

**Propósito:** Ideas y feedback inicial sin priorizar

**Contenido:**
- Feedback de Stella no procesado
- Ideas de usuarios
- Bugs reportados
- Sugerencias generales

**Criterios de entrada:**
- ✅ Feedback ticket creado (FEAT-XXXX)
- ✅ Descripción básica existe
- ❌ NO requiere análisis detallado aún

**Acciones disponibles:**
- 🎯 **Mover a Roadmap** - Cuando decides implementar
- ✏️ **Editar** - Refinar descripción
- 🗑️ **Rechazar** - Si no se implementará

**Tiempo típico:** Indefinido (puede estar meses)

---

### 2. 🔵 **Roadmap** (Blue)

**Propósito:** Features planificados para implementar

**Contenido:**
- Features priorizados
- User stories definidos
- Acceptance criteria escritos
- Impact analysis completo

**Criterios de entrada:**
- ✅ Validado por Product Manager
- ✅ User story completo
- ✅ Acceptance criteria definidos
- ✅ Impact metrics estimados (CSAT, NPS, Users)
- ✅ Effort estimado (XS-XL)
- ✅ OKR alignment verificado

**Acciones disponibles:**
- 👥 **Enviar a Revisión** - Expertos técnicos revisan
- ⬅️ **Volver a Backlog** - Si se desconsidera
- ✏️ **Editar** - Refinar detalles

**Tiempo típico:** 1-4 semanas hasta revisión

**Ejemplo de item en Roadmap:**
```
Título: Exportar conversación como PDF
User Story: Como usuario, quiero exportar conversaciones 
            a PDF para compartir con mi equipo offline
Acceptance Criteria:
  ✓ Botón "Export PDF" en conversation header
  ✓ PDF incluye todos los mensajes formateados
  ✓ PDF incluye metadata (fecha, agente, modelo)
  ✓ Descarga automática al generar

Impact:
  CSAT: +2/5 (más productividad)
  NPS: +15 (feature diferenciador)
  Users: ~500 usuarios activos

Effort: [M] - 3-5 días
OKR: Alineado con "Increase user retention" (8/10)
```

---

### 3. 🟡 **Revisión Expertos** (Yellow)

**Propósito:** Validación técnica por expertos

**Contenido:**
- Features listos para implementar
- Esperando review técnico
- Feasibility analysis
- Technical design review

**Criterios de entrada:**
- ✅ Todo de Roadmap +
- ✅ Asignado a experto revisor
- ✅ Technical spec (si es complejo)

**Quién revisa:**
- 👨‍💼 Expertos técnicos
- 🏗️ Arquitectos
- 🔐 Security reviewers

**Preguntas que responden:**
- ¿Es técnicamente viable?
- ¿Hay alternativas mejores?
- ¿Impacto en performance?
- ¿Riesgos de seguridad?
- ¿Dependencias externas?
- ¿Effort estimate correcto?

**Acciones disponibles:**
- ✅ **Enviar a Aprobación** - Si aprobado
- ⬅️ **Volver a Roadmap** - Si requiere cambios
- ❌ **Rechazar** - Si no viable
- 💬 **Comentar** - Feedback para PM

**Tiempo típico:** 2-5 días

**Ejemplo de revisión:**
```
Feature: Exportar conversación como PDF

Revisor: Juan (expert@salfacorp.com)
Fecha: 2025-10-29

Comentarios:
✅ Viable - usar biblioteca jsPDF
⚠️ Considerar límite de tamaño (conversaciones >100 mensajes)
💡 Sugerencia: Agregar opción "Export rango de fechas"
🔐 Security: OK - no expone data sensible
📊 Performance: OK - generar async en background

Verdict: ✅ APROBADO con sugerencias
Effort ajustado: [M] → [L] (por sugerencias)
```

---

### 4. 🟣 **Aprobación** (Purple)

**Propósito:** Sign-off final de stakeholders

**Contenido:**
- Features técnicamente validados
- Esperando aprobación de negocio
- Budget approval
- Timeline confirmation

**Criterios de entrada:**
- ✅ Todo de Revisión Expertos +
- ✅ Review técnico aprobado
- ✅ Comments de expertos incorporados
- ✅ Final design/mockups listos

**Quién aprueba:**
- 👔 Product Owner
- 💼 Stakeholder senior
- 💰 Budget approver

**Preguntas que responden:**
- ¿Alineado con strategy?
- ¿Budget disponible?
- ¿Timing correcto?
- ¿Riesgos de negocio?
- ¿Go/No-go?

**Acciones disponibles:**
- 🚀 **Implementar** - Create worktree y asignar
- ⬅️ **Volver a Review** - Si requiere más análisis
- 📅 **Reprogramar** - Cambiar a otro quarter
- ❌ **Cancelar** - Si ya no aplica

**Tiempo típico:** 1-3 días

**Ejemplo de aprobación:**
```
Feature: Exportar conversación como PDF

Approver: María (Product Owner)
Fecha: 2025-10-30

Business Review:
✅ Alineado con Q4 OKRs
✅ Budget aprobado (~$2K dev time)
✅ Timeline OK para release Dec 15
✅ Marketing ready para anuncio
💡 Prioridad: Alta (muchas requests)

Decisión: ✅ GO - Implementar en Sprint 23

Target Release: 2025-12-15
Assigned to: Pedro (dev@salfacorp.com)
```

---

### 5. 🟢 **Producción** (Green)

**Propósito:** Features implementados y desplegados

**Contenido:**
- Features en producción
- Completamente deployed
- Users usando activamente
- Metrics siendo tracked

**Criterios de entrada:**
- ✅ Todo de Aprobación +
- ✅ Code completado
- ✅ PR merged
- ✅ Deployed a producción
- ✅ Tests passing
- ✅ Monitoring configurado

**Información visible:**
- 📅 Fecha de deployment
- 🔗 Link al PR
- 📊 Metrics post-launch
- 💬 User feedback recibido
- ✅ Success criteria met

**Acciones disponibles:**
- 📊 **Ver Metrics** - Impact real vs estimado
- 🔔 **Notificar Users** - Los que pidieron el feature
- 📝 **Post-Mortem** - Lessons learned
- 🏆 **Reconocimiento** - Badges para contributors

**Tiempo típico:** Permanente (archivo histórico)

**Ejemplo en Producción:**
```
Feature: Exportar conversación como PDF

Status: ✅ LIVE
Deployed: 2025-12-15 14:30 UTC
Version: v1.2.0
PR: #456 (merged)

Real Impact (30 días):
  CSAT: +2.1/5 ✅ (estimado: +2)
  NPS: +18 ✅ (estimado: +15)
  Users: 487 usuarios lo usaron ✅ (estimado: ~500)
  Adoption: 34% de usuarios activos

Feedback recibido:
  👍 "Perfecto! Justo lo que necesitaba"
  👍 "Compartir con clientes es mucho más fácil"
  💡 "¿Pueden agregar watermark personalizado?"

Next iteration: Agregar watermark (ya en Backlog)
```

---

## 🔄 Workflow Detallado

### Flujo Típico (Happy Path)

```
DÍA 1: Usuario usa Stella
  → Feedback guardado
  → Ticket FEAT-1234 creado
  
DÍA 2-7: Feedback acumula upvotes
  → 15 usuarios upvote
  → 8 shares a Slack
  → Viral coefficient: 1.5
  
DÍA 8: Admin revisa
  → Alta demanda confirmada
  → Crea Backlog Item
  → Lane: "Backlog"
  
DÍA 10: Planning meeting
  → Priorizado para Q4
  → Drag a "Roadmap"
  → Escribe user story
  → Agrega acceptance criteria
  
DÍA 12: Expert review
  → Drag a "Revisión Expertos"
  → Experto analiza en 2 días
  → Comentarios incorporados
  → Effort ajustado
  
DÍA 15: Approval
  → Drag a "Aprobación"
  → Product Owner aprueba
  → Budget confirmado
  
DÍA 16: Development starts
  → Click "Implementar"
  → Worktree creado automáticamente
  → Branch: feat/export-pdf-2025-10-29
  → Assigned to developer
  → Lane: "Producción" (work in progress)
  
DÍA 16-20: Development
  → Code, test, PR
  → CI/CD pipeline
  
DÍA 21: Merge & Deploy
  → PR merged
  → Deployed to production
  → Item queda en "Producción" (done)
  
DÍA 22: User notification
  → Todos los que upvotearon notificados
  → "Tu feature request está live!"
  → Badges otorgados
```

**Total tiempo:** 22 días (Feedback → Production)

---

## 🎨 UI Reference

### Vista del Roadmap

```
┌──────────────────────────────────────────────────────────────────┐
│ 🎯 Roadmap Flow                              ✨ Nuevo Item       │
│ 25 items • 8 roadmap • 3 producción                             │
│ Backlog → Roadmap → Revisión → Aprobación → Producción          │
├──────────┬──────────┬──────────┬──────────┬─────────────────────┤
│          │          │          │          │                     │
│ Backlog  │ Roadmap  │ Revisión │Aprobación│   Producción       │
│  (12)    │   (8)    │   (3)    │   (2)    │      (3)           │
│  Ideas   │Planificado│Expertos │Pendiente │  Implementado      │
│          │          │          │          │                     │
│ ┌──────┐ │ ┌──────┐ │ ┌──────┐ │ ┌──────┐ │ ┌──────┐          │
│ │Export│ │ │Search│ │ │Mobile│ │ │API v2│ │ │PDF   │          │
│ │to XLS│ │ │Filter│ │ │App   │ │ │      │ │ │Export│          │
│ │      │ │ │      │ │ │      │ │ │      │ │ │      │          │
│ │🟡 Med │ │ │🔴High│ │ │🔴Crit│ │ │🟣High│ │ │✅Live│          │
│ │[S]   │ │ │[M]   │ │ │[XL]  │ │ │[L]   │ │ │[M]   │          │
│ │      │ │ │      │ │ │      │ │ │      │ │ │      │          │
│ │CSAT+1│ │ │CSAT+2│ │ │CSAT+4│ │ │CSAT+3│ │ │CSAT+2│          │
│ │NPS+5 │ │ │NPS+12│ │ │NPS+35│ │ │NPS+20│ │ │NPS+18│          │
│ │~50   │ │ │~200  │ │ │~1000 │ │ │~300  │ │ │487   │          │
│ │users │ │ │users │ │ │users │ │ │users │ │ │users │          │
│ │      │ │ │      │ │ │      │ │ │      │ │ │      │          │
│ │👍 3  │ │ │👍 12 │ │ │👍 45 │ │ │👍 28 │ │ │✓Done │          │
│ │🔗 1  │ │ │🔗 5  │ │ │🔗 18 │ │ │🔗 12 │ │ │Dec15 │          │
│ └──────┘ │ └──────┘ │ └──────┘ │ └──────┘ │ └──────┘          │
│          │          │          │          │                     │
│ [Drag]   │ [Drag]   │ [Drag]   │ [Drag]   │ [Archive]          │
└──────────┴──────────┴──────────┴──────────┴─────────────────────┘
```

---

## 🎭 Roles y Permisos

### SuperAdmin (alec@getaifactory.com)

**Puede hacer TODO:**
- ✅ Ver todos los items
- ✅ Mover entre cualquier lane
- ✅ Crear nuevos items
- ✅ Editar cualquier item
- ✅ Asignar a developers
- ✅ Aprobar directamente
- ✅ Ver métricas completas

### Expertos (expert@*, agent_*@*)

**Acceso futuro (cuando se implemente):**
- ✅ Ver items en "Revisión Expertos"
- ✅ Comentar y dar feedback
- ✅ Aprobar/rechazar técnicamente
- ✅ Ajustar effort estimates
- ❌ NO pueden mover a Aprobación (solo SuperAdmin)

### Product Owners (futuro)

**Acceso futuro:**
- ✅ Ver Roadmap completo (read-only)
- ✅ Comentar en items
- ✅ Aprobar items en "Aprobación"
- ❌ NO pueden crear items
- ❌ NO pueden mover antes de Aprobación

### Developers (futuro)

**Acceso futuro:**
- ✅ Ver items asignados a ellos
- ✅ Update status (in progress, review, done)
- ✅ Link PRs
- ❌ NO pueden cambiar prioridades
- ❌ NO pueden auto-asignarse

---

## 📝 Guía de Uso

### Como SuperAdmin (Alec)

#### **Procesar nuevo feedback**

```
1. Ir a /roadmap
2. Revisar si hay nuevo feedback en Backlog
   (Vendrá automáticamente de Stella)
   
3. Para cada item interesante:
   a) Click en card
   b) Lee descripción completa
   c) Revisa upvotes (👍) - indica demanda
   d) Revisa viral coefficient - indica engagement
   e) Decide: ¿Vale la pena?
   
4. Si SÍ vale la pena:
   a) Click "Editar"
   b) Completa user story
   c) Agrega acceptance criteria
   d) Estima impact (CSAT, NPS, Users)
   e) Estima effort (XS-XL)
   f) Alinea con OKRs
   g) Drag a "Roadmap"
   
5. Si NO vale la pena:
   a) Drag a lane especial "Rejected" (futuro)
   b) O delete directamente
```

#### **Mover items a través del flow**

```
BACKLOG → ROADMAP:
  - Cuando decides implementar
  - User story completo required
  
ROADMAP → REVISIÓN:
  - Cuando está listo para review técnico
  - Click "Enviar a Revisión"
  - Notifica a expertos (futuro)
  
REVISIÓN → APROBACIÓN:
  - Después de expert approval
  - Click "Enviar a Aprobación"
  - Notifica a stakeholders (futuro)
  
APROBACIÓN → PRODUCCIÓN:
  - Cuando stakeholder aprueba
  - Click "Implementar"
  - Crea worktree automáticamente
  - Asigna a developer
  
Drag & drop también funciona para mover
```

#### **Priorizar el Roadmap**

```
Criterios de priorización:

1️⃣ Viral Coefficient (K > 1.3)
   → Feedback que se comparte mucho = alta demanda

2️⃣ Upvotes (👍 > 20)
   → Validación social clara

3️⃣ CSAT Impact (>3/5)
   → Mejora significativa en satisfacción

4️⃣ OKR Alignment (>7/10)
   → Alineado con objetivos de negocio

5️⃣ Affected Users (>200)
   → Impacto a muchos usuarios

Fórmula de priorización:
Priority Score = (upvotes * 2) + (csatImpact * 10) + 
                 (okrScore * 5) + (affectedUsers / 10)

Ordenar Roadmap por Priority Score descendente
```

---

## 🔗 Integración con Stella

### Flujo Completo

```
1. Usuario hace click en elemento → Stella marker
   ↓
2. Escribe feedback: "Esto debería..."
   ↓
3. Submit → feedback_session creado
   ↓
4. Ticket FEAT-1234 generado → feedback_tickets
   ↓
5. Compartido en Slack → upvotes crecen
   ↓
6. [MANUAL] Admin crea backlog_item desde ticket
   (futuro: automático si upvotes > 10)
   ↓
7. Item aparece en "Backlog" lane
   ↓
8. Admin mueve a "Roadmap"
   ↓
9. [Flujo continúa como descrito arriba]
   ↓
10. Eventualmente → "Producción"
   ↓
11. Notificación a todos los que upvotearon
    "Tu feature está live! 🎉"
```

---

## 📊 Métricas Clave

### Health del Roadmap

```javascript
// WIP Limits (Work In Progress)
Backlog: Sin límite (todo el feedback)
Roadmap: 5-15 items (lo planificado)
Revisión: 3-5 items (bottleneck común)
Aprobación: 1-3 items (decisiones rápidas)
Producción: Crecimiento constante

// Velocity
Items/week = Production.count(últimos 7 días)
Avg cycle time = Tiempo desde Backlog hasta Production

// Conversion
Backlog → Roadmap: ~30% (selectivo)
Roadmap → Production: ~80% (alta completion)
Feedback → Backlog: ~40% (curación)
```

### KPIs a Trackear

```
📈 Feedback Response Time
   → Tiempo desde Stella submit hasta Backlog item
   → Target: <7 días

📈 Time to Production
   → Tiempo desde Roadmap hasta Production
   → Target: <30 días

📈 Viral Effectiveness
   → Avg upvotes por item
   → Target: >10 upvotes

📈 Impact Delivered
   → CSAT improvement real vs estimado
   → Target: 90% accuracy

📈 OKR Coverage
   → % de OKRs con items en Roadmap
   → Target: 100%
```

---

## 🛠️ Technical Implementation

### Data Model

```typescript
interface BacklogItem {
  // ... existing fields ...
  
  // Workflow específico
  lane: 'backlog' | 'roadmap' | 'expert_review' | 'approval' | 'production',
  
  // Review tracking
  reviewedBy?: string, // Expert email
  reviewedAt?: Date,
  reviewNotes?: string,
  
  // Approval tracking
  approvedBy?: string, // Approver email
  approvedAt?: Date,
  approvalNotes?: string,
  
  // Production tracking
  deployedAt?: Date,
  deployedBy?: string,
  deploymentVersion?: string,
  productionUrl?: string,
}
```

### State Transitions

```javascript
// Transiciones permitidas
const ALLOWED_TRANSITIONS = {
  'backlog': ['roadmap', 'rejected'],
  'roadmap': ['expert_review', 'backlog'],
  'expert_review': ['approval', 'roadmap', 'rejected'],
  'approval': ['production', 'expert_review', 'rejected'],
  'production': [], // Final state
};

// Validación al mover
function canMoveTo(currentLane: Lane, targetLane: Lane): boolean {
  return ALLOWED_TRANSITIONS[currentLane].includes(targetLane);
}
```

---

## ✅ Estado Actual

### Implementado Hoy ✅

1. ✅ Página `/roadmap` (solo alec@getaifactory.com)
2. ✅ 5 lanes correctas: Backlog → Roadmap → Revisión → Aprobación → Producción
3. ✅ Drag & drop entre lanes
4. ✅ API endpoints con seguridad
5. ✅ Link en menú de usuario
6. ✅ Descripción de cada lane
7. ✅ Botones de acción por lane

### Listo para Testing ✅

```bash
# 1. Start server
npm run dev

# 2. Login con alec@getaifactory.com

# 3. Click avatar → "Roadmap & Backlog"

# 4. Deberías ver 5 columnas vacías
```

### Próximo: Crear Items de Prueba

Puedes usar los scripts existentes o crear vía API:

```javascript
// Crear item de prueba
await fetch('/api/backlog/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    companyId: 'aifactory',
    title: 'Exportar conversación como PDF',
    description: 'Permitir a usuarios exportar chats completos',
    userStory: 'Como usuario, quiero exportar PDFs para compartir offline',
    acceptanceCriteria: [
      'Botón "Export PDF" visible',
      'PDF con todos los mensajes',
      'Descarga automática'
    ],
    type: 'feature',
    priority: 'high',
    estimatedEffort: 'm',
    estimatedCSATImpact: 2,
    estimatedNPSImpact: 15,
    affectedUsers: 500,
    okrImpactScore: 8,
    lane: 'backlog', // Empieza en Backlog
  })
});
```

---

**¿Está claro ahora?** El Roadmap es todo el flow de 5 columnas, no solo una sección. Y solo tú puedes acceder. 🎯🔒





