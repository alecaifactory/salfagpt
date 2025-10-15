# 🚀 Production Deployment Process

**Last Successful Deploy:** 2025-10-15  
**Service:** flow-chat  
**Region:** us-central1  
**Status:** ✅ Live

---

## 📋 Standard Deployment Process

### Prerequisites
```bash
# 1. Authenticate with GCP
gcloud auth login

# 2. Set correct project
gcloud config set project gen-lang-client-0986191192

# 3. Verify local build works
npm run build
```

### Deployment Steps

#### Step 1: Local Testing
```bash
# Test locally first
npm run dev

# Verify:
# - All features work
# - No console errors
# - Database connections work
# - Authentication works
```

#### Step 2: Commit Changes
```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "feat: description of changes"

# Push to GitHub
git push origin main
```

#### Step 3: Deploy to Cloud Run
```bash
cd /Users/alec/salfagpt

gcloud run deploy flow-chat \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --min-instances 1 \
  --max-instances 10 \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=gen-lang-client-0986191192,NODE_ENV=production" \
  --project gen-lang-client-0986191192
```

**Duration:** 3-5 minutes

#### Step 4: Configure Secrets (First Deploy Only)
```bash
# Create secrets from .env
source .env

echo -n "$GOOGLE_AI_API_KEY" | gcloud secrets create google-ai-api-key \
  --data-file=- --replication-policy="automatic" \
  --project=gen-lang-client-0986191192

echo -n "$GOOGLE_CLIENT_ID" | gcloud secrets create google-client-id \
  --data-file=- --replication-policy="automatic" \
  --project=gen-lang-client-0986191192

echo -n "$GOOGLE_CLIENT_SECRET" | gcloud secrets create google-client-secret \
  --data-file=- --replication-policy="automatic" \
  --project=gen-lang-client-0986191192

echo -n "$JWT_SECRET" | gcloud secrets create jwt-secret \
  --data-file=- --replication-policy="automatic" \
  --project=gen-lang-client-0986191192

# Mount secrets
gcloud run services update flow-chat \
  --region=us-central1 \
  --update-secrets="GOOGLE_AI_API_KEY=google-ai-api-key:latest,GOOGLE_CLIENT_ID=google-client-id:latest,GOOGLE_CLIENT_SECRET=google-client-secret:latest,JWT_SECRET=jwt-secret:latest" \
  --project=gen-lang-client-0986191192
```

#### Step 5: Set PUBLIC_BASE_URL
```bash
# Get service URL
SERVICE_URL=$(gcloud run services describe flow-chat \
  --region=us-central1 \
  --format='value(status.url)' \
  --project=gen-lang-client-0986191192)

# Set as environment variable
gcloud run services update flow-chat \
  --region=us-central1 \
  --update-env-vars="PUBLIC_BASE_URL=$SERVICE_URL" \
  --project=gen-lang-client-0986191192
```

#### Step 6: Configure OAuth
1. Get service URL from Step 5
2. Go to: https://console.cloud.google.com/apis/credentials?project=gen-lang-client-0986191192
3. Edit OAuth Client ID
4. Add to "Authorized redirect URIs": `https://YOUR-SERVICE-URL/auth/callback`
5. Save and wait 5-10 minutes

#### Step 7: Verify Deployment
```bash
# Health check
curl https://flow-chat-cno6l2kfga-uc.a.run.app/api/health/firestore

# Should return:
{
  "status": "healthy",
  "checks": {
    "authentication": { "status": "pass" }
  }
}
```

---

## 🔄 Quick Redeploy (After Initial Setup)

```bash
# 1. Make changes locally
# 2. Test with npm run dev
# 3. Commit
git add .
git commit -m "feat: changes"
git push origin main

# 4. Deploy
gcloud run deploy flow-chat \
  --source . \
  --region us-central1 \
  --project gen-lang-client-0986191192

# That's it! Secrets and OAuth already configured.
```

---

## 🔐 Secret Management

### Update a Secret
```bash
# Update secret value
echo -n "NEW_VALUE" | gcloud secrets versions add SECRET_NAME \
  --data-file=- \
  --project=gen-lang-client-0986191192

# Redeploy to pick up new version
gcloud run deploy flow-chat \
  --source . \
  --region us-central1 \
  --project=gen-lang-client-0986191192
```

### List Secrets
```bash
gcloud secrets list --project=gen-lang-client-0986191192
```

### View Secret Metadata (Not Value)
```bash
gcloud secrets describe SECRET_NAME --project=gen-lang-client-0986191192
```

---

## 📊 Monitoring

### View Logs (Last 50 Entries)
```bash
gcloud logging read \
  "resource.type=cloud_run_revision AND resource.labels.service_name=flow-chat" \
  --limit=50 \
  --format=json \
  --project=gen-lang-client-0986191192
```

### View Logs (Real-time)
```bash
gcloud logging tail \
  "resource.type=cloud_run_revision AND resource.labels.service_name=flow-chat" \
  --project=gen-lang-client-0986191192
```

### Service Metrics
Visit: https://console.cloud.google.com/run/detail/us-central1/flow-chat/metrics?project=gen-lang-client-0986191192

---

## 🐛 Troubleshooting

### Deployment Fails
```bash
# Check build logs
gcloud builds list --project=gen-lang-client-0986191192 --limit=5

# View specific build
gcloud builds log BUILD_ID --project=gen-lang-client-0986191192
```

### Service Not Responding
```bash
# Check service status
gcloud run services describe flow-chat \
  --region=us-central1 \
  --project=gen-lang-client-0986191192

# Check logs for errors
gcloud logging read \
  "resource.type=cloud_run_revision AND severity>=ERROR" \
  --limit=20 \
  --project=gen-lang-client-0986191192
```

### Rollback to Previous Revision
```bash
# List revisions
gcloud run revisions list \
  --service=flow-chat \
  --region=us-central1 \
  --project=gen-lang-client-0986191192

# Route traffic to previous revision
gcloud run services update-traffic flow-chat \
  --to-revisions=PREVIOUS_REVISION=100 \
  --region=us-central1 \
  --project=gen-lang-client-0986191192
```

---

## 💰 Cost Management

### Current Estimated Costs
```
Cloud Run (min-instances=1): ~$14/month
Gemini API (moderate use): ~$5-15/month
Firestore (< 1GB): ~$1/month
Secrets: Free (6 secrets)
Total: ~$20-30/month
```

### Cost Optimization
```bash
# Reduce to 0 min instances (cold starts)
gcloud run services update flow-chat \
  --min-instances=0 \
  --region=us-central1 \
  --project=gen-lang-client-0986191192

# Savings: ~$14/month
# Trade-off: 3-5s delay on first request after idle
```

---

## 🔒 Security Best Practices

### ✅ Implemented
- Secrets in Secret Manager (not env vars)
- HTTPS enforced
- Secure cookies (httpOnly, secure flag)
- JWT with expiration
- Service account with minimal permissions
- Workload Identity for Firestore access

### Recommended Additional Steps
- [ ] Set up VPC connector (optional)
- [ ] Enable Binary Authorization (optional)
- [ ] Configure Cloud Armor (DDoS protection)
- [ ] Set up alerting policies
- [ ] Regular security audits

---

## 📈 Scaling Configuration

### Current
```
Min Instances: 1 (always ready)
Max Instances: 10 (handles traffic spikes)
CPU: 2 cores
Memory: 2 GiB
```

### Adjust Scaling
```bash
# For high traffic
gcloud run services update flow-chat \
  --min-instances=3 \
  --max-instances=50 \
  --region=us-central1 \
  --project=gen-lang-client-0986191192

# For low traffic / cost savings
gcloud run services update flow-chat \
  --min-instances=0 \
  --max-instances=5 \
  --region=us-central1 \
  --project=gen-lang-client-0986191192
```

---

## 🎯 Health Checks

### Manual Health Check
```bash
curl https://flow-chat-cno6l2kfga-uc.a.run.app/api/health/firestore
```

### Automated Monitoring
Set up in Cloud Console:
1. Cloud Monitoring → Uptime Checks
2. Create check for: https://flow-chat-cno6l2kfga-uc.a.run.app/api/health/firestore
3. Alert if status != "healthy"

---

## 🔄 CI/CD (Future Enhancement)

### GitHub Actions Example
```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloud Run
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: google-github-actions/auth@v1
      - uses: google-github-actions/deploy-cloudrun@v1
        with:
          service: flow-chat
          region: us-central1
```

---

## 📝 Deployment Checklist

### Pre-Deploy
- [ ] npm run build succeeds
- [ ] npm run type-check passes (0 errors)
- [ ] All features tested locally
- [ ] Changes committed to git
- [ ] Changes pushed to GitHub

### Deploy
- [ ] gcloud auth login completed
- [ ] gcloud run deploy executed
- [ ] Build successful
- [ ] Service URL obtained
- [ ] Traffic routed to new revision

### Post-Deploy
- [ ] Secrets configured (first time only)
- [ ] PUBLIC_BASE_URL updated
- [ ] OAuth redirect URI added
- [ ] Health check passing
- [ ] Manual testing completed

---

## 🌐 Current Production State

**URL:** https://flow-chat-cno6l2kfga-uc.a.run.app  
**Status:** 🟢 Live  
**Health:** ✅ Healthy  
**Features:** All working  
**Last Deploy:** 2025-10-15  
**Revision:** flow-chat-00030-dwg  

---

**For any deployment issues, check logs first:**
```bash
gcloud logging read "resource.type=cloud_run_revision AND severity>=ERROR" \
  --limit=20 --project=gen-lang-client-0986191192
```

