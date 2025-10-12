#!/bin/bash

# Flow Production Deployment Script with OAuth Fix
# This script deploys to Cloud Run and configures all necessary environment variables

set -e  # Exit on error

echo "🚀 Flow Production Deployment Script"
echo "====================================="
echo ""

# Project Configuration
PROJECT_ID="gen-lang-client-0986191192"
REGION="us-central1"
SERVICE_NAME="flow-chat"

# Load .env file if it exists
if [ -f .env ]; then
  echo "📄 Loading credentials from .env file..."
  export $(grep -v '^#' .env | grep -E '(GOOGLE_CLIENT_ID|GOOGLE_CLIENT_SECRET|JWT_SECRET|GEMINI_API_KEY)' | xargs)
  echo "✅ Credentials loaded from .env"
else
  echo "⚠️  No .env file found. You'll need to set credentials manually."
fi
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if required commands exist
command -v gcloud >/dev/null 2>&1 || { echo "❌ gcloud CLI not found. Install it first."; exit 1; }

echo "📋 Project: $PROJECT_ID"
echo "🌍 Region: $REGION"
echo "🎯 Service: $SERVICE_NAME"
echo ""

# Set project
echo "🔧 Setting GCP project..."
gcloud config set project $PROJECT_ID

# Build and deploy
echo ""
echo "🏗️  Building and deploying to Cloud Run..."
echo ""

gcloud run deploy $SERVICE_NAME \
  --source . \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --min-instances 0 \
  --max-instances 10 \
  --memory 512Mi \
  --cpu 1 \
  --timeout 60 \
  --set-env-vars="NODE_ENV=production,GOOGLE_CLOUD_PROJECT=$PROJECT_ID"

# Get the deployed service URL
echo ""
echo "🔍 Getting service URL..."
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --format 'value(status.url)')

echo -e "${GREEN}✅ Service deployed at: $SERVICE_URL${NC}"
echo ""

# Configure environment variables
echo "🔧 Configuring environment variables..."

# Check if credentials are available
if [ -n "$GOOGLE_CLIENT_ID" ]; then
  echo "✅ Found GOOGLE_CLIENT_ID in .env"
  
  # Set basic environment variables (PUBLIC_BASE_URL is critical for OAuth)
  gcloud run services update $SERVICE_NAME \
    --platform managed \
    --region $REGION \
    --set-env-vars="PUBLIC_BASE_URL=$SERVICE_URL,GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID,NODE_ENV=production,GOOGLE_CLOUD_PROJECT=$PROJECT_ID"
  
  echo -e "${GREEN}✅ Environment variables configured${NC}"
  echo "   PUBLIC_BASE_URL: $SERVICE_URL"
  echo "   GOOGLE_CLIENT_ID: ***${GOOGLE_CLIENT_ID: -10}"
  echo ""
  
  # Try to update secrets if they exist, otherwise suggest manual setup
  echo "🔐 Checking for Secret Manager secrets..."
  if gcloud secrets describe google-client-secret --project=$PROJECT_ID &>/dev/null; then
    echo "✅ Secrets already configured in Secret Manager"
    echo "   Using existing secrets..."
  else
    echo -e "${YELLOW}⚠️  Secrets not found in Secret Manager${NC}"
    echo ""
    echo "To configure secrets (one-time setup):"
    echo ""
    echo "1️⃣  Create secrets:"
    echo -e "   ${BLUE}echo -n \"\$GOOGLE_CLIENT_SECRET\" | gcloud secrets create google-client-secret --data-file=- --project=$PROJECT_ID${NC}"
    echo -e "   ${BLUE}echo -n \"\$JWT_SECRET\" | gcloud secrets create jwt-secret --data-file=- --project=$PROJECT_ID${NC}"
    echo -e "   ${BLUE}echo -n \"\$GEMINI_API_KEY\" | gcloud secrets create gemini-api-key --data-file=- --project=$PROJECT_ID${NC}"
    echo ""
    echo "2️⃣  Update Cloud Run to use secrets:"
    echo -e "   ${BLUE}gcloud run services update $SERVICE_NAME --update-secrets=GOOGLE_CLIENT_SECRET=google-client-secret:latest,JWT_SECRET=jwt-secret:latest,GEMINI_API_KEY=gemini-api-key:latest --region=$REGION${NC}"
    echo ""
  fi
else
  # Fallback: just set PUBLIC_BASE_URL
  echo "⚠️  GOOGLE_CLIENT_ID not found in .env, setting PUBLIC_BASE_URL only..."
  gcloud run services update $SERVICE_NAME \
    --platform managed \
    --region $REGION \
    --set-env-vars="PUBLIC_BASE_URL=$SERVICE_URL"
  
  echo -e "${YELLOW}⚠️  You'll need to set OAuth credentials manually${NC}"
fi
echo ""

# Display current environment variables
echo "📊 Current environment variables:"
gcloud run services describe $SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --format 'value(spec.template.spec.containers[0].env)' | grep -E "(PUBLIC_BASE_URL|GOOGLE_CLIENT_ID|NODE_ENV)" || echo "  (None visible - secrets may be hidden)"
echo ""

# OAuth Configuration Instructions
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${YELLOW}⚠️  FINAL STEP: Configure OAuth in Google Cloud Console${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Credentials from .env have been configured in Cloud Run"
echo "✅ PUBLIC_BASE_URL has been set to: $SERVICE_URL"
echo ""
echo "📝 Now add these URLs to your OAuth 2.0 Client:"
echo ""
echo "1️⃣  Go to Google Cloud Console:"
echo -e "   ${BLUE}https://console.cloud.google.com/apis/credentials?project=$PROJECT_ID${NC}"
echo ""
echo "2️⃣  Click on your OAuth 2.0 Client ID (or create one)"
echo ""
echo "3️⃣  Add to ${GREEN}Authorized JavaScript origins:${NC}"
echo "   $SERVICE_URL"
echo ""
echo "4️⃣  Add to ${GREEN}Authorized redirect URIs:${NC}"
echo "   $SERVICE_URL/auth/callback"
echo ""
echo "5️⃣  Click SAVE"
echo ""
echo "6️⃣  ⏰ Wait 5-10 minutes for changes to propagate"
echo ""
echo "7️⃣  Test your OAuth login:"
echo "   $SERVICE_URL/auth/login"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Health check
echo "🏥 Performing health check..."
sleep 5  # Wait for service to be ready

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $SERVICE_URL)

if [ "$HTTP_STATUS" -eq 200 ] || [ "$HTTP_STATUS" -eq 302 ]; then
  echo -e "${GREEN}✅ Health check passed (HTTP $HTTP_STATUS)${NC}"
else
  echo -e "${RED}⚠️  Health check returned HTTP $HTTP_STATUS${NC}"
  echo "   This might be normal if OAuth is not configured yet"
fi

echo ""

# View logs command
echo "📋 View logs with:"
echo -e "${BLUE}gcloud run services logs read $SERVICE_NAME \\
  --platform managed \\
  --region $REGION \\
  --limit 50${NC}"
echo ""

# Quick links
echo "🔗 Quick Links:"
echo "   Service URL:    $SERVICE_URL"
echo "   Login URL:      $SERVICE_URL/auth/login"
echo "   Chat URL:       $SERVICE_URL/chat"
echo "   OAuth Config:   https://console.cloud.google.com/apis/credentials?project=$PROJECT_ID"
echo "   Cloud Run:      https://console.cloud.google.com/run/detail/$REGION/$SERVICE_NAME?project=$PROJECT_ID"
echo ""

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "📖 For detailed OAuth configuration, see: OAUTH_PRODUCTION_FIX.md"
echo ""

