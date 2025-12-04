# 📌 Stable Version Baseline - Production

**Established:** 2025-12-04 00:45 UTC  
**Status:** 🟢 **STABLE & VERIFIED**

---

## ✅ **Current Stable Version**

### **Revision Details**

```
Service:   cr-salfagpt-ai-ft-prod
Revision:  cr-salfagpt-ai-ft-prod-00095-b8f
Deployed:  2025-11-25 15:08 UTC
Status:    🟢 STABLE (verified working)
Traffic:   100%
```

### **Verified Functionality**

```
✅ Landing page loads correctly
✅ CSS styling proper (white background, no violet)
✅ OAuth login works (Google authentication)
✅ Users can access /chat
✅ Sessions persist
✅ All features functional
✅ No blocking errors
```

### **User Verification**

```
Tested by: alec@getaifactory.com
Test date: 2025-12-04 00:45 UTC
Test result: ✅ All systems operational
Method: Incognito window, full login flow
```

---

## 🚫 **Known Issues with Later Revisions**

### **Revisions 00096-00104 (Dec 3-4, 2025)**

**Status:** ❌ **DO NOT USE - Login Broken**

**Error:** `Error 401: invalid_client` from Google OAuth

**Affected Revisions:**
```
00096-6v5  (22:49) - Version refresh feature
00097-6cg  (23:16) - CSS 404 fix
00098-nck  (00:20) - Background color fix
00099-tjs  (00:30) - TOP_K added
00100-zvt  (00:37) - USE_EAST4 variables
00101-6wn  (00:38) - Secrets update attempt 1
00102-vg8  (00:41) - Source rebuild
00103-bsw  (00:43) - Secret version 4
00104-dgd  (00:44) - All secrets latest
```

**Symptoms:**
- Landing page shows violet background (even in incognito)
- OAuth login fails with "Authorization Error - invalid_client"
- Users cannot access platform
- Complete login blockage

**Root Cause (To Be Investigated):**
- OAuth configuration issue
- Possible secret mismatch
- Build process issue
- Unknown breaking change between 00095 and 00096

---

## 🔍 **Diagnostic Plan**

### **Investigation Steps**

1. **Compare 00095 vs 00096 code differences**
   ```bash
   # Find what changed
   git diff <commit-for-00095>..<commit-for-00096>
   ```

2. **Check environment variables diff**
   - 00095: Missing some variables?
   - 00096+: Added variables broke something?

3. **Verify OAuth configuration**
   - Client ID matches Google Console ✅ (verified)
   - Redirect URIs configured ✅ (verified)
   - Secret values correct ✅ (verified)
   - **Something else** causing invalid_client error

4. **Test hypothesis: Secrets configuration**
   - Maybe 00095 uses different secret format?
   - Maybe environment variable names changed?
   - Maybe there's a code change that broke OAuth flow?

---

## 🛡️ **Protection Strategy Going Forward**

### **Implement Canary Deployment System**

**Goal:** Test new versions on **you first** before all users

**Implementation Plan:**

#### **Phase 1: Canary User List (2 hours)**

**What it does:**
```
Deploy new version:
  → Routes to canary users only (you: alec@getaifactory.com)
  → Everyone else stays on stable (00095)
  → You test for 10-30 minutes
  → If works: Expand to more users
  → If fails: Only you affected, rollback instantly
```

**Components needed:**
1. Firestore collection: `feature_rollouts`
2. Version router: Check if user is canary
3. Deploy scripts: `deploy-canary.sh`, `rollback-canary.sh`
4. Manual control: You decide when to expand

**Benefits:**
- ✅ Today's OAuth issue: Only YOU would have seen it
- ✅ Other 50 users: Never affected
- ✅ Fast rollback: Just remove yourself from canary
- ✅ Test in production safely

---

#### **Phase 2: Progressive Rollout (Optional, +6 hours)**

**What it adds:**
```
Auto-progression:
  Canary (you) → 5% users → 25% → 50% → 100%
  
Health monitoring:
  Track errors in canary vs stable
  Auto-rollback if error rate spikes
  
Dashboard:
  Visual control panel
  Real-time metrics
  One-click rollback
```

---

## 🎯 **Recommended Next Steps**

### **IMMEDIATE (Now)**

1. ✅ **Stable version documented** (00095-b8f)
2. ✅ **Rollback executed** (users can work)
3. **Document what broke** (next step)

### **SHORT TERM (Today/Tomorrow)**

1. **Investigate why 00096+ breaks OAuth**
   - Compare code changes
   - Check environment variable impact
   - Test locally with production config

2. **Fix the root cause**
   - Apply fix
   - Test in localhost with production secrets
   - Document the fix

3. **Implement basic canary system** (2 hours)
   - Deploy only to you first
   - Test safely
   - Expand when confident

### **LONG TERM (This Week)**

1. **Add auto-progression** (if canary proves valuable)
2. **Add health monitoring**
3. **Build control dashboard**

---

## 📋 **Deployment Approval Checklist** (For Future)

**Before deploying to production:**

- [ ] Tested in localhost
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] OAuth works in localhost
- [ ] All .env.salfacorp variables included
- [ ] Secrets verified
- [ ] **Deploy as canary first** (once implemented)
- [ ] Test for 10-30 minutes
- [ ] No errors in canary
- [ ] Then expand to all users

---

## 🎊 **Current State**

### **Production Status** 🟢

```
Service:    cr-salfagpt-ai-ft-prod
Revision:   00095-b8f (STABLE)
Deployed:   Nov 25, 2025
Status:     ✅ Healthy
Users:      ✅ Can access
Login:      ✅ Working
Features:   ✅ All functional
```

### **Failed Attempts Documented** 📚

```
Revisions 00096-00104: DO NOT USE
Issue: OAuth invalid_client error
Cause: Unknown (to be investigated)
Impact: Complete login blockage
Rollback: Completed to 00095
```

---

## 🚀 **Next Actions**

### **Option A: Investigate & Fix First**

1. Find root cause of OAuth failure
2. Fix the issue
3. Test locally
4. Deploy as canary (you only)
5. If works, expand to all

**Timeline:** 2-3 hours

---

### **Option B: Implement Canary First**

1. Build canary deployment system
2. Then deploy fixes as canary
3. Test safely on yourself
4. Never risk all users again

**Timeline:** 2 hours for basic system

---

### **Option C: Both in Parallel**

1. I implement canary system (2 hours)
2. You test and identify what breaks OAuth
3. We fix with canary protection
4. Safe deployment going forward

**Timeline:** 2-3 hours total

---

## 💡 **My Recommendation**

**Option C: Both in Parallel**

**Why:**
- Canary system prevents future incidents
- Parallel work is efficient
- You're protected going forward
- Can deploy fixes safely

**Next:**
1. I implement basic canary system (2 hours)
2. Then we re-deploy version refresh + fixes
3. Only you see new version first
4. If works: expand to all
5. If fails: only you affected

---

**¿Quieres que implemente el sistema canary ahora?** 

**A)** Sí, impleméntalo (2 horas) - me protege en el futuro  
**B)** No, primero investiguemos qué rompió el OAuth  
**C)** Déjalo para después, enfócate en otras cosas

**¿Cuál prefieres?** 🎯
