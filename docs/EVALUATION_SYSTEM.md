# 🧪 Sistema de Evaluaciones de Agentes - SalfaGPT

**Created:** 2025-10-29  
**Status:** ✅ Implemented  
**Version:** 1.0.0

---

## 🎯 Purpose

Comprehensive evaluation system that allows Experts and Admins to systematically test agents against success criteria before sharing them with regular users. Includes version control, detailed metrics, and approval workflows.

---

## 🏗️ Architecture

### Components

```
src/components/
├── EvaluationPanel.tsx          # Main evaluation management interface
└── AgentEvaluationDashboard.tsx # Quick evaluation (existing, kept)

src/types/
└── evaluations.ts                # Type definitions

src/pages/api/
├── evaluations.ts                # CRUD for evaluations
└── evaluations/[id]/
    ├── results.ts                # Test results management
    └── test.ts                   # Test execution endpoint

scripts/
└── import-s001-evaluation.ts     # Import S001 as example

docs/
└── EVALUATION_SYSTEM.md          # This file
```

### Firestore Collections

```
evaluations/
├── {evaluationId}/
│   ├── id: string (EVAL-{agentCode}-YYYY-MM-DD-v1)
│   ├── agentId: string
│   ├── agentName: string
│   ├── version: string (v1, v2, etc.)
│   ├── createdBy: string (userId)
│   ├── createdByEmail: string
│   ├── createdAt: timestamp
│   ├── totalQuestions: number
│   ├── questions: EvaluationQuestion[]
│   ├── categories: QuestionCategory[]
│   ├── successCriteria: SuccessCriteria
│   ├── status: 'draft' | 'in_progress' | 'completed' | 'approved' | 'rejected'
│   ├── questionsTested: number
│   ├── questionsPassedQuality: number
│   ├── averageQuality: number
│   ├── phantomRefsDetected: number
│   └── avgSimilarity: number

test_results/
├── {resultId}/
│   ├── evaluationId: string
│   ├── questionId: string
│   ├── agentId: string
│   ├── testedBy: string
│   ├── testedByEmail: string
│   ├── testedAt: timestamp
│   ├── prompt: string
│   ├── response: string
│   ├── references: Reference[]
│   ├── quality: number (1-10)
│   ├── phantomRefs: boolean
│   ├── expectedTopicsFound: string[]
│   ├── expectedTopicsMissing: string[]
│   ├── notes: string
│   └── passedCriteria: boolean

evaluation_runs/
├── {runId}/
│   ├── evaluationId: string
│   ├── runBy: string
│   ├── startedAt: timestamp
│   ├── completedAt: timestamp
│   ├── questionsToTest: string[]
│   ├── questionsTested: string[]
│   ├── results: string[] (resultIds)
│   ├── averageQuality: number
│   ├── phantomRefsCount: number
│   └── passRate: number

agent_sharing_approvals/
├── {approvalId}/
│   ├── agentId: string
│   ├── requestedBy: string
│   ├── requestedAt: timestamp
│   ├── sampleQuestions: SampleAnswer[] (min 3)
│   ├── evaluationId: string (optional)
│   ├── status: 'pending' | 'approved' | 'rejected'
│   ├── reviewedBy: string
│   └── reviewNotes: string
```

---

## 🚀 User Flows

### Flow 1: Create New Evaluation (Expert/Admin)

```
1. Expert opens "Sistema de Evaluaciones" from user menu
   ↓
2. Clicks "Nueva Evaluación"
   ↓
3. Step 1: Select Agent
   - Search and select from list of agents
   ↓
4. Step 2: Add Questions
   - Manual entry OR
   - Import JSON file (like S001-questions-v1.json)
   - Each question has: text, category, priority, expected topics
   ↓
5. Step 3: Define Success Criteria
   - Minimum quality score (default: 5.0/10)
   - Allow phantom refs? (default: NO)
   - Min CRITICAL coverage (default: 3)
   - Min reference similarity (default: 70%)
   - Additional requirements (free text)
   ↓
6. Click "Crear Evaluación"
   ↓
7. Evaluation created with status: 'draft'
   ↓
8. Opens evaluation detail view
```

### Flow 2: Test Questions (Expert/Admin)

```
1. Open evaluation from list
   ↓
2. Navigate to "Preguntas" tab
   ↓
3. Filter by priority/status if needed
   ↓
4. Click "Probar" on a specific question
   ↓
5. Modal opens showing question
   ↓
6. Click "Ejecutar Prueba"
   ↓
7. System:
   - Sends question to agent (via API)
   - Agent responds using its context
   - Retrieves RAG references
   - Returns response with references
   ↓
8. Evaluator reviews:
   - Reads agent response
   - Checks references (phantom ref detection)
   - Rates quality (1-10 slider)
   - Marks phantom refs if detected
   - Adds notes (optional)
   ↓
9. Click "Guardar Resultado"
   ↓
10. Result saved to Firestore
    ↓
11. Evaluation stats auto-updated
    - questionsTested++
    - averageQuality recalculated
    - phantomRefsDetected counted
    - status updated if all questions tested
```

### Flow 3: Review Results (Expert/Admin)

```
1. Open evaluation
   ↓
2. "Resumen" tab shows:
   - Overall metrics
   - Progress bar
   - Success criteria status
   - Category breakdown
   ↓
3. "Resultados" tab shows:
   - All test results
   - Individual scores
   - Notes from evaluators
   - Timestamp and evaluator email
   ↓
4. Expert determines:
   - Does agent meet success criteria?
   - Is quality sufficient?
   - Any phantom refs?
   ↓
5. If approved:
   - Agent can be shared with users
   ↓
6. If not approved:
   - Agent remains private
   - Expert provides feedback
   - Creator improves agent
   - Re-evaluation needed
```

### Flow 4: Agent Sharing Approval (Any User)

```
1. User wants to share agent with other users
   ↓
2. Clicks "Share" button on agent
   ↓
3. System checks:
   - Does agent have approved evaluation?
   ↓
4a. IF evaluation exists and approved:
    - Show sharing modal
    - User can proceed
    ↓
4b. IF NO evaluation OR not approved:
    - Show approval request form
    - Requires 3 sample questions:
      * Bad example (content, context, form)
      * Reasonable example (CSAT 3-, NPS <98)
      * Outstanding example (CSAT 4+, NPS >98)
    ↓
5. Approval request created
   ↓
6. Expert/Admin reviews:
   - Reviews sample questions
   - May request full evaluation
   - Approves or rejects
   ↓
7a. IF approved:
    - Agent can be shared
    ↓
7b. IF rejected:
    - User notified with feedback
    - Can improve and resubmit
```

---

## 📊 Success Criteria

### Default Criteria (can be customized)

```typescript
{
  minimumQuality: 5.0,              // 5/10 average minimum
  allowPhantomRefs: false,          // NO phantom refs
  minCriticalCoverage: 3,           // At least 3 CRITICAL questions
  minReferenceRelevance: 0.7,       // 70% similarity minimum
  additionalRequirements: ''        // Custom requirements
}
```

### S001 Example (Achieved)

**Criteria:**
- Minimum quality: 5.0/10
- Phantom refs: 0
- CRITICAL coverage: 3+
- Reference similarity: 70%+

**Results:**
- ✅ Quality: 9.25/10 (+85% over target)
- ✅ Phantom refs: 0 (perfect)
- ✅ CRITICAL coverage: 4 (exceeds)
- ✅ Similarity: 77% (exceeds)

**Status:** APPROVED ✅

---

## 🎯 Question Priority Levels

### CRITICAL
- Must-test questions
- Core functionality
- Most important use cases
- Minimum coverage requirement enforced

### HIGH
- Important questions
- Common use cases
- Should be tested for completeness

### MEDIUM
- Useful questions
- Less frequent use cases
- Nice to test

### LOW
- Edge cases
- Rare scenarios
- Optional testing

---

## 📋 Sample Questions Structure

### For Agent Sharing Approval

#### 1. Bad Example
```typescript
{
  type: 'bad',
  question: '¿Cómo hago un pedido?',
  answer: 'No sé',
  explanation: 'Respuesta vacía, sin información útil, sin referencias',
}
```

#### 2. Reasonable Example (CSAT 3-, NPS <98)
```typescript
{
  type: 'reasonable',
  question: '¿Cómo hago un pedido de convenio?',
  answer: 'Usa transacción ME21N',
  explanation: 'Correcto pero muy breve, falta detalle de campos y procedimiento',
  csatScore: 3,
  npsScore: 75,
}
```

#### 3. Outstanding Example (CSAT 4+, NPS >98)
```typescript
{
  type: 'outstanding',
  question: '¿Cómo genero una guía de despacho?',
  answer: 'Tres métodos disponibles: 1) VA01 (desde pedido venta), 2) MIGO + ZMM_MB90 (traspaso), 3) VL01NO (sin referencia). Cada método con campos detallados...',
  explanation: 'Comprehensivo, múltiples métodos, ejemplos específicos, campos SAP detallados, formato profesional',
  csatScore: 5,
  npsScore: 100,
}
```

---

## 🔒 Permissions

### Who Can Access Evaluations?

| Action | User | Expert | Admin | Superadmin |
|--------|------|--------|-------|------------|
| View own evaluations | ❌ | ✅ | ✅ | ✅ |
| View all evaluations | ❌ | ❌ | ✅ | ✅ |
| Create evaluations | ❌ | ✅ | ✅ | ✅ |
| Edit own evaluations | ❌ | ✅ | ✅ | ✅ |
| Edit any evaluation | ❌ | ❌ | ✅ | ✅ |
| Test questions | ❌ | ✅ | ✅ | ✅ |
| Approve agents | ❌ | ✅ | ✅ | ✅ |
| View test results | ❌ | ✅ (own) | ✅ (all) | ✅ (all) |

### API Authorization

All evaluation endpoints check:
1. ✅ User is authenticated (has valid session)
2. ✅ User has role: 'expert', 'admin', or 'superadmin'
3. ✅ For modifications: User owns evaluation OR is admin

---

## 📊 Metrics Tracked

### Per Evaluation
- Total questions
- Questions tested
- Questions passed quality
- Average quality score (1-10)
- Phantom references detected
- Average reference similarity
- Status (draft → in_progress → completed → approved/rejected)

### Per Test Result
- Question ID
- Quality rating (1-10)
- Phantom refs (yes/no)
- Expected topics found/missing
- References used
- Response time
- Evaluator notes
- Pass/fail status

### Per Agent (from evaluations)
- Total evaluations run
- Latest evaluation status
- Average quality across evaluations
- Trend over time
- Approval status

---

## 🔧 Technical Implementation

### Creating an Evaluation

```typescript
// Frontend: EvaluationPanel component
const evaluation = {
  agentId: 'AjtQZEIMQvFnPRJRjl4y',
  agentName: 'GESTION BODEGAS GPT',
  version: 'v1',
  totalQuestions: 66,
  questions: [...],
  categories: [...],
  successCriteria: {
    minimumQuality: 5.0,
    allowPhantomRefs: false,
    minCriticalCoverage: 3,
    minReferenceRelevance: 0.7,
  },
  status: 'draft',
};

// POST to API
const response = await fetch('/api/evaluations', {
  method: 'POST',
  body: JSON.stringify({ userId, evaluation }),
});
```

### Testing a Question

```typescript
// POST to test endpoint
const response = await fetch(`/api/evaluations/${evaluationId}/test`, {
  method: 'POST',
  body: JSON.stringify({
    userId,
    questionId: 'S001-Q001',
    agentId,
    prompt: '¿Dónde busco los códigos de materiales?',
  }),
});

// Response includes:
{
  response: '...', // Agent response
  references: [...], // RAG references with similarity
  contextSources: [...], // Sources used
  metadata: {...},
}
```

### Saving Results

```typescript
// After evaluator reviews response
const result = {
  evaluationId,
  questionId,
  agentId,
  testedBy: userId,
  testedByEmail,
  prompt,
  response,
  references,
  quality: 9, // 1-10 rating
  phantomRefs: false,
  notes: 'Excellent response with specific SAP codes',
  passedCriteria: true,
};

const response = await fetch(`/api/evaluations/${evaluationId}/results`, {
  method: 'POST',
  body: JSON.stringify({ userId, result }),
});

// Auto-updates evaluation stats:
// - questionsTested++
// - averageQuality recalculated
// - status updated if all done
```

---

## 📚 Example: S001 Evaluation

### Import S001 Data

```bash
# Run import script
npx tsx scripts/import-s001-evaluation.ts
```

This imports:
- ✅ Evaluation definition (66 questions)
- ✅ 4 test results (Q001, Q002, Q004, Q009)
- ✅ Success criteria
- ✅ Categories and priorities
- ✅ Metrics and stats

### S001 Results Summary

**Questions:**
- Total: 66
- Tested: 4 (6%)
- Categories: 10

**Quality:**
- Average: 9.25/10
- Range: 8-10/10
- Perfect scores: 2/4 (50%)

**References:**
- Total: 14 (3.5 avg)
- Phantom refs: 0 (0%)
- Avg similarity: 77%

**Status:** ✅ APPROVED

---

## 🔄 Evaluation Lifecycle

```
1. DRAFT
   - Evaluation created
   - Questions defined
   - Criteria set
   - No tests run yet
   ↓
2. IN_PROGRESS
   - Some questions tested
   - Results being collected
   - Stats being calculated
   ↓
3. COMPLETED
   - All questions tested
   - Final stats available
   - Pending expert review
   ↓
4a. APPROVED
    - Meets success criteria
    - Expert approves
    - Agent can be shared
    ↓
4b. REJECTED
    - Doesn't meet criteria
    - Expert provides feedback
    - Agent needs improvement
    - Can create v2 evaluation
```

---

## 📖 Question JSON Format

### Example: S001-questions-v1.json

```json
{
  "agent": "S001",
  "agentName": "GESTION BODEGAS GPT",
  "version": "v1",
  "totalQuestions": 66,
  "categories": [
    {
      "id": "cat-01",
      "name": "Códigos y Catálogos",
      "count": 7,
      "priority": "high"
    }
  ],
  "questions": [
    {
      "id": "S001-Q001",
      "number": 1,
      "category": "cat-01",
      "priority": "critical",
      "question": "¿Dónde busco los códigos de materiales?",
      "expectedTopics": ["SAP", "código material", "transacción"],
      "tested": false
    }
  ]
}
```

---

## 🎨 UI Components

### Evaluation Card

Shows in main list:
- Agent name
- Status badge (draft/in_progress/completed/approved/rejected)
- Quality badge (if tested)
- Progress bar
- Metrics: Questions tested, average quality, phantom refs, similarity

### Evaluation Detail Modal

Three tabs:

#### 1. Resumen (Overview)
- Key metrics cards
- Progress visualization
- Success criteria checklist
- Category breakdown

#### 2. Preguntas (Questions)
- Filterable by priority/status
- Grouped by category
- Each question shows:
  - ID, priority, category
  - Question text
  - Expected topics
  - Test status
  - "Probar" button
  - Quality score (if tested)

#### 3. Resultados (Results)
- List of all test results
- Individual scores
- Evaluator and timestamp
- Notes and feedback
- Filter and search

### Test Modal

- Shows question
- "Ejecutar Prueba" button
- Displays agent response
- Shows references with similarity
- Quality rating slider (1-10)
- Phantom refs checkbox (auto-detected)
- Notes textarea
- "Guardar Resultado" button

---

## 🧪 Testing Methodology

### S001 Methodology (Proven)

**Per Question (3-5 minutes):**
1. Open browser: localhost:3000/chat
2. Login and select agent
3. Click "Nuevo Chat" (fresh context)
4. Copy question from evaluation
5. Send and wait for response
6. Click "📚 Referencias utilizadas [N]"
7. Verify phantom refs: numbers in text ≤ total badges
8. Rate quality 1-10
9. Document

**Quality Criteria (1-10):**
- 10/10: Perfect - complete, precise, useful, relevant refs
- 9/10: Excellent - very good, minor gaps
- 8/10: Very good - useful but could improve
- 7/10: Good - basic, functional
- 6 or below: Insufficient

**Phantom Ref Detection:**
- References shown: [1] [2] [3] badges
- Text mentions: Look for [1], [2], etc.
- Phantom if: Number in text > total badges
- Example: Text has [5] but only 3 badges = PHANTOM

---

## 📈 Reporting

### Evaluation Report Structure

```markdown
# Agent Evaluation Report

## Executive Summary
- Overall quality
- Recommendation (approve/reject)
- Key findings

## Metrics
- Questions tested
- Average quality
- Phantom refs
- Reference similarity

## Individual Results
- Per question breakdown
- Strengths
- Areas for improvement

## Projections
- Expected performance on untested questions
- Category-level projections

## Recommendations
- Production readiness
- Required improvements
- Next steps
```

### Export Formats

- **JSON:** Complete data export
- **Markdown:** Human-readable report
- **PDF:** (Future) Professional report

---

## 🔗 Integration with Agent Sharing

### Sharing Workflow

```
User clicks "Share" on agent
    ↓
System checks: agent.evaluationId?
    ↓
┌─────────────────┬──────────────────┐
│ Has Evaluation  │ No Evaluation    │
│ AND Approved    │ OR Not Approved  │
├─────────────────┼──────────────────┤
│ Show            │ Show             │
│ Sharing Modal   │ Approval Request │
│                 │ Form             │
│                 │                  │
│ - Select users  │ - 3 sample Q&A   │
│ - Permissions   │ - Bad example    │
│ - Share         │ - Reasonable     │
│                 │ - Outstanding    │
│                 │                  │
│                 │ - Submit for     │
│                 │   expert review  │
└─────────────────┴──────────────────┘
```

### Approval Request Format

```typescript
{
  agentId: 'abc123',
  agentName: 'My Agent',
  requestedBy: userId,
  requestedByEmail: 'user@example.com',
  requestedAt: new Date(),
  sampleQuestions: [
    {
      type: 'bad',
      question: '...',
      answer: '...',
      explanation: 'Why this is bad',
    },
    {
      type: 'reasonable',
      question: '...',
      answer: '...',
      explanation: 'Why this is reasonable',
      csatScore: 3,
      npsScore: 75,
    },
    {
      type: 'outstanding',
      question: '...',
      answer: '...',
      explanation: 'Why this is outstanding',
      csatScore: 5,
      npsScore: 100,
    },
  ],
  status: 'pending',
}
```

Expert reviews and either:
- ✅ Approves → Agent can be shared
- ⚠️ Requests full evaluation → Evaluation system
- ❌ Rejects → Feedback provided

---

## 🎓 Best Practices

### Creating Evaluations

**DO:**
- ✅ Start with 5-10 CRITICAL questions
- ✅ Use existing question sets (like S001) as templates
- ✅ Set realistic success criteria (5/10 is good baseline)
- ✅ Test representative sample before all 66 questions
- ✅ Document expected topics for each question
- ✅ Group questions by category

**DON'T:**
- ❌ Set unrealistic criteria (10/10 average is too high)
- ❌ Test all 66 questions if 10 validate system
- ❌ Allow phantom refs (always set to false)
- ❌ Skip CRITICAL questions
- ❌ Mix unrelated questions in same evaluation

### Testing Questions

**DO:**
- ✅ Use "Nuevo Chat" for each question (fresh context)
- ✅ Copy exact question text
- ✅ Verify phantom refs carefully
- ✅ Rate objectively (1-10 scale)
- ✅ Add specific notes for <8/10 scores
- ✅ Check expected topics were covered

**DON'T:**
- ❌ Reuse same chat for multiple questions
- ❌ Modify question text
- ❌ Skip phantom ref check
- ❌ Rate subjectively
- ❌ Rush through testing

### Approval Process

**DO:**
- ✅ Require evaluation for sensitive agents
- ✅ Review sample questions carefully
- ✅ Provide constructive feedback if rejecting
- ✅ Consider requesting full evaluation
- ✅ Document approval reasoning

**DON'T:**
- ❌ Approve without reviewing samples
- ❌ Reject without clear feedback
- ❌ Skip sample question requirement
- ❌ Rush approval decisions

---

## 🚀 Future Enhancements

### Phase 2
- [ ] Automated testing (run all questions in sequence)
- [ ] Batch import from CSV/Excel
- [ ] Evaluation templates
- [ ] Comparison between evaluation versions
- [ ] Regression testing (v1 vs v2)

### Phase 3
- [ ] AI-assisted grading (Gemini evaluates quality)
- [ ] Expected answer matching (semantic similarity)
- [ ] Topic extraction automation
- [ ] Phantom ref auto-detection in UI
- [ ] Real-time collaborative evaluation

### Phase 4
- [ ] Public evaluation leaderboard
- [ ] Agent certification badges
- [ ] Evaluation marketplace
- [ ] Third-party evaluators
- [ ] Integration with CI/CD

---

## 📚 Related Documentation

### Internal Docs
- `docs/evaluations/S001_INDEX.md` - S001 evaluation navigation
- `docs/evaluations/reports/S001-EVALUATION-REPORT-2025-10-29.md` - S001 results
- `docs/S001_TESTING_RESULTS_SUMMARY.md` - Quick summary
- `docs/evaluations/questions/S001-questions-v1.json` - Question set

### Component Docs
- `src/components/EvaluationPanel.tsx` - Main interface
- `src/components/AgentEvaluationDashboard.tsx` - Quick evaluation
- `src/types/evaluations.ts` - Type definitions

### API Docs
- `src/pages/api/evaluations.ts` - CRUD endpoints
- `src/pages/api/evaluations/[id]/results.ts` - Results management
- `src/pages/api/evaluations/[id]/test.ts` - Test execution

---

## ✅ Success Criteria Validation

An evaluation system is successful when:

1. **Usability**
   - ✅ Expert can create evaluation in < 5 minutes
   - ✅ Question testing takes 3-5 mins per question
   - ✅ Results are clear and actionable
   - ✅ Approval workflow is intuitive

2. **Accuracy**
   - ✅ Phantom ref detection works 100%
   - ✅ Quality ratings reflect actual performance
   - ✅ Reference similarity is meaningful
   - ✅ Stats auto-update correctly

3. **Value**
   - ✅ Prevents sharing untested agents
   - ✅ Provides objective quality metrics
   - ✅ Guides agent improvement
   - ✅ Builds user confidence

4. **Scalability**
   - ✅ Handles 100+ questions per evaluation
   - ✅ Multiple evaluations per agent (versioning)
   - ✅ Concurrent testing by multiple experts
   - ✅ Results persist and are searchable

---

## 🎯 Quick Start Guide

### For Experts

**1. Create First Evaluation:**
```
1. Open user menu
2. Click "Sistema de Evaluaciones"
3. Click "Nueva Evaluación"
4. Select agent
5. Import S001 questions as template (or create own)
6. Set success criteria
7. Create
```

**2. Test Questions:**
```
1. Open evaluation
2. Go to "Preguntas" tab
3. Filter to CRITICAL priority
4. Click "Probar" on first question
5. Click "Ejecutar Prueba"
6. Review response
7. Rate quality
8. Check phantom refs
9. Save result
10. Repeat for remaining CRITICAL questions
```

**3. Review Results:**
```
1. Go to "Resultados" tab
2. Review all test results
3. Check success criteria met
4. Go to "Resumen" tab
5. Review overall stats
6. Approve or reject agent
```

### For Admins

**1. Monitor Evaluations:**
```
1. Open "Sistema de Evaluaciones"
2. See all evaluations (not just own)
3. Filter by status
4. Review pending approvals
```

**2. Review Approval Requests:**
```
1. Check agent_sharing_approvals collection
2. Review sample questions
3. Request full evaluation if needed
4. Approve or reject with feedback
```

---

## 📊 Metrics Dashboard (Future)

### Platform-Wide Metrics
- Total evaluations created
- Total questions tested
- Average quality across all agents
- Approval rate
- Time to approval

### Per-Agent Metrics
- Evaluation history
- Quality trend
- Version comparison
- Approval status

### Per-Expert Metrics
- Evaluations created
- Questions tested
- Average testing time
- Approval rate

---

## 🔐 Security & Privacy

### Data Access
- ✅ Users see only their own agent sharing requests
- ✅ Experts see own evaluations + assigned reviews
- ✅ Admins see all evaluations
- ✅ Test results visible only to evaluators and admins

### Audit Trail
- ✅ All test results logged with evaluator email
- ✅ Approval/rejection logged with reviewer
- ✅ Timestamps on all actions
- ✅ Version control on evaluations

---

**Last Updated:** 2025-10-29  
**Status:** ✅ Production Ready  
**Example:** S001 imported and available  
**Access:** Experts and Admins only

---

**Remember:** Quality evaluation is the gateway to user confidence. Test thoroughly, document clearly, and approve carefully. 🧪✅








