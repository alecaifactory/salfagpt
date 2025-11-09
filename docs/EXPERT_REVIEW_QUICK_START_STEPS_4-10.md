# 🚀 Expert Review System - Quick Start Guide (Steps 4-10)

**For:** Next development session  
**Pre-requisites:** Steps 1-3 complete ✅  
**Goal:** Complete remaining 70% of system

---

## 📋 Steps 4-10 Quick Reference

### ✅ DONE (Steps 1-3 - 30%)
- Foundation types (`expert-review.ts`)
- Schema extensions (`feedback.ts`)
- AI services (correction, impact, matching)

### 🔄 NEXT: Step 4 - Domain Configuration (10%)

**Create These Files:**
```bash
src/lib/expert-review/domain-config-service.ts (300 lines)
src/pages/api/domains/[domainId]/review-config.ts (200 lines)
src/components/expert-review/DomainReviewConfigPanel.tsx (400 lines)
```

**What It Does:**
- Manage `domain_review_config` Firestore collection
- Assign supervisors/specialists to domains
- Configure priority thresholds (≤3 stars default)
- Set notification preferences per domain
- API with domain isolation

**Key Functions:**
```typescript
// In domain-config-service.ts
getDomainReviewConfig(domainId)
createDomainReviewConfig(domainId, config)
addSupervisorToDomain(domainId, userId)
addSpecialistToDomain(domainId, userId, specialty, domains)
updatePriorityThresholds(domainId, thresholds)
```

**Firestore Collection:**
```
domain_review_config/{domainId}
{
  domainName: string,
  priorityThresholds: {...},
  supervisors: [...],
  specialists: [...],
  implementers: [...],
  notifications: {...},
  automation: {...}
}
```

**Time Estimate:** 4 hours

---

### Step 5 - Enhanced Expert Panel (5%)

**Modify This File:**
```bash
src/components/ExpertFeedbackPanel.tsx (+200 lines)
```

**Add Sections:**
1. AI Suggestion Display Card
2. Correction Type Selector
3. Scope Selector (agent vs domain-wide)
4. Document Update Selector
5. Routing Options (direct vs specialist)
6. Time Estimates Display

**UI Pattern:**
```tsx
{/* After existing rating fields */}

{expertRating === 'inaceptable' && (
  <div className="mt-4 bg-blue-50 border border-blue-300 rounded-xl p-4">
    <h4>✨ Sugerencia de IA</h4>
    {/* AI suggestion card */}
    {/* Use/Edit/Discard buttons */}
  </div>
)}

<div className="mt-4">
  <label>Tipo de Corrección *</label>
  <select>
    <option value="contenido">📚 Conocimiento</option>
    <option value="regla">⚖️ Domain Prompt</option>
    <option value="faq">❓ FAQ</option>
    <option value="tono">🎭 Tono</option>
  </select>
</div>
```

**Integration:**
- Call `generateCorrectionSuggestion()` when rating = inaceptable
- Display with confidence score
- Auto-fill correction field if user accepts

**Time Estimate:** 6 hours

---

### Step 6 - Supervisor Dashboard (Main Interface) (15%)

**Create These Files:**
```bash
src/components/expert-review/SupervisorExpertPanel.tsx (800 lines)
src/pages/expertos-supervisor.astro (50 lines)
```

**Layout:**
```
┌────────────────────────────────────────┐
│ 👨‍💼 Panel Experto - expert@maqsa.cl  │
│ ════════════════════════════════════   │
│ [Domain Selector] [Filters]           │
│                                        │
│ 📊 Your Dashboard                      │
│ ├─ Evaluations this month: 42         │
│ ├─ Approval rate: 92%                  │
│ └─ Ranking: #2 of 20 experts          │
│                                        │
│ 🚨 Priority Queue (32)                │
│ ┌──────────────────────────────────┐ │
│ │ #TKT-1234 - LATAM urgente        │ │
│ │ ★★☆☆☆ • 23 similares            │ │
│ │ ✨ AI: 92% confidence            │ │
│ │ [Evaluar] [Asignar]              │ │
│ └──────────────────────────────────┘ │
│                                        │
│ [...more interactions...]              │
└────────────────────────────────────────┘
```

**Key Features:**
- Domain filtering (only their domain)
- Priority sorting (AI-assisted)
- Bulk selection
- Specialist assignment with smart matching
- Personal metrics dashboard

**Time Estimate:** 12 hours

---

### Step 7 - Specialist Panel (8%)

**Create:**
```bash
src/components/expert-review/SpecialistExpertPanel.tsx (400 lines)
src/pages/expertos-specialist.astro (50 lines)
```

**Simpler than Supervisor:**
- Shows ONLY assigned interactions (filtered query)
- Evaluation form (reuse from supervisor)
- Return to supervisor button
- "No aplica" button
- Workload indicator

**Filter Logic:**
```typescript
// Show only assigned to this specialist
const assigned = tickets.filter(t => 
  t.expertAssignment?.assignedTo === userId &&
  t.domain === userDomain
);
```

**Time Estimate:** 8 hours

---

### Step 8 - Admin Approval Tools (12%)

**Create:**
```bash
src/components/expert-review/AdminApprovalPanel.tsx (500 lines)
src/components/expert-review/ImpactAnalysisCard.tsx (300 lines)
src/components/expert-review/BatchCorrectionPanel.tsx (600 lines)
src/components/expert-review/PromptDiffViewer.tsx (400 lines)
src/lib/expert-review/batch-correction-service.ts (400 lines)
```

**Features:**
- Approval queue (status = "aprobada-aplicar")
- Impact visualization (domain-wide metrics)
- Visual diff (split view)
- Batch selection and conflict detection
- One-click apply

**Time Estimate:** 10 hours

---

### Step 9 - Audit & Compliance (10%)

**Create:**
```bash
src/lib/expert-review/audit-service.ts (400 lines)
src/lib/expert-review/compliance-reporting.ts (300 lines)
src/components/expert-review/AuditTrailViewer.tsx (400 lines)
src/components/expert-review/ComplianceReportGenerator.tsx (300 lines)
```

**Features:**
- Auto-log every action to `audit_trail` collection
- SHA-256 hash generation
- Integrity verification
- Compliance report generation (8 regulations)
- Export formats (PDF, Excel, JSON)

**Time Estimate:** 8 hours

---

### Step 10 - Metrics & Gamification (10%)

**Create:**
```bash
src/lib/expert-review/metrics-service.ts (400 lines)
src/components/expert-review/DomainQualityDashboard.tsx (500 lines)
src/components/expert-review/ExpertPerformanceDashboard.tsx (400 lines)
src/components/expert-review/UserContributionDashboard.tsx (300 lines)
```

**Features:**
- DQS calculation real-time
- Funnel tracking per persona
- Gamification (badges, points, rankings)
- Delight moments (achievement notifications)
- Personal impact visualization

**Time Estimate:** 10 hours

---

## 🔧 Technical Notes for Each Step

### Step 4: Domain Config
**Firestore Collection:** `domain_review_config/{domainId}`  
**Index Needed:** None (document ID = domainId)  
**Security Rule:** Admin of domain OR SuperAdmin

### Steps 5-8: UI Components
**Pattern:** React functional components with hooks  
**Styling:** Tailwind CSS v3.4.17 (stable)  
**Icons:** Lucide React  
**State:** Local state + API calls  

### Step 9: Audit System
**Firestore Collection:** `audit_trail/{entryId}`  
**Indexes Needed:**
- timestamp DESC
- actor.userId ASC, timestamp DESC
- subject.domain ASC, timestamp DESC

**Retention:** 7 years (SOC 2 requirement)

### Step 10: Metrics
**Firestore Collection:** `domain_quality_metrics/{domainId}`  
**Update Frequency:** Real-time on each correction applied  
**Aggregation:** Daily cron for platform-wide stats

---

## 🎯 Testing Strategy (Per Step)

### Step 4: Domain Config
```bash
# Create config for maqsa.cl
# Assign expert@maqsa.cl as supervisor
# Assign ana@maqsa.cl as specialist (Legal)
# Verify API returns config
# Verify domain isolation (cannot access other domains)
```

### Step 5: Enhanced Panel
```bash
# Expert marks interaction as "Inaceptable"
# AI suggestion appears in 2-3s
# Expert clicks "Use AI Suggestion"
# Form auto-fills with AI text
# Submit saves correctionProposal
```

### Step 6: Supervisor Dashboard
```bash
# Login as expert@maqsa.cl
# See priority queue (domain-filtered)
# Click "Evaluar" on interaction
# AI suggestion loads
# Assign to specialist
# Specialist appears in "Assigned" section
```

### Step 7: Specialist Panel
```bash
# Login as ana@maqsa.cl
# See only 2 assigned interactions (not all 32)
# Evaluate assignment
# Click "Return to Supervisor"
# Supervisor receives notification
```

### Step 8: Admin Tools
```bash
# Login as admin@maqsa.cl
# See 4 approved corrections
# Select 3 for batch
# Click "Analyze Batch"
# AI shows no conflicts
# Click "Apply Batch"
# 3 corrections applied in 8s
```

### Steps 9-10: Governance & Metrics
```bash
# All actions create audit entries
# Verify SHA-256 hashes
# Generate SOC 2 report
# DQS updates in real-time
# Expert sees their dashboard (ranking #2)
```

---

## 💡 Pro Tips for Implementation

### Use Feature Flags
```typescript
const FEATURES = {
  expertReviewSystem: process.env.FEATURE_EXPERT_REVIEW === 'true',
  aiSuggestions: true,
  batchCorrections: false, // Enable in Step 8
  complianceReports: false, // Enable in Step 9
};
```

### Incremental Rollout
1. Localhost first (all features)
2. Staging with maqsa.cl only
3. Production: 3 domains
4. Production: All 15 domains

### Parallel Development
- Steps 7, 9, 10 can be developed in parallel after Step 6
- Core path: 4 → 5 → 6 (sequential)
- Enhancement path: 7, 8, 9, 10 (can parallelize)

---

## 🎯 Success Metrics to Track

**Development Velocity:**
- Steps completed per week: Target 2
- Lines of code per day: Target 200-300
- TypeScript errors: Target 0

**Quality:**
- Backward compatibility: 100%
- Test coverage: >80%
- Code review: Required

**Business:**
- Expert time saved: >50%
- Admin efficiency: >200%
- DQS improvement: >+20 points (pilot)

---

## 📞 Need Help?

**Reference Documents:**
1. `docs/EXPERT_REVIEW_COMPLETE_SPEC_2025-11-09.md` - Full technical spec
2. `docs/EXPERT_REVIEW_SYSTEM_IMPLEMENTATION_PLAN.md` - 10-step plan
3. `docs/EXPERT_REVIEW_SESSION_SUMMARY_2025-11-09.md` - What was done today
4. `src/types/expert-review.ts` - All type definitions (inline docs)

**ASCII Flows:**
- See "EXPERT_REVIEW_COMPLETE_SPEC" for complete UX flows
- See role-based approval matrix
- See compliance requirements

---

## ✅ Ready to Continue

**Foundation:** ✅ Complete and validated  
**Next Step:** Domain configuration (Step 4)  
**Then:** UI development (Steps 5-8)  
**Finally:** Governance & metrics (Steps 9-10)

**Timeline:** 4 weeks to completion  
**Confidence:** HIGH

---

**Start Next Session With:**
```bash
# 1. Review what was done
cat docs/EXPERT_REVIEW_SESSION_SUMMARY_2025-11-09.md

# 2. Check current status
git status

# 3. Continue with Step 4
# Create domain-config-service.ts
# (See Step 4 section above for details)
```

Good luck! The foundation is solid. 🚀

