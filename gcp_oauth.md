# 🔐 GCP OAuth Configuration & Deployment Guide

## 🎯 Overview

This document provides a complete guide for configuring Google OAuth authentication for the Salfacorp application deployed on Google Cloud Run. It covers the OAuth setup, environment variable configuration, deployment process, and troubleshooting.

**Last Updated:** October 22, 2025  
**Status:** ✅ Production deployment successful

---

## 📋 Table of Contents

1. [OAuth Configuration in Google Cloud Console](#oauth-configuration)
2. [Environment Variables Setup](#environment-variables)
3. [Deployment Process](#deployment-process)
4. [Traffic Management](#traffic-management)
5. [Troubleshooting](#troubleshooting)
6. [Verification & Testing](#verification)

---

## 🔐 OAuth Configuration

### Step 1: Create OAuth 2.0 Client ID

**Location:** Google Cloud Console → APIs & Services → Credentials

1. **Navigate to:**
   ```
   https://console.cloud.google.com/apis/credentials?project=salfagpt
   ```

2. **Click:** "+ CREATE CREDENTIALS" → "OAuth client ID"

3. **Configure:**
   - **Application type:** Web application
   - **Name:** SalfaGPT (or your preferred name)

4. **Authorized JavaScript origins:**
   ```
   http://localhost:3000
   https://salfagpt-3snj65wckq-uc.a.run.app
   ```
   
   Or for your custom domain:
   ```
   http://localhost:3000
   https://your-custom-domain.com
   ```

5. **Authorized redirect URIs:**
   ```
   http://localhost:3000/auth/callback
   https://salfagpt-3snj65wckq-uc.a.run.app/auth/callback
   ```
   
   ⚠️ **Critical:** Must include `/auth/callback` (not just `/callback`)

6. **Click "CREATE"**

7. **Copy credentials:**
   - Client ID (format: `XXXXXXXX-xxxxx.apps.googleusercontent.com`)
   - Client Secret (format: `GOCSPX-xxxxxxxxxxxxx`)

### OAuth Client Structure

**Client ID Format:**
```
[PROJECT_NUMBER]-[UNIQUE_ID].apps.googleusercontent.com
```

Example:
```
82892384200-va003qnnoj9q0jf19j3jf0vects0st9h.apps.googleusercontent.com
          ↑
    Project Number (should match your GCP project)
```

**Verify Project Number:**
```bash
gcloud projects describe salfagpt --format="value(projectNumber)"
# Should match the number at the start of Client ID
```

---

## ⚙️ Environment Variables

### Required Variables

Create a `.env` file in your project root with these variables:

```bash
# ===== GCP Configuration =====
GOOGLE_CLOUD_PROJECT=salfagpt

# ===== Google AI API =====
GOOGLE_AI_API_KEY=[Your Gemini API key]

# ===== OAuth Configuration =====
GOOGLE_CLIENT_ID=[Your OAuth Client ID]
GOOGLE_CLIENT_SECRET=[Your OAuth Client Secret]

# ===== JWT Configuration =====
JWT_SECRET=[Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"]

# ===== Application URLs =====
PUBLIC_BASE_URL=http://localhost:3000
DEV_PORT=3000

# ===== Session Configuration =====
SESSION_COOKIE_NAME=salfagpt_session
SESSION_MAX_AGE=86400

# ===== RAG & Embeddings =====
CHUNK_SIZE=8000
CHUNK_OVERLAP=2000
EMBEDDING_BATCH_SIZE=32
TOP_K=5
EMBEDDING_MODEL=gemini-embedding-001

# ===== Environment =====
NODE_ENV=production
```

### Variable Descriptions

| Variable | Purpose | Example | Required |
|----------|---------|---------|----------|
| `GOOGLE_CLOUD_PROJECT` | GCP project ID | `salfagpt` | ✅ Yes |
| `GOOGLE_AI_API_KEY` | Gemini AI API access | `AIzaSy...` | ✅ Yes |
| `GOOGLE_CLIENT_ID` | OAuth client identifier | `123-abc.apps.googleusercontent.com` | ✅ Yes |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret | `GOCSPX-...` | ✅ Yes |
| `JWT_SECRET` | Session token signing | Random 64-byte hex | ✅ Yes |
| `PUBLIC_BASE_URL` | Production URL | `https://your-app.run.app` | ✅ Yes |
| `SESSION_COOKIE_NAME` | Cookie identifier | `salfagpt_session` | ⚠️ Optional |
| `SESSION_MAX_AGE` | Session duration (seconds) | `86400` (24h) | ⚠️ Optional |
| `CHUNK_SIZE` | RAG chunk size | `8000` | ⚠️ Optional |
| `EMBEDDING_MODEL` | Embedding model | `gemini-embedding-001` | ⚠️ Optional |

---

## 🚀 Deployment Process

### Prerequisites

1. **Authenticate with GCP:**
   ```bash
   gcloud auth login
   firebase login --reauth
   ```

2. **Set project:**
   ```bash
   gcloud config set project salfagpt
   ```

3. **Verify `.env` file:**
   ```bash
   cat .env | grep -E "GOOGLE_CLIENT_ID|GOOGLE_CLIENT_SECRET|PUBLIC_BASE_URL"
   ```

### Build Application

```bash
# Type check (optional - scripts may have errors but runtime is OK)
npm run type-check

# Build for production
npm run build
```

**Expected output:**
```
✓ Completed in 5.25s
[build] Complete!
```

### Deploy to Cloud Run

**Initial Deployment:**
```bash
gcloud run deploy salfagpt \
  --source . \
  --platform managed \
  --region us-central1 \
  --project salfagpt \
  --allow-unauthenticated \
  --min-instances=1 \
  --max-instances=10 \
  --memory=2Gi \
  --cpu=2 \
  --timeout=300
```

**Set Environment Variables:**
```bash
gcloud run services update salfagpt \
  --region us-central1 \
  --project salfagpt \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=salfagpt,\
GOOGLE_AI_API_KEY=[YOUR_KEY],\
GOOGLE_CLIENT_ID=[YOUR_CLIENT_ID],\
GOOGLE_CLIENT_SECRET=[YOUR_CLIENT_SECRET],\
JWT_SECRET=[YOUR_JWT_SECRET],\
PUBLIC_BASE_URL=https://salfagpt-3snj65wckq-uc.a.run.app,\
SESSION_COOKIE_NAME=salfagpt_session,\
SESSION_MAX_AGE=86400,\
CHUNK_SIZE=8000,\
CHUNK_OVERLAP=2000,\
EMBEDDING_BATCH_SIZE=32,\
TOP_K=5,\
EMBEDDING_MODEL=gemini-embedding-001,\
NODE_ENV=production"
```

**⚠️ Note:** Replace `[YOUR_KEY]`, `[YOUR_CLIENT_ID]`, etc. with actual values from your `.env` file.

---

## 🔄 Traffic Management

### Understanding Cloud Run Revisions

Each deployment creates a new **revision**:
- Format: `salfagpt-00001-abc`
- Each revision is immutable
- Traffic can be split between revisions
- Only revisions with traffic receive requests

### Common Traffic Issue

**Problem:** New revision deployed but receiving 0% traffic

**Symptom:** You see in Cloud Run Console:
```
salfagpt-00008-qpx    0%    ← New revision (not receiving traffic)
salfagpt-00003-2bf  100%    ← Old revision (still serving users)
```

**Solution:** Manually route traffic to the latest revision:
```bash
gcloud run services update-traffic salfagpt \
  --to-revisions=salfagpt-00008-qpx=100 \
  --region us-central1 \
  --project salfagpt
```

### Automatic Traffic Routing

To ensure new deployments automatically get 100% traffic, use:
```bash
# During deployment
gcloud run deploy salfagpt \
  --source . \
  --region us-central1 \
  --project salfagpt
  # Automatically routes 100% traffic to new revision
```

**Or explicitly:**
```bash
gcloud run services update-traffic salfagpt \
  --to-latest \
  --region us-central1 \
  --project salfagpt
```

### Verify Current Traffic

```bash
gcloud run services describe salfagpt \
  --region us-central1 \
  --project salfagpt \
  --format="table(status.traffic[].revisionName,status.traffic[].percent)"
```

**Expected output:**
```
REVISION_NAME          PERCENT
salfagpt-00008-qpx     100
```

---

## 🐛 Troubleshooting

### Issue 1: `invalid_client` Error

**Symptom:**
- Login fails with "Error al Procesar"
- Cloud Run logs show: `invalid_client` error

**Causes:**
1. **OAuth Client Secret mismatch** (most common)
2. OAuth Client ID is wrong
3. Credentials belong to different project

**Solution:**

1. **Verify credentials in Google Console:**
   ```
   https://console.cloud.google.com/apis/credentials?project=salfagpt
   ```

2. **Get correct Client Secret:**
   - Find your OAuth client
   - Click "SHOW CLIENT SECRET"
   - Copy the exact value

3. **Update `.env` file:**
   ```bash
   nano .env
   # Update GOOGLE_CLIENT_SECRET
   ```

4. **Update Cloud Run:**
   ```bash
   gcloud run services update salfagpt \
     --region us-central1 \
     --project salfagpt \
     --update-env-vars="GOOGLE_CLIENT_SECRET=NEW_SECRET"
   ```

5. **Route traffic to new revision:**
   ```bash
   # Get latest revision name
   gcloud run revisions list \
     --service salfagpt \
     --region us-central1 \
     --project salfagpt \
     --limit=1 \
     --format="value(name)"
   
   # Route 100% traffic
   gcloud run services update-traffic salfagpt \
     --to-revisions=[LATEST_REVISION]=100 \
     --region us-central1 \
     --project salfagpt
   ```

### Issue 2: New Revision Not Receiving Traffic

**Symptom:**
- You deployed successfully
- But users still see old behavior
- Console shows new revision with 0% traffic

**Solution:**
```bash
# Route traffic to latest
gcloud run services update-traffic salfagpt \
  --to-latest \
  --region us-central1 \
  --project salfagpt
```

**Or specify revision:**
```bash
gcloud run services update-traffic salfagpt \
  --to-revisions=salfagpt-00008-qpx=100 \
  --region us-central1 \
  --project salfagpt
```

### Issue 3: `redirect_uri_mismatch`

**Symptom:**
- OAuth flow fails with redirect URI error

**Solution:**

1. **Check exact redirect URI in logs**
2. **Add to Google Console** (must match exactly):
   ```
   https://salfagpt-3snj65wckq-uc.a.run.app/auth/callback
   ```
3. **Common mistakes:**
   - ❌ Missing `/auth` prefix: `https://.../callback`
   - ❌ Extra trailing slash: `https://.../auth/callback/`
   - ❌ Wrong protocol: `http://` instead of `https://`

### Issue 4: Environment Variable Type Conflict

**Symptom:**
```
ERROR: Cannot update environment variable [X] because it has already 
been set with a different type.
```

**Solution:**
```bash
# Clear all variables first
gcloud run services update salfagpt \
  --region us-central1 \
  --project salfagpt \
  --clear-env-vars \
  --clear-secrets

# Then set new variables
gcloud run services update salfagpt \
  --region us-central1 \
  --project salfagpt \
  --set-env-vars="KEY=VALUE,KEY2=VALUE2,..."
```

---

## ✅ Verification & Testing

### Health Check

**Endpoint:** `/api/health/firestore`

```bash
curl https://salfagpt-3snj65wckq-uc.a.run.app/api/health/firestore | jq .
```

**Expected response:**
```json
{
  "status": "healthy",
  "checks": {
    "projectId": { "status": "pass", "value": "salfagpt" },
    "authentication": { "status": "pass" },
    "firestoreRead": { "status": "pass", "latency": 41 },
    "firestoreWrite": { "status": "pass", "latency": 116 },
    "collections": { "status": "pass", "found": [...] }
  },
  "summary": {
    "totalChecks": 5,
    "passed": 5,
    "failed": 0
  }
}
```

### Test OAuth Flow

1. **Clear browser cache** or use **Incognito mode**

2. **Visit production URL:**
   ```
   https://salfagpt-3snj65wckq-uc.a.run.app
   ```

3. **Click:** "Continue with Google"

4. **Expected flow:**
   - Redirects to Google OAuth consent screen ✅
   - Shows application name and permissions ✅
   - User selects/authorizes Google account ✅
   - Redirects back to: `https://salfagpt-3snj65wckq-uc.a.run.app/auth/callback` ✅
   - Backend exchanges code for tokens ✅
   - User is redirected to `/chat` ✅
   - Chat interface loads with user logged in ✅

5. **Verify session persistence:**
   - Refresh the page
   - Should stay logged in ✅
   - Cookie `flow_session` should be set ✅

### View Cloud Run Logs

**Recent logs:**
```bash
gcloud logging read 'resource.type=cloud_run_revision AND resource.labels.service_name=salfagpt' \
  --limit=50 \
  --project=salfagpt \
  --format="table(timestamp,severity,textPayload)"
```

**Errors only:**
```bash
gcloud logging read 'resource.type=cloud_run_revision AND resource.labels.service_name=salfagpt AND severity>=ERROR' \
  --limit=20 \
  --project=salfagpt
```

**Authentication events:**
```bash
gcloud logging read 'resource.type=cloud_run_revision AND resource.labels.service_name=salfagpt' \
  --limit=100 \
  --project=salfagpt \
  --format="value(textPayload)" | grep -E "OAuth|authentication|callback"
```

---

## 🔄 Complete Deployment Workflow

### Pre-Deployment Checklist

- [ ] `.env` file configured with all required variables
- [ ] OAuth client created in Google Cloud Console
- [ ] Redirect URIs include production URL
- [ ] `gcloud` authenticated
- [ ] `firebase` authenticated
- [ ] Project set to correct GCP project

### Deployment Steps

1. **Build application:**
   ```bash
   npm run build
   ```

2. **Initial deployment (if first time):**
   ```bash
   gcloud run deploy salfagpt \
     --source . \
     --platform managed \
     --region us-central1 \
     --project salfagpt \
     --allow-unauthenticated \
     --min-instances=1 \
     --max-instances=10 \
     --memory=2Gi \
     --cpu=2 \
     --timeout=300
   ```

3. **Note the service URL** from output:
   ```
   Service URL: https://salfagpt-XXXXXXX-uc.a.run.app
   ```

4. **Update PUBLIC_BASE_URL in `.env`:**
   ```bash
   PUBLIC_BASE_URL=https://salfagpt-XXXXXXX-uc.a.run.app
   ```

5. **Update OAuth redirect URIs** in Google Console with production URL

6. **Deploy environment variables:**
   ```bash
   # Read from .env and deploy all variables
   gcloud run services update salfagpt \
     --region us-central1 \
     --project salfagpt \
     --set-env-vars="[VARIABLES_FROM_ENV_FILE]"
   ```

7. **Verify traffic routing:**
   ```bash
   gcloud run services describe salfagpt \
     --region us-central1 \
     --project salfagpt \
     --format="value(status.traffic[].revisionName,status.traffic[].percent)"
   ```

8. **If latest revision has 0% traffic:**
   ```bash
   # Get latest revision
   LATEST=$(gcloud run revisions list \
     --service salfagpt \
     --region us-central1 \
     --project salfagpt \
     --limit=1 \
     --format="value(name)")
   
   # Route 100% traffic
   gcloud run services update-traffic salfagpt \
     --to-revisions=$LATEST=100 \
     --region us-central1 \
     --project salfagpt
   ```

9. **Verify deployment:**
   ```bash
   curl https://salfagpt-XXXXXXX-uc.a.run.app/api/health/firestore | jq .
   ```

10. **Test login flow** (see Verification section)

---

## 🎯 Critical Lessons Learned

### Lesson 1: OAuth Credentials Must Match EXACTLY

**Issue:** `invalid_client` error during OAuth token exchange

**Root Cause:** 
- Client Secret in Cloud Run didn't match Google Console
- Even one character difference causes complete failure

**Solution:**
- Always copy Client Secret directly from Google Console
- Verify with "SHOW CLIENT SECRET" button
- Update both `.env` and Cloud Run
- Never manually type secrets (use copy-paste)

### Lesson 2: Traffic Routing is Manual After Updates

**Issue:** New revision deployed but users still hitting old revision

**Root Cause:**
- `gcloud run services update` creates new revision
- But doesn't automatically route traffic to it
- Old revision continues serving 100% traffic

**Solution:**
- Always check traffic distribution after updates
- Manually route traffic with `update-traffic` command
- Or use `--to-latest` flag during updates

### Lesson 3: Environment Variables vs Secrets

**Issue:** Cannot update variable type (string vs secret)

**Solution:**
- Clear all variables first: `--clear-env-vars --clear-secrets`
- Then set as needed
- For production, use Secret Manager for sensitive values
- For development/simple deployments, env vars are OK

### Lesson 4: Redirect URI Must Be Exact

**Critical requirements:**
- Protocol must match: `https://` (not `http://` in production)
- Path must be exact: `/auth/callback` (not `/callback` or `/auth/callback/`)
- Domain must match exactly (case-sensitive)
- No trailing slashes

---

## 📊 Monitoring & Maintenance

### Check Current Configuration

**View all environment variables:**
```bash
gcloud run services describe salfagpt \
  --region us-central1 \
  --project salfagpt \
  --format="json" | jq -r '.spec.template.spec.containers[0].env[] | "\(.name)=\(.value)"'
```

**View traffic distribution:**
```bash
gcloud run services describe salfagpt \
  --region us-central1 \
  --project salfagpt \
  --format="table(status.traffic[].revisionName,status.traffic[].percent)"
```

**View service URL:**
```bash
gcloud run services describe salfagpt \
  --region us-central1 \
  --project salfagpt \
  --format="value(status.url)"
```

### Common Maintenance Tasks

**Update Single Environment Variable:**
```bash
gcloud run services update salfagpt \
  --region us-central1 \
  --project salfagpt \
  --update-env-vars="KEY=NEW_VALUE"
```

**Update Multiple Variables:**
```bash
gcloud run services update salfagpt \
  --region us-central1 \
  --project salfagpt \
  --update-env-vars="KEY1=VALUE1,KEY2=VALUE2,KEY3=VALUE3"
```

**Scale Service:**
```bash
gcloud run services update salfagpt \
  --region us-central1 \
  --project salfagpt \
  --min-instances=2 \
  --max-instances=20
```

**Update Resources:**
```bash
gcloud run services update salfagpt \
  --region us-central1 \
  --project salfagpt \
  --memory=4Gi \
  --cpu=4
```

---

## 🔒 Security Best Practices

### OAuth Configuration

1. **Never commit secrets to git:**
   - Add `.env` to `.gitignore`
   - Use `.env.example` as template (without real values)

2. **Rotate secrets regularly:**
   - OAuth Client Secret: Every 90 days
   - JWT Secret: Every 90 days
   - API Keys: Every 180 days

3. **Use Secret Manager for production:**
   ```bash
   # Store secret in Secret Manager
   echo -n "YOUR_SECRET" | gcloud secrets create oauth-client-secret \
     --data-file=- \
     --project=salfagpt
   
   # Reference in Cloud Run
   gcloud run services update salfagpt \
     --region us-central1 \
     --project salfagpt \
     --set-secrets="GOOGLE_CLIENT_SECRET=oauth-client-secret:latest"
   ```

### Session Security

**Configured in `src/lib/auth.ts`:**
```typescript
context.cookies.set('flow_session', token, {
  httpOnly: true,    // ✅ JavaScript cannot access (XSS protection)
  secure: true,      // ✅ HTTPS only in production
  sameSite: 'lax',   // ✅ CSRF protection
  maxAge: 604800,    // 7 days
  path: '/',
});
```

### Domain Filtering

**Configured in `src/lib/domains.ts`:**
- Checks if user's email domain is enabled
- Prevents unauthorized domains from accessing the system
- Firestore collection: `domains`

**To enable a domain:**
```typescript
// Add to Firestore domains collection
{
  domain: 'example.com',
  enabled: true,
  addedAt: timestamp
}
```

---

## 📋 Quick Reference

### Service Information

| Property | Value |
|----------|-------|
| **Project ID** | salfagpt |
| **Project Number** | 82892384200 |
| **Service Name** | salfagpt |
| **Region** | us-central1 |
| **Service URL** | https://salfagpt-3snj65wckq-uc.a.run.app |

### Essential Commands

```bash
# Deploy
gcloud run deploy salfagpt --source . --region us-central1 --project salfagpt

# Update env var
gcloud run services update salfagpt --region us-central1 --project salfagpt --update-env-vars="KEY=VALUE"

# Route traffic
gcloud run services update-traffic salfagpt --to-latest --region us-central1 --project salfagpt

# View logs
gcloud logging read 'resource.labels.service_name=salfagpt' --limit=20 --project=salfagpt

# Health check
curl https://salfagpt-3snj65wckq-uc.a.run.app/api/health/firestore | jq .
```

### OAuth Setup Checklist

- [ ] OAuth client created in correct GCP project
- [ ] Application type: Web application
- [ ] Client ID copied to `.env`
- [ ] Client Secret copied to `.env`
- [ ] Authorized JavaScript origins include production URL
- [ ] Authorized redirect URIs include `/auth/callback`
- [ ] Cloud Run env vars match `.env` file
- [ ] Latest revision receiving 100% traffic
- [ ] Login flow tested and working

---

## 🎉 Success Criteria

After following this guide, you should have:

### Configuration ✅
- [x] OAuth client properly configured
- [x] All environment variables set in Cloud Run
- [x] Redirect URIs include production URL
- [x] Traffic routed to latest revision

### Functionality ✅
- [x] Users can access production URL
- [x] Login with Google works
- [x] Session persists after refresh
- [x] Protected routes require authentication
- [x] Chat interface loads for authenticated users

### Monitoring ✅
- [x] Health check endpoint responds
- [x] Logs show successful authentications
- [x] No `invalid_client` errors
- [x] Service metrics available

---

## 📚 Related Documentation

### Internal Docs
- `.cursor/rules/deployment.mdc` - Deployment best practices
- `.cursor/rules/env.mdc` - Environment variables management
- `DEPLOYMENT_SUCCESS_SALFACORP_2025-10-22.md` - Initial deployment
- `OAUTH_DIAGNOSTIC_2025-10-22.md` - OAuth troubleshooting
- `fix-oauth.sh` - Automated OAuth fix script

### External Resources
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [OAuth 2.0 Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)

---

## 🔄 Future Improvements

### Recommended Enhancements

1. **Use Secret Manager:**
   - Store OAuth secrets securely
   - Easier rotation
   - Better audit logging

2. **Automated Deployment:**
   - CI/CD pipeline with GitHub Actions
   - Automatic traffic routing
   - Rollback on health check failure

3. **Custom Domain:**
   - More professional URL
   - Easier to remember
   - Better for branding

4. **Monitoring:**
   - Set up Cloud Monitoring alerts
   - Track login success/failure rates
   - Monitor OAuth errors

5. **Multi-Environment:**
   - Separate staging environment
   - Different OAuth clients per environment
   - Environment-specific configurations

---

## 📞 Support & Troubleshooting

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Login fails with `invalid_client` | Verify Client Secret matches Google Console |
| New deployment not working | Check traffic routing to latest revision |
| `redirect_uri_mismatch` | Add exact production URL to redirect URIs |
| Health check fails | Check Firestore authentication and permissions |
| Session expires immediately | Verify JWT_SECRET is set correctly |

### Getting Help

1. **Check logs first:**
   ```bash
   gcloud logging read 'resource.labels.service_name=salfagpt AND severity>=ERROR' \
     --limit=10 --project=salfagpt
   ```

2. **Verify configuration:**
   ```bash
   gcloud run services describe salfagpt --region us-central1 --project salfagpt
   ```

3. **Test health endpoint:**
   ```bash
   curl https://salfagpt-3snj65wckq-uc.a.run.app/api/health/firestore
   ```

---

## ✅ Deployment History

### October 22, 2025

**Initial Deployment:**
- Deployed application to Cloud Run
- Set environment variables from `.env`
- Health checks: All passing

**OAuth Issue Identified:**
- Login failing with `invalid_client` error
- Root cause: Client Secret mismatch

**OAuth Fix Applied:**
- Generated new OAuth Client Secret in Google Console
- Updated `.env` file with new secret
- Updated Cloud Run environment variables
- **Critical fix:** Routed traffic to latest revision

**Final Status:**
- ✅ OAuth working correctly
- ✅ Login flow successful
- ✅ Production accessible
- ✅ All systems operational

---

## 🎯 Quick Deployment Summary

**What works:**
```bash
# 1. Build
npm run build

# 2. Deploy
gcloud run deploy salfagpt --source . --region us-central1 --project salfagpt

# 3. Set env vars (use values from .env)
gcloud run services update salfagpt \
  --region us-central1 \
  --project salfagpt \
  --set-env-vars="GOOGLE_CLIENT_ID=[FROM_ENV],GOOGLE_CLIENT_SECRET=[FROM_ENV],..."

# 4. Route traffic to latest
gcloud run services update-traffic salfagpt --to-latest --region us-central1 --project salfagpt

# 5. Test
curl https://salfagpt-3snj65wckq-uc.a.run.app/api/health/firestore
```

**Key takeaway:** Always verify traffic routing after updates! 🎯

---

**Last Updated:** October 22, 2025  
**Status:** ✅ Production deployment successful  
**Deployed by:** alec@salfacloud.cl  
**Service URL:** https://salfagpt-3snj65wckq-uc.a.run.app

