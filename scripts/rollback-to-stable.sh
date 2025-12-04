#!/bin/bash
# 🚨 ROLLBACK TO STABLE - Emergency Recovery
# 
# Instantly returns ALL traffic to stable revision
# Use this if canary has critical issues
# 
# Usage: ./scripts/rollback-to-stable.sh

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo -e "${RED}🚨 ROLLBACK TO STABLE${NC}"
echo "=================================="
echo ""

# Configuration
PROJECT="salfagpt"
SERVICE="cr-salfagpt-ai-ft-prod"
REGION="us-east4"

# Get stable revision from Firestore
echo "📊 Getting stable revision from Firestore..."
STABLE_REV=$(npx tsx -e "
import { firestore } from './src/lib/firestore.js';
const doc = await firestore.collection('canary_config').doc('current').get();
if (doc.exists) {
  console.log(doc.data().stableRevision);
} else {
  console.log('cr-salfagpt-ai-ft-prod-00095-b8f'); // Fallback to known stable
}
process.exit(0);
" 2>/dev/null || echo "cr-salfagpt-ai-ft-prod-00095-b8f")

echo -e "${GREEN}Stable revision: $STABLE_REV${NC}"
echo ""

# Get current canary (if any)
CURRENT_REV=$(gcloud run services describe $SERVICE \
  --region=$REGION \
  --project=$PROJECT \
  --format='value(status.latestReadyRevisionName)')

echo "Current revision: $CURRENT_REV"
echo ""

# Confirm rollback
echo -e "${YELLOW}⚠️  ROLLING BACK TO STABLE${NC}"
echo ""
echo "This will:"
echo "  ✅ Route 100% traffic to: $STABLE_REV"
echo "  ✅ Remove canary routing"
echo "  ✅ All users back on stable version"
echo "  ⏱️  Takes: ~30 seconds"
echo ""
read -p "Proceed with rollback? (yes/no): " -r
echo ""

if [[ ! $REPLY =~ ^yes$ ]]; then
  echo "Rollback cancelled."
  exit 1
fi

# Execute rollback
echo -e "${BLUE}🔄 Rolling back...${NC}"
gcloud run services update-traffic $SERVICE \
  --to-revisions=$STABLE_REV=100 \
  --region $REGION \
  --project $PROJECT

echo ""
echo -e "${GREEN}✅ Rollback complete!${NC}"
echo ""

# Update Firestore
echo "📝 Updating Firestore..."
npx tsx -e "
import { firestore } from './src/lib/firestore.js';

await firestore.collection('canary_config').doc('current').update({
  status: 'rolled-back',
  rolloutPercentage: 0,
  rolledBackAt: new Date(),
  lastUpdatedAt: new Date(),
  rollbackReason: 'Manual rollback to stable via script'
});

console.log('✅ Canary config updated');
process.exit(0);
" 2>/dev/null || echo "⚠️  Could not update Firestore (non-critical)"

echo ""
echo -e "${GREEN}✅ Platform restored to stable version${NC}"
echo ""
echo "📊 Status:"
echo "  Revision: $STABLE_REV"
echo "  Traffic:  100% stable"
echo "  URL:      https://salfagpt.salfagestion.cl/"
echo ""
echo "🧪 Verify:"
echo "  curl https://salfagpt.salfagestion.cl/api/version"
echo ""
echo -e "${GREEN}Rollback successful! 🎉${NC}"
echo ""

