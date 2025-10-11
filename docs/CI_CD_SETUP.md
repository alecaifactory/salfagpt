# CI/CD Setup Guide - Google Cloud Build

Complete guide to setting up automated CI/CD for OpenFlow using Google Cloud Build, keeping everything within GCP.

## Overview

This CI/CD pipeline uses:
- **Cloud Build** - Build and test automation
- **Cloud Build Triggers** - GitHub integration (no GitHub Actions)
- **Artifact Registry** - Docker image storage
- **Secret Manager** - Secure credential storage
- **Cloud Run** - Application deployment

**Benefits:**
- Everything in GCP Console
- No external CI/CD service
- Native secret management
- Better GCP integration
- Simpler IAM and permissions

## Prerequisites

### 1. GCP Project Setup
```bash
# Set your project ID
export PROJECT_ID="your-project-id"
gcloud config set project $PROJECT_ID

# Enable required APIs
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  cloudresourcemanager.googleapis.com
```

### 2. Artifact Registry Repository
Create a Docker repository for storing images:

```bash
gcloud artifacts repositories create openflow \
  --repository-format=docker \
  --location=us-central1 \
  --description="OpenFlow Docker images"
```

### 3. Service Accounts

#### Cloud Build Service Account
Cloud Build uses: `[PROJECT_NUMBER]@cloudbuild.gserviceaccount.com`

Grant required permissions:
```bash
# Get project number
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')

# Grant permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"
```

#### Cloud Run Runtime Service Account
Create a service account for the running application:

```bash
# Create service account
gcloud iam service-accounts create openflow-runtime \
  --display-name="OpenFlow Runtime Service Account"

# Grant necessary permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:openflow-runtime@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:openflow-runtime@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/logging.logWriter"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:openflow-runtime@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/cloudtrace.agent"
```

## Secret Manager Setup

### 1. Create Secrets

```bash
# Anthropic API Key
echo -n "your-anthropic-api-key" | \
  gcloud secrets create ANTHROPIC_API_KEY \
    --data-file=- \
    --replication-policy="automatic"

# OAuth Client Secret
echo -n "your-oauth-client-secret" | \
  gcloud secrets create OAUTH_CLIENT_SECRET \
    --data-file=- \
    --replication-policy="automatic"

# Session Secret
echo -n "$(openssl rand -base64 32)" | \
  gcloud secrets create SESSION_SECRET \
    --data-file=- \
    --replication-policy="automatic"
```

### 2. Grant Access to Secrets

```bash
# Cloud Build access (for builds)
for SECRET in ANTHROPIC_API_KEY OAUTH_CLIENT_SECRET SESSION_SECRET; do
  gcloud secrets add-iam-policy-binding $SECRET \
    --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
done

# Cloud Run access (for runtime)
for SECRET in ANTHROPIC_API_KEY OAUTH_CLIENT_SECRET SESSION_SECRET; do
  gcloud secrets add-iam-policy-binding $SECRET \
    --member="serviceAccount:openflow-runtime@${PROJECT_ID}.iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
done
```

## Cloud Build Triggers Setup

### 1. Connect GitHub Repository

First, connect your GitHub repository to Cloud Build:

**Via Console:**
1. Go to [Cloud Build Triggers](https://console.cloud.google.com/cloud-build/triggers)
2. Click "Connect Repository"
3. Select "GitHub (Cloud Build GitHub App)"
4. Authenticate with GitHub
5. Select your repository
6. Click "Connect"

**Via CLI:**
```bash
# List available connections
gcloud builds connections list

# If needed, create a connection (opens browser for auth)
gcloud builds connections create github "github-connection" \
  --region=us-central1
```

### 2. Create PR Validation Trigger

Runs on every pull request to validate code:

```bash
gcloud builds triggers create github \
  --name="pr-validation" \
  --description="Run tests and validation on pull requests" \
  --repo-name="openflow" \
  --repo-owner="your-github-username" \
  --pull-request-pattern="^main$" \
  --build-config="cloudbuild.yaml" \
  --region=us-central1 \
  --comment-control="COMMENTS_ENABLED"
```

**Via Console:**
1. Go to Cloud Build Triggers
2. Click "Create Trigger"
3. Name: `pr-validation`
4. Event: Pull request
5. Base branch: `^main$`
6. Build configuration: Cloud Build configuration file
7. Location: `cloudbuild.yaml`
8. Save

### 3. Create Staging Deployment Trigger

Auto-deploys to staging when code is merged to main:

```bash
gcloud builds triggers create github \
  --name="deploy-staging" \
  --description="Auto-deploy to staging on merge to main" \
  --repo-name="openflow" \
  --repo-owner="your-github-username" \
  --branch-pattern="^main$" \
  --build-config="cloudbuild-deploy.yaml" \
  --region=us-central1 \
  --substitutions="_ENVIRONMENT=staging,_SERVICE_NAME=openflow-staging,_MIN_INSTANCES=0,_MAX_INSTANCES=10,_MEMORY=512Mi,_CPU=1"
```

### 4. Create Production Deployment Trigger

Manual trigger for production deployments:

```bash
gcloud builds triggers create manual \
  --name="deploy-production" \
  --description="Manual production deployment" \
  --repo="https://github.com/your-username/openflow" \
  --repo-type="GITHUB" \
  --branch="main" \
  --build-config="cloudbuild-deploy.yaml" \
  --region=us-central1 \
  --substitutions="_ENVIRONMENT=production,_SERVICE_NAME=openflow-production,_MIN_INSTANCES=1,_MAX_INSTANCES=100,_MEMORY=1Gi,_CPU=2"
```

## Initial Cloud Run Services

### 1. Create Staging Service

```bash
gcloud run deploy openflow-staging \
  --image=us-central1-docker.pkg.dev/$PROJECT_ID/openflow/openflow-staging:latest \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated \
  --min-instances=0 \
  --max-instances=10 \
  --memory=512Mi \
  --cpu=1 \
  --timeout=60s \
  --concurrency=80 \
  --service-account=openflow-runtime@$PROJECT_ID.iam.gserviceaccount.com \
  --set-secrets=ANTHROPIC_API_KEY=ANTHROPIC_API_KEY:latest \
  --set-secrets=OAUTH_CLIENT_SECRET=OAUTH_CLIENT_SECRET:latest \
  --set-secrets=SESSION_SECRET=SESSION_SECRET:latest \
  --set-env-vars=NODE_ENV=staging,NEXT_PUBLIC_PLATFORM=www,GOOGLE_CLOUD_PROJECT=$PROJECT_ID \
  --labels=environment=staging,managed-by=cloud-build
```

### 2. Create Production Service

```bash
gcloud run deploy openflow-production \
  --image=us-central1-docker.pkg.dev/$PROJECT_ID/openflow/openflow-production:latest \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated \
  --min-instances=1 \
  --max-instances=100 \
  --memory=1Gi \
  --cpu=2 \
  --timeout=60s \
  --concurrency=80 \
  --service-account=openflow-runtime@$PROJECT_ID.iam.gserviceaccount.com \
  --set-secrets=ANTHROPIC_API_KEY=ANTHROPIC_API_KEY:latest \
  --set-secrets=OAUTH_CLIENT_SECRET=OAUTH_CLIENT_SECRET:latest \
  --set-secrets=SESSION_SECRET=SESSION_SECRET:latest \
  --set-env-vars=NODE_ENV=production,NEXT_PUBLIC_PLATFORM=www,GOOGLE_CLOUD_PROJECT=$PROJECT_ID \
  --labels=environment=production,managed-by=cloud-build
```

## Testing the Pipeline

### 1. Test PR Validation

```bash
# Create a test branch
git checkout -b test/ci-pipeline

# Make a small change
echo "# Test" >> README.md

# Commit and push
git add README.md
git commit -m "test: CI pipeline"
git push origin test/ci-pipeline

# Create PR on GitHub
# Cloud Build should automatically run validation
```

Check status:
- Go to [Cloud Build History](https://console.cloud.google.com/cloud-build/builds)
- Should see build triggered by PR
- Build should complete in ~2-3 minutes

### 2. Test Staging Deployment

```bash
# Merge the PR to main
# Cloud Build should automatically deploy to staging

# Check deployment status
gcloud builds list --limit=5

# Get staging URL
gcloud run services describe openflow-staging \
  --region=us-central1 \
  --format='value(status.url)'

# Test the service
curl -I https://openflow-staging-xxx.run.app
```

### 3. Test Production Deployment (Manual)

```bash
# Trigger production deployment manually
gcloud builds triggers run deploy-production \
  --branch=main \
  --region=us-central1

# Watch the build
gcloud builds log $(gcloud builds list --limit=1 --format='value(id)') --stream

# Verify production service
gcloud run services describe openflow-production \
  --region=us-central1 \
  --format='value(status.url)'
```

## Monitoring and Logs

### View Build History
```bash
# List recent builds
gcloud builds list --limit=10

# View specific build logs
gcloud builds log BUILD_ID

# Or in Console
https://console.cloud.google.com/cloud-build/builds
```

### View Deployment Logs
```bash
# Cloud Run logs
gcloud logging read "resource.type=cloud_run_revision \
  AND resource.labels.service_name=openflow-production" \
  --limit=50 \
  --format=json

# Or in Console
https://console.cloud.google.com/run
```

### Set Up Alerts

Create alert for failed builds:
```bash
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="Failed Cloud Builds" \
  --condition-display-name="Build Failure" \
  --condition-expression='
    resource.type="cloud_build" AND
    metric.type="cloudbuild.googleapis.com/build_status" AND
    metric.label.status="FAILURE"
  '
```

## Rollback Procedures

### Quick Rollback to Previous Revision

```bash
# List recent revisions
gcloud run revisions list \
  --service=openflow-production \
  --region=us-central1

# Rollback to specific revision
gcloud run services update-traffic openflow-production \
  --region=us-central1 \
  --to-revisions=REVISION_NAME=100

# Example:
gcloud run services update-traffic openflow-production \
  --region=us-central1 \
  --to-revisions=openflow-production-00042-xyx=100
```

### Gradual Rollout (Canary)

```bash
# Route 90% to old, 10% to new
gcloud run services update-traffic openflow-production \
  --region=us-central1 \
  --to-revisions=OLD_REVISION=90,NEW_REVISION=10

# If stable, gradually increase
gcloud run services update-traffic openflow-production \
  --region=us-central1 \
  --to-revisions=OLD_REVISION=50,NEW_REVISION=50

# Finally, 100% to new
gcloud run services update-traffic openflow-production \
  --region=us-central1 \
  --to-latest
```

## Troubleshooting

### Build Fails: Permission Denied

```bash
# Check Cloud Build service account has permissions
gcloud projects get-iam-policy $PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"

# Should see: roles/run.admin, roles/iam.serviceAccountUser, roles/secretmanager.secretAccessor
```

### Cannot Access Secrets

```bash
# Check secret exists
gcloud secrets list

# Check IAM policy
gcloud secrets get-iam-policy ANTHROPIC_API_KEY

# Add access if missing
gcloud secrets add-iam-policy-binding ANTHROPIC_API_KEY \
  --member="serviceAccount:openflow-runtime@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### Health Check Fails

```bash
# Check service logs
gcloud logging read "resource.type=cloud_run_revision \
  AND resource.labels.service_name=openflow-staging \
  AND severity>=WARNING" \
  --limit=50 \
  --format=json

# Test locally with same environment
export ANTHROPIC_API_KEY=$(gcloud secrets versions access latest --secret=ANTHROPIC_API_KEY)
export OAUTH_CLIENT_SECRET=$(gcloud secrets versions access latest --secret=OAUTH_CLIENT_SECRET)
export SESSION_SECRET=$(gcloud secrets versions access latest --secret=SESSION_SECRET)

npm run dev
```

### Slow Builds

```bash
# Use larger machine type in cloudbuild.yaml:
options:
  machineType: 'E2_HIGHCPU_32'  # More powerful machine
  
# Or enable caching (already configured in cloudbuild.yaml)
```

## Cost Optimization

### Monitor Costs
```bash
# View Cloud Build costs
gcloud billing accounts list
gcloud beta billing projects describe $PROJECT_ID

# Set budget alerts
gcloud billing budgets create \
  --billing-account=BILLING_ACCOUNT_ID \
  --display-name="Cloud Build Budget" \
  --budget-amount=50 \
  --threshold-rule=percent=50 \
  --threshold-rule=percent=90 \
  --threshold-rule=percent=100
```

### Reduce Costs
- Use smaller machine types for simple builds
- Clean up old Docker images in Artifact Registry
- Use --min-instances=0 for staging (save $ when idle)
- Set max retention for Cloud Build logs (90 days)

## Next Steps

1. ✅ Set up monitoring dashboards
2. ✅ Configure Slack/email notifications for deployments
3. ✅ Add automated tests to `cloudbuild.yaml`
4. ✅ Set up custom domains for Cloud Run services
5. ✅ Implement blue-green deployments
6. ✅ Create runbook for common issues

## References

- [Cloud Build Documentation](https://cloud.google.com/build/docs)
- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Secret Manager Documentation](https://cloud.google.com/secret-manager/docs)
- [Artifact Registry Documentation](https://cloud.google.com/artifact-registry/docs)

---

**Last Updated:** October 10, 2025  
**Status:** Production Ready  
**Maintained By:** Development Team

