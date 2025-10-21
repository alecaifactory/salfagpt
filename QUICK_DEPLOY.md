# Quick Deploy to Cloud Run - SalfaGPT

## 🚀 One-Command Deployment (After Initial Setup)

```bash
gcloud run deploy flow-chat --source . --project=salfagpt --region=us-central1
```

That's it! Environment variables persist between deployments.

---

## 🔧 Initial Setup (One-Time Only)

### 1. Create Cloud Storage Bucket
```bash
gsutil mb -p salfagpt -l us-central1 gs://salfagpt-uploads
```

### 2. Configure OAuth in Google Console
1. Go to: https://console.cloud.google.com/apis/credentials?project=salfagpt
2. Edit OAuth Client ID: `82892384200-va003qnnoj9q0jf19j3jf0vects0st9h`
3. Add to **Authorized JavaScript Origins:**
   - `https://flow-chat-3snj65wckq-uc.a.run.app`
4. Add to **Authorized Redirect URIs:**
   - `https://flow-chat-3snj65wckq-uc.a.run.app/auth/callback`
5. Save and wait 5-10 minutes

### 3. Set Environment Variables (ALL 7 Required)
```bash
# Clear existing (to avoid conflicts)
gcloud run services update flow-chat \
  --project=salfagpt \
  --region=us-central1 \
  --clear-env-vars \
  --clear-secrets

# Get secrets from .env
GOOGLE_AI_KEY=$(grep "^GOOGLE_AI_API_KEY=" .env | cut -d'=' -f2)
GOOGLE_CLIENT_ID=$(grep "^GOOGLE_CLIENT_ID=" .env | cut -d'=' -f2)
GOOGLE_CLIENT_SECRET=$(grep "^GOOGLE_CLIENT_SECRET=" .env | cut -d'=' -f2)
JWT_SECRET=$(grep "^JWT_SECRET=" .env | cut -d'=' -f2)

# Set ALL at once
gcloud run services update flow-chat \
  --project=salfagpt \
  --region=us-central1 \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=salfagpt,NODE_ENV=production,PUBLIC_BASE_URL=https://flow-chat-3snj65wckq-uc.a.run.app,GOOGLE_AI_API_KEY=$GOOGLE_AI_KEY,GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID,GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET,JWT_SECRET=$JWT_SECRET"
```

---

## ✅ Verification

### Quick Health Check
```bash
curl https://flow-chat-3snj65wckq-uc.a.run.app/api/health/firestore
```

Expected: `"status": "healthy"`

### Test OAuth
Open in browser: https://flow-chat-3snj65wckq-uc.a.run.app/auth/login

Should redirect to Google and work.

---

## 🆘 If Something Breaks

### Check Environment Variables
```bash
gcloud run services describe flow-chat \
  --project=salfagpt \
  --region=us-central1 \
  --format=json | jq -r '.spec.template.spec.containers[0].env[] | "\(.name): \(.value)"' | sort
```

Should list all 7 variables.

### Check Logs
```bash
gcloud logging tail "resource.type=cloud_run_revision" \
  --project=salfagpt \
  --limit=20
```

Look for errors.

### Rollback
```bash
gcloud run revisions list --service=flow-chat --project=salfagpt --region=us-central1
# Pick previous working revision
gcloud run services update-traffic flow-chat \
  --to-revisions=PREVIOUS_REVISION=100 \
  --project=salfagpt \
  --region=us-central1
```

---

## 📚 Full Documentation

- **Complete Guide:** `docs/CLOUD_RUN_OAUTH_SETUP_COMPLETE.md`
- **Cursor Rule:** `.cursor/rules/cloud-run-deployment.mdc`
- **Deployment History:** `DEPLOYMENT_SUCCESS_2025-10-21.md`

---

**Service URL:** https://flow-chat-3snj65wckq-uc.a.run.app  
**Status:** ✅ Working  
**Last Deploy:** 2025-10-21

