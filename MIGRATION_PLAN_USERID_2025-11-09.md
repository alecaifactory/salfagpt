# 🔄 User ID Migration Plan - Email-Based → Hash-Based

**Date:** 2025-11-09  
**Status:** Ready to execute  
**Impact:** ALL users will get new hash-based IDs  

---

## 🎯 What Will Be Migrated

### Users Affected

**All users with email-based document IDs:**
- Format: `alec_getaifactory_com`, `user_company_com`
- Contains: `_` from email conversion
- NOT starting with: `usr_`

**Will be converted to:**
- Format: `usr_<20_random_chars>`
- Example: `usr_k3n9x2m4p8q1w5z7y0`

---

## 📊 What Gets Updated

### 1. Users Collection ✅

```
BEFORE:
  Document ID: alec_getaifactory_com
  Fields: { email, name, role, ... }

AFTER:
  Document ID: usr_k3n9x2m4p8q1w5z7y0
  Fields: { 
    email, name, role, ...,
    _migratedFrom: "alec_getaifactory_com",
    _migratedAt: "2025-11-09T00:00:00Z"
  }
  
Old document: DELETED
```

### 2. Conversations Collection ✅

```
BEFORE:
  WHERE userId == "alec_getaifactory_com"
  Found: X conversations

AFTER:
  Each conversation updated:
  {
    userId: "usr_k3n9x2m4p8q1w5z7y0",  ← NEW!
    _userIdMigrated: true,
    _originalUserId: "alec_getaifactory_com"
  }
```

### 3. Messages Collection ✅

```
BEFORE:
  WHERE userId == "alec_getaifactory_com"
  Found: Y messages

AFTER:
  Each message updated:
  {
    userId: "usr_k3n9x2m4p8q1w5z7y0",  ← NEW!
    _userIdMigrated: true
  }
```

### 4. Agent Shares Collection ✅

```
BEFORE:
  ownerId: "alec_getaifactory_com"
  sharedWith: [{ type: 'user', id: 'alec_getaifactory_com' }]

AFTER:
  ownerId: "usr_k3n9x2m4p8q1w5z7y0"  ← NEW!
  sharedWith: [{ 
    type: 'user', 
    id: 'usr_k3n9x2m4p8q1w5z7y0',  ← NEW!
    email: 'alec@getaifactory.com',
    _migratedFrom: 'alec_getaifactory_com'
  }]
```

### 5. Groups Collection ✅

```
BEFORE:
  members: ["alec_getaifactory_com", "user2_company_com"]

AFTER:
  members: ["usr_k3n9x2m4p8q1w5z7y0", "usr_xyz789..."]  ← ALL NEW!
```

---

## 🚀 Migration Steps

### Step 1: DRY RUN (Preview Changes)

```bash
npm run migrate:user-ids
```

**This will:**
- ✅ Scan all users
- ✅ Identify email-based IDs
- ✅ Show what would be migrated
- ✅ Count conversations/messages/shares
- ❌ NOT modify any data

**Expected output:**
```
🔄 USER ID MIGRATION TO HASH-BASED IDS

Mode: 🔍 DRY RUN (no changes)

1️⃣  Loading all users...
   Found: 50 users

   📧 Email-based ID found: alec_getaifactory_com (alec@getaifactory.com)
   📧 Email-based ID found: user_company_com (user@company.com)
   ...

2️⃣  Users needing migration: 10

─────────────────────────────────────────────────
📝 Migrating: alec@getaifactory.com
   Old ID: alec_getaifactory_com
   New ID: usr_k3n9x2m4p8q1w5z7y0
   
   📂 Updating conversations...
      Found: 25 conversations
      🔍 [DRY RUN] Would update 25 conversations
         - Agent M001 (abc123)
         - Agent S001 (def456)
         - My Test Chat (ghi789)
   
   💬 Updating messages...
      Found: 150 messages
      🔍 [DRY RUN] Would update 150 messages
   
   🤝 Updating agent shares...
      Found: 5 shares owned by user
      🔍 [DRY RUN] Would update ownerId in 5 shares
      Found user in 3 share sharedWith arrays
   
   👥 Updating groups...
      Found user in 2 groups
      🔍 [DRY RUN] Would update 2 groups
   
   🔍 [DRY RUN] Would delete old user document: alec_getaifactory_com

✅ Migration complete for alec@getaifactory.com
   alec_getaifactory_com → usr_k3n9x2m4p8q1w5z7y0

[... repeat for each user ...]

═══════════════════════════════════════════════════
MIGRATION COMPLETE
═══════════════════════════════════════════════════

📊 Statistics:
   Users checked: 50
   Users to migrate: 10
   Conversations updated: 125 (would be)
   Messages updated: 750 (would be)
   Shares updated: 35 (would be)
   Groups updated: 8 (would be)
   Errors: 0

💡 This was a DRY RUN - no data was modified
💡 Run with --execute flag to perform actual migration:
   npm run migrate:user-ids:execute
```

---

### Step 2: Review DRY RUN Output

**Check:**
- [ ] User count matches expectations
- [ ] Conversation count seems right
- [ ] Message count seems right
- [ ] No unexpected users in list
- [ ] No errors

**If anything looks wrong, STOP and investigate!**

---

### Step 3: EXECUTE Migration

**⚠️ WARNING: This modifies data! Make sure backup exists!**

```bash
# Verify backup exists
git worktree list | grep backup-20251108

# Should show:
# /Users/alec/.cursor/worktrees/salfagpt/backup-20251108-210520

# Execute migration
npm run migrate:user-ids:execute
```

**This will:**
- ✅ Actually modify Firestore data
- ✅ Update all collections
- ✅ Delete old user documents
- ✅ Create new hash-based user documents

**Expected time:** 1-5 minutes depending on data volume

---

### Step 4: Verify Migration

**Check Firestore Console:**
```
1. Users collection:
   - Old IDs (alec_getaifactory_com) should be GONE
   - New IDs (usr_xxx) should exist
   
2. Conversations:
   - userId fields should be hash IDs
   - All conversations still exist
   
3. Messages:
   - userId fields should be hash IDs
   - All messages still exist
```

---

### Step 5: Users Must Re-Login

**CRITICAL:** After migration, all users MUST logout and login again!

**Why:**
- Old JWT has old user ID
- New JWT will have new hash ID
- Must refresh session to get new ID

**Process:**
1. Logout from /chat
2. Login again
3. JWT will now have hash ID ✅
4. Everything works!

---

## 🚨 Safety & Rollback

### Before Migration

**Ensure backup exists:**
```bash
git worktree list | grep backup
# Should show backup worktree

git tag | grep backup
# Should show backup-20251108-210520
```

### During Migration

**What's protected:**
- ✅ Script has try-catch on each user
- ✅ One user failing doesn't stop others
- ✅ All errors logged
- ✅ Batch commits (500 at a time)

### After Migration (If Issues)

**Rollback via Firestore:**
1. Go to Firestore Console
2. Look for users with `_migratedFrom` field
3. These are the new documents
4. Can manually revert if needed

**Rollback via Git (code only):**
```bash
git reset --hard backup-20251108-210520
npm run dev
# BUT: Data in Firestore already changed!
```

**Better: Restore from Firestore backup** (if configured)

---

## 📋 Pre-Migration Checklist

**Before running migration:**

- [ ] ✅ Backup worktree created (backup-20251108-210520)
- [ ] ✅ Backup tag created  
- [ ] ✅ JWT fix implemented (auth/callback.ts)
- [ ] ✅ generateUserId exported from firestore.ts
- [ ] ✅ Migration script created (scripts/migrate-users-to-hash-ids.mjs)
- [ ] ✅ npm script added (migrate:user-ids)
- [ ] ⏳ DRY RUN completed (about to do)
- [ ] ⏸️ DRY RUN reviewed (pending)
- [ ] ⏸️ EXECUTE approved (pending)
- [ ] ⏸️ Users notified they must re-login (after migration)

---

## 🎯 Expected Results After Migration

### For alec@getaifactory.com

**BEFORE:**
```
User: alec_getaifactory_com
Conversations: 0 visible (mismatch)
Shared agents: 0 visible
```

**AFTER:**
```
User: usr_<new_hash>
Conversations: ALL visible ✅
Shared agents: ALL visible ✅
Must re-login to get new JWT!
```

### For All Users

**BEFORE:**
```
Mixed ID types:
- Email-based: alec_getaifactory_com
- Numeric: 114671162830729001607  
- Hash: usr_abc123 (only new users)

Result: Complex matching, slow queries
```

**AFTER:**
```
Unified ID type:
- Hash only: usr_<random>

Result: Simple matching, fast queries, consistent
```

---

## 🔢 Migration Statistics (Estimated)

Based on typical deployment:

```
Users to migrate: ~10-50
Conversations: ~100-500
Messages: ~1000-5000
Shares: ~10-50
Groups: ~5-20

Total documents updated: ~1100-5570
Time: 1-5 minutes
```

---

## ✅ Post-Migration Verification

### Automated Checks

```bash
# After migration, run:
npm run migrate:user-ids
# Should show: "No users need migration! All users already have hash IDs."
```

### Manual Checks

**Firestore Console:**
- [ ] users collection: All IDs start with `usr_`
- [ ] conversations: All userId fields are hash IDs
- [ ] messages: All userId fields are hash IDs
- [ ] agent_shares: All IDs in sharedWith are hash IDs

**Application:**
- [ ] Re-login works
- [ ] JWT has hash ID
- [ ] All conversations visible
- [ ] All shared agents visible
- [ ] Can create new conversations
- [ ] Can send messages
- [ ] Performance improved

---

## 🎓 What This Achieves

### Before Migration
```
User Types:
  10 users: Email-based IDs (alec_getaifactory_com)
  5 users: Numeric IDs (114671...)
  35 users: Hash IDs (usr_abc123)
  
  Total: 50 users with 3 different ID formats ⚠️
  
Problems:
  - Complex queries
  - Multiple fallbacks
  - Slow performance
  - Hard to debug
```

### After Migration
```
User Types:
  50 users: Hash IDs (usr_xxx) only ✅
  
  Total: 50 users with 1 consistent ID format
  
Benefits:
  - Simple queries
  - Direct matching
  - Fast performance
  - Easy to understand
```

---

## 🚀 READY TO EXECUTE

**Commands:**

```bash
# 1. DRY RUN (preview - do this now!)
npm run migrate:user-ids

# 2. Review output carefully

# 3. If all looks good, EXECUTE
npm run migrate:user-ids:execute

# 4. Verify in Firestore Console

# 5. Notify all users to re-login

# 6. Test with your account:
#    - Logout
#    - Login
#    - Check JWT has hash ID
#    - Check conversations appear
```

---

## 📞 Support

**If issues during migration:**
1. Check console output for specific error
2. Note which user failed
3. Migration continues for other users
4. Can fix individual users manually

**If need to stop migration:**
- CTRL+C to stop script
- Already migrated users will have new IDs
- Unmigrated users keep old IDs
- Can resume later (script is idempotent)

---

**Ready to run! Start with DRY RUN to see what will happen.** 🎯

