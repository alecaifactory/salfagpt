# 🔍 UserId Debug Steps - 2025-10-22

**Current Issue:** Sharing uses email-based ID instead of Google numeric ID  
**Need to verify:** If users have `userId` field in Firestore

---

## 🧪 Debug Steps

### Step 1: Refresh Browser
Hard refresh: `Cmd+Shift+R`

### Step 2: Open Sharing Modal
1. Click on SSOMA agent
2. Click "Compartir Agente"  
3. Watch console

### Step 3: Check Users API Response

**Look for:**
```
📋 Users loaded from API: [...]
   First user: { id: "...", userId: "...", email: "..." }
   First user has userId?: true/false  ← CRITICAL!
```

**If `userId: undefined`:**
- Users don't have Google numeric ID saved yet
- Need to have each user logout and re-login
- When they re-login, `upsertUserOnLogin` will save their Google ID

**If `userId: "106389..."`:**
- Perfect! Users have Google numeric ID ✅
- Continue to next step

---

### Step 4: Select a User (Click Checkbox)

**Look for:**
```
🔘 toggleTarget called: {
  type: 'user',
  id: 'alec_salfagestion_cl',
  user: {
    id: 'alec_salfagestion_cl',
    userId: '106389857986485785874',  ← Should be present!
    email: 'alec@salfagestion.cl'
  }
}
   Computed targetId: 106389857986485785874  ← Should be numeric!
   user.userId: 106389857986485785874
   user.id: alec_salfagestion_cl
   Using: Google numeric userId ✅  ← Should say this!

✅ Added target: {
  type: 'user',
  id: '106389857986485785874',  ← Should be numeric!
  email: 'alec@salfagestion.cl'
}
```

**If says "fallback to id ⚠️":**
- `user.userId` is undefined
- Falling back to email-based ID
- Users need to re-login to get Google ID saved

---

## 🔧 Two Possible Scenarios

### Scenario A: userId Field Missing in Firestore

**Console shows:**
```
First user has userId?: false
Using: fallback to id ⚠️
```

**Cause:** Users haven't logged in since we started saving `userId` field

**Fix:** Each user needs to logout and re-login once:
```
1. Logout
2. Login with Google OAuth
3. auth/callback.ts calls: upsertUserOnLogin(email, name, googleUserId)
4. Firestore saves: { email, userId: "106389..." }
5. Next time: /api/users returns userId ✅
```

---

### Scenario B: userId Field Exists but Not Returned by API

**Console shows:**
```
First user: { id: "...", email: "...", name: "..." }
```
(No userId field at all)

**Cause:** `getAllUsers()` not returning the field

**Fix:** Already fixed in code - verify `src/lib/firestore.ts` line 984:
```typescript
userId: data.userId,  // ✅ Should be here
```

If not there, the file didn't save correctly.

---

## 📊 Expected Console Output (When Working)

```
📋 Users loaded from API: [
  {
    id: "alec_salfagestion_cl",
    userId: "106389857986485785874",  ← Google ID present!
    email: "alec@salfagestion.cl",
    name: "Alec Salfa"
  },
  {
    id: "alec_salfacloud_cl",
    userId: "118563987298648578587",  ← Google ID present!
    email: "alec@salfacloud.cl",
    name: "Alejandro Tomás"
  }
]

🔘 toggleTarget called: {
  user: { userId: '106389857986485785874' }  ← Has userId!
}
   Using: Google numeric userId ✅

✅ Added target: {
  type: 'user',
  id: '106389857986485785874',  ← Numeric ID!
  email: 'alec@salfagestion.cl'
}
```

---

## 🛠️ If userId Is Missing

### Quick Fix: Force User Re-Login

1. **Logout** from alec@salfacloud.cl
2. **Re-login** as alec@salfacloud.cl
3. **Check Firestore Console:**
   - Collection: `users`
   - Document: `alec_salfacloud_cl`
   - Should have field: `userId: "106389..."`

4. **Repeat for all users** who need to be shared with

---

### Alternative: Manually Add userId to Firestore

**For each user document:**
```
1. Go to Firestore Console
2. Collection: users
3. Document: alec_salfacloud_cl
4. Add field:
   - Field: userId
   - Type: string
   - Value: <their Google OAuth numeric ID>
```

**How to get their Google OAuth numeric ID:**
- Have them login
- Check JWT token in console
- Or check auth logs for their numeric ID

---

## 📋 Action Plan

### Immediate (Before Sharing Works):

1. **Refresh browser** - Load new code
2. **Open sharing modal** - Trigger debug logs
3. **Check console** - See if users have userId
4. **If missing:**
   - Have target users logout/re-login
   - Or manually add userId to Firestore
5. **Share again** - Should use numeric ID
6. **Verify** - Shared agent appears for recipient

---

## ✅ Success Criteria

When working correctly, console will show:

```
First user has userId?: true  ← Users have Google ID!

🔘 toggleTarget: { user: { userId: '106389...' } }
   Using: Google numeric userId ✅  ← Using numeric ID!

✅ Added target: { id: '106389...' }  ← Numeric!

🔗 Sharing agent: {
  selectedTargets: [{ id: '106389...' }]  ← Numeric!
}

// When recipient logs in:
Loading shared agents for userId: 106389...  ← Numeric!
✅ Match found  ← Works!
```

---

**Refresh browser and check the console logs!** They'll tell us if users have the `userId` field or if they need to re-login.

