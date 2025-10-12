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

# Update PUBLIC_BASE_URL environment variable
echo "🔧 Setting PUBLIC_BASE_URL environment variable..."
gcloud run services update $SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --set-env-vars="PUBLIC_BASE_URL=$SERVICE_URL"

echo -e "${GREEN}✅ PUBLIC_BASE_URL set to: $SERVICE_URL${NC}"
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
echo -e "${YELLOW}⚠️  IMPORTANT: OAuth Configuration Required${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "To fix the 'Missing redirect_uri' error, configure OAuth:"
echo ""
echo "1️⃣  Add to Google Cloud Console OAuth Credentials:"
echo -e "   ${BLUE}https://console.cloud.google.com/apis/credentials?project=$PROJECT_ID${NC}"
echo ""
echo "   ${GREEN}Authorized JavaScript origins:${NC}"
echo "   $SERVICE_URL"
echo ""
echo "   ${GREEN}Authorized redirect URIs:${NC}"
echo "   $SERVICE_URL/auth/callback"
echo ""
echo "2️⃣  Set OAuth credentials (if not already set):"
echo ""
echo -e "   ${BLUE}gcloud run services update $SERVICE_NAME \\${NC}"
echo -e "   ${BLUE}  --platform managed \\${NC}"
echo -e "   ${BLUE}  --region $REGION \\${NC}"
echo -e "   ${BLUE}  --set-env-vars=\"GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com\" \\${NC}"
echo -e "   ${BLUE}  --set-secrets=\"GOOGLE_CLIENT_SECRET=google-client-secret:latest,\\${NC}"
echo -e "   ${BLUE}JWT_SECRET=jwt-secret:latest,\\${NC}"
echo -e "   ${BLUE}GEMINI_API_KEY=gemini-api-key:latest\"${NC}"
echo ""
echo "3️⃣  Wait 5-10 minutes for OAuth changes to propagate"
echo ""
echo "4️⃣  Test OAuth login:"
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

