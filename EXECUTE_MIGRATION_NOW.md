# 🚀 Execute Full Migration - With Backup & Recovery

**Date:** 2025-11-15  
**Status:** ✅ Ready for Immediate Execution  
**Safety Level:** MAXIMUM (Full backup + rollback procedures)

---

## ⚡ Quick Start (Automated)

### Option 1: Fully Automated Safe Migration (RECOMMENDED)
```bash
# One command does everything:
# - Creates backup
# - Waits for backup completion
# - Migrates all 4 collections
# - Verifies success
# - Logs everything

./scripts/safe-migration-executor.sh
```

**Duration:** 20-30 minutes (mostly waiting for backup)  
**User interaction:** Type 'YES' to confirm, then wait  
**Logging:** Creates timestamped log file automatically

---

## 📋 Option 2: Manual Step-by-Step (Full Control)

### Step 1: Create Backup (5-10 min)
```bash
# Create complete Firestore backup
./scripts/create-firestore-backup.sh
```

**What it does:**
- Creates backup bucket if needed
- Exports entire Firestore database
- Names backup with timestamp
- Initiates async operation

**Expected output:**
```
🛡️  Creating Firestore Backup
================================
Project: salfagpt
Backup: pre-userid-migration-20251115_143022
Bucket: gs://salfagpt-backups

✅ Backup initiated!
⏳ Wait for backup to complete before running migration!
```

---

### Step 2: Wait for Backup Completion
```bash
# Check if backup is complete (run every minute until successful)
./scripts/verify-backup-complete.sh
```

**Expected output when complete:**
```
✅ Backup completed successfully!

📍 Backup location:
   gs://salfagpt-backups/pre-userid-migration-20251115_143022

📦 Backed up collections:
  - conversations
  - context_sources
  - messages
  - users
  - folders
  ... (all collections)

✅ Safe to proceed with migration!
```

---

### Step 3: Verify Pre-Migration State
```bash
# See current state (should show numeric IDs)
npm run verify:userid-formats
```

**Expected output:**
```
❌ Collections needing migration:
   - context_sources: 885 documents
   - message_feedback: 37 documents
   - feedback_tickets: 62 documents
   - agent_prompt_versions: 27 documents

⚠️  Total documents to migrate: 1011
```

---

### Step 4: Execute Migrations

#### 4a. Migrate context_sources (CRITICAL - 5-10 min)
```bash
npm run migrate:userid -- --collection=context_sources --execute
```

**Expected output:**
```
📝 Migrating userId: 114671162830729001607 → usr_uhwqffaqag1wrryd82tw
  Batch 1...
    Found 500 documents
    ✅ Migrated 500 documents
  Batch 2...
    Found 385 documents
    ✅ Migrated 385 documents

✅ Migration complete!
📊 Documents processed: 885
```

**Test immediately:**
- Open http://localhost:3000/chat
- Click any agent
- Click ⚙️ settings icon
- Should now show correct document count (not "0 documentos")

---

#### 4b. Migrate agent_prompt_versions (1 min)
```bash
npm run migrate:userid -- --collection=agent_prompt_versions --execute
```

**Expected output:**
```
✅ Migration complete!
📊 Documents processed: 27
```

---

#### 4c. Migrate message_feedback (1 min)
```bash
npm run migrate:userid -- --collection=message_feedback --execute
```

**Expected output:**
```
✅ Migration complete!
📊 Documents processed: 37
```

---

#### 4d. Migrate feedback_tickets (1 min)
```bash
npm run migrate:userid -- --collection=feedback_tickets --execute
```

**Expected output:**
```
✅ Migration complete!
📊 Documents processed: 62
```

---

### Step 5: Verify Post-Migration State
```bash
# Should show all collections clean
npm run verify:userid-formats
```

**Expected output:**
```
✅ Collections already clean:
   - context_sources
   - document_chunks
   - message_feedback
   - feedback_tickets
   - agent_prompt_versions

🎉 ALL COLLECTIONS CLEAN - No migration needed!
```

---

### Step 6: Test Everything

#### Test Agent Context
```bash
# Open in browser: http://localhost:3000/chat
# 1. Click any agent (e.g., "GOP GPT (M003)")
# 2. Click ⚙️ settings icon
# 3. Should show "5 documentos" or similar (not "0 documentos")
# 4. Click "Cargar Documentos"
# 5. Should load documents successfully
```

#### Test RAG Search
```bash
# 1. Select agent with documents
# 2. Send a message asking about document content
# 3. Check console for RAG search logs
# 4. Response should include context from documents
```

#### Test Feedback
```bash
# Open: http://localhost:3000/feedback
# Should see all feedback items (not just recent 5)
```

---

## 🛡️ Backup & Recovery System

### What Was Backed Up
- ✅ **All Firestore collections** (complete database)
- ✅ **All documents** (~1,000+ documents)
- ✅ **All fields** (no data loss)
- ✅ **Timestamped** (can identify specific backup)

### Backup Location
```bash
# List all backups
gsutil ls gs://salfagpt-backups/ | grep pre-userid-migration

# Example output:
# gs://salfagpt-backups/pre-userid-migration-20251115_143022/
# gs://salfagpt-backups/pre-userid-migration-20251115_150000/
```

### If Something Goes Wrong

#### Quick Rollback (30 minutes)
```bash
# 1. List available backups
gsutil ls gs://salfagpt-backups/ | grep pre-userid-migration

# 2. Choose most recent backup
BACKUP_PATH="gs://salfagpt-backups/pre-userid-migration-20251115_143022"

# 3. Restore
./scripts/restore-from-backup.sh $BACKUP_PATH

# 4. Wait for restore to complete (10-15 min)

# 5. Verify
npm run verify:userid-formats
# Should show numeric IDs again (back to original state)
```

---

## 📊 Migration Progress Tracking

### Real-time Monitoring

While migration is running, you can monitor:

```bash
# Watch Firestore operations
watch -n 5 'gcloud firestore operations list --project=salfagpt --limit=5'

# Check specific operation
gcloud firestore operations describe <operation-id> --project=salfagpt
```

### Log Files

The automated script creates detailed logs:
```bash
# Log file created automatically
migration-log-20251115_143022.txt

# View log
tail -f migration-log-*.txt

# Search for errors
grep ERROR migration-log-*.txt
```

---

## ⚠️ What Could Go Wrong & How to Recover

### Scenario 1: Backup Fails to Complete
**Symptoms:** Backup stuck in "PROCESSING" for > 15 minutes

**Recovery:**
```bash
# Cancel stuck operation
gcloud firestore operations cancel <operation-id> --project=salfagpt

# Try backup again
./scripts/create-firestore-backup.sh
```

---

### Scenario 2: Migration Script Errors
**Symptoms:** Migration script shows errors, some documents not migrated

**Recovery:**
```bash
# 1. Check what was migrated
npm run verify:userid-formats

# 2. If context_sources partially migrated:
#    - Some docs will have hash userId
#    - Some will still have numeric userId
#    - Platform still works (queries check both)

# 3. Re-run migration (idempotent - safe to run multiple times)
npm run migrate:userid -- --collection=context_sources --execute

# 4. If still failing, restore from backup
./scripts/restore-from-backup.sh <backup-path>
```

---

### Scenario 3: Platform Breaks After Migration
**Symptoms:** Agent context not loading, errors in console

**Recovery:**
```bash
# IMMEDIATE ROLLBACK
./scripts/restore-from-backup.sh <backup-path>

# Wait for restore (10-15 min)

# Verify platform working again
# Open http://localhost:3000/chat

# Report issue for investigation
```

---

### Scenario 4: Wrong Documents Migrated
**Symptoms:** Some users' documents have wrong userId

**Recovery:**
```bash
# Full restore (safest option)
./scripts/restore-from-backup.sh <backup-path>

# Wait for restore

# Investigate userid-mappings.ts
# Ensure correct Google ID → Hash ID mappings

# Re-run discovery
npm run discover:userid-mappings

# Verify mappings correct

# Re-run migration
```

---

## 🎯 Success Criteria

Migration is successful when ALL these are true:

### Automated Checks
- [ ] `npm run verify:userid-formats` shows 100% hash format
- [ ] No errors in migration logs
- [ ] All 4 collections migrated (1,011 documents total)

### Manual Tests
- [ ] Agent context modal shows correct document count
- [ ] Documents load when clicking "Cargar Documentos"
- [ ] RAG search finds chunks (check console logs)
- [ ] Feedback page shows all feedback items
- [ ] Prompt history shows all versions
- [ ] No console errors in browser

### User Experience
- [ ] Agent context loads in < 2 seconds
- [ ] Search returns relevant results
- [ ] No user complaints
- [ ] Platform feels responsive

---

## 📞 Support & Troubleshooting

### Check Migration Status
```bash
# See what's been migrated
npm run verify:userid-formats

# Check Firestore operations
gcloud firestore operations list --project=salfagpt

# View logs
cat migration-log-*.txt
```

### Common Issues

**Issue:** "googleUserId not found"
- **Cause:** User doesn't have googleUserId field
- **Fix:** User was created after hash migration, no fix needed

**Issue:** "Batch write failed"
- **Cause:** Firestore rate limit hit
- **Fix:** Script automatically retries, just wait

**Issue:** "Collection not found"
- **Cause:** Typo in collection name
- **Fix:** Check spelling, run verification script

---

## 🎉 Post-Migration Tasks

After successful migration:

### Immediate (Today)
- [ ] Monitor platform for 1 hour
- [ ] Test all critical paths
- [ ] Check for user complaints
- [ ] Update team on success

### This Week
- [ ] Remove googleUserId workarounds from code
- [ ] Add validation to prevent numeric userId writes
- [ ] Update documentation
- [ ] Deploy to production

### Next Week
- [ ] Code cleanup PR
- [ ] Add ESLint rules
- [ ] Add pre-commit hooks
- [ ] Close migration task

---

## 📚 Reference

### Created Scripts
- `scripts/create-firestore-backup.sh` - Create backup
- `scripts/verify-backup-complete.sh` - Check backup status
- `scripts/restore-from-backup.sh` - Emergency restore
- `scripts/safe-migration-executor.sh` - Automated migration

### Created Tools
- `scripts/verify-userid-formats.ts` - Audit collections
- `scripts/discover-userid-mappings.ts` - Generate mappings
- `scripts/migrate-userid-format.ts` - Execute migration

### Documentation
- `docs/USERID_MIGRATION_PLAN_2025-11-15.md` - Full strategy
- `docs/USERID_MIGRATION_CHECKLIST.md` - Detailed checklist
- `docs/USERID_MIGRATION_SUMMARY.md` - Current state
- `USERID_HASH_MIGRATION_COMPLETE_PLAN.md` - Executive summary
- `EXECUTE_MIGRATION_NOW.md` - This file

---

## ⚡ Execute Now

**Ready to start?**

### Automated (Recommended):
```bash
./scripts/safe-migration-executor.sh
```

### Manual (Full Control):
```bash
# 1. Backup
./scripts/create-firestore-backup.sh
./scripts/verify-backup-complete.sh

# 2. Migrate
npm run migrate:userid -- --collection=context_sources --execute
npm run migrate:userid -- --collection=agent_prompt_versions --execute
npm run migrate:userid -- --collection=message_feedback --execute
npm run migrate:userid -- --collection=feedback_tickets --execute

# 3. Verify
npm run verify:userid-formats
```

---

**Type your choice and let's execute! 🚀**
