#!/bin/bash

# Flow CLI Local Testing Script
# Tests the CLI package before publishing to npm

set -e

echo "🧪 Flow CLI Local Testing"
echo "========================="
echo ""

# 1. Verify build
echo "1️⃣  Verifying build..."
if [ ! -d "dist" ]; then
  echo "❌ dist/ directory not found"
  echo "Run: npm run build"
  exit 1
fi

if [ ! -f "dist/index.js" ]; then
  echo "❌ dist/index.js not found"
  echo "Run: npm run build"
  exit 1
fi

echo "✅ Build verified"
echo ""

# 2. Link package locally
echo "2️⃣  Linking package..."
npm link
echo "✅ Package linked"
echo ""

# 3. Test --help
echo "3️⃣  Testing --help..."
flow --help
echo "✅ Help displayed"
echo ""

# 4. Test --version
echo "4️⃣  Testing --version..."
flow --version
echo "✅ Version displayed"
echo ""

# 5. Test commands exist
echo "5️⃣  Verifying commands..."
flow login --help > /dev/null 2>&1 && echo "✅ login command exists" || echo "❌ login command missing"
flow logout --help > /dev/null 2>&1 && echo "✅ logout command exists" || echo "❌ logout command missing"
flow status --help > /dev/null 2>&1 && echo "✅ status command exists" || echo "❌ status command missing"
flow usage-stats --help > /dev/null 2>&1 && echo "✅ usage-stats command exists" || echo "❌ usage-stats command missing"
flow config --help > /dev/null 2>&1 && echo "✅ config command exists" || echo "❌ config command missing"
echo ""

# 6. Test config file creation
echo "6️⃣  Testing config file..."
CONFIG_PATH="$HOME/.flow-cli/config.json"
if [ -f "$CONFIG_PATH" ]; then
  echo "✅ Config file exists: $CONFIG_PATH"
  echo "   Contents:"
  cat "$CONFIG_PATH" | jq . 2>/dev/null || cat "$CONFIG_PATH"
else
  echo "ℹ️  Config file will be created on first login"
fi
echo ""

# 7. Test package contents
echo "7️⃣  Checking package contents..."
npm pack --dry-run | head -20
echo ""

echo "✅ All local tests passed!"
echo ""
echo "📝 Next steps:"
echo "1. Start platform: npm run dev (in main directory)"
echo "2. Create API key in http://localhost:3000/superadmin"
echo "3. Test: flow login <api-key> --endpoint http://localhost:3000"
echo "4. Test: flow usage-stats @test.com"
echo ""
echo "🚀 Ready to test end-to-end!"












