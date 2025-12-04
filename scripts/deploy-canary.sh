#!/bin/bash
# 🧪 Deploy Canary - Safe Testing Deployment
# 
# Deploys new version WITHOUT routing traffic
# Only canary users (you) will see it via app-level routing
# 
# Usage: ./scripts/deploy-canary.sh

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}🧪 CANARY DEPLOYMENT${NC}"
echo "=================================="
echo ""

# Configuration
PROJECT="salfagpt"
SERVICE="cr-salfagpt-ai-ft-prod"
REGION="us-east4"

# Get current stable revision
echo "📊 Checking current stable revision..."
STABLE_REV=$(gcloud run services describe $SERVICE \
  --region=$REGION \
  --project=$PROJECT \
  --format='value(status.traffic[0].revisionName)')

echo -e "${GREEN}✅ Current stable: $STABLE_REV${NC}"
echo ""

# Confirm with user
echo -e "${YELLOW}⚠️  This will deploy a NEW CANARY revision (no traffic routing)${NC}"
echo ""
echo "Current stable: $STABLE_REV (100% traffic)"
echo "Canary: Will be deployed with 0% traffic"
echo "Canary users: Will be routed via app logic (Firestore canary_config)"
echo ""
read -p "Continue? (yes/no): " -r
echo ""

if [[ ! $REPLY =~ ^yes$ ]]; then
  echo "Deployment cancelled."
  exit 1
fi

# Build and deploy canary (NO TRAFFIC)
echo "🚀 Deploying canary revision..."
echo "⏱️  This takes ~5-10 minutes..."
echo ""

gcloud run deploy $SERVICE \
  --source . \
  --project $PROJECT \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --no-traffic \
  --tag canary \
  --min-instances=0 \
  --max-instances=50 \
  --memory=4Gi \
  --cpu=2 \
  --timeout=300s \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=salfagpt,NODE_ENV=production,PUBLIC_BASE_URL=https://salfagpt.salfagestion.cl,SESSION_COOKIE_NAME=salfagpt_session,SESSION_MAX_AGE=86400,CHUNK_SIZE=8000,CHUNK_OVERLAP=2000,EMBEDDING_BATCH_SIZE=32,TOP_K=5,EMBEDDING_MODEL=gemini-embedding-001,ENVIRONMENT_NAME=production,PUBLIC_USE_CHAT_V2=true,USE_EAST4_BIGQUERY=true,USE_EAST4_STORAGE=true" \
  --set-secrets="GOOGLE_AI_API_KEY=google-ai-api-key:latest,GOOGLE_CLIENT_ID=google-client-id:latest,GOOGLE_CLIENT_SECRET=google-client-secret:latest,JWT_SECRET=jwt-secret:latest"

# Get canary revision name
CANARY_REV=$(gcloud run revisions list \
  --service=$SERVICE \
  --region=$REGION \
  --project=$PROJECT \
  --filter="metadata.labels.cloud.google.com/location=canary OR status.traffic.tag=canary" \
  --format="value(metadata.name)" \
  --limit=1)

if [ -z "$CANARY_REV" ]; then
  # If filter doesn't work, get latest revision
  CANARY_REV=$(gcloud run revisions list \
    --service=$SERVICE \
    --region=$REGION \
    --project=$PROJECT \
    --format="value(metadata.name)" \
    --limit=1)
fi

echo ""
echo -e "${GREEN}✅ Canary deployed!${NC}"
echo ""
echo "📊 Deployment Summary:"
echo "  Stable:  $STABLE_REV (100% traffic)"
echo "  Canary:  $CANARY_REV (0% traffic, canary users only)"
echo ""

# Update Firestore canary config
echo "📝 Updating Firestore canary config..."
npx tsx -e "
import { firestore } from './src/lib/firestore.js';

await firestore.collection('canary_config').doc('current').set({
  version: '0.1.1',
  status: 'testing',
  stableRevision: '$STABLE_REV',
  canaryRevision: '$CANARY_REV',
  canaryUsers: ['alec@getaifactory.com'],
  rolloutPercentage: 0,
  createdAt: new Date(),
  lastUpdatedAt: new Date(),
  description: 'Testing new deployment in canary mode'
}, { merge: true });

console.log('✅ Firestore canary config updated');
process.exit(0);
"

echo ""
echo -e "${GREEN}✅ Canary configuration complete!${NC}"
echo ""
echo "🧪 NEXT STEPS:"
echo "1. Open: https://salfagpt.salfagestion.cl/"
echo "2. Login as: alec@getaifactory.com"
echo "3. You will see canary version (check for badge)"
echo "4. Test everything thoroughly"
echo "5. If issues: ./scripts/rollback-to-stable.sh"
echo "6. If works: ./scripts/rollout-canary.sh 5 (expand to 5%)"
echo ""
echo -e "${YELLOW}⚠️  Remember: Only YOU see canary version${NC}"
echo -e "${YELLOW}⚠️  Everyone else still on stable ($STABLE_REV)${NC}"
echo ""
echo -e "${GREEN}Ready to test! 🚀${NC}"
echo ""

