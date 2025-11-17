# 📇 Evaluation Management - Quick Reference Card

**Date:** 2025-11-16  
**Use:** Quick lookup for evaluation system enhancements

---

## 🗄️ New Collections

| Collection | Purpose | Key Fields | Indexes |
|------------|---------|------------|---------|
| `evaluation_assignments` | Track supervisor → evaluador assignments | supervisorId, evaluadorIds, agentId, domainId, status | 5 indexes |
| `evaluation_test_cases` | Centralized test cases from all sources | agentId, assignedSupervisorId, assignedEvaluadorIds, reviewStatus, priority | 5 indexes |

---

## 📝 Enhanced Collections (Optional Fields)

| Collection | New Fields | Purpose |
|------------|-----------|---------|
| `feedback_tickets` | `assignedSupervisorId`, `assignedEvaluadorIds`, `routingScore`, `evaluationAssignmentId`, `relatedTestCaseIds`, `aggregatedFrom` | Auto-routing and assignment tracking |
| `message_feedback` | `domainId`, `autoRoutedToSupervisor`, `escalatedToEvaluador`, `autoRoutingReason`, `routedAt`, `escalationReason` | Domain detection and routing metadata |

---

## 🔍 Key Indexes Added (18 total)

### High-Priority Queries (< 500ms)
```
- evaluation_assignments: supervisorId + status + assignedAt DESC
- evaluation_assignments: evaluadorIds CONTAINS + status
- evaluation_test_cases: agentId + reviewStatus + priority DESC
- evaluation_test_cases: assignedSupervisorId + reviewStatus + priority DESC
- feedback_tickets: assignedSupervisorId + reviewStatus + createdAt DESC
```

### Admin Queries (< 1s)
```
- evaluation_assignments: domainId + status + priority DESC
- evaluation_test_cases: domainId + reviewStatus + createdAt DESC
- feedback_tickets: domainId + priority DESC + createdAt DESC
- message_feedback: domainId + feedbackType + timestamp DESC
```

---

## 🔐 Scope Matrix

| Role | View | Assign | Approve | Apply |
|------|------|--------|---------|-------|
| **SuperAdmin** | All orgs/domains | Anyone, anywhere | Anything | Cross-org |
| **Admin** | Own domains | Own domains | Own domains | Own domains |
| **Supervisor** | Assigned agents | Sub-assign evaluadores | Propose only | Cannot |
| **Evaluador** | Assigned tasks | Cannot | Propose only | Cannot |

---

## 🔄 Routing Priority Formula

```typescript
priorityScore = 50 // Base
  + sourceWeight    // SuperAdmin: +40, Admin: +20, Expert: +30, User: +0
  + ratingImpact    // Inaceptable: +40, ≤2 stars: +20, 1 star: +30
  + systemicBonus   // >5 similar: +(count * 2)
  
Result: 0-100 (capped)
```

---

## 📊 Query Examples

### Supervisor Queue
```typescript
GET /api/evaluation/my-assignments?supervisorId={id}

Returns:
  - Assigned feedback items
  - Assigned test cases
  - Priority-sorted
  - With suggested evaluadores
```

### Evaluador Queue
```typescript
GET /api/evaluation/my-assignments?evaluadorId={id}

Returns:
  - Assigned tasks only
  - Full context per task
  - Clear expectations
  - Submission forms
```

### Admin Dashboard
```typescript
GET /api/evaluation/dashboard-summary?userId={id}

Returns:
  - Domain-scoped metrics
  - Supervisor workloads
  - Evaluador performance
  - Approval queue
  - Quality trends
```

---

## 🎨 UI Components

| Component | Tab | Users | Purpose |
|-----------|-----|-------|---------|
| `EvaluationManagementDashboard` | - | SuperAdmin, Admin | Main container |
| `AssignmentOverviewTab` | Tab 1 | SuperAdmin, Admin | View all assignments |
| `FeedbackQueueTab` | Tab 2 | SuperAdmin, Admin | Route and assign feedback |
| `TestCaseManagementTab` | Tab 3 | SuperAdmin, Admin | Manage test cases |
| `EvaluationResultsTab` | Tab 4 | SuperAdmin, Admin | View performance |
| `SupervisorWorkQueue` | - | Supervisor | Their work queue |
| `EvaluadorWorkQueue` | - | Evaluador | Their task list |

---

## ⚙️ Feature Flag

### Environment Variable
```bash
ENABLE_EVALUATION_MANAGEMENT=false  # Default
```

### Code Check
```typescript
import { canAccessEvaluationManagement } from '@/types/evaluation-management';

if (!canAccessEvaluationManagement(user, featureFlags.EVALUATION_MANAGEMENT)) {
  return <AccessDenied />;
}
```

---

## 🚀 Deployment Steps

### 1. Deploy Indexes
```bash
firebase deploy --only firestore:indexes --project=salfagpt
```

### 2. Enable Feature Flag (SuperAdmin only)
```bash
# In production .env
ENABLE_EVALUATION_MANAGEMENT=true
```

### 3. Verify Access
```bash
# Login as SuperAdmin
# Menu → EVALUACIONES → Should see "Gestión de Evaluaciones"
```

### 4. Test Routing
```bash
# Create test feedback
# Verify auto-routes to correct supervisor
# Check queue appears correctly
```

---

## 📈 Success Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Auto-routing accuracy | > 90% | Correct supervisor on first try |
| Dashboard load time | < 2s | Performance monitoring |
| Assignment action | < 500ms | API response time |
| Bulk assign 100 items | < 3s | Batch operation timing |
| Supervisor utilization | 60-80% | Workload distribution |
| Evaluador clarity | High | User surveys |
| Admin time saved | 5+ hrs/week | Before/after comparison |

---

## 🔗 Related Documentation

| Document | Purpose | Read When |
|----------|---------|-----------|
| `EVALUATION_MANAGEMENT_SYSTEM_ENHANCEMENT.md` | Complete design | Implementing any part |
| `EVALUATION_MANAGEMENT_IMPLEMENTATION_GUIDE.md` | Code examples | Writing code |
| `EVALUATION_SCOPE_ROUTING_COMPLETE.md` | Scope and routing | Understanding access control |
| `EVALUATION_SYSTEM_ARCHITECTURE_DIAGRAM.md` | Visual guide | Explaining to others |
| `EVALUATION_MANAGEMENT_SUMMARY_2025-11-16.md` | Executive summary | Quick overview |
| `EVALUATION_MGMT_VALIDATION_CHECKLIST.md` | Pre-implementation | Before starting |
| `EVALUATION_MANAGEMENT_ANALYSIS_COMPLETE.md` | Full analysis | User approval |

---

## 💡 Quick Tips

### For Implementation
- Start with backend services (easiest to test)
- Deploy indexes BEFORE creating APIs
- Test each role in separate browser/incognito
- Use feature flag throughout (easy rollback)

### For Testing
- Test SuperAdmin first (full scope)
- Then Admin (verify domain filtering)
- Then Supervisor (verify assignment scope)
- Finally Evaluador (verify task scope)

### For Rollout
- Week 1: SuperAdmin only (you test thoroughly)
- Week 2: Add 1-2 admins (limited rollout)
- Week 3: Add supervisors (production test)
- Week 4: Open to all roles

---

**This reference card summarizes the complete evaluation management enhancement.**

**For full details, see the 6 comprehensive documents created.** 📚

