# Cloud Run OAuth Setup - Complete Solution

## 🎉 Problem Solved: OAuth Login Working in Production

**Date:** 2025-10-21  
**Project:** salfagpt  
**Service URL:** https://flow-chat-3snj65wckq-uc.a.run.app

---

## 🚨 The Problem

OAuth login was failing in Cloud Run production with error:
```
Access blocked: Authorization Error
Missing required parameter: client_id
Error 400: invalid_request
```

---

## ✅ The Solution (Step by Step)

### Step 1: Create Cloud Storage Bucket

**Issue:** File uploads were failing because bucket didn't exist.

**Solution:**
```bash
gsutil mb -p salfagpt -l us-central1 gs://salfagpt-uploads
```

**Code Update:**
```typescript
// src/lib/storage.ts
export const BUCKET_NAME = PROJECT_ID === 'salfagpt' 
  ? 'salfagpt-uploads' 
  : 'gen-lang-client-0986191192-uploads';
```

---

### Step 2: Fix Dependency Conflicts

**Issue:** Build failing with Astro v5 and @astrojs/node v8 incompatibility.

**Solution:**
```bash
# Update package.json
"@astrojs/node": "^9.0.0"  # Was: ^8.3.4

# Install missing dependencies
npm install @google-cloud/logging
npm install @google-cloud/error-reporting
```

---

### Step 3: Fix Import Errors

**Issue:** `generateAIResponse` imported from wrong file.

**Solution:**
```typescript
// src/pages/api/chat.ts
// BEFORE:
import { generateAIResponse, insertChatMessage } from '../../lib/gcp';

// AFTER:
import { generateAIResponse } from '../../lib/gemini';
import { insertChatMessage } from '../../lib/gcp';
```

---

### Step 4: External Google Cloud Packages

**Issue:** Rollup trying to bundle Google Cloud SDK packages.

**Solution:**
```javascript
// astro.config.mjs
export default defineConfig({
  vite: {
    ssr: {
      // Don't bundle Google Cloud packages - they should be external
      external: [
        '@google-cloud/firestore',
        '@google-cloud/bigquery',
        '@google-cloud/storage',
        '@google-cloud/logging',
        '@google-cloud/error-reporting',
      ],
    },
  },
});
```

---

### Step 5: Fix Build Script for Cloud Run

**Issue:** Build failing in Docker because `scripts/load-env.js` requires `.env.project` file.

**Solution:**
```json
// package.json
{
  "scripts": {
    "build": "astro build",          // For Cloud Run (no env loading)
    "build:local": "npm run load-env && astro build",  // For local
    "dev": "npm run load-env && astro dev"  // For local dev
  }
}
```

**Why:** Cloud Run gets environment variables from `--set-env-vars`, not from `.env` files.

---

### Step 6: Configure ALL Cloud Run Environment Variables

**CRITICAL:** You must set ALL required environment variables, not just some.

**Solution:**
```bash
# First, clear all existing vars to avoid conflicts
gcloud run services update flow-chat \
  --project=salfagpt \
  --region=us-central1 \
  --clear-env-vars \
  --clear-secrets

# Then, set ALL variables at once
gcloud run services update flow-chat \
  --project=salfagpt \
  --region=us-central1 \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=salfagpt,NODE_ENV=production,PUBLIC_BASE_URL=https://flow-chat-3snj65wckq-uc.a.run.app,GOOGLE_AI_API_KEY=YOUR_KEY,GOOGLE_CLIENT_ID=YOUR_CLIENT_ID,GOOGLE_CLIENT_SECRET=YOUR_SECRET,JWT_SECRET=YOUR_JWT_SECRET"
```

**Variables Required:**
1. ✅ `GOOGLE_CLOUD_PROJECT=salfagpt`
2. ✅ `GOOGLE_AI_API_KEY=AIzaSy...` (from .env)
3. ✅ `GOOGLE_CLIENT_ID=82892384200-...apps.googleusercontent.com`
4. ✅ `GOOGLE_CLIENT_SECRET=GOCSPX-...` (from .env)
5. ✅ `JWT_SECRET=...` (from .env)
6. ✅ `PUBLIC_BASE_URL=https://flow-chat-3snj65wckq-uc.a.run.app`
7. ✅ `NODE_ENV=production`

---

### Step 7: Configure OAuth Redirect URIs in Google Cloud Console

**CRITICAL:** OAuth won't work until you add the production URL to authorized redirect URIs.

**Steps:**
1. Go to: https://console.cloud.google.com/apis/credentials?project=salfagpt
2. Find OAuth 2.0 Client ID: `82892384200-va003qnnoj9q0jf19j3jf0vects0st9h`
3. Add to **Authorized JavaScript Origins:**
   - `http://localhost:3000` (local)
   - `https://flow-chat-3snj65wckq-uc.a.run.app` (production)
4. Add to **Authorized Redirect URIs:**
   - `http://localhost:3000/auth/callback` (local)
   - `https://flow-chat-3snj65wckq-uc.a.run.app/auth/callback` (production)
5. Save changes

**Note:** Changes can take 5 minutes to a few hours to propagate.

---

## 🔧 Complete Deployment Command

**Full deployment from scratch:**

```bash
# 1. Ensure you're in the project directory
cd /Users/alec/salfagpt

# 2. Build locally to verify
npm run build

# 3. Deploy to Cloud Run with ALL env vars
gcloud run deploy flow-chat \
  --source . \
  --project=salfagpt \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated \
  --min-instances=0 \
  --max-instances=10 \
  --memory=2Gi \
  --cpu=2 \
  --timeout=300 \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=salfagpt,NODE_ENV=production"

# 4. After deployment, get the service URL
SERVICE_URL=$(gcloud run services describe flow-chat \
  --project=salfagpt \
  --region=us-central1 \
  --format='value(status.url)')

echo "Service URL: $SERVICE_URL"

# 5. Update PUBLIC_BASE_URL to match
gcloud run services update flow-chat \
  --project=salfagpt \
  --region=us-central1 \
  --update-env-vars="PUBLIC_BASE_URL=$SERVICE_URL"

# 6. Set secrets (get from .env)
GOOGLE_AI_KEY=$(grep "^GOOGLE_AI_API_KEY=" .env | cut -d'=' -f2)
GOOGLE_CLIENT_ID=$(grep "^GOOGLE_CLIENT_ID=" .env | cut -d'=' -f2)
GOOGLE_CLIENT_SECRET=$(grep "^GOOGLE_CLIENT_SECRET=" .env | cut -d'=' -f2)
JWT_SECRET=$(grep "^JWT_SECRET=" .env | cut -d'=' -f2)

gcloud run services update flow-chat \
  --project=salfagpt \
  --region=us-central1 \
  --update-env-vars="GOOGLE_AI_API_KEY=$GOOGLE_AI_KEY,GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID,GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET,JWT_SECRET=$JWT_SECRET"

# 7. Verify all env vars are set
gcloud run services describe flow-chat \
  --project=salfagpt \
  --region=us-central1 \
  --format=json | jq -r '.spec.template.spec.containers[0].env[] | "\(.name): \(.value)"'
```

---

## 🔍 Verification Checklist

After deployment, verify:

### 1. Environment Variables
```bash
gcloud run services describe flow-chat \
  --project=salfagpt \
  --region=us-central1 \
  --format=json | jq -r '.spec.template.spec.containers[0].env[] | "\(.name): \(.value)"' | sort
```

**Expected output:**
```
GOOGLE_AI_API_KEY: AIzaSy...
GOOGLE_CLIENT_ID: 82892384200-...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET: GOCSPX-...
GOOGLE_CLOUD_PROJECT: salfagpt
JWT_SECRET: df45d920...
NODE_ENV: production
PUBLIC_BASE_URL: https://flow-chat-3snj65wckq-uc.a.run.app
```

### 2. Health Check
```bash
curl -s "https://flow-chat-3snj65wckq-uc.a.run.app/api/health/firestore" | jq .
```

**Expected:**
```json
{
  "status": "healthy",
  "environment": "production",
  "checks": {
    "projectId": { "status": "pass", "value": "salfagpt" },
    "authentication": { "status": "pass" }
  }
}
```

### 3. OAuth Configuration
- [ ] Authorized JavaScript Origins includes production URL
- [ ] Authorized Redirect URIs includes production callback URL
- [ ] Client ID matches environment variable
- [ ] Client Secret matches environment variable

### 4. Test OAuth Flow
1. Open: https://flow-chat-3snj65wckq-uc.a.run.app/auth/login
2. Should redirect to Google OAuth
3. After authentication, should redirect back to /chat
4. User should be logged in

---

## 🚨 Common Issues & Solutions

### Issue 1: "invalid_client" Error

**Cause:** `GOOGLE_CLIENT_SECRET` doesn't match the one in Google Console.

**Solution:**
- Get the actual secret from .env
- Remove any Secret Manager references
- Set as direct environment variable

### Issue 2: "Missing parameter: client_id" Error

**Cause:** OAuth redirect URI not configured in Google Console.

**Solution:**
- Add production URL to Authorized Redirect URIs
- Wait 5-10 minutes for propagation

### Issue 3: Build Fails with Dependency Errors

**Cause:** Version incompatibility between Astro and @astrojs/node.

**Solution:**
- Update @astrojs/node to v9.0.0 for Astro v5
- Add missing Google Cloud dependencies

### Issue 4: Build Fails with "load-env.js" Error

**Cause:** Build script tries to load .env.project in Docker.

**Solution:**
- Use `build: "astro build"` (no env loading)
- Keep `dev: "npm run load-env && astro dev"` for local

### Issue 5: Rollup Can't Resolve Google Cloud Imports

**Cause:** Vite tries to bundle server-side dependencies.

**Solution:**
- Add Google Cloud packages to `ssr.external` in astro.config.mjs

---

## 📋 Pre-Deployment Checklist

**Before deploying:**

- [ ] `npm run build` succeeds locally
- [ ] All required dependencies installed
- [ ] `.env` file has all secrets
- [ ] Cloud Storage bucket exists
- [ ] OAuth redirect URIs configured in Google Console
- [ ] No sensitive files in git (check .gitignore)

**After deployment:**

- [ ] Service URL is accessible
- [ ] Health check returns "healthy"
- [ ] All environment variables are set
- [ ] OAuth login works
- [ ] File upload to Cloud Storage works
- [ ] Chat with AI works

---

## 🎯 Key Learnings

### 1. **Environment Variables Must Be Complete**
Missing even ONE variable (like GOOGLE_CLIENT_ID) breaks OAuth completely.

### 2. **Secret Manager vs Direct Env Vars**
For simplicity in this setup, we used direct environment variables instead of Secret Manager. Both work, but mixing them causes conflicts.

### 3. **OAuth Configuration Propagation**
Changes to OAuth redirect URIs in Google Console can take 5 minutes to several hours to propagate. Be patient.

### 4. **Build vs Deploy**
- Local build: Uses `npm run build:local` (loads .env)
- Cloud Run build: Uses `npm run build` (uses env vars from --set-env-vars)

### 5. **Dependencies Matter**
@astrojs/node v8 only works with Astro v4. For Astro v5, you need v9+.

---

## 🔐 Security Notes

### What's in GitHub (Safe)
- ✅ Source code
- ✅ Deployment scripts
- ✅ Environment templates (placeholders only)
- ✅ Documentation

### What's NOT in GitHub (Secrets)
- ❌ .env file
- ❌ API keys
- ❌ OAuth client secrets
- ❌ JWT secrets
- ❌ Service account keys

### How Secrets Are Stored
- **Local:** `.env` file (gitignored)
- **Production:** Cloud Run environment variables
- **Alternative:** Secret Manager (more secure, more complex)

---

## 📊 Final Configuration

### Cloud Storage
```
Bucket: gs://salfagpt-uploads/
Location: us-central1
Project: salfagpt
Purpose: Store uploaded PDF files before extraction
```

### Cloud Run
```
Service: flow-chat
Region: us-central1
Project: salfagpt
URL: https://flow-chat-3snj65wckq-uc.a.run.app
Memory: 2 GiB
CPU: 2
Timeout: 300s
Min Instances: 0
Max Instances: 10
```

### OAuth 2.0
```
Client ID: 82892384200-va003qnnoj9q0jf19j3jf0vects0st9h.apps.googleusercontent.com
Authorized Origins:
  - http://localhost:3000
  - https://flow-chat-3snj65wckq-uc.a.run.app
Authorized Redirect URIs:
  - http://localhost:3000/auth/callback
  - https://flow-chat-3snj65wckq-uc.a.run.app/auth/callback
```

### Firestore
```
Database: (default)
Project: salfagpt
Location: us-central1
Collections: conversations, messages, context_sources, users, etc.
```

---

## 🔄 Future Deployments

**Quick deployment (after initial setup):**

```bash
# 1. Build and verify locally
npm run build

# 2. Deploy
gcloud run deploy flow-chat \
  --source . \
  --project=salfagpt \
  --region=us-central1

# That's it! Environment variables persist between deployments.
```

**Only re-set env vars if:**
- Adding new secrets
- Rotating existing secrets
- Changing configuration values

---

## 🧪 Testing After Deployment

### 1. Health Check
```bash
curl https://flow-chat-3snj65wckq-uc.a.run.app/api/health/firestore
```

### 2. OAuth Login
```
Open: https://flow-chat-3snj65wckq-uc.a.run.app/auth/login
Should redirect to Google OAuth
```

### 3. File Upload
```
1. Login to app
2. Create new agent
3. Upload PDF file
4. Should save to gs://salfagpt-uploads/
```

### 4. Chat
```
1. Send message to agent
2. AI should respond
3. Messages should persist
```

---

## 📚 Related Documentation

- `DEPLOYMENT_SUCCESS_2025-10-21.md` - Initial deployment notes
- `.cursor/rules/cloud-run-deployment.mdc` - Deployment rules (created)
- `docs/LocalToProduction.md` - General deployment guide
- `.env.example` - Environment variable template

---

## ✅ Success Criteria

A successful Cloud Run deployment should have:

- ✅ Service URL accessible
- ✅ Health check returns "healthy"
- ✅ All 7 environment variables configured
- ✅ OAuth login works
- ✅ File uploads work (Cloud Storage)
- ✅ Chat with AI works
- ✅ Data persists in Firestore
- ✅ No errors in Cloud Run logs

---

**Last Updated:** 2025-10-21  
**Status:** ✅ Production Ready  
**Service URL:** https://flow-chat-3snj65wckq-uc.a.run.app

