#!/bin/bash
###############################################################################
# Rollback Production to Previous Revision
# 
# Lists recent Cloud Run revisions and allows rollback
# Fast recovery mechanism for production issues
#
# Usage: ./scripts/rollback-production.sh
###############################################################################

PROD_PROJECT="salfagpt"
SERVICE_NAME="cr-salfagpt-ai-ft-prod"
REGION="us-east4"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${RED}🔄 Production Rollback${NC}"
echo "====================="
echo ""

# List recent revisions
echo "📜 Recent Production Revisions:"
echo ""
gcloud run revisions list \
  --service=$SERVICE_NAME \
  --region=$REGION \
  --project=$PROD_PROJECT \
  --limit=10 \
  --format="table(name,status.conditions[0].lastTransitionTime,traffic)"

echo ""
echo -e "${YELLOW}Current revision is marked with TRAFFIC percentage${NC}"
echo ""
read -p "Enter revision name to rollback to (or 'cancel'): " REVISION

if [ -z "$REVISION" ] || [ "$REVISION" = "cancel" ]; then
  echo "❌ Rollback cancelled"
  exit 0
fi

# Verify revision exists
if ! gcloud run revisions describe $REVISION \
  --region=$REGION \
  --project=$PROD_PROJECT &> /dev/null; then
  echo -e "${RED}❌ Revision $REVISION not found${NC}"
  exit 1
fi

# Confirm rollback
echo ""
echo -e "${RED}⚠️  You are about to rollback production to: $REVISION${NC}"
echo ""
read -p "Type 'ROLLBACK' to confirm: " CONFIRM

if [ "$CONFIRM" != "ROLLBACK" ]; then
  echo "❌ Rollback cancelled"
  exit 1
fi

# Execute rollback
echo ""
echo "🔄 Rolling back production traffic to $REVISION..."

gcloud run services update-traffic $SERVICE_NAME \
  --to-revisions=$REVISION=100 \
  --region=$REGION \
  --project=$PROD_PROJECT

echo ""
echo -e "${GREEN}✅ Rollback complete!${NC}"
echo ""
echo "🌐 Verify at: https://salfagpt-3snj65wckq-uc.a.run.app"
echo ""
echo "📊 Monitor:"
echo "   https://console.cloud.google.com/run/detail/$REGION/$SERVICE_NAME?project=$PROD_PROJECT"
echo ""
echo "⚠️  Note: This only changes traffic routing. The new revision still exists."
echo "   To fully rollback code, redeploy from a previous git commit."

