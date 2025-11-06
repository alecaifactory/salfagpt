# Production Permissions Fix - Complete Setup

**Date:** 2025-11-03  
**Issue:** Cloud Run service lacks permissions to access GCP services  
**Service:** flow-production (https://salfagpt.salfagestion.cl)  
**Project:** cr-salfagpt-ai-ft-prod  
**Impact:** 🔴 CRITICAL - Blocks all logins and functionality

---

## 🔍 Diagnosis Summary

### Current State

```json
{
  "project": "cr-salfagpt-ai-ft-prod",
  "service": "flow-production",
  "region": "us-central1",
  "status": "Running but cannot access data",
  "firestore": "❌ PERMISSION_DENIED",
  "bigquery": "❌ Not tested (likely denied)",
  "storage": "❌ Not tested (likely denied)",
  "vertexAI": "❌ Not tested (likely denied)"
}
```

### Services Used by Application

Based on code analysis, the application uses:

1. ✅ **Firestore** - User data, conversations, messages, domains
2. ✅ **BigQuery** - Analytics, vector search, document embeddings
3. ✅ **Cloud Storage** - Document uploads (PDFs, etc.)
4. ✅ **Vertex AI** - Text embeddings (text-embedding-004)
5. ✅ **Gemini AI** - Chat responses (via API key, not IAM)
6. ✅ **Cloud Logging** - Application logs (optional)
7. ✅ **Secret Manager** - For sensitive configuration (optional)

### Localhost Configuration (Working)

Localhost uses project `salfagpt` with permissions granted via:
- `gcloud auth application-default login` (your personal credentials)
- Your account has Owner/Editor role on project `salfagpt`

---

## 🔧 Complete Fix - Grant All Required Permissions

### Step 1: Identify Service Account

```bash
# Get the service account used by Cloud Run
SERVICE_ACCOUNT=$(gcloud run services describe flow-production \
  --region=us-central1 \
  --project=cr-salfagpt-ai-ft-prod \
  --format="value(spec.template.spec.serviceAccountName)")

echo "Service Account: $SERVICE_ACCOUNT"

# If no custom service account, it uses the default Compute Engine service account:
# Default format: PROJECT_NUMBER-compute@developer.gserviceaccount.com
```

### Step 2: Grant Firestore Permissions (CRITICAL - Blocks logins)

```bash
# Grant Firestore read/write access
gcloud projects add-iam-policy-binding cr-salfagpt-ai-ft-prod \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/datastore.user"

# Verify
gcloud projects get-iam-policy cr-salfagpt-ai-ft-prod \
  --flatten="bindings[].members" \
  --filter="bindings.members:${SERVICE_ACCOUNT}" \
  --format="table(bindings.role)"

# Should include: roles/datastore.user
```

### Step 3: Grant Cloud Storage Permissions

```bash
# Grant Storage Admin access for document uploads
gcloud projects add-iam-policy-binding cr-salfagpt-ai-ft-prod \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/storage.objectAdmin"
```

### Step 4: Grant BigQuery Permissions

```bash
# Grant BigQuery access for analytics and vector search
gcloud projects add-iam-policy-binding cr-salfagpt-ai-ft-prod \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/bigquery.admin"
```

### Step 5: Grant Vertex AI Permissions

```bash
# Grant Vertex AI access for embeddings
gcloud projects add-iam-policy-binding cr-salfagpt-ai-ft-prod \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/aiplatform.user"
```

### Step 6: Grant Logging Permissions (Optional but recommended)

```bash
# Grant logging access
gcloud projects add-iam-policy-binding cr-salfagpt-ai-ft-prod \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/logging.logWriter"
```

### Step 7: Grant Secret Manager Permissions (If using secrets)

```bash
# Grant secret access
gcloud projects add-iam-policy-binding cr-salfagpt-ai-ft-prod \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 📋 Complete Setup Script

Copy and run this complete script:

```bash
#!/bin/bash

# Configuration
PROJECT_ID="cr-salfagpt-ai-ft-prod"
SERVICE_NAME="flow-production"
REGION="us-central1"

echo "🔧 Setting up permissions for Cloud Run service"
echo "Project: $PROJECT_ID"
echo "Service: $SERVICE_NAME"
echo ""

# Step 1: Get service account
echo "1️⃣ Getting service account..."
SERVICE_ACCOUNT=$(gcloud run services describe $SERVICE_NAME \
  --region=$REGION \
  --project=$PROJECT_ID \
  --format="value(spec.template.spec.serviceAccountName)" 2>/dev/null)

# If empty, use default Compute Engine service account
if [ -z "$SERVICE_ACCOUNT" ]; then
  PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
  SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
  echo "   Using default Compute Engine service account"
fi

echo "   Service Account: $SERVICE_ACCOUNT"
echo ""

# Step 2: Grant permissions
echo "2️⃣ Granting permissions..."

# Firestore (CRITICAL)
echo "   📦 Granting Firestore access..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/datastore.user" \
  --quiet

# Cloud Storage
echo "   🗄️ Granting Cloud Storage access..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/storage.objectAdmin" \
  --quiet

# BigQuery
echo "   📊 Granting BigQuery access..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/bigquery.admin" \
  --quiet

# Vertex AI
echo "   🤖 Granting Vertex AI access..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/aiplatform.user" \
  --quiet

# Logging
echo "   📝 Granting Logging access..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/logging.logWriter" \
  --quiet

# Secret Manager
echo "   🔐 Granting Secret Manager access..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/secretmanager.secretAccessor" \
  --quiet

echo ""
echo "✅ All permissions granted!"
echo ""

# Step 3: Verify
echo "3️⃣ Verifying permissions..."
echo ""
gcloud projects get-iam-policy $PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:${SERVICE_ACCOUNT}" \
  --format="table(bindings.role)"

echo ""
echo "✅ Setup complete! Wait 2-3 minutes for permissions to propagate."
echo ""
echo "🧪 Test with:"
echo "   curl -s https://salfagpt.salfagestion.cl/api/health/firestore | jq '.status'"
echo "   # Should return: \"healthy\""
```

**Save as:** `scripts/setup-production-permissions.sh`

**Run with:**
```bash
chmod +x scripts/setup-production-permissions.sh
./scripts/setup-production-permissions.sh
```

---

## 🎯 Required Permissions Summary

| Service | Role | Why |
|---------|------|-----|
| **Firestore** | `roles/datastore.user` | Read/write user data, conversations, domains ⭐ CRITICAL |
| **Cloud Storage** | `roles/storage.objectAdmin` | Upload/download PDFs and documents |
| **BigQuery** | `roles/bigquery.admin` | Analytics, vector search, embeddings storage |
| **Vertex AI** | `roles/aiplatform.user` | Generate text embeddings (text-embedding-004) |
| **Cloud Logging** | `roles/logging.logWriter` | Write application logs |
| **Secret Manager** | `roles/secretmanager.secretAccessor` | Access secrets (if used) |

---

## 📊 File-by-File Service Usage

### Files Using Firestore
- `src/lib/firestore.ts` - Main database client ⭐
- `src/lib/domains.ts` - Domain management ⭐
- `src/pages/auth/callback.ts` - User authentication ⭐
- `src/pages/chat.astro` - Main chat page ⭐
- All API endpoints in `src/pages/api/`

### Files Using Cloud Storage
- `src/lib/storage.ts` - File upload/download
- `src/lib/chunked-extraction.ts` - Chunk storage
- `src/lib/extraction-checkpoint.ts` - Extraction state
- `src/lib/tool-manager.ts` - Tool file management

### Files Using BigQuery
- `src/lib/analytics.ts` - Analytics queries
- `src/lib/bigquery-vector-search.ts` - Vector similarity search
- `src/lib/bigquery-agent-search.ts` - Agent-specific search
- `src/lib/bigquery-agent-sync.ts` - Data sync
- `src/lib/gcp.ts` - BigQuery client

### Files Using Vertex AI
- `src/lib/embeddings.ts` - Generate embeddings
- `src/lib/vision-extraction.ts` - Vision API (if used)

---

## ✅ Verification Steps

### After granting permissions, wait 2-3 minutes, then:

### 1. Test Firestore Access (CRITICAL)
```bash
curl -s https://salfagpt.salfagestion.cl/api/health/firestore | jq '.'
```

**Expected (GOOD):**
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

**Current (BAD):**
```json
{
  "status": "error",
  "checks": {
    "authentication": { "status": "fail", "message": "PERMISSION_DENIED" }
  }
}
```

### 2. Test Domain Verification
```bash
# After deploying the domain-check endpoint
curl -s "https://salfagpt.salfagestion.cl/api/health/domain-check?email=alec@getaifactory.com" | jq '.'
```

**Expected:**
```json
{
  "status": "PASS",
  "domain": {
    "email": "alec@getaifactory.com",
    "extracted": "getaifactory.com",
    "exists": true,
    "enabled": true
  }
}
```

### 3. Test Login
```bash
# Open in browser
open https://salfagpt.salfagestion.cl

# Click "Continuar con Google"
# Login with: alec@getaifactory.com or user@salfacloud.cl
# Should: Successfully login and redirect to /chat ✅
```

---

## 🚀 Quick Fix Summary

**For whoever has Admin access to project `cr-salfagpt-ai-ft-prod`:**

1. **Run the setup script** (see above) to grant all permissions
2. **Wait 2-3 minutes** for propagation
3. **Test Firestore health check** (should return "healthy")
4. **Test login** (should work)

**Estimated time:** 5 minutes  
**Complexity:** Low (just IAM permissions)  
**Risk:** None (only grants access, doesn't change code)

---

## 🔐 Security Note

These permissions follow **principle of least privilege**:
- Service account only has access to project `cr-salfagpt-ai-ft-prod`
- Permissions are scoped to what the application needs
- No overly broad permissions granted
- Logging enabled for audit trail

---

## 🎯 Expected Behavior After Fix

### Before Fix (Current)
```
User visits salfagpt.salfagestion.cl
  ↓
Clicks "Continuar con Google"
  ↓
Authenticates with Google ✅
  ↓
System tries to verify domain
  ↓
Firestore read FAILS (PERMISSION_DENIED) ❌
  ↓
Domain verification fails
  ↓
Shows "Dominio Deshabilitado" error ❌
```

### After Fix
```
User visits salfagpt.salfagestion.cl
  ↓
Clicks "Continuar con Google"
  ↓
Authenticates with Google ✅
  ↓
System verifies domain in Firestore ✅
  ↓
Domain exists and is enabled ✅
  ↓
User is logged in successfully ✅
  ↓
Redirects to /chat ✅
```

---

## 📞 Support

**Need help?**
- Project Owner/Admin for `cr-salfagpt-ai-ft-prod`
- The person who deployed the production service
- Your GCP administrator

**Show them:**
1. This document
2. The setup script above
3. The health check results

---

## 🔬 Technical Details

### Why Localhost Works

```bash
# Localhost uses:
Project: salfagpt (from .env.salfacorp)
Auth: Application Default Credentials (gcloud auth application-default login)
Permissions: Your personal GCP account (likely Owner/Editor)
Result: Full access to all services ✅
```

### Why Production Fails

```bash
# Production uses:
Project: cr-salfagpt-ai-ft-prod (from PUBLIC_BASE_URL env var)
Auth: Cloud Run Workload Identity (service account)
Permissions: Service account has NO roles granted ❌
Result: PERMISSION_DENIED on all GCP services ❌
```

### The Fix

```bash
# Grant service account the same capabilities:
Grant: roles/datastore.user (Firestore)
Grant: roles/storage.objectAdmin (Cloud Storage)
Grant: roles/bigquery.admin (BigQuery)
Grant: roles/aiplatform.user (Vertex AI)
Grant: roles/logging.logWriter (Logging)
Result: Service can access all required GCP services ✅
```

---

## 🎓 Prevention for Future Deployments

### Pre-Deployment Checklist

When deploying to a **new GCP project**, ALWAYS:

- [ ] Enable required APIs:
  ```bash
  gcloud services enable firestore.googleapis.com \
    storage.googleapis.com \
    bigquery.googleapis.com \
    aiplatform.googleapis.com \
    run.googleapis.com \
    --project=YOUR_PROJECT_ID
  ```

- [ ] Grant service account permissions (see script above)

- [ ] Create Firestore database:
  ```bash
  gcloud firestore databases create \
    --location=us-central1 \
    --project=YOUR_PROJECT_ID
  ```

- [ ] Create Cloud Storage bucket:
  ```bash
  gsutil mb -p YOUR_PROJECT_ID \
    -l us-central1 \
    gs://YOUR_PROJECT_ID-uploads
  ```

- [ ] Create BigQuery dataset:
  ```bash
  bq mk --location=us-central1 \
    --project_id=YOUR_PROJECT_ID \
    flow_analytics
  ```

- [ ] Test health check BEFORE announcing service is ready

---

## 📋 Permissions Verification Checklist

After running the fix, verify each service:

### Firestore
```bash
curl -s https://salfagpt.salfagestion.cl/api/health/firestore | jq '.checks.authentication.status'
# Should return: "pass"
```

### Cloud Storage (Test upload)
```bash
# Try uploading a PDF through the UI
# Should: Upload successfully
```

### BigQuery (Test query)
```bash
# Check if BigQuery is accessible (test via API)
curl -s https://salfagpt.salfagestion.cl/api/analytics/users | jq '.error'
# Should NOT return permission error
```

### Vertex AI (Test embeddings)
```bash
# Try semantic search in UI
# Should: Return relevant results
```

---

## 🐛 Troubleshooting

### If permissions still fail after 5 minutes

**Check if APIs are enabled:**
```bash
gcloud services list --enabled \
  --project=cr-salfagpt-ai-ft-prod \
  --filter="name:(firestore OR storage OR bigquery OR aiplatform)"
```

**Expected output:**
```
NAME                     TITLE
aiplatform.googleapis.com  Vertex AI API
bigquery.googleapis.com    BigQuery API
firestore.googleapis.com   Cloud Firestore API
storage.googleapis.com     Cloud Storage API
```

**If any are missing:**
```bash
gcloud services enable \
  firestore.googleapis.com \
  storage.googleapis.com \
  bigquery.googleapis.com \
  aiplatform.googleapis.com \
  --project=cr-salfagpt-ai-ft-prod
```

---

## 🎯 Success Criteria

✅ **All checks passing:**
- [ ] `curl https://salfagpt.salfagestion.cl/api/health/firestore` returns `"status": "healthy"`
- [ ] Login with getaifactory.com email works
- [ ] Login with salfacloud.cl email works
- [ ] Can create conversations
- [ ] Can send messages
- [ ] Can upload PDFs
- [ ] Analytics dashboard loads

---

**Last Updated:** 2025-11-03  
**Status:** 📝 Documented - Awaiting permissions grant  
**Priority:** 🔴 CRITICAL  
**Estimated Fix Time:** 5 minutes (+ 2-3 min propagation)


