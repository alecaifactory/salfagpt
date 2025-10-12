# Fix: OAuth Missing client_id in Production
**Date:** 2025-01-12
**Status:** ✅ Fixed

## 📋 Problem

### Symptom
OAuth login fails with error:
```
Access blocked: Authorization Error
Missing required parameter: client_id
Error 400: invalid_request
```

URL: `https://accounts.google.com/signin/oauth/error`

### Root Cause
**`GOOGLE_CLIENT_ID` was missing from Cloud Run environment variables**

While the Client Secret was properly configured, the Client ID was not mounted as an environment variable, causing OAuth authentication to fail.

## 🔧 Solution Implemented

### Step 1: Verify Missing Variable
```bash
# Check current env vars in Cloud Run
gcloud run services describe flow-chat \
  --region=us-central1 \
  --project=gen-lang-client-0986191192 \
  --format="value(spec.template.spec.containers[0].env)"

# Result: GOOGLE_CLIENT_ID was missing
```

### Step 2: Create Secret in Secret Manager
```bash
# Add Client ID as secret
echo -n "1030147139179-20gjd3cru9jhgmhlkj88majubn2130ic.apps.googleusercontent.com" | \
  gcloud secrets versions add google-client-id \
  --data-file=- \
  --project=gen-lang-client-0986191192
```

### Step 3: Grant Service Account Access
```bash
# Give Cloud Run service account permission to read the secret
gcloud secrets add-iam-policy-binding google-client-id \
  --member="serviceAccount:1030147139179-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=gen-lang-client-0986191192
```

### Step 4: Mount Secret in Cloud Run
```bash
# Update Cloud Run to mount the secret as environment variable
gcloud run services update flow-chat \
  --region=us-central1 \
  --project=gen-lang-client-0986191192 \
  --update-secrets="GOOGLE_CLIENT_ID=google-client-id:latest"
```

## ✅ Verification

### Check All Environment Variables
```bash
gcloud run services describe flow-chat \
  --region=us-central1 \
  --project=gen-lang-client-0986191192 \
  --format="value(spec.template.spec.containers[0].env)"
```

### Expected Variables (ALL PRESENT)
- ✅ `GOOGLE_CLIENT_ID` (secret)
- ✅ `GOOGLE_CLIENT_SECRET` (secret)
- ✅ `GOOGLE_AI_API_KEY` (secret)
- ✅ `JWT_SECRET` (secret)
- ✅ `GOOGLE_CLOUD_PROJECT` (env var)
- ✅ `PUBLIC_BASE_URL` (env var)
- ✅ `NODE_ENV` (env var)

### Test OAuth Login
1. Navigate to: `https://flow-chat-cno6l2kfga-uc.a.run.app/auth/login`
2. Click "Login with Google"
3. Select your Google account
4. Should redirect to `/chat` successfully
5. Session should persist after page refresh

## 📝 Key Lessons

### 1. Complete Environment Variable Checklist

**ALWAYS verify ALL variables from `.env` are in Cloud Run:**

| Variable | Local (.env) | Cloud Run | Type |
|---|---|---|---|
| `GOOGLE_CLOUD_PROJECT` | ✅ | ✅ | Env Var |
| `GOOGLE_AI_API_KEY` | ✅ | ✅ | Secret |
| `GOOGLE_CLIENT_ID` | ✅ | ❌→✅ | **Secret (WAS MISSING)** |
| `GOOGLE_CLIENT_SECRET` | ✅ | ✅ | Secret |
| `JWT_SECRET` | ✅ | ✅ | Secret |
| `PUBLIC_BASE_URL` | ✅ | ✅ | Env Var |
| `NODE_ENV` | ✅ | ✅ | Env Var |

### 2. OAuth Requires TWO Secrets
OAuth2 authentication requires BOTH:
- ✅ `GOOGLE_CLIENT_ID` (public identifier)
- ✅ `GOOGLE_CLIENT_SECRET` (private key)

Missing either one will cause authentication to fail.

### 3. Pre-Deployment Verification Script

Create a script to verify all environment variables:

```bash
#!/bin/bash
# verify-env-vars.sh

echo "🔍 Checking environment variables..."

# Expected variables
EXPECTED_VARS=(
  "GOOGLE_CLOUD_PROJECT"
  "GOOGLE_AI_API_KEY"
  "GOOGLE_CLIENT_ID"
  "GOOGLE_CLIENT_SECRET"
  "JWT_SECRET"
  "PUBLIC_BASE_URL"
  "NODE_ENV"
)

# Get current Cloud Run env vars
CURRENT_VARS=$(gcloud run services describe flow-chat \
  --region=us-central1 \
  --project=gen-lang-client-0986191192 \
  --format="value(spec.template.spec.containers[0].env)")

# Check each expected variable
for var in "${EXPECTED_VARS[@]}"; do
  if echo "$CURRENT_VARS" | grep -q "'name': '$var'"; then
    echo "✅ $var"
  else
    echo "❌ $var - MISSING!"
  fi
done
```

### 4. The Complete OAuth Flow

```
User clicks "Login with Google"
  ↓
Browser redirects to Google OAuth
  ↓
Google checks: GOOGLE_CLIENT_ID ← Must be in env vars
  ↓
User authorizes app
  ↓
Google redirects back with auth code
  ↓
Backend exchanges code for user info
  Uses: GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET
  ↓
Backend creates JWT session
  Uses: JWT_SECRET
  ↓
User is logged in ✅
```

## 🚨 Common Mistakes

### Mistake #1: Only Adding Client Secret
```bash
# ❌ WRONG: Only mounting client secret
--update-secrets="GOOGLE_CLIENT_SECRET=google-client-secret:latest"
```

```bash
# ✅ CORRECT: Mount BOTH client ID and secret
--update-secrets="GOOGLE_CLIENT_ID=google-client-id:latest,GOOGLE_CLIENT_SECRET=google-client-secret:latest"
```

### Mistake #2: Using Env Var Instead of Secret
```bash
# ❌ WRONG: Client ID as plain env var (less secure)
--set-env-vars="GOOGLE_CLIENT_ID=1030147139179-..."
```

```bash
# ✅ CORRECT: Client ID as secret (more secure)
--update-secrets="GOOGLE_CLIENT_ID=google-client-id:latest"
```

### Mistake #3: Not Verifying After Deployment
Always verify environment variables after deployment:
```bash
gcloud run services describe flow-chat --format="value(spec.template.spec.containers[0].env)"
```

## 🔍 Debugging Commands

### Check Current Environment Variables
```bash
gcloud run services describe flow-chat \
  --region=us-central1 \
  --project=gen-lang-client-0986191192 \
  --format="value(spec.template.spec.containers[0].env)"
```

### Check Secret Value
```bash
gcloud secrets versions access latest \
  --secret="google-client-id" \
  --project=gen-lang-client-0986191192
```

### Check Service Account Permissions
```bash
gcloud secrets get-iam-policy google-client-id \
  --project=gen-lang-client-0986191192
```

### Check Cloud Run Logs for OAuth Errors
```bash
gcloud logging read 'resource.type=cloud_run_revision AND (textPayload=~"OAuth" OR textPayload=~"client_id")' \
  --limit=20 \
  --project=gen-lang-client-0986191192
```

## 📚 Related Documentation
- `docs/DEPLOYMENT.md` - Complete deployment guide
- `docs/OAUTH_PRODUCTION_FIX.md` - OAuth configuration guide
- `docs/fixes/gemini-production-fix-2025-01-12.md` - Gemini AI fix
- `.env.example` - Required environment variables

## ✅ Success Criteria

After this fix, the following should work:

1. ✅ **OAuth Login**: Users can login with Google
2. ✅ **Session Persistence**: Session persists after page refresh
3. ✅ **No OAuth Errors**: No "missing client_id" errors
4. ✅ **Redirect Works**: Proper redirect after login
5. ✅ **All Secrets Mounted**: All 7 required variables present

## 🎯 Next Steps

1. ✅ Update deployment documentation
2. ✅ Create environment variable verification script
3. ✅ Add to pre-deployment checklist
4. ⏳ Automate environment variable validation in CI/CD

---

**Last Updated:** 2025-01-12  
**Fixed By:** AI Assistant  
**Production URL:** https://flow-chat-cno6l2kfga-uc.a.run.app  
**New Revision:** flow-chat-00019-rl8

