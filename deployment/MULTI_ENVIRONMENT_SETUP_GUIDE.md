# 🏢 Multi-Environment Deployment Guide for Flow

**Complete setup for 4-environment architecture with client isolation**

**Version**: 1.0.0  
**Last Updated**: 2025-10-17  
**Status**: ✅ Production Ready  
**Backward Compatible**: Yes - existing setup unchanged

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                   4-ENVIRONMENT ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. LOCAL DEVELOPMENT 🟢                                         │
│     • localhost:3000                                             │
│     • GCP: gen-lang-client-0986191192                           │
│     • OAuth: localhost callback                                 │
│     • Cost: $0                                                  │
│                                                                  │
│  2. STAGING INTERNAL 🟡                                          │
│     • Service: flow-staging-internal                            │
│     • GCP: gen-lang-client-0986191192                           │
│     • Purpose: Internal QA                                      │
│     • Cost: ~$10-20/month                                       │
│                                                                  │
│  3. CLIENT STAGING 🟠                                            │
│     • Service: flow-staging                                     │
│     • GCP: [CLIENT-STAGING-PROJECT]                             │
│     • Purpose: Client UAT                                       │
│     • Cost: ~$30-60/month                                       │
│                                                                  │
│  4. CLIENT PRODUCTION 🔴                                         │
│     • Service: flow-production                                  │
│     • GCP: [CLIENT-PRODUCTION-PROJECT]                          │
│     • Purpose: Live customers                                   │
│     • Cost: ~$100-300/month                                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Quick Start

### For Each New Client Deployment

**1. Get client GCP project IDs**:
```bash
CLIENT_STAGING_PROJECT="acme-flow-staging-12345"
CLIENT_PRODUCTION_PROJECT="acme-flow-production-67890"
```

**2. Run automated setup** (15 min per environment):
```bash
# Setup staging
./deployment/setup-client-project.sh
# → Choose: staging
# → Enter: acme-flow-staging-12345

# Setup production
./deployment/setup-client-project.sh
# → Choose: production
# → Enter: acme-flow-production-67890
```

**3. Complete manual steps** (5-10 min per environment):
- Create 3 secrets in Secret Manager
- Configure OAuth 2.0 client
- Create .env files from templates

**4. Deploy** (3-5 min per environment):
```bash
./deployment/deploy-to-environment.sh staging-client
./deployment/deploy-to-environment.sh production-client
```

**Total time per client**: ~45-60 minutes

---

## 📋 Complete Setup Checklist

### Prerequisites (Before Starting)

**Client Must Provide**:
- [ ] 2 GCP project IDs (staging + production)
- [ ] Billing accounts linked to both projects
- [ ] Your Google account granted Owner role
- [ ] Custom domains (if needed)
- [ ] DNS access (if custom domains)

**You Need**:
- [ ] gcloud CLI installed and authenticated
- [ ] Firebase CLI installed (`npm install -g firebase-tools`)
- [ ] Access to Gemini API keys
- [ ] OpenSSL for generating JWT secrets

---

## 🚀 Step-by-Step Setup

### PHASE 1: Client Staging Setup

#### Step 1.1: Run Automated Setup

```bash
cd /Users/alec/salfagpt

./deployment/setup-client-project.sh
```

**Interactive prompts**:
```
Environment type: staging
Client GCP Project ID: acme-flow-staging-12345
Region: us-central1 (or press Enter)
Continue? yes
```

**What this does** (automated):
- ✅ Enables 9 required APIs
- ✅ Creates Firestore database
- ✅ Creates Artifact Registry
- ✅ Creates service account + permissions
- ✅ Creates Cloud Storage bucket
- ✅ Deploys Firestore indexes
- ✅ Deploys Firestore security rules (staging)

**Time**: ~15 minutes

#### Step 1.2: Create Secrets (Manual)

```bash
# Generate JWT secret
JWT_SECRET=$(openssl rand -base64 32)
echo "Generated JWT Secret: $JWT_SECRET"

# Create secrets in Secret Manager
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets create google-ai-api-key \
  --data-file=- \
  --project=acme-flow-staging-12345

echo -n "YOUR_OAUTH_CLIENT_SECRET" | gcloud secrets create google-client-secret \
  --data-file=- \
  --project=acme-flow-staging-12345

echo -n "$JWT_SECRET" | gcloud secrets create jwt-secret \
  --data-file=- \
  --project=acme-flow-staging-12345
```

**Time**: ~2 minutes

#### Step 1.3: Configure OAuth (Manual)

**Navigate to**: https://console.cloud.google.com/apis/credentials?project=acme-flow-staging-12345

**Configure OAuth Consent Screen**:
1. Click "Configure Consent Screen"
2. User Type: Internal (or External if needed)
3. App name: "Flow Staging" (or client's name)
4. User support email: [client email]
5. Developer email: [your email]
6. Scopes: Add `userinfo.email` and `userinfo.profile`
7. Save

**Create OAuth 2.0 Client**:
1. Click "Create Credentials" → "OAuth 2.0 Client ID"
2. Application type: Web application
3. Name: "Flow Staging Client"
4. Authorized JavaScript origins: (add after deployment)
5. Authorized redirect URIs: (add after deployment)
6. Save → Copy Client ID and Secret

**Time**: ~5 minutes

#### Step 1.4: Create .env File

```bash
# Copy template
cp deployment/env-templates/staging-client.env .env.staging-client

# Edit with actual values
nano .env.staging-client
```

**Replace these values**:
```bash
GOOGLE_CLOUD_PROJECT=acme-flow-staging-12345
GOOGLE_CLIENT_ID=[from step 1.3]
GOOGLE_CLIENT_SECRET=[from step 1.3]
GOOGLE_AI_API_KEY=[your key]
JWT_SECRET=[from step 1.2]
PUBLIC_BASE_URL=https://staging.acme.com  # Will update after deployment
CUSTOM_DOMAIN=staging.acme.com  # If applicable
```

**Time**: ~2 minutes

#### Step 1.5: Deploy Application

```bash
./deployment/deploy-to-environment.sh staging-client
```

**This will**:
- Load .env.staging-client
- Run type-check and build
- Deploy to Cloud Run
- Configure environment variables
- Mount secrets
- Run health check

**Time**: ~3-5 minutes

#### Step 1.6: Update OAuth Redirect URIs

**After deployment, you'll get a URL like**:
```
https://flow-staging-xxx.run.app
```

**Go back to OAuth client** (from step 1.3) and add:
- Authorized JavaScript origins: `https://flow-staging-xxx.run.app`
- Authorized redirect URIs: `https://flow-staging-xxx.run.app/auth/callback`

**Wait**: 5-10 minutes for changes to propagate

**Test**: Visit `https://flow-staging-xxx.run.app/auth/login`

**Time**: ~10 minutes (including propagation)

---

### PHASE 2: Client Production Setup

**Repeat PHASE 1 with production values**:

```bash
# Run setup
./deployment/setup-client-project.sh
# → Choose: production
# → Enter: acme-flow-production-67890

# Create secrets (same process)
# Configure OAuth (separate client)
# Create .env.production-client
# Deploy
./deployment/deploy-to-environment.sh production-client
# → Will require typing "DEPLOY"
```

**Key Differences**:
- Uses production GCP project
- Separate OAuth client
- Higher resources (2Gi RAM, 4 CPU)
- Min instances: 2 (always warm)
- Requires "DEPLOY" confirmation (not just "yes")

---

## 🔐 Security Configuration

### OAuth Configuration Per Environment

Each environment has its own OAuth client:

| Environment | GCP Project | OAuth Client Name | Redirect URI |
|------------|-------------|-------------------|--------------|
| Local | gen-lang-client-0986191192 | Flow Local Dev | localhost:3000/auth/callback |
| Staging Internal | gen-lang-client-0986191192 | Flow Staging Internal | staging-internal.xxx/auth/callback |
| Client Staging | [CLIENT-STAGING] | Flow Client Staging | staging.client.com/auth/callback |
| Client Production | [CLIENT-PRODUCTION] | Flow Client Production | flow.client.com/auth/callback |

**Why separate OAuth clients?**:
- ✅ Different branding per client
- ✅ Separate consent screens
- ✅ Independent credential rotation
- ✅ Better security isolation

### Secret Management

Each environment stores secrets in its own Secret Manager:

```
Staging Internal (gen-lang-client-0986191192):
  ├── google-ai-api-key-staging
  ├── google-client-secret-staging
  └── jwt-secret-staging

Client Staging ([CLIENT-STAGING-PROJECT]):
  ├── google-ai-api-key
  ├── google-client-secret
  └── jwt-secret

Client Production ([CLIENT-PRODUCTION-PROJECT]):
  ├── google-ai-api-key
  ├── google-client-secret
  └── jwt-secret
```

---

## 🛡️ Cursor Protection Rules

### How Protection Works

When you request a staging/production deployment, Cursor will:

1. **Detect the operation** (deployment script or gcloud command)
2. **Load appropriate protection rule**:
   - Staging → `staging-deployment-protection.mdc`
   - Production → `production-deployment-protection.mdc`
3. **Show confirmation dialog** with:
   - Environment info
   - Risk assessment
   - Pre-deployment checklist
   - What will happen
4. **Wait for your confirmation**:
   - Staging: Type "yes"
   - Production: Type "DEPLOY"
5. **Only proceed if you confirm correctly**

### Example Protection in Action

**You**: "Deploy to production"

**Cursor AI**:
```
🔴 PRODUCTION DEPLOYMENT DETECTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Loading: .cursor/rules/production-deployment-protection.mdc

⚠️  This requires complete checklist and typing 'DEPLOY'

Environment: production-client
Project: acme-flow-production-67890
Service: flow-production
URL: https://flow.acme.com

CHECKLIST:
□ Code quality verified
□ Tested in staging-client
□ Client approval received
□ Rollback plan ready

[Shows full checklist]

Type 'DEPLOY' to proceed:
```

**You**: "DEPLOY"

**Cursor AI**:
```
✅ Production deployment confirmed
🚀 Executing deployment...
```

---

## 📊 Environment Comparison

| Feature | Local | Staging Internal | Client Staging | Client Production |
|---------|-------|------------------|----------------|-------------------|
| **GCP Project** | gen-lang-client... | gen-lang-client... | CLIENT-STAGING | CLIENT-PRODUCTION |
| **OAuth Client** | Existing | New | Client-specific | Client-specific |
| **Firestore** | Shared | Shared | Isolated | Isolated |
| **Min Instances** | 0 | 0 | 1 | 2 |
| **Max Instances** | - | 5 | 10 | 50 |
| **Memory** | - | 512Mi | 1Gi | 2Gi |
| **CPU** | - | 1 | 2 | 4 |
| **Cursor Protection** | No | Yes | Yes | Yes + Checklist |
| **Confirmation** | No | "yes" | "yes" | "DEPLOY" |
| **Cost/Month** | $0 | $10-20 | $30-60 | $100-300 |

---

## 🔄 Daily Workflow

### Development Flow

```bash
# 1. Develop locally
npm run dev
# → Test at localhost:3000

# 2. Deploy to your staging (internal QA)
./deployment/deploy-to-environment.sh staging-internal
# → Cursor asks: "Proceed? (yes/no)"
# → You type: "yes"
# → Deployed to flow-staging-internal

# 3. Test in staging-internal
# Visit: https://flow-staging-internal-xxx.run.app

# 4. Deploy to client staging (UAT)
./deployment/deploy-to-environment.sh staging-client
# → Cursor asks: "Client notified? (yes/no)"
# → You type: "yes"
# → Cursor asks: "Proceed? (yes/no)"
# → You type: "yes"
# → Deployed to client staging

# 5. Client tests and approves

# 6. Deploy to client production
./deployment/deploy-to-environment.sh production-client
# → Cursor shows COMPLETE CHECKLIST
# → You verify all items
# → You type: "DEPLOY"
# → Deployed to production
```

---

## 🧪 Testing & Verification

### After Each Deployment

```bash
# Verify deployment health
./deployment/verify-environment.sh staging-client

# Expected output:
# ✅ HTTP 200 - Service is healthy
# ✅ GOOGLE_CLOUD_PROJECT configured
# ✅ All secrets mounted
# ✅ No recent errors
```

### Test OAuth Flow

```bash
# Get service URL
SERVICE_URL=$(gcloud run services describe flow-staging \
  --region us-central1 \
  --project acme-flow-staging-12345 \
  --format 'value(status.url)')

# Test login
echo "Test OAuth at: $SERVICE_URL/auth/login"
```

### Monitor Logs

```bash
# View recent logs
gcloud run services logs read flow-staging \
  --region us-central1 \
  --project acme-flow-staging-12345 \
  --limit 50

# Follow logs in real-time
gcloud alpha logging tail \
  "resource.type=cloud_run_revision AND resource.labels.service_name=flow-staging" \
  --project acme-flow-staging-12345
```

---

## 🆘 Rollback Procedure

### If Deployment Has Issues

```bash
# 1. List available revisions
gcloud run revisions list \
  --service flow-production \
  --region us-central1 \
  --project acme-flow-production-67890

# 2. Rollback to previous revision
./deployment/rollback-deployment.sh production-client flow-production-00123-abc

# Or manual:
gcloud run services update-traffic flow-production \
  --to-revisions=flow-production-00123-abc=100 \
  --region us-central1 \
  --project acme-flow-production-67890

# 3. Verify rollback
./deployment/verify-environment.sh production-client
```

---

## 🔗 Custom Domain Setup

### Map Custom Domain to Service

**For staging**:
```bash
gcloud run domain-mappings create \
  --service flow-staging \
  --domain staging.acme.com \
  --region us-central1 \
  --project acme-flow-staging-12345

# GCP will provide DNS records to add
```

**For production**:
```bash
gcloud run domain-mappings create \
  --service flow-production \
  --domain flow.acme.com \
  --region us-central1 \
  --project acme-flow-production-67890
```

### Update DNS Records

Add records provided by GCP (usually CNAME to `ghs.googlehosted.com`)

**Wait**: 15-30 minutes for SSL certificate provisioning

**Verify**:
```bash
curl https://staging.acme.com
curl https://flow.acme.com
```

---

## 💰 Cost Management

### Per-Environment Monthly Costs

**Staging Internal** (~$10-20/month):
- Cloud Run: 512Mi RAM, 1 CPU, min: 0
- Firestore: Shared with local (minimal)
- Cloud Storage: < 1GB
- Egress: Minimal

**Client Staging** (~$30-60/month):
- Cloud Run: 1Gi RAM, 2 CPU, min: 1 (always running)
- Firestore: Test data (~10GB)
- Cloud Storage: ~5GB
- Egress: Moderate

**Client Production** (~$100-300/month):
- Cloud Run: 2Gi RAM, 4 CPU, min: 2 (always running)
- Firestore: Production data (~50GB)
- Cloud Storage: ~20GB
- Egress: High
- Gemini API: Variable based on usage

### Cost Optimization Tips

1. **Staging**: Set min instances to 0 when not testing
2. **Firestore**: Use TTL for test data in staging
3. **Storage**: Clean up old uploads periodically
4. **Monitoring**: Set budget alerts per environment

---

## 🛠️ Maintenance

### Weekly

- [ ] Check logs for errors (all environments)
- [ ] Verify health checks passing
- [ ] Review cost reports
- [ ] Clean up old Cloud Run revisions (keep last 5)

### Monthly

- [ ] Rotate JWT secrets
- [ ] Update dependencies
- [ ] Review and optimize Firestore indexes
- [ ] Clean up test data in staging
- [ ] Review access logs

### Quarterly

- [ ] Rotate all secrets
- [ ] Review OAuth configurations
- [ ] Update security rules if needed
- [ ] Performance optimization review
- [ ] Cost optimization review

---

## 📚 Reference Commands

### Environment Information

```bash
# Check active environment
echo $ENVIRONMENT_NAME

# Check active project
gcloud config get-value project

# List all Cloud Run services
gcloud run services list --platform managed
```

### Deployment Status

```bash
# Check service status
gcloud run services describe flow-staging \
  --region us-central1 \
  --project acme-flow-staging-12345

# List revisions
gcloud run revisions list \
  --service flow-staging \
  --region us-central1
```

### Secret Management

```bash
# List secrets
gcloud secrets list --project=acme-flow-staging-12345

# View secret versions
gcloud secrets versions list google-ai-api-key \
  --project=acme-flow-staging-12345

# Update secret
echo -n "NEW_VALUE" | gcloud secrets versions add google-ai-api-key \
  --data-file=- \
  --project=acme-flow-staging-12345
```

---

## 🔍 Troubleshooting

### Issue: OAuth Redirect URI Mismatch

**Error**: `redirect_uri_mismatch`

**Solution**:
1. Get deployed URL from Cloud Run
2. Add to OAuth client redirect URIs
3. Wait 5-10 minutes
4. Test again

### Issue: Secrets Not Found

**Error**: `Secret "google-ai-api-key" not found`

**Solution**:
```bash
# Check if secret exists
gcloud secrets list --project=[PROJECT-ID]

# Create if missing
./deployment/create-secrets.sh staging-client
```

### Issue: Permission Denied

**Error**: `Permission denied on resource project`

**Solution**:
1. Verify you have Owner role
2. Check active project: `gcloud config get-value project`
3. Re-authenticate if needed: `gcloud auth login`

### Issue: Firestore Index Not Ready

**Error**: `The query requires an index`

**Solution**:
```bash
# Check index status
gcloud firestore indexes composite list \
  --project=[PROJECT-ID]

# Wait for indexes to build (5-10 minutes)
# State should be: READY
```

---

## 📖 Related Documentation

- `deployment/env-templates/*.env` - Environment configuration templates
- `.cursor/rules/environment-awareness.mdc` - Multi-environment awareness
- `.cursor/rules/staging-deployment-protection.mdc` - Staging protection
- `.cursor/rules/production-deployment-protection.mdc` - Production protection
- `config/environments.ts` - Environment definitions
- `ENV_VARIABLES_REFERENCE.md` - Environment variable reference

---

## ✅ Success Criteria

**Setup is successful when**:

For Each Environment:
- ✅ Service deployed and accessible
- ✅ OAuth login works
- ✅ Firestore queries work
- ✅ Health checks pass
- ✅ No errors in logs
- ✅ Secrets properly mounted

Overall:
- ✅ All 4 environments working independently
- ✅ Cursor protection rules active
- ✅ Clear separation between client data
- ✅ Backward compatible with existing setup
- ✅ Client satisfied with staging before production

---

**Total Implementation Time**: ~2-3 hours for first client (including learning)  
**Subsequent Clients**: ~45-60 minutes each  
**Automation Level**: 90% (only secrets, OAuth, DNS are manual)  
**Safety Level**: Multi-layer with Cursor confirmations
















