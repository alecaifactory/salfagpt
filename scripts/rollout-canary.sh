#!/bin/bash
# 📊 Rollout Canary - Progressive Expansion
# 
# Gradually expand canary to more users
# Usage: ./scripts/rollout-canary.sh <percentage>
# Example: ./scripts/rollout-canary.sh 5 (expand to 5%)

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PERCENTAGE=$1

if [ -z "$PERCENTAGE" ]; then
  echo "Usage: ./scripts/rollout-canary.sh <0-100>"
  echo ""
  echo "Examples:"
  echo "  ./scripts/rollout-canary.sh 5   # 5% of users"
  echo "  ./scripts/rollout-canary.sh 25  # 25% of users"
  echo "  ./scripts/rollout-canary.sh 100 # All users (complete)"
  exit 1
fi

echo ""
echo -e "${BLUE}📊 CANARY ROLLOUT${NC}"
echo "=================================="
echo ""

# Validate percentage
if [ "$PERCENTAGE" -lt 0 ] || [ "$PERCENTAGE" -gt 100 ]; then
  echo -e "${RED}Error: Percentage must be 0-100${NC}"
  exit 1
fi

# Get current config
echo "📊 Current rollout status..."
CURRENT_PCT=$(npx tsx -e "
import { firestore } from './src/lib/firestore.js';
const doc = await firestore.collection('canary_config').doc('current').get();
console.log(doc.exists ? doc.data().rolloutPercentage : 0);
process.exit(0);
" 2>/dev/null || echo "0")

echo "  Current: $CURRENT_PCT%"
echo "  Target:  $PERCENTAGE%"
echo ""

# Confirm
echo -e "${YELLOW}⚠️  Rolling out to $PERCENTAGE% of users${NC}"
echo ""
echo "This means:"
echo "  - Canary users (always canary): alec@getaifactory.com"
echo "  - Random $PERCENTAGE% of other users: ~$((PERCENTAGE * 50 / 100)) users"
echo "  - Remaining users: Stay on stable"
echo ""
read -p "Continue? (yes/no): " -r
echo ""

if [[ ! $REPLY =~ ^yes$ ]]; then
  echo "Rollout cancelled."
  exit 1
fi

# Update Firestore
echo "📝 Updating rollout percentage..."
npx tsx -e "
import { firestore } from './src/lib/firestore.js';

await firestore.collection('canary_config').doc('current').update({
  rolloutPercentage: $PERCENTAGE,
  status: $PERCENTAGE === 100 ? 'complete' : 'rolling-out',
  lastUpdatedAt: new Date(),
  ...$PERCENTAGE === 100 && { completedAt: new Date() }
});

console.log('✅ Rollout updated to $PERCENTAGE%');
process.exit(0);
"

echo ""
echo -e "${GREEN}✅ Rollout updated!${NC}"
echo ""
echo "📊 Current state:"
echo "  Canary users: Always on canary"
echo "  Rollout:      $PERCENTAGE% of other users"
echo "  Stable:       $((100 - PERCENTAGE))% of users"
echo ""

if [ "$PERCENTAGE" -eq 100 ]; then
  echo -e "${GREEN}🎉 Rollout complete - all users on new version!${NC}"
  echo ""
  echo "Next: ./scripts/promote-to-stable.sh (mark as new stable)"
else
  echo -e "${YELLOW}⏱️  Monitor for issues before expanding further${NC}"
  echo ""
  echo "Next steps:"
  echo "  - Monitor for 30-60 minutes"
  echo "  - Check error rates and user feedback"
  echo "  - If good: ./scripts/rollout-canary.sh $((PERCENTAGE * 2))"
  echo "  - If issues: ./scripts/rollback-to-stable.sh"
fi

echo ""

