#!/bin/bash
# Verify deployment health for any environment

ENVIRONMENT=$1

if [ -z "$ENVIRONMENT" ]; then
  echo "Usage: ./verify-environment.sh <environment>"
  echo ""
  echo "Environments:"
  echo "  staging-internal"
  echo "  staging-client"
  echo "  production-client"
  exit 1
fi

# Load environment config
if [ -f ".env.$ENVIRONMENT" ]; then
  export $(grep -v '^#' .env.$ENVIRONMENT | grep -v '^$' | xargs)
else
  echo "❌ .env.$ENVIRONMENT not found"
  exit 1
fi

PROJECT_ID=$GOOGLE_CLOUD_PROJECT
REGION=${REGION:-us-central1}

case $ENVIRONMENT in
  "staging-internal")
    SERVICE_NAME="flow-staging-internal"
    ;;
  "staging-client")
    SERVICE_NAME="flow-staging"
    ;;
  "production-client")
    SERVICE_NAME="flow-production"
    ;;
esac

echo "🏥 Environment Health Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Environment: $ENVIRONMENT"
echo "Project: $PROJECT_ID"
echo "Service: $SERVICE_NAME"
echo ""

# Set project
gcloud config set project $PROJECT_ID --quiet

# Get service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
  --region $REGION \
  --format 'value(status.url)' 2>/dev/null)

if [ -z "$SERVICE_URL" ]; then
  echo "❌ Service not found: $SERVICE_NAME"
  echo "   Deploy first: ./deployment/deploy-to-environment.sh $ENVIRONMENT"
  exit 1
fi

echo "Service URL: $SERVICE_URL"
echo ""

# Health check
echo "Testing HTTP response..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $SERVICE_URL)

if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 302 ]; then
  echo "✅ HTTP $HTTP_CODE - Service is healthy"
else
  echo "❌ HTTP $HTTP_CODE - Service may have issues"
fi

# Check environment variables
echo ""
echo "Checking environment variables..."
ENV_VARS=$(gcloud run services describe $SERVICE_NAME \
  --region $REGION \
  --format 'value(spec.template.spec.containers[0].env)')

if echo "$ENV_VARS" | grep -q "GOOGLE_CLOUD_PROJECT"; then
  echo "✅ GOOGLE_CLOUD_PROJECT configured"
else
  echo "❌ GOOGLE_CLOUD_PROJECT missing"
fi

if echo "$ENV_VARS" | grep -q "ENVIRONMENT_NAME"; then
  echo "✅ ENVIRONMENT_NAME configured"
else
  echo "⚠️  ENVIRONMENT_NAME not set (optional)"
fi

# Check secrets
echo ""
echo "Checking secrets..."
SECRETS=$(gcloud run services describe $SERVICE_NAME \
  --region $REGION \
  --format 'json' | grep -o '"secretKeyRef"' | wc -l)

echo "  Secrets mounted: $SECRETS"
if [ "$SECRETS" -ge 3 ]; then
  echo "✅ All secrets appear to be mounted"
else
  echo "⚠️  Expected 3 secrets, found $SECRETS"
fi

# Check recent logs for errors
echo ""
echo "Checking recent logs for errors..."
ERROR_COUNT=$(gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=$SERVICE_NAME AND severity>=ERROR" \
  --limit=10 \
  --project=$PROJECT_ID \
  --format="value(timestamp)" 2>/dev/null | wc -l)

if [ "$ERROR_COUNT" -eq 0 ]; then
  echo "✅ No recent errors in logs"
else
  echo "⚠️  Found $ERROR_COUNT recent errors"
  echo "   View logs: https://console.cloud.google.com/logs/query?project=$PROJECT_ID"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Health check complete"
echo ""
echo "Test the service:"
echo "  Login: $SERVICE_URL/auth/login"
echo "  Chat: $SERVICE_URL/chat"
echo ""

