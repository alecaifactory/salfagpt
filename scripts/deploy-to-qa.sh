#!/bin/bash
###############################################################################
# Deploy to QA Environment
# 
# Project: salfagpt-qa
# Service: cr-salfagpt-qa
# Region: us-east4
# Expected Branch: develop (but allows any branch with warning)
#
# This script:
# 1. Validates authentication
# 2. Validates branch (warns if not develop)
# 3. Builds the application
# 4. Deploys to QA Cloud Run
# 5. Updates environment variables
# 6. Records deployment
#
# Safe: Only affects QA environment, not production
# Fast: ~5-10 minutes
###############################################################################

set -e

QA_PROJECT="salfagpt-qa"
REGION="us-east4"
SERVICE_NAME="cr-salfagpt-qa"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🧪 Deploying to QA Environment${NC}"
echo "=============================="
echo "Project: $QA_PROJECT"
echo "Service: $SERVICE_NAME"
echo "Region: $REGION"
echo ""

# Validate authentication
CURRENT_USER=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null || echo "none")
if [[ "$CURRENT_USER" != *"alec@salfacloud.cl"* ]]; then
  echo "❌ Must be authenticated as alec@salfacloud.cl"
  echo "   Current: $CURRENT_USER"
  echo ""
  echo "   Run: gcloud auth login"
  exit 1
fi

echo -e "${GREEN}✅ Authenticated as $CURRENT_USER${NC}"
echo ""

# Validate branch (warn if not develop)
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "develop" ]; then
  echo -e "${YELLOW}⚠️  WARNING: Deploying from non-develop branch${NC}"
  echo "  Current: $CURRENT_BRANCH"
  echo "  Expected: develop"
  echo ""
  read -p "Continue anyway? (yes/no) " CONFIRM
  if [ "$CONFIRM" != "yes" ]; then
    echo "❌ Deployment cancelled"
    exit 1
  fi
fi

# Build
echo "🏗️  Building application..."
if ! npm run build; then
  echo "❌ Build failed"
  exit 1
fi
echo -e "${GREEN}✅ Build successful${NC}"
echo ""

# Load env vars from .env (for defaults)
if [ -f .env ]; then
  CHUNK_SIZE=$(grep "^CHUNK_SIZE=" .env | cut -d '=' -f2 || echo "1000")
  CHUNK_OVERLAP=$(grep "^CHUNK_OVERLAP=" .env | cut -d '=' -f2 || echo "200")
  EMBEDDING_BATCH_SIZE=$(grep "^EMBEDDING_BATCH_SIZE=" .env | cut -d '=' -f2 || echo "100")
  TOP_K=$(grep "^TOP_K=" .env | cut -d '=' -f2 || echo "5")
  EMBEDDING_MODEL=$(grep "^EMBEDDING_MODEL=" .env | cut -d '=' -f2 || echo "textembedding-gecko@003")
else
  # Defaults if no .env
  CHUNK_SIZE="1000"
  CHUNK_OVERLAP="200"
  EMBEDDING_BATCH_SIZE="100"
  TOP_K="5"
  EMBEDDING_MODEL="textembedding-gecko@003"
fi

# Deploy to Cloud Run
echo "☁️  Deploying to Cloud Run..."
echo ""

gcloud run deploy $SERVICE_NAME \
  --source . \
  --project $QA_PROJECT \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --min-instances=0 \
  --max-instances=5 \
  --memory=2Gi \
  --cpu=1 \
  --timeout=300s \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=$QA_PROJECT,NODE_ENV=production,ENVIRONMENT_NAME=qa,CHUNK_SIZE=$CHUNK_SIZE,CHUNK_OVERLAP=$CHUNK_OVERLAP,EMBEDDING_BATCH_SIZE=$EMBEDDING_BATCH_SIZE,TOP_K=$TOP_K,EMBEDDING_MODEL=$EMBEDDING_MODEL" \
  --set-secrets="GOOGLE_AI_API_KEY=google-ai-api-key:latest,GOOGLE_CLIENT_ID=google-client-id:latest,GOOGLE_CLIENT_SECRET=google-client-secret:latest,JWT_SECRET=jwt-secret:latest"

# Get URL
QA_URL=$(gcloud run services describe $SERVICE_NAME \
  --region $REGION \
  --project $QA_PROJECT \
  --format='value(status.url)')

# Update PUBLIC_BASE_URL
echo ""
echo "Updating PUBLIC_BASE_URL..."
gcloud run services update $SERVICE_NAME \
  --region $REGION \
  --project $QA_PROJECT \
  --update-env-vars="PUBLIC_BASE_URL=$QA_URL,SESSION_COOKIE_NAME=salfagpt_qa_session"

echo ""
echo -e "${GREEN}✅ QA deployment complete!${NC}"
echo -e "${BLUE}🌐 QA URL: $QA_URL${NC}"
echo ""
echo "🧪 Test now:"
echo "   open $QA_URL/chat"
echo ""
echo "📊 Monitor:"
echo "   https://console.cloud.google.com/run/detail/$REGION/$SERVICE_NAME?project=$QA_PROJECT"
echo ""

# Record deployment (if tracking script exists)
if [ -f scripts/track-deployment.sh ]; then
  ./scripts/track-deployment.sh qa
fi

