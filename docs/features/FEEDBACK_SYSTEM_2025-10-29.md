# Sistema de Feedback - Flow Platform

**Created:** 2025-10-29  
**Status:** ✅ Implemented  
**Version:** 1.0.0

---

## 🎯 Objetivo

Implementar un sistema completo de feedback que permite a usuarios y expertos calificar respuestas del agente, crear tickets automáticamente para el backlog, y gestionar mejoras priorizadas del sistema.

---

## 👥 Tipos de Usuario

### 1. **Usuarios Expertos** (Admin, Expert, SuperAdmin)

**Interfaz:** Notas color violeta (estilo Stella)

**Capacidades:**
- ✅ Calificación detallada: Inaceptable / Aceptable / Sobresaliente
- ✅ NPS Score (0-10)
- ✅ CSAT Score (1-5)
- ✅ Notas de evaluación detalladas
- ✅ Capturas de pantalla con anotaciones
- ✅ Análisis AI de capturas (Gemini 2.5 Flash)
- ✅ Generación automática de tickets

**Ponderación:** 70% en cálculo de calidad global

### 2. **Usuarios Estándar** (User)

**Interfaz:** Notas color violeta-amarillo (gradiente)

**Capacidades:**
- ✅ Calificación rápida: 0-5 estrellas (CSAT)
- ✅ Comentario opcional
- ✅ Capturas de pantalla con anotaciones
- ✅ Análisis AI de capturas
- ✅ Generación automática de tickets

**Ponderación:** 30% en cálculo de calidad global

---

## 🎨 UI Components

### Feedback Buttons (En cada mensaje del agente)

**Ubicación:** Debajo de cada mensaje asistente, después del contenido

```tsx
{/* Feedback Buttons - Only for non-streaming assistant messages */}
<div className="mt-3 pt-3 border-t border-slate-100">
  <span>¿Te fue útil esta respuesta?</span>
  
  {/* Expert Button (purple) - Only for admin/expert/superadmin */}
  {['admin', 'expert', 'superadmin'].includes(userRole) && (
    <button className="bg-purple-100 text-purple-700">
      <Award /> Experto
    </button>
  )}
  
  {/* User Button (violet-yellow gradient) - For all users */}
  <button className="bg-gradient-to-r from-violet-100 to-yellow-100">
    <Star /> Calificar
  </button>
</div>
```

### Expert Feedback Panel

**Componente:** `ExpertFeedbackPanel.tsx`

**Elementos:**
1. **Header:** Gradiente purple, icono Award
2. **Calificación General:** 3 opciones (Inaceptable/Aceptable/Sobresaliente)
3. **NPS Score:** 0-10 scale
4. **CSAT Score:** 1-5 scale
5. **Notas de Evaluación:** Textarea para análisis detallado
6. **Capturas:** Botón "Capturar Pantalla" con anotaciones
7. **Footer:** Botones Cancelar/Enviar Feedback

**Colores:**
- Inaceptable: Rojo (red-500)
- Aceptable: Amarillo (yellow-500)
- Sobresaliente: Morado (purple-500)

### User Feedback Panel

**Componente:** `UserFeedbackPanel.tsx`

**Elementos:**
1. **Header:** Gradiente violet-yellow
2. **Star Rating:** 0-5 estrellas interactivas
3. **Comentario:** Textarea opcional
4. **Capturas:** Botón "Capturar" con anotaciones
5. **Footer:** Botones Cancelar/Enviar

**Colores:**
- 0-2 estrellas: Rojo (red-500)
- 3 estrellas: Amarillo (yellow-500)
- 4-5 estrellas: Violeta (violet-500)

### Screenshot Annotator

**Componente:** `ScreenshotAnnotator.tsx`

**Herramientas:**
1. **Círculo:** Click y arrastra para dibujar
2. **Rectángulo:** Click y arrastra
3. **Flecha:** Inicio → Fin
4. **Texto:** Click para posicionar, input para escribir

**Colores disponibles:**
- Purple (#9333ea) - Default
- Yellow (#eab308)
- Red (#ef4444)
- Blue (#3b82f6)
- Green (#10b981)

**Acciones:**
- Deshacer última anotación
- Limpiar todo
- Confirmar captura

---

## 🗄️ Data Schema

### Collection: `message_feedback`

```typescript
interface MessageFeedback {
  id: string;
  messageId: string;
  conversationId: string;
  userId: string;
  userEmail: string;
  userRole: string;
  
  feedbackType: 'expert' | 'user';
  
  // Expert feedback
  expertRating?: 'inaceptable' | 'aceptable' | 'sobresaliente';
  expertNotes?: string;
  npsScore?: number; // 0-10
  csatScore?: number; // 1-5
  
  // User feedback
  userStars?: 0 | 1 | 2 | 3 | 4 | 5;
  userComment?: string;
  
  // Screenshots
  screenshots?: AnnotatedScreenshot[];
  screenshotAnalysis?: string; // AI analysis
  
  timestamp: Date;
  source: 'localhost' | 'production';
  
  // Ticket generation
  ticketId?: string;
  ticketCreatedAt?: Date;
}
```

**Indexes Required:**
```
- userId ASC, timestamp DESC
- messageId ASC
- conversationId ASC, timestamp DESC
- feedbackType ASC, timestamp DESC
```

### Collection: `feedback_tickets`

```typescript
interface FeedbackTicket {
  id: string;
  feedbackId: string;
  messageId: string;
  conversationId: string;
  
  // Ticket info
  title: string; // AI-generated
  description: string; // AI-generated
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  
  // Assignment
  assignedTo?: string;
  assignedAt?: Date;
  
  // Reporter
  reportedBy: string;
  reportedByEmail: string;
  reportedByRole: string;
  
  // Original feedback
  originalFeedback: {
    type: 'expert' | 'user';
    rating: ExpertRating | UserRating;
    comment?: string;
    screenshots?: AnnotatedScreenshot[];
    screenshotAnalysis?: string;
  };
  
  // AI analysis
  aiAnalysis?: {
    summary: string;
    suggestedCategory: TicketCategory;
    suggestedPriority: TicketPriority;
    actionableItems: string[];
    technicalDetails?: string;
    affectedComponents?: string[];
  };
  
  // Metrics
  userImpact: 'low' | 'medium' | 'high' | 'critical';
  estimatedEffort: 'xs' | 's' | 'm' | 'l' | 'xl';
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  source: 'localhost' | 'production';
  
  // Roadmap
  sprintAssigned?: string;
  roadmapQuarter?: string;
  releaseVersion?: string;
}
```

**Indexes Required:**
```
- status ASC, priority ASC, createdAt DESC
- reportedBy ASC, createdAt DESC
- priority ASC, createdAt DESC
- category ASC, createdAt DESC
```

---

## 📡 API Endpoints

### POST /api/feedback/submit

**Purpose:** Submit feedback (Expert or User)

**Request:**
```json
{
  "messageId": "msg-123",
  "conversationId": "conv-456",
  "userId": "user-789",
  "userEmail": "user@example.com",
  "userRole": "expert",
  "feedbackType": "expert",
  "expertRating": "sobresaliente",
  "expertNotes": "Excelente respuesta...",
  "npsScore": 9,
  "csatScore": 5,
  "screenshots": [...]
}
```

**Response:**
```json
{
  "success": true,
  "feedbackId": "feedback-abc",
  "ticketId": "ticket-xyz",
  "message": "Feedback recibido exitosamente"
}
```

**Auth:** Required  
**Ownership:** Verified (session.id === userId)

### GET /api/feedback/tickets

**Purpose:** List all feedback tickets (Admin/Expert only)

**Query Params:**
- `userId` (required)
- `status` (optional): Filter by status
- `priority` (optional): Filter by priority
- `category` (optional): Filter by category

**Response:**
```json
{
  "tickets": [
    {
      "id": "ticket-123",
      "title": "Mejorar respuesta en consultas técnicas",
      "priority": "high",
      "status": "new",
      ...
    }
  ]
}
```

**Auth:** Admin/Expert only

### PUT /api/feedback/tickets/[id]

**Purpose:** Update ticket (status, priority, assignment)

**Request:**
```json
{
  "status": "in-progress",
  "priority": "critical",
  "assignedTo": "dev-user-id",
  "sprintAssigned": "Sprint 42",
  "roadmapQuarter": "Q1 2025"
}
```

**Auth:** Admin/Expert only

### DELETE /api/feedback/tickets/[id]

**Purpose:** Delete ticket

**Auth:** Admin only

---

## 🤖 AI Integration (Gemini 2.5 Flash)

### Screenshot Analysis

**Function:** `analyzeScreenshotWithGemini()`

**Input:**
- Array of `AnnotatedScreenshot`
- Feedback type (expert/user)
- Rating received

**Output:**
```
Análisis estructurado identificando:
1. Problemas señalados
2. Patrones comunes
3. Áreas de interfaz mencionadas
4. Gravedad del problema
5. Contexto técnico
```

**Model:** `gemini-2.5-flash`  
**Temperature:** 0.3 (structured analysis)  
**Max Tokens:** 1000

### Ticket Generation

**Function:** `createTicketFromFeedback()`

**Input:**
- Feedback ID
- Feedback data (rating, notes, screenshots, analysis)

**Output (AI-generated):**
- Title (conciso, accionable)
- Description (detallada)
- Category (bug, feature-request, etc.)
- Priority (critical, high, medium, low)
- User Impact (critical, high, medium, low)
- Estimated Effort (xs, s, m, l, xl)
- Actionable Items (3-5 acciones)
- Affected Components (módulos)

**Model:** `gemini-2.5-flash`  
**Temperature:** 0.2 (muy estructurado)  
**Max Tokens:** 1500

**Prompt Template:**
```
Analiza este feedback de usuario y genera un ticket estructurado.

Tipo: {feedbackType}
Calificación: {rating}
Notas: {notes}
Análisis de capturas: {screenshotAnalysis}

Genera JSON con: title, description, category, priority, 
userImpact, estimatedEffort, actionableItems, affectedComponents
```

---

## 🎨 Design System

### Color Themes

**Expert Feedback (Purple):**
```css
Primary: purple-600 (#9333ea)
Background: purple-50
Border: purple-200
Hover: purple-700
```

**User Feedback (Violet-Yellow Gradient):**
```css
Primary: gradient from violet-600 to yellow-600
Background: gradient from violet-50 to yellow-50
Border: violet-200
Text: gradient from violet-700 to yellow-700
```

**Ratings:**
```css
Inaceptable/1-2 stars: red-500
Aceptable/3 stars: yellow-500
Sobresaliente/4-5 stars: purple-500/violet-500
```

### Typography

**Expert Panel:**
- Title: text-xl font-bold text-purple-900
- Labels: text-sm font-semibold text-purple-900
- Helper text: text-xs font-normal text-purple-600

**User Panel:**
- Title: text-xl font-bold gradient
- Labels: text-sm font-semibold gradient
- Helper text: text-xs text-violet-600

---

## 📊 Metrics & Analytics

### Per-Agent Quality Score

```typescript
function calculateWeightedQuality(
  expertRatings: { inaceptable, aceptable, sobresaliente },
  userStarsAverage: number,
  expertWeight: 0.7, // 70% experts
  userWeight: 0.3    // 30% users
): number {
  // Expert score: 0-100 scale
  expertScore = (
    inaceptable * 0 + 
    aceptable * 50 + 
    sobresaliente * 100
  ) / total;
  
  // User score: 0-100 scale
  userScore = (userStarsAverage / 5) * 100;
  
  // Weighted average
  return expertScore * 0.7 + userScore * 0.3;
}
```

### Ticket Categories

```typescript
type TicketCategory = 
  | 'bug'                // 🐛 Errores
  | 'feature-request'    // ✨ Nuevas features
  | 'ui-improvement'     // 🎨 Mejoras UI
  | 'performance'        // ⚡ Optimización
  | 'security'           // 🔒 Seguridad
  | 'content-quality'    // 📝 Calidad contenido
  | 'agent-behavior'     // 🤖 Comportamiento agente
  | 'context-accuracy'   // 🎯 Precisión contexto
  | 'other';             // 📌 Otros
```

### Ticket Priorities

```typescript
type TicketPriority = 
  | 'critical' // P0: Blocker, fix inmediato
  | 'high'     // P1: Importante, siguiente sprint
  | 'medium'   // P2: Debería arreglarse, 2-3 sprints
  | 'low';     // P3: Nice to have, backlog
```

### Ticket Statuses

```typescript
type TicketStatus =
  | 'new'          // 🆕 Recién creado
  | 'triaged'      // 👁️ Revisado por equipo
  | 'prioritized'  // 📊 Agregado a roadmap
  | 'in-progress'  // 🔨 En desarrollo
  | 'in-review'    // 👀 Code review
  | 'testing'      // 🧪 QA testing
  | 'done'         // ✅ Shipped
  | 'wont-fix'     // 🚫 No se hará
  | 'duplicate';   // 📋 Duplicado
```

---

## 🔄 User Flow

### Expert Feedback Flow

```
1. Usuario experto ve respuesta del agente
   ↓
2. Click en botón "Experto" (purple)
   ↓
3. Modal se abre con opciones:
   - Seleccionar: Inaceptable/Aceptable/Sobresaliente
   - NPS: 0-10
   - CSAT: 1-5
   - Notas detalladas
   - [Opcional] Capturar pantalla
   ↓
4. [Si captura] Screenshot Annotator abre
   - Dibuja círculos, rectángulos, flechas
   - Añade texto explicativo
   - Confirma captura
   ↓
5. Click "Enviar Feedback"
   ↓
6. Backend procesa:
   - Guarda feedback en Firestore
   - Analiza capturas con Gemini 2.5 Flash
   - Genera ticket con AI
   - Asigna prioridad automática
   ↓
7. Success: "Feedback enviado. Ticket creado: ticket-xyz"
   ↓
8. Ticket aparece en Backlog de SuperAdmin
```

### User Feedback Flow

```
1. Usuario estándar ve respuesta del agente
   ↓
2. Click en botón "Calificar" (violet-yellow)
   ↓
3. Modal se abre con:
   - Estrellas 0-5 (hover preview)
   - Comentario opcional
   - [Opcional] Capturar pantalla
   ↓
4. [Si captura] Screenshot Annotator
   ↓
5. Click "Enviar"
   ↓
6. Backend procesa (igual que expert)
   ↓
7. Success: Ticket creado
```

---

## 🎯 Screenshot Annotation System

### Supported Shapes

**Circle:**
```typescript
{
  type: 'circle',
  x: number,      // Center X
  y: number,      // Center Y
  radius: number, // Radius in pixels
  color: string   // Hex color
}
```

**Rectangle:**
```typescript
{
  type: 'rectangle',
  x: number,      // Top-left X
  y: number,      // Top-left Y
  width: number,  // Width
  height: number, // Height
  color: string
}
```

**Arrow:**
```typescript
{
  type: 'arrow',
  x: number,      // Start X
  y: number,      // Start Y
  endX: number,   // End X
  endY: number,   // End Y
  color: string
}
```

**Text:**
```typescript
{
  type: 'text',
  x: number,      // Position X
  y: number,      // Position Y
  text: string,   // Text content
  color: string
}
```

### Canvas Implementation

**Technology:** HTML5 Canvas API

**Features:**
- Real-time drawing preview
- Multi-color support
- Undo last annotation
- Clear all annotations
- Export as PNG with annotations

**Drawing Process:**
1. User selects tool
2. User selects color
3. `mousedown` → Start drawing
4. `mousemove` → Update preview
5. `mouseup` → Save annotation
6. Redraw canvas with all annotations

---

## 🚀 Backlog Management (SuperAdmin)

### Feedback Backlog Dashboard

**Componente:** `FeedbackBacklogDashboard.tsx`

**Access:** User menu → "Backlog de Feedback" (SuperAdmin only)

**Features:**

#### Stats Cards
- Total tickets
- Nuevos (blue)
- En progreso (yellow)
- Completados (green)
- Críticos (red)

#### Filters
- **Search:** Text search in titles
- **Status:** All, New, Triaged, In Progress, etc.
- **Priority:** All, P0, P1, P2, P3
- **Category:** All, Bug, Feature, UI, etc.

#### Sorting
- By Priority (default)
- By Date
- By Impact

#### Ticket Cards
**Collapsed View:**
- Title
- Status badge
- Priority badge
- Category badge
- Feedback type badge
- Impact/Effort indicators
- Date & Reporter

**Expanded View:**
- Full description
- Original feedback (rating, comment)
- AI analysis (summary, actionable items)
- Screenshots (if any)
- Actions: Update status, Update priority

### Ticket Management Actions

**Update Status:**
- Dropdown in expanded card
- Auto-updates `updatedAt`
- If set to "done", sets `resolvedAt`

**Update Priority:**
- Dropdown in expanded card
- Immediate update to Firestore

**Assign to Sprint/Roadmap:**
- Input fields for:
  - `sprintAssigned`
  - `roadmapQuarter`
  - `releaseVersion`

---

## 🔐 Permissions

### Expert Feedback
**Roles:** `admin`, `expert`, `superadmin`  
**Button Visible:** Yes  
**Can Submit:** Yes  
**Weight in Quality:** 70%

### User Feedback
**Roles:** All users  
**Button Visible:** Yes  
**Can Submit:** Yes  
**Weight in Quality:** 30%

### Backlog Access
**Roles:** `admin`, `expert`, `superadmin`  
**Menu Visible:** Yes (in user menu)  
**Can View Tickets:** Yes  
**Can Update Tickets:** Yes  
**Can Delete Tickets:** Admin only

---

## 🧪 Testing Checklist

### Manual Testing

**As Expert:**
- [ ] Send message to agent
- [ ] See "Experto" button (purple)
- [ ] Click button, modal opens
- [ ] Select rating (Inaceptable/Aceptable/Sobresaliente)
- [ ] Enter NPS (0-10)
- [ ] Enter CSAT (1-5)
- [ ] Write notes
- [ ] Capture screenshot
- [ ] Draw circle, rectangle, arrow
- [ ] Add text annotation
- [ ] Submit feedback
- [ ] Verify success message
- [ ] Check Firestore: `message_feedback` collection
- [ ] Check Firestore: `feedback_tickets` collection
- [ ] Open Backlog, see new ticket

**As User:**
- [ ] Send message to agent
- [ ] See "Calificar" button (violet-yellow)
- [ ] Click button, modal opens
- [ ] Select stars (0-5)
- [ ] Hover shows labels
- [ ] Write comment
- [ ] Capture screenshot
- [ ] Submit feedback
- [ ] Verify success
- [ ] Check Firestore collections

**As SuperAdmin:**
- [ ] Open user menu
- [ ] See "Backlog de Feedback"
- [ ] Click, dashboard opens
- [ ] See stats cards
- [ ] Use filters (status, priority, category)
- [ ] Search tickets
- [ ] Sort by priority/date/impact
- [ ] Expand ticket
- [ ] See full details
- [ ] View screenshots
- [ ] Update status
- [ ] Update priority
- [ ] Close dashboard

---

## 🎨 Visual Examples

### Expert Feedback Panel
```
┌────────────────────────────────────────┐
│ 👑 Feedback Experto              [X] │
│ Evaluación de calidad profesional      │
├────────────────────────────────────────┤
│                                        │
│ Calificación General *                 │
│ ┌────────┐ ┌────────┐ ┌────────┐      │
│ │   ❌   │ │   ✔️   │ │   ⭐   │      │
│ │Inacep. │ │Aceptab.│ │Sobres. │      │
│ └────────┘ └────────┘ └────────┘      │
│                                        │
│ NPS Score (0-10)                       │
│ [0][1][2][3][4][5][6][7][8][9][10]    │
│                                        │
│ CSAT Score (1-5)                       │
│ [ 1 ][ 2 ][ 3 ][ 4 ][ 5 ]             │
│                                        │
│ Notas de Evaluación                    │
│ ┌────────────────────────────────────┐ │
│ │ Análisis detallado...              │ │
│ └────────────────────────────────────┘ │
│                                        │
│ 📷 Capturas (Opcional)                │
│ [Capturar Pantalla]                    │
│                                        │
│           [Cancelar] [Enviar Feedback] │
└────────────────────────────────────────┘
```

### User Feedback Panel
```
┌────────────────────────────────────────┐
│ ⭐ Tu Opinión Importa            [X] │
│ Ayúdanos a mejorar                     │
├────────────────────────────────────────┤
│                                        │
│ ¿Qué te pareció esta respuesta? *      │
│                                        │
│    ★  ★  ★  ★  ★                       │
│  (Hover para labels)                   │
│                                        │
│ Comentario (Opcional)                  │
│ ┌────────────────────────────────────┐ │
│ │ Cuéntanos más...                   │ │
│ └────────────────────────────────────┘ │
│                                        │
│ 📷 Capturas (Opcional)                │
│ [Capturar]                             │
│                                        │
│    Gracias por ayudarnos a mejorar     │
│           [Cancelar] [Enviar]          │
└────────────────────────────────────────┘
```

### Screenshot Annotator
```
┌────────────────────────────────────────────────┐
│ Anotar Captura        [Tools] [Colors] [✓][X]│
├────────────────────────────────────────────────┤
│                                                │
│              [Canvas con screenshot]           │
│     (Anotaciones dibujadas en tiempo real)     │
│                                                │
├────────────────────────────────────────────────┤
│ ○ Círculo  □ Rectángulo  → Flecha  T Texto   │
│           Click y arrastra / Click para texto  │
└────────────────────────────────────────────────┘
```

---

## 🚀 Deployment Checklist

### Firestore Indexes

**Deploy these indexes:**
```bash
# message_feedback
gcloud firestore indexes composite create \
  --collection-group=message_feedback \
  --field-config field-path=userId,order=ascending \
  --field-config field-path=timestamp,order=descending

# feedback_tickets  
gcloud firestore indexes composite create \
  --collection-group=feedback_tickets \
  --field-config field-path=status,order=ascending \
  --field-config field-path=priority,order=ascending \
  --field-config field-path=createdAt,order=descending
```

### Environment Variables

**Required:**
- `GOOGLE_AI_API_KEY` - For Gemini screenshot analysis
- `GOOGLE_CLOUD_PROJECT` - For Firestore

### Testing

- [ ] Type check: `npm run type-check`
- [ ] Build: `npm run build`
- [ ] Test Expert feedback flow
- [ ] Test User feedback flow
- [ ] Test Screenshot annotator
- [ ] Test Backlog dashboard
- [ ] Verify Firestore collections created
- [ ] Verify tickets generated correctly

---

## 📚 Files Created

### Types
- ✅ `src/types/feedback.ts` - Complete type definitions

### Components
- ✅ `src/components/ExpertFeedbackPanel.tsx` - Expert feedback UI
- ✅ `src/components/UserFeedbackPanel.tsx` - User feedback UI
- ✅ `src/components/ScreenshotAnnotator.tsx` - Screenshot tool
- ✅ `src/components/FeedbackBacklogDashboard.tsx` - Backlog management

### Services
- ✅ `src/lib/feedback-service.ts` - AI analysis & ticket generation

### API Routes
- ✅ `src/pages/api/feedback/submit.ts` - Submit feedback
- ✅ `src/pages/api/feedback/tickets.ts` - List tickets
- ✅ `src/pages/api/feedback/tickets/[id].ts` - Update/Delete tickets

### Integration
- ✅ `src/components/ChatInterfaceWorking.tsx` - Integrated feedback buttons

### Documentation
- ✅ `.cursor/rules/data.mdc` - Updated with new collections
- ✅ `docs/features/FEEDBACK_SYSTEM_2025-10-29.md` - This file

---

## 🎓 Key Decisions

### 1. Two Feedback Types with Different Weights

**Why:** Expert feedback carries more weight due to domain expertise, but user feedback is still valuable for UX improvements.

**Implementation:** Weighted quality calculation (70% expert, 30% user)

### 2. Automatic Ticket Generation

**Why:** Every feedback creates actionable work item, ensuring nothing is lost.

**Implementation:** AI analyzes feedback and creates structured ticket with category, priority, effort estimate.

### 3. Screenshot Annotations

**Why:** Visual feedback is often clearer than text descriptions.

**Implementation:** HTML5 Canvas with drawing tools, analyzed by Gemini for context.

### 4. Gemini 2.5 Flash for Analysis

**Why:** Fast, cost-effective, sufficient for structured analysis.

**Model:** `gemini-2.5-flash`  
**Use Cases:** Screenshot analysis, Ticket generation

### 5. Separate Feedback & Ticket Collections

**Why:** Feedback is raw user input, Tickets are processed work items.

**Benefit:** Can have multiple feedbacks per ticket, or ticket from multiple sources.

---

## 🔮 Future Enhancements

### Short-term
- [ ] Notification badge on menu item (new tickets count)
- [ ] Email notifications for critical feedback
- [ ] Bulk ticket actions (assign multiple, update status)
- [ ] Feedback trends chart per agent

### Medium-term
- [ ] Roadmap integration (drag tickets to quarters)
- [ ] Sprint planning view
- [ ] Ticket comments/discussion
- [ ] Feedback analytics dashboard

### Long-term
- [ ] A/B testing based on feedback
- [ ] ML model to predict priority
- [ ] Automatic categorization improvement
- [ ] Integration with external tools (Jira, Linear)

---

## ✅ Success Criteria

A properly implemented feedback system should achieve:

### Functionality
- ✅ Both expert and user can submit feedback
- ✅ Feedback persists to Firestore
- ✅ Screenshots captured with annotations
- ✅ AI analyzes screenshots and generates tickets
- ✅ Tickets appear in backlog
- ✅ SuperAdmin can manage tickets

### UX
- ✅ Buttons visible only for assistant messages
- ✅ Different visual themes for expert/user
- ✅ Smooth modal interactions
- ✅ Intuitive screenshot annotation
- ✅ Clear success/error feedback

### Data Quality
- ✅ All feedback has required fields
- ✅ AI-generated tickets are actionable
- ✅ Priority reflects feedback severity
- ✅ Categories are accurate

### Performance
- ✅ Feedback submission < 2s
- ✅ Screenshot analysis < 5s
- ✅ Ticket generation < 3s
- ✅ Backlog loads < 1s (100 tickets)

---

**Status:** ✅ Implemented  
**Tested:** Pending manual testing  
**Backward Compatible:** Yes  
**Breaking Changes:** None  

---

**Next Steps:**
1. Deploy Firestore indexes
2. Manual testing with both user types
3. Verify AI analysis quality
4. Monitor ticket generation accuracy
5. Gather feedback on feedback system (meta!)

