# Firestore Index Required - Agent Context Modal

**Date:** 2025-10-22  
**Status:** ⚠️ **ACTION REQUIRED** - Manual index creation needed  
**Impact:** Agent context modal cannot load without this index

---

## 🚨 Error

```
9 FAILED_PRECONDITION: The query requires an index
```

**Query That Needs Index:**
```typescript
firestore
  .collection('context_sources')
  .where('assignedToAgents', 'array-contains', agentId)
  .orderBy('addedAt', 'desc')
```

---

## ✅ Solution: Create Composite Index

### Option 1: Click the Firebase Console Link (Easiest)

Firebase provided a direct link to create the index. **Click this link:**

```
https://console.firebase.google.com/v1/r/project/salfagpt/firestore/indexes?create_composite=ClBwcm9qZWN0cy9zYWxmYWdwdC9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvY29udGV4dF9zb3VyY2VzL2luZGV4ZXMvXxABGhQKEGFzc2lnbmVkVG9BZ2VudHMYARoLCgdhZGRlZEF0EAIaDAoIX19uYW1lX18QAg
```

**Then:**
1. Click "Create Index"
2. Wait 2-5 minutes for index to build
3. Refresh your chat app
4. Open M001 context modal
5. Should work! ✅

---

### Option 2: Manual Creation in Console

1. Go to: https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore/indexes

2. Click "Create Index"

3. Enter these values:
   - **Collection ID:** `context_sources`
   - **Fields:**
     - Field: `assignedToAgents`, Type: **Array contains**
     - Field: `addedAt`, Order: **Descending**

4. Click "Create"

5. Wait for "Building..." to change to "Enabled" (2-5 minutes)

---

### Option 3: Use gcloud CLI (If you have permissions)

```bash
gcloud firestore indexes composite create \
  --project=gen-lang-client-0986191192 \
  --database='(default)' \
  --collection-group=context_sources \
  --field-config field-path=assignedToAgents,array-config=contains \
  --field-config field-path=addedAt,order=descending
```

---

## 📋 Index Configuration (Already Added to firestore.indexes.json)

```json
{
  "collectionGroup": "context_sources",
  "queryScope": "COLLECTION",
  "fields": [
    {
      "fieldPath": "assignedToAgents",
      "arrayConfig": "CONTAINS"
    },
    {
      "fieldPath": "addedAt",
      "order": "DESCENDING"
    }
  ]
}
```

This has been added to `firestore.indexes.json` but needs to be deployed.

---

## ⏱️ How Long Will It Take?

**Index Creation Time:**
- Small dataset (<100 docs): ~30 seconds
- Medium dataset (100-1000 docs): ~2-3 minutes  
- Your dataset (539 docs): ~2-5 minutes

**Status Tracking:**
1. Go to: https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore/indexes
2. Find the new index (assignedToAgents + addedAt)
3. Status will show:
   - "Building..." → Wait
   - "Enabled" → Ready to use! ✅

---

## 🧪 After Index is Created

**Test the modal:**

1. Wait for index status to show "Enabled"
2. Refresh your chat app
3. Click ⚙️ on M001
4. **Expected:**
   - Modal opens instantly
   - Shows "538 documentos"
   - First 10 sources visible
   - "Cargar 10 más" button works
   - All toggles ON (auto-enabled)

---

## 🎯 Why This Index is Needed

**The Query:**
```typescript
// Find all sources assigned to agent M001
where('assignedToAgents', 'array-contains', 'cjn3bC0HrUYtHqu69CKS')
// AND sort by date added
.orderBy('addedAt', 'desc')
```

**Firestore Rule:**
> Any query that combines a field filter with ordering on a different field requires a composite index.

**Our Case:**
- Filter: `assignedToAgents` array-contains
- Order: `addedAt` descending
- = Composite index required ✅

---

## 📚 Related Indexes Already Created

Your `firestore.indexes.json` now includes:

1. ✅ `userId` + `addedAt` (for user's sources list)
2. ✅ `labels` + `addedAt` (for tag filtering)
3. ✅ `userId` + `labels` + `addedAt` (for user tag filtering)
4. ✅ **`assignedToAgents` + `addedAt`** (NEW - for agent context modal)

---

## 🚀 Next Steps

**IMMEDIATE (Required):**
1. Click the Firebase Console link above (or manually create index)
2. Wait 2-5 minutes for index to build
3. Verify index shows "Enabled"
4. Test modal

**AFTER INDEX IS READY:**
- Modal will open instantly (<1s)
- Shows 10 sources at a time
- All sources auto-enabled
- Bulk assignment workflow complete! ✅

---

**Please create the index using Option 1 (click the link) - it's the fastest way!**

The index link is in the error message you saw in console, or use the Firebase Console link above.

