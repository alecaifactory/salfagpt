#!/bin/bash

###############################################################################
# SalfaGPT CLI - Batch Document Upload
# 
# Example script to upload documents from a folder to an agent
# 
# Created: 2025-11-18
# Version: 0.2.0
###############################################################################

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         SalfaGPT CLI - Batch Document Upload                  ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Example configuration - MODIFY THESE VALUES
FOLDER_PATH="/Users/alec/salfagpt/upload-queue/salfacorp/S001-20251118"
TAG="S001-20251118-1545"
AGENT_ID="TestApiUpload_S001"
USER_ID="114671162830729001607"
USER_EMAIL="alec@getaifactory.com"
MODEL="gemini-2.5-flash"
TEST_QUERY="¿Cuáles son los requisitos de seguridad?"

# Print configuration
echo -e "${YELLOW}📋 Configuration:${NC}"
echo -e "   📁 Folder: ${FOLDER_PATH}"
echo -e "   🏷️  Tag: ${TAG}"
echo -e "   🤖 Agent: ${AGENT_ID}"
echo -e "   👤 User: ${USER_ID}"
echo -e "   📧 Email: ${USER_EMAIL}"
echo -e "   ⚡ Model: ${MODEL}"
echo -e "   🔍 Test: ${TEST_QUERY}"
echo ""

# Check if folder exists
if [ ! -d "$FOLDER_PATH" ]; then
    echo -e "${RED}❌ Error: Folder not found: ${FOLDER_PATH}${NC}"
    echo ""
    echo -e "${YELLOW}💡 Please edit this script and set FOLDER_PATH to a valid directory${NC}"
    exit 1
fi

# Count PDFs
PDF_COUNT=$(find "$FOLDER_PATH" -maxdepth 1 -name "*.pdf" | wc -l | tr -d ' ')

if [ "$PDF_COUNT" -eq 0 ]; then
    echo -e "${RED}❌ Error: No PDF files found in folder${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Found ${PDF_COUNT} PDF files${NC}"
echo ""

# Confirm before proceeding
echo -e "${YELLOW}⚠️  This will:${NC}"
echo "   1. Upload ${PDF_COUNT} PDF files to Cloud Storage"
echo "   2. Extract text with Gemini AI"
echo "   3. Create embeddings for RAG search"
echo "   4. Assign to agent: ${AGENT_ID}"
echo ""
echo -e "${YELLOW}Estimated cost: ~$$(echo \"${PDF_COUNT} * 0.011\" | bc) USD${NC}"
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Cancelled by user${NC}"
    exit 0
fi

echo ""
echo -e "${GREEN}🚀 Starting upload...${NC}"
echo ""

# Run the upload command
npx tsx cli/commands/upload.ts \
  --folder="$FOLDER_PATH" \
  --tag="$TAG" \
  --agent="$AGENT_ID" \
  --user="$USER_ID" \
  --email="$USER_EMAIL" \
  --model="$MODEL" \
  --test="$TEST_QUERY"

# Check exit code
EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ Upload completed successfully!${NC}"
else
    echo -e "${RED}❌ Upload failed with exit code: ${EXIT_CODE}${NC}"
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

exit $EXIT_CODE

