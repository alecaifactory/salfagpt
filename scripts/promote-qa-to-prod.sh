#!/bin/bash
# 🚀 Promote QA to Production
# 
# After successful QA testing, deploy same code to production
# This ensures production gets exactly what was tested
# 
# Usage: ./scripts/promote-qa-to-prod.sh

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo -e "${RED}🚀 PROMOTE QA TO PRODUCTION${NC}"
echo "=================================="
echo ""

# Configuration
PROD_PROJECT="salfagpt"
PROD_SERVICE="cr-salfagpt-ai-ft-prod"
REGION="us-east4"

# Get current production revision
CURRENT_PROD=$(gcloud run services describe $PROD_SERVICE \
  --region=$REGION \
  --project=$PROD_PROJECT \
  --format='value(status.latestReadyRevisionName)')

echo "📊 Current state:"
echo "  Production: $CURRENT_PROD"
echo "  QA: Tested and working ✅"
echo ""

# Confirm with user
echo -e "${YELLOW}⚠️  DEPLOYING TO PRODUCTION${NC}"
echo ""
echo "This will:"
echo "  ✅ Deploy same code that worked in QA"
echo "  ✅ All users will get new version"
echo "  ⚠️  If issues: Can rollback to $CURRENT_PROD"
echo ""
echo -e "${RED}Are you SURE QA testing is complete?${NC}"
read -p "Deploy to production? (yes/no): " -r
echo ""

if [[ ! $REPLY =~ ^yes$ ]]; then
  echo "Production deployment cancelled."
  exit 1
fi

# Deploy to production
echo -e "${BLUE}🚀 Deploying to PRODUCTION...${NC}"
echo "⏱️  This takes ~8-10 minutes..."
echo ""

gcloud run deploy $PROD_SERVICE \
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
  --set-env-vars="GOOGLE_CLOUD_PROJECT=salfagpt,NODE_ENV=production,PUBLIC_BASE_URL=https://salfagpt.salfagestion.cl,SESSION_COOKIE_NAME=salfagpt_session,SESSION_MAX_AGE=86400,CHUNK_SIZE=8000,CHUNK_OVERLAP=2000,EMBEDDING_BATCH_SIZE=32,TOP_K=5,EMBEDDING_MODEL=gemini-embedding-001,ENVIRONMENT_NAME=production,PUBLIC_USE_CHAT_V2=true,USE_EAST4_BIGQUERY=true,USE_EAST4_STORAGE=true" \
  --set-secrets="GOOGLE_AI_API_KEY=google-ai-api-key:latest,GOOGLE_CLIENT_ID=google-client-id:latest,GOOGLE_CLIENT_SECRET=google-client-secret:latest,JWT_SECRET=jwt-secret:latest"

# Get new production revision
NEW_PROD=$(gcloud run services describe $PROD_SERVICE \
  --region=$REGION \
  --project=$PROD_PROJECT \
  --format='value(status.latestReadyRevisionName)')

echo ""
echo -e "${GREEN}✅ Production deployment complete!${NC}"
echo ""
echo "📊 Deployment summary:"
echo "  Old: $CURRENT_PROD"
echo "  New: $NEW_PROD"
echo ""
echo "🧪 Verify:"
echo "  URL: https://salfagpt.salfagestion.cl/"
echo ""
echo "🚨 If issues, rollback:"
echo "  ./scripts/rollback-to-stable.sh"
echo "  (returns to: $CURRENT_PROD)"
echo ""
echo -e "${GREEN}Deployment successful! 🎉${NC}"
echo ""

