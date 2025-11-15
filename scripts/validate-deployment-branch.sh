#!/bin/bash
###############################################################################
# Validate Deployment Branch
# 
# Ensures correct branch is deployed to correct environment
# 
# Rules:
# - QA: Should be from develop (warns if not)
# - Production: MUST be from main (blocks if not)
#
# Usage: ./scripts/validate-deployment-branch.sh <environment>
###############################################################################

ENVIRONMENT=$1
CURRENT_BRANCH=$(git branch --show-current)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [ -z "$ENVIRONMENT" ]; then
  echo "❌ Usage: $0 <environment>"
  echo "   environment: qa or production"
  exit 1
fi

echo "🔍 Validating deployment branch..."
echo "  Environment: $ENVIRONMENT"
echo "  Current Branch: $CURRENT_BRANCH"
echo ""

# Validation rules
case $ENVIRONMENT in
  qa|staging)
    if [ "$CURRENT_BRANCH" != "develop" ]; then
      echo -e "${YELLOW}⚠️  WARNING: Deploying to QA from non-develop branch${NC}"
      echo "  Expected: develop"
      echo "  Actual: $CURRENT_BRANCH"
      echo ""
      echo "  Best practice: Merge to develop first, then deploy"
      echo ""
      read -p "Continue anyway? (yes/no) " CONFIRM
      if [ "$CONFIRM" != "yes" ]; then
        echo "❌ Deployment cancelled"
        exit 1
      fi
    else
      echo -e "${GREEN}✅ Branch validation passed (on develop)${NC}"
    fi
    ;;
    
  production)
    if [ "$CURRENT_BRANCH" != "main" ]; then
      echo -e "${RED}🚨 ERROR: Cannot deploy to production from non-main branch${NC}"
      echo ""
      echo "  Current branch: $CURRENT_BRANCH"
      echo "  Required branch: main"
      echo ""
      echo "You MUST merge to main first:"
      echo "  1. git checkout main"
      echo "  2. git pull origin main"
      echo "  3. git merge --no-ff $CURRENT_BRANCH"
      echo "  4. git push origin main"
      echo "  5. Then run this script again"
      echo ""
      exit 1
    else
      echo -e "${GREEN}✅ Branch validation passed (on main)${NC}"
    fi
    ;;
    
  *)
    echo -e "${RED}❌ Invalid environment: $ENVIRONMENT${NC}"
    echo "   Use: qa or production"
    exit 1
    ;;
esac

echo ""

