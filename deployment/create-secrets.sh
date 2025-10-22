#!/bin/bash
# Create secrets in Secret Manager for a specific environment

set -e

ENVIRONMENT=$1

if [ -z "$ENVIRONMENT" ]; then
  echo "Usage: ./create-secrets.sh <environment>"
  echo ""
  echo "Environments:"
  echo "  staging-internal   - Your GCP staging"
  echo "  staging-client     - Client GCP staging"
  echo "  production-client  - Client GCP production"
  echo ""
  echo "Example: ./create-secrets.sh staging-client"
  exit 1
fi

# Load environment config
if [ -f ".env.$ENVIRONMENT" ]; then
  ENV_FILE=".env.$ENVIRONMENT"
else
  echo "❌ Environment file not found: .env.$ENVIRONMENT"
  echo "   Create it first from template"
  exit 1
fi

echo "📄 Loading configuration from $ENV_FILE..."
export $(grep -v '^#' $ENV_FILE | grep -v '^$' | xargs)

if [ -z "$GOOGLE_CLOUD_PROJECT" ]; then
  echo "❌ GOOGLE_CLOUD_PROJECT not set in $ENV_FILE"
  exit 1
fi

PROJECT_ID=$GOOGLE_CLOUD_PROJECT

echo ""
echo "🔐 Creating Secrets in Secret Manager"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Environment: $ENVIRONMENT"
echo "Project: $PROJECT_ID"
echo ""

# Check required variables
if [ -z "$GOOGLE_AI_API_KEY" ]; then
  echo "❌ GOOGLE_AI_API_KEY not set in $ENV_FILE"
  exit 1
fi

if [ -z "$GOOGLE_CLIENT_SECRET" ]; then
  echo "❌ GOOGLE_CLIENT_SECRET not set in $ENV_FILE"
  exit 1
fi

if [ -z "$JWT_SECRET" ]; then
  echo "⚠️  JWT_SECRET not set - generating new one..."
  JWT_SECRET=$(openssl rand -base64 32)
  echo "   Generated: $JWT_SECRET"
  echo "   Add to $ENV_FILE: JWT_SECRET=$JWT_SECRET"
  echo ""
fi

# Create secrets
echo "Creating secret: google-ai-api-key..."
if gcloud secrets describe google-ai-api-key --project=$PROJECT_ID 2>/dev/null >/dev/null; then
  echo "  ⚠️  Secret already exists - updating version..."
  echo -n "$GOOGLE_AI_API_KEY" | gcloud secrets versions add google-ai-api-key \
    --data-file=- \
    --project=$PROJECT_ID
else
  echo -n "$GOOGLE_AI_API_KEY" | gcloud secrets create google-ai-api-key \
    --data-file=- \
    --project=$PROJECT_ID
fi
echo "  ✅ google-ai-api-key configured"

echo "Creating secret: google-client-secret..."
if gcloud secrets describe google-client-secret --project=$PROJECT_ID 2>/dev/null >/dev/null; then
  echo "  ⚠️  Secret already exists - updating version..."
  echo -n "$GOOGLE_CLIENT_SECRET" | gcloud secrets versions add google-client-secret \
    --data-file=- \
    --project=$PROJECT_ID
else
  echo -n "$GOOGLE_CLIENT_SECRET" | gcloud secrets create google-client-secret \
    --data-file=- \
    --project=$PROJECT_ID
fi
echo "  ✅ google-client-secret configured"

echo "Creating secret: jwt-secret..."
if gcloud secrets describe jwt-secret --project=$PROJECT_ID 2>/dev/null >/dev/null; then
  echo "  ⚠️  Secret already exists - updating version..."
  echo -n "$JWT_SECRET" | gcloud secrets versions add jwt-secret \
    --data-file=- \
    --project=$PROJECT_ID
else
  echo -n "$JWT_SECRET" | gcloud secrets create jwt-secret \
    --data-file=- \
    --project=$PROJECT_ID
fi
echo "  ✅ jwt-secret configured"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ ALL SECRETS CREATED"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Project: $PROJECT_ID"
echo "Environment: $ENVIRONMENT"
echo ""
echo "Secrets created:"
echo "  • google-ai-api-key"
echo "  • google-client-secret"
echo "  • jwt-secret"
echo ""
echo "Next: Deploy application"
echo "  ./deployment/deploy-to-environment.sh $ENVIRONMENT"
echo ""











