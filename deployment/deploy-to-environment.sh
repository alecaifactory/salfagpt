#!/bin/bash
# Universal Deployment Script for Flow
# Supports: staging-internal, staging-client, production-client
# BACKWARD COMPATIBLE: Existing deploy-production.sh still works

set -e

ENVIRONMENT=$1

if [ -z "$ENVIRONMENT" ]; then
  echo "Usage: ./deploy-to-environment.sh <environment>"
  echo ""
  echo "Available environments:"
  echo "  staging-internal   - Your GCP staging (gen-lang-client-0986191192)"
  echo "  staging-client     - Client GCP staging"
  echo "  production-client  - Client GCP production"
  echo ""
  echo "Example: ./deploy-to-environment.sh staging-internal"
  exit 1
fi

# Validate environment
VALID_ENVS=("staging-internal" "staging-client" "production-client")
if [[ ! " ${VALID_ENVS[@]} " =~ " ${ENVIRONMENT} " ]]; then
  echo "❌ Invalid environment: $ENVIRONMENT"
  echo "   Valid options: ${VALID_ENVS[*]}"
  exit 1
fi

# Determine env file path
if [ -f ".env.$ENVIRONMENT" ]; then
  ENV_FILE=".env.$ENVIRONMENT"
elif [ -f "deployment/env-templates/${ENVIRONMENT//-client/}.env" ]; then
  echo "❌ No .env.$ENVIRONMENT file found"
  echo "   Create from template:"
  echo "   cp deployment/env-templates/${ENVIRONMENT//-client/}.env .env.$ENVIRONMENT"
  echo "   # Then edit with actual values"
  exit 1
else
  echo "❌ Environment configuration not found for: $ENVIRONMENT"
  exit 1
fi

echo "📄 Loading configuration from $ENV_FILE..."
export $(grep -v '^#' $ENV_FILE | grep -v '^$' | xargs)

# Validate required variables
REQUIRED_VARS=("GOOGLE_CLOUD_PROJECT" "GOOGLE_CLIENT_ID" "GOOGLE_AI_API_KEY" "JWT_SECRET")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    MISSING_VARS+=($var)
  fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
  echo "❌ Missing required environment variables in $ENV_FILE:"
  for var in "${MISSING_VARS[@]}"; do
    echo "   • $var"
  done
  echo ""
  echo "Please update $ENV_FILE with actual values"
  exit 1
fi

PROJECT_ID=$GOOGLE_CLOUD_PROJECT
REGION=${REGION:-us-central1}

# Determine service name from environment
case $ENVIRONMENT in
  "staging-internal")
    SERVICE_NAME="flow-staging-internal"
    MIN_INSTANCES=0
    MAX_INSTANCES=5
    MEMORY="512Mi"
    CPU=1
    TIMEOUT=60
    ;;
  "staging-client")
    SERVICE_NAME="flow-staging"
    MIN_INSTANCES=1
    MAX_INSTANCES=10
    MEMORY="1Gi"
    CPU=2
    TIMEOUT=120
    ;;
  "production-client")
    SERVICE_NAME="flow-production"
    MIN_INSTANCES=2
    MAX_INSTANCES=50
    MEMORY="2Gi"
    CPU=4
    TIMEOUT=300
    ;;
esac

echo ""
echo "🚀 Flow Deployment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Environment: $ENVIRONMENT"
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "Service: $SERVICE_NAME"
echo "Resources: $MEMORY RAM, $CPU CPU"
echo "Scaling: $MIN_INSTANCES-$MAX_INSTANCES instances"
echo ""

# Production safety check
if [[ "$ENVIRONMENT" == "production-client" ]]; then
  echo "⚠️  WARNING: DEPLOYING TO PRODUCTION"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "   This will affect LIVE CUSTOMERS!"
  echo ""
  echo "   Pre-deployment checklist:"
  echo "   □ Type check passed: npm run type-check"
  echo "   □ Build successful: npm run build"
  echo "   □ Tested in staging-client"
  echo "   □ Client approval received"
  echo "   □ Rollback plan ready"
  echo ""
  read -p "Type 'DEPLOY' to confirm (uppercase): " CONFIRM
  
  if [ "$CONFIRM" != "DEPLOY" ]; then
    echo "❌ Deployment cancelled (must type 'DEPLOY')"
    exit 0
  fi
  echo ""
  echo "✅ Production deployment confirmed"
fi

# Staging confirmation (simpler)
if [[ "$ENVIRONMENT" =~ staging ]]; then
  echo "Deploying to staging environment"
  read -p "Continue? (yes/no): " CONFIRM
  
  if [ "$CONFIRM" != "yes" ]; then
    echo "❌ Deployment cancelled"
    exit 0
  fi
fi

# Pre-deployment checks
echo ""
echo "🔍 Pre-deployment checks..."

# Check authentication
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "@"; then
  echo "❌ Not authenticated with gcloud"
  echo "   Run: gcloud auth login"
  exit 1
fi

# Type check
echo "  • Running type check..."
if ! npm run type-check --silent; then
  echo "❌ Type check failed"
  exit 1
fi
echo "  ✅ Type check passed"

# Build test
echo "  • Testing build..."
if ! npm run build --silent; then
  echo "❌ Build failed"
  exit 1
fi
echo "  ✅ Build successful"

# Set project
echo ""
echo "📌 Setting active project..."
gcloud config set project $PROJECT_ID

# Deploy
echo ""
echo "🚀 Deploying to Cloud Run..."
echo ""

gcloud run deploy $SERVICE_NAME \
  --source . \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --service-account="flow-runtime@${PROJECT_ID}.iam.gserviceaccount.com" \
  --min-instances $MIN_INSTANCES \
  --max-instances $MAX_INSTANCES \
  --memory $MEMORY \
  --cpu $CPU \
  --timeout ${TIMEOUT}s \
  --concurrency 80 \
  --set-env-vars="NODE_ENV=${NODE_ENV},GOOGLE_CLOUD_PROJECT=$PROJECT_ID,ENVIRONMENT_NAME=$ENVIRONMENT" \
  --update-secrets=GOOGLE_AI_API_KEY=google-ai-api-key:latest,GOOGLE_CLIENT_SECRET=google-client-secret:latest,JWT_SECRET=jwt-secret:latest \
  --labels="environment=$ENVIRONMENT,managed-by=deployment-script"

# Get service URL
echo ""
echo "🔍 Getting service URL..."
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
  --region $REGION \
  --format 'value(status.url)')

echo "✅ Service deployed: $SERVICE_URL"

# Update PUBLIC_BASE_URL
echo ""
echo "🔧 Updating PUBLIC_BASE_URL environment variable..."
gcloud run services update $SERVICE_NAME \
  --region $REGION \
  --update-env-vars="PUBLIC_BASE_URL=$SERVICE_URL"

echo "✅ PUBLIC_BASE_URL set to: $SERVICE_URL"

# Health check
echo ""
echo "🏥 Running health check..."
sleep 10  # Wait for service to stabilize

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $SERVICE_URL)

if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 302 ]; then
  echo "✅ Health check passed (HTTP $HTTP_CODE)"
else
  echo "⚠️  Service returned HTTP $HTTP_CODE"
  echo "   This may be normal if OAuth is not configured yet"
fi

# Get current revision for rollback
CURRENT_REVISION=$(gcloud run services describe $SERVICE_NAME \
  --region $REGION \
  --format 'value(status.latestCreatedRevisionName)')

# Summary and next steps
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ DEPLOYMENT COMPLETE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Environment: $ENVIRONMENT"
echo "Service URL: $SERVICE_URL"
echo "Current Revision: $CURRENT_REVISION"
echo ""
echo "🔐 CONFIGURE OAUTH (If not done already):"
echo ""
echo "1. Go to: https://console.cloud.google.com/apis/credentials?project=$PROJECT_ID"
echo ""
echo "2. Edit your OAuth 2.0 Client ID"
echo ""
echo "3. Add to Authorized JavaScript origins:"
echo "   $SERVICE_URL"
echo ""
echo "4. Add to Authorized redirect URIs:"
echo "   $SERVICE_URL/auth/callback"
echo ""
echo "5. Click SAVE and wait 5-10 minutes"
echo ""
echo "6. Test OAuth login:"
echo "   $SERVICE_URL/auth/login"
echo ""
echo "🔗 Quick Links:"
echo "   Service: https://console.cloud.google.com/run/detail/$REGION/$SERVICE_NAME?project=$PROJECT_ID"
echo "   Logs: https://console.cloud.google.com/logs/query?project=$PROJECT_ID"
echo "   Secrets: https://console.cloud.google.com/security/secret-manager?project=$PROJECT_ID"
echo ""
echo "🔄 Rollback (if needed):"
echo "   ./deployment/rollback-deployment.sh $ENVIRONMENT $CURRENT_REVISION"
echo ""
















