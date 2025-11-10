# ✅ Post-Migration Testing Checklist

**Run this checklist AFTER migration + re-login**

---

## 🔐 Phase 1: Authentication (CRITICAL)

### Test 1.1: JWT Verification
```
1. DevTools → Application → Cookies → flow_session
2. Copy cookie value
3. Go to https://jwt.io
4. Decode

Expected ✅:
  {
    "id": "usr_<20_chars>",  ← Hash ID (not alec_get... or 114671...)
    "googleUserId": "114671162830729001607",
    "email": "alec@getaifactory.com",
    "domain": "getaifactory.com",
    "role": "admin",
    "roles": ["admin", "expert", "context_signoff", "agent_signoff"]
  }

❌ FAIL if:
  - id is still alec_getaifactory_com
  - id is still numeric
  - googleUserId missing
  - domain missing
```

### Test 1.2: Console Logs
```
Check console for:
  ✅ User authenticated: usr_<hash>...
  (NOT alec_get... or 114671...)
```

---

## 📝 Phase 2: Conversations (MOST IMPORTANT)

### Test 2.1: Load Conversations
```
Expected ✅:
  Console:
    📥 Cargando conversaciones desde Firestore...
    ✅ 10 conversaciones cargadas  ← YOUR NUMBER!
    📋 Agentes: 7
    📋 Chats: 3

  UI:
    Sidebar shows all conversations
    Grouped by time (Hoy, Ayer, etc.)

❌ FAIL if:
  - Still shows 0 conversations
  - Console shows "No hay conversaciones"
  - UI empty
```

### Test 2.2: Open Conversation
```
1. Click on any conversation
2. Messages should load
3. Can scroll through history

Expected ✅:
  - Conversation opens
  - Messages visible
  - No errors in console
```

### Test 2.3: Send Message
```
1. Type: "Test after migration"
2. Send
3. AI should respond

Expected ✅:
  - Message sent
  - AI responds
  - References work (if context active)
  - No errors
```

### Test 2.4: Create New Conversation
```
1. Click "+ Nuevo Agente"
2. New agent created

Expected ✅:
  - Agent appears in sidebar
  - Console: ✅ Conversación creada
  - Can send message in it
  
Check Firestore:
  New conversation has:
    userId: "usr_<your_hash>"  ← Hash ID! ✅
```

---

## 🤝 Phase 3: Agent Sharing

### Test 3.1: Load Shared Agents
```
Console should show:
  🔍 Loading shared agents for userId: usr_<hash>
  (NO "Resolving hash ID from email") ✅
  ✅ X shared agents loaded

Expected ✅:
  - Direct hash match
  - No extra queries
  - Faster than before (~150ms vs ~250ms)
```

### Test 3.2: Share Your Agent
```
1. Open an agent
2. Click "Compartir"
3. Select user
4. Click "Compartir Agente"

Expected ✅:
  - Share created
  - No errors
  
Check Firestore:
  Share document:
    ownerId: "usr_<your_hash>"  ← Hash!
    sharedWith: [{ id: "usr_<target_hash>", ... }]
```

### Test 3.3: Access Shared Agent (if you have one)
```
Expected ✅:
  - Shared agents appear in "Agentes Compartidos"
  - Can click and view
  - Can create chat from shared agent
  - Owner's context available
```

---

## 🔒 Phase 4: Security

### Test 4.1: Cross-User Access Block
```
Browser console:
  fetch('/api/conversations?userId=different_hash_id')
    .then(r => r.json())
    .then(console.log)

Expected ✅:
  403 Forbidden
  Error: "Cannot access other user data"
```

### Test 4.2: Own Data Access
```
Browser console:
  fetch('/api/conversations?userId=<your_hash_id>')
    .then(r => r.json())
    .then(console.log)

Expected ✅:
  200 OK
  Data: { groups: [...conversations...] }
```

---

## 📚 Phase 5: Context & References

### Test 5.1: Context Sources
```
1. Open agent with context sources
2. Check "Fuentes de Contexto" panel

Expected ✅:
  - Sources load
  - Can toggle on/off
  - Assigned to correct agents
```

### Test 5.2: Message References
```
1. Send message that uses context
2. Check AI response for [1], [2] badges

Expected ✅:
  - Reference badges appear
  - Can click to see chunk details
  - Similarity scores shown
```

---

## ⚡ Phase 6: Performance

### Test 6.1: Load Time
```
Browser console:
  console.time('loadConversations');
  // Refresh page
  console.timeEnd('loadConversations');

Expected ✅:
  Time: <300ms (should be fast)
```

### Test 6.2: Shared Agent Load
```
console.time('loadShared');
// Click shared agents section
console.timeEnd('loadShared');

Expected ✅:
  Time: ~150ms (was ~250ms)
  Improvement: 40% ✅
```

### Test 6.3: Console Logs
```
Expected ✅:
  NO "Resolving hash ID from email"
  NO extra getUserByEmail() calls
  Direct hash matching only
```

---

## 🎭 Phase 7: Admin Features

### Test 7.1: User Management
```
1. Click user menu → User Management
2. List loads

Expected ✅:
  - All users visible
  - All have hash IDs (usr_xxx)
  - Can view/edit users
```

### Test 7.2: Create New User
```
1. Click "Crear Usuario"
2. Fill form, create

Expected ✅:
  - User created with hash ID
  - Immediately shareable
  - No email-based ID
```

---

## 📊 Success Metrics

### Must Have (All Required)

- [ ] ✅ JWT has hash ID (usr_xxx)
- [ ] ✅ 10+ conversations visible (not 0!)
- [ ] ✅ All conversations accessible
- [ ] ✅ Can send messages
- [ ] ✅ Can create new conversations
- [ ] ✅ Shared agents work
- [ ] ✅ No console errors
- [ ] ✅ Performance improved

### Nice to Have

- [ ] ✅ Load time <200ms
- [ ] ✅ No email fallback logs
- [ ] ✅ All 9 agent shares working
- [ ] ✅ References render correctly

---

## 🚨 If Something Doesn't Work

### Issue: Still 0 conversations after re-login

**Check:**
1. Did you actually re-login? (not just refresh)
2. Check JWT - does it have hash ID?
3. Check console - what userId is being used in query?

**Fix:**
- Hard refresh: Cmd+Shift+R
- Clear all cookies
- Logout/login again

---

### Issue: Some conversations missing

**Check:**
1. Are they archived? (add includeArchived=true to query)
2. Check Firestore - do they have the new hash userId?
3. Check console logs for query results

---

### Issue: Shared agents not appearing

**Check:**
1. Do shares have your new hash ID?
2. Check console for matching logic
3. Verify share documents updated

---

## 🎯 Quick Verification (30 seconds)

**After re-login, check these 3 things:**

```
1. Browser Console:
   ✅ "10 conversaciones cargadas" (or your number)
   NOT "0 conversaciones"

2. Sidebar:
   ✅ Shows conversations in Agentes/Chats sections
   NOT empty

3. JWT (decoded):
   ✅ id: "usr_..."
   NOT "alec_get..." or "114671..."
```

**If all 3 are ✅ → Migration SUCCESS! 🎉**

---

## 📝 Final Report Template

After testing, fill this out:

```
POST-MIGRATION TEST RESULTS
═══════════════════════════════════════════════

Date: 2025-11-09
Tester: Alec
Account: alec@getaifactory.com

Authentication:
  [ ] JWT has hash ID
  [ ] Login works
  [ ] Logout works

Conversations:
  [ ] Total visible: ___ (was 0)
  [ ] Can open: ___
  [ ] Can send message: ___
  [ ] Can create new: ___

Sharing:
  [ ] Shared agents visible: ___
  [ ] Can share agent: ___
  [ ] Recipients can access: ___

Performance:
  [ ] Load time: ___ ms
  [ ] Improved from baseline: ___
  [ ] No email fallbacks: ___

Issues Found:
  [ ] None ✅
  [ ] List any issues:
      -
      -

Overall Status:
  [ ] ✅ PASS - Migration successful
  [ ] ⚠️  PARTIAL - Some issues
  [ ] ❌ FAIL - Rollback needed

Notes:
```

---

**Ready to test! Follow checklist after you run migration and re-login.** 🧪


