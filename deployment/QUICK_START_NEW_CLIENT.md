# ⚡ Quick Start: Deploy New Client

**45-60 minute setup for new client (staging + production)**

---

## 📋 Prerequisites

**From Client**:
- [ ] 2 GCP project IDs (or they create them)
- [ ] Billing account ID
- [ ] Your email granted Owner role
- [ ] Custom domains (if applicable)
- [ ] DNS access (if custom domains)

**From You**:
- [ ] Gemini API key
- [ ] gcloud CLI authenticated
- [ ] Firebase CLI installed

---

## 🚀 5-Step Setup Process

### STEP 1: Run Automated Setup (30 min)

```bash
cd /Users/alec/salfagpt

# Staging (15 min automated)
./deployment/setup-client-project.sh
# → Type: staging
# → Enter: [CLIENT-STAGING-PROJECT-ID]
# → Confirm: yes
# → Wait ~15 minutes

# Production (15 min automated)
./deployment/setup-client-project.sh
# → Type: production
# → Enter: [CLIENT-PRODUCTION-PROJECT-ID]
# → Confirm: yes
# → Wait ~15 minutes
```

**What this does** (fully automated):
- ✅ Enables 9 APIs
- ✅ Creates Firestore
- ✅ Creates Artifact Registry
- ✅ Creates service account + permissions
- ✅ Creates Cloud Storage bucket
- ✅ Deploys Firestore indexes

---

### STEP 2: Create Secrets (8 min)

**For Staging**:
```bash
gcloud config set project [CLIENT-STAGING-PROJECT-ID]

# Generate JWT
JWT_STAGING=$(openssl rand -base64 32)

# Create secrets
echo -n "YOUR_GEMINI_KEY" | gcloud secrets create google-ai-api-key --data-file=-
echo -n "OAUTH_SECRET_FROM_STEP3" | gcloud secrets create google-client-secret --data-file=-
echo -n "$JWT_STAGING" | gcloud secrets create jwt-secret --data-file=-
```

**For Production**:
```bash
gcloud config set project [CLIENT-PRODUCTION-PROJECT-ID]

# DIFFERENT JWT secret for production
JWT_PROD=$(openssl rand -base64 32)

# Create secrets
echo -n "YOUR_GEMINI_KEY" | gcloud secrets create google-ai-api-key --data-file=-
echo -n "OAUTH_SECRET_FROM_STEP3" | gcloud secrets create google-client-secret --data-file=-
echo -n "$JWT_PROD" | gcloud secrets create jwt-secret --data-file=-
```

---

### STEP 3: Configure OAuth (20 min)

**For EACH environment** (staging + production):

**Go to**: https://console.cloud.google.com/apis/credentials?project=[PROJECT-ID]

1. **Configure OAuth Consent Screen**:
   - App name: "Flow" (+ Staging/Production if needed)
   - Support email: [client email]
   - Scopes: userinfo.email, userinfo.profile

2. **Create OAuth Client**:
   - Type: Web application
   - Name: "Flow Client [Environment]"
   - Save → Copy Client ID and Secret

3. **Create .env file**:
   ```bash
   # For staging
   cp deployment/env-templates/staging-client.env .env.staging-client
   # Edit: Add project ID, OAuth credentials
   
   # For production
   cp deployment/env-templates/production-client.env .env.production-client
   # Edit: Add project ID, OAuth credentials
   ```

---

### STEP 4: Deploy Applications (10 min)

**Staging**:
```bash
./deployment/deploy-to-environment.sh staging-client
# → Cursor asks: "Proceed? (yes/no)"
# → You: "yes"
# → Deploys in 3-5 minutes
```

**Production**:
```bash
./deployment/deploy-to-environment.sh production-client
# → Cursor asks: "Type 'DEPLOY' to proceed"
# → You: "DEPLOY"
# → Deploys in 3-5 minutes
```

---

### STEP 5: Update OAuth URIs (4 min)

**After each deployment**, get the URL from output:
```
✅ Service deployed: https://flow-staging-abc123.run.app
```

**Go back to OAuth client** and add:
- Authorized origins: `https://flow-staging-abc123.run.app`
- Redirect URIs: `https://flow-staging-abc123.run.app/auth/callback`

**Wait**: 5-10 minutes

**Test**: Visit `https://[URL]/auth/login`

**Repeat for production**

---

## ✅ Verification

```bash
# Check staging health
./deployment/verify-environment.sh staging-client

# Check production health
./deployment/verify-environment.sh production-client

# Expected output for both:
# ✅ HTTP 200 - Service is healthy
# ✅ Environment variables configured
# ✅ Secrets mounted
# ✅ No recent errors
```

---

## 🎯 Success Criteria

**Setup is complete when**:

**For Each Environment**:
- ✅ OAuth login works
- ✅ Can create conversation
- ✅ Can send message and get AI response
- ✅ No errors in logs
- ✅ Health check passes

**Overall**:
- ✅ Staging deployed and tested
- ✅ Production deployed and tested
- ✅ Client can access both environments
- ✅ All features working

---

## 📊 Time Estimate

### First Client
- **Active work**: ~45 minutes
- **Waiting time**: ~60 minutes (API enablement, OAuth propagation)
- **Total**: ~105 minutes (~2 hours)

### Subsequent Clients
- **Active work**: ~30 minutes (you know the process)
- **Waiting time**: ~30 minutes
- **Total**: ~60 minutes (~1 hour)

---

## 🔄 After Setup

**Client can now**:
- Access staging: https://staging.client-domain.com
- Access production: https://flow.client-domain.com
- Test all features in staging before production
- You can deploy updates with single command

**You can now**:
- Deploy to any environment with one command
- Rollback in < 2 minutes if needed
- Monitor all environments separately
- Add more clients using same process

---

## 🆘 If Something Goes Wrong

**Deployment fails**:
```bash
# Check logs
gcloud run services logs read [SERVICE-NAME] \
  --region us-central1 \
  --project [PROJECT-ID]

# Try: Verify secrets exist
gcloud secrets list --project=[PROJECT-ID]
```

**OAuth not working**:
```bash
# Wait 5-10 minutes after updating redirect URIs
# Verify URIs match EXACTLY (including https://)
# Check consent screen is configured
```

**Need help**:
- See: `MANUAL_CONFIGURATION_CHECKLIST.md`
- See: `MULTI_ENVIRONMENT_SETUP_GUIDE.md`

---

**Let's deploy your first client! 🎯**
















