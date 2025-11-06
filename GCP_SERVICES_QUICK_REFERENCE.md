# GCP Services Quick Reference - Flow Platform

**Project:** salfagpt (82892384200)  
**Last Updated:** 2025-11-03  
**Status:** ✅ All services operational

---

## 🎯 Quick Commands

### Health Checks
```bash
# Firestore
curl -s https://salfagpt.salfagestion.cl/api/health/firestore | jq '.status'

# All checks
curl -s https://salfagpt.salfagestion.cl/api/health/firestore | jq '.'
```

### Service Management
```bash
# List services
gcloud run services list --project=salfagpt

# Describe production service
gcloud run services describe cr-salfagpt-ai-ft-prod \
  --region=us-east4 --project=salfagpt

# View environment variables
gcloud run services describe cr-salfagpt-ai-ft-prod \
  --region=us-east4 --project=salfagpt \
  --format="yaml(spec.template.spec.containers[0].env)"
```

### View Logs
```bash
# Recent logs
gcloud logging read "resource.type=cloud_run_revision" \
  --limit=50 --project=salfagpt --format=json

# Errors only
gcloud logging read "resource.type=cloud_run_revision AND severity>=ERROR" \
  --limit=20 --project=salfagpt
```

---

## 📊 Services Matrix

| Service | API | Project | Status | Permission | Files |
|---------|-----|---------|--------|------------|-------|
| **Firestore** | `firestore.googleapis.com` | salfagpt | ✅ | `datastore.owner` | 50+ files |
| **Cloud Storage** | `storage.googleapis.com` | salfagpt | ✅ | `storage.admin` | 4 files |
| **BigQuery** | `bigquery.googleapis.com` | salfagpt | ✅ | `bigquery.dataEditor` | 5 files |
| **Vertex AI** | `aiplatform.googleapis.com` | salfagpt | ✅ | via `editor` | 2 files |
| **Cloud Logging** | `logging.googleapis.com` | salfagpt | ✅ | `logging.logWriter` | automatic |
| **Secret Manager** | `secretmanager.googleapis.com` | salfagpt | ✅ | `secretmanager.secretAccessor` | automatic |
| **Gemini AI** | Gemini REST API | N/A | ✅ | API Key | 2 files |

---

## 🔑 Service Account

**Email:** `82892384200-compute@developer.gserviceaccount.com`  
**Type:** Default Compute Engine service account

**Roles:**
```
✅ roles/editor (broad project access)
✅ roles/datastore.owner (Firestore)
✅ roles/datastore.user (Firestore)
✅ roles/storage.admin (Cloud Storage)
✅ roles/storage.objectAdmin (Cloud Storage)
✅ roles/bigquery.dataEditor (BigQuery)
✅ roles/logging.logWriter (Logging)
✅ roles/secretmanager.secretAccessor (Secrets)
```

---

## 🗄️ Storage Locations

### Firestore
- **Database:** `(default)`
- **Location:** us-central1
- **Collections:** 20
- **Access:** https://console.cloud.google.com/firestore?project=salfagpt

### Cloud Storage
- **Bucket:** `salfagpt-uploads`
- **Location:** us-central1
- **Path:** `gs://salfagpt-uploads/documents/`
- **Access:** https://console.cloud.google.com/storage/browser?project=salfagpt

### BigQuery
- **Dataset:** `flow_analytics`
- **Location:** us-central1
- **Tables:** 5+
- **Access:** https://console.cloud.google.com/bigquery?project=salfagpt

---

## 🔧 Common Operations

### Update Environment Variable
```bash
gcloud run services update cr-salfagpt-ai-ft-prod \
  --region=us-east4 --project=salfagpt \
  --update-env-vars="KEY=value"
```

### Deploy New Version
```bash
cd /Users/alec/salfagpt
gcloud run deploy cr-salfagpt-ai-ft-prod \
  --source . \
  --region=us-east4 \
  --project=salfagpt \
  --allow-unauthenticated
```

### Grant Permission
```bash
gcloud projects add-iam-policy-binding salfagpt \
  --member="serviceAccount:82892384200-compute@developer.gserviceaccount.com" \
  --role="roles/ROLE_NAME"
```

---

## 🚨 Critical Configuration

### Environment Variables (Production)
```bash
GOOGLE_CLOUD_PROJECT=salfagpt                    # ⭐ MUST be project ID
PUBLIC_BASE_URL=https://salfagpt.salfagestion.cl
NODE_ENV=production
GOOGLE_CLIENT_ID=82892384200-va003qnnoj9q0jf19j3jf0vects0st9h.apps.googleusercontent.com
GOOGLE_AI_API_KEY=(secret)
GOOGLE_CLIENT_SECRET=(secret)
JWT_SECRET=(secret)
```

### OAuth Configuration
**Client ID:** 82892384200-va003qnnoj9q0jf19j3jf0vects0st9h  
**Redirect URI:** https://salfagpt.salfagestion.cl/auth/callback

---

## 📝 Quick Reference

### URLs
- **Production:** https://salfagpt.salfagestion.cl
- **Cloud Run:** https://cr-salfagpt-ai-ft-prod-3snj65wckq-uk.a.run.app
- **Localhost:** http://localhost:3000

### GCP Console
- **Project:** https://console.cloud.google.com/home/dashboard?project=salfagpt
- **Cloud Run:** https://console.cloud.google.com/run?project=salfagpt
- **Firestore:** https://console.cloud.google.com/firestore?project=salfagpt
- **IAM:** https://console.cloud.google.com/iam-admin/iam?project=salfagpt

---

**Created:** 2025-11-03  
**Status:** ✅ Production operational  
**Next Review:** When deploying to new environment


