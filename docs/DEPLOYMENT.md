# Flow - Deployment Guide

Complete guide for deploying Flow to Google Cloud Run.

## Table of Contents

- [Critical Lessons Learned](#critical-lessons-learned)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Initial Setup](#initial-setup)
- [Deployment Process](#deployment-process)
- [Post-Deployment](#post-deployment)
- [Troubleshooting](#troubleshooting)
- [Rollback](#rollback)

---

## 🚨 Critical Lessons Learned

### ⚠️ ALWAYS Configure Environment Variables FIRST

**The #1 cause of deployment failures is misconfigured environment variables.**

#### Order of Operations (DO THIS FIRST)

```bash
# 1️⃣ FIRST: Create secrets in Secret Manager
# 2️⃣ SECOND: Grant service account permissions
# 3️⃣ THIRD: Deploy application
# 4️⃣ FOURTH: Mount secrets in Cloud Run
# 5️⃣ FIFTH: Set PUBLIC_BASE_URL
# 6️⃣ SIXTH: Verify and test
```

### 🔐 Critical Environment Variables

These variables **MUST** be configured correctly, or authentication will fail:

| Variable | Type | Critical For | Failure Mode |
|----------|------|--------------|--------------|
| `GOOGLE_CLIENT_SECRET` | **Secret** | OAuth token exchange | `auth_processing_failed` |
| `JWT_SECRET` | **Secret** | Session encryption | `invalid_token` |
| `PUBLIC_BASE_URL` | **Env Var** | OAuth redirects | Redirects to `localhost` |
| `GOOGLE_AI_API_KEY` | **Secret** | Gemini AI | AI responses fail |
| `GOOGLE_CLOUD_PROJECT` | **Env Var** | Firestore, BigQuery | `Project not found` |
| `GOOGLE_CLIENT_ID` | **Env Var** | OAuth flow | OAuth fails to start |

### ❌ Common Mistakes (AVOID THESE)

1. **Deploying before configuring secrets**
   - Result: `auth_processing_failed`, `invalid_request`
   - Fix: Create secrets in Secret Manager FIRST

2. **Missing service account permissions**
   - Result: `Error fetching secret`, `5 NOT_FOUND`
   - Fix: Grant `secretAccessor` role to service account

3. **Wrong variable name**
   - Example: Using `GEMINI_API_KEY` instead of `GOOGLE_AI_API_KEY`
   - Result: API calls fail silently
   - Fix: Use EXACT names from `.env`

4. **Not setting PUBLIC_BASE_URL**
   - Result: OAuth redirects to `localhost:3000`
   - Fix: Set to production URL AFTER deployment

5. **Mixing secret and env var types**
   - Result: `Cannot update environment variable... different type`
   - Fix: Remove variable, then re-add with correct type

### ✅ Verification Checklist

After deployment, verify EVERY environment variable:

```bash
# Check all environment variables
gcloud run services describe flow-chat \
  --region us-central1 \
  --format="yaml(spec.template.spec.containers[0].env)" | grep -E "(name:|value:|valueFrom:)"

# Expected output should show:
# ✓ GOOGLE_CLOUD_PROJECT (value)
# ✓ GOOGLE_CLIENT_ID (value)
# ✓ PUBLIC_BASE_URL (value)
# ✓ GOOGLE_CLIENT_SECRET (secret reference)
# ✓ JWT_SECRET (secret reference)
# ✓ GOOGLE_AI_API_KEY (secret reference)
```

### 🎯 Secret Manager Best Practices

**Secrets in Secret Manager are MORE SECURE than environment variables.**

#### When to Use Secrets vs Environment Variables

| Use **Secret Manager** for: | Use **Environment Variables** for: |
|------------------------------|-------------------------------------|
| OAuth credentials | Project IDs |
| API keys | Region names |
| JWT secrets | Public URLs |
| Database passwords | Feature flags |
| Encryption keys | Non-sensitive config |

#### Creating Secrets Properly

```bash
# ✅ CORRECT: Create from .env file
GOOGLE_CLIENT_SECRET=$(cat .env | grep GOOGLE_CLIENT_SECRET | cut -d '=' -f2)
echo -n "$GOOGLE_CLIENT_SECRET" | gcloud secrets create google-client-secret \
  --data-file=- \
  --replication-policy="automatic"

# ✅ CORRECT: Grant permissions immediately
gcloud secrets add-iam-policy-binding google-client-secret \
  --member="serviceAccount:1030147139179-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# ✅ CORRECT: Mount in Cloud Run
gcloud run services update flow-chat \
  --region us-central1 \
  --update-secrets="GOOGLE_CLIENT_SECRET=google-client-secret:latest"
```

#### ❌ WRONG Way to Create Secrets

```bash
# ❌ WRONG: Passing secret directly in command (leaves in history)
gcloud secrets create jwt-secret --data-file=<(echo "my-secret-value")

# ❌ WRONG: Not granting permissions to service account
# (Results in: Error fetching secret)

# ❌ WRONG: Using old version number instead of :latest
--update-secrets="JWT_SECRET=jwt-secret:1"
```

### 📊 Complete Environment Variable Setup

Here's the COMPLETE setup you need before your first deployment:

```bash
# ═══════════════════════════════════════════════════════
#  STEP 1: Create ALL secrets in Secret Manager
# ═══════════════════════════════════════════════════════

# Load from .env
GOOGLE_CLIENT_SECRET=$(cat .env | grep GOOGLE_CLIENT_SECRET | cut -d '=' -f2)
JWT_SECRET=$(cat .env | grep JWT_SECRET | cut -d '=' -f2)
GOOGLE_AI_API_KEY=$(cat .env | grep GOOGLE_AI_API_KEY | cut -d '=' -f2)

# Create secrets
echo -n "$GOOGLE_CLIENT_SECRET" | gcloud secrets create google-client-secret --data-file=- --replication-policy="automatic"
echo -n "$JWT_SECRET" | gcloud secrets create jwt-secret --data-file=- --replication-policy="automatic"
echo -n "$GOOGLE_AI_API_KEY" | gcloud secrets create gemini-api-key --data-file=- --replication-policy="automatic"

# ═══════════════════════════════════════════════════════
#  STEP 2: Grant permissions to service account
# ═══════════════════════════════════════════════════════

SERVICE_ACCOUNT="1030147139179-compute@developer.gserviceaccount.com"

for SECRET in google-client-secret jwt-secret gemini-api-key; do
  gcloud secrets add-iam-policy-binding $SECRET \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/secretmanager.secretAccessor"
done

# ═══════════════════════════════════════════════════════
#  STEP 3: Deploy application with basic env vars
# ═══════════════════════════════════════════════════════

GOOGLE_CLIENT_ID=$(cat .env | grep GOOGLE_CLIENT_ID | cut -d '=' -f2)

gcloud run deploy flow-chat \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=gen-lang-client-0986191192,GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID,NODE_ENV=production"

# ═══════════════════════════════════════════════════════
#  STEP 4: Mount secrets in Cloud Run
# ═══════════════════════════════════════════════════════

gcloud run services update flow-chat \
  --region us-central1 \
  --update-secrets="GOOGLE_CLIENT_SECRET=google-client-secret:latest,JWT_SECRET=jwt-secret:latest,GOOGLE_AI_API_KEY=gemini-api-key:latest"

# ═══════════════════════════════════════════════════════
#  STEP 5: Set PUBLIC_BASE_URL
# ═══════════════════════════════════════════════════════

SERVICE_URL=$(gcloud run services describe flow-chat --region us-central1 --format='value(status.url)')

gcloud run services update flow-chat \
  --region us-central1 \
  --update-env-vars="PUBLIC_BASE_URL=$SERVICE_URL"

# ═══════════════════════════════════════════════════════
#  STEP 6: Verify everything is configured
# ═══════════════════════════════════════════════════════

echo ""
echo "✅ Verification:"
echo ""
gcloud run services describe flow-chat --region us-central1 --format="yaml(spec.template.spec.containers[0].env)" | grep -E "(name:|value:|valueFrom:)"
```

### 🔍 How to Debug Environment Variable Issues

```bash
# 1. Check what's configured in Cloud Run
gcloud run services describe flow-chat \
  --region us-central1 \
  --format="json" | jq '.spec.template.spec.containers[0].env'

# 2. Check logs for missing variables
gcloud logging read "resource.type=cloud_run_revision AND severity>=WARNING" \
  --limit 10 \
  --format="table(timestamp,textPayload)"

# 3. Test health endpoint
curl -s https://YOUR-SERVICE-URL/api/health/firestore | jq .

# 4. Check if service account has permissions
gcloud secrets get-iam-policy google-client-secret

# 5. Verify secret exists and has data
gcloud secrets versions access latest --secret="google-client-secret" | wc -c
# Should output > 0
```

### 💡 Pro Tips

1. **Use a deployment script** (like `deploy-production.sh`) that:
   - Reads from `.env` automatically
   - Creates secrets if they don't exist
   - Grants permissions
   - Deploys with all variables
   - Verifies configuration
   - Runs health checks

2. **Always verify after changes:**
   ```bash
   # After any env var change, ALWAYS run:
   curl -s $SERVICE_URL/api/health/firestore | jq .
   ```

3. **Keep .env file secure:**
   - Never commit to git
   - Store in password manager
   - Rotate secrets regularly
   - Use different values for dev/prod

4. **Document your setup:**
   - Keep a checklist of required variables
   - Document why each variable is needed
   - Include example values (not real ones!)

---

## Prerequisites

### Required Tools

```bash
# Google Cloud SDK
gcloud --version

# Node.js 20+
node --version

# npm
npm --version
```

### Required Accounts & Keys

1. **Google Cloud Project**
   - Project ID: `gen-lang-client-0986191192`
   - Billing enabled
   - Owner/Editor access

2. **Google AI Studio**
   - API Key for Gemini AI
   - Get from: https://aistudio.google.com/app/apikey

3. **Google OAuth 2.0**
   - Client ID and Client Secret
   - Configure in Google Cloud Console > APIs & Credentials

---

## Environment Variables

### Required Variables

Create a `.env` file in the project root:

```env
# GCP Project
GOOGLE_CLOUD_PROJECT=gen-lang-client-0986191192

# Gemini AI
GOOGLE_AI_API_KEY=AIzaSy...your-key-here

# OAuth 2.0
GOOGLE_CLIENT_ID=1030147139179-...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...your-secret-here

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=your-jwt-secret-here

# Base URL (will be set automatically in Cloud Run)
PUBLIC_BASE_URL=http://localhost:3000
```

### Variable Name Mapping

**⚠️ CRITICAL**: The variable name is `GOOGLE_AI_API_KEY`, NOT `GEMINI_API_KEY`.

| Local (.env) | Cloud Run | Purpose |
|---|---|---|
| `GOOGLE_AI_API_KEY` | `GOOGLE_AI_API_KEY` | Gemini AI API Key |
| `GOOGLE_CLIENT_ID` | `GOOGLE_CLIENT_ID` | OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Secret Manager | OAuth Client Secret |
| `JWT_SECRET` | Secret Manager | Session encryption |
| `GOOGLE_CLOUD_PROJECT` | `GOOGLE_CLOUD_PROJECT` | GCP Project ID |
| `PUBLIC_BASE_URL` | `PUBLIC_BASE_URL` | Base URL for OAuth |

---

## Initial Setup

### 1. Enable Required APIs

```bash
# Set project
gcloud config set project gen-lang-client-0986191192

# Enable APIs
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  firestore.googleapis.com \
  secretmanager.googleapis.com
```

### 2. Create Firestore Database

**⚠️ CRITICAL**: You must create the Firestore database before deployment.

```bash
# Create Firestore database in Native mode
gcloud firestore databases create \
  --location=us-central1 \
  --type=firestore-native
```

**Verify creation:**
```bash
gcloud firestore databases list
```

### 3. Configure Service Account Permissions

```bash
# Get the default compute service account
SERVICE_ACCOUNT="1030147139179-compute@developer.gserviceaccount.com"

# Grant Firestore permissions
gcloud projects add-iam-policy-binding gen-lang-client-0986191192 \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/datastore.user"

# Grant Secret Manager permissions
gcloud projects add-iam-policy-binding gen-lang-client-0986191192 \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/secretmanager.secretAccessor"
```

### 4. Create Secrets (Optional but Recommended)

```bash
# Create JWT Secret
echo -n "your-jwt-secret" | gcloud secrets create jwt-secret \
  --data-file=- \
  --replication-policy="automatic"

# Create Google Client Secret
echo -n "your-client-secret" | gcloud secrets create google-client-secret \
  --data-file=- \
  --replication-policy="automatic"

# Create Gemini API Key secret
echo -n "your-gemini-key" | gcloud secrets create gemini-api-key \
  --data-file=- \
  --replication-policy="automatic"

# Grant access to service account
for secret in jwt-secret google-client-secret gemini-api-key; do
  gcloud secrets add-iam-policy-binding $secret \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/secretmanager.secretAccessor"
done
```

### 5. Configure OAuth 2.0

1. Go to: https://console.cloud.google.com/apis/credentials
2. Select project: `gen-lang-client-0986191192`
3. Create OAuth 2.0 Client ID (if not exists):
   - Application type: **Web application**
   - Name: `Flow Production`
   
4. Add Authorized Redirect URIs:
   ```
   https://flow-chat-cno6l2kfga-uc.a.run.app/auth/callback
   ```

5. Save Client ID and Client Secret to `.env`

---

## Deployment Process

### Quick Deploy (Recommended)

```bash
# 1. Build project
npm run build

# 2. Deploy to Cloud Run (builds remotely)
gcloud run deploy flow-chat \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Manual Deploy with Environment Variables

```bash
# Load environment variables
GOOGLE_AI_KEY=$(cat .env | grep GOOGLE_AI_API_KEY | cut -d '=' -f2)
GOOGLE_CLIENT=$(cat .env | grep GOOGLE_CLIENT_ID | cut -d '=' -f2)

# Deploy with environment variables
gcloud run deploy flow-chat \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=gen-lang-client-0986191192,GOOGLE_AI_API_KEY=$GOOGLE_AI_KEY,GOOGLE_CLIENT_ID=$GOOGLE_CLIENT,NODE_ENV=production"
```

### Update Environment Variables

After deployment, update `PUBLIC_BASE_URL`:

```bash
# Get service URL
SERVICE_URL=$(gcloud run services describe flow-chat \
  --region us-central1 \
  --format='value(status.url)')

# Update PUBLIC_BASE_URL
gcloud run services update flow-chat \
  --region us-central1 \
  --update-env-vars="PUBLIC_BASE_URL=$SERVICE_URL"
```

---

## Post-Deployment

### 1. Health Check

```bash
# Get service URL
SERVICE_URL=$(gcloud run services describe flow-chat \
  --region us-central1 \
  --format='value(status.url)')

# Check Firestore health
curl -s $SERVICE_URL/api/health/firestore | jq .
```

**Expected Response:**
```json
{
  "status": "healthy",
  "checks": {
    "projectId": {
      "status": "pass",
      "value": "gen-lang-client-0986191192"
    },
    "authentication": {
      "status": "pass"
    },
    "firestoreRead": {
      "status": "pass",
      "latency": 45
    },
    "firestoreWrite": {
      "status": "pass",
      "latency": 67
    },
    "collections": {
      "status": "pass",
      "found": ["conversations", "messages", ...]
    }
  }
}
```

### 2. Test OAuth Login

```bash
# Test login redirect
curl -I $SERVICE_URL/auth/login
# Should return: HTTP/2 302 (redirect to Google)
```

### 3. Update OAuth Redirect URI

If not done earlier, add the redirect URI in Google Cloud Console:
```
https://YOUR-SERVICE-URL.run.app/auth/callback
```

### 4. Monitor Logs

```bash
# View logs
gcloud logging read "resource.type=cloud_run_revision" \
  --limit 50 \
  --format json

# Follow logs in real-time
gcloud alpha logging tail "resource.type=cloud_run_revision" \
  --format="value(textPayload)"
```

### 5. Verify Service

```bash
# List all environment variables
gcloud run services describe flow-chat \
  --region us-central1 \
  --format="value(spec.template.spec.containers[0].env)"
```

---

## Troubleshooting

### Common Issues

#### 1. `GOOGLE_CLOUD_PROJECT not set in environment`

**Problem**: Environment variable not being read in Cloud Run.

**Solution**: Code must prioritize `process.env` over `import.meta.env`:

```typescript
// ✅ CORRECT
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 
  (typeof import.meta !== 'undefined' && import.meta.env 
    ? import.meta.env.GOOGLE_CLOUD_PROJECT 
    : undefined);

// ❌ WRONG
const PROJECT_ID = import.meta.env.GOOGLE_CLOUD_PROJECT;
```

**Files to check:**
- `src/lib/firestore.ts`
- `src/lib/gemini.ts`
- `src/lib/analytics.ts`
- `src/lib/gcp.ts`
- `src/pages/api/health/firestore.ts`

#### 2. `Authentication failed: 5 NOT_FOUND`

**Problem**: Firestore database not created or service account lacks permissions.

**Solutions:**

a) Create Firestore database:
```bash
gcloud firestore databases create \
  --location=us-central1 \
  --type=firestore-native
```

b) Grant permissions:
```bash
gcloud projects add-iam-policy-binding gen-lang-client-0986191192 \
  --member="serviceAccount:1030147139179-compute@developer.gserviceaccount.com" \
  --role="roles/datastore.user"
```

c) Wait for permissions to propagate (can take 1-2 minutes):
```bash
sleep 60
```

#### 3. `Missing required parameter: redirect_uri` (OAuth)

**Problem**: OAuth redirect URI not configured.

**Solutions:**

a) Update `src/lib/auth.ts` to explicitly pass `redirect_uri`:
```typescript
return oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
  prompt: 'consent',
  redirect_uri: redirectUri, // ✅ Must be explicit
});
```

b) Configure in Google Cloud Console:
1. Go to: https://console.cloud.google.com/apis/credentials
2. Edit OAuth 2.0 Client ID
3. Add Authorized Redirect URI:
   ```
   https://YOUR-SERVICE-URL.run.app/auth/callback
   ```

#### 4. `Cannot update environment variable [X] to string literal because it has already been set with a different type`

**Problem**: Variable was set as a secret, trying to change to env var (or vice versa).

**Solutions:**

a) Remove the variable first:
```bash
gcloud run services update flow-chat \
  --region us-central1 \
  --remove-env-vars="VARIABLE_NAME"
```

b) Then add it back with the correct type:
```bash
# As environment variable
gcloud run services update flow-chat \
  --region us-central1 \
  --update-env-vars="VARIABLE_NAME=value"

# OR as secret
gcloud run services update flow-chat \
  --region us-central1 \
  --set-secrets="VARIABLE_NAME=secret-name:latest"
```

c) Or clear all and reconfigure:
```bash
gcloud run services update flow-chat \
  --region us-central1 \
  --clear-env-vars \
  --clear-secrets
```

#### 5. Build Fails: `invalid image name`

**Problem**: Using local Docker build with invalid image name.

**Solution**: Use `gcloud run deploy --source .` to build remotely:
```bash
# ✅ CORRECT: Remote build
gcloud run deploy flow-chat --source .

# ❌ WRONG: Local Docker build (requires Docker installed)
docker build -t image-name .
docker push image-name
```

#### 6. Health Check Shows Firestore Errors But App Works

**Problem**: Firestore database might not be fully initialized or collections don't exist yet.

**Solution**: 
- First user login/signup will create initial collections
- Or manually create a test document:
```bash
gcloud firestore documents create \
  --project=gen-lang-client-0986191192 \
  --database='(default)' \
  --collection='conversations' \
  --document-id='test-doc'
```

### Debugging Commands

```bash
# View service description
gcloud run services describe flow-chat --region us-central1

# Check service account
gcloud run services describe flow-chat \
  --region us-central1 \
  --format="value(spec.template.spec.serviceAccountName)"

# List IAM bindings
gcloud projects get-iam-policy gen-lang-client-0986191192 \
  --flatten="bindings[].members" \
  --format="table(bindings.role)"

# Check Firestore database
gcloud firestore databases list

# View logs with filters
gcloud logging read "resource.type=cloud_run_revision AND severity>=ERROR" \
  --limit 20 \
  --format json

# Check environment variables
gcloud run services describe flow-chat \
  --region us-central1 \
  --format="json" | jq '.spec.template.spec.containers[0].env'
```

---

## Rollback

### Rollback to Previous Revision

```bash
# 1. List revisions
gcloud run revisions list \
  --service flow-chat \
  --region us-central1

# 2. Identify last working revision (e.g., flow-chat-00009-7lg)
LAST_GOOD_REVISION="flow-chat-00009-7lg"

# 3. Rollback
gcloud run services update-traffic flow-chat \
  --to-revisions=$LAST_GOOD_REVISION=100 \
  --region us-central1
```

### Rollback to Specific Git Commit

```bash
# 1. Checkout commit
git checkout <commit-hash>

# 2. Redeploy
gcloud run deploy flow-chat --source . --region us-central1
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] `.env` file configured with all required variables
- [ ] `npm run build` succeeds with 0 errors
- [ ] `npm run type-check` passes
- [ ] Tested locally with `npm run dev`
- [ ] OAuth redirect URI configured in Google Cloud Console
- [ ] Firestore database created
- [ ] Service account permissions granted

### During Deployment

- [ ] `gcloud run deploy` completes successfully
- [ ] Service URL obtained
- [ ] `PUBLIC_BASE_URL` updated in Cloud Run
- [ ] Environment variables verified

### Post-Deployment

- [ ] Health check passes: `/api/health/firestore`
- [ ] OAuth login redirect works: `/auth/login`
- [ ] Can log in with Google account
- [ ] Can create conversation
- [ ] Can send message and get AI response
- [ ] Firestore data persists after logout/login
- [ ] Logs show no critical errors

---

## Quick Reference

### Service Information

- **Service Name**: `flow-chat`
- **Project ID**: `gen-lang-client-0986191192`
- **Region**: `us-central1`
- **Service URL**: https://flow-chat-cno6l2kfga-uc.a.run.app

### Common Commands

```bash
# Deploy
gcloud run deploy flow-chat --source . --region us-central1

# Update environment variable
gcloud run services update flow-chat \
  --region us-central1 \
  --update-env-vars="KEY=value"

# View logs
gcloud logging read "resource.type=cloud_run_revision" --limit 50

# Health check
curl -s https://flow-chat-cno6l2kfga-uc.a.run.app/api/health/firestore | jq .

# Rollback
gcloud run services update-traffic flow-chat \
  --to-revisions=REVISION_NAME=100 \
  --region us-central1
```

---

## Security Best Practices

1. **Secrets Management**
   - Store sensitive values in Secret Manager
   - Never commit secrets to git
   - Rotate secrets regularly

2. **Service Account**
   - Use principle of least privilege
   - Grant only necessary roles
   - Audit permissions regularly

3. **OAuth Configuration**
   - Use HTTPS only
   - Validate redirect URIs
   - Keep Client Secret secure

4. **Firestore Security Rules**
   - Deploy security rules: `firebase deploy --only firestore:rules`
   - Test rules thoroughly
   - Review access patterns

---

## Monitoring & Maintenance

### Set Up Alerts

```bash
# Create uptime check
gcloud monitoring uptime create flow-chat-uptime \
  --resource-type="uptime-url" \
  --check-interval=300 \
  --monitored-resource-path="https://flow-chat-cno6l2kfga-uc.a.run.app"
```

### Regular Maintenance

- **Weekly**: Review logs for errors
- **Monthly**: Check costs and optimize
- **Quarterly**: Update dependencies, rotate secrets
- **Annually**: Review security rules and permissions

---

## Support & Resources

### Documentation
- [Google Cloud Run Docs](https://cloud.google.com/run/docs)
- [Firestore Docs](https://firebase.google.com/docs/firestore)
- [OAuth 2.0 Setup](https://developers.google.com/identity/protocols/oauth2)

### Project Rules
- `.cursor/rules/deployment.mdc` - Deployment conventions
- `.cursor/rules/backend.mdc` - Backend architecture
- `.cursor/rules/firestore.mdc` - Firestore schema

### Internal Docs
- `docs/LocalToProduction.md` - Detailed deployment guide
- `docs/OAUTH_PRODUCTION_FIX.md` - OAuth troubleshooting
- `.env.example` - Environment variable template

---

**Last Updated**: 2025-10-12  
**Version**: 1.0.0  
**Status**: ✅ Production Ready

