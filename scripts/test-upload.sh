#!/bin/bash

# Test Upload Script - Quick bash version
# Uploads 1 + 3 PDFs from S001-20251118 for testing

echo "╔════════════════════════════════════════════════════════════════════════════════╗"
echo "║                                                                                ║"
echo "║              TEST UPLOAD - S001-20251118 (1 + 3 Documents)                    ║"
echo "║                                                                                ║"
echo "╚════════════════════════════════════════════════════════════════════════════════╝"
echo ""

# Configuration
API_URL="${API_URL:-http://localhost:3001}"
ORG="salfa-corp"
DOMAIN="maqsa.cl"
MODEL="gemini-2.5-flash"
TAG="S001-20251118"
USER_ID="${USER_ID:-alec@getaifactory.com}"

echo "📋 Configuration:"
echo "   API URL: $API_URL"
echo "   Organization: $ORG"
echo "   Domain: $DOMAIN"
echo "   Model: $MODEL"
echo "   Tag: $TAG"
echo "   User: $USER_ID"
echo ""

# Check if Node.js script exists
if [ -f "scripts/test-upload.js" ]; then
    echo "🚀 Running Node.js test upload script..."
    echo ""
    
    # Check for dependencies
    if ! command -v node &> /dev/null; then
        echo "❌ Error: Node.js is not installed"
        echo "   Please install Node.js from https://nodejs.org/"
        exit 1
    fi
    
    # Check for required npm packages
    if [ ! -d "node_modules/form-data" ] || [ ! -d "node_modules/axios" ]; then
        echo "📦 Installing dependencies..."
        npm install form-data axios
        echo ""
    fi
    
    # Run the Node.js script
    API_URL="$API_URL" USER_ID="$USER_ID" node scripts/test-upload.js
    
    exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        echo ""
        echo "✅ Test upload completed successfully!"
        echo ""
        echo "📊 Next steps:"
        echo "   1. Check test-upload-results.json for detailed results"
        echo "   2. Run test queries in the chat interface"
        echo "   3. If successful, process remaining 65 files"
        echo ""
    else
        echo ""
        echo "❌ Test upload failed with exit code: $exit_code"
        echo "   Check the error messages above for details"
        echo ""
        exit $exit_code
    fi
else
    echo "❌ Error: test-upload.js not found in scripts/ directory"
    exit 1
fi

