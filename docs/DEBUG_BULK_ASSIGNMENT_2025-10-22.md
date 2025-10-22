# Debug Guide: Bulk Assignment Issue

**Date:** 2025-10-22  
**Issue:** 538 sources assigned successfully, but agent modal shows "0 documentos asignados"

---

## 🔍 Diagnostic Steps

### Step 1: Check Server Logs During Assignment

**Action:** Try the bulk assignment again and watch the server logs carefully.

**Expected Console Output:**

```
🚀 BULK ASSIGN MULTIPLE:
   Sources: 538
   Source IDs (first 5): ["abc123", "def456", "ghi789", ...]
   Agents: 1
   Agent IDs: ["cjn3bC0HrUYtHqu69CKS"]  ⬅️ IMPORTANT: Agent ID
   Total assignments: 538

📦 Created 2 batch(es) for 538 sources

✅ BULK ASSIGN COMPLETE:
   Sources updated: 538
   Agents assigned: 1
   Batch operations: 2
   Batch time: 1234 ms
   Total time: 2300 ms
   Avg per source: 4 ms

🔍 VERIFICATION - Sample document after update:
   ID: abc123
   Name: DDU-398-con-numero-Modificada-por-DDU-440-AVC.pdf
   assignedToAgents: ["cjn3bC0HrUYtHqu69CKS"]  ⬅️ VERIFY: Should match Agent IDs above
   Expected agentIds: ["cjn3bC0HrUYtHqu69CKS"]
   Match: true  ⬅️ Should be true
```

**What to Check:**
1. ✅ Agent IDs array has the correct agent ID
2. ✅ Sample document's `assignedToAgents` matches
3. ✅ Match is `true`

**If Match is FALSE:** 
- 🚨 The array-contains query won't work
- Issue is in how agentIds are being passed/stored

---

### Step 2: Check Agent Modal Loading

**Action:** After assignment, open M001's context configuration modal.

**Expected Console Output:**

```
🔄 Agent context modal opened - refreshing context sources...

📥 Loading context sources for conversation: cjn3bC0HrUYtHqu69CKS

📄 Loading context sources for agent cjn3bC0HrUYtHqu69CKS: page 0, limit 10
   Query: assignedToAgents array-contains cjn3bC0HrUYtHqu69CKS  ⬅️ Query being run

📊 Total sources for agent cjn3bC0HrUYtHqu69CKS: 538  ⬅️ Should show 538
   Sample source: DDU-398-con-numero-Modificada-por-DDU-440-AVC.pdf
   assignedToAgents: ["cjn3bC0HrUYtHqu69CKS"]
   agentId in array: true  ⬅️ Should be true

✅ Agent cjn3bC0HrUYtHqu69CKS: Returned 10 sources (page 0) in 123ms

✅ Context sources loaded for agent
```

**What to Check:**
1. ✅ Total count shows 538
2. ✅ `agentId in array` is `true`
3. ✅ Sample source has the correct agentId in `assignedToAgents`

**If Total is 0:**
- 🚨 The query isn't finding the documents
- Possible issues:
  - Agent ID mismatch (different format)
  - assignedToAgents field structure wrong
  - Data not actually saved

---

### Step 3: Manual Firestore Check

**If above fails, manually check Firestore Console:**

1. Open Firestore Console: https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore/data
2. Navigate to `context_sources` collection
3. Find one of your M001 documents (e.g., "DDU-398...")
4. Check the `assignedToAgents` field

**Expected Structure:**
```json
{
  "assignedToAgents": ["cjn3bC0HrUYtHqu69CKS"],
  "name": "DDU-398-con-numero-Modificada-por-DDU-440-AVC.pdf",
  "labels": ["M001"],
  "userId": "114671162830729001607"
}
```

**What to Verify:**
- ✅ `assignedToAgents` is an **array**
- ✅ Array contains the agent ID string
- ✅ Agent ID matches what's shown in agent modal header

---

## 🐛 Potential Issues & Solutions

### Issue A: Agent ID Format Mismatch

**Symptom:** Assignment saves but query doesn't find it

**Diagnosis:**
```javascript
// In bulk assignment logs:
Agent IDs: ["abc123"]

// In agent modal logs:
Query: array-contains xyz789  // Different ID!
```

**Solution:** The agent ID being used for assignment is different from the one being queried. Check:
- Is the checkbox using `agent.id`?
- Is the modal using the same `agent.id`?

---

### Issue B: assignedToAgents Not an Array

**Symptom:** Data saved as string instead of array

**Diagnosis in Firestore:**
```json
// ❌ WRONG:
{
  "assignedToAgents": "abc123"  // String, not array!
}

// ✅ CORRECT:
{
  "assignedToAgents": ["abc123"]  // Array
}
```

**Solution:** The bulk assignment API already wraps in array (line 76), but verify in logs.

---

### Issue C: Stale Cache in Frontend

**Symptom:** Assignment works, but UI doesn't update

**Diagnosis:**
- Backend logs show correct assignment
- Firestore shows correct data
- Frontend shows old data

**Solution:** The useEffect refresh should fix this. Verify it's running:
```javascript
🔄 Agent context modal opened - refreshing context sources...
```

If not showing, the useEffect might not be triggering.

---

## 🔧 Additional Logging to Add

If issue persists, add this to `ChatInterfaceWorking.tsx` around line 532:

```typescript
const loadContextForConversation = async (conversationId: string, skipRAGVerification = false) => {
  console.log('🔄 Loading context for conversation:', conversationId); // ADD THIS
  
  try {
    // ... existing code
    
    // After filtering
    console.log('📊 Filtered sources for agent:', {  // ADD THIS
      total: filteredSources.length,
      assigned: filteredSources.filter(s => s.assignedToAgents?.includes(conversationId)).length,
      public: filteredSources.filter(s => s.labels?.includes('PUBLIC')).length,
    });
    
    setContextSources(filteredSources);
  }
};
```

---

## 📋 Complete Diagnosis Checklist

Run these checks in order:

- [ ] **Bulk assignment logs show:**
  - [ ] Correct agent ID in `Agent IDs:` array
  - [ ] Sample verification shows `Match: true`
  - [ ] All 538 sources updated

- [ ] **Agent modal opening logs show:**
  - [ ] `🔄 Agent context modal opened - refreshing...`
  - [ ] Agent API returns total count: 538
  - [ ] Sample source verification shows `agentId in array: true`

- [ ] **Firestore Console shows:**
  - [ ] `assignedToAgents` is an array
  - [ ] Array contains correct agent ID
  - [ ] At least 538 documents have this

- [ ] **Frontend state shows:**
  - [ ] `contextSources` has 538 items
  - [ ] Each has `assignedToAgents` containing agent ID
  - [ ] Filter works: `s.assignedToAgents?.includes(agentId)` returns true

---

## 🎯 Next Steps

1. **Refresh browser completely** (Cmd+Shift+R to clear cache)
2. **Open DevTools Console** (Cmd+Option+I)
3. **Try assignment again:**
   - Select All in M001 folder
   - Assign to M001
   - Watch console logs carefully
4. **Open agent modal:**
   - Click ⚙️ on M001
   - Watch console logs
5. **Report back:** Copy the console logs here

---

The enhanced logging will help us pinpoint exactly where the data flow breaks.

**Ready to debug!** Try the assignment again and let me know what the console logs show.

