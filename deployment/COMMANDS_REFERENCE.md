# 🔧 Command Reference

**Quick copy-paste commands for common tasks**

---

## 🚀 Setup New Client

### Step 1: Setup Infrastructure (Automated)

```bash
# Staging
./deployment/setup-client-project.sh
# → Type: staging
# → Enter: [CLIENT-STAGING-PROJECT-ID]
# → Confirm: yes

# Production
./deployment/setup-client-project.sh
# → Type: production  
# → Enter: [CLIENT-PRODUCTION-PROJECT-ID]
# → Confirm: yes
```

---

### Step 2: Create Secrets

```bash
# STAGING
gcloud config set project [CLIENT-STAGING-PROJECT-ID]

JWT_SECRET_STAGING=$(openssl rand -base64 32)
echo "Staging JWT Secret: $JWT_SECRET_STAGING"

echo -n "AIzaSy_YOUR_KEY" | gcloud secrets create google-ai-api-key --data-file=-
echo -n "GOCSPX_OAUTH_SECRET" | gcloud secrets create google-client-secret --data-file=-
echo -n "$JWT_SECRET_STAGING" | gcloud secrets create jwt-secret --data-file=-

# PRODUCTION (use DIFFERENT secrets!)
gcloud config set project [CLIENT-PRODUCTION-PROJECT-ID]

JWT_SECRET_PROD=$(openssl rand -base64 32)
echo "Production JWT Secret: $JWT_SECRET_PROD"

echo -n "AIzaSy_YOUR_KEY" | gcloud secrets create google-ai-api-key --data-file=-
echo -n "GOCSPX_PROD_OAUTH_SECRET" | gcloud secrets create google-client-secret --data-file=-
echo -n "$JWT_SECRET_PROD" | gcloud secrets create jwt-secret --data-file=-
```

---

### Step 3: Create .env Files

```bash
# Staging
cp deployment/env-templates/staging-client.env .env.staging-client

# Production
cp deployment/env-templates/production-client.env .env.production-client

# Edit both files with actual values
# Required: GOOGLE_CLOUD_PROJECT, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_AI_API_KEY, JWT_SECRET
```

---

### Step 4: Deploy

```bash
# Staging
./deployment/deploy-to-environment.sh staging-client

# Production
./deployment/deploy-to-environment.sh production-client
```

---

## 🔍 Verification Commands

### Check Service Status

```bash
# Staging
gcloud run services describe flow-staging \
  --region us-central1 \
  --project [CLIENT-STAGING-PROJECT-ID]

# Production
gcloud run services describe flow-production \
  --region us-central1 \
  --project [CLIENT-PRODUCTION-PROJECT-ID]
```

### Get Service URL

```bash
gcloud run services describe [SERVICE-NAME] \
  --region us-central1 \
  --project [PROJECT-ID] \
  --format 'value(status.url)'
```

### Check Health

```bash
# Using verification script
./deployment/verify-environment.sh staging-client
./deployment/verify-environment.sh production-client

# Manual health check
curl -I https://[SERVICE-URL]
```

### View Logs

```bash
# Last 50 lines
gcloud run services logs read [SERVICE-NAME] \
  --region us-central1 \
  --project [PROJECT-ID] \
  --limit 50

# Follow logs in real-time
gcloud alpha logging tail \
  "resource.type=cloud_run_revision AND resource.labels.service_name=[SERVICE-NAME]" \
  --project [PROJECT-ID]
```

---

## 🔐 Secret Management

### List Secrets

```bash
gcloud secrets list --project=[PROJECT-ID]
```

### View Secret Versions

```bash
gcloud secrets versions list [SECRET-NAME] --project=[PROJECT-ID]
```

### Update Secret Value

```bash
echo -n "NEW_VALUE" | gcloud secrets versions add [SECRET-NAME] \
  --data-file=- \
  --project=[PROJECT-ID]
```

### Access Secret Value (for debugging)

```bash
gcloud secrets versions access latest \
  --secret=[SECRET-NAME] \
  --project=[PROJECT-ID]
```

---

## 🔄 Deployment Operations

### Deploy to Environment

```bash
./deployment/deploy-to-environment.sh [environment]
# Environments: staging-internal, staging-client, production-client
```

### List Revisions

```bash
gcloud run revisions list \
  --service [SERVICE-NAME] \
  --region us-central1 \
  --project [PROJECT-ID]
```

### Rollback to Previous Revision

```bash
./deployment/rollback-deployment.sh [environment] [revision-name]

# Or manual:
gcloud run services update-traffic [SERVICE-NAME] \
  --to-revisions=[REVISION-NAME]=100 \
  --region us-central1 \
  --project [PROJECT-ID]
```

---

## 🌐 Custom Domain Management

### Map Domain to Service

```bash
gcloud run domain-mappings create \
  --service [SERVICE-NAME] \
  --domain [CUSTOM-DOMAIN] \
  --region us-central1 \
  --project [PROJECT-ID]
```

### List Domain Mappings

```bash
gcloud run domain-mappings list \
  --region us-central1 \
  --project [PROJECT-ID]
```

### Check Domain Mapping Status

```bash
gcloud run domain-mappings describe [CUSTOM-DOMAIN] \
  --region us-central1 \
  --project [PROJECT-ID]
```

### Delete Domain Mapping

```bash
gcloud run domain-mappings delete [CUSTOM-DOMAIN] \
  --region us-central1 \
  --project [PROJECT-ID]
```

---

## 📊 Monitoring Commands

### Check Error Rate

```bash
gcloud logging read \
  "resource.type=cloud_run_revision AND severity>=ERROR" \
  --limit 20 \
  --project [PROJECT-ID]
```

### Check Response Times

```bash
gcloud logging read \
  "resource.type=cloud_run_revision AND httpRequest.latency" \
  --limit 10 \
  --format "value(httpRequest.latency)" \
  --project [PROJECT-ID]
```

### Set Budget Alert

```bash
# Create budget
gcloud billing budgets create \
  --billing-account=[BILLING-ACCOUNT-ID] \
  --display-name="Flow [Environment] Budget" \
  --budget-amount=100 \
  --threshold-rule=percent=50 \
  --threshold-rule=percent=90
```

---

## 🔧 Environment Management

### Switch Between Projects

```bash
# Set active project
gcloud config set project [PROJECT-ID]

# Verify active project
gcloud config get-value project

# List all projects
gcloud projects list
```

### Check Current Configuration

```bash
# Active project
gcloud config list

# Active account
gcloud auth list

# Service account for Cloud Run
gcloud run services describe [SERVICE-NAME] \
  --region us-central1 \
  --format 'value(spec.template.spec.serviceAccountName)'
```

---

## 🛡️ Security Commands

### Grant Permissions

```bash
# Grant role to service account
gcloud projects add-iam-policy-binding [PROJECT-ID] \
  --member="serviceAccount:[SERVICE-ACCOUNT-EMAIL]" \
  --role="roles/[ROLE-NAME]"

# List permissions
gcloud projects get-iam-policy [PROJECT-ID] \
  --flatten="bindings[].members" \
  --filter="bindings.members:[SERVICE-ACCOUNT-EMAIL]"
```

### Firestore Security Rules

```bash
# Deploy staging rules
firebase deploy --only firestore:rules \
  --project [CLIENT-STAGING-PROJECT-ID]

# Deploy production rules
cp config/firestore.production.rules firestore.rules
firebase deploy --only firestore:rules \
  --project [CLIENT-PRODUCTION-PROJECT-ID]
```

---

## 📦 Complete Setup Script

**Copy-paste this entire block** for new client:

```bash
#!/bin/bash
# Complete setup for new client - Copy and run

# === CONFIGURATION (Replace these values) ===
CLIENT_NAME="Acme Corp"
CLIENT_STAGING_PROJECT="acme-flow-staging-12345"
CLIENT_PRODUCTION_PROJECT="acme-flow-production-67890"
YOUR_GEMINI_API_KEY="AIzaSy_YOUR_KEY"

# === STAGING SETUP ===
echo "Setting up $CLIENT_NAME Staging..."

# Setup infrastructure
./deployment/setup-client-project.sh << EOF
staging
$CLIENT_STAGING_PROJECT
us-central1
yes
yes
EOF

# Create secrets
gcloud config set project $CLIENT_STAGING_PROJECT
JWT_STAGING=$(openssl rand -base64 32)
echo "Staging JWT: $JWT_STAGING"

echo -n "$YOUR_GEMINI_API_KEY" | gcloud secrets create google-ai-api-key --data-file=-
# Note: google-client-secret created after OAuth client
echo -n "$JWT_STAGING" | gcloud secrets create jwt-secret --data-file=-

echo "✅ Staging setup complete"
echo "📝 Next: Configure OAuth in Console"
echo "   https://console.cloud.google.com/apis/credentials?project=$CLIENT_STAGING_PROJECT"

# === PRODUCTION SETUP ===
echo "Setting up $CLIENT_NAME Production..."

# Setup infrastructure
./deployment/setup-client-project.sh << EOF
production
$CLIENT_PRODUCTION_PROJECT
us-central1
yes
yes
EOF

# Create secrets
gcloud config set project $CLIENT_PRODUCTION_PROJECT
JWT_PROD=$(openssl rand -base64 32)
echo "Production JWT: $JWT_PROD"

echo -n "$YOUR_GEMINI_API_KEY" | gcloud secrets create google-ai-api-key --data-file=-
# Note: google-client-secret created after OAuth client
echo -n "$JWT_PROD" | gcloud secrets create jwt-secret --data-file=-

echo "✅ Production setup complete"
echo "📝 Next: Configure OAuth in Console"
echo "   https://console.cloud.google.com/apis/credentials?project=$CLIENT_PRODUCTION_PROJECT"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ INFRASTRUCTURE SETUP COMPLETE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Manual steps remaining:"
echo "1. Configure OAuth clients (20 min)"
echo "2. Create .env files (4 min)"
echo "3. Deploy applications (10 min)"
echo "4. Update OAuth URIs (10 min)"
echo ""
echo "See: deployment/MANUAL_CONFIGURATION_CHECKLIST.md"
```

**Save as**: `setup-new-client.sh`  
**Run**: `chmod +x setup-new-client.sh && ./setup-new-client.sh`

---

**All commands in one place for easy copy-paste!** 📋
