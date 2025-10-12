# 🔧 OAuth Production Fix - "Missing redirect_uri" Error

## 🚨 Problem

Error: `Error 400: invalid_request - Missing required parameter: redirect_uri`

This happens when `PUBLIC_BASE_URL` is not set in production or when `redirect_uri` is not explicitly passed to Google OAuth.

---

## ✅ Solution Implemented

### Code Fix

Updated `src/lib/auth.ts` to explicitly pass `redirect_uri`:

```typescript
export function getAuthorizationUrl(): string {
  const scopes = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ];

  // Explicitly pass redirect_uri to avoid production issues
  const redirectUri = `${BASE_URL}/auth/callback`;
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
    redirect_uri: redirectUri, // ⭐ NOW EXPLICIT
  });
}
```

---

## 🔧 Required Configuration in GCP

### Step 1: Get Your Production URL

Get your Cloud Run service URL:

```bash
gcloud run services describe flow-chat \
  --platform managed \
  --region us-central1 \
  --format 'value(status.url)'
```

Example output:
```
https://flow-chat-xxxxx-uc.a.run.app
```

### Step 2: Configure OAuth Credentials

1. Go to [Google Cloud Console - OAuth Credentials](https://console.cloud.google.com/apis/credentials?project=gen-lang-client-0986191192)

2. Find your OAuth 2.0 Client ID (or create one if needed)

3. Click **Edit** (pencil icon)

4. Add to **Authorized JavaScript origins**:
   ```
   https://flow-chat-xxxxx-uc.a.run.app
   ```
   
   ⚠️ Replace `xxxxx` with your actual Cloud Run hash
   
   **Important:**
   - ✅ Use `https://` (required for production)
   - ❌ NO trailing slash
   - ❌ NO port number
   - ❌ NO paths

5. Add to **Authorized redirect URIs**:
   ```
   https://flow-chat-xxxxx-uc.a.run.app/auth/callback
   ```
   
   **Important:**
   - ✅ Must include `/auth/callback` path
   - ✅ Must match exactly
   - ❌ NO wildcards
   - ❌ NO URL fragments

6. Click **SAVE**

7. ⏰ **Wait 5-10 minutes** for changes to propagate

### Step 3: Set Environment Variables in Cloud Run

```bash
gcloud run services update flow-chat \
  --platform managed \
  --region us-central1 \
  --set-env-vars="PUBLIC_BASE_URL=https://flow-chat-xxxxx-uc.a.run.app"
```

⚠️ Replace `xxxxx` with your actual Cloud Run hash

**Verify it's set:**
```bash
gcloud run services describe flow-chat \
  --platform managed \
  --region us-central1 \
  --format 'value(spec.template.spec.containers[0].env)'
```

### Step 4: Verify Other Required ENV Vars

Make sure these are also set in Cloud Run:

```bash
gcloud run services update flow-chat \
  --platform managed \
  --region us-central1 \
  --set-env-vars="\
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com,\
GOOGLE_CLIENT_SECRET=GOCSPX-YOUR_SECRET,\
JWT_SECRET=YOUR_JWT_SECRET,\
PUBLIC_BASE_URL=https://flow-chat-xxxxx-uc.a.run.app,\
GOOGLE_CLOUD_PROJECT=gen-lang-client-0986191192,\
GEMINI_API_KEY=YOUR_GEMINI_KEY"
```

**Or use Secret Manager (Recommended):**

```bash
gcloud run services update flow-chat \
  --platform managed \
  --region us-central1 \
  --set-secrets="GOOGLE_CLIENT_SECRET=google-client-secret:latest,\
JWT_SECRET=jwt-secret:latest,\
GEMINI_API_KEY=gemini-api-key:latest" \
  --set-env-vars="GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com,\
PUBLIC_BASE_URL=https://flow-chat-xxxxx-uc.a.run.app,\
GOOGLE_CLOUD_PROJECT=gen-lang-client-0986191192"
```

---

## 🧪 Testing the Fix

### Test 1: Check Logs

```bash
# Stream logs from Cloud Run
gcloud run services logs read flow-chat \
  --platform managed \
  --region us-central1 \
  --limit 50
```

Look for:
```
OAuth Config: {
  clientId: '***xxxxx',
  baseUrl: 'https://flow-chat-xxxxx-uc.a.run.app',
  redirectUri: 'https://flow-chat-xxxxx-uc.a.run.app/auth/callback'
}
```

If `baseUrl` shows `http://localhost:3000` → Environment variable not set!

### Test 2: Try OAuth Login

1. Open your production URL in browser
2. Click "Continue with Google" or go to `/auth/login`
3. Should redirect to Google OAuth
4. Should NOT see "Missing redirect_uri" error
5. After login, should redirect back to your app

### Test 3: Verify with curl

```bash
# Replace with your actual URL
PROD_URL="https://flow-chat-xxxxx-uc.a.run.app"

# Test auth endpoint
curl -I $PROD_URL/auth/login

# Should return 302 redirect to Google OAuth
# Check Location header - should have redirect_uri parameter
```

---

## 🚨 Common Issues

### Issue 1: redirect_uri_mismatch

**Error:** `Error 400: redirect_uri_mismatch`

**Cause:** The redirect URI doesn't match what's in Google Cloud Console

**Solution:**
1. Get your EXACT Cloud Run URL (including hash)
2. Add it to OAuth credentials (both origin AND redirect)
3. Wait 5-10 minutes
4. Try again

### Issue 2: Still shows localhost

**Symptoms:** Logs show `baseUrl: 'http://localhost:3000'`

**Cause:** `PUBLIC_BASE_URL` environment variable not set in Cloud Run

**Solution:**
```bash
gcloud run services update flow-chat \
  --set-env-vars="PUBLIC_BASE_URL=https://your-actual-url.run.app"
```

### Issue 3: Invalid client

**Error:** `Error 400: invalid_client`

**Cause:** Client ID or Secret not set or incorrect

**Solution:**
1. Verify credentials in Google Cloud Console
2. Copy Client ID and Secret exactly (no extra spaces)
3. Update environment variables in Cloud Run
4. Redeploy

---

## 📋 Complete Deployment Checklist

- [ ] Code updated with explicit `redirect_uri`
- [ ] Code deployed to Cloud Run
- [ ] Get production Cloud Run URL
- [ ] Add URL to OAuth Authorized JavaScript origins
- [ ] Add URL/auth/callback to OAuth Authorized redirect URIs
- [ ] Set `PUBLIC_BASE_URL` environment variable
- [ ] Set `GOOGLE_CLIENT_ID` environment variable
- [ ] Set `GOOGLE_CLIENT_SECRET` (via Secret Manager or env var)
- [ ] Set `JWT_SECRET` (via Secret Manager or env var)
- [ ] Set `GEMINI_API_KEY` (via Secret Manager or env var)
- [ ] Wait 5-10 minutes for OAuth changes to propagate
- [ ] Test OAuth login flow
- [ ] Check Cloud Run logs for OAuth Config
- [ ] Verify successful login
- [ ] Test chat functionality

---

## 🔍 Debug Commands

### Get Cloud Run Service URL
```bash
gcloud run services describe flow-chat \
  --platform managed \
  --region us-central1 \
  --format 'value(status.url)'
```

### Get Current Environment Variables
```bash
gcloud run services describe flow-chat \
  --platform managed \
  --region us-central1 \
  --format 'json(spec.template.spec.containers[0].env)'
```

### View Recent Logs
```bash
gcloud run services logs read flow-chat \
  --platform managed \
  --region us-central1 \
  --limit 100 \
  --format 'value(textPayload)'
```

### Test OAuth Endpoint
```bash
# Replace with your URL
PROD_URL="https://flow-chat-xxxxx-uc.a.run.app"

# Get redirect location
curl -s -o /dev/null -w "%{redirect_url}" $PROD_URL/auth/login

# Should output something like:
# https://accounts.google.com/o/oauth2/v2/auth?access_type=offline&scope=...&redirect_uri=https://flow-chat-xxxxx-uc.a.run.app/auth/callback
```

---

## 💡 Prevention

To avoid this issue in the future:

1. **Always set `PUBLIC_BASE_URL` in environment:**
   - Local: `.env` file with `http://localhost:3000`
   - Staging: Cloud Run env var with staging URL
   - Production: Cloud Run env var with production URL

2. **Always register OAuth URLs before deploying:**
   - Add new domains to OAuth credentials FIRST
   - Wait for changes to propagate
   - THEN deploy code to that domain

3. **Use Secret Manager for sensitive values:**
   ```bash
   # Create secrets
   echo -n "YOUR_SECRET" | gcloud secrets create google-client-secret --data-file=-
   
   # Use in Cloud Run
   gcloud run services update flow-chat --set-secrets="GOOGLE_CLIENT_SECRET=google-client-secret:latest"
   ```

4. **Monitor OAuth logs:**
   - Check Cloud Run logs regularly
   - Look for "OAuth Config" log entries
   - Verify `baseUrl` and `redirectUri` are correct

---

## ✅ Verification

After implementing all fixes, you should see:

**In Cloud Run Logs:**
```
OAuth Config: {
  clientId: '***1234567890',
  baseUrl: 'https://flow-chat-actual-hash-uc.a.run.app',
  redirectUri: 'https://flow-chat-actual-hash-uc.a.run.app/auth/callback'
}
```

**In Google OAuth:**
- No errors
- Smooth redirect to Google login
- Successful return to app
- User logged in

**In Browser:**
- No "Authorization Error"
- No "Missing redirect_uri"
- Successful OAuth flow
- Session created
- Can use app

---

## 📞 Still Having Issues?

If you still see errors after following all steps:

1. **Check the exact error message** in browser
2. **Check Cloud Run logs** for OAuth Config
3. **Verify OAuth credentials** in Google Cloud Console
4. **Wait 5-10 minutes** after making OAuth changes
5. **Try incognito mode** to avoid caching issues
6. **Check service account permissions** (if using Workload Identity)

---

**Last Updated:** 2025-10-12  
**Status:** ✅ Fix Implemented & Documented  
**Project:** Flow (gen-lang-client-0986191192)

