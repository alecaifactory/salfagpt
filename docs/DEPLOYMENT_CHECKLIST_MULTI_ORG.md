# Multi-Organization System - Deployment Checklist

**Use this checklist for safe production deployment**

---

## 📋 **Pre-Deployment**

### **Code Review:**
- [x] All code committed to feat/multi-org-system-2025-11-10
- [x] All changes reviewed
- [x] No breaking changes
- [x] Backward compatibility verified
- [x] TypeScript compiles (new files)
- [ ] All tests pass (when written)

### **Documentation:**
- [x] organizations.mdc created
- [x] data.mdc updated
- [x] SuperAdmin guide created
- [x] Org Admin guide created
- [x] Migration runbook created
- [x] Comprehensive summaries created

### **Backup:**
- [ ] Production Firestore exported
  ```bash
  gcloud firestore export gs://salfagpt-backups/pre-multi-org-$(date +%Y%m%d) --project=salfagpt
  ```

---

## 🚀 **Deployment Steps**

### **Phase 1: Deploy Indexes (SAFE)**

```bash
# Deploy new indexes (additive, zero risk)
firebase deploy --only firestore:indexes --project=salfagpt

# Verify indexes building
gcloud firestore indexes composite list --project=salfagpt

# Wait for all indexes to be READY (~5-10 minutes)
```

**Verification:**
- [ ] All new organizationId indexes appear
- [ ] All indexes reach READY state
- [ ] Existing queries still work

---

### **Phase 2: Test Security Rules (CRITICAL)**

```bash
# Start Firebase emulator
firebase emulators:start --only firestore

# Test in another terminal:
# 1. Test existing user access (should work)
# 2. Test org admin access (should work)
# 3. Test cross-org access (should fail - 403)
# 4. Test superadmin access (should work)
```

**Verification:**
- [ ] Existing user access works
- [ ] Org isolation enforced
- [ ] SuperAdmin can access all
- [ ] No unintended access granted

---

### **Phase 3: Deploy Security Rules**

```bash
# Deploy to production (AFTER emulator testing)
firebase deploy --only firestore:rules --project=salfagpt
```

**Verification:**
- [ ] Rules deployed successfully
- [ ] Existing users can still login
- [ ] Existing users can access their data
- [ ] No 403 errors for valid access

---

### **Phase 4: Deploy Code**

```bash
# Deploy backend code
gcloud run deploy cr-salfagpt-ai-ft-prod \
  --source . \
  --region us-east4 \
  --project salfagpt
```

**Verification:**
- [ ] Service deploys successfully
- [ ] Health check passes
- [ ] Existing endpoints work
- [ ] New endpoints available

---

### **Phase 5: Setup Staging (Independent)**

```bash
# Create staging environment
npm run staging:setup

# Follow prompts
# ~30-45 minutes
```

**Verification:**
- [ ] salfagpt-staging project created
- [ ] Firestore database created
- [ ] Production data copied
- [ ] Cloud Run service deployed
- [ ] Staging URL accessible

---

### **Phase 6: Test Migration (Staging)**

```bash
# Dry-run first (always)
npm run migrate:multi-org:dry-run -- \
  --org=salfa-corp \
  --domains=salfagestion.cl,salfa.cl \
  --env=staging

# Review output
# Verify user count, conversation count, etc.

# Execute migration in staging
npm run migrate:multi-org -- \
  --org=salfa-corp \
  --domains=salfagestion.cl,salfa.cl \
  --env=staging
```

**Verification:**
- [ ] Migration completes without errors
- [ ] User count matches expected
- [ ] All Salfa users have organizationId
- [ ] Snapshot created successfully

---

### **Phase 7: UAT in Staging**

**As sorellanac@ (org admin):**
- [ ] Login to staging
- [ ] Verify sees all Salfa Corp data
- [ ] Verify cannot see other orgs (if any)
- [ ] Test evaluation workflow
- [ ] Test creating agents
- [ ] Test uploading context
- [ ] **Approval:** [YES/NO]

**As regular Salfa user:**
- [ ] Login works
- [ ] Sees own conversations
- [ ] Can create agents
- [ ] Everything works as before
- [ ] **No issues detected:** [YES/NO]

**As SuperAdmin:**
- [ ] Can see all organizations
- [ ] Can manage Salfa Corp
- [ ] Can view statistics
- [ ] **Approval:** [YES/NO]

---

### **Phase 8: Production Migration**

**ONLY after UAT approval from both admins**

```bash
# Final production migration
npm run migrate:multi-org -- \
  --org=salfa-corp \
  --domains=salfagestion.cl,salfa.cl \
  --env=production
```

**Monitor Closely:**
- [ ] No errors during migration
- [ ] All batches complete successfully
- [ ] Statistics match expectations
- [ ] Snapshot created

---

### **Phase 9: Post-Deployment Verification**

**Immediate (within 5 minutes):**
- [ ] Org stats API works: `curl /api/organizations/salfa-corp/stats`
- [ ] Sample user has organizationId
- [ ] Sample conversation has organizationId
- [ ] No errors in Cloud Run logs

**Short-term (within 1 hour):**
- [ ] Org admin login works
- [ ] Org admin sees Salfa data only
- [ ] Regular users unaffected
- [ ] Evaluation system works
- [ ] No user complaints

**Extended (48 hours):**
- [ ] No performance degradation
- [ ] No data integrity issues
- [ ] Error rates normal
- [ ] User satisfaction maintained

---

## 🔙 **Rollback Procedure**

### **If Issues Detected:**

**Option 1: Rollback Migration** (within 90 days)
```bash
# Find snapshot
# Query migration_snapshots collection

# Rollback
npm run migrate:rollback -- --snapshot=SNAPSHOT_ID
```

**Option 2: Manual Fix**
```bash
# Update affected documents to remove organizationId
# (Rare, only if specific issue)
```

**Option 3: Restore from Backup**
```bash
# Nuclear option - restore complete Firestore
gcloud firestore import gs://salfagpt-backups/pre-multi-org-YYYYMMDD \
  --project=salfagpt
```

---

## 📊 **Success Metrics**

### **Migration Successful When:**

**Data Integrity:**
- [ ] 0 users lost
- [ ] 0 conversations lost
- [ ] 0 context sources lost
- [ ] All relationships preserved

**Organization Assignment:**
- [ ] ~150 users assigned to Salfa Corp
- [ ] ~200 conversations assigned
- [ ] ~500 context sources assigned
- [ ] Snapshot created successfully

**Access Control:**
- [ ] Org admin sees Salfa data only
- [ ] SuperAdmin sees all orgs
- [ ] Regular users see own data
- [ ] Isolation verified

**Performance:**
- [ ] Query times unchanged
- [ ] No errors in logs
- [ ] User experience unchanged

---

## 🚨 **Emergency Procedures**

### **If Migration Fails Mid-Process:**

1. **Stop immediately** - Cancel remaining batches
2. **Assess impact** - Check what was migrated
3. **Review errors** - Check error logs
4. **Contact team** - SuperAdmin + Org Admin
5. **Decide:**
   - Continue (if minor issues)
   - Rollback (if major issues)
   - Partial fix (if specific documents)

### **If Users Report Issues:**

1. **Gather information:**
   - Which user?
   - What issue?
   - When did it start?

2. **Check their data:**
   - Does user have organizationId?
   - Can they access their conversations?
   - Are permissions correct?

3. **Quick fix:**
   - Verify user's org assignment
   - Check Firestore rules
   - Review API logs

4. **Escalate if needed:**
   - Contact SuperAdmin
   - Consider rollback if widespread

---

## 📞 **Support Contacts**

**During Migration:**
- SuperAdmin: alec@getaifactory.com
- Org Admin: sorellanac@salfagestion.cl

**Post-Migration (48h monitoring):**
- Monitor: Cloud Run logs
- Check: Firestore usage
- Alert: Any 403 errors (access denied)

---

**Last Updated:** 2025-11-10  
**Status:** Ready for execution  
**Tested:** Dry-run mode ✅  
**Approved:** Pending UAT

