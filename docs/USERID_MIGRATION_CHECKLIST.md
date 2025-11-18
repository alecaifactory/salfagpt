# User ID Migration - Execution Checklist

**Date:** 2025-11-15  
**Purpose:** Step-by-step checklist for migrating userId format  
**Status:** Ready for execution

---

## 🎯 Pre-Migration Phase

### Discovery & Planning
- [ ] **Run discovery script**
  ```bash
  npm run discover:userid-mappings
  ```
  - Generates `src/lib/userid-mappings.ts`
  - Shows mapping table
  - Confirms user count

- [ ] **Run verification script**
  ```bash
  npm run verify:userid-formats
  ```
  - Identifies all affected collections
  - Shows count of documents needing migration
  - Generates priority list

- [ ] **Review migration plan**
  - Read `docs/USERID_MIGRATION_PLAN_2025-11-15.md`
  - Understand risks and rollback plan
  - Get approval from user

- [ ] **Create backup**
  ```bash
  ./scripts/create-complete-backup.sh --project=salfagpt
  ```
  - Wait for completion (~30 min)
  - Verify backup successful
  - Document backup location

---

## 🚀 Migration Execution

### Phase 1: Critical Collections (P0)

#### context_sources (884 documents)
- [ ] **Dry run**
  ```bash
  npm run migrate:userid -- --collection=context_sources --dry-run
  ```
  - Review output carefully
  - Verify sample documents look correct
  - Confirm count matches expected (884)

- [ ] **Execute migration**
  ```bash
  npm run migrate:userid -- --collection=context_sources --execute
  ```
  - Monitor progress
  - Check for errors
  - **Expected duration:** 5-10 minutes

- [ ] **Verify migration**
  ```bash
  npm run verify:userid-formats
  ```
  - context_sources should show 0 numeric userIds
  - All should be hash format

- [ ] **Test functionality**
  - Open agent context modal
  - Should show correct document count
  - Load documents successfully

---

#### document_chunks (~10,000+ documents)
- [ ] **Dry run**
  ```bash
  npm run migrate:userid -- --collection=document_chunks --dry-run
  ```
  - Review output
  - Confirm count
  - Check samples

- [ ] **Execute migration**
  ```bash
  npm run migrate:userid -- --collection=document_chunks --execute
  ```
  - Monitor progress (will take longer)
  - **Expected duration:** 30-60 minutes

- [ ] **Verify migration**
  ```bash
  npm run verify:userid-formats
  ```

- [ ] **Test RAG search**
  - Send message to agent with documents
  - Verify chunks are found
  - Check response quality

---

### Phase 2: User-Facing Collections (P1)

#### message_feedback
- [ ] Dry run: `npm run migrate:userid -- --collection=message_feedback --dry-run`
- [ ] Execute: `npm run migrate:userid -- --collection=message_feedback --execute`
- [ ] Verify: Check feedback page loads
- [ ] Test: Submit new feedback, verify it saves correctly

#### feedback_tickets
- [ ] Dry run: `npm run migrate:userid -- --collection=feedback_tickets --dry-run`
- [ ] Execute: `npm run migrate:userid -- --collection=feedback_tickets --execute`
- [ ] Verify: Check tickets page loads
- [ ] Test: Create ticket, verify it appears

#### message_queue
- [ ] Dry run: `npm run migrate:userid -- --collection=message_queue --dry-run`
- [ ] Execute: `npm run migrate:userid -- --collection=message_queue --execute`
- [ ] Verify: Check queue page loads
- [ ] Test: Add to queue, verify it works

---

### Phase 3: Analytics & Tracking (P2)

#### usage_logs
- [ ] Dry run: `npm run migrate:userid -- --collection=usage_logs --dry-run`
- [ ] Execute: `npm run migrate:userid -- --collection=usage_logs --execute`
- [ ] Verify: Analytics still load

#### cli_events
- [ ] Dry run: `npm run migrate:userid -- --collection=cli_events --dry-run`
- [ ] Execute: `npm run migrate:userid -- --collection=cli_events --execute`
- [ ] Verify: CLI stats accurate

#### agent_prompt_versions
- [ ] Dry run: `npm run migrate:userid -- --collection=agent_prompt_versions --dry-run`
- [ ] Execute: `npm run migrate:userid -- --collection=agent_prompt_versions --execute`
- [ ] Verify: Prompt history loads

---

### Phase 4: New Features (P3)

#### document_annotations
- [ ] Migrate if exists
- [ ] Test annotation features

#### quality_funnel_events
- [ ] Migrate if exists
- [ ] Test quality tracking

#### user_badges
- [ ] Migrate if exists
- [ ] Test gamification features

---

## 🧹 Code Cleanup Phase

### Remove Temporary Fixes

- [ ] **Remove googleUserId queries from:**
  - [ ] `src/pages/api/agents/[id]/context-count.ts`
  - [ ] `src/pages/api/agents/[id]/context-sources.ts`
  - [ ] `src/lib/rag-search.ts`
  - [ ] `src/lib/bigquery-agent-search.ts`
  - [ ] `src/lib/bigquery-optimized.ts`

- [ ] **Simplify queries to:**
  ```typescript
  // After migration, this works:
  .where('userId', '==', effectiveUserId)
  // No need for googleUserId lookup
  ```

- [ ] **Add validation to prevent numeric IDs:**
  ```typescript
  function validateUserId(userId: string) {
    if (/^\d+$/.test(userId)) {
      throw new Error('Numeric userId not allowed - use hash format');
    }
  }
  ```

- [ ] **Update all write operations:**
  - [ ] createContextSource
  - [ ] createConversation (already correct)
  - [ ] addMessage (already correct)
  - [ ] createFeedback
  - [ ] createTicket
  - [ ] All other userId writes

---

## ✅ Verification & Testing

### Automated Verification
- [ ] **Run verification script (should be clean)**
  ```bash
  npm run verify:userid-formats
  # Expected: All collections ✅
  ```

- [ ] **Type check passes**
  ```bash
  npm run type-check
  # Expected: 0 errors
  ```

- [ ] **Build succeeds**
  ```bash
  npm run build
  # Expected: Clean build
  ```

---

### Manual Testing Checklist

#### Agent Context
- [ ] Open multiple agents
- [ ] Each shows correct document count
- [ ] Load documents for each
- [ ] All assigned documents visible
- [ ] Toggle sources on/off
- [ ] Changes persist

#### RAG Search
- [ ] Send message to agent with 10+ documents
- [ ] Verify chunks are found (check console)
- [ ] Response includes context from documents
- [ ] Multiple agents tested

#### User Feedback
- [ ] View my feedback page
- [ ] See all previous feedback
- [ ] Submit new feedback
- [ ] Appears in list immediately

#### Analytics
- [ ] Open analytics dashboard
- [ ] User stats accurate
- [ ] Domain stats complete
- [ ] Agent metrics correct

#### Queue System
- [ ] Add items to queue
- [ ] View queue
- [ ] Execute queue item
- [ ] All items visible

---

## 📊 Migration Metrics

Track these for each collection:

| Collection | Before | After | Duration | Errors | Status |
|------------|--------|-------|----------|--------|--------|
| context_sources | | | | | |
| document_chunks | | | | | |
| message_feedback | | | | | |
| feedback_tickets | | | | | |
| message_queue | | | | | |
| usage_logs | | | | | |
| cli_events | | | | | |
| Other collections | | | | | |

---

## 🚨 Rollback Triggers

**Rollback immediately if:**
- ❌ Migration errors > 1% of documents
- ❌ Critical feature breaks (agent context, RAG search)
- ❌ Data loss detected
- ❌ Performance degradation > 50%
- ❌ User reports issues

**Rollback procedure:**
```bash
# 1. Stop any running migrations
# 2. Restore from backup
gcloud firestore import gs://backup/pre-migration-20251115 --project=salfagpt

# 3. Revert code changes
git revert <migration-commits>
git push origin main

# 4. Verify system functioning
npm run verify:system-health
```

---

## 📝 Post-Migration

### Documentation Updates
- [ ] Update `.cursor/rules/data.mdc` - Document userId format standard
- [ ] Update `.cursor/rules/firestore.mdc` - Remove googleUserId references
- [ ] Update `USERID_MIGRATION_PLAN_2025-11-15.md` - Mark as complete
- [ ] Create `USERID_MIGRATION_COMPLETE_2025-11-15.md` - Results summary

### Code Standards
- [ ] Add ESLint rule to detect numeric userId
- [ ] Add pre-commit hook to validate userId format
- [ ] Update developer onboarding docs
- [ ] Add to code review checklist

### Monitoring
- [ ] Set up alerts for numeric userId writes
- [ ] Monitor error rates for 48 hours
- [ ] Track user complaints
- [ ] Verify analytics accuracy

---

## 🎓 Lessons Learned

### What Went Well
- (To be filled after migration)

### What Could Be Improved
- (To be filled after migration)

### Recommendations for Future
- (To be filled after migration)

---

## 📅 Timeline

### Suggested Schedule

**Day 1 (Monday):**
- Morning: Discovery & verification scripts
- Afternoon: Review results, create backup

**Day 2 (Tuesday):**
- Morning: Migrate context_sources (P0)
- Afternoon: Test, verify, migrate document_chunks (P0)

**Day 3 (Wednesday):**
- Morning: Migrate feedback collections (P1)
- Afternoon: Migrate queue & sessions (P1)

**Day 4 (Thursday):**
- Morning: Migrate analytics collections (P2)
- Afternoon: Code cleanup, remove workarounds

**Day 5 (Friday):**
- Morning: Final testing
- Afternoon: Deploy to production, monitor

---

## ✅ Sign-off

### Required Approvals

- [ ] **User Approval:** Migration plan reviewed and approved
- [ ] **Backup Verified:** Complete backup exists and tested
- [ ] **Dry Run Successful:** All collections dry-run without errors
- [ ] **Rollback Plan Ready:** Can restore within 30 minutes if needed

### Execution Authorization

**I approve this migration to proceed:**

- **Name:** _______________________
- **Date:** _______________________
- **Signature:** _______________________

---

**When all checkboxes are complete, migration is successful! 🎉**





