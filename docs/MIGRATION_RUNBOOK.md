# Migration Runbook - Multi-Organization Data Migration

**Purpose:** Step-by-step guide to migrate existing Salfa Corp data to multi-organization model

---

## 🎯 **Overview**

**What:** Assign existing Salfa Corp users, agents, and context sources to the "Salfa Corp" organization

**Why:** Enable organization-level data isolation and management

**Safety:** All operations are:
- ✅ Additive only (no data deletion)
- ✅ Reversible (rollback capability)
- ✅ Tested (dry-run mode)
- ✅ Monitored (progress logging)

---

## 📋 **Pre-Migration Checklist**

### **Before Starting:**

- [ ] **Backup created**
  ```bash
  gcloud firestore export gs://salfagpt-backups/$(date +%Y%m%d) --project=salfagpt
  ```

- [ ] **Staging environment setup**
  ```bash
  npm run staging:setup
  # Verify complete before proceeding
  ```

- [ ] **Organization created**
  ```bash
  curl -X POST /api/organizations \
    -d '{"name":"Salfa Corp","domains":["salfagestion.cl","salfa.cl"],"primaryDomain":"salfagestion.cl"}'
  ```

- [ ] **Domains confirmed**
  - salfagestion.cl ✅
  - salfa.cl ✅
  - [Add any others]

- [ ] **Admin approval obtained**
  - Primary: sorellanac@salfagestion.cl ✅
  - SuperAdmin: alec@getaifactory.com ✅

---

## 🔄 **Migration Process**

### **Step 1: Dry-Run (SAFE - Preview Only)**

```bash
npm run migrate:multi-org:dry-run -- \
  --org=salfa-corp \
  --domains=salfagestion.cl,salfa.cl \
  --env=staging
```

**Expected Output:**
```
📊 Found 150 total users
🎯 Users to migrate: 142 (matching domains)
📊 Found 200 conversations
📊 Found 500 context sources

⚠️  DRY RUN: Would update:
  - 142 users
  - 200 conversations
  - 500 context sources
```

**Review:**
- Verify user count matches expectations
- Check that correct domains are matched
- Ensure no unexpected users included

---

### **Step 2: Execute in Staging**

```bash
npm run migrate:multi-org -- \
  --org=salfa-corp \
  --domains=salfagestion.cl,salfa.cl \
  --env=staging
```

**Monitor Progress:**
- Watch console output
- Batches of 500 documents
- Progress indicators shown
- Errors logged if any

**Expected Duration:** 2-5 minutes for 150 users, 200 agents

---

### **Step 3: Verify in Staging**

**Login to staging:**
```
https://STAGING_URL/chat
```

**As sorellanac@ (org admin):**
- [ ] Can see all Salfa Corp users
- [ ] Can see all Salfa Corp agents
- [ ] Can see all Salfa Corp context sources
- [ ] Cannot see non-Salfa users/agents
- [ ] Evaluation system works correctly

**As regular Salfa user:**
- [ ] Can see their own conversations
- [ ] Can create agents
- [ ] Everything works as before

**As non-Salfa user (if any):**
- [ ] Not affected by migration
- [ ] Sees all their own data
- [ ] No organizationId field (backward compatible)

---

### **Step 4: UAT Approval**

**Get approval from:**
- [ ] sorellanac@salfagestion.cl (org admin)
  - Verified: All Salfa data visible ✅
  - Verified: Evaluation system works ✅
  - Verified: No data loss ✅
  - **Approved:** [YES/NO]

- [ ] alec@getaifactory.com (superadmin)
  - Verified: All orgs visible ✅
  - Verified: Isolation working ✅
  - **Approved:** [YES/NO]

---

### **Step 5: Execute in Production**

**ONLY after staging UAT approval**

```bash
# Final production migration
npm run migrate:multi-org -- \
  --org=salfa-corp \
  --domains=salfagestion.cl,salfa.cl \
  --env=production
```

**Monitor:**
- Watch progress closely
- Verify no errors
- Check completion statistics

---

### **Step 6: Post-Migration Verification**

**Immediate Checks (within 5 minutes):**

```bash
# 1. Verify org stats
curl https://PROD_URL/api/organizations/salfa-corp/stats

# 2. Check sample user
# Get a known user ID, verify organizationId field set

# 3. Check sample conversation
# Get a known conversation ID, verify organizationId field set
```

**Extended Verification (within 1 hour):**

- [ ] Login as sorellanac@ → verify sees all Salfa data
- [ ] Login as regular Salfa user → verify normal experience
- [ ] Test evaluation workflow → verify domain-scoped
- [ ] Check analytics → verify org-scoped
- [ ] Monitor error logs → verify no issues

**48-Hour Monitoring:**

- [ ] Monitor error rates
- [ ] Check user complaints
- [ ] Verify performance (no degradation)
- [ ] Confirm data integrity

---

## 🔙 **Rollback Plan**

### **If Issues Detected:**

**Within 90 days of migration:**

```bash
# Find migration snapshot
# Query migration_snapshots collection for latest

# Rollback (via migration script)
npm run migrate:rollback -- --snapshot=SNAPSHOT_ID
```

**Manual rollback:**
```bash
# Remove organizationId from all affected documents
# (Script would automate this)
```

---

## 📊 **Success Criteria**

### **Migration is successful when:**

- [ ] All Salfa users have organizationId = 'salfa-corp'
- [ ] All Salfa conversations have organizationId
- [ ] All Salfa context sources have organizationId
- [ ] Org admin (sorellanac@) sees only Salfa data
- [ ] SuperAdmin sees all orgs
- [ ] Regular users see their own data (unchanged)
- [ ] Non-Salfa users unaffected
- [ ] No data loss detected
- [ ] No errors in logs
- [ ] Performance unchanged

---

## 🚨 **Emergency Contacts**

**Issues during migration:**
- SuperAdmin: alec@getaifactory.com
- Org Admin: sorellanac@salfagestion.cl

**Escalation:**
1. Stop migration immediately
2. Review error logs
3. Contact SuperAdmin
4. Assess rollback need

---

**Last Updated:** 2025-11-10  
**Status:** Ready for execution  
**Tested:** Dry-run mode ✅

