# Production Domain Login Fix

**Date:** 2025-11-03  
**Issue:** Users cannot login with domains `getaifactory.com` and `salfacloud.cl`  
**Service:** flow-production (https://salfagpt.salfagestion.cl)  
**Project:** cr-salfagpt-ai-ft-prod

---

## 🚨 Root Cause

**Firestore permissions are missing** for the Cloud Run service in project `cr-salfagpt-ai-ft-prod`.

### Evidence

```json
{
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
      "status": "fail",
      "message": "7 PERMISSION_DENIED"
    }
  }
}
```

**What this means:**
- ✅ Service is running
- ✅ OAuth is configured correctly
- ❌ **Service cannot read from Firestore**
- ❌ **Cannot verify if domains exist**
- ❌ **Domain verification fails → login blocked**

---

## 🔧 Solution

### Option 1: Grant Firestore Permissions (Recommended)

**Who can do this:** GCP Project Owner/Editor for `cr-salfagpt-ai-ft-prod`

```bash
# 1. Get the service account
SERVICE_ACCOUNT=$(gcloud run services describe flow-production \
  --region=us-central1 \
  --project=cr-salfagpt-ai-ft-prod \
  --format="value(spec.template.spec.serviceAccountName)")

echo "Service Account: $SERVICE_ACCOUNT"

# 2. Grant Firestore User role
gcloud projects add-iam-policy-binding cr-salfagpt-ai-ft-prod \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/datastore.user"

# 3. Verify permissions
gcloud projects get-iam-policy cr-salfagpt-ai-ft-prod \
  --flatten="bindings[].members" \
  --filter="bindings.members:$SERVICE_ACCOUNT" \
  --format="table(bindings.role)"

# Expected output should include: roles/datastore.user
```

---

### Option 2: Enable Firestore API (If not enabled)

```bash
# Enable Firestore API for the project
gcloud services enable firestore.googleapis.com \
  --project=cr-salfagpt-ai-ft-prod

# Wait 2-3 minutes for propagation
```

---

### Option 3: Use Correct GCP Project (Alternative)

If you want to use the SAME Firestore database as localhost, you need to know which project localhost is using.

**Check localhost configuration:**
```bash
# In your local environment
cd /Users/alec/salfagpt
cat .env | grep GOOGLE_CLOUD_PROJECT
# Should show something like: GOOGLE_CLOUD_PROJECT=salfagpt
```

**Then update production to use the same project:**
```bash
# Update environment variable
gcloud run services update flow-production \
  --region=us-central1 \
  --update-env-vars="GOOGLE_CLOUD_PROJECT=salfagpt" \
  --project=salfacorp
```

---

## 🔍 Diagnosis Commands

### Check current configuration:
```bash
# 1. Check which project production is using
curl -s https://salfagpt.salfagestion.cl/api/health/firestore | jq '.checks.projectId'

# 2. Check if Firestore is accessible
curl -s https://salfagpt.salfagestion.cl/api/health/firestore | jq '.checks.authentication'

# 3. Check service account
gcloud run services describe flow-production \
  --region=us-central1 \
  --project=cr-salfagpt-ai-ft-prod \
  --format="value(spec.template.spec.serviceAccountName)"
```

---

## ✅ Verification

After applying the fix, verify:

```bash
# 1. Firestore health check should pass
curl -s https://salfagpt.salfagestion.cl/api/health/firestore | jq '.status'
# Should return: "healthy"

# 2. Try logging in
# Go to: https://salfagpt.salfagestion.cl
# Login with: alec@getaifactory.com or user@salfacloud.cl
# Should: Successfully login ✅
```

---

## 📋 Quick Fix Checklist

For whoever has access to `cr-salfagpt-ai-ft-prod` project:

- [ ] Enable Firestore API
- [ ] Grant Cloud Run service account `roles/datastore.user`
- [ ] Wait 2-3 minutes for propagation
- [ ] Test health check: `curl https://salfagpt.salfagestion.cl/api/health/firestore`
- [ ] Test login: Visit https://salfagpt.salfagestion.cl

---

## 🔑 Required Permissions

**Service Account Needs:**
- ✅ `roles/datastore.user` - For Firestore read/write
- ✅ `roles/iam.serviceAccountTokenCreator` - For authentication (if using Workload Identity)

**User Account Needs (to make these changes):**
- Project Editor or Owner of `cr-salfagpt-ai-ft-prod`

---

## 💡 Why This Happened

The production service was deployed with `GOOGLE_CLOUD_PROJECT=cr-salfagpt-ai-ft-prod` but:
1. Firestore API was not enabled in that project, OR
2. Service account permissions were not granted

This is a common issue when deploying to a new GCP project for the first time.

---

## 🎯 Expected Behavior After Fix

✅ **Login Flow:**
```
1. User visits: https://salfagpt.salfagestion.cl
2. Clicks "Continuar con Google"
3. Authenticates with Google OAuth
4. System extracts domain from email (getaifactory.com, salfacloud.cl)
5. System checks Firestore: getDomain(domainId)
6. Domain exists and is enabled ✅
7. User is logged in successfully ✅
```

✅ **Domain Verification:**
```
getaifactory.com → exists in Firestore → enabled: true → Allow login ✅
salfacloud.cl → exists in Firestore → enabled: true → Allow login ✅
```

---

## 📞 Need Help?

If you don't have access to project `cr-salfagpt-ai-ft-prod`, contact:
- The person who deployed the production service
- GCP Project Owner
- Your organization's GCP admin

**Show them this document** with the commands to run.

---

**Last Updated:** 2025-11-03  
**Status:** ⚠️ Awaiting permissions fix  
**Impact:** **HIGH** - Blocks all logins


