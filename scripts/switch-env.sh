#!/bin/bash
# Environment Switcher for SalfaGPT
# Usage: ./scripts/switch-env.sh [salfacorp|aifactory]

set -e

if [ "$1" != "salfacorp" ] && [ "$1" != "aifactory" ]; then
  echo "❌ Error: Invalid environment"
  echo ""
  echo "Usage: $0 [salfacorp|aifactory]"
  echo ""
  echo "Available environments:"
  echo "  salfacorp  - Salfacorp client environment (salfagpt)"
  echo "  aifactory  - AIFactory development environment (gen-lang-client-0986191192)"
  exit 1
fi

PROJECT_UPPER=$(echo "$1" | tr '[:lower:]' '[:upper:]')
ENV_FILE=".env.$1"

# Check if env file exists
if [ ! -f "$ENV_FILE" ]; then
  echo "❌ Error: $ENV_FILE not found"
  exit 1
fi

echo "🔄 Switching to $PROJECT_UPPER environment..."
echo ""

# Stop dev server if running
echo "1️⃣ Stopping dev server (if running)..."
pkill -f "astro dev" 2>/dev/null || echo "   No dev server running"

# Copy environment file
echo "2️⃣ Copying $ENV_FILE to .env..."
cp "$ENV_FILE" .env

# Update project identifier
echo "3️⃣ Updating .env.project..."
echo "CURRENT_PROJECT=$PROJECT_UPPER" > .env.project

# Set gcloud project
echo "4️⃣ Setting gcloud project..."
if [ "$1" = "salfacorp" ]; then
  gcloud config set project salfagpt
  GCP_PROJECT="salfagpt"
elif [ "$1" = "aifactory" ]; then
  gcloud config set project gen-lang-client-0986191192
  GCP_PROJECT="gen-lang-client-0986191192"
fi

echo ""
echo "✅ Environment switched successfully!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Current Configuration:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat .env.project
echo ""
grep GOOGLE_CLOUD_PROJECT .env
echo "gcloud project: $(gcloud config get-value project)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  IMPORTANT: Restart your dev server"
echo "   Run: npm run dev"
echo ""
