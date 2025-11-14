# 🧪 Shared Agent Context - Comprehensive Test Plan

**Date:** November 14, 2025, 11:45 AM PST  
**Fix Applied:** `getEffectiveOwnerForContext` in GREEN BigQuery  
**Purpose:** Verify shared agents work for ALL users

---

## 🎯 **What Was Fixed**

### **The Bug:**
```
Shared agent queries used CURRENT user's userId
  ↓
But context sources owned by AGENT OWNER
  ↓
userId mismatch → 0 results
  ↓
"No encontramos el documento que buscabas"
```

### **The Fix:**
```
Use getEffectiveOwnerForContext(agentId, currentUserId)
  ↓
Returns AGENT OWNER's userId (for shared agents)
  ↓
Queries with OWNER's userId → finds context!
  ↓
Shared agents work ✅
```

---

## 📋 **Test Scenarios to Verify**

### **Scenario 1: Owner Uses Own Agent**

| Aspect | Value | Expected |
|--------|-------|----------|
| **User** | alec@getaifactory.com | SuperAdmin |
| **Agent** | GOP GPT (M003) | Owned by alec@ |
| **Context Owner** | alec@getaifactory.com | Same as user |
| **getEffectiveOwner** | usr_uhwqffaqag1wrryd82tw | Returns owner |
| **Sources Found** | 28 M3 sources | ✅ Should work |
| **Result** | Relevant documents | ✅ Should work |

**Test:**
```
1. Login as alec@getaifactory.com
2. Select GOP GPT (M003)
3. Ask: "¿Qué procedimientos están asociados al plan de calidad?"
4. Expected: Finds 28 sources, returns references
```

---

### **Scenario 2: Shared User Accesses Owner's Agent** ⭐ **Your Bug Report**

| Aspect | Value | Expected |
|--------|-------|----------|
| **User** | alecdickinson@gmail.com | User (shared) |
| **Agent** | GOP GPT (M003) | Owned by alec@ |
| **Context Owner** | alec@getaifactory.com | Different from user! |
| **getEffectiveOwner** | usr_uhwqffaqag1wrryd82tw | ✅ Returns OWNER (not current user) |
| **Sources Found** | 28 M3 sources | ✅ **SHOULD WORK NOW** |
| **Result** | Same as owner | ✅ **FIXED!** |

**Test:**
```
1. Login as alecdickinson@gmail.com (incognito window)
2. Select GOP GPT (M003) (shared agent)
3. Ask: Same question
4. Expected: NOW finds 28 sources (was 0 before!)
5. Console: "Effective owner: usr_uhwq... (shared agent)"
```

---

### **Scenario 3: Multiple Users Access Same Shared Agent**

**Test with these users (all should work identically):**

| User Email | Role | Agent | Expected Result |
|------------|------|-------|-----------------|
| sorellanac@salfagestion.cl | Admin | M003 (shared) | ✅ Finds 28 sources |
| jriverof@iaconcagua.com | User | M003 (shared) | ✅ Finds 28 sources |
| msgarcia@maqsa.cl | User | M003 (shared) | ✅ Finds 28 sources |
| cvillalon@maqsa.cl | User | M003 (shared) | ✅ Finds 28 sources |

**All should see:** Same context, same references, same quality

---

### **Scenario 4: User Accesses Own Agent (Non-Shared)**

| User | Agent | Owner | Expected |
|------|-------|-------|----------|
| alecdickinson@gmail.com | Own agent | alecdickinson@ | ✅ Uses own userId |
| | (if has uploaded docs) | Same as user | ✅ Finds own context |

---

### **Scenario 5: S001 Agent (GESTION BODEGAS)**

**Owner Test:**
```
User: alec@getaifactory.com
Agent: GESTION BODEGAS GPT (S001)
Owner: alec@ (same)
Sources: 76 S001 sources
Expected: ✅ Finds all 76
```

**Shared User Test:**
```
User: alecdickinson@gmail.com
Agent: GESTION BODEGAS GPT (S001) (if shared)
Owner: alec@ (different)
Sources: 76 S001 sources (owned by alec@)
Expected: ✅ NOW finds all 76 (was 0 before!)
```

---

## 🔍 **How to Test Each Scenario**

### **Test Matrix:**

```bash
# Test 1: Owner → Own Agent (baseline)
Browser 1 (normal):
  Login: alec@getaifactory.com
  Agent: GOP GPT (M003)
  Query: "¿Qué procedimientos calidad?"
  Check: Console shows "Effective owner: usr_uhwq... (own agent)"
  Verify: Finds 28 sources, gets response

# Test 2: Shared User → Owner's Agent (your bug)
Browser 2 (incognito):
  Login: alecdickinson@gmail.com
  Agent: GOP GPT (M003)
  Query: Same
  Check: Console shows "Effective owner: usr_uhwq... (shared agent)"
  Verify: Finds 28 sources, gets response ✅ FIX

# Test 3: Different Shared User
Browser 3 (incognito/different):
  Login: sorellanac@salfagestion.cl
  Agent: GOP GPT (M003)
  Query: Same
  Verify: Also finds 28 sources ✅

# Test 4: S001 Agent
Browser 1:
  Login: alec@getaifactory.com
  Agent: GESTION BODEGAS GPT (S001)
  Query: "¿Procedimiento inventario MB52?"
  Verify: Finds 76 sources

Browser 2:
  Login: alecdickinson@gmail.com  
  Agent: GESTION BODEGAS GPT (S001) (if shared)
  Query: Same
  Verify: Also finds 76 sources ✅
```

---

## ✅ **Expected Console Logs**

### **Owner (alec@):**
```
🔍 [OPTIMIZED] BigQuery Vector Search starting...
  Current User: usr_uhwqffaqag1wrryd82tw
  Agent: [M003_agent_id]
  
  🔑 Effective owner for context: usr_uhwqffaqag1wrryd82tw (own agent)
     Current user ID: usr_uhwqffaqag1wrryd82tw
  
  [2/4] Loading sources assigned to agent...
  🔍 Searching for sources owned by: usr_uhwqffaqag1wrryd82tw
  ✓ Found 28 sources for agent owner
  
  [3/4] Executing BigQuery vector search...
  🔑 Query params: ownerUserId=usr_uhwq..., sourceIds=28
  ✓ Search complete (450ms)
  ✓ Found 8 chunks
  
✅ [OPTIMIZED] Search complete (1,550ms)
```

### **Shared User (alecdickinson@):**
```
🔍 [OPTIMIZED] BigQuery Vector Search starting...
  Current User: usr_l1fiahiqkuj9i39miwib (alecdickinson@)
  Agent: [M003_agent_id]
  
  🔑 Effective owner for context: usr_uhwqffaqag1wrryd82tw (shared agent - using owner userId) ✅
     Current user ID: usr_l1fiahiqkuj9i39miwib
  
  [2/4] Loading sources assigned to agent...
  🔍 Searching for sources owned by: usr_uhwqffaqag1wrryd82tw ✅ (OWNER'S ID!)
  ✓ Found 28 sources for agent owner ✅ (FIXED!)
  
  [3/4] Executing BigQuery vector search...
  🔑 Query params: ownerUserId=usr_uhwq..., sourceIds=28 (SHARED AGENT) ✅
  ✓ Search complete (450ms)
  ✓ Found 8 chunks ✅
  
✅ [OPTIMIZED] Search complete (1,550ms)
  Same results as owner! ✅
```

**Key difference:** Current user != Effective owner (uses owner's ID for context)

---

## 🎯 **What to Look For**

### **✅ Success Indicators:**

**In Console:**
- ✅ "Effective owner: usr_uhwq... (shared agent)"
- ✅ "Found 28 sources for agent owner"
- ✅ "Search complete (450ms)"
- ✅ "Found 8 chunks"
- ✅ No "No sources assigned" warning

**In UI:**
- ✅ Response appears in <8s
- ✅ References shown with real similarity (70-95%)
- ✅ Same quality as owner gets
- ✅ No "no encontramos el documento" message

### **❌ Failure Indicators:**

- ❌ "Found 0 sources"
- ❌ "No sources assigned to agent"
- ❌ "No encontramos el documento"
- ❌ userId mismatch error
- ❌ Different results than owner

---

## 📊 **User Coverage Test**

### **Test with these users (sample from 50 total):**

| User | Email | Role | Should Access M003? |
|------|-------|------|---------------------|
| **Owner** | alec@getaifactory.com | SuperAdmin | ✅ Yes (owns it) |
| **User 1** | alecdickinson@gmail.com | User | ✅ Yes (if shared) |
| **Admin** | sorellanac@salfagestion.cl | Admin | ✅ Yes (if shared) |
| **User 2** | msgarcia@maqsa.cl | User | ✅ Yes (if shared) |
| **User 3** | cvillalon@maqsa.cl | User | ✅ Yes (if shared) |

**All should see same M3 documents (28 sources) if agent is shared with them.**

---

## 🚀 **Test Now**

### **Quick Validation:**

```bash
# Test as owner (confirm still works)
Browser 1: http://localhost:3000
  Login: alec@getaifactory.com
  Agent: GOP GPT (M003)
  Test: Ask question
  Check: Finds 28 sources ✅

# Test as shared user (confirm fix works)
Browser 2 (incognito): http://localhost:3000
  Login: alecdickinson@gmail.com
  Agent: GOP GPT (M003)
  Test: Same question
  Check: NOW finds 28 sources ✅ (was 0 before!)
```

---

## 📋 **Verification Checklist**

```
Shared Agent Context Fix:
├─ [ ] Code uses getEffectiveOwnerForContext ✅
├─ [ ] Owner test: Finds documents (baseline)
├─ [ ] Shared user test: Finds same documents (fix validation)
├─ [ ] Console logs show "shared agent" marker
├─ [ ] Console logs show owner's userId (not current)
├─ [ ] Both get same similarity scores
├─ [ ] Both get same response quality
└─ [ ] No "no encontramos" messages

Multi-User Coverage:
├─ [ ] Test with 2-3 different shared users
├─ [ ] All get same results
├─ [ ] No userId mismatch errors
└─ [ ] Consistent performance

Different Agents:
├─ [ ] M003 (GOP GPT) - ✅ Your test case
├─ [ ] S001 (GESTION BODEGAS) - 76 sources
├─ [ ] M001 agents - 538 sources
├─ [ ] SSOMA agents - 89 sources
└─ [ ] All work for shared users
```

---

## 🎯 **Expected Outcome**

### **After Testing All Scenarios:**

**✅ Owner users:** Continue to work (no regression)  
**✅ Shared users:** NOW work (bug fixed!)  
**✅ All 50 users:** Can access shared agents' context  
**✅ All 11 tags:** Work regardless of who accesses  
**✅ Multi-org:** Works across @maqsa, @salfagestion, @iaconcagua, etc.

---

## 💬 **What to Do**

**Test yourself:**
1. Open browser with alec@
2. Open incognito with alecdickinson@
3. Both access M003 agent
4. Ask same question
5. Compare results (should be identical now!)

**Or tell me:**
- "Test it for me" → I'll create automated test
- "Looks good" → I'll document as complete
- "Test more users" → I'll expand test coverage

**The fix is universal - it uses `getEffectiveOwnerForContext` which already handles all sharing scenarios (user-to-user, group-based, domain-wide, email-based fallback).** 

**Ready to validate!** 🎯✨

