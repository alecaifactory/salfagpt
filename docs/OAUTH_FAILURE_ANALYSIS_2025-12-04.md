# 🔍 OAuth Failure Analysis - Dec 4, 2025

**Issue:** Revisions 00096-00104 fail with `Error 401: invalid_client`  
**Stable Version:** 00095-b8f (Nov 25) ✅  
**Status:** 🔴 **Root cause unknown - requires investigation**

---

## 🚨 **The Problem**

### **What Happened**

```
Timeline:
Nov 25, 15:08 - Rev 00095 deployed → Working ✅
Dec 3, 22:49  - Rev 00096 deployed → Login broken ❌
Dec 4, 00:45  - Rollback to 00095 → Working again ✅
```

### **Error Observed**

```
Google OAuth Screen:
  "Access blocked: Authorization Error"
  "The OAuth client was not found."
  "Error 401: invalid_client"

User:
  alec@getaifactory.com
```

### **What This Means**

**Invalid_client error indicates:**
- Google cannot find/validate the OAuth Client ID
- OR Client ID exists but secret doesn't match
- OR Client is disabled/deleted
- OR Redirect URI not authorized

---

## ✅ **What We KNOW Works**

### **Revision 00095-b8f (Stable)**

**Configuration:**
```
Deployed: Nov 25, 2025
OAuth: ✅ Working
Login: ✅ Functional
Users: ✅ Can access
UI: Landing page (might have violet bg, but login works)
```

**Environment Variables (00095):**
```
Likely has:
  - GOOGLE_CLOUD_PROJECT
  - Some subset of variables
  
Might NOT have:
  - TOP_K
  - USE_EAST4_BIGQUERY
  - USE_EAST4_STORAGE
  - PUBLIC_USE_CHAT_V2
  - ENVIRONMENT_NAME
```

---

## ❌ **What We KNOW Breaks**

### **Revisions 00096-00104 (Broken)**

**All share:**
- Version refresh feature (new code)
- Updated secrets in Secret Manager
- Additional environment variables
- **All fail with same OAuth error**

**Common factor:** Something changed between 00095 and 00096 that breaks OAuth

---

## 🔎 **Investigation Hypotheses**

### **Hypothesis 1: Secret Manager Access**

**Theory:**
- 00095 might use secrets differently
- 00096+ tries to access secrets but fails
- Service account permissions issue?

**Test:**
```bash
# Check service account has secret access
gcloud secrets get-iam-policy google-client-id --project=salfagpt
gcloud secrets get-iam-policy google-client-secret --project=salfagpt
```

**Expected:**
```
Service account should have roles/secretmanager.secretAccessor
```

---

### **Hypothesis 2: Code Change Broke OAuth Flow**

**Theory:**
- New code in version refresh feature
- Changed how OAuth is initialized
- Changed redirect handling
- Changed session management

**Test:**
```bash
# Compare auth code between commits
git show <00095-commit>:src/lib/auth.ts > /tmp/auth-old.ts
git show <00096-commit>:src/lib/auth.ts > /tmp/auth-new.ts
diff /tmp/auth-old.ts /tmp/auth-new.ts
```

---

### **Hypothesis 3: Environment Variable Conflict**

**Theory:**
- New environment variables interfere with OAuth
- ENVIRONMENT_NAME or PUBLIC_USE_CHAT_V2 causes issue
- Variable ordering matters

**Test:**
```bash
# Deploy with ONLY the variables from 00095
# No new variables added
```

---

### **Hypothesis 4: Build Process Issue**

**Theory:**
- New build includes something that breaks OAuth
- Vite config change (CSS fix) affected OAuth somehow
- Dependencies issue

**Test:**
```bash
# Deploy 00095 code but with fresh build
# See if build process is the issue
```

---

## 🛠️ **Diagnostic Steps (To Execute)**

### **Step 1: Get 00095 Configuration**

```bash
# What variables does 00095 have?
gcloud run revisions describe cr-salfagpt-ai-ft-prod-00095-b8f \
  --region=us-east4 \
  --project=salfagpt \
  --format="value(spec.template.spec.containers[0].env)"
```

### **Step 2: Get 00095 Secrets Configuration**

```bash
# How does 00095 access secrets?
gcloud run revisions describe cr-salfagpt-ai-ft-prod-00095-b8f \
  --region=us-east4 \
  --project=salfagpt \
  --format="value(spec.template.spec.containers[0].env)" | grep secret
```

### **Step 3: Compare Git Commits**

```bash
# What code changed between working and broken?
git log --oneline <00095-commit>..<00096-commit>
git diff <00095-commit> <00096-commit> -- src/lib/auth.ts
git diff <00095-commit> <00096-commit> -- src/pages/auth/
```

### **Step 4: Test Incremental Changes**

```
1. Deploy 00095 code + only 1 new variable
2. Test if breaks
3. If breaks: Found culprit
4. If works: Add another variable
5. Repeat until we find what breaks it
```

---

## 🎯 **Canary System Design**

### **Why We Need It**

**Today's Incident:**
```
Without Canary:
  Deploy 00096
       ↓
  ALL users affected
       ↓
  Login broken for everyone
       ↓
  7 deployment attempts (00096-00104)
       ↓
  1 hour of downtime risk
       ↓
  Finally rollback to 00095
```

**With Canary:**
```
Deploy 00096 as canary
       ↓
  Only YOU get new version
       ↓
  YOU see OAuth error
       ↓
  Rollback canary (30 seconds)
       ↓
  Other 49 users: Never affected ✅
       ↓
  Fix issue offline
       ↓
  Re-deploy as canary when fixed
```

**Impact:** 1 user affected (you) vs 50 users affected

---

### **Canary Architecture**

```typescript
// Firestore: feature_rollouts/current
{
  id: "current",
  stableRevision: "00095-b8f",
  canaryRevision: null,  // No canary active
  canaryUsers: [
    "alec@getaifactory.com"  // Just you
  ],
  rolloutPercentage: 0,  // 0% = only canary users
  status: "stable"  // All traffic on stable
}

// When deploying new version:
{
  id: "current",
  stableRevision: "00095-b8f",     // Stays safe
  canaryRevision: "00106-xyz",      // New version
  canaryUsers: ["alec@getaifactory.com"],
  rolloutPercentage: 0,  // Just you
  status: "canary-testing"
}

// Your /api/version returns:
{
  version: "0.1.1-canary",  // You see this
  isCanary: true
}

// Other users' /api/version returns:
{
  version: "0.1.0-stable",  // They see this
  isCanary: false
}
```

### **Deployment Workflow**

```bash
# 1. Deploy canary (only you)
./scripts/deploy-canary.sh

# 2. You test
Open app → See banner "🧪 CANARY v0.1.1"
Test login, features, etc.

# 3a. If works → Expand
./scripts/rollout-progress.sh 5   # 5% of users
./scripts/rollout-progress.sh 25  # 25% of users
./scripts/rollout-progress.sh 100 # All users

# 3b. If fails → Rollback
./scripts/rollback-canary.sh
→ You back on stable
→ No one else affected ✅
```

---

## 📊 **Risk Mitigation Comparison**

### **Current Process (No Canary)**

```
Risk Level: 🔴 HIGH

Blast Radius: 50 users (100%)
Detection Time: When users complain
Rollback Time: Manual, 5-30 minutes
User Impact: All users cannot work
Support Load: High (everyone affected)
Confidence: Low (can't test in prod safely)
```

### **With Canary System**

```
Risk Level: 🟢 LOW

Blast Radius: 1 user (2%) initially
Detection Time: Immediate (you test)
Rollback Time: 30 seconds
User Impact: Only canary users
Support Load: Minimal
Confidence: High (validated in prod with real user)
```

---

## 🔧 **Implementation Effort**

### **Minimal Canary (Recommended)**

**Time:** 2 hours  
**Code:** ~300 lines  
**Value:** Prevents today's incident

**Components:**
1. `feature_rollouts` collection (Firestore)
2. Version router middleware
3. Deploy scripts (canary, rollback, expand)
4. Basic monitoring

---

### **Full A/B Testing System**

**Time:** 8-9 hours  
**Code:** ~1,200 lines  
**Value:** Enterprise-grade deployment safety

**Adds to minimal:**
1. Auto-progression based on metrics
2. Health monitoring with auto-rollback
3. Visual dashboard
4. Feature flags
5. Advanced analytics

---

## ✅ **Immediate Action Plan**

### **Right Now**

1. ✅ **Stable version documented:** 00095-b8f
2. ✅ **Production working:** Users can access
3. ✅ **Baseline established:** Known good state

### **Next (You Decide)**

**Option A:** Investigate OAuth failure (2-3 hours)
- Find root cause
- Fix the issue
- Test thoroughly
- Deploy without canary protection

**Option B:** Implement canary first (2 hours)
- Build canary system
- Then investigate OAuth
- Deploy fixes with canary protection
- Sleep better knowing users protected

**Option C:** Both in parallel
- I build canary (2 hours)
- You help identify what changed in code
- We fix with canary safety net

---

## 🎯 **My Strong Recommendation**

**Build Canary System NOW (Option B)**

**Why:**
1. ✅ Prevents recurrence of today's incident
2. ✅ Protects your 50 users
3. ✅ Lets you test safely in production
4. ✅ Fast rollback if issues
5. ✅ Confidence in future deployments
6. ✅ Only 2 hours investment
7. ✅ 80% of value, 20% of effort

**After canary is built:**
- Can safely re-attempt version refresh feature
- Can test fixes on yourself first
- Never risk platform-wide outage again

---

## 📝 **Summary**

**Stable Version:** cr-salfagpt-ai-ft-prod-00095-b8f ✅

**Failed Versions:** 00096-00104 ❌

**Root Cause:** Unknown (OAuth invalid_client)

**Next Step Options:**
- A) Investigate failure
- B) Build canary system (recommended)
- C) Both

**¿Qué prefieres hacer?** 🤔

---

**Documented:** 2025-12-04 00:45 UTC  
**Status:** Stable baseline established  
**Production:** Safe and operational  
**Next:** Your decision on canary system

