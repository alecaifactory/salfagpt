#!/bin/bash
# Verify Cloud Run Environment Variables
# This script checks that all required environment variables from .env
# are properly configured in Cloud Run (either as env vars or secrets)

set -e

PROJECT_ID="gen-lang-client-0986191192"
SERVICE_NAME="flow-chat"
REGION="us-central1"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🔍 Verifying Cloud Run Environment Variables"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Project: $PROJECT_ID"
echo "Service: $SERVICE_NAME"
echo "Region: $REGION"
echo ""

# Expected variables from .env
EXPECTED_VARS=(
  "GOOGLE_CLOUD_PROJECT"
  "GOOGLE_AI_API_KEY"
  "GOOGLE_CLIENT_ID"
  "GOOGLE_CLIENT_SECRET"
  "JWT_SECRET"
  "PUBLIC_BASE_URL"
  "NODE_ENV"
)

# Get current Cloud Run env vars
echo "📥 Fetching Cloud Run configuration..."
CURRENT_VARS=$(gcloud run services describe $SERVICE_NAME \
  --region=$REGION \
  --project=$PROJECT_ID \
  --format="value(spec.template.spec.containers[0].env)" 2>&1)

if [ $? -ne 0 ]; then
  echo "❌ Failed to fetch Cloud Run configuration"
  echo "$CURRENT_VARS"
  exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Environment Variables Status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

MISSING_VARS=()
FOUND_COUNT=0

# Check each expected variable
for var in "${EXPECTED_VARS[@]}"; do
  if echo "$CURRENT_VARS" | grep -q "'name': '$var'"; then
    # Determine if it's a secret or env var
    if echo "$CURRENT_VARS" | grep "'name': '$var'" | grep -q "secretKeyRef"; then
      echo "  ✅ $var (secret)"
    else
      echo "  ✅ $var (env var)"
    fi
    ((FOUND_COUNT++))
  else
    echo "  ❌ $var - MISSING!"
    MISSING_VARS+=("$var")
  fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  Expected: ${#EXPECTED_VARS[@]} variables"
echo "  Found: $FOUND_COUNT variables"
echo "  Missing: ${#MISSING_VARS[@]} variables"
echo ""

if [ ${#MISSING_VARS[@]} -eq 0 ]; then
  echo "✅ All environment variables are properly configured!"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  exit 0
else
  echo "❌ Missing ${#MISSING_VARS[@]} required variable(s):"
  echo ""
  for var in "${MISSING_VARS[@]}"; do
    echo "  - $var"
  done
  echo ""
  echo "📝 To fix this, run:"
  echo ""
  for var in "${MISSING_VARS[@]}"; do
    # Determine if it should be a secret or env var
    if [[ "$var" == *"SECRET"* ]] || [[ "$var" == *"KEY"* ]] || [[ "$var" == *"CLIENT_ID"* ]]; then
      echo "  # Add $var as secret:"
      echo "  gcloud secrets create ${var,,} --data-file=- <<< \"\$(grep $var .env | cut -d'=' -f2-)\""
      echo "  gcloud secrets add-iam-policy-binding ${var,,} \\"
      echo "    --member=\"serviceAccount:1030147139179-compute@developer.gserviceaccount.com\" \\"
      echo "    --role=\"roles/secretmanager.secretAccessor\" \\"
      echo "    --project=$PROJECT_ID"
      echo "  gcloud run services update $SERVICE_NAME \\"
      echo "    --region=$REGION \\"
      echo "    --project=$PROJECT_ID \\"
      echo "    --update-secrets=\"$var=${var,,}:latest\""
    else
      echo "  # Add $var as env var:"
      echo "  gcloud run services update $SERVICE_NAME \\"
      echo "    --region=$REGION \\"
      echo "    --project=$PROJECT_ID \\"
      echo "    --set-env-vars=\"$var=\$(grep $var .env | cut -d'=' -f2-)\""
    fi
    echo ""
  done
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  exit 1
fi

