#!/bin/bash
###############################################################################
# Track Deployment - Records deployment metadata
# 
# Usage: ./scripts/track-deployment.sh <environment>
# Environment: qa or production
#
# Creates:
# - Deployment snapshot (JSON)
# - Git tags (qa/current or prod/current)
# - Updates deployment log
###############################################################################

ENVIRONMENT=$1

if [ -z "$ENVIRONMENT" ]; then
  echo "❌ Usage: $0 <environment>"
  echo "   environment: qa or production"
  exit 1
fi

# Git info
BRANCH=$(git branch --show-current)
COMMIT=$(git rev-parse HEAD)
SHORT_COMMIT=$(git rev-parse --short HEAD)
VERSION=$(cat package.json | grep '"version"' | head -1 | cut -d'"' -f4)
DEPLOYER=$(git config user.email)
DATE=$(date +"%Y-%m-%d %H:%M %Z")
ISO_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Environment-specific config
if [ "$ENVIRONMENT" = "production" ]; then
  PROJECT="salfagpt"
  SERVICE="cr-salfagpt-ai-ft-prod"
  TAG_PREFIX="prod"
elif [ "$ENVIRONMENT" = "qa" ]; then
  PROJECT="salfagpt-qa"
  SERVICE="cr-salfagpt-qa"
  TAG_PREFIX="qa"
else
  echo "❌ Invalid environment: $ENVIRONMENT"
  echo "   Use: qa or production"
  exit 1
fi

# Get service URL
SERVICE_URL=$(gcloud run services describe $SERVICE \
  --region=us-east4 \
  --project=$PROJECT \
  --format='value(status.url)' 2>/dev/null || echo "unknown")

# Create deployments directory if needed
mkdir -p deployments

# Create deployment snapshot
SNAPSHOT_FILE="deployments/${ENVIRONMENT}-$(date +%Y%m%d-%H%M%S).json"

cat > "$SNAPSHOT_FILE" << EOF
{
  "environment": "$ENVIRONMENT",
  "version": "$VERSION",
  "branch": "$BRANCH",
  "commit": "$COMMIT",
  "shortCommit": "$SHORT_COMMIT",
  "deployedAt": "$ISO_DATE",
  "deployedBy": "$DEPLOYER",
  "serviceUrl": "$SERVICE_URL",
  "project": "$PROJECT",
  "service": "$SERVICE",
  "region": "us-east4"
}
EOF

# Also save as "latest"
cp "$SNAPSHOT_FILE" "deployments/${ENVIRONMENT}-latest.json"

# Update git tags
git tag -f "${TAG_PREFIX}/current"
git push origin "${TAG_PREFIX}/current" -f 2>/dev/null || echo "(Git tag updated locally)"

# Append to deployment log
DEPLOYMENT_LOG="deployments/DEPLOYMENT_LOG.md"

if [ ! -f "$DEPLOYMENT_LOG" ]; then
  # Create log if doesn't exist
  cat > "$DEPLOYMENT_LOG" << 'EOFLOG'
# Deployment Log - SalfaGPT

Auto-generated deployment tracking

---

## 🔴 Production Deployments

EOFLOG
fi

# Append deployment entry
{
  echo ""
  echo "### $DATE - v$VERSION"
  echo "- **Environment:** $ENVIRONMENT"
  echo "- **Branch:** \`$BRANCH\`"
  echo "- **Commit:** \`$SHORT_COMMIT\`"
  echo "- **Deployer:** $DEPLOYER"
  echo "- **URL:** $SERVICE_URL"
  echo "- **Service:** $SERVICE"
  echo ""
} >> "$DEPLOYMENT_LOG"

# Console output
echo "📝 Deployment Recorded"
echo "====================="
echo "Environment: $ENVIRONMENT"
echo "Version: v$VERSION"
echo "Branch: $BRANCH"
echo "Commit: $SHORT_COMMIT"
echo "Deployer: $DEPLOYER"
echo "Date: $DATE"
echo "URL: $SERVICE_URL"
echo ""
echo "📄 Snapshot: $SNAPSHOT_FILE"
echo "📋 Log updated: $DEPLOYMENT_LOG"
echo "🏷️  Git tag: ${TAG_PREFIX}/current"
echo ""
echo "✅ Deployment tracked successfully!"

