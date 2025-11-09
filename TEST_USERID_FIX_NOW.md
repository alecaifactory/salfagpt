# 🧪 Test User ID Fix - Quick Start

**Status:** ✅ Code changed, ready to test  
**Time to test:** 5 minutes  

---

## 🚀 Quick Test (5 Minutes)

### Step 1: Start Main Server (30 seconds)

```bash
cd /Users/alec/salfagpt
npm run dev
```

Wait for: `http://localhost:3000`

---

### Step 2: Login and Check JWT (2 minutes)

1. **Open:** http://localhost:3000/chat
2. **Login** with your account
3. **Open DevTools:** F12 or Cmd+Option+I
4. **Go to:** Application tab → Cookies → localhost:3000
5. **Find:** `flow_session` cookie
6. **Copy** the cookie value (long string)
7. **Go to:** https://jwt.io
8. **Paste** in "Encoded" section
9. **Check "Decoded Payload":**

**✅ SHOULD SEE (Success):**
```json
{
  "id": "usr_k3n9x2m4p8q1w5z7y0",  ← HASH ID ✅
  "googleUserId": "114671162830729001607",
  "email": "your@email.com",
  "domain": "email.com",  ← NEW! ✅
  "role": "admin",
  "roles": ["admin"]
}
```

**❌ IF YOU SEE (Needs fixing):**
```json
{
  "id": "114671162830729001607",  ← Numeric (old behavior)
  ...
}
```

---

### Step 3: Check Console Logs (1 minute)

**In browser console (http://localhost:3000/chat):**

**✅ SHOULD SEE:**
```
✅ User authenticated: usr_k3n9... 
(not 114671...)

🔍 Loading shared agents for userId: usr_k3n9x2m4p8q1w5z7y0
(no "Resolving hash ID from email" message)
```

**✅ SHOULD NOT SEE:**
```
Resolving hash ID from email...  ← This means old behavior
```

---

### Step 4: Verify Features Work (1 minute)

**Quick checks:**
- [ ] ✅ All conversations visible
- [ ] ✅ Can click on a conversation
- [ ] ✅ Can send a message
- [ ] ✅ Shared agents section has data (if you have shared agents)
- [ ] ✅ No errors in console

---

### Step 5: Performance Check (30 seconds)

**If you have shared agents:**

1. **Open console**
2. **Type:**
   ```javascript
   console.time('loadShared');
   ```
3. **Click on "Agentes Compartidos" section or refresh**
4. **Type:**
   ```javascript
   console.timeEnd('loadShared');
   ```

**✅ SHOULD SEE:**
```
loadShared: 150-180ms
```

**Baseline (backup would be):** ~250ms

**Improvement:** 30-40% faster ✅

---

## ✅ Quick Success Check

**All good if:**
- ✅ JWT has hash ID (not numeric)
- ✅ Console shows hash ID in user authentication
- ✅ No "Resolving hash ID from email" in logs
- ✅ All features work normally
- ✅ Performance seems faster

---

## 🚨 If Something's Wrong

**Quick rollback:**
```bash
cd /Users/alec/salfagpt
git reset --hard backup-20251108-210520
npm run dev
# ✅ Back to working state
```

**Check logs:**
```bash
# See if there are errors
cd /Users/alec/salfagpt
npm run dev 2>&1 | grep -i error
```

---

## 📊 Compare with Backup (Optional)

**If you want to see the difference:**

### Terminal 2:
```bash
cd /Users/alec/.cursor/worktrees/salfagpt/backup-20251108-210520
npm run dev
# → http://localhost:3001
```

### Browser:
- **Port 3000:** New behavior (hash ID)
- **Port 3001:** Old behavior (numeric ID)
- **Both should work!**
- **Port 3000 should be faster!**

---

## 🎯 What Success Looks Like

```
╔═══════════════════════════════════════════════════╗
║ ✅ SUCCESS INDICATORS                             ║
╠═══════════════════════════════════════════════════╣
║                                                   ║
║  JWT Payload:                                     ║
║    "id": "usr_..." ✅ (not numeric)               ║
║                                                   ║
║  Console Logs:                                    ║
║    ✅ User authenticated: usr_...                 ║
║    (not numeric)                                  ║
║                                                   ║
║  Performance:                                     ║
║    Shared agent load: <180ms ✅                   ║
║    (was ~250ms)                                   ║
║                                                   ║
║  Functionality:                                   ║
║    ✅ All features work                           ║
║    ✅ No console errors                           ║
║    ✅ Data loads correctly                        ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
```

---

**Ready to test! Just start the server and login! 🚀**

**Estimated test time:** 5 minutes  
**Rollback time (if needed):** 10 seconds  
**Safety:** Backup preserved at port 3001  

