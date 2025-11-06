# 🚀 Quick Fix - Production Login Issue

**Issue:** Users cannot login to https://salfagpt.salfagestion.cl  
**Affected Domains:** getaifactory.com, salfacloud.cl  
**Fix Time:** 5 minutes

---

## ✅ The Fix (For Admin with GCP Access)

### One-Command Fix

```bash
# Download and run the setup script
cd /Users/alec/salfagpt
chmod +x scripts/setup-production-permissions.sh
./scripts/setup-production-permissions.sh
```

**What it does:**
1. Enables required GCP APIs
2. Grants Cloud Run service account access to:
   - ✅ Firestore (CRITICAL - Blocks logins)
   - ✅ Cloud Storage (Document uploads)
   - ✅ BigQuery (Analytics)
   - ✅ Vertex AI (Embeddings)
   - ✅ Cloud Logging
   - ✅ Secret Manager

3. Verifies permissions were granted
4. Shows you how to test

---

## 🧪 After Running the Fix

### Wait 2-3 minutes, then test:

```bash
# Test 1: Firestore health check
curl -s https://salfagpt.salfagestion.cl/api/health/firestore | jq '.status'
# Expected: "healthy"

# Test 2: Try logging in
open https://salfagpt.salfagestion.cl
# Login with: alec@getaifactory.com or user@salfacloud.cl
# Should: Work successfully ✅
```

---

## 🎯 What Went Wrong

### The Issue
- Production Cloud Run service has **NO permissions** to access Firestore
- Cannot verify if domains exist/are enabled
- Domain verification fails → Shows "Dominio Deshabilitado" error
- Login blocked ❌

### Why Localhost Works
- Uses YOUR personal GCP credentials (Owner/Editor access)
- Has full access to Firestore ✅
- Domain verification works ✅

### Why Production Fails
- Uses service account with NO permissions ❌
- Cannot access Firestore ❌
- Domain verification fails ❌

---

## 📋 Required Access

**To run the fix, you need:**
- Owner or Editor role on project: `cr-salfagpt-ai-ft-prod`

**If you don't have access:**
- Contact the person who deployed production
- Contact your GCP administrator
- Share this document with them

---

## 📚 Full Documentation

For complete details, see:
- `PRODUCTION_LOGIN_DIAGNOSIS_2025-11-03.md` - Full diagnosis
- `PRODUCTION_PERMISSIONS_FIX_2025-11-03.md` - Detailed fix instructions
- `scripts/setup-production-permissions.sh` - Automated setup script

---

**Priority:** 🔴 CRITICAL  
**Impact:** Blocks all users from logging in  
**Complexity:** Low (just IAM permissions)  
**Risk:** None (only grants access, doesn't change code)



