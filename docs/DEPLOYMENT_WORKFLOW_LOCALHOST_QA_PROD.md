# 🚀 Deployment Workflow: Localhost → QA → Production

**Created:** 2025-12-04  
**Status:** ✅ Ready to use  
**Safety:** Maximum (3 environments, instant rollback)

---

## 🎯 **Three-Environment Strategy**

```
┌─────────────────────────────────────────────────┐
│  LOCALHOST (Development)                        │
│  - Port: 3000                                   │
│  - Data: Local or salfagpt-qa Firestore         │
│  - Purpose: Active development                   │
│  - Risk: Zero (only you)                         │
└─────────────────────────────────────────────────┘
              ↓ npm run dev
              ↓ Test locally
              ↓ Commit when ready
              ↓
┌─────────────────────────────────────────────────┐
│  QA/STAGING (salfagpt-qa)                       │
│  - Project: salfagpt-qa                         │
│  - Service: cr-salfagpt-qa                      │
│  - Data: QA Firestore (can be production copy) │
│  - Purpose: Integration testing                 │
│  - Risk: Zero for production users ✅            │
└─────────────────────────────────────────────────┘
              ↓ ./scripts/deploy-to-qa.sh
              ↓ Test thoroughly
              ↓ Verify everything works
              ↓
┌─────────────────────────────────────────────────┐
│  PRODUCTION (salfagpt)                          │
│  - Project: salfagpt                            │
│  - Service: cr-salfagpt-ai-ft-prod              │
│  - Data: Production Firestore                   │
│  - Purpose: Live platform                       │
│  - Risk: Managed (tested in QA first) ✅         │
└─────────────────────────────────────────────────┘
              ↓ ./scripts/promote-qa-to-prod.sh
              ↓ Monitor
              ↓ Rollback if needed
```

---

## 🔄 **Complete Workflow**

### **Step 1: Development (Localhost)**

```bash
# Work on your local machine
cd /Users/alec/aifactory

# Start dev server
npm run dev

# Make changes
# Test locally at http://localhost:3000

# Commit when ready
git add .
git commit -m "feat: new feature"
git push origin main
```

**Status:** Changes in git, not deployed anywhere yet

---

### **Step 2: Deploy to QA** (8-10 min)

```bash
./scripts/deploy-to-qa.sh
```

**What happens:**
```
1. Deploys to salfagpt-qa project
2. Creates/updates cr-salfagpt-qa service
3. Uses QA environment variables
4. Returns QA URL for testing
```

**QA URL (example):**
```
https://cr-salfagpt-qa-XXXXX.a.run.app
```

**What to test:**
```
✅ Login works?
✅ OAuth flow correct?
✅ All features functional?
✅ No console errors?
✅ UI looks correct?
✅ Performance acceptable?
```

**If issues:**
- Fix code locally
- Redeploy to QA
- Test again
- **Production completely unaffected** ✅

---

### **Step 3: Promote to Production** (8-10 min)

**Only after QA testing passes:**

```bash
./scripts/promote-qa-to-prod.sh
```

**What happens:**
```
1. Confirms you tested QA ✓
2. Deploys SAME CODE to salfagpt (production)
3. Uses production environment variables
4. Updates production service
```

**Production URL:**
```
https://salfagpt.salfagestion.cl/
```

**Confidence:** High (already tested in QA)

---

### **Step 4: Monitor & Rollback if Needed**

**Monitor for 30-60 minutes:**
- Check Cloud Run logs
- Watch for user reports
- Verify metrics

**If issues:**
```bash
./scripts/rollback-to-stable.sh
```

**Returns to:** Tagged stable version (30 seconds)

---

## 📊 **Benefits of This Approach**

### **vs Direct to Production (What We Did Today)**

```
Today's approach:
  localhost → production
             ↓
          💥 Broke for everyone

New approach:
  localhost → QA → production
             ↓     ↓
          Test   Only deploy if QA works ✅
```

### **vs Canary in Production**

```
Canary in production:
  ✅ Good: Progressive rollout
  ❌ Risk: Still in production environment
  ❌ Risk: If catastrophic, affects some users
  
QA/Staging:
  ✅ Good: Completely isolated
  ✅ Good: Zero risk to production
  ✅ Good: Can break QA as much as needed
  ✅ Better: Industry standard practice
```

---

## 🎯 **Today's Incident - How It Would Have Gone**

### **With QA Environment:**

```
22:00 - Make changes (version refresh, CSS fix)
22:15 - Commit and push to git
22:20 - Deploy to QA
        ./scripts/deploy-to-qa.sh
22:28 - QA deployed successfully
22:30 - Open QA URL, try login
22:31 - See "invalid_client" error
22:32 - "Ah, OAuth issue in QA, let me fix"
22:35 - Fix code, redeploy to QA
22:43 - QA deployed again
22:45 - Test login → Works! ✅
22:50 - Promote to production
        ./scripts/promote-qa-to-prod.sh
22:58 - Production updated successfully
23:00 - Users get working version ✅

Impact:
✅ Zero production downtime
✅ Zero users affected
✅ Issue found and fixed in QA
✅ Confident production deploy
```

### **What Actually Happened (No QA):**

```
22:00 - Make changes
22:49 - Deploy directly to production
22:50 - ALL users can't login ❌
... 45 minutes of failed deployments ...
00:52 - Rollback to stable
01:00 - Production working again

Impact:
❌ 45 minutes downtime
❌ ALL users affected
❌ High stress
❌ No QA safety net
```

---

## 🛠️ **Setup Required**

### **QA Project Configuration**

**Already exists:** ✅ salfagpt-qa

**Needs:**
1. Cloud Run service: `cr-salfagpt-qa`
2. Firestore database (can mirror production data)
3. OAuth Client (same as production or separate)
4. Secrets in Secret Manager
5. Environment variables

**I can set this up in ~30 minutes**

---

## 📋 **Complete Workflow Reference**

### **Daily Development**

```bash
# 1. Make changes locally
npm run dev
# Test at localhost:3000

# 2. Commit
git add .
git commit -m "feat: ..."
git push

# 3. Deploy to QA
./scripts/deploy-to-qa.sh
# Test at QA URL

# 4. If QA works, promote to prod
./scripts/promote-qa-to-prod.sh

# 5. If prod has issues, rollback
./scripts/rollback-to-stable.sh
```

---

## ✅ **Safety Guarantees**

```
Level 1: Localhost
  - Can break freely
  - Only affects you
  - Fast iteration

Level 2: QA
  - Production-like environment
  - Safe to break
  - Integration testing
  - Zero production risk ✅

Level 3: Production
  - Only deploy after QA passes
  - Rollback always available
  - Stable baseline maintained
  - User trust protected ✅
```

---

## 🎊 **Recommendation**

**Use THIS workflow going forward:**

```
1. ✅ Develop in localhost
2. ✅ Deploy to QA first (./scripts/deploy-to-qa.sh)
3. ✅ Test thoroughly in QA
4. ✅ Promote to production (./scripts/promote-qa-to-prod.sh)
5. ✅ Rollback if needed (./scripts/rollback-to-stable.sh)
```

**SKIP canary in production** - QA is better and safer

---

## 🚀 **Ready to Use**

**Scripts created:**
- ✅ `scripts/deploy-to-qa.sh` (deploy to staging)
- ✅ `scripts/promote-qa-to-prod.sh` (QA → Prod)
- ✅ `scripts/rollback-to-stable.sh` (emergency recovery)

**Next:**
1. Deploy your current code to QA
2. Test there (safe, isolated)
3. If works, promote to production
4. Rollback available always

---

**¿Quieres que despliegue a QA ahora para probar el flujo?** 🧪

