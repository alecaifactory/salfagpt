#!/bin/bash
# Emergency rollback script for any environment

set -e

ENVIRONMENT=$1
TARGET_REVISION=$2

if [ -z "$ENVIRONMENT" ] || [ -z "$TARGET_REVISION" ]; then
  echo "Usage: ./rollback-deployment.sh <environment> <revision>"
  echo ""
  echo "Example: ./rollback-deployment.sh production-client flow-production-00042-abc"
  echo ""
  echo "To list available revisions:"
  echo "  gcloud run revisions list --service=flow-production --region=us-central1"
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
  *)
    echo "❌ Invalid environment: $ENVIRONMENT"
    exit 1
    ;;
esac

echo "🔄 Emergency Rollback"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Environment: $ENVIRONMENT"
echo "Project: $PROJECT_ID"
echo "Service: $SERVICE_NAME"
echo "Target Revision: $TARGET_REVISION"
echo ""

# Production extra warning
if [[ "$ENVIRONMENT" == "production-client" ]]; then
  echo "⚠️  WARNING: ROLLING BACK PRODUCTION"
  echo "   This affects live customers!"
  echo ""
  read -p "Type 'ROLLBACK' to confirm: " CONFIRM
  
  if [ "$CONFIRM" != "ROLLBACK" ]; then
    echo "❌ Rollback cancelled"
    exit 0
  fi
fi

# Set project
gcloud config set project $PROJECT_ID --quiet

# Verify revision exists
echo ""
echo "🔍 Verifying revision exists..."
if ! gcloud run revisions describe $TARGET_REVISION \
  --region $REGION \
  --project $PROJECT_ID 2>/dev/null >/dev/null; then
  echo "❌ Revision not found: $TARGET_REVISION"
  echo ""
  echo "Available revisions:"
  gcloud run revisions list \
    --service $SERVICE_NAME \
    --region $REGION \
    --format="table(name,creationTimestamp,status)"
  exit 1
fi

echo "✅ Revision found"

# Rollback
echo ""
echo "🔄 Rolling back traffic to $TARGET_REVISION..."

gcloud run services update-traffic $SERVICE_NAME \
  --to-revisions=$TARGET_REVISION=100 \
  --region $REGION \
  --project $PROJECT_ID

echo "✅ Traffic rolled back to $TARGET_REVISION"

# Verify
echo ""
echo "🏥 Verifying rollback..."
sleep 5

SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
  --region $REGION \
  --format 'value(status.url)')

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $SERVICE_URL)

if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 302 ]; then
  echo "✅ Service is healthy after rollback (HTTP $HTTP_CODE)"
else
  echo "❌ Service returned HTTP $HTTP_CODE"
  echo "   Check logs immediately!"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ ROLLBACK COMPLETE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Current revision: $TARGET_REVISION"
echo "Service URL: $SERVICE_URL"
echo ""
echo "📊 Monitor for issues:"
echo "  Logs: https://console.cloud.google.com/logs/query?project=$PROJECT_ID"
echo ""
echo "🔔 Notify stakeholders:"
echo "  • Team: Rollback completed"
if [[ "$ENVIRONMENT" =~ client ]]; then
  echo "  • Client: Service restored to previous version"
fi
echo ""















