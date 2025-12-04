#!/bin/bash
###############################################################################
# Execute M3-v2 Upload - NON-INTERACTIVE
# 
# Purpose: Upload Portal Edificación documents to M3-v2 (auto-confirmed)
# Mode: Replace existing documents with new ones
#
# Created: 2025-11-25
###############################################################################

set -e

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

AGENT_ID="vStojK73ZKbjNsEnqANJ"
USER_ID="usr_uhwqffaqag1wrryd82tw"
USER_EMAIL="alec@getaifactory.com"
FOLDER_PATH="/Users/alec/salfagpt/upload-queue/M3-v2-20251125"
TAG="M3-v2-20251125"
MODEL="gemini-2.5-flash"

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   M3-v2 Document Upload - AUTO-EXECUTE${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Configuration
echo -e "${YELLOW}📋 Configuration:${NC}"
echo "   🤖 Agent: M3-v2 (GOP GPT)"  
echo "   🆔 Agent ID: $AGENT_ID"
echo "   👤 Owner: $USER_EMAIL"
echo "   📁 Source: M3-v2-20251125/"
echo "   📝 Files: 62 PDFs"
echo "   🏷️  Tag: $TAG"
echo "   📐 Chunking: 512 tokens, 10% overlap (51 tokens)"
echo "   📦 Batch: 32 chunks (optimized)"
echo ""

# Step 1: Clean existing
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}🗑️  Step 1: Cleaning existing M3-v2 documents...${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

npx tsx -e "
import { firestore } from './src/lib/firestore.js';

async function clean() {
  const agentId = 'vStojK73ZKbjNsEnqANJ';
  
  console.log('🔍 Finding documents for M3-v2...');
  const sources = await firestore
    .collection('context_sources')
    .where('assignedToAgents', 'array-contains', agentId)
    .get();
  
  console.log(\`   Found: \${sources.size} documents\`);
  
  if (sources.size === 0) {
    console.log('   ℹ️  No documents to delete\\n');
    process.exit(0);
  }
  
  // Get chunk count
  const sourceIds = sources.docs.map(d => d.id);
  let totalChunks = 0;
  
  for (const sourceId of sourceIds) {
    const chunks = await firestore
      .collection('document_chunks')
      .where('sourceId', '==', sourceId)
      .get();
    totalChunks += chunks.size;
  }
  
  console.log(\`   Found: \${totalChunks} chunks\\n\`);
  console.log('🗑️  Deleting...');
  
  // Delete chunks first
  for (const sourceId of sourceIds) {
    const chunks = await firestore
      .collection('document_chunks')
      .where('sourceId', '==', sourceId)
      .get();
    
    const batch = firestore.batch();
    chunks.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  }
  
  console.log(\`   ✅ Deleted \${totalChunks} chunks\`);
  
  // Delete sources
  const batch = firestore.batch();
  sources.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
  
  console.log(\`   ✅ Deleted \${sources.size} documents\\n\`);
  process.exit(0);
}

clean().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
"

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Cleanup failed - aborting${NC}"
  exit 1
fi

# Step 2: Upload new documents
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}📤 Step 2: Uploading 62 new PDFs...${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo "⏳ Processing with optimized configuration:"
echo "   • Chunk size: 512 tokens"
echo "   • Overlap: 51 tokens (10%)"
echo "   • Batch size: 32 chunks"
echo "   • Embedding: text-embedding-004 (768 dims)"
echo ""
echo "⏰ Estimated time: 40-70 minutes"
echo "💰 Estimated cost: ~\$0.03-0.35"
echo ""

# Execute upload
npx tsx cli/commands/upload.ts \
  --folder="$FOLDER_PATH" \
  --tag="$TAG" \
  --agent="$AGENT_ID" \
  --user="$USER_ID" \
  --email="$USER_EMAIL" \
  --model="$MODEL"

UPLOAD_EXIT=$?

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

if [ $UPLOAD_EXIT -eq 0 ]; then
  echo -e "${GREEN}✅ UPLOAD COMPLETE!${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
  echo ""
  echo -e "${YELLOW}📊 Next steps:${NC}"
  echo "   1. Run verification: ./verify-m3v2-after-upload.sh"
  echo "   2. Test in UI: Open M3-v2 agent"
  echo "   3. Test search: Ask a question about procedures"
  echo ""
  exit 0
else
  echo -e "${RED}❌ UPLOAD FAILED${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
  echo ""
  echo -e "${YELLOW}Check errors above${NC}"
  exit 1
fi


