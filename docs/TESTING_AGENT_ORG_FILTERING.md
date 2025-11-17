# Testing Instructions: Agent Management Organization Filtering

**Feature:** Multi-organization agent filtering  
**Date:** 2025-11-11  
**Status:** Ready for testing

---

## ✅ Pre-Test Checklist

- [x] Code changes complete
- [x] TypeScript compiles (no errors in our files)
- [x] Automated tests pass
- [x] Dev server running on localhost:3000
- [ ] Browser testing (pending)

---

## 🧪 Manual Testing Steps

### Test 1: SuperAdmin Access ⭐

**Login as:** alec@getaifactory.com (SuperAdmin)

**Steps:**
1. Navigate to http://localhost:3000/chat
2. Login with SuperAdmin credentials
3. Click on **"Gestión de Agentes"** button (from user menu or toolbar)
4. Wait for agents to load

**Expected Results:**
```
✅ See "Cargando agentes..." then agent list
✅ Agent count > your own agent count (should be system-wide)
✅ See agents from multiple users
✅ See purple "Salfa Corp" badges (or other org names)
✅ See "Propietario: Sebastian Orellana" or other user names
✅ Different owners for different agents
```

**Console Logs to Check:**
```
📊 Loading agent metrics for user: usr_uhwqffaqag1wrryd82tw role: superadmin
🔓 SuperAdmin access: Loading ALL agents from ALL users
📊 SuperAdmin: Found X total conversations, Y agents
```

**Screenshot Checklist:**
- [ ] Agent list loads
- [ ] Multiple organization badges visible
- [ ] Owner names visible
- [ ] Total agent count is system-wide

---

### Test 2: Admin Access (Salfa Corp) ⭐

**Login as:** sorellanac@salfagestion.cl (Salfa Corp Admin)

**Steps:**
1. Navigate to http://localhost:3000/chat
2. Login with Admin credentials
3. Click on **"Gestión de Agentes"**
4. Wait for agents to load

**Expected Results:**
```
✅ See agents from Salfa Corp users only
✅ Agent count = 11 (or org total, not system-wide)
✅ All badges say "Salfa Corp"
✅ See different owner names (Salfa colleagues)
✅ Cannot see agents from other organizations
```

**Console Logs to Check:**
```
📊 Loading agent metrics for user: usr_le7d1qco5iq07sy8yykg role: admin
🔐 Admin access: Loading agents for organization
  User organizations: ['salfa-corp']
📊 Getting users from 1 organizations: ['salfa-corp']
✅ Found 37 unique users across 1 organizations
  Loaded 11 agents from 37 org users
```

**Screenshot Checklist:**
- [ ] Agent count = organization total (~11)
- [ ] All badges say "Salfa Corp"
- [ ] Owner names are Salfa colleagues
- [ ] No agents from other orgs

---

### Test 3: Regular User Access

**Login as:** Any user with role 'user' (e.g., ireygadas@iaconcagua.com)

**Steps:**
1. Navigate to http://localhost:3000/chat
2. Login with user credentials
3. Click on **"Gestión de Agentes"**
4. Wait for agents to load

**Expected Results:**
```
✅ See only your own agents
✅ NO organization badges visible
✅ NO owner information visible
✅ Agent count = your own agent count
✅ Behavior unchanged from before
```

**Console Logs to Check:**
```
📊 Loading agent metrics for user: usr_xyz123 role: user
🔒 User access: Loading only own agents
📊 Found X total, Y agents
```

**Screenshot Checklist:**
- [ ] Agent count matches own agents
- [ ] NO purple organization badges
- [ ] NO owner information line
- [ ] Same experience as before

---

## 🔍 What to Look For

### Success Indicators

**✅ For SuperAdmin:**
- Agent count significantly higher than own count
- Multiple different organizations visible
- Different owner emails across agents
- Can expand any agent details

**✅ For Admin:**
- Agent count = organization agent count
- All same organization name in badges
- Owner names are colleagues
- Cannot see other org agents

**✅ For Regular User:**
- Agent count = own agent count
- Clean UI without org metadata
- Familiar experience

---

### Red Flags 🚩

**❌ SuperAdmin Issues:**
- Agent count same as own count
- No organization badges visible
- No owner information visible
- Console shows "User access" instead of "SuperAdmin access"

**❌ Admin Issues:**
- Agent count = 0 (but org has agents)
- Sees agents from other organizations
- Console shows "No org assigned"
- Organization badges missing

**❌ User Issues:**
- Sees other users' agents
- Organization badges clutter UI
- Owner information confusing

---

## 🐛 Debugging

### Check Browser Console

**Look for these log patterns:**

**SuperAdmin:**
```
🔓 SuperAdmin access: Loading ALL agents from ALL users
📊 SuperAdmin: Found 234 total conversations, 47 agents
```

**Admin:**
```
🔐 Admin access: Loading agents for organization
  User organizations: ['salfa-corp']
📊 Getting users from 1 organizations: ['salfa-corp']
✅ Found 37 unique users across 1 organizations
  Loaded 11 agents from 37 org users
```

**User:**
```
🔒 User access: Loading only own agents
📊 Found 5 total, 3 agents
```

---

### Common Issues

**Issue 1: "No org assigned" for Admin**
```
Symptom: Admin user sees no agents
Console: "No org assigned - showing only own agents"

Solution:
1. Check user document has organizationId field
2. Verify user.organizationId = 'salfa-corp' (or other org)
3. Run migration if needed
```

**Issue 2: Organization badges not showing**
```
Symptom: Agent cards missing purple badges
Likely cause: organizationName not loaded

Solution:
1. Check API response includes organizationName
2. Verify organization document exists
3. Check getOrganization() returns data
```

**Issue 3: Owner info shows own email**
```
Symptom: Admin sees their own email as owner
This is correct! Agent owner = who created it

Not an issue - this means you're viewing your own agent
```

---

## 📸 Screenshot Checklist

### For Documentation

**Capture these views:**

1. **SuperAdmin - Agent List**
   - Show multiple organizations
   - Show different owners
   - Show total count

2. **SuperAdmin - Expanded Agent**
   - Show full details
   - Show organization info
   - Show owner info

3. **Admin - Agent List**
   - Show single organization
   - Show colleague owners
   - Show org total count

4. **User - Agent List**
   - Show clean UI
   - Show no org metadata
   - Show own agent count

---

## 🎯 Testing Outcomes

### Pass Criteria

**Must Have:**
- [x] Automated test passes
- [ ] SuperAdmin sees all agents
- [ ] Admin sees org agents only
- [ ] User sees own agents only
- [ ] No TypeScript errors in modified files
- [ ] No console errors in browser

**Nice to Have:**
- [ ] Organization badges visually clear
- [ ] Owner info helpful for admins
- [ ] Performance acceptable (<3s load)
- [ ] UI not cluttered

---

### Sign-Off

**Tested By:** _______________  
**Date:** _______________  
**Role:** _______________  

**Results:**
- [ ] ✅ Pass - Ready for deployment
- [ ] ⚠️ Pass with notes - Minor issues noted
- [ ] ❌ Fail - Issues must be fixed

**Notes:**
```
(Add any observations, issues, or suggestions here)
```

---

**Next Steps After Testing:**

1. ✅ If tests pass → Commit changes
2. ⚠️ If minor issues → Document and decide
3. ❌ If fails → Debug and retest

---

**Last Updated:** 2025-11-11  
**Status:** Ready for browser testing  
**Estimated Test Time:** 15-20 minutes


