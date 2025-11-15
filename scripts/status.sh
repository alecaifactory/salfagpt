#!/bin/bash
###############################################################################
# Environment Status Check
# 
# Shows current status of all environments:
# - Git branch and commit
# - QA deployment status
# - Production deployment status
# - Branch comparison
###############################################################################

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}📊 SalfaGPT Environment Status${NC}"
echo "================================"
echo ""

# Git info
echo "📂 Git:"
CURRENT_BRANCH=$(git branch --show-current)
CURRENT_COMMIT=$(git rev-parse --short HEAD)
UNCOMMITTED=$(git status --short | wc -l)

echo "  Branch: $CURRENT_BRANCH"
echo "  Commit: $CURRENT_COMMIT"
if [ "$UNCOMMITTED" -gt 0 ]; then
  echo -e "  ${YELLOW}Dirty: $UNCOMMITTED uncommitted files${NC}"
else
  echo -e "  ${GREEN}Clean: No uncommitted changes${NC}"
fi
echo ""

# Production status
echo -e "${RED}🔴 Production (salfagpt):${NC}"
PROD_REVISION=$(gcloud run services describe cr-salfagpt-ai-ft-prod \
  --region=us-east4 \
  --project=salfagpt \
  --format='value(status.latestReadyRevisionName)' 2>/dev/null || echo "Error")

PROD_UPDATED=$(gcloud run services describe cr-salfagpt-ai-ft-prod \
  --region=us-east4 \
  --project=salfagpt \
  --format='value(status.conditions[0].lastTransitionTime)' 2>/dev/null | cut -d'T' -f1 || echo "N/A")

PROD_URL="https://salfagpt-3snj65wckq-uc.a.run.app"

echo "  Service: cr-salfagpt-ai-ft-prod"
echo "  Revision: $PROD_REVISION"
echo "  Updated: $PROD_UPDATED"
echo "  URL: $PROD_URL"
echo "  Expected Branch: main"

# Check if main tag exists
PROD_TAG_COMMIT=$(git rev-parse --short prod/current 2>/dev/null || echo "N/A")
if [ "$PROD_TAG_COMMIT" != "N/A" ]; then
  echo "  Tagged Commit: $PROD_TAG_COMMIT (prod/current)"
fi

# Load latest deployment info if exists
if [ -f deployments/production-latest.json ]; then
  PROD_DEPLOY_VERSION=$(cat deployments/production-latest.json | grep version | cut -d'"' -f4)
  PROD_DEPLOY_TIME=$(cat deployments/production-latest.json | grep deployedAt | cut -d'"' -f4)
  echo "  Last Deploy: v$PROD_DEPLOY_VERSION at $PROD_DEPLOY_TIME"
fi

echo ""

# QA status
echo -e "${YELLOW}🟡 QA (salfagpt-qa):${NC}"
QA_REVISION=$(gcloud run services describe cr-salfagpt-qa \
  --region=us-east4 \
  --project=salfagpt-qa \
  --format='value(status.latestReadyRevisionName)' 2>/dev/null || echo "Not deployed")

QA_UPDATED=$(gcloud run services describe cr-salfagpt-qa \
  --region=us-east4 \
  --project=salfagpt-qa \
  --format='value(status.conditions[0].lastTransitionTime)' 2>/dev/null | cut -d'T' -f1 || echo "N/A")

QA_URL=$(gcloud run services describe cr-salfagpt-qa \
  --region=us-east4 \
  --project=salfagpt-qa \
  --format='value(status.url)' 2>/dev/null || echo "Not deployed")

echo "  Service: cr-salfagpt-qa"
echo "  Revision: $QA_REVISION"
echo "  Updated: $QA_UPDATED"
echo "  URL: $QA_URL"
echo "  Expected Branch: develop"

# Check if qa tag exists
QA_TAG_COMMIT=$(git rev-parse --short qa/current 2>/dev/null || echo "N/A")
if [ "$QA_TAG_COMMIT" != "N/A" ]; then
  echo "  Tagged Commit: $QA_TAG_COMMIT (qa/current)"
fi

# Load latest deployment info if exists
if [ -f deployments/qa-latest.json ]; then
  QA_DEPLOY_VERSION=$(cat deployments/qa-latest.json | grep version | cut -d'"' -f4)
  QA_DEPLOY_TIME=$(cat deployments/qa-latest.json | grep deployedAt | cut -d'"' -f4)
  echo "  Last Deploy: v$QA_DEPLOY_VERSION at $QA_DEPLOY_TIME"
fi

echo ""

# Branch comparison
echo "🔀 Branch Comparison:"
git fetch origin --quiet 2>/dev/null

MAIN_COMMIT_FULL=$(git rev-parse --short origin/main 2>/dev/null || git rev-parse --short main 2>/dev/null || echo "N/A")
DEVELOP_COMMIT_FULL=$(git rev-parse --short origin/develop 2>/dev/null || echo "N/A")

echo "  main (prod): $MAIN_COMMIT_FULL"
echo "  develop (QA): $DEVELOP_COMMIT_FULL"

if [ "$MAIN_COMMIT_FULL" != "N/A" ] && [ "$DEVELOP_COMMIT_FULL" != "N/A" ]; then
  AHEAD=$(git rev-list --count origin/main..origin/develop 2>/dev/null || echo "0")
  echo "  → develop is $AHEAD commits ahead of main"
  
  if [ "$AHEAD" -gt 0 ]; then
    echo ""
    echo "  Features in QA not yet in production:"
    git log origin/main..origin/develop --oneline | head -5
  fi
fi

echo ""
echo -e "${GREEN}✅ Status check complete${NC}"

