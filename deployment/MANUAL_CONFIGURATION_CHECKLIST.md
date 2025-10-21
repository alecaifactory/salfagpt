# 📋 Manual Configuration Checklist

**What you need to configure manually for each client environment**

---

## 🎯 Overview

**95% is automated** via scripts, but these **5% require manual configuration**:

1. ✅ Create secrets in Secret Manager (values only)
2. ✅ Configure OAuth 2.0 client
3. ✅ Update DNS records (if custom domain)

**Time Required**: ~10-15 minutes per environment

---

## 🔐 TASK 1: Create Secrets in Secret Manager

### For Client Staging

**Navigate to**: https://console.cloud.google.com/security/secret-manager?project=[CLIENT-STAGING-PROJECT-ID]

**OR use gcloud**:

```bash
# 1. Generate JWT secret
JWT_SECRET=$(openssl rand -base64 32)
echo "Save this: $JWT_SECRET"

# 2. Set project
gcloud config set project [CLIENT-STAGING-PROJECT-ID]

# 3. Create secrets
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets create google-ai-api-key --data-file=-
echo -n "YOUR_OAUTH_CLIENT_SECRET" | gcloud secrets create google-client-secret --data-file=-
echo -n "$JWT_SECRET" | gcloud secrets create jwt-secret --data-file=-

# ✅ Done in ~2 minutes
```

**Secrets to create**:
- [ ] `google-ai-api-key` → Your Gemini API key from https://aistudio.google.com/app/apikey
- [ ] `google-client-secret` → From OAuth client (see Task 2)
- [ ] `jwt-secret` → Generated with `openssl rand -base64 32`

### For Client Production

**Repeat above** with `[CLIENT-PRODUCTION-PROJECT-ID]`

**IMPORTANT**: Use **different** JWT secret for production!

```bash
# Generate different JWT secret for production
JWT_SECRET_PROD=$(openssl rand -base64 32)

# Create in production project
gcloud config set project [CLIENT-PRODUCTION-PROJECT-ID]
echo -n "$JWT_SECRET_PROD" | gcloud secrets create jwt-secret --data-file=-
```

---

## 🔑 TASK 2: Configure OAuth 2.0 Client

### For Client Staging

**Navigate to**: https://console.cloud.google.com/apis/credentials?project=[CLIENT-STAGING-PROJECT-ID]

#### Step 2.1: Configure OAuth Consent Screen

1. Click **"Configure Consent Screen"**
2. User Type: **Internal** (or External if needed)
3. Fill in:
   - **App name**: "Flow Staging" (or client's brand name)
   - **User support email**: [client's email]
   - **Developer contact email**: [your email]
   - **Authorized domains**: Add `client-domain.com`
4. Click **"Save and Continue"**
5. Scopes: Click **"Add or Remove Scopes"**
   - Search and add: `userinfo.email`
   - Search and add: `userinfo.profile`
6. Click **"Save and Continue"**
7. Test users: Add client's test accounts
8. Click **"Save and Continue"**
9. Review and click **"Back to Dashboard"**

#### Step 2.2: Create OAuth 2.0 Client ID

1. Click **"Create Credentials"** → **"OAuth 2.0 Client ID"**
2. Application type: **Web application**
3. Name: **"Flow Client Staging"**
4. Authorized JavaScript origins:
   - (Leave empty initially - add after deployment)
5. Authorized redirect URIs:
   - (Leave empty initially - add after deployment)
6. Click **"Create"**
7. **SAVE** the Client ID and Client Secret:
   ```
   Client ID: 123456789-abc.apps.googleusercontent.com
   Client Secret: GOCSPX-xyz123abc
   ```
8. Add these to `.env.staging-client`

#### Step 2.3: Update After Deployment

**After deploying**, you'll get a URL like:
```
https://flow-staging-xxx.run.app
```

**Go back to OAuth client** and add:
1. Authorized JavaScript origins:
   - `https://flow-staging-xxx.run.app`
2. Authorized redirect URIs:
   - `https://flow-staging-xxx.run.app/auth/callback`
3. Click **"Save"**
4. **Wait 5-10 minutes** for changes to propagate

### For Client Production

**Repeat above** in `[CLIENT-PRODUCTION-PROJECT-ID]`

**Use different name**: "Flow Client Production"

**IMPORTANT**: This is a **separate OAuth client** from staging!

---

## 🌐 TASK 3: Configure Custom Domains (Optional)

### For Client Staging

**If client wants**: `staging.acme.com`

#### Step 3.1: Map Domain in Cloud Run

```bash
gcloud run domain-mappings create \
  --service flow-staging \
  --domain staging.acme.com \
  --region us-central1 \
  --project [CLIENT-STAGING-PROJECT-ID]
```

**GCP will provide DNS records**, like:
```
Type: CNAME
Name: staging
Value: ghs.googlehosted.com
```

#### Step 3.2: Update DNS

**Go to client's DNS provider** and add the CNAME record.

**Wait**: 15-30 minutes for:
- DNS propagation
- SSL certificate provisioning (automatic by Google)

#### Step 3.3: Verify

```bash
# Check domain mapping status
gcloud run domain-mappings describe staging.acme.com \
  --region us-central1 \
  --project [CLIENT-STAGING-PROJECT-ID]

# Test HTTPS
curl https://staging.acme.com

# Should return 200 or 302 (redirect to auth)
```

#### Step 3.4: Update OAuth Client

**Add custom domain to OAuth client**:
- Authorized JavaScript origins: `https://staging.acme.com`
- Authorized redirect URIs: `https://staging.acme.com/auth/callback`

### For Client Production

**Repeat for production domain**: `flow.acme.com`

---

## 📝 Configuration Summary Template

### After Setup, Document This:

```markdown
## Client: [CLIENT-NAME]

### Staging Environment
- **GCP Project**: [CLIENT-STAGING-PROJECT-ID]
- **Service Name**: flow-staging
- **URL**: https://staging.acme.com
- **OAuth Client ID**: 123456789-abc.apps.googleusercontent.com
- **JWT Secret**: [STORED_IN_SECRET_MANAGER]
- **Gemini API Key**: [YOURS_OR_CLIENTS]
- **Setup Date**: 2025-10-17
- **Setup By**: Alec

### Production Environment
- **GCP Project**: [CLIENT-PRODUCTION-PROJECT-ID]
- **Service Name**: flow-production
- **URL**: https://flow.acme.com
- **OAuth Client ID**: 987654321-xyz.apps.googleusercontent.com
- **JWT Secret**: [STORED_IN_SECRET_MANAGER]
- **Gemini API Key**: [YOURS_OR_CLIENTS]
- **Setup Date**: 2025-10-17
- **Setup By**: Alec
- **SLA**: 99.9% uptime
```

---

## ✅ Verification Checklist

### For Staging (staging-client)

**After completing manual configuration**:

- [ ] Secrets created in Secret Manager (3 secrets)
- [ ] OAuth consent screen configured
- [ ] OAuth client created and credentials saved
- [ ] .env.staging-client file created and filled
- [ ] Deployed via `./deployment/deploy-to-environment.sh staging-client`
- [ ] OAuth redirect URIs updated with deployed URL
- [ ] Waited 5-10 minutes for OAuth propagation
- [ ] Tested login: https://[URL]/auth/login
- [ ] Tested chat: https://[URL]/chat
- [ ] No errors in logs
- [ ] Health check passes: `./deployment/verify-environment.sh staging-client`

**If custom domain**:
- [ ] Domain mapping created
- [ ] DNS records updated
- [ ] SSL certificate active (wait 15-30 min)
- [ ] OAuth updated with custom domain
- [ ] Tested with custom domain

### For Production (production-client)

**Same checklist as staging** PLUS:

- [ ] Client approval documented
- [ ] Staging tested and validated first
- [ ] Rollback plan documented
- [ ] Monitoring configured
- [ ] Alerts enabled
- [ ] Support team notified
- [ ] Client notified of go-live

---

## 🔄 Quick Reference Commands

### Create Secrets

```bash
# Using helper script
./deployment/create-secrets.sh staging-client

# Or manual
gcloud config set project [PROJECT-ID]
echo -n "VALUE" | gcloud secrets create SECRET-NAME --data-file=-
```

### Update Secret Value

```bash
echo -n "NEW_VALUE" | gcloud secrets versions add SECRET-NAME \
  --data-file=- \
  --project=[PROJECT-ID]
```

### List OAuth Clients

```bash
gcloud auth application-default oauth-clients list \
  --project=[PROJECT-ID]
```

### Check Domain Mapping

```bash
gcloud run domain-mappings list \
  --region us-central1 \
  --project=[PROJECT-ID]
```

---

## 🆘 Getting Help

### If OAuth Not Working

1. **Check redirect URI exactly matches deployed URL**
2. **Wait 5-10 minutes after adding URI**
3. **Check consent screen is configured**
4. **Verify client ID in .env matches OAuth client**

### If Secrets Not Loading

1. **Verify secrets exist**: `gcloud secrets list --project=[PROJECT-ID]`
2. **Check service account has access**: Should have `roles/secretmanager.secretAccessor`
3. **Verify secret names match exactly**: `google-ai-api-key`, `google-client-secret`, `jwt-secret`

### If Deployment Fails

1. **Check logs**: `gcloud run services logs read [SERVICE-NAME]`
2. **Verify build passes locally**: `npm run build`
3. **Check service account permissions**
4. **Verify APIs are enabled**

---

## 📞 Support

**For automated setup issues**: Check `deployment/setup-client-project.sh` output

**For deployment issues**: Check `deployment/deploy-to-environment.sh` output

**For Cursor protection questions**: See `.cursor/rules/` documentation

**Time estimate for manual tasks**: 
- First time: ~30 minutes (learning)
- Subsequent: ~10-15 minutes per environment

---

**Last Updated**: 2025-10-17  
**Automation Level**: 95%  
**Manual Tasks**: 3 (Secrets, OAuth, DNS)  
**Difficulty**: Beginner-friendly with step-by-step instructions











