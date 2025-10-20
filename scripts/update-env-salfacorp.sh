#!/bin/bash
# Update Salfacorp Cloud Run Environment Variables
# Run this after rotating credentials in .env.salfacorp

set -e

echo "🔧 Updating Salfacorp Cloud Run Environment Variables"
echo "====================================================="
echo ""

# Check if .env.salfacorp exists
if [ ! -f .env.salfacorp ]; then
  echo "❌ Error: .env.salfacorp file not found"
  echo "   Create .env.salfacorp with Salfacorp credentials first"
  exit 1
fi

# Load environment variables
source .env.salfacorp

# Verify required variables
REQUIRED_VARS=("GOOGLE_CLOUD_PROJECT" "GOOGLE_AI_API_KEY" "GOOGLE_CLIENT_ID" "GOOGLE_CLIENT_SECRET" "JWT_SECRET")
for VAR in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!VAR}" ]; then
    echo "❌ Error: $VAR not set in .env.salfacorp"
    exit 1
  fi
done

echo "✅ All required variables found in .env.salfacorp"
echo ""

# Display current project
echo "📋 Target Configuration:"
echo "   Project: $GOOGLE_CLOUD_PROJECT"
echo "   Service: salfagpt (Salfacorp)"
echo "   Region: us-central1"
echo ""

# Confirm before proceeding
read -p "Update Cloud Run with these credentials? (yes/no) " -r
echo
if [[ ! $REPLY =~ ^yes$ ]]; then
  echo "❌ Aborted"
  exit 1
fi

# Update Cloud Run service
echo "🚀 Updating Cloud Run service..."
gcloud run services update salfagpt \
  --region=us-central1 \
  --update-env-vars="GOOGLE_CLOUD_PROJECT=${GOOGLE_CLOUD_PROJECT}" \
  --update-env-vars="GOOGLE_AI_API_KEY=${GOOGLE_AI_API_KEY}" \
  --update-env-vars="GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}" \
  --update-env-vars="GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}" \
  --update-env-vars="JWT_SECRET=${JWT_SECRET}" \
  --update-env-vars="SESSION_COOKIE_NAME=${SESSION_COOKIE_NAME}" \
  --update-env-vars="NODE_ENV=production" \
  --project="${GOOGLE_CLOUD_PROJECT}"

echo ""
echo "✅ Salfacorp Cloud Run updated successfully!"
echo ""
echo "🧪 Test the deployment:"
SERVICE_URL=$(gcloud run services describe salfagpt \
  --region=us-central1 \
  --project="${GOOGLE_CLOUD_PROJECT}" \
  --format='value(status.url)')
echo "   URL: $SERVICE_URL"
echo "   Test: curl $SERVICE_URL/api/health/firestore"

