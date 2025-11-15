#!/bin/bash
###############################################################################
# Compare QA vs Production State
# 
# Shows data counts, service status, and differences between environments
# Useful for understanding QA staleness and production drift
###############################################################################

PROD_PROJECT="salfagpt"
QA_PROJECT="salfagpt-qa"
REGION="us-east4"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}📊 QA vs Production Comparison${NC}"
echo "================================"
echo ""

# Function to count collection documents
count_collection() {
  local project=$1
  local collection=$2
  local count=$(gcloud firestore documents list $collection --project=$project --limit=1000000 --format="value(name)" 2>/dev/null | wc -l || echo "0")
  echo "$count"
}

# Users
echo "👥 Users:"
PROD_USERS=$(count_collection $PROD_PROJECT users)
QA_USERS=$(count_collection $QA_PROJECT users)
DIFF_USERS=$((QA_USERS - PROD_USERS))
echo "  Production: $PROD_USERS"
echo "  QA:         $QA_USERS"
echo "  Difference: $DIFF_USERS"
echo ""

# Conversations (Agents)
echo "🤖 Conversations (Agents):"
PROD_CONVS=$(count_collection $PROD_PROJECT conversations)
QA_CONVS=$(count_collection $QA_PROJECT conversations)
DIFF_CONVS=$((QA_CONVS - PROD_CONVS))
echo "  Production: $PROD_CONVS"
echo "  QA:         $QA_CONVS"
echo "  Difference: $DIFF_CONVS"
echo ""

# Messages
echo "💬 Messages:"
PROD_MSGS=$(count_collection $PROD_PROJECT messages)
QA_MSGS=$(count_collection $QA_PROJECT messages)
DIFF_MSGS=$((QA_MSGS - PROD_MSGS))
echo "  Production: $PROD_MSGS"
echo "  QA:         $QA_MSGS"
echo "  Difference: $DIFF_MSGS"
echo ""

# Context Sources
echo "📄 Context Sources:"
PROD_SOURCES=$(count_collection $PROD_PROJECT context_sources)
QA_SOURCES=$(count_collection $QA_PROJECT context_sources)
DIFF_SOURCES=$((QA_SOURCES - PROD_SOURCES))
echo "  Production: $PROD_SOURCES"
echo "  QA:         $QA_SOURCES"
echo "  Difference: $DIFF_SOURCES"
echo ""

# Cloud Run Status
echo "☁️  Cloud Run Services:"
echo -e "${YELLOW}  Production:${NC}"
PROD_STATUS=$(gcloud run services describe cr-salfagpt-ai-ft-prod \
  --region=$REGION \
  --project=$PROD_PROJECT \
  --format="value(status.conditions[0].message)" 2>/dev/null || echo "Error getting status")
PROD_REVISION=$(gcloud run services describe cr-salfagpt-ai-ft-prod \
  --region=$REGION \
  --project=$PROD_PROJECT \
  --format="value(status.latestReadyRevisionName)" 2>/dev/null || echo "N/A")
echo "    Status: $PROD_STATUS"
echo "    Revision: $PROD_REVISION"
echo ""

echo -e "${YELLOW}  QA:${NC}"
QA_STATUS=$(gcloud run services describe cr-salfagpt-qa \
  --region=$REGION \
  --project=$QA_PROJECT \
  --format="value(status.conditions[0].message)" 2>/dev/null || echo "Not deployed or error")
QA_REVISION=$(gcloud run services describe cr-salfagpt-qa \
  --region=$REGION \
  --project=$QA_PROJECT \
  --format="value(status.latestReadyRevisionName)" 2>/dev/null || echo "N/A")
echo "    Status: $QA_STATUS"
echo "    Revision: $QA_REVISION"
echo ""

# Git comparison
echo "🔀 Git Branch Comparison:"
git fetch origin main develop --quiet 2>/dev/null || true

MAIN_COMMIT=$(git rev-parse --short origin/main 2>/dev/null || git rev-parse --short main 2>/dev/null || echo "N/A")
DEVELOP_COMMIT=$(git rev-parse --short origin/develop 2>/dev/null || echo "N/A (create develop branch)")

echo "  main (production): $MAIN_COMMIT"
echo "  develop (QA):      $DEVELOP_COMMIT"

if [ "$MAIN_COMMIT" != "N/A" ] && [ "$DEVELOP_COMMIT" != "N/A" ]; then
  AHEAD=$(git rev-list --count origin/main..origin/develop 2>/dev/null || echo "?")
  BEHIND=$(git rev-list --count origin/develop..origin/main 2>/dev/null || echo "?")
  echo "  develop is $AHEAD commits ahead, $BEHIND commits behind main"
  echo ""
  
  if [ "$AHEAD" != "0" ] && [ "$AHEAD" != "?" ]; then
    echo "  Commits in QA but not production:"
    git log origin/main..origin/develop --oneline | head -5
  fi
fi

echo ""
echo -e "${GREEN}✅ Comparison complete${NC}"

