# Backup Before Multi-Org Deployment

**CRITICAL:** Always backup before deploying changes to production

---

## 🎯 **Quick Backup (Recommended)**

### **Run the Automated Script:**

```bash
./scripts/create-complete-backup.sh --project=salfagpt
```

**What it does:**
- ✅ Backs up ALL Firestore collections
- ✅ Backs up ALL BigQuery datasets and tables
- ✅ Backs up ALL Cloud Storage buckets
- ✅ Creates backup manifest
- ✅ Sets 90-day retention policy
- ✅ Saves restore instructions

**Time:** ~10-30 minutes (depends on data size)

**Result:**
- Backup saved to: `gs://salfagpt-backups/complete-backup-YYYYMMDD-HHMMSS/`
- Local file: `backup-info-YYYYMMDD-HHMMSS.json` (keep this safe!)

---

## 📋 **Manual Backup (If Script Fails)**

### **1. Backup Firestore**

```bash
# Export all collections
gcloud firestore export gs://salfagpt-backups/manual-firestore-$(date +%Y%m%d) \
  --project=salfagpt

# Verify export
gcloud firestore operations list --project=salfagpt
# Wait for status: DONE
```

### **2. Backup BigQuery (if you have datasets)**

```bash
# List datasets
bq ls --project_id=salfagpt

# Export each dataset's tables
# Example for flow_analytics dataset:
bq extract \
  --destination_format=NEWLINE_DELIMITED_JSON \
  salfagpt:flow_analytics.users \
  gs://salfagpt-backups/manual-bigquery-$(date +%Y%m%d)/users-*.json
```

### **3. Backup Cloud Storage (if you have buckets)**

```bash
# List buckets
gsutil ls -p salfagpt

# Copy each bucket
# Example:
gsutil -m cp -r gs://salfagpt-uploads/* \
  gs://salfagpt-backups/manual-storage-$(date +%Y%m%d)/uploads/
```

---

## ⏱️ **Expected Duration**

**For typical Salfa Corp setup (~150 users, 200 agents):**

- Firestore export: 10-15 minutes
- BigQuery export: 5-10 minutes (if datasets exist)
- Cloud Storage: 5-20 minutes (depends on file count)
- **Total:** ~20-45 minutes

**Progress indicators:**
- Firestore: Shows "operation in progress"
- BigQuery: Shows "Waiting for operation to complete"
- Storage: Shows file copy progress

---

## ✅ **Verification**

### **After Backup Completes:**

```bash
# Check backup exists
gsutil ls gs://salfagpt-backups/

# Should see: complete-backup-YYYYMMDD-HHMMSS/

# Check contents
gsutil ls -r gs://salfagpt-backups/complete-backup-YYYYMMDD-HHMMSS/

# Should see:
# - firestore/
# - bigquery/ (if applicable)
# - storage/ (if applicable)
# - BACKUP_MANIFEST.json
```

### **Verify Backup Quality:**

```bash
# Check Firestore backup size (should be substantial)
gsutil du -sh gs://salfagpt-backups/complete-backup-YYYYMMDD-HHMMSS/firestore

# List exported collections
gsutil ls gs://salfagpt-backups/complete-backup-YYYYMMDD-HHMMSS/firestore/

# Should see your collections: conversations, users, context_sources, etc.
```

---

## 🔙 **How to Restore (If Needed)**

### **Restore Firestore (Complete Database):**

```bash
# Find your backup
gsutil ls gs://salfagpt-backups/

# Restore (OVERWRITES current data!)
gcloud firestore import gs://salfagpt-backups/complete-backup-YYYYMMDD-HHMMSS/firestore \
  --project=salfagpt
```

### **Restore Specific Collection:**

```bash
# Restore just one collection
gcloud firestore import gs://salfagpt-backups/complete-backup-YYYYMMDD-HHMMSS/firestore \
  --collection-ids=conversations \
  --project=salfagpt
```

### **Restore BigQuery Table:**

```bash
bq load \
  --source_format=NEWLINE_DELIMITED_JSON \
  --replace \
  salfagpt:flow_analytics.users \
  gs://salfagpt-backups/complete-backup-YYYYMMDD-HHMMSS/bigquery/flow_analytics/users/*.json
```

### **Restore Cloud Storage Bucket:**

```bash
gsutil -m cp -r \
  gs://salfagpt-backups/complete-backup-YYYYMMDD-HHMMSS/storage/BUCKET_NAME/* \
  gs://BUCKET_NAME/
```

---

## 🚨 **Emergency Restore Procedure**

### **If Deployment Goes Wrong:**

**Immediate Actions:**
1. **Stop deployment** - Cancel any ongoing operations
2. **Assess damage** - What data is affected?
3. **Contact team** - Alert admins

**Restore Decision:**
```
Minor issue (few documents):
  → Manual fix (update specific documents)

Major issue (many documents):
  → Restore specific collection from backup

Critical issue (complete failure):
  → Restore entire Firestore from backup
```

**Full Restore:**
```bash
# 1. Stop all services (prevent new writes)
gcloud run services update cr-salfagpt-ai-ft-prod \
  --max-instances=0 \
  --project=salfagpt

# 2. Restore Firestore
gcloud firestore import gs://salfagpt-backups/complete-backup-YYYYMMDD-HHMMSS/firestore \
  --project=salfagpt

# 3. Verify restoration
# Check sample documents

# 4. Restart services
gcloud run services update cr-salfagpt-ai-ft-prod \
  --max-instances=50 \
  --project=salfagpt

# 5. Monitor for issues
```

---

## 📊 **Backup Best Practices**

### **Before Every Major Deployment:**

1. ✅ Create complete backup
2. ✅ Verify backup completed successfully
3. ✅ Save backup-info file locally
4. ✅ Test restore procedure (optional)
5. ✅ Document backup location

### **Retention:**

- **Automatic:** Backups deleted after 90 days
- **Manual:** Download critical backups for long-term storage
- **Recommendation:** Keep pre-deployment backups for 6+ months

### **Monitoring:**

```bash
# List all backups
gsutil ls gs://salfagpt-backups/

# Check backup age
gsutil ls -l gs://salfagpt-backups/ | grep complete-backup

# Delete old backups manually (if needed)
gsutil rm -r gs://salfagpt-backups/OLD_BACKUP/
```

---

## 🎯 **Backup Checklist**

**Before running multi-org deployment:**

- [ ] Backup script executed successfully
- [ ] Firestore export completed (check operations)
- [ ] BigQuery tables exported (if applicable)
- [ ] Cloud Storage copied (if applicable)
- [ ] Backup manifest created
- [ ] backup-info-*.json file saved locally
- [ ] Backup size verified (substantial)
- [ ] Backup location documented
- [ ] Team notified of backup location

**After backup:**

- [ ] Proceed with deployment (indexes, rules, code)
- [ ] Monitor deployment closely
- [ ] Keep backup info for 90+ days

---

## 📞 **Support**

**If backup fails:**
- Check authentication: `gcloud auth list`
- Check permissions: `gcloud projects get-iam-policy salfagpt`
- Check Firestore enabled: `gcloud services list --enabled | grep firestore`

**If restore needed:**
- Contact: alec@getaifactory.com
- Have backup ID ready
- Describe what went wrong

---

**Last Updated:** 2025-11-10  
**Script:** `scripts/create-complete-backup.sh`  
**Status:** Ready to use  
**Tested:** ✅ Safe, read-only operations

