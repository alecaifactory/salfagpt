# 🏗️ Evaluation System - Complete Architecture Diagram

**Date:** 2025-11-16  
**Visual Guide:** How evaluation flows from feedback to implementation

---

## 🌐 System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    EVALUATION MANAGEMENT SYSTEM                      │
│                         (Flow Platform)                              │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                ┌───────────────────┼───────────────────┐
                │                   │                   │
         FEEDBACK INPUT       AUTO-ROUTING         EVALUATION
                │                   │                   │
                ↓                   ↓                   ↓
```

---

## 📥 Feedback Input Sources

```
┌──────────────────────────────────────────────────────────┐
│                    FEEDBACK SOURCES                       │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  1. MESSAGE FEEDBACK (In-Chat)                           │
│     ├─ User: ⭐⭐⭐⭐⭐ (0-5 stars) + comment             │
│     ├─ Expert: Inaceptable/Aceptable/Sobresaliente       │
│     ├─ Admin: Direct feedback on responses                │
│     └─ SuperAdmin: Platform-level feedback                │
│        ↓                                                  │
│     Collection: message_feedback                          │
│                                                          │
│  2. STELLA FEEDBACK (AI-Detected)                         │
│     ├─ Pattern detection (15+ similar questions)          │
│     ├─ Quality degradation alerts                         │
│     ├─ Systemic issue identification                      │
│     └─ Cross-agent analysis                               │
│        ↓                                                  │
│     Collection: stella_insights → feedback_tickets        │
│                                                          │
│  3. TEST FAILURES (Automated)                             │
│     ├─ Agent evaluation test fails                        │
│     ├─ Test case quality < threshold                      │
│     ├─ Phantom references detected                        │
│     └─ Expected topics missing                            │
│        ↓                                                  │
│     Collection: test_results → evaluation_test_cases      │
│                                                          │
│  4. ADMIN/SUPERADMIN DIRECT                               │
│     ├─ Manual quality review                              │
│     ├─ Strategic improvement request                      │
│     ├─ Domain-wide observations                           │
│     └─ Cross-domain patterns                              │
│        ↓                                                  │
│     Collection: feedback_tickets (direct creation)        │
│                                                          │
└──────────────────────────────────────────────────────────┘
                            │
                            ↓
                    UNIFIED PROCESSING
                            │
                            ↓
┌──────────────────────────────────────────────────────────┐
│                  TICKET GENERATION                        │
│                                                          │
│  Input: Any feedback source                               │
│    ↓                                                     │
│  Process:                                                 │
│    1. Extract metadata (domain, agent, user)              │
│    2. Create feedback_ticket (if not exists)              │
│    3. Link sources (aggregatedFrom[])                     │
│    4. Calculate priority score                            │
│    5. Detect similar issues                               │
│    6. Prepare for routing                                 │
│    ↓                                                     │
│  Output: feedback_ticket ready for routing                │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 🔀 Auto-Routing Engine

```
┌──────────────────────────────────────────────────────────┐
│                    AUTO-ROUTING LOGIC                     │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  INPUT: feedback_ticket                                   │
│                                                          │
│  STEP 1: Extract Context                                  │
│    ├─ domainId ← userEmail @domain.com                    │
│    ├─ agentId ← conversationId                            │
│    ├─ organizationId ← domain → org mapping               │
│    └─ userRole ← reportedByRole                           │
│                                                          │
│  STEP 2: Load Domain Config                               │
│    Query: domain_review_configs/{domainId}                │
│    Get: supervisors[], specialists[], settings            │
│                                                          │
│  STEP 3: Calculate Priority (0-100)                       │
│    Base: 50                                               │
│    + Source weight (SuperAdmin: +40, Admin: +20, etc.)    │
│    + Rating impact (inaceptable: +40, 1-star: +50)        │
│    + Systemic amplifier (>5 similar: +count*2)            │
│    = priorityScore                                        │
│                                                          │
│  STEP 4: Match Supervisor                                 │
│    IF agentId:                                            │
│      ├─ Query: agent_shares WHERE agentId                 │
│      ├─ Find: supervisor with access                      │
│      └─ Route (95% confidence)                            │
│    ELSE:                                                  │
│      ├─ Get all domain supervisors                        │
│      ├─ Query workloads (active assignments + pending)    │
│      ├─ Sort by load (ascending)                          │
│      └─ Assign to least loaded (80% confidence)           │
│                                                          │
│  STEP 5: Suggest Evaluadores (Optional)                   │
│    For each specialist in domain:                         │
│      ├─ Match specialty to category (+40 points)          │
│      ├─ Match domain expertise (+30 points)               │
│      ├─ Check capacity (+20 points)                       │
│      ├─ Sort by match score                               │
│      └─ Return top 3 suggestions                          │
│                                                          │
│  STEP 6: Create Assignment (if needed)                    │
│    Collection: evaluation_assignments                     │
│      ├─ assignmentType: 'feedback-item'                   │
│      ├─ supervisorId                                      │
│      ├─ evaluadorIds: [] (empty, supervisor fills)        │
│      ├─ feedbackItemIds: [feedbackId]                     │
│      ├─ priority, status, metrics                         │
│      └─ permissions                                       │
│                                                          │
│  STEP 7: Update Feedback                                  │
│    feedback_tickets update:                               │
│      ├─ assignedSupervisorId                              │
│      ├─ routingScore: { priorityScore, reasons, ... }     │
│      ├─ suggestedEvaluadores: [...]                       │
│      └─ autoRoutedAt                                      │
│                                                          │
│  OUTPUT: Routed feedback ✅                               │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 👁️ Supervisor View

```
┌──────────────────────────────────────────────────────────┐
│              SUPERVISOR WORK QUEUE                        │
│         (supervisor_maqsa@empresa.com)                    │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  My Assignments (8 agents, 12 feedback items)             │
│                                                          │
│  ┌────────────────────────────────────────────┐         │
│  │ 🔴 CRITICAL | Agent M003 | maqsa.cl         │         │
│  │ Priority: 95/100                             │         │
│  │                                              │         │
│  │ Fuentes Agregadas:                           │         │
│  │   • ⭐ User (2★) - "Wrong safety info"       │         │
│  │   • 🎓 Expert (inaceptable) - "Critical..."  │         │
│  │   • 🤖 Stella - "15 similar detected"        │         │
│  │                                              │         │
│  │ Suggested Evaluadores:                       │         │
│  │   1. María González (Safety, 3/10 load)      │         │
│  │   2. Carlos López (Technical, 5/10 load)     │         │
│  │                                              │         │
│  │ Actions:                                     │         │
│  │ [Evaluar Yo] [Asignar a María] [Ver Detalles]│         │
│  └────────────────────────────────────────────┘         │
│                                                          │
│  ┌────────────────────────────────────────────┐         │
│  │ 🟡 HIGH | Agent S001 | maqsa.cl              │         │
│  │ Priority: 70/100                             │         │
│  │                                              │         │
│  │ Fuentes Agregadas:                           │         │
│  │   • 🎓 Expert (aceptable) - "Could improve..." │         │
│  │                                              │         │
│  │ Test Cases Linked: 3                         │         │
│  │   • TC-S001-001: 85/100 ✅                   │         │
│  │   • TC-S001-002: 62/100 ❌                   │         │
│  │   • TC-S001-003: Not tested                  │         │
│  │                                              │         │
│  │ Actions:                                     │         │
│  │ [Evaluar] [Asignar Evaluador] [Ver Tests]    │         │
│  └────────────────────────────────────────────┘         │
│                                                          │
│  Filter: [Priority v] [Agent v] [Status v]               │
│  Sort: [Latest v]                                        │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 🎓 Evaluador View

```
┌──────────────────────────────────────────────────────────┐
│              EVALUADOR WORK QUEUE                         │
│         (maria.gonzalez@getaifactory.com)                 │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Mis Asignaciones (5 activas, 23 completadas)            │
│                                                          │
│  ┌────────────────────────────────────────────┐         │
│  │ From: Supervisor Alec                        │         │
│  │ Agent: M003 | Domain: maqsa.cl               │         │
│  │ Priority: CRITICAL                           │         │
│  │ Due: In 2 days                               │         │
│  │                                              │         │
│  │ Task: Review safety information issue        │         │
│  │                                              │         │
│  │ Context Provided:                            │         │
│  │   • User query: "How do I..."                │         │
│  │   • AI response: "To do this..."             │         │
│  │   • Expert notes: "Missing critical step X"  │         │
│  │   • Similar questions: 15                    │         │
│  │                                              │         │
│  │ Your Actions:                                │         │
│  │ [Proponer Corrección]                        │         │
│  │ [Devolver a Supervisor]                      │         │
│  │ [Marcar No Aplica]                           │         │
│  └────────────────────────────────────────────┘         │
│                                                          │
│  Performance:                                             │
│    • Avg Review Time: 2.3h                               │
│    • Approval Rate: 87%                                  │
│    • Quality Score: 92/100                               │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 👑 Admin View

```
┌──────────────────────────────────────────────────────────┐
│              ADMIN EVALUATION DASHBOARD                   │
│              (admin@maqsa.cl - Domain Scope)              │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Domain: maqsa.cl                                         │
│  ┌──────────┬──────────┬──────────┬──────────┐         │
│  │ Pending  │ Critical │ Overdue  │ Approved │         │
│  │   24     │    5     │    2     │    156   │         │
│  └──────────┴──────────┴──────────┴──────────┘         │
│                                                          │
│  Supervisors (3)                                          │
│  ┌────────────────────────────────────────────┐         │
│  │ Juan Pérez                                   │         │
│  │ ├─ Assigned Agents: 8                        │         │
│  │ ├─ Active Work: 12 items                     │         │
│  │ ├─ Evaluadores: 2                            │         │
│  │ └─ Performance: 85% approval rate            │         │
│  │ [View Queue] [Reassign Work]                 │         │
│  └────────────────────────────────────────────┘         │
│                                                          │
│  Approval Queue (5 items ready to apply)                  │
│  ┌────────────────────────────────────────────┐         │
│  │ ✅ Correction Approved by: Juan Pérez        │         │
│  │    Agent: M003 | Category: contenido          │         │
│  │    Impact: 15 similar questions               │         │
│  │    Estimated DQS Improvement: +12             │         │
│  │    Risk: Low | Effort: Small                  │         │
│  │                                              │         │
│  │ [Apply Now] [Schedule] [Review Again]         │         │
│  └────────────────────────────────────────────┘         │
│                                                          │
│  Domain Quality Score: 78/100 (+3 this month) 📈         │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 🌍 SuperAdmin View

```
┌──────────────────────────────────────────────────────────┐
│            SUPERADMIN GLOBAL DASHBOARD                    │
│         (alec@getaifactory.com - All Orgs)                │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Organizations: Salfa Corp | Cliente A | Cliente B        │
│                                                          │
│  Global Metrics                                           │
│  ┌──────────┬──────────┬──────────┬──────────┐         │
│  │ Total    │ Auto-    │ Avg      │ Global   │         │
│  │ Pending  │ Routed   │ Cycle    │ DQS      │         │
│  │   187    │   92%    │  2.3d    │  81/100  │         │
│  └──────────┴──────────┴──────────┴──────────┘         │
│                                                          │
│  By Organization                                          │
│  ┌────────────────────────────────────────────┐         │
│  │ 🏢 Salfa Corp                                │         │
│  │    ├─ Domains: 15                            │         │
│  │    ├─ Supervisors: 12                        │         │
│  │    ├─ Evaluadores: 38                        │         │
│  │    ├─ Pending: 156                           │         │
│  │    └─ DQS: 78/100 (↑ +5)                     │         │
│  │ [Manage] [View Details]                      │         │
│  └────────────────────────────────────────────┘         │
│                                                          │
│  ┌────────────────────────────────────────────┐         │
│  │ 🏢 Cliente A                                 │         │
│  │    ├─ Domains: 1                             │         │
│  │    ├─ Supervisors: 2                         │         │
│  │    ├─ Evaluadores: 5                         │         │
│  │    ├─ Pending: 23                            │         │
│  │    └─ DQS: 85/100 (↑ +2)                     │         │
│  │ [Manage] [View Details]                      │         │
│  └────────────────────────────────────────────┘         │
│                                                          │
│  Alerts (2)                                               │
│  ⚠️  maqsa.cl: 3 overdue items (> 5 days)                │
│  🔴 Agent M003: 15 critical feedback items                │
│                                                          │
│  [Assign Domains] [Global Config] [Export Report]        │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 🔄 Complete Workflow Diagram

```
USER FEEDBACK                    ROUTING                    EVALUATION
     │                              │                            │
     ↓                              │                            │
┌──────────┐                        │                            │
│ User     │ Rates ⭐⭐             │                            │
│ Interacts│                        │                            │
└────┬─────┘                        │                            │
     │                              │                            │
     ↓                              │                            │
┌──────────────┐                    │                            │
│ message_     │                    │                            │
│ feedback     │                    │                            │
└────┬─────────┘                    │                            │
     │                              ↓                            │
     ↓                        ┌──────────┐                       │
┌──────────────┐              │ Auto-    │                       │
│ feedback_    │←─────────────│ Routing  │                       │
│ tickets      │              │ Engine   │                       │
└────┬─────────┘              └────┬─────┘                       │
     │                              │                            │
     │ assignedSupervisorId         │                            │
     │ routingScore                 │                            │
     │ suggestedEvaluadores         │                            │
     │                              │                            │
     ↓                              ↓                            │
┌──────────────────┐         ┌──────────────┐                   │
│ Supervisor Queue │         │ evaluation_  │                   │
│ (Filtered View)  │         │ assignments  │                   │
└────┬─────────────┘         └──────────────┘                   │
     │                                                           │
     │ Supervisor Reviews                                        │
     ↓                                                           ↓
┌──────────────┐                                        ┌──────────────┐
│ Supervisor   │  Assigns Evaluador                     │ Evaluador    │
│ Evaluates    │  ─────────────────→                    │ Queue        │
└────┬─────────┘                                        └────┬─────────┘
     │                                                        │
     │ Proposes Correction                                    │
     │                                                        ↓
     ↓                                                  ┌──────────────┐
┌──────────────┐                                       │ Evaluador    │
│ feedback_    │←──────────────────────────────────────│ Proposes     │
│ tickets      │  correctionProposal                    │ Correction   │
│ (Updated)    │  reviewStatus: 'corregida-propuesta'   └──────────────┘
└────┬─────────┘
     │
     │ reviewStatus: 'aprobada-aplicar'
     ↓
┌──────────────┐
│ Admin        │
│ Approval     │
│ Queue        │
└────┬─────────┘
     │
     │ Admin Approves
     ↓
┌──────────────┐
│ Apply to     │
│ Agents       │
│ (Domain-wide)│
└────┬─────────┘
     │
     ↓
┌──────────────┐
│ feedback_    │
│ tickets      │
│ (Applied ✅) │
└──────────────┘
     │
     ↓
┌──────────────┐
│ Metrics      │
│ Tracking     │
│ DQS Update   │
└──────────────┘
```

---

## 📊 Data Flow Example

### Real Example: User Feedback → Implementation

```
T=0: User Action
  User: user@maqsa.cl
  Agent: M003 (GOP GPT)
  Action: Sends message, gets response
  Rating: ⭐⭐ (2 stars)
  Comment: "Response didn't mention safety requirements"
  
T=0.1s: Feedback Creation
  Collection: message_feedback
    ├─ messageId: "msg-abc123"
    ├─ conversationId: "agent-M003"
    ├─ userId, userEmail, userRole: "user"
    ├─ feedbackType: "user"
    ├─ userStars: 2
    ├─ timestamp: Now
    └─ [NEW] domainId: "maqsa.cl" (extracted)
  
T=0.5s: Ticket Generation
  Collection: feedback_tickets
    ├─ feedbackId: Link to above
    ├─ title: "Low user rating on safety question"
    ├─ category: "content-quality"
    ├─ priority: "high"
    ├─ reviewStatus: "pendiente"
    ├─ domain: "maqsa.cl"
    └─ [NEW] Pending routing...

T=1s: Auto-Routing Executes
  1. Load: domain_review_configs/maqsa.cl
  2. Calculate priority: 50 + 20 (2-star) = 70
  3. Check: Agent M003 shared with supervisor_maqsa
  4. Assign: → supervisor_maqsa@empresa.com (95% confidence)
  5. Suggest evaluadores: María (Safety specialist, 3/10 load)
  6. Create: evaluation_assignment (if not exists)
  7. Update feedback_tickets:
      ├─ assignedSupervisorId: "supervisor_maqsa"
      ├─ routingScore: { priorityScore: 70, reasons: [...], confidence: 95 }
      └─ suggestedEvaluadores: [{ userId: "maria", matchScore: 85, ... }]

T=2s: Supervisor Sees in Queue
  supervisor_maqsa dashboard refreshes
  New item appears: 🟡 HIGH priority
  Suggested evaluador: María (85% match)

T=1h: Supervisor Assigns
  Supervisor clicks: [Asignar a María]
  Update feedback_tickets:
    ├─ assignedEvaluadorIds: ["maria"]
    ├─ reviewStatus: "asignada-especialista"
    └─ assignedAt: Now
  
T=1.1h: Evaluador Sees in Queue
  María's dashboard refreshes
  New task appears with full context

T=3h: Evaluador Proposes Correction
  María evaluates and proposes:
    ├─ correctionType: "contenido"
    ├─ knowledgeUpdates: [Section 3.4 needs safety note]
    ├─ proposedText: "SAFETY: Always verify..."
    └─ justification: "Critical for user safety"
  
  Update feedback_tickets:
    ├─ reviewStatus: "corregida-propuesta"
    ├─ correctionProposal: { ... }
    └─ returnedToSupervisor: false (sent to admin directly)

T=1d: Admin Sees in Approval Queue
  admin@maqsa.cl sees correction
  Reviews impact analysis:
    ├─ 15 similar questions would improve
    ├─ Estimated DQS impact: +12
    ├─ Risk: Low
    └─ Effort: Small (1 doc update)
  
  Admin clicks: [Aprobar]

T=1d+5m: Correction Applied
  System applies:
    ├─ Updates Agent M003 knowledge
    ├─ Marks 15 similar feedback as "fixed"
    ├─ Creates version history
    └─ Tracks implementation
  
  Update feedback_tickets:
    ├─ reviewStatus: "aplicada"
    ├─ appliedBy: "admin@maqsa.cl"
    ├─ appliedAt: Now
    └─ implementation: { ... }

T=1d+10m: Metrics Updated
  Domain Quality Score recalculated:
    ├─ Before: 72/100
    ├─ After: 78/100
    └─ Improvement: +6 points
  
  Evaluador performance tracked:
    ├─ María: +1 approved correction
    └─ Time: 2h (below 2.3h average)

T=1w: Verification
  System re-tests affected test cases:
    ├─ TC-M003-safety: 62 → 95 ✅
    └─ User ratings on M003: ⭐⭐ → ⭐⭐⭐⭐ avg

RESULT: Complete feedback loop ✅
  ├─ User issue identified
  ├─ Auto-routed to right people
  ├─ Evaluated by specialist
  ├─ Approved by admin
  ├─ Applied domain-wide
  ├─ Impact verified
  └─ Quality improved
```

---

## 🎯 Summary: What Changes

### Current State
- ✅ Feedback collected
- ✅ Supervisor panel exists
- ✅ Evaluador concept defined
- ⚠️ Manual routing required
- ⚠️ Scattered test cases
- ⚠️ Limited visibility

### Enhanced State (After Implementation)
- ✅ Feedback collected (unchanged)
- ✅ Supervisor panel exists (enhanced)
- ✅ Evaluador concept defined (enhanced)
- ✅ **Auto-routing (90%+ accurate)** ⭐ NEW
- ✅ **Centralized test cases** ⭐ NEW
- ✅ **Complete visibility dashboards** ⭐ NEW
- ✅ **Scope-based access enforced** ⭐ NEW
- ✅ **Performance metrics tracked** ⭐ NEW

### What Stays the Same
- ✅ User feedback submission (no change)
- ✅ Expert evaluation flow (no change)
- ✅ Correction approval process (enhanced, not changed)
- ✅ Domain configuration (enhanced, not changed)
- ✅ All existing data (works as-is)

---

## 📞 Approval Needed

**I've analyzed your evaluation system and designed a comprehensive enhancement that:**

1. ✅ Makes evaluation management **easy** for SuperAdmin and Admin
2. ✅ Provides **tools** for assigning supervisors and evaluadores
3. ✅ **Routes feedback** automatically from all sources
4. ✅ Ensures **scope security** (domain/org isolation)
5. ✅ Maintains **backward compatibility** (all additive)
6. ✅ Uses **feature flag** (SuperAdmin only initially)

**Your feedback/questions will help me refine before implementation.**

**Ready to proceed?** 🚀

