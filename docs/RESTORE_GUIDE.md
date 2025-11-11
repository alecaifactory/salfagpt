# 🔙 Backup Restore Guide - Complete Recovery Procedures

**Purpose:** Step-by-step instructions to restore from backups  
**Audience:** SuperAdmins, DevOps  
**Critical:** Follow procedures exactly to avoid data loss

---

## 🎯 **When to Restore**

### **Common Scenarios:**

- ❌ Deployment went wrong (data corruption)
- ❌ Accidental deletion of critical data
- ❌ Migration failed and needs rollback
- ❌ Database corruption detected
- ❌ Security incident (restore to known-good state)

### **Before Restoring:**

⚠️ **WARNING:** Restore operations OVERWRITE current data!

- [ ] Assess the damage (what data is affected?)
- [ ] Determine if full or partial restore needed
- [ ] Notify all users (system will be briefly unavailable)
- [ ] Stop all services (prevent concurrent writes)
- [ ] Document the incident
- [ ] Get approval from stakeholders

---

## 📋 **Backup Locations**

### **Current Backup:**

**Most Recent:** Check the file created during backup:
```bash
cat .last-backup-path.txt
# Shows: gs://salfagpt-backups-us/pre-multi-org-20251110-205525
```

**List All Backups:**
```bash
gsutil ls gs://salfagpt-backups-us/
```

**Backup Format:**
```
gs://salfagpt-backups-us/
├── pre-multi-org-20251110-205525/     ← Backup from 2025-11-10
│   ├── firestore/                      ← Firestore collections
│   │   ├── all_namespaces/
│   │   └── *.overall_export_metadata
│   ├── bigquery/                       ← BigQuery tables (if any)
│   │   └── DATASET_NAME/
│   │       └── TABLE_NAME/*.json
│   ├── storage/                        ← Cloud Storage (if any)
│   │   └── BUCKET_NAME/
│   └── BACKUP_MANIFEST.json            ← Backup metadata
└── complete-backup-YYYYMMDD-HHMMSS/   ← Other backups
```

---

## 🔥 **Firestore Restore Procedures**

### **Option 1: Complete Database Restore (Nuclear Option)**

**Use when:** Complete database corruption or catastrophic failure

⚠️ **WARNING:** This OVERWRITES ALL current Firestore data!

**Procedure:**

```bash
# Step 1: Stop all services (prevent writes during restore)
gcloud run services update cr-salfagpt-ai-ft-prod \
  --max-instances=0 \
  --region=us-east4 \
  --project=salfagpt

echo "✅ Services stopped"

# Step 2: Verify backup exists
BACKUP_PATH="gs://salfagpt-backups-us/pre-multi-org-20251110-205525"
gsutil ls -r $BACKUP_PATH

# Should see:
# - firestore/all_namespaces/
# - *.overall_export_metadata

# Step 3: Start restore operation
gcloud firestore import $BACKUP_PATH \
  --project=salfagpt \
  --async

# Step 4: Monitor restore progress
gcloud firestore operations list --project=salfagpt

# Wait for operation to show: done: true
# Typically takes 10-30 minutes

# Step 5: Verify restoration
# Check a few key documents to ensure data is present

# Step 6: Restart services
gcloud run services update cr-salfagpt-ai-ft-prod \
  --max-instances=50 \
  --region=us-east4 \
  --project=salfagpt

echo "✅ Services restarted"

# Step 7: Monitor for issues
# Check logs, test user access, verify functionality
```

**Time:** 30-60 minutes  
**Downtime:** 30-60 minutes  
**Risk:** 🔴 HIGH - Overwrites everything

---

### **Option 2: Partial Restore (Specific Collections)**

**Use when:** Only certain collections are corrupted

**Procedure:**

```bash
# Step 1: Identify which collections to restore
# Example: conversations and messages

# Step 2: Stop relevant services (optional but recommended)
gcloud run services update cr-salfagpt-ai-ft-prod \
  --max-instances=0 \
  --region=us-east4 \
  --project=salfagpt

# Step 3: Restore specific collections
BACKUP_PATH="gs://salfagpt-backups-us/pre-multi-org-20251110-205525"

gcloud firestore import $BACKUP_PATH \
  --collection-ids=conversations,messages \
  --project=salfagpt \
  --async

# Step 4: Monitor progress
gcloud firestore operations list --project=salfagpt

# Step 5: Verify specific collections
# Check documents in conversations and messages

# Step 6: Restart services
gcloud run services update cr-salfagpt-ai-ft-prod \
  --max-instances=50 \
  --region=us-east4 \
  --project=salfagpt
```

**Time:** 15-30 minutes  
**Downtime:** 15-30 minutes  
**Risk:** 🟡 MEDIUM - Only affects specified collections

---

### **Option 3: Selective Document Restore (Manual)**

**Use when:** Only a few documents need restoration

**Not directly supported by Firestore import.**  
**Alternative:** Export from backup, manually update specific documents.

---

## 📊 **BigQuery Restore Procedures**

### **Restore Complete Dataset:**

```bash
# Step 1: List available backups
BACKUP_PATH="gs://salfagpt-backups-us/pre-multi-org-20251110-205525"
gsutil ls $BACKUP_PATH/bigquery/

# Step 2: Restore each table
DATASET="flow_analytics"

for TABLE_DIR in $(gsutil ls $BACKUP_PATH/bigquery/$DATASET/); do
  TABLE_NAME=$(basename $TABLE_DIR)
  
  echo "Restoring table: $TABLE_NAME"
  
  bq load \
    --source_format=NEWLINE_DELIMITED_JSON \
    --replace \
    salfagpt:${DATASET}.${TABLE_NAME} \
    ${TABLE_DIR}*.json
  
  echo "✅ Table restored: $TABLE_NAME"
done
```

**Time:** 5-15 minutes per dataset  
**Downtime:** None (tables can be queried during restore)  
**Risk:** 🟢 LOW

---

### **Restore Single Table:**

```bash
BACKUP_PATH="gs://salfagpt-backups-us/pre-multi-org-20251110-205525"
DATASET="flow_analytics"
TABLE="users"

bq load \
  --source_format=NEWLINE_DELIMITED_JSON \
  --replace \
  salfagpt:${DATASET}.${TABLE} \
  ${BACKUP_PATH}/bigquery/${DATASET}/${TABLE}/*.json
```

**Time:** 1-5 minutes  
**Risk:** 🟢 LOW

---

## 📦 **Cloud Storage Restore Procedures**

### **Restore Complete Bucket:**

```bash
BACKUP_PATH="gs://salfagpt-backups-us/pre-multi-org-20251110-205525"
SOURCE_BUCKET="salfagpt-context-documents"

# Step 1: List backup contents
gsutil ls $BACKUP_PATH/storage/$SOURCE_BUCKET/

# Step 2: Restore bucket (parallel for speed)
gsutil -m cp -r \
  $BACKUP_PATH/storage/$SOURCE_BUCKET/* \
  gs://$SOURCE_BUCKET/

echo "✅ Bucket restored: $SOURCE_BUCKET"
```

**Time:** Varies by size (5 minutes - 2 hours)  
**Downtime:** None (users can access during restore)  
**Risk:** 🟢 LOW

---

### **Restore Specific Files:**

```bash
BACKUP_PATH="gs://salfagpt-backups-us/pre-multi-org-20251110-205525"
SOURCE_BUCKET="salfagpt-context-documents"
FILE_PATH="user-123/agent-456/document.pdf"

gsutil cp \
  $BACKUP_PATH/storage/$SOURCE_BUCKET/$FILE_PATH \
  gs://$SOURCE_BUCKET/$FILE_PATH
```

---

## 🚨 **Emergency Restore Procedures**

### **Scenario 1: Migration Failed, Need Rollback**

**Symptoms:**
- Users cannot see their data
- OrganizationId assignment incorrect
- Data corrupted during migration

**Recovery:**

```bash
# Option A: Use migration snapshot (if within 90 days)
npm run migrate:rollback -- --snapshot=SNAPSHOT_ID

# Option B: Restore from Firestore backup
BACKUP_PATH="gs://salfagpt-backups-us/pre-multi-org-20251110-205525"

# Stop services
gcloud run services update cr-salfagpt-ai-ft-prod --max-instances=0 --region=us-east4 --project=salfagpt

# Restore
gcloud firestore import $BACKUP_PATH --project=salfagpt

# Wait for completion (~30 min)
# Restart services
gcloud run services update cr-salfagpt-ai-ft-prod --max-instances=50 --region=us-east4 --project=salfagpt
```

**Time:** 45-60 minutes  
**Result:** Complete rollback to pre-migration state

---

### **Scenario 2: Security Rules Deployment Broke Access**

**Symptoms:**
- Users getting 403 Forbidden errors
- Cannot access their own data
- Legitimate requests blocked

**Recovery:**

```bash
# Quick fix: Revert to permissive rules temporarily
cat > firestore.rules <<EOF
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
EOF

# Deploy permissive rules
firebase deploy --only firestore:rules --project=salfagpt

# This gives you time to fix the issue
# Then redeploy correct rules after testing
```

**Time:** 5 minutes  
**Result:** Temporary access restoration

---

### **Scenario 3: Indexes Deployment Broke Queries**

**Symptoms:**
- Queries failing with "index required" errors
- New queries not working

**Recovery:**

```bash
# No restore needed - just wait
# Indexes take 5-10 minutes to build
# Check status:
gcloud firestore indexes composite list --project=salfagpt

# If index is stuck in CREATING state for >1 hour:
# Contact Google Cloud Support
# Indexes cannot be "rolled back"
```

**Note:** Index deployments are safe and cannot break existing queries

---

## 🔍 **Verification After Restore**

### **Firestore Restore Verification:**

```bash
# 1. Check operation completed
gcloud firestore operations list --project=salfagpt

# 2. Verify documents exist
# Login to Firebase Console
# https://console.firebase.google.com/project/salfagpt/firestore

# 3. Test sample queries
# Check users collection has documents
# Check conversations collection has documents

# 4. Test user login
# Login as test user
# Verify can access their data

# 5. Check counts match backup
# Compare document counts before and after
```

---

### **BigQuery Restore Verification:**

```bash
# Check table exists
bq show salfagpt:flow_analytics.users

# Check row count
bq query --use_legacy_sql=false \
  "SELECT COUNT(*) as count FROM \`salfagpt.flow_analytics.users\`"

# Compare with pre-backup count
```

---

### **Cloud Storage Restore Verification:**

```bash
# Check file count
gsutil ls -r gs://salfagpt-context-documents/ | wc -l

# Check total size
gsutil du -sh gs://salfagpt-context-documents/

# Compare with pre-backup stats
```

---

## 📋 **Post-Restore Checklist**

**After any restore operation:**

- [ ] Verify data integrity (spot-check key documents)
- [ ] Test user authentication
- [ ] Test user data access
- [ ] Check all critical features work
- [ ] Monitor error logs (15 minutes)
- [ ] Notify users (system restored)
- [ ] Document incident (what happened, why, resolution)
- [ ] Update runbooks (prevent recurrence)

---

## 🔗 **Backup Information Files**

### **Local Backup Info:**

**Location:** `backup-info-YYYYMMDD-HHMMSS.json` (created during backup)

**Contains:**
```json
{
  "backupId": "pre-multi-org-20251110-205525",
  "projectId": "salfagpt",
  "createdAt": "2025-11-10T23:55:25Z",
  "location": "gs://salfagpt-backups-us/pre-multi-org-20251110-205525",
  "components": ["firestore", "bigquery", "storage"],
  "sizeGB": 5,
  "expiresAt": "2026-02-08T23:55:25Z",
  "restoreCommands": {
    "firestore": "gcloud firestore import gs://salfagpt-backups-us/pre-multi-org-20251110-205525 --project=salfagpt"
  }
}
```

**Keep this file safe!** It has quick restore commands.

---

## 🕐 **Restore Time Estimates**

| Operation | Data Size | Estimated Time | Downtime |
|-----------|-----------|----------------|----------|
| Firestore (complete) | 1-5 GB | 20-40 minutes | 20-40 min |
| Firestore (complete) | 5-20 GB | 40-90 minutes | 40-90 min |
| Firestore (collection) | Variable | 10-30 minutes | 10-30 min |
| BigQuery (table) | 1-10 GB | 5-15 minutes | None |
| BigQuery (table) | 10-100 GB | 15-60 minutes | None |
| Storage (bucket) | 1-50 GB | 10-120 minutes | None |

---

## 🚨 **Emergency Contact Procedures**

### **Critical Restore (Production Down):**

**Immediate Actions:**
1. **Stop all services** - Prevent further damage
2. **Assess scope** - What's affected?
3. **Contact SuperAdmin** - alec@getaifactory.com
4. **Review backup** - Confirm backup exists
5. **Execute restore** - Follow procedures above
6. **Verify** - Check data integrity
7. **Restart** - Bring services back online
8. **Monitor** - Watch for issues (2 hours)

### **Escalation Path:**

```
Level 1: SuperAdmin (alec@)
   ↓ (if not available or insufficient)
Level 2: GCP Support (console.cloud.google.com/support)
   ↓ (if critical data loss)
Level 3: Google Cloud Emergency Support
```

---

## 📝 **Restore Logging**

### **Document Every Restore:**

Create an incident report in `docs/incidents/restore-YYYYMMDD.md`:

```markdown
# Restore Incident Report

**Date:** YYYY-MM-DD
**Time:** HH:MM
**Initiated By:** [Name/Email]

## Incident
**What Happened:** [Description]
**Impact:** [Users affected, data affected]
**Severity:** Critical/High/Medium/Low

## Restore Details
**Backup Used:** gs://salfagpt-backups-us/...
**Backup Date:** YYYY-MM-DD
**Restore Type:** Full/Partial/Collection
**Collections Restored:** [List]

## Timeline
- HH:MM: Incident detected
- HH:MM: Services stopped
- HH:MM: Restore initiated
- HH:MM: Restore completed
- HH:MM: Verification complete
- HH:MM: Services restarted
- HH:MM: All clear

## Verification
- [ ] Data integrity confirmed
- [ ] User access verified
- [ ] No errors in logs
- [ ] Functionality restored

## Root Cause
[What caused the need to restore]

## Prevention
[What we'll do to prevent this]

## Follow-up Actions
- [ ] Update procedures
- [ ] Add safeguards
- [ ] Train team
```

---

## 🔧 **Advanced Restore Scenarios**

### **Restore to Different Project:**

```bash
# Export from backup
BACKUP_PATH="gs://salfagpt-backups-us/pre-multi-org-20251110-205525"

# Import to different project
gcloud firestore import $BACKUP_PATH \
  --project=different-project-id
```

---

### **Restore with Data Transformation:**

**Not directly supported.** Must:
1. Restore to temporary project
2. Export from temporary project
3. Transform data (custom script)
4. Import to target project

---

### **Restore Specific Document (Workaround):**

```bash
# 1. Restore collection to temporary database
gcloud firestore import $BACKUP_PATH \
  --collection-ids=conversations \
  --project=temp-project

# 2. Copy specific document
# Use Firestore console or custom script to copy specific doc

# 3. Manually update target database
```

---

## 📊 **Restore Best Practices**

### **Before Restoring:**

1. ✅ **Create current backup** (before restore, in case restore fails)
   ```bash
   gcloud firestore export gs://salfagpt-backups-us/pre-restore-$(date +%Y%m%d-%H%M%S) --project=salfagpt
   ```

2. ✅ **Verify backup integrity**
   ```bash
   gsutil ls -r $BACKUP_PATH
   # Ensure all expected files present
   ```

3. ✅ **Test restore in staging** (if time permits)
   ```bash
   gcloud firestore import $BACKUP_PATH --project=salfagpt-staging
   ```

4. ✅ **Notify stakeholders**
   - Users: System will be briefly unavailable
   - Team: Restore operation in progress

5. ✅ **Stop services** (prevent concurrent writes)

---

### **During Restore:**

1. ✅ **Monitor progress** (every 5 minutes)
   ```bash
   gcloud firestore operations list --project=salfagpt
   ```

2. ✅ **Check logs** for errors
   ```bash
   gcloud logging read "resource.type=cloud_run_revision" \
     --limit=50 \
     --project=salfagpt
   ```

3. ✅ **Document timeline** (for incident report)

---

### **After Restore:**

1. ✅ **Verify data integrity** (spot-check key documents)
2. ✅ **Test user access** (login as various user types)
3. ✅ **Check functionality** (create agent, send message, etc.)
4. ✅ **Monitor for 2 hours** (watch for issues)
5. ✅ **Document incident** (create incident report)
6. ✅ **Update procedures** (prevent recurrence)

---

## 🎯 **Quick Reference Commands**

### **Most Common Restores:**

**Complete Firestore Restore:**
```bash
gcloud firestore import gs://salfagpt-backups-us/BACKUP_ID --project=salfagpt
```

**Restore Specific Collections:**
```bash
gcloud firestore import gs://salfagpt-backups-us/BACKUP_ID \
  --collection-ids=conversations,messages,users \
  --project=salfagpt
```

**Restore BigQuery Table:**
```bash
bq load --replace salfagpt:DATASET.TABLE \
  gs://salfagpt-backups-us/BACKUP_ID/bigquery/DATASET/TABLE/*.json
```

**Restore Storage Bucket:**
```bash
gsutil -m cp -r gs://salfagpt-backups-us/BACKUP_ID/storage/BUCKET/* gs://BUCKET/
```

---

## 📞 **Support & Resources**

**Documentation:**
- Backup creation: `docs/BACKUP_BEFORE_DEPLOYMENT.md`
- Deployment: `docs/DEPLOYMENT_CHECKLIST_MULTI_ORG.md`
- Migration: `docs/MIGRATION_RUNBOOK.md`

**GCP Documentation:**
- [Firestore Import/Export](https://cloud.google.com/firestore/docs/manage-data/export-import)
- [BigQuery Load Data](https://cloud.google.com/bigquery/docs/loading-data)
- [Storage Copy](https://cloud.google.com/storage/docs/gsutil/commands/cp)

**Contact:**
- SuperAdmin: alec@getaifactory.com
- GCP Support: console.cloud.google.com/support

---

## ✅ **Restore Verification Checklist**

**After any restore operation:**

- [ ] Restore operation completed (done: true)
- [ ] No errors in operation logs
- [ ] Sample documents verified (spot-check)
- [ ] User authentication works
- [ ] User can access their data
- [ ] Critical features functional
- [ ] No 403/404 errors for valid requests
- [ ] Performance normal
- [ ] Error logs clean (15 min monitoring)
- [ ] Stakeholders notified (restoration complete)
- [ ] Incident documented
- [ ] Services fully operational

---

**Last Updated:** 2025-11-10  
**Version:** 1.0.0  
**Status:** Production-ready restore procedures

