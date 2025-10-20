#!/bin/bash
# Start AI Factory development server on port 3000

echo "🚀 Starting AI Factory Development Server"
echo "=========================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
  echo "❌ Error: .env file not found for AI Factory"
  echo "   Create .env with AI Factory credentials"
  exit 1
fi

# Load AI Factory environment
export $(cat .env | grep -v "^#" | grep -v "^$" | xargs)

echo "✅ Configuration loaded:"
echo "   Project: $GOOGLE_CLOUD_PROJECT"
echo "   Port: ${DEV_PORT:-3000}"
echo ""

# Start dev server
npm run dev

