# Production Login Issue - Complete Diagnosis

**Date:** 2025-11-03  
**Reporter:** Alec  
**Production URL:** https://salfagpt.salfagestion.cl  
**Status:** 🔴 BROKEN - Users cannot login

---

## 🚨 The Problem

**Symptom:** Users see "Dominio Deshabilitado" error when trying to login with:
- ❌ `getaifactory.com` domain
- ❌ `salfacloud.cl` domain
- ✅ `localhost:3000` works perfectly

**Domains shown in screenshots:**
- GetAI Factory (getaifactory.com) - Status: Enabled, 0 users
- Salfa Cloud (salfacloud.cl) - Status: Enabled, 0 users

---

## 🔍 Root Cause Analysis

### Investigation Steps

1. **Checked domain status in UI** ✅
   - Domains exist in Firestore
   - Domains are marked as enabled
   - UI shows them correctly

2. **Checked authentication flow** ✅
   - OAuth configuration is correct
   - Redirect URIs are properly configured
   - Google authentication works

3. **Checked production health** ⚠️
   - Service is running
   - **Firestore access: PERMISSION_DENIED** ← ROOT CAUSE

### The Root Cause

```json
{
  "service": "flow-production",
  "project": "cr-salfagpt-ai-ft-prod",
  "issue": "Cloud Run service account lacks Firestore permissions",
  "impact": "Cannot read domains from Firestore → Domain verification fails → Login blocked"
}
```

### Why It Fails

```
Login Flow:
1. User authenticates with Google ✅
2. System extracts domain from email ✅
3. System tries to verify domain in Firestore:
   → Calls: getDomain('getaifactory.com')
   → Firestore query: firestore.collection('domains').doc('getaifactory.com').get()
   → Result: PERMISSION_DENIED ❌
4. Domain verification fails
5. User sees: "Dominio Deshabilitado" error
6. Login blocked ❌
```

### Why Localhost Works

```
Localhost:
- Project: salfagpt
- Auth: gcloud auth application-default login (your personal account)
- Permissions: You have Owner/Editor role
- Firestore access: ✅ GRANTED
- Domain verification: ✅ WORKS
- Login: ✅ SUCCESS
```

### Why Production Fails

```
Production:
- Project: cr-salfagpt-ai-ft-prod  
- Auth: Cloud Run Workload Identity (service account)
- Permissions: ❌ NO ROLES GRANTED
- Firestore access: ❌ PERMISSION_DENIED
- Domain verification: ❌ FAILS
- Login: ❌ BLOCKED
```

---

## 🎯 The Solution

### What Needs to Happen

**Grant the Cloud Run service account permission to access Firestore** (and other services).

### Who Can Fix This

**Required Access:** Owner/Editor role on project `cr-salfagpt-ai-ft-prod`

**Current Known Access:**
- ❓ Unknown - whoever deployed the production service
- ❓ Salfacorp GCP administrator
- ❌ NOT alec@salfacloud.cl (permission denied when checking)

### How to Fix

**Option 1: Use the automated script (Recommended)**

```bash
# Run the setup script
chmod +x scripts/setup-production-permissions.sh
./scripts/setup-production-permissions.sh
```

**Option 2: Manual commands**

See `PRODUCTION_PERMISSIONS_FIX_2025-11-03.md` for complete commands.

---

## 📊 Services Requiring Permissions

Based on code analysis, here are ALL services the application uses:

| # | Service | SDK | Usage | Priority |
|---|---------|-----|-------|----------|
| 1 | **Firestore** | `@google-cloud/firestore` | User data, domains, conversations | 🔴 CRITICAL |
| 2 | **Cloud Storage** | `@google-cloud/storage` | PDF uploads, documents | 🟡 HIGH |
| 3 | **BigQuery** | `@google-cloud/bigquery` | Analytics, vector search | 🟡 HIGH |
| 4 | **Vertex AI** | `@google-cloud/vertexai` | Text embeddings | 🟡 HIGH |
| 5 | **Cloud Logging** | Built-in | Application logs | 🟢 MEDIUM |
| 6 | **Secret Manager** | `@google-cloud/secret-manager` | Secrets (if used) | 🟢 MEDIUM |
| 7 | **Gemini AI** | `@google/genai` | Chat responses | ✅ Uses API key (no IAM) |

### Critical Path (What blocks login)

```
Login → Domain Verification → Firestore Read → BLOCKED ❌
```

**Fix Firestore permissions = Unblocks login** ✅

---

## 🔬 Evidence

### Health Check Results

**Before Fix:**
```bash
$ curl -s https://salfagpt.salfagestion.cl/api/health/firestore | jq '.'
```

```json
{
  "status": "error",
  "checks": {
    "projectId": {
      "status": "pass",
      "value": "cr-salfagpt-ai-ft-prod"
    },
    "authentication": {
      "status": "fail",
      "message": "7 PERMISSION_DENIED: Permission denied on resource project cr-salfagpt-ai-ft-prod."
    },
    "firestoreRead": {
      "status": "fail"
    },
    "firestoreWrite": {
      "status": "fail"
    }
  }
}
```

**After Fix (Expected):**
```json
{
  "status": "healthy",
  "checks": {
    "projectId": { "status": "pass" },
    "authentication": { "status": "pass" },
    "firestoreRead": { "status": "pass" },
    "firestoreWrite": { "status": "pass" },
    "collections": { "status": "pass" }
  }
}
```

---

## 📝 Code References

### Where Domain Verification Happens

**File:** `src/lib/domains.ts` (lines 220-247)

```typescript
export async function isUserDomainEnabled(userEmail: string): Promise<boolean> {
  const domainId = getDomainFromEmail(userEmail);
  
  try {
    const domain = await getDomain(domainId);  // ← Firestore read
    
    if (!domain) {
      return false; // Domain not found
    }
    
    if (!domain.enabled) {
      return false; // Domain disabled
    }
    
    return true; // ✅ Allow login
  } catch (error) {
    console.error('❌ Error checking domain status:', error);
    return false; // ❌ PERMISSION_DENIED triggers this
  }
}
```

**File:** `src/pages/auth/callback.ts` (lines 51-64)

```typescript
// 🔒 CRITICAL Security: Check if user's domain is enabled
const userDomain = getDomainFromEmail(userInfo.email);
const isDomainEnabled = await isUserDomainEnabled(userInfo.email);

if (!isDomainEnabled) {  // ← This triggers when Firestore fails
  console.warn('🚨 Login attempt from disabled domain:', {
    email: userInfo.email,
    domain: userDomain,
  });
  
  // Redirect to login with error
  return redirect(`/auth/login?error=domain_disabled&domain=${userDomain}`);
}
```

---

## 🎯 Next Steps

### For the Admin with Access

1. **Run the setup script:**
   ```bash
   ./scripts/setup-production-permissions.sh
   ```

2. **Wait 2-3 minutes** for permissions to propagate

3. **Verify Firestore access:**
   ```bash
   curl -s https://salfagpt.salfagestion.cl/api/health/firestore | jq '.status'
   ```
   Expected: `"healthy"`

4. **Test login:**
   - Visit: https://salfagpt.salfagestion.cl
   - Login with: any getaifactory.com or salfacloud.cl email
   - Should: Successfully login ✅

### For Testing

Once fixed, test with these accounts:
- ✅ alec@getaifactory.com
- ✅ any-user@salfacloud.cl
- ✅ any-user@getaifactory.com

All should successfully login.

---

## 🎓 Why This Happened

**Common mistake when deploying to new GCP projects:**

1. Service is deployed ✅
2. Environment variables are set ✅
3. OAuth is configured ✅
4. **BUT:** Service account permissions are forgotten ❌

**This is why:**
- Localhost works (uses your personal credentials with full access)
- Production fails (uses service account with no permissions)

**Prevention:**
- Always run permission setup script BEFORE first deployment
- Always test `/api/health/firestore` immediately after deployment
- Always verify service account has required roles

---

## 📞 Contact

**Need help running the fix?**

Contact whoever deployed the production service or has Admin access to project `cr-salfagpt-ai-ft-prod`.

**Show them:**
1. This document: `PRODUCTION_LOGIN_DIAGNOSIS_2025-11-03.md`
2. The fix document: `PRODUCTION_PERMISSIONS_FIX_2025-11-03.md`
3. The setup script: `scripts/setup-production-permissions.sh`

**For questions:**
- Technical: alec@getaifactory.com
- Access: Your GCP project administrator

---

## ✅ Checklist for Resolution

Track progress:

- [ ] Identified admin with access to `cr-salfagpt-ai-ft-prod`
- [ ] Shared this diagnosis document
- [ ] Shared the setup script
- [ ] Admin ran setup script
- [ ] Waited 2-3 minutes for propagation
- [ ] Verified Firestore health check passes
- [ ] Tested login with getaifactory.com email - SUCCESS ✅
- [ ] Tested login with salfacloud.cl email - SUCCESS ✅
- [ ] Documented fix in project docs
- [ ] Closed this issue

---

**Last Updated:** 2025-11-03  
**Status:** 🔴 Awaiting admin to run fix  
**Estimated Fix Time:** 5 minutes  
**Severity:** CRITICAL - Blocks all production logins




