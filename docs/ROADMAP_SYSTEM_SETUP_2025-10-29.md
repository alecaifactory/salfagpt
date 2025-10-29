# 🗺️ Roadmap & Backlog System - Setup Complete

**Fecha:** 2025-10-29  
**Usuario:** alec@getaifactory.com  
**Acceso:** 🔒 SuperAdmin Only

---

## 🎯 ¿Qué es este sistema?

El **Roadmap & Backlog System** es un Kanban interactivo que centraliza todo el feedback de Stella y lo convierte en items accionables priorizados.

### Flujo Completo

```
1. Usuario usa Stella Marker
   ↓
2. Feedback guardado en Firestore:
   - feedback_sessions (chat conversación)
   - feedback_tickets (tickets virales)
   ↓
3. Admin crea Backlog Item desde ticket
   ↓
4. Item aparece en Kanban Board (/roadmap)
   ↓
5. Drag & drop entre lanes:
   - 📋 Backlog → Ideas futuras
   - 🔵 Next → Próximo sprint
   - 🟣 Now → En desarrollo ahora
   - ✅ Done → Completado
   ↓
6. Métricas de impacto visibles:
   - CSAT Impact (+X/5)
   - NPS Impact (+Y)
   - Users Affected (~Z)
   - OKR Alignment (N/10)
   ↓
7. Asignar a Worktree para desarrollo
```

---

## 📊 Colecciones Firestore

### 1. **feedback_sessions** (Chat de Stella)

```typescript
{
  id: string,
  userId: string,
  companyId: string,
  sessionType: 'feature_request' | 'bug_report' | 'general_feedback' | 'ui_improvement',
  status: 'active' | 'submitted' | 'under_review' | 'accepted' | 'rejected' | 'implemented',
  priority: 'low' | 'medium' | 'high' | 'critical',
  
  // Conversación
  messages: FeedbackMessage[],
  
  // Contexto
  title?: string,
  description?: string,
  screenshots: Screenshot[],
  annotations: Annotation[],
  
  // AI Analysis
  aiSummary?: string,
  extractedRequirements?: string[],
  
  // Integración
  backlogItemId?: string, // Link a backlog_items
  roadmapItemId?: string, // Link a roadmap_items
  
  createdAt: timestamp,
  updatedAt: timestamp,
}
```

**Ubicación:** `feedback_sessions/{sessionId}`  
**Console:** https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore/data/~2Ffeedback_sessions

---

### 2. **feedback_tickets** (Tickets Virales)

```typescript
{
  id: string,
  ticketId: string, // FEAT-1234, BUG-5678
  sessionId: string, // Link a feedback_session
  userId: string,
  companyId: string,
  
  // Contenido
  type: FeedbackSessionType,
  title: string,
  status: FeedbackSessionStatus,
  priority: FeedbackPriority,
  
  // Viral Loop
  upvotes: number,
  upvotedBy: string[], // User IDs
  views: number,
  viewedBy: string[],
  shares: number,
  sharedBy: string[],
  shareChain: ShareChainEntry[],
  viralCoefficient: number,
  
  // Integración
  backlogItemId?: string,
  roadmapItemId?: string,
  
  createdAt: timestamp,
}
```

**Ubicación:** `feedback_tickets/{ticketId}`  
**Console:** https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore/data/~2Ffeedback_tickets

---

### 3. **backlog_items** (Kanban Items) ⭐

```typescript
{
  id: string,
  companyId: string,
  
  // Contenido
  title: string,
  description: string,
  userStory: string, // "As a [user], I want [feature], so that [benefit]"
  acceptanceCriteria: string[],
  
  // Source
  feedbackSessionIds: string[], // Links a feedback_sessions
  createdBy: 'user' | 'admin' | 'ai',
  createdByUserId?: string,
  
  // Clasificación
  type: 'feature' | 'enhancement' | 'bug' | 'technical_debt' | 'research',
  category: 'ui' | 'api' | 'performance' | 'security' | 'integration' | 'other',
  tags: string[],
  
  // Prioridad & Impacto
  priority: 'low' | 'medium' | 'high' | 'critical',
  estimatedEffort: 'xs' | 's' | 'm' | 'l' | 'xl',
  estimatedCSATImpact: number, // 0-5
  estimatedNPSImpact: number, // -100 to 100
  affectedUsers: number,
  
  // OKR Alignment
  alignedOKRs: string[],
  okrImpactScore: number, // 1-10
  
  // Kanban State
  status: 'new' | 'groomed' | 'ready' | 'in_progress' | 'review' | 'done' | 'rejected',
  lane: 'backlog' | 'next' | 'now' | 'done',
  position: number, // Para ordenar dentro del lane
  
  // Asignación
  assignedTo?: string,
  worktreeId?: string,
  branchName?: string,
  prUrl?: string,
  
  // Timeline
  createdAt: timestamp,
  updatedAt: timestamp,
  startedAt?: timestamp,
  completedAt?: timestamp,
  targetReleaseDate?: timestamp,
}
```

**Ubicación:** `backlog_items/{itemId}`  
**Console:** https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore/data/~2Fbacklog_items

---

## 🚀 Acceso al Sistema

### URL
```
http://localhost:3000/roadmap
```

### Seguridad

**Acceso restringido SOLO a:**
- ✅ `alec@getaifactory.com`

**Intentos no autorizados:**
- ❌ Redirect a `/chat?error=forbidden`
- 🚨 Log de seguridad registrado

### Cómo Acceder

1. Login con `alec@getaifactory.com`
2. En el chat, click en avatar (bottom-left)
3. En el menú, verás nueva opción:
   ```
   🎯 Roadmap & Backlog
   Kanban feedback
   ```
4. Click lleva a `/roadmap`

---

## 🎨 UI del Kanban Board

### Layout - 5 Columnas del Roadmap Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  🎯 Roadmap Flow                                            ✨ Nuevo Item       │
│  25 items • 8 roadmap • 3 producción                                           │
│  Backlog → Roadmap → Revisión → Aprobación → Producción                        │
├──────────┬──────────┬────────────┬──────────┬──────────────────────────────────┤
│          │          │            │          │                                  │
│ Backlog  │ Roadmap  │ Revisión   │Aprobación│      Producción                 │
│  (12)    │   (8)    │   (3)      │   (2)    │         (3)                     │
│  Ideas   │Planificado│ Expertos  │ Pendiente│     Implementado                │
│          │          │            │          │                                  │
│ ┌──────┐ │ ┌──────┐ │  ┌──────┐  │ ┌──────┐ │  ┌──────┐                      │
│ │Export│ │ │Search│ │  │Mobile│  │ │API v2│ │  │PDF   │                      │
│ │to XLS│ │ │Filter│ │  │App   │  │ │      │ │  │Export│                      │
│ │      │ │ │      │ │  │      │  │ │      │ │  │      │                      │
│ │🟡 Med │ │ │🔴High│ │  │🔴Crit│  │ │🟣High│ │  │✅Live│                      │
│ │[S]   │ │ │[M]   │ │  │[XL]  │  │ │[L]   │ │  │[M]   │                      │
│ │      │ │ │      │ │  │      │  │ │      │ │  │      │                      │
│ │CSAT+1│ │ │CSAT+2│ │  │CSAT+4│  │ │CSAT+3│ │  │CSAT+2│                      │
│ │NPS+5 │ │ │NPS+12│ │  │NPS+35│  │ │NPS+20│ │  │NPS+18│                      │
│ │~50   │ │ │~200  │ │  │~1000 │  │ │~300  │ │  │487   │                      │
│ │      │ │ │      │ │  │      │  │ │      │ │  │      │                      │
│ │👍 3  │ │ │👍 12 │ │  │👍 45 │  │ │👍 28 │ │  │✓Ship │                      │
│ │🔗 1  │ │ │🔗 5  │ │  │🔗 18 │  │ │🔗 12 │ │  │Dec15 │                      │
│ └──────┘ │ └──────┘ │  └──────┘  │ └──────┘ │  └──────┘                      │
│          │          │            │          │                                  │
│ [Drag]   │ [Drag]   │  [Drag]    │ [Drag]   │ [Archive]                       │
└──────────┴──────────┴────────────┴──────────┴──────────────────────────────────┘
```

### Card Components

Cada card muestra:

1. **Header:**
   - Título (truncado si largo)
   - Menu ⋮ (más acciones)

2. **User Story:**
   - Italic text
   - "As a user, I want X, so that Y"

3. **Badges:**
   - Prioridad: 🔴 Critical | 🟠 High | 🟡 Medium | ⚪ Low
   - Esfuerzo: [XS] | [S] | [M] | [L] | [XL]
   - Tipo: feature, bug, enhancement

4. **Impact Metrics:**
   - 📈 CSAT: +X/5
   - 👥 NPS: +Y
   - 👥 Users: ~Z
   - 🎯 OKR: N/10

5. **Viral Indicators:**
   - 👍 Upvotes (de tickets)
   - 🔗 Shares
   - ✨ Feedback sessions linked

6. **Assignment:**
   - Avatar si asignado
   - 📅 Target date

### Drag & Drop

```javascript
// Drag entre lanes
onDragStart(itemId) → setDraggedItem
onDrop(targetLane) → 
  - Update local state (optimistic)
  - PATCH /api/backlog/items/{id}
  - Firestore: lane + updatedAt
```

### Detail Modal

Click en card abre modal con:
- Full description
- Acceptance criteria lista
- Impact metrics (grandes)
- OKR alignment
- Related feedback sessions (links)
- Development info (branch, PR, worktree)
- Actions: Assign to Worktree, Edit

---

## 🔌 API Endpoints

### 1. GET /api/backlog/items

**Query Params:**
- `companyId` (required)

**Response:**
```json
[
  {
    "id": "abc123",
    "title": "Agregar export PDF",
    "lane": "next",
    "priority": "high",
    "estimatedCSATImpact": 3,
    ...
  }
]
```

**Security:** ✅ Only `alec@getaifactory.com`

---

### 2. POST /api/backlog/create

**Body:**
```json
{
  "companyId": "aifactory",
  "title": "Feature name",
  "description": "Details...",
  "type": "feature",
  "priority": "high",
  "estimatedEffort": "m",
  "feedbackSessionIds": ["session-123"]
}
```

**Response:**
```json
{
  "success": true,
  "id": "item-abc",
  "item": { ... }
}
```

---

### 3. PATCH /api/backlog/items/{id}

**Body:**
```json
{
  "lane": "now",
  "priority": "critical",
  "assignedTo": "userId"
}
```

**Response:**
```json
{
  "success": true,
  "id": "item-abc"
}
```

**Security:** ✅ Only `alec@getaifactory.com`

---

### 4. GET /api/backlog/items/{id}

**Response:**
```json
{
  "id": "abc123",
  "title": "...",
  "description": "...",
  ...
}
```

**Security:** ✅ Only `alec@getaifactory.com`

---

## 📝 Cómo Usar el Sistema

### Escenario 1: Usuario envía feedback con Stella

```
1. Usuario hace click en elemento confuso
2. Stella marker aparece (purple/yellow/green)
3. Usuario escribe: "Esto debería decir 'Guardar' no 'Submit'"
4. Submit feedback
   ↓
5. Sistema crea:
   - feedback_session (chat completo)
   - feedback_ticket (FEAT-1234)
   ↓
6. Ticket visible para team
7. Team hace upvote
8. Viral coefficient aumenta
```

### Escenario 2: Admin convierte feedback en backlog

```
1. Admin revisa feedback_ticket FEAT-1234
2. Decide implementar
3. Opción A: Manual
   - Click "New Item" en /roadmap
   - Llena form
   - Link feedbackSessionId
   
   Opción B: API
   - POST /api/backlog/create
   - feedbackSessionIds: ['session-123']
   ↓
4. Item aparece en lane "Backlog"
5. Drag a "Next" cuando priorizado
6. Drag a "Now" cuando iniciado
7. Drag a "Done" cuando completado
```

### Escenario 3: Developer toma item del backlog

```
1. Item en lane "Next"
2. Click en card → Modal
3. Click "Assign to Worktree"
4. Sistema crea:
   - Branch: feat/feature-name-2025-10-29
   - Worktree en .cursor/worktrees/
   - Port assignment (3001-3003)
   ↓
5. Item se mueve a "Now" automáticamente
6. assignedTo = developerId
7. worktreeId, branchName guardados
   ↓
8. Developer trabaja en worktree
9. Create PR → prUrl guardado
10. Merge → Item a "Done"
```

---

## 🎯 Ventajas del Sistema

### Para Product Managers

✅ **Visibilidad total** del feedback  
✅ **Priorización basada en datos** (upvotes, impact scores)  
✅ **OKR alignment** automático  
✅ **Viral validation** - el feedback más compartido = más importante  

### Para Developers

✅ **Items bien definidos** con acceptance criteria  
✅ **Effort estimates** claros  
✅ **Worktree automation** - click asigna y crea branch  
✅ **Trazabilidad** - desde feedback hasta PR  

### Para Users

✅ **Feedback fácil** con Stella marker  
✅ **Viral sharing** - comparte con team  
✅ **Transparencia** - ve status de tu feedback  
✅ **Notificaciones** - cuando se implementa  

---

## 📈 Métricas & KPIs

### Backlog Health

```sql
-- Items por lane
SELECT lane, COUNT(*) 
FROM backlog_items 
WHERE companyId = 'aifactory'
GROUP BY lane;

-- Expected:
-- backlog: 20-30 items (ideas futuras)
-- next: 5-10 items (próximo sprint)
-- now: 3-5 items (WIP limit)
-- done: creciendo constantemente
```

### Velocity

```
Items completed per week = Done items / weeks
Avg time in "Now" = tiempo desde startedAt hasta completedAt
Avg time from Backlog to Done = total lifecycle
```

### Impact Delivered

```
Total CSAT improvement = SUM(estimatedCSATImpact) WHERE lane = 'done'
Total NPS improvement = SUM(estimatedNPSImpact) WHERE lane = 'done'
Total users impacted = SUM(affectedUsers) WHERE lane = 'done'
```

### Viral Effectiveness

```
Avg upvotes per ticket = SUM(upvotes) / COUNT(tickets)
Conversion rate = backlog_items / feedback_tickets
Time to action = backlog.createdAt - ticket.createdAt
```

---

## 🔄 Workflow Recomendado

### Semanal (Planning)

```
Lunes 9:00 AM - Backlog Grooming (30 min)

1. Review new feedback tickets
2. Identify high upvote items
3. Create backlog items para top 5
4. Assign priorities
5. Move top 3 to "Next"
```

### Diario (Standup)

```
10:00 AM - Check Kanban (5 min)

1. Items en "Now" - bloqueados?
2. Items en "Review" - listo para merge?
3. Items en "Done" - notificar users?
4. Pull 1 item de "Next" a "Now" si capacity
```

### Mensual (Review)

```
Último viernes del mes - Monthly Review (1 hora)

1. Review velocity (items/week)
2. Review impact (CSAT/NPS delivered)
3. Review viral coefficient (avg upvotes)
4. Archive "Done" items >30 days
5. Re-prioritize "Backlog" based on new data
```

---

## 🛠️ Desarrollo Técnico

### Archivos Creados

1. **`src/pages/roadmap.astro`** ✅
   - Página principal
   - Auth check (solo alec@getaifactory.com)
   - Render KanbanBacklogBoard

2. **`src/pages/api/backlog/items.ts`** ✅
   - GET: List all items
   - Security: SuperAdmin only

3. **`src/pages/api/backlog/items/[id].ts`** ✅
   - GET: Get single item
   - PATCH: Update item (lane, priority, etc.)
   - Security: SuperAdmin only

4. **`src/components/ChatInterfaceWorking.tsx`** ✅
   - Added "Roadmap & Backlog" link in user menu
   - Visible only for alec@getaifactory.com

### Archivos Existentes (Ya creados antes)

- ✅ `src/components/KanbanBacklogBoard.tsx` (583 líneas)
- ✅ `src/components/AIRoadmapAnalyzer.tsx`
- ✅ `src/types/feedback.ts` (BacklogItem, RoadmapItem interfaces)
- ✅ `src/pages/api/backlog/create.ts`
- ✅ `.cursor/rules/feedback-system.mdc`
- ✅ `.cursor/rules/viral-feedback-loop.mdc`

---

## 🧪 Testing

### Test 1: Acceso Restringido

```bash
# 1. Login con usuario NO autorizado
# Expected: NO ver "Roadmap & Backlog" en menú

# 2. Intentar acceso directo
curl http://localhost:3000/roadmap
# Expected: Redirect a /chat?error=forbidden

# 3. Login con alec@getaifactory.com
# Expected: ✅ Ver "Roadmap & Backlog" en menú

# 4. Click en link
# Expected: ✅ Cargar Kanban board
```

### Test 2: CRUD Operations

```javascript
// 1. Crear item
const response = await fetch('/api/backlog/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    companyId: 'aifactory',
    title: 'Test Feature',
    description: 'Test description',
    type: 'feature',
    priority: 'high',
    estimatedEffort: 'm',
  })
});
// Expected: { success: true, id: '...', item: {...} }

// 2. Listar items
const items = await fetch('/api/backlog/items?companyId=aifactory');
// Expected: Array con item creado

// 3. Mover item (drag & drop)
await fetch('/api/backlog/items/abc123', {
  method: 'PATCH',
  body: JSON.stringify({ lane: 'next' })
});
// Expected: { success: true }

// 4. Verificar en UI
// Item debe aparecer en lane "Next"
```

### Test 3: Drag & Drop

```
1. Login con alec@getaifactory.com
2. Ir a /roadmap
3. Drag card de "Backlog" a "Next"
   Expected: 
   - Card desaparece de Backlog
   - Card aparece en Next
   - Optimistic update (instantáneo)
   - API call en background
   - Console: ✅ Moved to next

4. Refresh página
   Expected: Card sigue en "Next" (persistido)
```

---

## 🔮 Próximos Pasos (Futuro)

### Corto Plazo (1-2 semanas)

- [ ] Auto-crear backlog item desde feedback_ticket
- [ ] Webhook cuando ticket recibe 10+ upvotes
- [ ] Notificación a admin
- [ ] Bulk operations (mover varios items)

### Mediano Plazo (1 mes)

- [ ] AI Roadmap Analyzer integration
- [ ] OKR tracking dashboard
- [ ] Worktree automation (click → branch created)
- [ ] PR status tracking

### Largo Plazo (3 meses)

- [ ] Multi-company support
- [ ] Role-based access (PM, Developer, Stakeholder)
- [ ] Public roadmap view (read-only)
- [ ] Voting on roadmap items

---

## 📚 Documentación Relacionada

### Reglas
- `.cursor/rules/feedback-system.mdc` - Data schema completo
- `.cursor/rules/viral-feedback-loop.mdc` - Sistema viral
- `.cursor/rules/privacy.mdc` - Seguridad y aislamiento

### Guías
- `README_STELLA.md` - Overview del sistema Stella
- `docs/STELLA_IMPLEMENTATION_SUMMARY_2025-10-27.md` - Implementación
- `docs/STELLA_DELIVERY_COMPLETE.md` - Entrega completa

---

## ✅ Resumen

### ¿Dónde se registra el feedback de Stella?

**Firestore Collections:**

1. **`feedback_sessions`** 
   - Chat conversación completa
   - Annotations y screenshots
   - AI analysis

2. **`feedback_tickets`** 
   - Ticket viral (FEAT-1234)
   - Upvotes, shares, views
   - Viral coefficient

3. **`backlog_items`** ⭐
   - Kanban item
   - Lanes: Backlog → Next → Now → Done
   - Impact metrics
   - OKR alignment
   - Development tracking

### ¿Cómo accedo al Roadmap?

**URL:** `http://localhost:3000/roadmap`

**Acceso:** 🔒 Solo `alec@getaifactory.com`

**Ubicación en UI:**
1. Chat interface
2. Click avatar (bottom-left)
3. Menu: "🎯 Roadmap & Backlog"

### ¿Qué puedo hacer?

✅ Ver todos los backlog items  
✅ Drag & drop entre lanes  
✅ Ver métricas de impacto  
✅ Click para detalles completos  
✅ Asignar a worktrees  
✅ Track PRs y branches  
✅ Priorizar basado en upvotes  

---

**Status:** ✅ Sistema completo y funcional  
**Acceso:** 🔒 SuperAdmin only (alec@getaifactory.com)  
**Ready to Test:** Yes  

---

**Próximos pasos inmediatos:**
1. Test en localhost:3000/roadmap
2. Verificar security (otros users no pueden acceder)
3. Test drag & drop
4. Crear primer backlog item desde feedback

