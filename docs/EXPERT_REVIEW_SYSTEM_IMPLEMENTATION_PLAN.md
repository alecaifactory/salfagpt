# 🚀 Expert Review System - 10-Step Implementation Plan

**Created:** 2025-11-09  
**Status:** ✅ In Progress  
**Timeline:** 5 weeks (4-5 sprints)  
**Estimated Effort:** ~30 days development  
**ROI:** 2,150% annually

---

## 🎯 Implementation Strategy

**Approach:** Incremental, additive changes leveraging existing foundation (70% complete)  
**Backward Compatibility:** 100% maintained  
**Risk:** Low (feature-flagged, domain-by-domain rollout)

---

## 📋 10 Implementation Steps

### **STEP 1: Foundation Types & State Machine** ✅ COMPLETE
**Status:** ✅ Done  
**Time:** 2 hours  
**Files:**
- ✅ `src/types/expert-review.ts` (600 lines)

**What Was Created:**
- ReviewStatus enum (9 states)
- CorrectionProposal interface
- ImpactAnalysis interface  
- DomainReviewConfig interface
- SpecialistMatch interface
- State transition logic
- DQS calculation functions
- Audit trail types

**Backward Compatibility:**
- All new types, no breaking changes
- Extends existing feedback.ts without modifications

---

### **STEP 2: Extend Feedback Schema**
**Status:** 🔄 Next  
**Time:** 2 hours  
**Files to Modify:**
- `src/types/feedback.ts` (extend FeedbackTicket)
- `src/lib/firestore.ts` (add domain field helpers)

**Changes:**
```typescript
// Add to FeedbackTicket (additive only)
interface FeedbackTicket {
  // ... existing fields (unchanged) ...
  
  // ✨ NEW (all optional - backward compatible)
  domain?: string;
  reviewStatus?: ReviewStatus;
  correctionProposal?: CorrectionProposal;
  impactAnalysis?: ImpactAnalysis;
  assignment?: ExpertAssignment;
  approvalWorkflow?: ApprovalWorkflow;
  implementation?: ImplementationTracking;
}
```

**Validation:**
- Old tickets continue working (optional fields)
- New tickets auto-populate domain from user email
- Type check passes

---

### **STEP 3: AI Services - Core Intelligence**
**Status:** Pending  
**Time:** 8 hours  
**Files to Create:**
- `src/lib/expert-review/ai-correction-service.ts`
- `src/lib/expert-review/impact-analysis-service.ts`
- `src/lib/expert-review/specialist-matching-service.ts`

**AI Services:**

1. **AI Correction Service**
   - Input: User question, poor response, expert notes, domain context
   - Output: Suggested correction with confidence score
   - Model: Gemini 2.5 Flash
   - Time: ~2-3 seconds per suggestion

2. **Impact Analysis Service**
   - Input: Proposed correction, domain ID
   - Output: Domain-wide impact metrics, ROI, risk assessment
   - Model: Gemini 2.5 Pro
   - Time: ~4-5 seconds per analysis

3. **Specialist Matching Service**
   - Input: Interaction details, domain ID
   - Output: Top 3 specialist matches with scores
   - Model: Gemini 2.5 Flash (topic extraction)
   - Time: ~2 seconds per match

---

### **STEP 4: Domain Configuration System**
**Status:** Pending  
**Time:** 4 hours  
**Files to Create:**
- `src/lib/expert-review/domain-config-service.ts`
- `src/pages/api/domains/[domainId]/review-config.ts`
- `src/components/DomainReviewConfigPanel.tsx`

**Features:**
- CRUD operations for domain_review_config
- Assign supervisors/specialists to domain
- Configure priority thresholds per domain
- Set notification preferences
- API endpoints with domain isolation

---

### **STEP 5: Enhanced Expert Feedback Panel**
**Status:** Pending  
**Time:** 6 hours  
**Files to Modify:**
- `src/components/ExpertFeedbackPanel.tsx` (+200 lines)

**Enhancements:**
1. Add correction type selector
2. Add scope selector (agent vs domain-wide)
3. Integrate AI suggestion display
4. Add document update selector
5. Add routing options (direct vs specialist)
6. Show impact preview

**UX Improvements:**
- AI suggestion appears automatically
- One-click "Use AI Suggestion"
- Time estimates (with AI: 8 min, without: 25 min)
- Smart defaults based on pattern recognition

---

### **STEP 6: Supervisor Expert Panel** (Main Interface)
**Status:** Pending  
**Time:** 12 hours  
**Files to Create:**
- `src/components/expert-review/SupervisorExpertPanel.tsx` (~800 lines)
- `src/pages/expertos-supervisor.astro` (route)

**Features:**
- Domain-filtered interaction list
- Priority queue with smart sorting
- Bulk selection for batch
- Specialist assignment UI with AI matching
- Personal dashboard (evaluations, approval rate, ranking)
- Filter by agent, date, priority, status
- Search functionality

**UX:**
- Personalized landing (shows expert's impact)
- AI pre-analyzes each interaction
- Time estimates per interaction
- Progress tracking (monthly goals)
- Gamification (badges, ranking)

---

### **STEP 7: Specialist Expert Panel**
**Status:** Pending  
**Time:** 8 hours  
**Files to Create:**
- `src/components/expert-review/SpecialistExpertPanel.tsx` (~400 lines)
- `src/pages/expertos-specialist.astro` (route)

**Features:**
- Shows ONLY assigned interactions
- Why they were assigned (AI match transparency)
- Evaluation form (same as supervisor)
- "Return to supervisor" action
- "No aplica" action with reassignment
- Workload indicator

**UX:**
- Focused view (no distractions)
- Clear checklist for their expertise
- Supervisor notes visible
- Time tracking
- Recognition for contributions

---

### **STEP 8: Admin Approval & Batch Tools**
**Status:** Pending  
**Time:** 10 hours  
**Files to Create:**
- `src/components/expert-review/AdminApprovalPanel.tsx`
- `src/components/expert-review/ImpactAnalysisCard.tsx`
- `src/components/expert-review/BatchCorrectionPanel.tsx`
- `src/components/expert-review/PromptDiffViewer.tsx`
- `src/lib/expert-review/batch-correction-service.ts`

**Features:**
- Approval queue for admin
- Impact visualization (domain-wide metrics)
- Visual diff (split view / unified view)
- Batch selection and analysis
- One-click approval for low-risk
- Dual-approval workflow for critical

**UX:**
- Command center feel
- AI recommendations per correction
- Risk indicators
- Batch efficiency calculator
- Achievement predictions ("You'll be #1!")

---

### **STEP 9: Audit Trail & Compliance**
**Status:** Pending  
**Time:** 8 hours  
**Files to Create:**
- `src/lib/expert-review/audit-service.ts`
- `src/lib/expert-review/compliance-reporting.ts`
- `src/components/expert-review/AuditTrailViewer.tsx`
- `src/components/expert-review/ComplianceReportGenerator.tsx`

**Features:**
- Audit trail collection (auto-log all actions)
- SHA-256 hash verification
- Compliance report generation (SOC 2, ISO 27001, GDPR, etc.)
- Export formats (PDF, Excel, JSON)
- Tamper-proof logs
- Retention policy automation

**Regulations Addressed:**
- SOC 2 Type 2
- ISO 27001
- GDPR
- Chilean AI Law
- Chilean Data Protection
- Chilean Cybersecurity

---

### **STEP 10: Metrics Dashboards & North Star**
**Status:** Pending  
**Time:** 10 hours  
**Files to Create:**
- `src/lib/expert-review/metrics-service.ts`
- `src/components/expert-review/DomainQualityDashboard.tsx`
- `src/components/expert-review/ExpertPerformanceDashboard.tsx`
- `src/components/expert-review/UserContributionDashboard.tsx`
- `src/components/expert-review/SuperAdminCrossDomainDashboard.tsx`

**Features:**
- DQS calculation and tracking
- Funnel metrics per persona
- Personalized dashboards
- Gamification (badges, rankings, points)
- Delight moments (achievement notifications)
- Cross-domain analytics (SuperAdmin)

**UX:**
- Each persona sees THEIR metrics
- North Star prominently displayed
- Progress to goals visualized
- Social recognition
- Learning insights

---

## 📊 Timeline & Dependencies

```
Week 1 (Sprint 1):
  Day 1-2: Steps 1-2 (Types & Schema)        ✅ Step 1 done
  Day 3-5: Step 3 (AI Services)              ← Core intelligence

Week 2 (Sprint 2):
  Day 1-2: Step 4 (Domain Config)
  Day 3-5: Step 5 (Enhanced Panel)

Week 3 (Sprint 3):
  Day 1-3: Step 6 (Supervisor Panel)        ← Main interface
  Day 4-5: Step 7 (Specialist Panel)

Week 4 (Sprint 4):
  Day 1-3: Step 8 (Admin Tools)             ← Power features
  Day 4-5: Step 9 (Audit & Compliance)

Week 5 (Sprint 5):
  Day 1-3: Step 10 (Metrics & Dashboards)   ← Delight & analytics
  Day 4-5: Integration testing, deployment
```

**Critical Path:** Steps 1→2→3→5→6 (core workflow)  
**Can Parallelize:** Steps 7, 9, 10 (after step 6)

---

## 🔧 Development Notes

### Reuse Strategy

**Existing Components (Reuse ~37%):**
- ExpertFeedbackPanel.tsx (enhance, +200 lines)
- FeedbackBacklogDashboard.tsx (enhance, +150 lines)
- feedback-service.ts (extend with new AI calls)
- firestore.ts (add domain helpers)
- gemini.ts (reuse AI integration patterns)

**New Components (~63%):**
- expert-review/ folder (10 new components)
- expert-review/ lib folder (7 new services)
- API endpoints (9 new routes)

**Total New Code:** ~5,550 lines  
**Total Modified Code:** ~500 lines  
**Leverage Ratio:** 37% reuse

---

## ✅ Success Criteria (Per Step)

### Step 1: ✅ COMPLETE
- [x] Types compile without errors
- [x] State transitions validated
- [x] DQS formula implemented
- [x] Documentation inline

### Step 2: Validation
- [ ] Existing tickets load without errors
- [ ] New fields populate correctly
- [ ] Domain auto-detected from user
- [ ] Type check passes

### Step 3: Validation
- [ ] AI suggestion generates in <3s
- [ ] Impact analysis completes in <5s
- [ ] Specialist match accuracy >85%
- [ ] Cost per analysis <$0.01

### Step 4: Validation
- [ ] Domain config CRUD works
- [ ] Firestore security rules enforced
- [ ] API responds in <500ms
- [ ] Domain isolation verified

### Step 5: Validation
- [ ] Expert can use AI suggestion
- [ ] Correction proposal saves
- [ ] Routing options work
- [ ] No regression in existing flow

### Step 6: Validation
- [ ] Supervisor sees domain interactions
- [ ] Cannot see other domains
- [ ] Assignment workflow works
- [ ] Dashboard metrics accurate

### Step 7: Validation
- [ ] Specialist sees only assigned
- [ ] Return to supervisor works
- [ ] "No aplica" marks correctly
- [ ] Email notifications sent

### Step 8: Validation
- [ ] Admin approves corrections
- [ ] Batch analysis detects conflicts
- [ ] Visual diff displays correctly
- [ ] Apply updates agents successfully

### Step 9: Validation
- [ ] Every action creates audit entry
- [ ] Hashes verify correctly
- [ ] Compliance reports generate
- [ ] Export formats work

### Step 10: Validation
- [ ] DQS calculated correctly
- [ ] Funnels track conversions
- [ ] Dashboards personalized
- [ ] Gamification works

---

## 🚀 Deployment Strategy

### Phase 1: Pilot (Week 1-2)
- Deploy to localhost
- Test with alec@getaifactory.com (SuperAdmin)
- Single domain: maqsa.cl
- 1 supervisor, 1 specialist, 1 admin

### Phase 2: Beta (Week 3-4)
- Deploy to staging-internal
- Expand to 3 domains (maqsa.cl, novatec.cl, getaifactory.com)
- Onboard all experts
- Monitor metrics

### Phase 3: Production (Week 5)
- Deploy to production
- Enable all 15 domains
- Full expert network (20 supervisors, 30 specialists)
- Monitor North Star metric

---

## 📊 Expected Outcomes

### Immediate (Week 1)
- AI suggestions working (2.3s response)
- Expert evaluation 60% faster
- Domain config established

### Short-term (Month 1)
- 50 corrections applied (maqsa.cl pilot)
- DQS improvement +5-10 points (pilot domain)
- Expert approval rate >80%

### Medium-term (Month 3)
- 200+ corrections platform-wide
- DQS improvement +15-25 points average
- All 15 domains with expert coverage
- Platform DQS >75 (acceptable)

### Long-term (Month 6)
- 500+ corrections applied
- DQS improvement +30-40 points
- Platform DQS >85 (world-class)
- ROI: 925% realized

---

## 🎯 North Star Metric Tracking

**Baseline (Before Expert Review):**
- Platform DQS: 54.4
- Domains below acceptable: 12/15 (80%)
- No expert oversight
- No quality improvement process

**Target (After 6 Months):**
- Platform DQS: >85 (world-class)
- Domains below acceptable: <3/15 (<20%)
- 100% expert coverage
- Systematic quality improvement

**Current Progress:**
- Step 1/10 complete (10%)
- Foundation established
- Ready for core implementation

---

## 🔗 Integration Points

### With Existing Systems

**Feedback Collection:**
- ✅ Reuse UserFeedbackPanel (no changes)
- ✅ Reuse ExpertFeedbackPanel (enhance)
- ✅ Reuse message_feedback collection (extend)

**Ticket System:**
- ✅ Reuse feedback_tickets collection (extend)
- ✅ Reuse FeedbackBacklogDashboard (enhance)
- ✅ Reuse AI ticket generation (add impact analysis)

**Domain System:**
- ✅ Leverage existing domain isolation
- ✅ Use existing domain.ts helpers
- ✅ Extend with review configuration

**Role System:**
- ✅ Reuse existing admin/expert/user roles
- ✅ Add specialist alias (expert with filtered view)
- ✅ Use existing permissions framework

**AI Integration:**
- ✅ Reuse Gemini integration (gemini.ts)
- ✅ Add 3 new AI service functions
- ✅ Same authentication and error handling

---

## 🎉 Benefits Delivered (By Step)

**After Step 3:** AI suggestions save experts 60% time  
**After Step 6:** Supervisors can manage domain quality  
**After Step 7:** Specialist expertise leveraged  
**After Step 8:** Admins can batch-apply (10x efficiency)  
**After Step 9:** Full compliance readiness  
**After Step 10:** Complete visibility and gamification

---

**Next:** Proceeding with Step 2 (Extend feedback schema)...

