#!/bin/bash

# ============================================================================
# AI Estimator - Quick Start Script
# ============================================================================

set -e

echo "🤖 AI Estimator - Quick Start"
echo "=============================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"
echo ""

# Navigate to package directory
cd "$(dirname "$0")"

echo "📦 Installing dependencies..."
npm install

echo ""
echo "🔨 Building TypeScript..."
npm run build

echo ""
echo "✅ Build complete!"
echo ""

# Make CLI executable
chmod +x bin/cli.js

echo "🚀 Quick Start Commands:"
echo ""
echo "  Local CLI:"
echo "    ./bin/cli.js estimate"
echo "    ./bin/cli.js --help"
echo ""
echo "  Install globally:"
echo "    npm install -g ."
echo "    ai-estimate estimate"
echo ""
echo "  Run MCP server:"
echo "    npm run start:mcp"
echo ""
echo "  Use as SDK:"
echo "    import { estimateProject } from '@salfagpt/ai-estimator';"
echo ""

# Run example if requested
if [ "$1" == "--example" ]; then
    echo "🎯 Running example..."
    echo ""
    node dist/examples/quick-start.js
fi

echo "📚 Full documentation: README.md"
echo ""
echo "🎉 Ready to use!"


