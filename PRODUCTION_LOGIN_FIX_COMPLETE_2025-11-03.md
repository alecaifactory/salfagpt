# Production Login Fix - Complete Implementation

**Date:** 2025-11-03  
**Issue:** Users cannot login with getaifactory.com and salfacloud.cl domains  
**Production URL:** https://salfagpt.salfagestion.cl  
**Project:** salfagpt (82892384200)  
**Status:** ✅ FIXED

---

## 🚨 The Problem

**Symptom:**
- Users trying to login to https://salfagpt.salfagestion.cl
- Authenticate successfully with Google OAuth ✅
- See error: "Dominio Deshabilitado" (Domain Disabled) ❌
- Cannot access the platform ❌

**Affected Domains:**
- ❌ getaifactory.com
- ❌ salfacloud.cl

**Working:**
- ✅ localhost:3000 (same codebase, same Firestore database)

---

## 🔍 Root Cause Analysis

### Investigation Process

**Step 1: Checked health endpoint**
```bash
curl -s https://salfagpt.salfagestion.cl/api/health/firestore | jq '.'
```

**Result:**
```json
{
  "status": "error",
  "checks": {
    "projectId": {
      "status": "pass",
      "value": "cr-salfagpt-ai-ft-prod"  ← WRONG PROJECT!
    },
    "authentication": {
      "status": "fail",
      "message": "PERMISSION_DENIED on resource project cr-salfagpt-ai-ft-prod"
    }
  }
}
```

**Step 2: Identified the issue**

The environment variable was set to:
```bash
GOOGLE_CLOUD_PROJECT=cr-salfagpt-ai-ft-prod  ❌ WRONG (service name, not project)
```

But should be:
```bash
GOOGLE_CLOUD_PROJECT=salfagpt  ✅ CORRECT (actual GCP project)
```

### The Root Cause

**Production Cloud Run service had the wrong GCP project configured:**
- Environment variable: `GOOGLE_CLOUD_PROJECT=cr-salfagpt-ai-ft-prod`
- Actual project: `salfagpt`
- Result: Firestore client tried to access non-existent project
- Impact: All Firestore operations failed → Domain verification failed → Login blocked

### Why Localhost Worked

Localhost correctly uses:
- Project: `salfagpt` (from `.env.salfacorp`)
- Firestore database: Accessible ✅
- Domain verification: Works ✅
- Login: Success ✅

---

## ✅ The Fix

### What We Did

**1. Updated the environment variable:**
```bash
gcloud run services update cr-salfagpt-ai-ft-prod \
  --region=us-east4 \
  --project=salfagpt \
  --update-env-vars="GOOGLE_CLOUD_PROJECT=salfagpt"
```

**2. Deployed the updated service:**
- New revision: `cr-salfagpt-ai-ft-prod-00036-9rr`
- Environment: `GOOGLE_CLOUD_PROJECT=salfagpt` ✅
- Status: Deployed successfully

**3. Verified the fix:**
```bash
curl -s https://salfagpt.salfagestion.cl/api/health/firestore | jq '.status'
# Result: "healthy" ✅
```

---

## 🎯 Verification Results

### Before Fix

```json
{
  "status": "error",
  "checks": {
    "projectId": { "value": "cr-salfagpt-ai-ft-prod" },
    "authentication": { "status": "fail", "message": "PERMISSION_DENIED" },
    "firestoreRead": { "status": "fail" },
    "firestoreWrite": { "status": "fail" }
  }
}
```

### After Fix

```json
{
  "status": "healthy",
  "checks": {
    "projectId": { "value": "salfagpt", "status": "pass" },
    "authentication": { "status": "pass", "message": "Authenticated successfully (20 collections accessible)" },
    "firestoreRead": { "status": "pass", "latency": 134 },
    "firestoreWrite": { "status": "pass", "latency": 255 },
    "collections": { "status": "pass", "found": 20 }
  },
  "summary": {
    "totalChecks": 5,
    "passed": 5,
    "failed": 0
  }
}
```

✅ **All checks passing!**

---

## 📊 GCP Services & Permissions

### Project Configuration

**GCP Project:**
- **ID:** `salfagpt`
- **Number:** `82892384200`
- **Name:** SALFAGPT
- **Region:** us-east4 (primary), us-central1 (secondary)

### Cloud Run Service

**Service:** `cr-salfagpt-ai-ft-prod`
- **Region:** us-east4
- **URL:** https://cr-salfagpt-ai-ft-prod-3snj65wckq-uk.a.run.app
- **Custom Domain:** https://salfagpt.salfagestion.cl (via Load Balancer)
- **Latest Revision:** cr-salfagpt-ai-ft-prod-00036-9rr
- **Container Port:** 3000
- **Resources:** 2GiB RAM, 2 CPU
- **Scaling:** 1-10 instances

**Service Account:**
- Email: `82892384200-compute@developer.gserviceaccount.com`
- Type: Default Compute Engine service account

### Environment Variables (Production)

```bash
GOOGLE_CLOUD_PROJECT=salfagpt                              # ✅ Fixed
PUBLIC_BASE_URL=https://salfagpt.salfagestion.cl          # ✅ Correct
NODE_ENV=production                                        # ✅ Correct
GOOGLE_CLIENT_ID=82892384200-va003qnnoj9q0jf19j3jf0vects0st9h.apps.googleusercontent.com
GOOGLE_AI_API_KEY=(configured via secret)
GOOGLE_CLIENT_SECRET=(configured via secret)
JWT_SECRET=(configured via secret)
```

---

## 🔐 Service Account Permissions

The Cloud Run service account has the following IAM roles:

| Role | Purpose | Status |
|------|---------|--------|
| `roles/datastore.owner` | Full Firestore access (read/write/admin) | ✅ Granted |
| `roles/datastore.user` | Firestore read/write | ✅ Granted |
| `roles/editor` | Project-wide editor access | ✅ Granted |
| `roles/storage.admin` | Full Cloud Storage access | ✅ Granted |
| `roles/storage.objectAdmin` | Storage object management | ✅ Granted |
| `roles/bigquery.dataEditor` | BigQuery data editing | ✅ Granted |
| `roles/logging.logWriter` | Write application logs | ✅ Granted |
| `roles/secretmanager.secretAccessor` | Access secrets | ✅ Granted |

**Note:** Service account has very broad permissions (Editor role). All required services are accessible.

---

## 🗄️ GCP Services Used

### 1. Firestore (Database)

**Purpose:** Operational database for all user data

**Collections:**
- `conversations` - AI agent conversations
- `messages` - Chat message history
- `users` - User profiles and roles
- `domains` - Domain access control ⭐ (Critical for login)
- `context_sources` - Uploaded documents
- `document_chunks` - Text chunks for RAG
- `conversation_context` - Agent context state
- `user_settings` - User preferences
- `agent_configs` - Agent configurations
- 11 more collections...

**API:** `firestore.googleapis.com` ✅ Enabled  
**Permissions:** `roles/datastore.owner`, `roles/datastore.user` ✅ Granted  
**Status:** ✅ Healthy (134ms read, 255ms write)

---

### 2. Cloud Storage

**Purpose:** Store uploaded documents (PDFs, Excel, Word, etc.)

**Buckets:**
- `salfagpt-uploads` - User-uploaded documents
- `gs://salfagpt-uploads/documents/` - Document storage path

**API:** `storage.googleapis.com` ✅ Enabled  
**Permissions:** `roles/storage.admin`, `roles/storage.objectAdmin` ✅ Granted  
**Usage:** Upload PDFs → Extract with Gemini → Store chunks in Firestore

**Files Using Storage:**
- `src/lib/storage.ts` - Main storage operations
- `src/lib/chunked-extraction.ts` - Chunk storage
- `src/lib/extraction-checkpoint.ts` - State management
- `src/lib/tool-manager.ts` - File management

---

### 3. BigQuery (Analytics & Vector Search)

**Purpose:** Analytics warehouse and vector similarity search

**Dataset:** `flow_analytics`

**Tables:**
- `document_embeddings` - Vector embeddings for RAG search (768-dim)
- `conversations` - Conversation analytics
- `messages` - Message analytics
- `context_usage` - Context source usage
- `daily_metrics` - Aggregated stats

**API:** `bigquery.googleapis.com` ✅ Enabled  
**Permissions:** `roles/bigquery.dataEditor` ✅ Granted  
**Usage:** 
- Vector similarity search for RAG
- Analytics dashboards
- Usage tracking

**Files Using BigQuery:**
- `src/lib/analytics.ts` - Analytics queries
- `src/lib/bigquery-vector-search.ts` - Vector search
- `src/lib/bigquery-agent-search.ts` - Agent-specific search
- `src/lib/bigquery-agent-sync.ts` - Data synchronization
- `src/lib/gcp.ts` - BigQuery client

---

### 4. Vertex AI (Embeddings)

**Purpose:** Generate text embeddings for semantic search

**Model:** `text-embedding-004`  
**Dimensions:** 768  
**Usage:** Convert text chunks to vectors for similarity search

**API:** `aiplatform.googleapis.com` ✅ Enabled  
**Permissions:** Via `roles/editor` ✅ Granted  
**Cost:** Included with Gemini API

**Files Using Vertex AI:**
- `src/lib/embeddings.ts` - Generate embeddings
- `src/lib/vision-extraction.ts` - Vision API

---

### 5. Gemini AI (Chat Responses)

**Purpose:** Generate AI chat responses

**Models:**
- `gemini-2.5-flash` - Fast, economical (default)
- `gemini-2.5-pro` - Advanced, precise

**Authentication:** API Key (not IAM)  
**API Key:** `GOOGLE_AI_API_KEY` (configured via secret)  
**No IAM permissions required** (uses API key authentication)

**Files Using Gemini:**
- `src/lib/gemini.ts` - Main Gemini client
- `src/pages/api/conversations/[id]/messages.ts` - Chat API

---

### 6. Cloud Logging

**Purpose:** Application logs and monitoring

**API:** `logging.googleapis.com` ✅ Enabled  
**Permissions:** `roles/logging.logWriter` ✅ Granted  
**Usage:** Automatic logging from Cloud Run

**Files Using Logging:**
- `src/lib/logger.ts` - Structured logging
- All server-side code (console.log → Cloud Logging)

---

### 7. Secret Manager

**Purpose:** Store sensitive configuration

**Secrets Used:**
- `GOOGLE_AI_API_KEY` - Gemini API key
- `GOOGLE_CLIENT_SECRET` - OAuth secret
- `JWT_SECRET` - Session token signing key

**API:** `secretmanager.googleapis.com` ✅ Enabled  
**Permissions:** `roles/secretmanager.secretAccessor` ✅ Granted  
**Usage:** Secure configuration management

---

## 🔄 Complete Login Flow

### Before Fix (Broken)

```
1. User visits https://salfagpt.salfagestion.cl
2. Clicks "Continuar con Google"
3. Authenticates with Google ✅
4. Callback receives code ✅
5. System extracts domain from email ✅
6. System tries to verify domain in Firestore:
   → Firestore client connects to: cr-salfagpt-ai-ft-prod ❌ WRONG PROJECT
   → Project doesn't exist
   → PERMISSION_DENIED ❌
7. Domain verification fails
8. Shows "Dominio Deshabilitado" error ❌
9. Login blocked ❌
```

### After Fix (Working)

```
1. User visits https://salfagpt.salfagestion.cl
2. Clicks "Continuar con Google"
3. Authenticates with Google ✅
4. Callback receives code ✅
5. System extracts domain from email ✅
6. System verifies domain in Firestore:
   → Firestore client connects to: salfagpt ✅ CORRECT PROJECT
   → getDomain('getaifactory.com')
   → Domain exists and enabled: true ✅
7. Domain verification passes ✅
8. Creates/updates user in Firestore ✅
9. Generates JWT session token ✅
10. Sets secure HTTP-only cookie ✅
11. Redirects to /chat ✅
12. User is logged in successfully ✅
```

---

## 📝 Code Changes

### No Code Changes Required

The fix was purely **configuration**, not code:

**Changed:**
- Environment variable: `GOOGLE_CLOUD_PROJECT` 
- From: `cr-salfagpt-ai-ft-prod` (service name)
- To: `salfagpt` (actual GCP project ID)

**Method:**
```bash
gcloud run services update cr-salfagpt-ai-ft-prod \
  --region=us-east4 \
  --project=salfagpt \
  --update-env-vars="GOOGLE_CLOUD_PROJECT=salfagpt"
```

**New Files Created (for diagnostics):**
- `src/pages/api/health/domain-check.ts` - Domain verification diagnostic endpoint

---

## 🧪 Testing & Verification

### Test 1: Firestore Health Check

```bash
curl -s https://salfagpt.salfagestion.cl/api/health/firestore | jq '.status'
```

**Before:** `"error"`  
**After:** `"healthy"` ✅

**Full output:**
```json
{
  "status": "healthy",
  "checks": {
    "projectId": { "status": "pass", "value": "salfagpt" },
    "authentication": { "status": "pass", "message": "Authenticated successfully (20 collections accessible)" },
    "firestoreRead": { "status": "pass", "latency": 134 },
    "firestoreWrite": { "status": "pass", "latency": 255 },
    "collections": { "status": "pass", "found": 20 }
  },
  "summary": { "totalChecks": 5, "passed": 5, "failed": 0 }
}
```

### Test 2: Domain Verification

**Manual Test:**
1. Visit: https://salfagpt.salfagestion.cl
2. Click: "Continuar con Google"
3. Login with: alec@getaifactory.com
4. Result: ✅ Successfully logged in

**Domains Working:**
- ✅ getaifactory.com
- ✅ salfacloud.cl
- ✅ All other configured domains

### Test 3: Full Functionality

After successful login:
- ✅ Can create conversations
- ✅ Can send messages
- ✅ Can upload documents
- ✅ Can access all features

---

## 📊 Architecture Overview

### Production Infrastructure

```
┌─────────────────────────────────────────────────────────────┐
│              PRODUCTION ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🌐 DNS: salfagpt.salfagestion.cl (34.8.207.125)          │
│      ↓                                                      │
│  ⚡ Load Balancer: lb-salfagpt-ft-prod                     │
│      ↓                                                      │
│  🔄 Backend Service: be-cr-salfagpt-ai-ft-prod            │
│      ↓                                                      │
│  📍 Network Endpoint Group (us-east4)                      │
│      ↓                                                      │
│  ☁️  Cloud Run: cr-salfagpt-ai-ft-prod                    │
│      ├─ Project: salfagpt ✅                               │
│      ├─ Region: us-east4                                   │
│      ├─ Memory: 2GiB, CPU: 2                               │
│      └─ Service Account: 82892384200-compute@...           │
│          ↓                                                  │
│          ├─→ 🔥 Firestore (salfagpt) ✅                   │
│          ├─→ 🗄️ Cloud Storage (salfagpt-uploads) ✅       │
│          ├─→ 📊 BigQuery (flow_analytics) ✅               │
│          ├─→ 🤖 Vertex AI (embeddings) ✅                  │
│          ├─→ 📝 Cloud Logging ✅                           │
│          └─→ 🔐 Secret Manager ✅                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### GCP Project Details

**Project:** salfagpt  
**Project Number:** 82892384200  
**Organization:** SALFACORP

**Services Enabled:**
- ✅ Cloud Run API (`run.googleapis.com`)
- ✅ Firestore API (`firestore.googleapis.com`)
- ✅ Cloud Storage API (`storage.googleapis.com`)
- ✅ BigQuery API (`bigquery.googleapis.com`)
- ✅ Vertex AI API (`aiplatform.googleapis.com`)
- ✅ Cloud Logging API (`logging.googleapis.com`)
- ✅ Secret Manager API (`secretmanager.googleapis.com`)
- ✅ Cloud Build API (`cloudbuild.googleapis.com`)
- ✅ Artifact Registry API (`artifactregistry.googleapis.com`)

---

## 🔑 Service Account Permissions Summary

**Service Account:** `82892384200-compute@developer.gserviceaccount.com`

**IAM Roles Granted:**

| Role | Services Covered | Why Needed |
|------|------------------|------------|
| `roles/editor` | All project resources | Broad access for Cloud Run service |
| `roles/datastore.owner` | Firestore (full control) | Manage database collections |
| `roles/datastore.user` | Firestore (read/write) | User data operations ⭐ |
| `roles/storage.admin` | Cloud Storage (full control) | Manage file uploads |
| `roles/storage.objectAdmin` | Cloud Storage (objects) | Upload/download files |
| `roles/bigquery.dataEditor` | BigQuery (data editing) | Analytics and vector search |
| `roles/logging.logWriter` | Cloud Logging | Write application logs |
| `roles/secretmanager.secretAccessor` | Secret Manager | Access configuration secrets |

**Principle:** Service account has broad `Editor` role plus specific service roles for fine-grained control.

---

## 🔒 Security Configuration

### OAuth 2.0 Configuration

**Client ID:** `82892384200-va003qnnoj9q0jf19j3jf0vects0st9h`  
**Project:** salfagpt  
**Type:** Web application

**Authorized JavaScript Origins:**
```
1. http://localhost:3000                              (local dev)
2. https://salfagpt-3snj65wckq-uc.a.run.app          (Cloud Run - old)
3. https://salfagpt.salfagestion.cl                  (Custom domain - PRIMARY)
4. https://cr-salfagpt-ai-ft-prod-3snj65wckq-uk.a.run.app  (Cloud Run - current)
```

**Authorized Redirect URIs:**
```
1. http://localhost:3000/auth/callback
2. https://salfagpt-3snj65wckq-uc.a.run.app/auth/callback
3. https://salfagpt.salfagestion.cl/auth/callback    (PRIMARY)
4. https://cr-salfagpt-ai-ft-prod-3snj65wckq-uk.a.run.app/auth/callback
```

### Domain Access Control

**Enabled Domains (in Firestore `domains` collection):**
- ✅ getaifactory.com
- ✅ salfacloud.cl
- ✅ (other configured domains)

**Verification Logic:**
```typescript
// src/lib/domains.ts
export async function isUserDomainEnabled(userEmail: string): Promise<boolean> {
  const domainId = getDomainFromEmail(userEmail);
  const domain = await getDomain(domainId);  // Firestore read
  
  return domain && domain.enabled;  // Must exist AND be enabled
}
```

**Called During:**
- Login (prevents unauthorized domains)
- Every page load (re-validates domain status)

---

## 📚 Files Modified/Created

### Created (Diagnostic)
1. `src/pages/api/health/domain-check.ts` - Domain verification test endpoint

### Documentation Created
1. `FIX_PRODUCTION_LOGIN.md` - Quick reference
2. `PRODUCTION_LOGIN_DIAGNOSIS_2025-11-03.md` - Technical diagnosis
3. `PRODUCTION_PERMISSIONS_FIX_2025-11-03.md` - Permission setup guide
4. `scripts/setup-production-permissions.sh` - Automated setup script
5. `PRODUCTION_LOGIN_FIX_COMPLETE_2025-11-03.md` - This file

### No Code Changes
- ✅ All existing code works correctly
- ✅ Only environment variable changed
- ✅ 100% backward compatible

---

## 🎓 Lessons Learned

### 1. Environment Variable Naming

**WRONG:**
```bash
GOOGLE_CLOUD_PROJECT=cr-salfagpt-ai-ft-prod  # Service name, not project ID
```

**CORRECT:**
```bash
GOOGLE_CLOUD_PROJECT=salfagpt  # Actual GCP project ID
```

**Why it matters:**
- GCP project ID is used to initialize Firestore client
- Using wrong value = client tries to access non-existent project
- Results in PERMISSION_DENIED errors

### 2. Verify Project ID Format

**GCP Project IDs are:**
- Lowercase letters, numbers, hyphens
- Globally unique
- Usually short (e.g., `salfagpt`, not `cr-salfagpt-ai-ft-prod`)

**Service names often include:**
- Prefixes (cr-, be-, etc.)
- Region codes
- Random suffixes
- NOT the same as project ID!

### 3. Always Test After Deployment

**Critical health checks:**
```bash
# After ANY production deployment, ALWAYS test:
curl https://your-domain.com/api/health/firestore | jq '.status'

# Should return: "healthy"
# If not: Something is misconfigured
```

### 4. Service Account Permissions

**For Cloud Run to work, service account needs:**
- Firestore: `roles/datastore.user` (minimum)
- Cloud Storage: `roles/storage.objectAdmin` (if using file uploads)
- BigQuery: `roles/bigquery.dataEditor` (if using analytics)
- Vertex AI: Included in `roles/editor` or `roles/aiplatform.user`

**Check permissions:**
```bash
gcloud projects get-iam-policy YOUR_PROJECT \
  --flatten="bindings[].members" \
  --filter="bindings.members:SERVICE_ACCOUNT"
```

---

## 🔧 Maintenance Commands

### Check Service Status
```bash
# Health check
curl -s https://salfagpt.salfagestion.cl/api/health/firestore | jq '.status'

# List Cloud Run services
gcloud run services list --project=salfagpt

# Describe specific service
gcloud run services describe cr-salfagpt-ai-ft-prod \
  --region=us-east4 \
  --project=salfagpt
```

### View Logs
```bash
# Recent logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=cr-salfagpt-ai-ft-prod" \
  --limit=50 \
  --project=salfagpt \
  --format=json

# Errors only
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=cr-salfagpt-ai-ft-prod AND severity>=ERROR" \
  --limit=20 \
  --project=salfagpt
```

### Update Environment Variables
```bash
# Update any environment variable
gcloud run services update cr-salfagpt-ai-ft-prod \
  --region=us-east4 \
  --project=salfagpt \
  --update-env-vars="KEY=value"

# Remove environment variable
gcloud run services update cr-salfagpt-ai-ft-prod \
  --region=us-east4 \
  --project=salfagpt \
  --remove-env-vars="KEY"
```

---

## 📋 Pre-Deployment Checklist

For future deployments, ALWAYS verify:

### Environment Variables
- [ ] `GOOGLE_CLOUD_PROJECT` = actual GCP project ID (not service name)
- [ ] `PUBLIC_BASE_URL` = production URL
- [ ] `NODE_ENV` = production
- [ ] `GOOGLE_CLIENT_ID` = OAuth client ID
- [ ] All secrets configured

### GCP APIs Enabled
- [ ] Cloud Run API
- [ ] Firestore API
- [ ] Cloud Storage API
- [ ] BigQuery API (if using analytics)
- [ ] Vertex AI API (if using embeddings)
- [ ] Secret Manager API (if using secrets)

### Service Account Permissions
- [ ] `roles/datastore.user` (Firestore)
- [ ] `roles/storage.objectAdmin` (Cloud Storage)
- [ ] `roles/bigquery.dataEditor` (BigQuery)
- [ ] `roles/logging.logWriter` (Logging)
- [ ] `roles/secretmanager.secretAccessor` (Secrets)

### Post-Deployment Tests
- [ ] `/api/health/firestore` returns "healthy"
- [ ] Can login with test account
- [ ] Can create conversation
- [ ] Can send message
- [ ] No console errors

---

## ✅ Resolution Summary

**Issue:** Production login failing for getaifactory.com and salfacloud.cl domains  
**Root Cause:** Wrong GCP project ID in environment variable  
**Fix:** Updated `GOOGLE_CLOUD_PROJECT=salfagpt`  
**Time to Fix:** 5 minutes  
**Deployment:** Revision cr-salfagpt-ai-ft-prod-00036-9rr  
**Status:** ✅ RESOLVED

**Verification:**
- ✅ Firestore health check: healthy
- ✅ All collections accessible (20 found)
- ✅ Authentication working
- ✅ Domain verification working
- ✅ Login successful

---

## 🎯 Success Criteria - All Met

- ✅ Production uses correct GCP project (salfagpt)
- ✅ Firestore is accessible (healthy status)
- ✅ Domains can be verified
- ✅ Users can login with getaifactory.com
- ✅ Users can login with salfacloud.cl
- ✅ All features functional
- ✅ No code changes required
- ✅ 100% backward compatible

---

## 📞 Contacts

**Technical Lead:** alec@salfacloud.cl  
**Project:** salfagpt  
**Organization:** SALFACORP  
**Production URL:** https://salfagpt.salfagestion.cl

---

**Last Updated:** 2025-11-03  
**Issue Resolved:** ✅ YES  
**Deployed By:** alec@salfacloud.cl  
**Revision:** cr-salfagpt-ai-ft-prod-00036-9rr  
**Status:** 🟢 PRODUCTION HEALTHY





