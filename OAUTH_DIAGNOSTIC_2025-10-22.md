# 🔍 OAuth Diagnostic Report - October 22, 2025

## 🚨 Issue

**Error:** `invalid_client` when attempting OAuth authentication  
**Status:** Authentication fails after Google login

---

## 📊 Current Configuration

### From `.env.salfacorp`
```bash
GOOGLE_CLIENT_ID=82892384200-va003qnnoj9q0jf19j3jf0vects0st9h.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

### In Secret Manager
```bash
google-client-id:latest → 82892384200-va003qnnoj9q0jf19j3jf0vects0st9h.apps.googleusercontent.com ✅
google-client-secret:latest (v3) → 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 ✅
```

### In Google Console (from your screenshot)
```
Client ID: 82892384200-va003qnnoj9q0jf19j3jf0vects0st9h.apps.googleusercontent.com ✅
Secret: ****JvZj ✅ (matches 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)
Project: 82892384200 (salfagpt) ✅
```

### Redirect URIs in Console
```
✅ http://localhost:3000/auth/callback
✅ https://salfagpt-3snj65wckq-uc.a.run.app/auth/callback
```

---

## 🔍 Possible Causes

### 1. **OAuth Consent Screen Project Mismatch**
The OAuth client might be created in a different GCP project than where it's being used.

**To Verify:**
1. Go to: https://console.cloud.google.com/apis/credentials?project=salfagpt
2. Confirm the OAuth client listed is the same one
3. Check the project number matches: 82892384200

### 2. **OAuth Client Needs Reconfiguration**
The OAuth client in Google Console might need to be recreated or the credentials refreshed.

**To Fix:**
1. Go to: https://console.cloud.google.com/apis/credentials?project=salfagpt
2. Click on the OAuth client: `82892384200-va003qnnoj9q0jf19j3jf0vects0st9h`
3. Generate a NEW client secret
4. Update Secret Manager with the new value
5. Redeploy Cloud Run

### 3. **Consent Screen Not Published**
The OAuth consent screen might be in "Testing" mode or not properly configured.

**To Verify:**
1. Go to: https://console.cloud.google.com/apis/credentials/consent?project=salfagpt
2. Check if consent screen is published
3. Verify test users are added (if in testing mode)

---

## 🛠️ Recommended Fix Steps

### Option 1: Generate New OAuth Client Secret (Recommended)

```bash
# 1. Go to Google Console
https://console.cloud.google.com/apis/credentials?project=salfagpt

# 2. Click on OAuth client
# 3. Click "Add Secret" to generate a new one
# 4. Copy the new secret

# 5. Update Secret Manager
echo -n "NEW_SECRET_VALUE" | gcloud secrets versions add google-client-secret --data-file=- --project salfagpt

# 6. Wait 30 seconds for propagation
sleep 30

# 7. Test OAuth
open https://salfagpt-3snj65wckq-uc.a.run.app/chat
```

### Option 2: Verify Consent Screen

```bash
# Check consent screen status
gcloud alpha iap oauth-brands list --project salfagpt

# If not published, publish it in console:
# https://console.cloud.google.com/apis/credentials/consent?project=salfagpt
```

### Option 3: Create New OAuth Client

If the above don't work, create a fresh OAuth client:

```bash
# 1. Go to: https://console.cloud.google.com/apis/credentials?project=salfagpt
# 2. Click "+ CREATE CREDENTIALS" → "OAuth client ID"
# 3. Application type: "Web application"
# 4. Name: "SalfaGPT Production"
# 5. Authorized redirect URIs:
#    - https://salfagpt-3snj65wckq-uc.a.run.app/auth/callback
# 6. Save and copy the new credentials

# 7. Update secrets
echo -n "NEW_CLIENT_ID" | gcloud secrets versions add google-client-id --data-file=- --project salfagpt
echo -n "NEW_CLIENT_SECRET" | gcloud secrets versions add google-client-secret --data-file=- --project salfagpt
```

---

## 📝 What to Check in Google Console

### 1. OAuth Client Configuration
**URL:** https://console.cloud.google.com/apis/credentials?project=salfagpt

**Verify:**
- [ ] Client exists in salfagpt project (82892384200)
- [ ] Client ID matches: `82892384200-va003qnnoj9q0jf19j3jf0vects0st9h`
- [ ] Redirect URI includes: `https://salfagpt-3snj65wckq-uc.a.run.app/auth/callback`
- [ ] Client is "Enabled" status

### 2. OAuth Consent Screen
**URL:** https://console.cloud.google.com/apis/credentials/consent?project=salfagpt

**Verify:**
- [ ] Consent screen is configured
- [ ] App name is set
- [ ] Support email is set
- [ ] Scopes include email and profile
- [ ] Publishing status: "Published" or test users added

### 3. Enabled APIs
**URL:** https://console.cloud.google.com/apis/library?project=salfagpt

**Verify these APIs are enabled:**
- [ ] Google+ API
- [ ] Cloud Run API
- [ ] Firestore API
- [ ] Secret Manager API

---

## 🔐 Security Note

The `invalid_client` error from `https://oauth2.googleapis.com/token` suggests Google's OAuth server is rejecting the credentials during the token exchange.

**This usually means:**
1. Client ID and secret don't match
2. Client ID belongs to different project
3. OAuth client is disabled
4. Consent screen not properly configured

---

## 🎯 Next Action

**Please try the following:**

1. **Verify in Google Console** that the OAuth client is in the correct project
2. **Generate a new client secret** in the console
3. **Update the secret** in Secret Manager
4. **Test the OAuth flow** again

**Or:**

Let me know if you want me to create a completely new OAuth client from scratch to ensure everything is properly aligned.

---

**Created:** October 22, 2025  
**Status:** Needs manual verification in Google Console

