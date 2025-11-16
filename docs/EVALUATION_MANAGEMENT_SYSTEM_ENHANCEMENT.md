# 🎯 Evaluation Management System - Complete Enhancement

**Date:** 2025-11-16  
**Purpose:** Make evaluation easy to manage for SuperAdmin and Admin with complete scope-based feedback routing  
**Status:** 📋 Design Complete - Ready for Implementation  
**Feature Flag:** `ENABLE_EVALUATION_MANAGEMENT` (SuperAdmin only initially)

---

## 📊 Current State Analysis

### ✅ What Exists Today

**Collections:**
- `message_feedback` - User/Expert feedback on messages
- `feedback_tickets` - Tickets created from feedback
- `domain_review_configs` - Per-domain supervisor/specialist assignments
- `domain_admin_assignments` - Admin domain assignments
- `agent_shares` - Agent sharing permissions
- `evaluations` - Agent test evaluations
- `test_results` - Test execution results
- `agent_setup_docs` - Test cases extracted from requirements

**Types:**
- Supervisors assigned per domain
- Especialistas assigned per domain with specialty
- Implementers (admins who can apply changes)
- Review workflow states (10 states)
- Approval workflow (multi-level)

**Gaps Identified:**
1. ❌ No direct link from feedback → test cases
2. ❌ No supervisor assignment to specific test cases
3. ❌ No evaluador assignment to test results
4. ❌ Missing indexes for scope-based queries
5. ❌ No unified evaluation queue
6. ❌ No cross-source feedback aggregation (message, Stella, admin)

---

## 🎯 Enhanced Schema Design

### NEW Collections Needed

#### 1. `evaluation_assignments` ⭐ NEW
**Purpose:** Assign supervisors/evaluadores to specific agents, test cases, and feedback

```typescript
interface EvaluationAssignment {
  // Identity
  id: string;
  
  // Scope Definition
  assignmentType: 'agent' | 'test-case' | 'feedback-item' | 'domain';
  
  // Assignments
  supervisorId: string;
  supervisorEmail: string;
  evaluadorIds: string[];           // Multiple evaluadores per supervisor
  
  // Targets
  agentId?: string;                 // If agent-specific
  testCaseId?: string;              // If test-case-specific
  feedbackItemIds?: string[];       // If feedback-specific
  domainId?: string;                // Domain scope
  organizationId?: string;          // Organization scope
  
  // Assignment metadata
  assignedBy: string;               // Admin/SuperAdmin userId
  assignedByRole: 'admin' | 'superadmin';
  assignedAt: Date;
  dueDate?: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  
  // Status
  status: 'active' | 'completed' | 'cancelled';
  completedAt?: Date;
  
  // Metrics
  itemsReviewed: number;
  itemsPending: number;
  averageReviewTime: number;        // ms
  
  // Permissions
  canApprove: boolean;              // Can approve corrections
  canAssignEvaluadores: boolean;    // Can sub-assign
  canViewAllDomainFeedback: boolean;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  source: 'localhost' | 'production';
}
```

**Indexes Needed:**
```json
{
  "collectionGroup": "evaluation_assignments",
  "fields": [
    { "fieldPath": "supervisorId", "order": "ASCENDING" },
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "assignedAt", "order": "DESCENDING" }
  ]
},
{
  "collectionGroup": "evaluation_assignments",
  "fields": [
    { "fieldPath": "domainId", "order": "ASCENDING" },
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "priority", "order": "DESCENDING" }
  ]
},
{
  "collectionGroup": "evaluation_assignments",
  "fields": [
    { "fieldPath": "agentId", "order": "ASCENDING" },
    { "fieldPath": "status", "order": "ASCENDING" }
  ]
},
{
  "collectionGroup": "evaluation_assignments",
  "fields": [
    { "fieldPath": "evaluadorIds", "arrayConfig": "CONTAINS" },
    { "fieldPath": "status", "order": "ASCENDING" }
  ]
}
```

---

#### 2. `evaluation_test_cases` ⭐ NEW
**Purpose:** Centralized test cases from all sources (agent_setup_docs, manual, etc.)

```typescript
interface EvaluationTestCase {
  // Identity
  id: string;
  
  // Scope
  agentId: string;
  agentName: string;
  domainId: string;
  organizationId?: string;
  
  // Test case details
  question: string;
  category: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  expectedTopics?: string[];
  expectedDocuments?: string[];
  expectedAnswer?: string;
  
  // Source
  sourceType: 'setup-doc' | 'manual' | 'user-feedback' | 'expert-created';
  sourceId: string;                 // setup doc ID, feedback ID, etc.
  extractedFrom?: string;           // Document name
  
  // Assignment
  assignedSupervisorId?: string;
  assignedEvaluadorIds?: string[];
  assignmentId?: string;            // Links to evaluation_assignments
  
  // Test results
  latestTestId?: string;
  latestTestScore?: number;
  latestTestDate?: Date;
  testCount: number;
  passCount: number;
  failCount: number;
  
  // Review status
  reviewStatus: 'pending' | 'in-review' | 'approved' | 'needs-work' | 'not-applicable';
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  tags?: string[];
  source: 'localhost' | 'production';
}
```

**Indexes Needed:**
```json
{
  "collectionGroup": "evaluation_test_cases",
  "fields": [
    { "fieldPath": "agentId", "order": "ASCENDING" },
    { "fieldPath": "reviewStatus", "order": "ASCENDING" },
    { "fieldPath": "priority", "order": "DESCENDING" }
  ]
},
{
  "collectionGroup": "evaluation_test_cases",
  "fields": [
    { "fieldPath": "domainId", "order": "ASCENDING" },
    { "fieldPath": "reviewStatus", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
},
{
  "collectionGroup": "evaluation_test_cases",
  "fields": [
    { "fieldPath": "assignedSupervisorId", "order": "ASCENDING" },
    { "fieldPath": "reviewStatus", "order": "ASCENDING" }
  ]
},
{
  "collectionGroup": "evaluation_test_cases",
  "fields": [
    { "fieldPath": "assignedEvaluadorIds", "arrayConfig": "CONTAINS" },
    { "fieldPath": "reviewStatus", "order": "ASCENDING" }
  ]
}
```

---

#### 3. Enhanced `feedback_tickets` Schema

**ADDED Fields** (backward compatible - all optional):

```typescript
interface FeedbackTicket {
  // ... existing fields ...
  
  // ✨ NEW: Assignment to evaluation workflow
  evaluationAssignmentId?: string;  // Links to evaluation_assignments
  assignedSupervisorId?: string;    // Supervisor reviewing this
  assignedEvaluadorIds?: string[];  // Evaluadores working on this
  
  // ✨ NEW: Test case linkage
  relatedTestCaseIds?: string[];    // Related test cases from this feedback
  
  // ✨ NEW: Routing metadata
  routingScore?: {
    priority: number;               // 0-100 calculated score
    affectedAgents: string[];
    affectedDomains: string[];
    similarityToExistingTests: number;
    autoRoutedTo?: string;          // Auto-assigned supervisor
    routingReason?: string;
    calculatedAt: Date;
  };
  
  // ✨ NEW: Multi-source feedback aggregation
  aggregatedFrom?: Array<{
    source: 'message-feedback' | 'stella-feedback' | 'admin-feedback' | 'expert-feedback';
    feedbackId: string;
    weight: number;                 // 0-1 (expert > admin > user)
    contributedAt: Date;
  }>;
  
  // ... rest of existing fields ...
}
```

**New Indexes Needed:**
```json
{
  "collectionGroup": "feedback_tickets",
  "fields": [
    { "fieldPath": "assignedSupervisorId", "order": "ASCENDING" },
    { "fieldPath": "reviewStatus", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
},
{
  "collectionGroup": "feedback_tickets",
  "fields": [
    { "fieldPath": "assignedEvaluadorIds", "arrayConfig": "CONTAINS" },
    { "fieldPath": "reviewStatus", "order": "ASCENDING" }
  ]
},
{
  "collectionGroup": "feedback_tickets",
  "fields": [
    { "fieldPath": "domainId", "order": "ASCENDING" },
    { "fieldPath": "priority", "order": "DESCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```

---

#### 4. Enhanced `message_feedback` Schema

**ADDED Fields** (backward compatible):

```typescript
interface MessageFeedback {
  // ... existing fields ...
  
  // ✨ NEW: Domain routing
  domainId?: string;                // Extracted from user email
  organizationId?: string;          // Organization ID
  
  // ✨ NEW: Auto-routing
  autoRoutedToSupervisor?: string;  // Auto-assigned based on agent/domain
  autoRoutingReason?: string;
  routedAt?: Date;
  
  // ✨ NEW: Escalation
  escalatedToEvaluador?: boolean;
  escalatedAt?: Date;
  escalationReason?: string;
  
  // ... rest of existing fields ...
}
```

**New Indexes Needed:**
```json
{
  "collectionGroup": "message_feedback",
  "fields": [
    { "fieldPath": "domainId", "order": "ASCENDING" },
    { "fieldPath": "feedbackType", "order": "ASCENDING" },
    { "fieldPath": "timestamp", "order": "DESCENDING" }
  ]
},
{
  "collectionGroup": "message_feedback",
  "fields": [
    { "fieldPath": "autoRoutedToSupervisor", "order": "ASCENDING" },
    { "fieldPath": "timestamp", "order": "DESCENDING" }
  ]
},
{
  "collectionGroup": "message_feedback",
  "fields": [
    { "fieldPath": "agentId", "order": "ASCENDING" },
    { "fieldPath": "feedbackType", "order": "ASCENDING" },
    { "fieldPath": "timestamp", "order": "DESCENDING" }
  ]
}
```

---

## 🔄 Complete Feedback Routing Flow

### Unified Feedback Collection Points

```
1. Message Feedback (In-Chat)
   └─ User gives ⭐ rating (0-5 stars)
   └─ Expert gives rating (inaceptable/aceptable/sobresaliente)
   └─ Admin provides feedback
   └─ SuperAdmin provides feedback

2. Stella Feedback (AI-Detected Issues)
   └─ Stella detects pattern/issue
   └─ Creates feedback automatically

3. Test Case Results
   └─ Agent evaluation test fails
   └─ Creates feedback from test failure

4. Direct Evaluador Submission
   └─ Evaluador creates evaluation
   └─ Submits corrections directly
```

### Auto-Routing Algorithm

```typescript
async function routeFeedbackToSupervisor(
  feedback: MessageFeedback | FeedbackTicket
): Promise<string | null> {
  
  // 1. Determine domain
  const domainId = feedback.domainId || extractDomainFromEmail(feedback.reportedByEmail);
  
  // 2. Load domain config
  const config = await getDomainReviewConfig(domainId);
  if (!config) return null;
  
  // 3. Calculate priority score
  const priorityScore = calculatePriorityScore(feedback);
  
  // 4. Match to supervisor
  if (feedback.agentId) {
    // Agent-specific: Find supervisor with access to this agent
    const supervisor = await findSupervisorForAgent(config, feedback.agentId);
    if (supervisor) return supervisor.userId;
  }
  
  // 5. Load-balance across supervisors
  const supervisor = selectLeastLoadedSupervisor(config.supervisors);
  return supervisor?.userId || null;
}

function calculatePriorityScore(feedback: any): number {
  let score = 50; // Base
  
  // Source weight
  if (feedback.feedbackType === 'expert') score += 30;
  if (feedback.reportedByRole === 'admin') score += 20;
  if (feedback.reportedByRole === 'superadmin') score += 40;
  
  // Rating impact
  if (feedback.expertRating === 'inaceptable') score += 40;
  if (feedback.userStars && feedback.userStars <= 2) score += 20;
  
  // Similarity amplification
  if (feedback.similarQuestionsCount && feedback.similarQuestionsCount > 5) {
    score += feedback.similarQuestionsCount * 2;
  }
  
  return Math.min(100, score);
}
```

---

## 🎨 Admin/SuperAdmin Management UI

### NEW: Evaluation Management Dashboard

**Location:** Menu → EVALUACIONES → **Gestión de Evaluaciones** (NEW)

**Features:**

#### Tab 1: Assignment Overview
```
┌────────────────────────────────────────────────────────┐
│ 📊 Asignaciones de Evaluación - Vista Global          │
├────────────────────────────────────────────────────────┤
│ Domain Filter: [All v] Organization: [Salfa Corp v]  │
├────────────────────────────────────────────────────────┤
│                                                        │
│ Supervisores (15)                                      │
│ ┌──────────────────────────────────────────────┐     │
│ │ 👤 Alec Dickinson (alecdickinson@gmail.com)   │     │
│ │    Domain: getaifactory.com                    │     │
│ │    Agentes: 8 | Feedback Pendiente: 12        │     │
│ │    Evaluadores: 3 asignados                    │     │
│ │    [Ver Detalle] [Reasignar]                   │     │
│ └──────────────────────────────────────────────┘     │
│                                                        │
│ Evaluadores (42)                                       │
│ ┌──────────────────────────────────────────────┐     │
│ │ 🎓 María González (maria@getaifactory.com)    │     │
│ │    Especialidad: Productos | Activa            │     │
│ │    Supervisor: Alec Dickinson                  │     │
│ │    Asignaciones: 5 activas | 23 completadas    │     │
│ │    Avg Review Time: 2.3h                       │     │
│ │    [Ver Trabajo] [Editar]                      │     │
│ └──────────────────────────────────────────────┘     │
│                                                        │
│ [+ Asignar Supervisor] [+ Asignar Evaluador]          │
└────────────────────────────────────────────────────────┘
```

#### Tab 2: Feedback Queue
```
┌────────────────────────────────────────────────────────┐
│ 📨 Cola de Feedback - Routing Inteligente             │
├────────────────────────────────────────────────────────┤
│ Filters: Fuente[All v] Prioridad[All v] Estado[All v]│
├────────────────────────────────────────────────────────┤
│                                                        │
│ Auto-Routed (85) | Manual Review (12) | Unassigned (3)│
│                                                        │
│ ┌──────────────────────────────────────────────┐     │
│ │ 🔴 CRITICAL | Agent M003 | maqsa.cl           │     │
│ │ Fuentes: ⭐ User (2★) + 💬 Stella + 🎓 Expert │     │
│ │ Impacto: 15 preguntas similares detectadas    │     │
│ │ Auto-Routed → Supervisor: Juan Pérez          │     │
│ │ Evaluadores Sugeridos: [María, Carlos]        │     │
│ │                                                │     │
│ │ [Ver Feedback] [Confirmar Ruta] [Reasignar]   │     │
│ └──────────────────────────────────────────────┘     │
│                                                        │
│ ┌──────────────────────────────────────────────┐     │
│ │ 🟡 HIGH | Agent S001 | getaifactory.com       │     │
│ │ Fuentes: 🎓 Expert (aceptable, mejorable)     │     │
│ │ Impacto: 3 casos de test relacionados         │     │
│ │ Manual → Assign to: [Select Supervisor v]     │     │
│ │                                                │     │
│ │ [Asignar Ahora]                                │     │
│ └──────────────────────────────────────────────┘     │
└────────────────────────────────────────────────────────┘
```

#### Tab 3: Test Case Management
```
┌────────────────────────────────────────────────────────┐
│ ✅ Casos de Prueba - Gestión Centralizada             │
├────────────────────────────────────────────────────────┤
│ Agent: [All v] Domain: [getaifactory.com v]           │
│ Status: [All v] Assigned: [All v]                     │
├────────────────────────────────────────────────────────┤
│                                                        │
│ Agent M003 (45 test cases)                            │
│ ┌──────────────────────────────────────────────┐     │
│ │ ✓ TC-M003-001: ¿Cómo genero guía despacho?   │     │
│ │   Categoría: Logistics | Prioridad: Critical   │     │
│ │   Supervisor: Juan Pérez                       │     │
│ │   Evaluadores: María (✅ approved)             │     │
│ │   Last Test: 98/100 ✅ | Tests: 5 | Pass: 5   │     │
│ │   [Ver Detalle] [Re-test]                      │     │
│ └──────────────────────────────────────────────┘     │
│                                                        │
│ ┌──────────────────────────────────────────────┐     │
│ │ ⚠️  TC-M003-002: ¿Proceso de convenio?        │     │
│ │   Categoría: Procurement | Prioridad: High     │     │
│ │   Supervisor: Sin asignar                      │     │
│ │   Evaluadores: No asignados                    │     │
│ │   Last Test: 62/100 ❌ | Tests: 3 | Pass: 1   │     │
│ │   [Asignar Supervisor] [Ver Fallos]           │     │
│ └──────────────────────────────────────────────┘     │
│                                                        │
│ [+ Crear Test Case] [Bulk Assign] [Export]            │
└────────────────────────────────────────────────────────┘
```

#### Tab 4: Evaluation Results
```
┌────────────────────────────────────────────────────────┐
│ 📈 Resultados de Evaluación - Análisis Completo       │
├────────────────────────────────────────────────────────┤
│ Period: [Last 30 days v] Domain: [All v]              │
├────────────────────────────────────────────────────────┤
│                                                        │
│ By Evaluador Performance                               │
│ ┌──────────────────────────────────────────────┐     │
│ │ María González (@getaifactory.com)            │     │
│ │ ├─ Evaluaciones: 23 completadas               │     │
│ │ ├─ Aprobadas: 19 (82.6%)                     │     │
│ │ ├─ Tiempo Promedio: 2.3h                      │     │
│ │ ├─ Calidad Promedio: 89/100                   │     │
│ │ └─ Impacto: 45 preguntas mejoradas            │     │
│ │ [Ver Detalle] [Performance Report]             │     │
│ └──────────────────────────────────────────────┘     │
│                                                        │
│ By Agent Quality                                       │
│ ┌──────────────────────────────────────────────┐     │
│ │ Agent M003 (GOP GPT)                           │     │
│ │ ├─ Test Cases: 45                              │     │
│ │ ├─ Pass Rate: 93.3% (42/45)                   │     │
│ │ ├─ Avg Score: 91/100                           │     │
│ │ ├─ Pending Reviews: 3                          │     │
│ │ └─ Status: ✅ Production Ready                │     │
│ │ [View Tests] [Agent Dashboard]                 │     │
│ └──────────────────────────────────────────────┘     │
└────────────────────────────────────────────────────────┘
```

---

## 🔐 Scope-Based Access Control

### Permission Matrix

| Action | User | Evaluador | Supervisor | Admin (own domain) | SuperAdmin |
|--------|------|-----------|------------|-------------------|------------|
| **View Feedback** |
| Own feedback | ✅ | ✅ | ✅ | ✅ | ✅ |
| Domain feedback | ❌ | Assigned only | Assigned agents | ✅ | ✅ |
| All feedback | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Assign Work** |
| Assign supervisor | ❌ | ❌ | ❌ | Own domain | ✅ |
| Assign evaluador | ❌ | ❌ | ✅ | ✅ | ✅ |
| Assign test cases | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Review & Approve** |
| Evaluate feedback | ❌ | Assigned only | Assigned only | ✅ | ✅ |
| Approve corrections | ❌ | ❌ | ✅ | ✅ | ✅ |
| Apply to agents | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Configure** |
| Domain settings | ❌ | ❌ | ❌ | Own domain | ✅ |
| Global settings | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 🔄 API Endpoints Needed

### 1. Assignment Management

```typescript
// Create assignment
POST /api/evaluation/assignments
Body: {
  assignmentType: 'agent' | 'test-case' | 'feedback-item' | 'domain',
  supervisorId: string,
  evaluadorIds: string[],
  agentId?: string,
  domainId?: string,
  // ...
}

// List assignments (scoped)
GET /api/evaluation/assignments
Query: ?supervisorId={id} | ?evaluadorId={id} | ?domainId={id} | ?agentId={id}
Scope: SuperAdmin (all), Admin (own domains), Supervisor (own), Evaluador (own)

// Update assignment
PUT /api/evaluation/assignments/:id
Body: { status, evaluadorIds, ... }

// Delete assignment
DELETE /api/evaluation/assignments/:id
```

### 2. Test Case Management

```typescript
// Create test case
POST /api/evaluation/test-cases
Body: {
  agentId, question, category, priority,
  assignedSupervisorId?, assignedEvaluadorIds?,
  // ...
}

// List test cases (scoped)
GET /api/evaluation/test-cases
Query: ?agentId={id} | ?supervisorId={id} | ?evaluadorId={id} | ?domainId={id}
Scope: Per user role and domain access

// Update test case
PUT /api/evaluation/test-cases/:id
Body: { reviewStatus, reviewNotes, assignedSupervisorId, ... }

// Bulk assign test cases
POST /api/evaluation/test-cases/bulk-assign
Body: { testCaseIds[], supervisorId, evaluadorIds[] }
```

### 3. Feedback Routing

```typescript
// Get feedback queue (scoped per user)
GET /api/evaluation/feedback-queue
Query: ?domainId={id} | ?priority={level} | ?status={status}
Returns: Feedback routed to this user based on role and assignments

// Manual route feedback
POST /api/evaluation/feedback/:id/route
Body: { supervisorId, reason }

// Auto-route all pending
POST /api/evaluation/feedback/auto-route
Body: { domainId? } // SuperAdmin can specify domain, Admin uses own domains
```

### 4. Evaluador Work Queue

```typescript
// Get my assignments
GET /api/evaluation/my-assignments
Scope: Returns work assigned to current user as evaluador

// Submit evaluation
POST /api/evaluation/submit-review
Body: {
  testCaseId, feedbackId, reviewNotes, 
  correctionProposal, returnToSupervisor?, ...
}

// Mark as not applicable
POST /api/evaluation/:id/not-applicable
Body: { reason }
```

---

## 🔍 Enhanced Queries for Performance

### Query 1: Supervisor Dashboard
```typescript
// Get all work for a supervisor (scoped to their domain/agents)
async function getSupervisorWorkQueue(supervisorId: string) {
  // Parallel queries with indexes
  const [assignments, feedbackItems, testCases] = await Promise.all([
    firestore.collection('evaluation_assignments')
      .where('supervisorId', '==', supervisorId)
      .where('status', '==', 'active')
      .orderBy('assignedAt', 'desc')
      .get(),
    
    firestore.collection('feedback_tickets')
      .where('assignedSupervisorId', '==', supervisorId)
      .where('reviewStatus', 'in', ['pendiente', 'en-revision', 'devuelta-supervisor'])
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get(),
    
    firestore.collection('evaluation_test_cases')
      .where('assignedSupervisorId', '==', supervisorId)
      .where('reviewStatus', 'in', ['pending', 'in-review'])
      .orderBy('priority', 'desc')
      .limit(100)
      .get()
  ]);
  
  return { assignments, feedbackItems, testCases };
}
```

### Query 2: Evaluador Work Queue
```typescript
// Get all work for an evaluador
async function getEvaluadorWorkQueue(evaluadorId: string) {
  const [assignments, testCases] = await Promise.all([
    firestore.collection('evaluation_assignments')
      .where('evaluadorIds', 'array-contains', evaluadorId)
      .where('status', '==', 'active')
      .orderBy('assignedAt', 'desc')
      .get(),
    
    firestore.collection('evaluation_test_cases')
      .where('assignedEvaluadorIds', 'array-contains', evaluadorId)
      .where('reviewStatus', 'in', ['pending', 'in-review'])
      .orderBy('priority', 'desc')
      .get()
  ]);
  
  return { assignments, testCases };
}
```

### Query 3: Domain Feedback Overview (Admin)
```typescript
// Get all feedback for admin's domains
async function getDomainFeedbackForAdmin(adminUserId: string) {
  // 1. Get admin's domains
  const adminAssignment = await firestore
    .collection('domain_admin_assignments')
    .doc(adminUserId)
    .get();
  
  const domains = adminAssignment.data()?.assignedDomains || [];
  
  // 2. Query feedback for those domains (chunked due to 'in' limit)
  const feedbackChunks = [];
  for (let i = 0; i < domains.length; i += 10) {
    const chunk = domains.slice(i, i + 10);
    const feedback = await firestore
      .collection('feedback_tickets')
      .where('domainId', 'in', chunk)
      .where('reviewStatus', 'in', ['pendiente', 'en-revision', 'corregida-propuesta', 'aprobada-aplicar'])
      .orderBy('createdAt', 'desc')
      .limit(200)
      .get();
    feedbackChunks.push(...feedback.docs);
  }
  
  return feedbackChunks;
}
```

---

## 🚀 Implementation Plan (Feature Flag)

### Phase 1: Schema Enhancement (Backend)
1. Add new collection: `evaluation_assignments`
2. Add new collection: `evaluation_test_cases`
3. Enhance `feedback_tickets` with new fields
4. Enhance `message_feedback` with routing fields
5. Deploy indexes to Firestore
6. Create migration script (optional fields = backward compatible)

### Phase 2: Core Services
1. Assignment service (CRUD for evaluation_assignments)
2. Test case service (centralize test case management)
3. Routing service (auto-route feedback to supervisors)
4. Queue services (get work queues per role)

### Phase 3: API Endpoints
1. `/api/evaluation/assignments` (CRUD)
2. `/api/evaluation/test-cases` (CRUD + bulk operations)
3. `/api/evaluation/feedback-queue` (scoped queries)
4. `/api/evaluation/my-assignments` (evaluador work queue)

### Phase 4: UI Components
1. Evaluation Management Dashboard (SuperAdmin/Admin)
2. Supervisor Work Queue Panel
3. Evaluador Work Queue Panel
4. Test Case Assignment Modal
5. Feedback Routing Modal

### Phase 5: Feature Flag Control
```typescript
// .env
ENABLE_EVALUATION_MANAGEMENT=false  // Default: OFF

// Enable for SuperAdmin only
const canAccessEvaluationManagement = (user: User) => {
  if (!process.env.ENABLE_EVALUATION_MANAGEMENT) return false;
  return user.role === 'superadmin';
};

// Gradual rollout:
// Week 1: SuperAdmin only (test and refine)
// Week 2: Add Admins
// Week 3: Add Supervisors
// Week 4: Full rollout to all roles
```

---

## ✅ Backward Compatibility Guarantee

### All Changes Are Additive

**New Collections:**
- ✅ `evaluation_assignments` - New collection (no impact on existing)
- ✅ `evaluation_test_cases` - New collection (no impact on existing)

**Enhanced Collections:**
- ✅ All new fields on `feedback_tickets` are **optional**
- ✅ All new fields on `message_feedback` are **optional**
- ✅ Existing queries continue to work unchanged
- ✅ Existing APIs unaffected

**Indexes:**
- ✅ All new indexes (additive only)
- ✅ No modifications to existing indexes
- ✅ No performance impact on existing queries

**Data Migration:**
- ✅ Not required (optional fields)
- ✅ Old feedback continues to work
- ✅ New feedback gets enhanced routing
- ✅ Gradual adoption supported

---

## 📊 Performance Optimizations

### Index Strategy

**Priority 1 Indexes** (Most frequent queries):
```
- evaluation_assignments: supervisorId ASC, status ASC, assignedAt DESC
- evaluation_test_cases: agentId ASC, reviewStatus ASC, priority DESC
- feedback_tickets: assignedSupervisorId ASC, reviewStatus ASC, createdAt DESC
- feedback_tickets: domainId ASC, priority DESC, createdAt DESC
```

**Priority 2 Indexes** (Admin/reporting queries):
```
- evaluation_assignments: domainId ASC, status ASC, priority DESC
- evaluation_test_cases: domainId ASC, reviewStatus ASC, createdAt DESC
- message_feedback: domainId ASC, feedbackType ASC, timestamp DESC
```

### Caching Strategy

**Cache frequently accessed data:**
```typescript
// Domain configs (TTL: 5 minutes)
const domainConfigCache = new Map<string, { data: DomainReviewConfig; ts: number }>();

// Supervisor assignments (TTL: 10 minutes)
const supervisorAssignmentCache = new Map<string, { data: any[]; ts: number }>();

// Agent ownership (TTL: 30 minutes)
const agentOwnershipCache = new Map<string, { ownerId: string; domain: string; ts: number }>();
```

---

## 🎯 Success Metrics

### Evaluation Management KPIs

**Efficiency:**
- Average time supervisor assigns evaluador: < 2 minutes
- Average time evaluador completes review: < 4 hours
- Feedback routing accuracy: > 95%
- Auto-routing success rate: > 90%

**Quality:**
- Supervisor utilization: 60-80% (balanced load)
- Evaluador utilization: 70-90% (productive)
- Review cycle time: < 48 hours
- Approval rate: > 80%

**User Experience:**
- Dashboard load time: < 1 second
- Assignment action response: < 500ms
- Queue updates: Real-time
- Mobile responsive: Yes

---

## 📋 Implementation Checklist

### Backend (Phase 1-3)
- [ ] Create `src/types/evaluation-management.ts`
- [ ] Create `src/lib/evaluation/assignment-service.ts`
- [ ] Create `src/lib/evaluation/test-case-service.ts`
- [ ] Create `src/lib/evaluation/routing-service.ts`
- [ ] Add indexes to `firestore.indexes.json`
- [ ] Deploy indexes: `firebase deploy --only firestore:indexes`
- [ ] Create API: `/api/evaluation/assignments`
- [ ] Create API: `/api/evaluation/test-cases`
- [ ] Create API: `/api/evaluation/feedback-queue`
- [ ] Create API: `/api/evaluation/my-assignments`
- [ ] Add feature flag check to all endpoints
- [ ] Write unit tests for services
- [ ] Write integration tests for APIs

### Frontend (Phase 4)
- [ ] Create `src/components/EvaluationManagementDashboard.tsx`
- [ ] Create `src/components/SupervisorWorkQueue.tsx`
- [ ] Create `src/components/EvaluadorWorkQueue.tsx`
- [ ] Create `src/components/TestCaseAssignmentModal.tsx`
- [ ] Create `src/components/FeedbackRoutingModal.tsx`
- [ ] Add to menu (feature flag gated)
- [ ] Test with SuperAdmin account
- [ ] Mobile responsive testing

### Documentation
- [ ] Update `data.mdc` with new collections
- [ ] Create admin user guide
- [ ] Create supervisor user guide
- [ ] Create evaluador user guide
- [ ] API documentation
- [ ] Migration guide (if needed)

---

## 🔮 Future Enhancements (Post-MVP)

1. **AI-Powered Assignment**
   - ML model to predict best supervisor for feedback
   - Specialty matching for evaluadores
   - Load balancing optimization

2. **Bulk Operations**
   - Bulk assign test cases
   - Bulk approve corrections
   - Batch implementation

3. **Advanced Analytics**
   - Evaluador performance trends
   - Domain quality dashboards
   - ROI calculations

4. **Notifications**
   - Email/Slack notifications for assignments
   - Weekly digests for evaluadores
   - Escalation alerts for overdue items

5. **Mobile App**
   - Native mobile for evaluadores
   - Push notifications
   - Offline review capability

---

**Prepared by:** AI Assistant  
**Reviewed by:** [Pending User Approval]  
**Status:** Ready for Implementation  
**Estimated Effort:** 40-60 hours  
**Risk Level:** Low (additive changes, feature flagged)

