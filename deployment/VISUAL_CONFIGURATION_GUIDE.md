# 🎨 Visual Configuration Guide

**What the screens look like for manual configuration**

---

## 📋 Overview

You need to configure **3 things manually** per client environment:

1. ✅ **Secrets** (8 min) - via gcloud or Console
2. ✅ **OAuth Client** (10 min) - via Console
3. ✅ **OAuth Redirect URIs** (2 min) - via Console (after deployment)

**Total**: ~20 minutes per environment

---

## 🔐 TASK 1: Create Secrets

### Option A: Using gcloud (Recommended)

```bash
# Set project
gcloud config set project acme-flow-staging-12345

# Generate JWT secret
JWT_SECRET=$(openssl rand -base64 32)
echo "JWT Secret: $JWT_SECRET"

# Create all 3 secrets
echo -n "AIzaSy_YOUR_GEMINI_KEY" | gcloud secrets create google-ai-api-key --data-file=-
echo -n "GOCSPX_YOUR_OAUTH_SECRET" | gcloud secrets create google-client-secret --data-file=-
echo -n "$JWT_SECRET" | gcloud secrets create jwt-secret --data-file=-

# ✅ Done in 2 minutes
```

### Option B: Using Console

**Navigate to**: https://console.cloud.google.com/security/secret-manager?project=[PROJECT-ID]

**For each secret**:
1. Click **"Create Secret"**
2. Name: `google-ai-api-key` (or `google-client-secret`, `jwt-secret`)
3. Secret value: [paste value]
4. Click **"Create Secret"**

**Repeat 3 times**

---

## 🔑 TASK 2: Configure OAuth Client

### Part 1: OAuth Consent Screen

**Navigate to**: https://console.cloud.google.com/apis/credentials/consent?project=[PROJECT-ID]

**You'll see**:
```
┌─────────────────────────────────────────────┐
│  OAuth consent screen                        │
│  Configure how users see your app           │
├─────────────────────────────────────────────┤
│                                             │
│  User Type:                                 │
│  ○ Internal (Google Workspace only)         │
│  ● External (Anyone with Google account)    │
│                                             │
│  [Continue]                                 │
└─────────────────────────────────────────────┘
```

**Click**: "Configure Consent Screen" or "Edit App"

**Page 1: App Information**
```
┌─────────────────────────────────────────────┐
│  App information                             │
├─────────────────────────────────────────────┤
│                                             │
│  App name *                                 │
│  ┌─────────────────────────────────────┐   │
│  │ Flow Staging                        │   │ ← Client's brand name
│  └─────────────────────────────────────┘   │
│                                             │
│  User support email *                       │
│  ┌─────────────────────────────────────┐   │
│  │ support@acme.com                    │   │ ← Client's email
│  └─────────────────────────────────────┘   │
│                                             │
│  App logo (optional)                        │
│  [Upload]                                   │ ← Client's logo
│                                             │
│  App domain (optional)                      │
│  ┌─────────────────────────────────────┐   │
│  │ https://staging.acme.com            │   │ ← Custom domain
│  └─────────────────────────────────────┘   │
│                                             │
│  Authorized domains                         │
│  ┌─────────────────────────────────────┐   │
│  │ acme.com                            │   │ ← Add domain
│  │ + Add domain                        │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Developer contact information *            │
│  ┌─────────────────────────────────────┐   │
│  │ alec@getaifactory.com               │   │ ← Your email
│  └─────────────────────────────────────┘   │
│                                             │
│  [Save and Continue]                        │
└─────────────────────────────────────────────┘
```

**Click**: "Save and Continue"

**Page 2: Scopes**
```
┌─────────────────────────────────────────────┐
│  Scopes                                      │
│  What data your app can access              │
├─────────────────────────────────────────────┤
│                                             │
│  [Add or Remove Scopes]                     │
│                                             │
│  Search: email                              │
│  ┌─────────────────────────────────────┐   │
│  │ ✅ userinfo.email                   │   │ ← Check this
│  │ ✅ userinfo.profile                 │   │ ← Check this
│  └─────────────────────────────────────┘   │
│                                             │
│  [Update]  [Cancel]                         │
│                                             │
│  Selected scopes:                           │
│  • userinfo.email                           │
│  • userinfo.profile                         │
│                                             │
│  [Save and Continue]                        │
└─────────────────────────────────────────────┘
```

**Click**: "Add or Remove Scopes" → Check the 2 scopes → "Update" → "Save and Continue"

**Page 3: Test Users** (for External type)
```
┌─────────────────────────────────────────────┐
│  Test users                                  │
│  Add emails to test your OAuth flow         │
├─────────────────────────────────────────────┤
│                                             │
│  [+ Add Users]                              │
│                                             │
│  Test users:                                │
│  • alec@getaifactory.com                    │
│  • client@acme.com                          │
│                                             │
│  [Save and Continue]                        │
└─────────────────────────────────────────────┘
```

**Click**: "Save and Continue" → "Back to Dashboard"

**✅ OAuth Consent Screen Configured**

---

### Part 2: Create OAuth 2.0 Client

**Navigate to**: https://console.cloud.google.com/apis/credentials?project=[PROJECT-ID]

**Click**: "Create Credentials" → "OAuth 2.0 Client ID"

```
┌─────────────────────────────────────────────┐
│  Create OAuth client ID                      │
├─────────────────────────────────────────────┤
│                                             │
│  Application type *                         │
│  ● Web application                          │ ← Select this
│  ○ Android                                  │
│  ○ Chrome app                               │
│  ○ iOS                                      │
│  ○ Desktop app                              │
│                                             │
│  Name *                                     │
│  ┌─────────────────────────────────────┐   │
│  │ Flow Client Staging                 │   │ ← Descriptive name
│  └─────────────────────────────────────┘   │
│                                             │
│  Authorized JavaScript origins              │
│  ┌─────────────────────────────────────┐   │
│  │ (Leave empty for now)               │   │ ← Add after deployment
│  │ + Add URI                           │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Authorized redirect URIs                   │
│  ┌─────────────────────────────────────┐   │
│  │ (Leave empty for now)               │   │ ← Add after deployment
│  │ + Add URI                           │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  [Create]  [Cancel]                         │
└─────────────────────────────────────────────┘
```

**Click**: "Create"

**You'll see**:
```
┌─────────────────────────────────────────────┐
│  OAuth client created                        │
├─────────────────────────────────────────────┤
│                                             │
│  Your Client ID                             │
│  ┌─────────────────────────────────────┐   │
│  │ 123456789-abc.apps.google...        │   │ ← COPY THIS
│  │ [Copy]                              │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Your Client Secret                         │
│  ┌─────────────────────────────────────┐   │
│  │ GOCSPX-abc123xyz                    │   │ ← COPY THIS
│  │ [Copy]                              │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  [OK]                                       │
└─────────────────────────────────────────────┘
```

**SAVE THESE VALUES**:
```
Client ID: 123456789-abc.apps.googleusercontent.com
Client Secret: GOCSPX-abc123xyz
```

**Add to .env file**:
```bash
GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123xyz
```

**✅ OAuth Client Created**

---

## 🌐 TASK 3: Update OAuth Redirect URIs (After Deployment)

**After you deploy**, you'll get a URL:
```
✅ Service deployed: https://flow-staging-abc123.run.app
```

**Go back to OAuth client**:

**Navigate to**: https://console.cloud.google.com/apis/credentials?project=[PROJECT-ID]

**Click on**: "Flow Client Staging" (the OAuth client you created)

**Edit screen**:
```
┌─────────────────────────────────────────────┐
│  Edit OAuth client ID                        │
├─────────────────────────────────────────────┤
│                                             │
│  Name                                       │
│  ┌─────────────────────────────────────┐   │
│  │ Flow Client Staging                 │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Authorized JavaScript origins              │
│  ┌─────────────────────────────────────┐   │
│  │ https://flow-staging-abc123.run.app │   │ ← ADD deployed URL
│  │ + Add URI                           │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Authorized redirect URIs                   │
│  ┌─────────────────────────────────────┐   │
│  │ https://flow-staging-abc123.run.app │   │
│  │ /auth/callback                      │   │ ← ADD /auth/callback
│  │ + Add URI                           │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  [Save]  [Cancel]                           │
└─────────────────────────────────────────────┘
```

**Add these 2 URIs**:
1. JavaScript origin: `https://flow-staging-abc123.run.app`
2. Redirect URI: `https://flow-staging-abc123.run.app/auth/callback`

**Click**: "Save"

**Wait**: 5-10 minutes for changes to propagate

**Test**: Visit `https://flow-staging-abc123.run.app/auth/login`

**✅ OAuth Configured and Working**

---

## 📊 Quick Reference: Where to Find Each Value

| Value | Where to Get It | Example |
|-------|-----------------|---------|
| **Gemini API Key** | https://aistudio.google.com/app/apikey | `AIzaSy...` |
| **OAuth Client ID** | After creating OAuth client (Task 2) | `123-abc.apps.google...` |
| **OAuth Client Secret** | After creating OAuth client (Task 2) | `GOCSPX-abc123` |
| **JWT Secret** | Generate: `openssl rand -base64 32` | `YourRandomSecret==` |
| **Project ID** | Client provides or you create | `acme-staging-12345` |
| **Deployed URL** | After running deploy script | `https://flow-xxx.run.app` |

---

## ✅ Configuration Checklist

### For Each Environment (Staging + Production)

**Before Deployment**:
- [ ] GCP project created
- [ ] Billing enabled
- [ ] You have Owner role
- [ ] Run `./deployment/setup-client-project.sh`
- [ ] Create 3 secrets in Secret Manager
- [ ] Configure OAuth consent screen
- [ ] Create OAuth client
- [ ] Save Client ID and Secret
- [ ] Create .env file from template
- [ ] Fill in all values in .env file

**During Deployment**:
- [ ] Run `./deployment/deploy-to-environment.sh [env]`
- [ ] Confirm when Cursor asks
- [ ] Wait for deployment (3-5 min)
- [ ] Save deployed URL

**After Deployment**:
- [ ] Update OAuth client with deployed URL
- [ ] Add JavaScript origin
- [ ] Add redirect URI
- [ ] Save changes
- [ ] Wait 5-10 minutes
- [ ] Test OAuth login
- [ ] Verify health check
- [ ] No errors in logs

**✅ Environment Ready**

---

## 🎯 Time Breakdown

| Task | Time | Tool |
|------|------|------|
| Setup infrastructure | 15 min | Automated script |
| Create secrets | 4 min | gcloud or Console |
| OAuth consent screen | 5 min | Console |
| Create OAuth client | 3 min | Console |
| Create .env file | 2 min | Text editor |
| Deploy application | 5 min | Automated script |
| Update OAuth URIs | 2 min | Console |
| Wait for propagation | 10 min | ⏳ Waiting |
| Test OAuth login | 2 min | Browser |

**Active Time**: ~38 minutes  
**Waiting Time**: ~25 minutes  
**Total**: ~63 minutes per environment

**For both staging + production**: ~126 minutes (~2 hours)

**After first client**: ~90 minutes (~1.5 hours) - faster with experience

---

## 💡 Tips to Speed Up

1. **Run both setups in parallel** (staging + production scripts)
2. **Create all secrets while waiting** for APIs to enable
3. **Configure both OAuth screens** while waiting for deployments
4. **Have client info ready** before starting:
   - Project IDs
   - Company name
   - Support email
   - Custom domains

**Can reduce to ~45-60 minutes** with parallel execution!

---

## 🆘 Common Issues

### "Can't find OAuth consent screen"

**Solution**: 
1. Make sure you're in correct project
2. Check project selector in top bar
3. Create consent screen first (before OAuth client)

### "OAuth client secret not working"

**Solution**:
1. Verify no extra spaces when copying
2. Secrets are case-sensitive
3. Make sure it's the **secret**, not the Client ID

### "Redirect URI mismatch"

**Solution**:
1. URI must match **exactly** (including https://)
2. Must end with `/auth/callback`
3. Wait 5-10 minutes after adding URI
4. Check for typos

### "Service unavailable after deployment"

**Solution**:
1. Check secrets are created: `gcloud secrets list`
2. Verify OAuth client has redirect URIs
3. Wait 5-10 minutes for OAuth propagation
4. Check logs: `./deployment/verify-environment.sh [env]`

---

**You're ready to configure your first client!** 🎯

**Start**: `./deployment/setup-client-project.sh`







