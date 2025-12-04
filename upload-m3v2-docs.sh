#!/bin/bash
###############################################################################
# Upload Documents for M3-v2 Agent (GOP GPT)
# 
# Purpose: Batch upload PDFs from Portal Edificación to M3-v2 agent
# 
# Process:
#   1. Upload PDFs to GCS (us-east4)
#   2. Extract content with Gemini
#   3. Save metadata to Firestore (us-central1)
#   4. Chunk & embed for RAG
#   5. Index in BigQuery (us-east4)
#   6. Assign to agent
#
# Created: 2025-11-25
###############################################################################

set -e  # Exit on error

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
AGENT_ID="vStojK73ZKbjNsEnqANJ"
USER_ID="usr_uhwqffaqag1wrryd82tw"
USER_EMAIL="alec@getaifactory.com"
FOLDER_PATH="/Users/alec/salfagpt/upload-queue/M3-v2-20251125"
TAG="M3-v2-20251125"
MODEL="gemini-2.5-flash"

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   M3-v2 (GOP GPT) - Document Upload${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Verify prerequisites
echo -e "${YELLOW}🔍 Verificando prerequisitos...${NC}"
echo ""

# Check gcloud auth
if ! gcloud auth application-default print-access-token > /dev/null 2>&1; then
  echo -e "${RED}❌ Error: gcloud auth not configured${NC}"
  echo -e "${YELLOW}   Run: gcloud auth application-default login${NC}"
  exit 1
fi
echo -e "${GREEN}✅ gcloud authentication OK${NC}"

# Check project
CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null)
if [ "$CURRENT_PROJECT" != "salfagpt" ]; then
  echo -e "${RED}❌ Error: Wrong project (current: $CURRENT_PROJECT, expected: salfagpt)${NC}"
  echo -e "${YELLOW}   Run: gcloud config set project salfagpt${NC}"
  exit 1
fi
echo -e "${GREEN}✅ GCP Project: salfagpt${NC}"

# Check folder exists
if [ ! -d "$FOLDER_PATH" ]; then
  echo -e "${RED}❌ Error: Folder not found: $FOLDER_PATH${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Upload folder found${NC}"

# Count PDFs
PDF_COUNT=$(find "$FOLDER_PATH" -name "*.PDF" -o -name "*.pdf" | wc -l | tr -d ' ')
echo -e "${GREEN}✅ Found $PDF_COUNT PDF files${NC}"
echo ""

# Display configuration
echo -e "${BLUE}📋 Configuration:${NC}"
echo "   🤖 Agent: M3-v2 (GOP GPT)"
echo "   🆔 Agent ID: $AGENT_ID"
echo "   👤 Owner: $USER_EMAIL"
echo "   🔑 User ID: $USER_ID"
echo "   📁 Folder: $FOLDER_PATH"
echo "   📝 Files: $PDF_COUNT PDFs"
echo "   🏷️  Tag: $TAG"
echo "   ⚡ Model: $MODEL"
echo ""

# Confirm execution
echo -e "${YELLOW}⚠️  This will:${NC}"
echo "   • Upload $PDF_COUNT documents to GCS (us-east4)"
echo "   • Extract with Gemini AI (~\$0.07-0.34)"
echo "   • Create ~310-620 chunks"
echo "   • Generate ~310-620 embeddings"
echo "   • Index in BigQuery (us-east4)"
echo "   • Assign all to M3-v2 agent"
echo "   • Time estimate: 40-70 minutes"
echo ""

read -p "$(echo -e ${YELLOW}Continue? [y/N]: ${NC})" -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${RED}❌ Aborted by user${NC}"
  exit 1
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}🚀 Starting upload...${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Execute upload
npx tsx cli/commands/upload.ts \
  --folder="$FOLDER_PATH" \
  --tag="$TAG" \
  --agent="$AGENT_ID" \
  --user="$USER_ID" \
  --email="$USER_EMAIL" \
  --model="$MODEL" \
  --skip-existing

UPLOAD_EXIT_CODE=$?

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

if [ $UPLOAD_EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}✅ Upload completado exitosamente!${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
  echo ""
  echo -e "${YELLOW}📊 Próximos pasos:${NC}"
  echo "   1. Verificar documentos en Firestore"
  echo "   2. Probar búsqueda RAG con M3-v2"
  echo "   3. Validar que UI muestra todos los documentos"
  echo ""
  echo -e "${YELLOW}🔍 Comandos de verificación:${NC}"
  echo "   # Ver documentos en Firestore"
  echo "   node check-m3v2-docs.mjs"
  echo ""
  echo "   # Probar búsqueda"
  echo "   curl -X POST https://cr-salfagpt-ai-ft-prod-861710357796.us-east4.run.app/api/agents/$AGENT_ID/search \\"
  echo "     -H 'Content-Type: application/json' \\"
  echo "     -d '{\"query\": \"¿Cuál es el procedimiento de gestión de construcción?\"}'"
  echo ""
else
  echo -e "${RED}❌ Upload falló (código de salida: $UPLOAD_EXIT_CODE)${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
  echo ""
  echo -e "${YELLOW}🔍 Revisar errores arriba${NC}"
  echo ""
  exit 1
fi

exit 0


