# 📋 What YOU Need to Configure

**Manual configuration required for each client deployment**

**Time Required**: ~25 minutes per client (staging + production)

---

## 🎯 Overview

**95% is automated**, but these **5% require your input**:

1. ✅ **GCP Project IDs** - Client creates or provides
2. ✅ **Secrets** - Create 3 secrets per environment
3. ✅ **OAuth Clients** - Configure consent screen + create clients
4. ✅ **Custom Domains** - Update DNS records (optional)

---

## 📝 Step-by-Step: What YOU Do

### STEP 1: Get Client GCP Projects (5 minutes)

**Option A: Client Creates Projects**

Client goes to: https://console.cloud.google.com/projectcreate

Creates:
- `acme-flow-staging-12345` (staging)
- `acme-flow-production-67890` (production)

Grants you **Owner** role on both

**Option B: You Create for Client**

```bash
# Create staging project
gcloud projects create acme-flow-staging-12345 \
  --name="Acme Flow Staging" \
  --set-as-default

# Create production project
gcloud projects create acme-flow-production-67890 \
  --name="Acme Flow Production"

# Link billing (client's billing account)
gcloud billing projects link acme-flow-staging-12345 \
  --billing-account=[CLIENT-BILLING-ACCOUNT-ID]

gcloud billing projects link acme-flow-production-67890 \
  --billing-account=[CLIENT-BILLING-ACCOUNT-ID]
```

**You now have**:
```
CLIENT_STAGING_PROJECT="acme-flow-staging-12345"
CLIENT_PRODUCTION_PROJECT="acme-flow-production-67890"
```

---

### STEP 2: Run Automated Setup (30 minutes - mostly waiting)

```bash
# Staging setup (15 min)
./deployment/setup-client-project.sh

# Interactive:
Environment type: staging
Project ID: acme-flow-staging-12345
Region: us-central1
Confirm: yes

# Production setup (15 min)
./deployment/setup-client-project.sh

# Interactive:
Environment type: production
Project ID: acme-flow-production-67890
Region: us-central1
Confirm: yes
```

**This automates**:
- ✅ Enabling 9 GCP APIs
- ✅ Creating Firestore database
- ✅ Creating Artifact Registry
- ✅ Creating service account
- ✅ Granting permissions
- ✅ Creating Cloud Storage bucket
- ✅ Deploying Firestore indexes

**You just wait** ☕

---

### STEP 3: Create Secrets (4 minutes per environment)

#### For Staging

```bash
# Set project
gcloud config set project acme-flow-staging-12345

# Generate JWT secret
JWT_SECRET_STAGING=$(openssl rand -base64 32)
echo "Save this for .env file: $JWT_SECRET_STAGING"

# Create secrets
echo -n "AIzaSy_YOUR_GEMINI_KEY" | gcloud secrets create google-ai-api-key --data-file=-
echo -n "GOCSPX_YOUR_OAUTH_SECRET" | gcloud secrets create google-client-secret --data-file=-
echo -n "$JWT_SECRET_STAGING" | gcloud secrets create jwt-secret --data-file=-
```

**Where to get values**:
- **Gemini API Key**: https://aistudio.google.com/app/apikey
- **OAuth Secret**: From STEP 4 (configure OAuth client)
- **JWT Secret**: Generated above

#### For Production

```bash
# IMPORTANT: Use DIFFERENT secrets for production!
gcloud config set project acme-flow-production-67890

# Generate DIFFERENT JWT secret
JWT_SECRET_PRODUCTION=$(openssl rand -base64 32)
echo "Save this for .env file: $JWT_SECRET_PRODUCTION"

# Create secrets (with production values)
echo -n "AIzaSy_YOUR_GEMINI_KEY" | gcloud secrets create google-ai-api-key --data-file=-
echo -n "GOCSPX_PRODUCTION_OAUTH_SECRET" | gcloud secrets create google-client-secret --data-file=-
echo -n "$JWT_SECRET_PRODUCTION" | gcloud secrets create jwt-secret --data-file=-
```

**✅ Completed**: Secrets stored securely in Secret Manager

---

### STEP 4: Configure OAuth Clients (10 minutes per environment)

#### For Staging

**Navigate to**: https://console.cloud.google.com/apis/credentials?project=acme-flow-staging-12345

**4.1 Configure OAuth Consent Screen** (first time only):

1. Click **"Configure Consent Screen"**
2. User Type: **Internal** (if workspace) or **External**
3. App information:
   - **App name**: "Flow Staging" (or client's brand)
   - **User support email**: client@acme.com
   - **App logo**: (optional) Client's logo
4. App domain (optional):
   - **Application home page**: https://staging.acme.com
   - **Privacy policy**: https://acme.com/privacy
   - **Terms of service**: https://acme.com/terms
5. Developer contact: your-email@getaifactory.com
6. Click **"Save and Continue"**
7. Scopes: Click **"Add or Remove Scopes"**
   - Search and check: ✅ `userinfo.email`
   - Search and check: ✅ `userinfo.profile`
8. Click **"Update"** → **"Save and Continue"**
9. Test users: Add client test accounts
10. Click **"Save and Continue"** → **"Back to Dashboard"**

**4.2 Create OAuth 2.0 Client ID**:

1. Click **"Create Credentials"** → **"OAuth 2.0 Client ID"**
2. Application type: **Web application**
3. Name: **"Flow Staging Client"**
4. Authorized JavaScript origins: 
   - (Leave empty for now - add after deployment)
5. Authorized redirect URIs:
   - (Leave empty for now - add after deployment)
6. Click **"Create"**
7. **COPY and SAVE** (you'll need these):
   ```
   Client ID: 123456789-abc.apps.googleusercontent.com
   Client Secret: GOCSPX-abc123xyz
   ```

**✅ Completed**: OAuth client created for staging

#### For Production

**Repeat above** in production project with these changes:
- App name: "Flow" (production branding)
- Client name: "Flow Production Client"
- **Use production consent screen** (client-facing branding)

**IMPORTANT**: This is a **separate OAuth client** from staging!

---

### STEP 5: Create .env Files (4 minutes per environment)

#### For Staging

```bash
# Copy template
cp deployment/env-templates/staging-client.env .env.staging-client

# Edit file
nano .env.staging-client  # or your preferred editor
```

**Replace these placeholders**:

```bash
# From STEP 1
GOOGLE_CLOUD_PROJECT=acme-flow-staging-12345

# From STEP 4.2
GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123xyz

# From STEP 3
GOOGLE_AI_API_KEY=AIzaSy_YOUR_KEY
JWT_SECRET=[the-one-you-generated]

# Custom domain (if applicable)
CUSTOM_DOMAIN=staging.acme.com
PUBLIC_BASE_URL=https://staging.acme.com  # Will update after deployment
```

**Save file**

#### For Production

```bash
# Copy template
cp deployment/env-templates/production-client.env .env.production-client

# Edit with PRODUCTION values
nano .env.production-client
```

**Use PRODUCTION credentials** (different from staging):
- Production GCP project ID
- Production OAuth client ID/secret
- Production JWT secret
- Production custom domain

**✅ Completed**: Environment files configured

---

### STEP 6: Deploy Applications (10 minutes per environment)

#### Deploy Staging

```bash
./deployment/deploy-to-environment.sh staging-client
```

**Cursor will ask**:
```
🟠 STAGING-CLIENT DEPLOYMENT
Has client been notified? (yes/no):
```

**You type**: `yes`

```
Proceed? (yes/no):
```

**You type**: `yes`

**Script will**:
- ✅ Run type-check
- ✅ Build application
- ✅ Deploy to Cloud Run
- ✅ Configure environment variables
- ✅ Mount secrets
- ✅ Run health check

**You'll get URL**:
```
✅ Service deployed: https://flow-staging-abc123.run.app
```

**SAVE THIS URL** - you need it for next step

#### Deploy Production

```bash
./deployment/deploy-to-environment.sh production-client
```

**Cursor will show**:
```
🔴 PRODUCTION DEPLOYMENT
[Complete checklist]
Type 'DEPLOY' to proceed:
```

**You type**: `DEPLOY` (uppercase)

**Same deployment process**, but with production resources

---

### STEP 7: Update OAuth Redirect URIs (2 minutes per environment)

#### After Staging Deployment

**Go back to OAuth client** (from STEP 4):
https://console.cloud.google.com/apis/credentials?project=acme-flow-staging-12345

**Edit the OAuth client** you created:

1. Click on **"Flow Staging Client"**
2. Add to **Authorized JavaScript origins**:
   ```
   https://flow-staging-abc123.run.app
   ```
3. Add to **Authorized redirect URIs**:
   ```
   https://flow-staging-abc123.run.app/auth/callback
   ```
4. Click **"Save"**

**If using custom domain**, also add:
- `https://staging.acme.com`
- `https://staging.acme.com/auth/callback`

**Wait**: 5-10 minutes for changes to propagate

**Test**:
```bash
# Try OAuth login
open https://flow-staging-abc123.run.app/auth/login

# Should redirect to Google login, then back to Flow
```

#### After Production Deployment

**Repeat above** for production OAuth client with production URLs

---

### STEP 8: Configure Custom Domains (15 minutes - Optional)

**If client wants custom domains** (e.g., `flow.acme.com`):

#### For Staging

```bash
# Map domain
gcloud run domain-mappings create \
  --service flow-staging \
  --domain staging.acme.com \
  --region us-central1 \
  --project acme-flow-staging-12345

# GCP will show DNS records to add:
# Type: CNAME
# Name: staging
# Value: ghs.googlehosted.com
```

**Update DNS at client's DNS provider**:
- Add CNAME record as instructed
- Save

**Wait**: 15-30 minutes for:
- DNS propagation
- SSL certificate provisioning (automatic)

**Verify**:
```bash
curl https://staging.acme.com
# Should return 200 or 302
```

**Update OAuth** with custom domain (see STEP 7)

#### For Production

**Repeat for** `flow.acme.com`

---

## ✅ Verification Checklist

### After ALL Configuration

**For Each Environment (Staging + Production)**:

#### Infrastructure
- [ ] GCP project exists and billing enabled
- [ ] All 9 APIs enabled
- [ ] Firestore database created
- [ ] Artifact Registry repository exists
- [ ] Service account created with permissions
- [ ] Cloud Storage bucket created

#### Secrets
- [ ] `google-ai-api-key` created
- [ ] `google-client-secret` created
- [ ] `jwt-secret` created

#### OAuth
- [ ] OAuth consent screen configured
- [ ] OAuth client created
- [ ] Client ID and secret saved
- [ ] Redirect URIs added (after deployment)

#### Deployment
- [ ] .env file created from template
- [ ] Application deployed successfully
- [ ] Service URL obtained
- [ ] OAuth redirect URIs updated
- [ ] OAuth propagated (waited 5-10 min)

#### Testing
- [ ] Health check passes: `./deployment/verify-environment.sh [ENV]`
- [ ] OAuth login works: https://[URL]/auth/login
- [ ] Chat interface loads: https://[URL]/chat
- [ ] Can create conversation
- [ ] Can send message and get AI response
- [ ] No errors in logs

#### Custom Domain (if applicable)
- [ ] Domain mapping created
- [ ] DNS records updated
- [ ] SSL certificate active
- [ ] OAuth updated with custom domain
- [ ] Custom domain works: https://[CUSTOM-DOMAIN]

---

## 📊 Configuration Summary

### What's Configured Per Environment

| Component | Staging | Production | Location |
|-----------|---------|------------|----------|
| GCP Project | ✅ Manual | ✅ Manual | Console or gcloud |
| APIs Enabled | ✅ Automated | ✅ Automated | setup script |
| Firestore | ✅ Automated | ✅ Automated | setup script |
| Service Account | ✅ Automated | ✅ Automated | setup script |
| Permissions | ✅ Automated | ✅ Automated | setup script |
| Storage Bucket | ✅ Automated | ✅ Automated | setup script |
| Secrets | ✅ Manual | ✅ Manual | Secret Manager |
| OAuth Client | ✅ Manual | ✅ Manual | Credentials console |
| .env File | ✅ Manual | ✅ Manual | Local file |
| Deployment | ✅ Automated | ✅ Automated | deploy script |
| OAuth URIs | ✅ Manual | ✅ Manual | After deployment |
| Custom Domain | ✅ Manual | ✅ Manual | Optional |

**Automated**: 9 out of 12 components (75%)  
**Manual**: 3 out of 12 components (25%)

**But in terms of time**:
- Automated: ~30 minutes (mostly waiting)
- Manual: ~25 minutes (active configuration)

**So time-wise**: ~55% automated, ~45% manual

---

## 🔐 Security Best Practices

### Secrets

- ✅ **Never commit secrets** to git (use Secret Manager)
- ✅ **Use different secrets** for each environment
- ✅ **Rotate secrets** quarterly
- ✅ **Generate strong JWT secrets** (32+ characters)

### OAuth

- ✅ **Separate OAuth clients** per environment
- ✅ **Restrict redirect URIs** to actual deployed URLs
- ✅ **Use client's branding** for production consent screen
- ✅ **Internal user type** if possible (more secure)

### Projects

- ✅ **Separate projects** for staging and production
- ✅ **Minimal service account permissions** (principle of least privilege)
- ✅ **Enable audit logging** for production
- ✅ **Set budget alerts** per environment

---

## 🎯 Quick Reference: What Goes Where

### In Secret Manager (per environment)

```
google-ai-api-key     → Your Gemini API key from aistudio.google.com
google-client-secret  → From OAuth client (step 4)
jwt-secret           → Generated with openssl rand -base64 32
```

### In OAuth Client (per environment)

```
App name             → Client's brand name
Support email        → Client's email
Redirect URIs        → [DEPLOYED-URL]/auth/callback (add after deployment)
JavaScript origins   → [DEPLOYED-URL] (add after deployment)
```

### In .env File (per environment)

```
GOOGLE_CLOUD_PROJECT → Client's GCP project ID
GOOGLE_CLIENT_ID     → From OAuth client
GOOGLE_CLIENT_SECRET → From OAuth client
GOOGLE_AI_API_KEY    → Your Gemini API key
JWT_SECRET           → Generated JWT secret
PUBLIC_BASE_URL      → Deployed service URL (update after deployment)
CUSTOM_DOMAIN        → Optional custom domain
```

---

## 🆘 Common Issues

### "I don't have client's GCP project ID"

**Solution**: Client must create projects first, or you create for them (see STEP 1)

### "I don't know client's billing account ID"

**Solution**: 
```bash
# List billing accounts you have access to
gcloud billing accounts list

# Client can share their billing account ID
```

### "OAuth client secret not working"

**Solution**: 
1. Verify you copied the secret correctly (no extra spaces)
2. Secrets are case-sensitive
3. Must be the secret from the OAuth client, not API key

### "Deployment fails with permission denied"

**Solution**:
1. Verify you have Owner role on client's project
2. Run: `gcloud auth login` to re-authenticate
3. Check: `gcloud config get-value project` matches target project

---

## 📞 When to Ask Client

### Information Needed from Client

**Before setup**:
- [ ] GCP project IDs (or they create them)
- [ ] Billing account ID (to link billing)
- [ ] Custom domain names (if applicable)
- [ ] Branding info (app name, logo, support email)

**During setup**:
- [ ] DNS access (if custom domain)
- [ ] Test user accounts (for OAuth testing)

**After setup**:
- [ ] Approval to deploy to staging
- [ ] Approval to deploy to production
- [ ] Go-live date/time

---

## ✅ Summary

### Total Manual Work Per Client

**Time breakdown**:
- Get project IDs: 5 min
- Create secrets (staging): 4 min
- Configure OAuth (staging): 10 min
- Create .env (staging): 2 min
- Update OAuth URIs (staging): 2 min
- Create secrets (production): 4 min
- Configure OAuth (production): 10 min
- Create .env (production): 2 min
- Update OAuth URIs (production): 2 min
- Custom domains (optional): 15 min

**Total Active Time**: ~41 minutes (without custom domains)  
**Total with Custom Domains**: ~56 minutes

**Plus waiting time**:
- GCP setup scripts: ~30 minutes (automated)
- OAuth propagation: ~10-20 minutes
- DNS propagation: ~30 minutes (if custom domain)

**Grand Total**: ~2-3 hours for first client (including waiting)  
**Subsequent Clients**: ~1 hour (you know the process)

---

## 🎓 Tips to Speed Up

1. **Run both setups in parallel** (staging + production)
2. **Create all secrets at once** while waiting for setup
3. **Configure both OAuth clients** while waiting for deployment
4. **Have client info ready** before starting
5. **Use custom domain later** (deploy with Cloud Run URL first)

---

**You're now ready to configure your first client!** 🚀

**Start with**: `./deployment/setup-client-project.sh`













