#!/bin/bash
###############################################################################
# Deploy to PRODUCTION - Requires Confirmation
# 
# Project: salfagpt
# Service: cr-salfagpt-ai-ft-prod
# Region: us-east4
# Required Branch: main (ENFORCED)
#
# CRITICAL: This affects LIVE USERS!
# 
# This script:
# 1. Validates you're on main branch (REQUIRED)
# 2. Requires explicit "DEPLOY" confirmation
# 3. Validates authentication
# 4. Builds the application
# 5. Deploys to production Cloud Run
# 6. Updates environment variables
# 7. Records deployment with version tag
# 8. Creates rollback point
#
# Safety: Multiple confirmations, branch validation, deployment tracking
###############################################################################

set -e

PROD_PROJECT="salfagpt"
REGION="us-east4"
SERVICE_NAME="cr-salfagpt-ai-ft-prod"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${RED}🚨🚨🚨 PRODUCTION DEPLOYMENT 🚨🚨🚨${NC}"
echo "===================================="
echo "Project: $PROD_PROJECT"
echo "Service: $SERVICE_NAME"
echo "Region: $REGION"
echo ""
echo -e "${RED}⚠️  THIS AFFECTS LIVE USERS!${NC}"
echo -e "${RED}⚠️  150+ real users will be impacted${NC}"
echo ""

# Validate branch FIRST (before any confirmation)
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
  echo -e "${RED}🚨 ERROR: Cannot deploy to production from non-main branch${NC}"
  echo ""
  echo "  Current branch: $CURRENT_BRANCH"
  echo "  Required branch: main"
  echo ""
  echo "You must merge to main first:"
  echo "  git checkout main"
  echo "  git pull origin main"
  echo "  git merge --no-ff $CURRENT_BRANCH"
  echo "  git push origin main"
  echo ""
  exit 1
fi

echo -e "${GREEN}✅ Branch validation passed (on main)${NC}"
echo ""

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
  echo -e "${YELLOW}⚠️  WARNING: You have uncommitted changes${NC}"
  git status --short
  echo ""
  read -p "Continue with uncommitted changes? (yes/no) " CONFIRM
  if [ "$CONFIRM" != "yes" ]; then
    echo "❌ Deployment cancelled"
    exit 1
  fi
fi

# Pre-deployment checklist
echo -e "${BLUE}📋 Pre-Deployment Checklist:${NC}"
echo "  - [ ] Tested in QA environment?"
echo "  - [ ] QA approval obtained?"
echo "  - [ ] Documentation updated?"
echo "  - [ ] Breaking changes communicated?"
echo "  - [ ] Rollback plan ready?"
echo ""

# MANDATORY confirmation
read -p "Type 'DEPLOY' to confirm production deployment: " CONFIRM
if [ "$CONFIRM" != "DEPLOY" ]; then
  echo "❌ Deployment cancelled (did not type 'DEPLOY')"
  exit 1
fi

# Verify authentication
CURRENT_USER=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null || echo "none")
if [[ "$CURRENT_USER" != *"alec@salfacloud.cl"* ]]; then
  echo -e "${RED}❌ Must be authenticated as alec@salfacloud.cl${NC}"
  echo "   Current: $CURRENT_USER"
  exit 1
fi

echo ""
echo -e "${GREEN}✅ Authenticated as $CURRENT_USER${NC}"
echo ""

# Build
echo "🏗️  Building application..."
if ! npm run build; then
  echo -e "${RED}❌ Build failed${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Build successful${NC}"
echo ""

# Load env vars from .env
if [ ! -f .env ]; then
  echo -e "${RED}❌ .env file not found!${NC}"
  exit 1
fi

CHUNK_SIZE=$(grep "^CHUNK_SIZE=" .env | cut -d '=' -f2 || echo "1000")
CHUNK_OVERLAP=$(grep "^CHUNK_OVERLAP=" .env | cut -d '=' -f2 || echo "200")
EMBEDDING_BATCH_SIZE=$(grep "^EMBEDDING_BATCH_SIZE=" .env | cut -d '=' -f2 || echo "100")
TOP_K=$(grep "^TOP_K=" .env | cut -d '=' -f2 || echo "5")
EMBEDDING_MODEL=$(grep "^EMBEDDING_MODEL=" .env | cut -d '=' -f2 || echo "textembedding-gecko@003")

# Deploy to production
echo -e "${YELLOW}☁️  Deploying to PRODUCTION Cloud Run...${NC}"
echo "⏱️  This takes 5-10 minutes..."
echo ""

gcloud run deploy $SERVICE_NAME \
  --source . \
  --project $PROD_PROJECT \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --min-instances=1 \
  --max-instances=50 \
  --memory=4Gi \
  --cpu=2 \
  --timeout=300s \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=$PROD_PROJECT,NODE_ENV=production,ENVIRONMENT_NAME=production,CHUNK_SIZE=$CHUNK_SIZE,CHUNK_OVERLAP=$CHUNK_OVERLAP,EMBEDDING_BATCH_SIZE=$EMBEDDING_BATCH_SIZE,TOP_K=$TOP_K,EMBEDDING_MODEL=$EMBEDDING_MODEL" \
  --set-secrets="GOOGLE_AI_API_KEY=google-ai-api-key:latest,GOOGLE_CLIENT_ID=google-client-id:latest,GOOGLE_CLIENT_SECRET=google-client-secret:latest,JWT_SECRET=jwt-secret:latest"

# Get URL
PROD_URL=$(gcloud run services describe $SERVICE_NAME \
  --region $REGION \
  --project $PROD_PROJECT \
  --format='value(status.url)')

# Update PUBLIC_BASE_URL
echo ""
echo "Updating PUBLIC_BASE_URL..."
gcloud run services update $SERVICE_NAME \
  --region $REGION \
  --project $PROD_PROJECT \
  --update-env-vars="PUBLIC_BASE_URL=$PROD_URL,SESSION_COOKIE_NAME=salfagpt_session"

echo ""
echo -e "${GREEN}✅ Production deployed!${NC}"
echo -e "${BLUE}🌐 Production URL: $PROD_URL${NC}"
echo ""

# Create version tag
VERSION=$(cat package.json | grep version | head -1 | cut -d'"' -f4)
COMMIT=$(git rev-parse --short HEAD)

echo "📝 Creating version tag..."
git tag -f "prod/current"
git tag -a "v$VERSION" -m "Production deployment v$VERSION - $(date)" 2>/dev/null || git tag -f "v$VERSION"
git push origin prod/current v$VERSION -f 2>/dev/null || echo "  (tags may already exist)"

echo ""
echo "📊 Monitor deployment:"
echo "   https://console.cloud.google.com/run/detail/$REGION/$SERVICE_NAME?project=$PROD_PROJECT"
echo ""
echo "🧪 Verify health:"
echo "   curl $PROD_URL/api/health"
echo ""
echo -e "${GREEN}✅ Production deployment complete!${NC}"
echo ""

# Record deployment (if tracking script exists)
if [ -f scripts/track-deployment.sh ]; then
  ./scripts/track-deployment.sh production
fi

