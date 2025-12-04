#!/bin/bash
# 🧪 Deploy to QA/Staging Environment
# 
# Safely test changes in production-like environment
# WITHOUT affecting real users
# 
# Usage: ./scripts/deploy-to-qa.sh

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}🧪 DEPLOY TO QA/STAGING${NC}"
echo "=================================="
echo ""

# Configuration
QA_PROJECT="salfagpt-qa"
QA_SERVICE="cr-salfagpt-qa"
REGION="us-east4"

echo "📊 Configuration:"
echo "  Project: $QA_PROJECT"
echo "  Service: $QA_SERVICE"
echo "  Region:  $REGION"
echo ""

# Confirm
echo -e "${YELLOW}This will deploy to QA environment (SAFE - not production)${NC}"
echo ""
read -p "Continue? (yes/no): " -r
echo ""

if [[ ! $REPLY =~ ^yes$ ]]; then
  echo "Deployment cancelled."
  exit 1
fi

# Deploy to QA
echo -e "${BLUE}🚀 Deploying to QA...${NC}"
echo "⏱️  This takes ~8-10 minutes..."
echo ""

gcloud run deploy $QA_SERVICE \
  --source . \
  --project $QA_PROJECT \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --min-instances=0 \
  --max-instances=10 \
  --memory=4Gi \
  --cpu=2 \
  --timeout=300s \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=salfagpt-qa,NODE_ENV=qa,PUBLIC_BASE_URL=https://cr-salfagpt-qa-XXXXX.a.run.app,SESSION_COOKIE_NAME=salfagpt_session,SESSION_MAX_AGE=86400,CHUNK_SIZE=8000,CHUNK_OVERLAP=2000,EMBEDDING_BATCH_SIZE=32,TOP_K=5,EMBEDDING_MODEL=gemini-embedding-001,ENVIRONMENT_NAME=qa,PUBLIC_USE_CHAT_V2=true,USE_EAST4_BIGQUERY=true,USE_EAST4_STORAGE=true" \
  --set-secrets="GOOGLE_AI_API_KEY=google-ai-api-key:latest,GOOGLE_CLIENT_ID=google-client-id:latest,GOOGLE_CLIENT_SECRET=google-client-secret:latest,JWT_SECRET=jwt-secret:latest"

# Get QA URL
QA_URL=$(gcloud run services describe $QA_SERVICE \
  --region=$REGION \
  --project=$QA_PROJECT \
  --format='value(status.url)')

echo ""
echo -e "${GREEN}✅ QA Deployment complete!${NC}"
echo ""
echo "🧪 Test URL: $QA_URL"
echo ""
echo "📋 Next steps:"
echo "1. Open: $QA_URL"
echo "2. Test login with your account"
echo "3. Test all features"
echo "4. If works: ./scripts/promote-qa-to-prod.sh"
echo "5. If fails: Fix code and redeploy to QA"
echo ""
echo -e "${GREEN}Safe to test - production unaffected! ✅${NC}"
echo ""
