# 🔐 OAuth Login Issue Diagnostic (2025-10-22)

## 🚨 Problem

**Error:** "Error al Procesar - Ocurrió un error al procesar tu inicio de sesión"  
**Technical Error:** `invalid_client` (HTTP 401 Unauthorized)  
**Location:** OAuth token exchange at `https://oauth2.googleapis.com/token`

## 🔍 Current Configuration

### Environment Variables in Cloud Run ✅
```
GOOGLE_CLIENT_ID=82892384200-va003qnnoj9q0jf19j3jf0vects0st9h.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
PUBLIC_BASE_URL=https://salfagpt-3snj65wckq-uc.a.run.app
```

### OAuth Redirect URIs in Google Console ✅
According to your configuration:
```
Authorized JavaScript origins:
- http://localhost:3000
- https://salfagpt-3snj65wckq-uc.a.run.app

Authorized redirect URIs:
- http://localhost:3000/auth/callback
- https://salfagpt-3snj65wckq-uc.a.run.app/auth/callback
```

### Project Information ✅
- **Project ID:** salfagpt
- **Project Number:** 82892384200
- **OAuth Client ID starts with:** 82892384200 (matches project number ✅)

## 🎯 Root Cause Analysis

The `invalid_client` error with HTTP 401 means Google is rejecting the OAuth client credentials during the token exchange. This can happen for several reasons:

### Possible Causes

1. **Client Secret Mismatch** ⚠️ **MOST LIKELY**
   - The `GOOGLE_CLIENT_SECRET` in Cloud Run doesn't match what's in Google Console
   - Even a single character difference will cause this error

2. **OAuth Client Belongs to Different Project** (Less likely since ID matches)
   - The OAuth client might be in a different GCP project
   - The project number (82892384200) should match

3. **OAuth Client Settings**
   - Application type might be wrong (should be "Web application")
   - Client might be disabled

4. **Timing Issue** (Unlikely but possible)
   - Google says settings can take 5 minutes to hours to propagate
   - If you just created/modified the OAuth client, wait 10-15 minutes

## 🔧 Step-by-Step Fix

### Step 1: Verify OAuth Client in Google Console

1. **Open Google Cloud Console:**
   - Go to: https://console.cloud.google.com/apis/credentials?project=salfagpt
   - **CRITICAL:** Make sure you're in the **`salfagpt`** project (check top bar)

2. **Find OAuth 2.0 Client ID:**
   - Look for "SalfaGPT" or the client ID: `82892384200-va003qnnoj9q0jf19j3jf0vects0st9h`
   - Click on it to open details

3. **Verify Application Type:**
   - Should be: **"Web application"** (NOT Desktop, iOS, Android, etc.)
   - If wrong type, you need to create a new OAuth client

4. **Get the EXACT Client Secret:**
   - Click "SHOW CLIENT SECRET" or "DOWNLOAD JSON"
   - Copy the **exact** secret (it should start with `GOCSPX-`)
   - Compare with what's in your `.env` file

### Step 2: Verify Redirect URIs

Make sure these EXACT URIs are listed (case-sensitive):

```
✅ http://localhost:3000/auth/callback
✅ https://salfagpt-3snj65wckq-uc.a.run.app/auth/callback
```

**Common mistakes:**
- ❌ Using `/callback` instead of `/auth/callback`
- ❌ Missing `https://` prefix
- ❌ Extra trailing slash
- ❌ Wrong domain

### Step 3: Update Cloud Run with Correct Credentials

If you found the secret is different, update Cloud Run:

```bash
# Update just the client secret
gcloud run services update salfagpt \
  --region us-central1 \
  --project salfagpt \
  --update-env-vars="GOOGLE_CLIENT_SECRET=YOUR_CORRECT_SECRET"

# Or update both client ID and secret
gcloud run services update salfagpt \
  --region us-central1 \
  --project salfagpt \
  --update-env-vars="GOOGLE_CLIENT_ID=YOUR_CLIENT_ID,GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET"
```

### Step 4: Wait for Propagation

After updating:
- Cloud Run: ~30 seconds to 2 minutes
- Google OAuth: 5 minutes to 1 hour (if you changed OAuth settings)

### Step 5: Test Again

1. Clear browser cache and cookies for the site
2. Visit: https://salfagpt-3snj65wckq-uc.a.run.app
3. Click "Continue with Google"
4. Complete OAuth flow
5. Should redirect to /chat successfully

## 🔍 Detailed Log Analysis

From the Cloud Run logs, I can see:

```
POST to: https://oauth2.googleapis.com/token
With:
  client_id: 82892384200-va003qnnoj9q0jf19j3jf0vects0st9h.apps.googleusercontent.com
  client_secret: [REDACTED]
  redirect_uri: https://salfagpt-3snj65wckq-uc.a.run.app/auth/callback
  code: 4/0AVGzR1CPrGJ2ILh5NV2g9bKscT5gBE00ITepcc_MeKMz3DAOF7koxyDHNI8nzb81NvP5Ow
  grant_type: [REDACTED]

Response:
  HTTP 401 Unauthorized
  { error: 'invalid_client', error_description: 'Unauthorized' }
```

This confirms the issue is with the client credentials (ID or Secret).

## 🎯 Most Likely Solutions

### Solution 1: Client Secret is Wrong ⭐ **START HERE**

The most common cause is the Client Secret doesn't match:

1. Go to Google Console Credentials
2. Find your OAuth client
3. Click "SHOW CLIENT SECRET" 
4. Copy the **exact** value
5. Compare with `.env` file: `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`
6. If different, update:

```bash
# Update your .env file first
nano .env
# Change GOOGLE_CLIENT_SECRET to the correct value

# Then update Cloud Run
gcloud run services update salfagpt \
  --region us-central1 \
  --project salfagpt \
  --update-env-vars="GOOGLE_CLIENT_SECRET=CORRECT_SECRET_FROM_CONSOLE"
```

### Solution 2: OAuth Client in Wrong Project

The Client ID `82892384200-...` might be from a different project:

1. Check the project number in Google Console when viewing the OAuth client
2. It should match: 82892384200
3. If it shows a different number, the client is in the wrong project
4. You'll need to either:
   - Use the correct OAuth client from `salfagpt` project, OR
   - Deploy to the project where this OAuth client exists

### Solution 3: Create New OAuth Client

If the current one is broken or in wrong project:

1. **Go to:** https://console.cloud.google.com/apis/credentials?project=salfagpt
2. **Click:** "+ CREATE CREDENTIALS" → "OAuth client ID"
3. **Application type:** Web application
4. **Name:** SalfaGPT Production
5. **Authorized JavaScript origins:**
   ```
   http://localhost:3000
   https://salfagpt-3snj65wckq-uc.a.run.app
   ```
6. **Authorized redirect URIs:**
   ```
   http://localhost:3000/auth/callback
   https://salfagpt-3snj65wckq-uc.a.run.app/auth/callback
   ```
7. **Click "CREATE"**
8. **Copy the Client ID and Client Secret**
9. **Update .env and Cloud Run** with new credentials

## 🧪 Quick Test Commands

### Test 1: Verify Current OAuth Config in Cloud Run
```bash
gcloud run services describe salfagpt \
  --region us-central1 \
  --project salfagpt \
  --format="json" | jq -r '.spec.template.spec.containers[0].env[] | select(.name | startswith("GOOGLE_")) | "\(.name)=\(.value)"'
```

### Test 2: Check Logs for OAuth Errors
```bash
gcloud logging read 'resource.type=cloud_run_revision AND resource.labels.service_name=salfagpt AND severity>=ERROR' \
  --limit=10 \
  --project=salfagpt \
  --format="value(textPayload)"
```

### Test 3: Test Health Endpoint (Should work)
```bash
curl https://salfagpt-3snj65wckq-uc.a.run.app/api/health/firestore
```

### Test 4: Get OAuth Authorization URL
You can manually construct the OAuth URL to test:
```
https://accounts.google.com/o/oauth2/auth?client_id=82892384200-va003qnnoj9q0jf19j3jf0vects0st9h.apps.googleusercontent.com&redirect_uri=https://salfagpt-3snj65wckq-uc.a.run.app/auth/callback&response_type=code&scope=https://www.googleapis.com/auth/userinfo.email%20https://www.googleapis.com/auth/userinfo.profile&access_type=offline&prompt=consent
```

Visit this URL in your browser. If it works, the Client ID and redirect URI are correct.

## 📋 Verification Checklist

Before making changes, verify:

- [ ] You're looking at the **salfagpt** project in Google Console (not another project)
- [ ] The OAuth client ID matches: `82892384200-va003qnnoj9q0jf19j3jf0vects0st9h`
- [ ] The client secret in Google Console matches your `.env` file **exactly**
- [ ] Application type is "Web application"
- [ ] Redirect URIs include production URL with `/auth/callback`
- [ ] OAuth consent screen is configured

## 🚨 Emergency Workaround

If you need immediate access and can't fix OAuth:

1. **Temporarily disable domain filtering:**
   ```bash
   # This would bypass domain check, but OAuth still needs to work
   # Not recommended for production
   ```

2. **Use a different user account:**
   - Try logging in with alec@salfacloud.cl (if domain is enabled)
   - Check domain settings in Firestore `domains` collection

## 📞 Next Actions

**IMMEDIATE:** Verify the Client Secret

1. Open: https://console.cloud.google.com/apis/credentials?project=salfagpt
2. Find OAuth client: `82892384200-va003qnnoj9q0jf19j3jf0vects0st9h`
3. Show client secret
4. Compare with `.env`: `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`
5. If different, copy the correct one
6. Update Cloud Run (command below)

## 🔧 Fix Command

Once you have the correct Client Secret:

```bash
# Update Cloud Run with correct secret
gcloud run services update salfagpt \
  --region us-central1 \
  --project salfagpt \
  --update-env-vars="GOOGLE_CLIENT_SECRET=PASTE_CORRECT_SECRET_HERE"

# Wait 30-60 seconds for deployment

# Test login again
```

---

**Status:** 🔍 Awaiting OAuth credential verification  
**Next Step:** Verify Client Secret in Google Console  
**ETA to Fix:** < 5 minutes once correct secret is found
