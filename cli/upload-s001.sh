#!/bin/bash

###############################################################################
# Upload S001 Documents - Example from User Request
# 
# This script uploads documents from the S001-20251118 folder
# with tag S001-20251118-1545 to agent TestApiUpload_S001
# 
# Created: 2025-11-18
# Based on user request: https://chat.salfagpt.local/...
###############################################################################

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       SalfaGPT CLI - Upload S001 Documents                    ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Configuration (from user request)
FOLDER="/Users/alec/salfagpt/upload-queue/salfacorp/S001-20251118"
TAG="S001-20251118-1545"
AGENT="TestApiUpload_S001"
USER_ID="usr_uhwqffaqag1wrryd82tw"  # Hash ID (primary)
GOOGLE_USER_ID="114671162830729001607"  # Google OAuth numeric ID (optional, for reference)
USER_EMAIL="alec@getaifactory.com"
MODEL="gemini-2.5-flash"
TEST_QUERY="¿Cuáles son los requisitos de seguridad?"

echo -e "${YELLOW}📋 Configuration:${NC}"
echo "   📁 Folder: ${FOLDER}"
echo "   🏷️  Tag: ${TAG}"
echo "   🤖 Agent: ${AGENT}"
echo "   👤 User: ${USER_ID}"
echo "   📧 Email: ${USER_EMAIL}"
echo "   ⚡ Model: ${MODEL}"
echo "   🔍 Test: ${TEST_QUERY}"
echo ""

# Check folder exists
if [ ! -d "$FOLDER" ]; then
    echo -e "${YELLOW}⚠️  Folder not found: ${FOLDER}${NC}"
    echo ""
    echo "Creating test folder..."
    mkdir -p "$FOLDER"
    echo ""
    echo "Please add PDF files to: ${FOLDER}"
    echo "Then run this script again."
    echo ""
    exit 1
fi

# Count PDFs
PDF_COUNT=$(find "$FOLDER" -maxdepth 1 -name "*.pdf" 2>/dev/null | wc -l | tr -d ' ')

if [ "$PDF_COUNT" -eq 0 ]; then
    echo -e "${YELLOW}⚠️  No PDF files found in folder${NC}"
    echo ""
    echo "Please add PDF files to: ${FOLDER}"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Found ${PDF_COUNT} PDF files${NC}"
echo ""

# Show files
echo "📄 Files to upload:"
find "$FOLDER" -maxdepth 1 -name "*.pdf" -exec basename {} \; | sort | sed 's/^/   /'
echo ""

# Estimate cost
ESTIMATED_COST=$(echo "$PDF_COUNT * 0.011" | bc)
echo -e "${YELLOW}💰 Estimated cost: ~\$${ESTIMATED_COST} USD${NC}"
echo ""

# Confirm
read -p "Continue with upload? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo -e "${GREEN}🚀 Starting upload...${NC}"
echo ""

# Run upload command
npx tsx cli/commands/upload.ts \
  --folder="$FOLDER" \
  --tag="$TAG" \
  --agent="$AGENT" \
  --user="$USER_ID" \
  --google-user="$GOOGLE_USER_ID" \
  --email="$USER_EMAIL" \
  --model="$MODEL" \
  --test="$TEST_QUERY"

EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ Upload completed successfully!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Open SalfaGPT UI"
    echo "2. Navigate to agent: ${AGENT}"
    echo "3. Click 'Fuentes de Contexto' (📚 icon)"
    echo "4. Verify ${PDF_COUNT} documents with tag: ${TAG}"
    echo "5. Start chatting and ask about the documents!"
else
    echo -e "${YELLOW}⚠️  Upload completed with errors (exit code: ${EXIT_CODE})${NC}"
    echo ""
    echo "Check the output above for details on failed files."
fi

echo ""

