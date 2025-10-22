# 🔐 OAuth Login Fix - Action Required (2025-10-22)

## ✅ Deployment Status

Your application is **successfully deployed** to Cloud Run:
- **URL:** https://salfagpt-3snj65wckq-uc.a.run.app
- **Health Check:** ✅ All systems operational
- **Environment Variables:** ✅ All 14 variables configured
- **Firestore:** ✅ Connected and working

## 🚨 Current Issue: OAuth Login Failing

**Error Message:** "Error al Procesar - Ocurrió un error al procesar tu inicio de sesión"  
**Technical Error:** `invalid_client` from Google OAuth

**Root Cause:** The OAuth Client Secret in Cloud Run doesn't match what's registered in Google Console.

## 🎯 Quick Fix (5 minutes)

### Step 1: Get the Correct Client Secret

1. **Open Google Cloud Console:**
   ```
   https://console.cloud.google.com/apis/credentials?project=salfagpt
   ```

2. **Verify you're in project:** `salfagpt` (check top navigation bar)

3. **Find OAuth 2.0 Client ID:** 
   - Name: "SalfaGPT"
   - Client ID: `82892384200-va003qnnoj9q0jf19j3jf0vects0st9h`

4. **Click on the client name** to open details

5. **Click "SHOW CLIENT SECRET"** (button on the right)

6. **Copy the exact secret** (format: `GOCSPX-xxxxxxxxxxxxxxxxxxxxx`)

### Step 2: Compare with Current Configuration

**What's currently in Cloud Run:**
```
GOOGLE_CLIENT_SECRET=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
```

**What's in Google Console:**
```
GOOGLE_CLIENT_SECRET=[Copy from Google Console]
```

**Do they match EXACTLY?**
- ✅ Yes → Problem might be elsewhere (see Alternative Fixes below)
- ❌ No → **This is the issue! Proceed to Step 3**

### Step 3: Update Cloud Run with Correct Secret

Run this command with the **correct** secret from Google Console:

```bash
gcloud run services update salfagpt \
  --region us-central1 \
  --project salfagpt \
  --update-env-vars="GOOGLE_CLIENT_SECRET=PASTE_CORRECT_SECRET_HERE"
```

**Or use the automated script:**
```bash
./fix-oauth.sh
```

### Step 4: Wait and Test

1. **Wait:** 30-60 seconds for Cloud Run to redeploy
2. **Clear:** Browser cache and cookies for the site
3. **Test:** Visit https://salfagpt-3snj65wckq-uc.a.run.app
4. **Login:** Click "Continue with Google"

## 🔍 Alternative Fixes (If Client Secret is Correct)

### Fix A: Verify OAuth Client Belongs to Correct Project

The Client ID starts with `82892384200` which is the project number. Verify:

```bash
# Check salfagpt project number
gcloud projects describe salfagpt --format="value(projectNumber)"
# Should output: 82892384200
```

If the numbers match, the OAuth client IS in the correct project ✅

### Fix B: Verify Redirect URIs in Google Console

Make sure these EXACT URIs are listed (case-sensitive, no trailing slash):

**Required:**
```
https://salfagpt-3snj65wckq-uc.a.run.app/auth/callback
http://localhost:3000/auth/callback
```

**Common mistakes to avoid:**
- ❌ `https://salfagpt-3snj65wckq-uc.a.run.app/callback` (missing `/auth`)
- ❌ `https://salfagpt-3snj65wckq-uc.a.run.app/auth/callback/` (extra slash)
- ❌ Using a different domain

### Fix C: Check OAuth Consent Screen

1. Go to: https://console.cloud.google.com/apis/credentials/consent?project=salfagpt
2. Verify:
   - App name is set
   - User support email is set
   - Authorized domains includes: `a.run.app` (for Cloud Run URLs)
   - Publishing status (Internal vs External)

### Fix D: Create New OAuth Client (Last Resort)

If all else fails, create a fresh OAuth client:

1. Go to: https://console.cloud.google.com/apis/credentials?project=salfagpt
2. Click "+ CREATE CREDENTIALS" → "OAuth client ID"
3. Application type: **Web application**
4. Name: **SalfaGPT Prod v2**
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
7. Click **CREATE**
8. Copy the new Client ID and Secret
9. Update both `.env` file and Cloud Run:

```bash
# Update .env locally
nano .env
# Change GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET

# Update Cloud Run
gcloud run services update salfagpt \
  --region us-central1 \
  --project salfagpt \
  --update-env-vars="GOOGLE_CLIENT_ID=NEW_CLIENT_ID,GOOGLE_CLIENT_SECRET=NEW_CLIENT_SECRET"
```

## 📊 Diagnostic Information

### What We Know

✅ **Deployment:** Successful  
✅ **Project:** salfagpt (82892384200)  
✅ **OAuth Client ID:** 82892384200-va003qnnoj9q0jf19j3jf0vects0st9h  
✅ **Redirect URI in logs:** https://salfagpt-3snj65wckq-uc.a.run.app/auth/callback  
✅ **Health Check:** All systems working  
❌ **OAuth Token Exchange:** Failing with `invalid_client`

### From Cloud Run Logs

```
Request to Google:
  POST https://oauth2.googleapis.com/token
  client_id: 82892384200-va003qnnoj9q0jf19j3jf0vects0st9h.apps.googleusercontent.com
  redirect_uri: https://salfagpt-3snj65wckq-uc.a.run.app/auth/callback
  client_secret: [REDACTED]

Response from Google:
  HTTP 401 Unauthorized
  { error: 'invalid_client', error_description: 'Unauthorized' }
```

This is a **textbook `invalid_client` error**, which means:
1. Client Secret is wrong (95% of cases) ⭐
2. Client ID doesn't exist (rare)
3. Client is disabled (rare)

## 🎬 Step-by-Step Video Walkthrough

### Getting the Correct Client Secret

1. **Open:** https://console.cloud.google.com/apis/credentials?project=salfagpt
2. **Look for:** "OAuth 2.0 Client IDs" section
3. **Find row with:**
   - Name: "SalfaGPT" or similar
   - Client ID ending in: `...st9h.apps.googleusercontent.com`
4. **Click the name** (not the download button)
5. **On the right side:** Click "SHOW CLIENT SECRET" button
6. **Copy the value** (should be ~40 characters starting with `GOCSPX-`)
7. **Compare with .env:**
   ```bash
   cat .env | grep GOOGLE_CLIENT_SECRET
   # Current: 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
   ```
8. **If different:** Run the fix command below

### Updating Cloud Run

```bash
# Replace CORRECT_SECRET_HERE with the value from Google Console
gcloud run services update salfagpt \
  --region us-central1 \
  --project salfagpt \
  --update-env-vars="GOOGLE_CLIENT_SECRET=CORRECT_SECRET_HERE"
```

### Verifying the Fix

```bash
# Wait 30 seconds
sleep 30

# Check deployment
gcloud run services describe salfagpt \
  --region us-central1 \
  --project salfagpt \
  --format="value(status.latestReadyRevisionName)"

# Should show new revision (salfagpt-00003-xxx)
```

### Testing Login

1. **Clear browser data:** 
   - Chrome: Settings → Privacy → Clear browsing data
   - Or use Incognito mode

2. **Visit:** https://salfagpt-3snj65wckq-uc.a.run.app

3. **Click:** "Continue with Google"

4. **Expected:**
   - Google OAuth screen appears ✅
   - You select/login with account
   - Redirects back to app
   - You're logged in and see /chat ✅

## 🔎 Troubleshooting

### Still Getting `invalid_client`?

1. **Wait longer:** OAuth changes can take 5-15 minutes to propagate
2. **Check both secrets match:**
   ```bash
   # In Cloud Run
   gcloud run services describe salfagpt --region us-central1 --project salfagpt \
     --format="json" | jq -r '.spec.template.spec.containers[0].env[] | select(.name=="GOOGLE_CLIENT_SECRET") | .value'
   
   # In Google Console (manually compare)
   ```
3. **Verify Client ID is also correct**
4. **Check Cloud Run logs for new errors:**
   ```bash
   gcloud logging read 'resource.type=cloud_run_revision AND resource.labels.service_name=salfagpt AND severity>=ERROR' \
     --limit=5 --project=salfagpt --format="value(textPayload)"
   ```

### Getting Different Error?

- **`redirect_uri_mismatch`:** Add production URL to authorized redirect URIs
- **`access_denied`:** User didn't authorize the app
- **`domain_disabled`:** Domain filtering is blocking the user (see domain management)

## 📝 Update Local .env Too

Don't forget to update your local `.env` file with the correct secret:

```bash
nano .env
# Update GOOGLE_CLIENT_SECRET line
# Save and exit
```

This ensures local development uses the same credentials.

## ✅ Success Criteria

After applying the fix, you should see:

1. **Login Flow:**
   - Click "Continue with Google" ✅
   - Google OAuth screen appears ✅
   - Select account ✅
   - Redirect to /chat ✅
   - See chat interface ✅

2. **No Errors:**
   - No "Error al Procesar" message
   - No `invalid_client` in logs
   - Authentication completes successfully

3. **Session Persists:**
   - Refresh page stays logged in
   - Cookie is set properly
   - Can access protected routes

---

## 📞 Support

**Files Created:**
- `OAUTH_DIAGNOSTIC_2025-10-22.md` - Detailed diagnostic
- `fix-oauth.sh` - Automated fix script (run this!)
- `OAUTH_FIX_APPLIED_2025-10-22.md` - This file

**Quick Commands:**
```bash
# Run automated fix
./fix-oauth.sh

# Or manual fix
gcloud run services update salfagpt \
  --region us-central1 \
  --project salfagpt \
  --update-env-vars="GOOGLE_CLIENT_SECRET=YOUR_SECRET_FROM_CONSOLE"
```

**Check Logs:**
```bash
# Recent errors
gcloud logging read 'resource.type=cloud_run_revision AND resource.labels.service_name=salfagpt AND severity>=ERROR' \
  --limit=10 --project=salfagpt

# All recent logs
gcloud logging read 'resource.type=cloud_run_revision AND resource.labels.service_name=salfagpt' \
  --limit=50 --project=salfagpt --format="value(textPayload)"
```

---

**Status:** 🔧 Fix ready to apply  
**Action Required:** Verify Client Secret in Google Console  
**ETA:** < 5 minutes to resolve
