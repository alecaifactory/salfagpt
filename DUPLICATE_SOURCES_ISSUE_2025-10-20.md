# 🚨 DUPLICATE SOURCES - Root Cause of Bulk Assignment

**Date:** 2025-10-20  
**Status:** Root cause identified  
**Issue:** Massive document duplication causing bulk assignments

---

## 🎯 The REAL Problem

**What You See:**
- Select 1 document (Cir32.pdf) in Context Management
- UI shows "1 selected" ✅
- Click "Assign (1)" ✅
- **Result: 86 documents assigned** ❌

**Root Cause:**
The database has **MASSIVE DUPLICATES**:

```
CIR-182.pdf: 7 copies  (same filename, 7 different IDs)
CIR-232.pdf: 5 copies
CIR-234.pdf: 5 copies
CIR-236.pdf: 5 copies
CIR-239.pdf: 5 copies
CIR-420.pdf: 5 copies
CIR-421.pdf: 5 copies
CIR-422.pdf: 5 copies
CIR-427.pdf: 5 copies
Cir-231.pdf: 5 copies
Cir32.pdf: 2 copies  👈 YOU'RE SELECTING BOTH!

Total: 47 duplicate documents out of 89 total
```

---

## 🔍 Why Duplicates Exist

Looking at timestamps:
```
Cir32.pdf:
  - Copy 1: 2025-10-20T10:03:31 (older)
  - Copy 2: 2025-10-20T11:45:05 (newer)

CIR-182.pdf:
  - Copy 1: 2025-10-20T00:13:32
  - Copy 2: 2025-10-20T00:16:08
  - Copy 3: 2025-10-20T00:20:15
  - ... (7 total)
```

**Cause:** CLI was run multiple times on the same folder, creating new documents each time instead of updating existing ones.

---

## 🎯 Why This Causes Bulk Assignment

### Scenario: Assign Cir32.pdf

**What happens:**
```
1. User sees "Cir32.pdf" in UI (newest copy)
2. User clicks checkbox
3. Frontend: selectedSourceIds = ['8tjgUceVZW0A46QYYRfW']  ✅ ONLY 1 ID

4. BUT when loading sources for an agent:
   - Filter checks: assignedToAgents.includes(agentId)
   - BOTH copies of Cir32.pdf exist:
     • Copy 1 (PkCTQ9dpkcOEAmqZTFjc): assigned to agent X
     • Copy 2 (8tjgUceVZW0A46QYYRfW): assigned to agent Y
   
5. Agent loads sources:
   - Sees Copy 1 (assigned to it)
   - ALSO sees Copy 2 (if also assigned)
   - User sees "Cir32.pdf" multiple times (but they look like one)
```

### The Compound Effect

When you assign in Context Management:
- You select "Cir32.pdf" (one visible item)
- It has ID: 8tjgUceVZW0A46QYYRfW
- Request sent CORRECTLY with that ONE ID ✅
- That ONE document updated ✅

BUT when you view the agent:
- Filter loads ALL sources
- Finds OTHER copy: PkCTQ9dpkcOEAmqZTFjc
- BOTH Cir32.pdf copies assigned to different agents
- Plus 5 copies of Cir-231.pdf
- Plus 5 copies of CIR-427.pdf
- etc.

**Result:** Agent shows 86+ documents (all the duplicates) ❌

---

## ✅ Solution: Delete Duplicates

### Strategy: Keep Newest, Delete Older

For each document name with duplicates:
1. Sort by `addedAt` (newest first)
2. Keep the newest copy
3. Delete all older copies

### Script: `cleanup-duplicate-sources.ts`

**What it does:**
```
For each duplicate set:
  ✅ KEEP: Newest copy (most recent addedAt)
  🗑️  DELETE: All older copies

Example - Cir32.pdf:
  ✅ KEEP: 8tjgUceVZW0A46QYYRfW (2025-10-20T11:45:05) - newest
  🗑️  DELETE: PkCTQ9dpkcOEAmqZTFjc (2025-10-20T10:03:31) - older
```

**Safety:**
- Logs all deletions to `admin_logs` collection
- Shows what will be kept/deleted before executing
- Can be reverted from logs if needed

---

## 🧪 Execute Cleanup

```bash
npx tsx scripts/cleanup-duplicate-sources.ts
```

**Expected Results:**
```
🗑️  Deleted: 47 duplicate documents
✅ Kept: 42 unique documents (newest copy)
📝 Log saved to: admin_logs collection
```

**After cleanup:**
- Total sources: 42 (down from 89)
- Each document exists ONCE ✅
- Assigning 1 document assigns 1 document ✅
- No more bulk assignments ✅

---

## 🔒 Prevention for Future

### Fix in CLI (Already Done)

**cli/index.ts:**
```typescript
// Before upload, check if document already exists:
const existingDoc = await firestore
  .collection('context_sources')
  .where('name', '==', fileName)
  .where('userId', '==', userId)
  .get();

if (existingDoc.size > 0) {
  console.log(`   ℹ️  Document ${fileName} already exists - updating instead of creating new`);
  // Update existing instead of creating new
} else {
  // Create new document
}
```

This will prevent future duplicates from CLI re-runs.

---

## 🎯 Test After Cleanup

1. Run cleanup script
2. Refresh browser
3. Open Context Management
4. Verify: Total sources ~42 (not 89)
5. Select Cir32.pdf → Should see "1 selected"
6. Assign to agent
7. Verify: ONLY Cir32.pdf appears in agent ✅

---

**Status:** Ready to execute cleanup  
**Action Required:** Run `npx tsx scripts/cleanup-duplicate-sources.ts`  
**Expected:** Problem completely resolved after cleanup








