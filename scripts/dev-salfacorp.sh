#!/bin/bash
# Start Salfacorp development server on port 3001

echo "🚀 Starting Salfacorp Development Server"
echo "========================================"
echo ""

# Check if .env.salfacorp exists
if [ ! -f .env.salfacorp ]; then
  echo "❌ Error: .env.salfacorp file not found"
  echo "   Create .env.salfacorp with Salfacorp credentials"
  exit 1
fi

# Load Salfacorp environment
export $(cat .env.salfacorp | grep -v "^#" | grep -v "^$" | sed 's/ //g' | xargs)

echo "✅ Configuration loaded:"
echo "   Project: $GOOGLE_CLOUD_PROJECT"
echo "   Port: $DEV_PORT"
echo ""

# Start dev server
npm run dev

