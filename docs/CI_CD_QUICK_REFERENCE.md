# CI/CD Quick Reference Guide

Fast reference for common CI/CD operations using Cloud Build.

## Quick Setup

```bash
# Run automated setup
npm run setup:cicd

# Or manual setup
./scripts/setup-cicd.sh
```

## Test Locally

```bash
# Test PR validation build
npm run ci:validate

# Test staging deployment
npm run ci:deploy:staging

# Test production deployment  
npm run ci:deploy:production
```

## Common Commands

### View Recent Builds
```bash
gcloud builds list --limit=10
```

### Watch Build in Real-time
```bash
# Get latest build ID
BUILD_ID=$(gcloud builds list --limit=1 --format='value(id)')

# Stream logs
gcloud builds log $BUILD_ID --stream
```

### Trigger Manual Production Deploy
```bash
gcloud builds triggers run deploy-production --branch=main --region=us-central1
```

### Check Service Status
```bash
# Staging
gcloud run services describe salfagpt-staging --region=us-central1

# Production
gcloud run services describe salfagpt-production --region=us-central1

# Get URLs
gcloud run services list --platform=managed
```

### View Logs
```bash
# Recent Cloud Run logs
gcloud logging read "resource.type=cloud_run_revision \
  AND resource.labels.service_name=salfagpt-production" \
  --limit=50

# Build logs
gcloud logging read "resource.type=build" --limit=20
```

### Rollback
```bash
# List revisions
gcloud run revisions list \
  --service=salfagpt-production \
  --region=us-central1

# Rollback to previous
gcloud run services update-traffic salfagpt-production \
  --region=us-central1 \
  --to-revisions=PREVIOUS_REVISION=100
```

### Manage Secrets
```bash
# List secrets
gcloud secrets list

# View secret value (requires permission)
gcloud secrets versions access latest --secret=ANTHROPIC_API_KEY

# Update secret
echo -n "new-value" | gcloud secrets versions add ANTHROPIC_API_KEY --data-file=-

# View secret access logs
gcloud logging read "protoPayload.serviceName=secretmanager.googleapis.com" --limit=20
```

### Monitor Costs
```bash
# View Cloud Build costs
gcloud beta billing projects describe $PROJECT_ID

# List all builds with duration
gcloud builds list --format="table(id,status,duration,source.repoSource.branchName)"
```

## Trigger Configuration

### PR Validation
- **Event**: Pull request to main
- **Config**: `cloudbuild.yaml`
- **Duration**: ~2-3 minutes
- **Steps**: Type check → Lint → Build

### Staging Deployment
- **Event**: Push to main
- **Config**: `cloudbuild-deploy.yaml`
- **Duration**: ~3-5 minutes
- **Steps**: Build image → Push → Deploy → Health check

### Production Deployment
- **Event**: Manual trigger
- **Config**: `cloudbuild-deploy.yaml`
- **Duration**: ~3-5 minutes
- **Steps**: Build image → Push → Deploy → Health check

## Troubleshooting

### Build Fails: "Permission Denied"
```bash
# Check Cloud Build service account permissions
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
gcloud projects get-iam-policy $PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"
```

### Build Fails: "Cannot access secrets"
```bash
# Grant secret access
gcloud secrets add-iam-policy-binding ANTHROPIC_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### Deployment Fails: "Service not found"
```bash
# Create the service first
gcloud run deploy salfagpt-staging \
  --image=us-central1-docker.pkg.dev/$PROJECT_ID/salfagpt/placeholder:latest \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated
```

### Health Check Timeout
```bash
# Check service logs for errors
gcloud logging read "resource.type=cloud_run_revision \
  AND resource.labels.service_name=salfagpt-staging \
  AND severity>=ERROR" --limit=20
```

## Performance Tips

### Speed Up Builds
1. Use larger machine type in `cloudbuild.yaml`:
   ```yaml
   options:
     machineType: 'E2_HIGHCPU_32'
   ```

2. Enable caching (already configured)

3. Parallelize steps with `waitFor: ['-']`

### Reduce Costs
1. Clean old images:
   ```bash
   gcloud artifacts docker images list us-central1-docker.pkg.dev/$PROJECT_ID/salfagpt \
     --filter="create_time<-P30D" \
     --format="get(image)" | \
     xargs -I {} gcloud artifacts docker images delete {} --quiet
   ```

2. Use min-instances=0 for staging

3. Set shorter log retention

## URLs

- **Cloud Build Console**: https://console.cloud.google.com/cloud-build/builds
- **Cloud Run Console**: https://console.cloud.google.com/run
- **Secret Manager**: https://console.cloud.google.com/security/secret-manager
- **Logs**: https://console.cloud.google.com/logs

## Emergency Contacts

- **On-call Engineer**: [Add contact]
- **GCP Support**: https://console.cloud.google.com/support
- **Slack Channel**: [Add channel]

---

**For full documentation**: See `docs/CI_CD_SETUP.md`

