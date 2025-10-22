# 🔍 Agent Sharing Debug Guide - 2025-10-22

**Status:** Enhanced with comprehensive logging  
**Purpose:** Debug why shared agents aren't appearing for recipients

---

## 🧪 How to Debug

### Step 1: Share the Agent (As Owner)

1. Login as owner (e.g., `alec@salfagestion.cl`)
2. Open agent "SSOMA"
3. Click "Compartir Agente"
4. Select "Usuarios" tab
5. Check the box next to target user (e.g., `alec@salfacloud.cl`)
6. Ensure "Usar" is selected (green)
7. Click "Compartir Agente"

**Watch Console (F12 → Console):**
```
🔗 Sharing agent: {
  agentId: "some-agent-id",
  agentTitle: "SSOMA",
  ownerId: "alec_salfagestion_cl",
  selectedTargets: [
    { type: 'user', id: 'alec_salfacloud_cl' }  ← Check this ID!
  ],
  accessLevel: "use"
}

✅ Agent shared successfully: {
  id: "share-xyz",
  agentId: "...",
  sharedWith: [...]
}
```

**Key things to verify:**
- ✅ `selectedTargets[0].id` should be `alec_salfacloud_cl` (email with @ and . replaced by _)
- ✅ Response shows "Agent shared successfully"
- ✅ Right panel updates with new share

---

### Step 2: Login as Recipient

1. Logout from owner account
2. Login as recipient (e.g., `alec@salfacloud.cl`)
3. Wait for page to load

**Watch Console (F12 → Console):**
```
📥 Cargando conversaciones desde Firestore...
🔍 Loading shared agents for userId: alec_salfacloud_cl  ← Check this matches!

🔍 getSharedAgents called for userId: alec_salfacloud_cl
   User groups: 0 []
   Total shares in system: 3
   
   Examining share: {
     id: "share-xyz",
     agentId: "agent-ssoma-id",
     sharedWith: [
       { type: 'user', id: 'alec_salfacloud_cl' }  ← Should match!
     ]
   }
   ✅ Match found: { type: 'user', id: 'alec_salfacloud_cl' }
   
   Relevant shares found: 1
   Loading agents: ["agent-ssoma-id"]
   ✅ Loaded agent: SSOMA
   
✅ Returning 1 shared agents

   Shared agents data: { agents: [{ id: "...", title: "SSOMA", ... }] }
   Processed shared agents: 1
     - SSOMA (id: agent-ssoma-id )

✅ 0 propios + 1 compartidos = 1 total
```

---

## 🔎 Debugging Checklist

### Issue: No console logs appear

**Problem:** Logging not working  
**Fix:** Hard refresh (Cmd+Shift+R) to load updated code

---

### Issue: "selectedTargets[0].id" is wrong format

**Example:** Shows `"114671162830729001607"` instead of `"alec_salfacloud_cl"`

**Cause:** Using wrong user ID field  
**Fix:** Modal should use `user.id` where `id = email.replace(/[@.]/g, '_')`

**Check User object structure:**
```javascript
// In console when modal loads:
console.log('All users:', allUsers);
// Should show: [{ id: "alec_salfacloud_cl", email: "alec@salfacloud.cl", ... }]
```

---

### Issue: "No shared agents for this user" in console

**Problem:** Share document exists but isn't matching  
**Possible causes:**

#### A. UserID format mismatch

**Check console:**
```
Examining share: {
  sharedWith: [{ type: 'user', id: 'DIFFERENT_FORMAT' }]  ← Compare!
}

Loading shared agents for userId: alec_salfacloud_cl  ← Compare!
```

**If different formats:**
- Share has: `114671162830729001607` (numeric Google ID)
- Load uses: `alec_salfacloud_cl` (email-based ID)
- **Fix needed:** Standardize userId format

#### B. Share document didn't save correctly

**Check Firestore Console:**
1. Go to: https://console.firebase.google.com/project/gen-lang-client-0986191192/firestore
2. Open collection: `agent_shares`
3. Find document created today
4. Verify:
   ```json
   {
     "agentId": "...",
     "ownerId": "alec_salfagestion_cl",
     "sharedWith": [
       {
         "type": "user",
         "id": "alec_salfacloud_cl"  ← Should match recipient's ID
       }
     ],
     "accessLevel": "use",
     "createdAt": "..."
   }
   ```

---

### Issue: Share found but agent not loaded

**Console shows:**
```
Relevant shares found: 1
Loading agents: ["agent-id"]
⚠️ Agent not found: agent-id  ← Problem!
```

**Cause:** Agent ID in share doesn't match actual conversation document  
**Fix:** Verify agent exists in `conversations` collection

**Check:**
```bash
# In Firestore console
# Collection: conversations
# Find the agent you're trying to share
# Copy its document ID
# Compare with share's agentId field
```

---

## 🛠️ Quick Fixes

### Fix 1: Ensure userId consistency

The key is that **both the share and the lookup must use the same userId format**.

**Current format:** `email.replace(/[@.]/g, '_')`

**Examples:**
- `alec@salfacloud.cl` → `alec_salfacloud_cl`
- `hello@getaifactory.com` → `hello_getaifactory_com`

**Verify in modal (when selecting user):**
```typescript
// In toggleTarget function, add logging:
const toggleTarget = (type: 'user' | 'group', id: string) => {
  console.log('Toggling target:', { type, id });  // ← Should show alec_salfacloud_cl
  // ... rest of function
};
```

---

### Fix 2: Verify API endpoints are working

**Test manually:**
```bash
# 1. Get your current userId
# If alec@salfacloud.cl, it's: alec_salfacloud_cl

# 2. Test shared agents API
curl "http://localhost:3000/api/agents/shared?userId=alec_salfacloud_cl"

# Expected response:
{
  "agents": [
    {
      "id": "...",
      "title": "SSOMA",
      "isAgent": true,
      ...
    }
  ]
}
```

---

### Fix 3: Check right panel shows correct user IDs

In the "Accesos Compartidos" panel, the usernames shown should match what's in Firestore.

**If showing wrong names:**
- Check `getTargetName` function
- Verify it's looking up from `allUsers` array correctly
- Verify `allUsers` was loaded successfully

---

## 📊 Expected Behavior

### After Sharing

**Right Panel should show:**
```
Accesos Compartidos (2)

👤 Sebastian Orellana Usuario
   [Usar agente]  [X]
   Compartido 22/10/2025

👤 Alec Salfa
   [Usar agente]  [X]
   Compartido 22/10/2025
```

### When Recipient Logs In

**Console should show:**
```
🔍 Loading shared agents for userId: alec_salfacloud_cl
🔍 getSharedAgents called for userId: alec_salfacloud_cl
   Total shares in system: 2
   Examining share: { ... }
   ✅ Match found: { type: 'user', id: 'alec_salfacloud_cl' }
   Relevant shares found: 1
   ✅ Loaded agent: SSOMA
✅ 0 propios + 1 compartidos = 1 total
```

**Sidebar should show:**
```
🤝 AGENTES COMPARTIDOS (1)
└─ SSOMA 👁️
   Compartido por alec@salfagestion.cl
```

---

## 🐛 Common Issues & Solutions

### Issue: userId format mismatch

**Symptom:** Share created but not found when loading

**Debug:**
1. Check console logs for both operations
2. Compare userId in:
   - `selectedTargets[0].id` (when sharing)
   - `Loading shared agents for userId:` (when loading)
3. They must match exactly

**If mismatch:**
- Both should use: `email.replace(/[@.]/g, '_')`
- Check modal is using `user.id` not `user.userId` or `user.email`

---

### Issue: Share document missing fields

**Symptom:** Share exists but accessLevel or sharedWith is malformed

**Debug in Firestore Console:**
```json
// CORRECT:
{
  "sharedWith": [
    {
      "type": "user",
      "id": "alec_salfacloud_cl",
      "accessLevel": "use"  ← Optional here, or at root level
    }
  ],
  "accessLevel": "use"  ← Or here
}

// WRONG:
{
  "sharedWith": ["alec_salfacloud_cl"],  ← Should be array of objects!
  "accessLevel": "use"
}
```

---

### Issue: Agent ID mismatch

**Symptom:** Share found but agent not loaded

**Debug:**
```
Relevant shares found: 1
Loading agents: ["XYZ"]
⚠️ Agent not found: XYZ  ← Agent doesn't exist with this ID
```

**Fix:**
1. Go to Firestore → `conversations` collection
2. Find the agent you want to share
3. Note its document ID (e.g., `agent-ssoma-123`)
4. This is what should be in `share.agentId`

---

## 🧪 Manual Test Steps

### Full End-to-End Test

1. **Create share:**
   - Share SSOMA with alec@salfacloud.cl
   - Note the console logs
   - Copy the share ID from console

2. **Verify in Firestore:**
   - Go to `agent_shares` collection
   - Find the document
   - Verify `sharedWith[0].id === "alec_salfacloud_cl"`

3. **Login as recipient:**
   - Logout
   - Login as alec@salfacloud.cl
   - Watch console for "Loading shared agents"
   - Should see "Relevant shares found: 1"

4. **Verify in UI:**
   - Sidebar should show "AGENTES COMPARTIDOS (1)"
   - Click to expand
   - Should show "SSOMA" with eye icon

---

## 📋 Next Steps After Debugging

Once you identify the issue from console logs:

### If userId mismatch:
- Standardize to email-based format everywhere
- Update shares to use correct format

### If share not saving:
- Check API response
- Verify Firestore permissions
- Check network tab for errors

### If agent not loading:
- Verify agentId in share matches conversation doc ID
- Check agent exists and isn't archived
- Verify getConversation returns the agent

---

## ✅ Success Criteria

When working correctly, you should see:

**In Console:**
```
✅ Agent shared successfully
✅ Match found
✅ Loaded agent: SSOMA
✅ 0 propios + 1 compartidos = 1 total
```

**In UI:**
```
🤝 AGENTES COMPARTIDOS (1)
└─ SSOMA 👁️
```

**In Firestore:**
```json
agent_shares/xyz: {
  "agentId": "agent-ssoma-id",
  "sharedWith": [{ "type": "user", "id": "alec_salfacloud_cl" }]
}
```

---

**Date:** 2025-10-22  
**Status:** Debug logging added  
**Next:** Test and identify issue from console logs

