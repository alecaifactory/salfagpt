#!/bin/bash
###############################################################################
# Upload Documents for M3-v2 Agent (GOP GPT) - REPLACE MODE
# 
# Purpose: Replace ALL existing documents with new Portal Edificación PDFs
# 
# Strategy:
#   1. Delete all current documents assigned to M3-v2
#   2. Upload all 62 new PDFs from queue
#   3. Process with optimized chunking (512 tokens, 10% overlap)
#   4. Assign all to M3-v2 agent
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
echo -e "${BLUE}   M3-v2 (GOP GPT) - REPLACE MODE Document Upload${NC}"
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

# Check current documents
echo -e "${YELLOW}📚 Checking current M3-v2 documents...${NC}"
CURRENT_DOCS=$(curl -s "https://firestore.googleapis.com/v1/projects/salfagpt/databases/(default)/documents/context_sources?pageSize=500" \
  -H "Authorization: Bearer $(gcloud auth application-default print-access-token)" | \
  python3 -c "
import sys, json
data = json.load(sys.stdin)
docs = data.get('documents', [])
count = 0
for doc in docs:
    fields = doc.get('fields', {})
    assigned = fields.get('assignedToAgents', {}).get('arrayValue', {}).get('values', [])
    assigned_ids = [v.get('stringValue', '') for v in assigned]
    if 'vStojK73ZKbjNsEnqANJ' in assigned_ids:
        count += 1
print(count)
")

echo -e "${YELLOW}   Current documents: $CURRENT_DOCS${NC}"
echo ""

# Display configuration
echo -e "${BLUE}📋 Configuration:${NC}"
echo "   🤖 Agent: M3-v2 (GOP GPT)"
echo "   🆔 Agent ID: $AGENT_ID"
echo "   👤 Owner: $USER_EMAIL"
echo "   📁 Folder: M3-v2-20251125"
echo "   📝 New files: $PDF_COUNT PDFs"
echo "   🗑️  Will delete: $CURRENT_DOCS existing documents"
echo "   🏷️  Tag: $TAG"
echo "   ⚡ Model: $MODEL"
echo "   📐 Chunking: 512 tokens, 10% overlap (51 tokens)"
echo "   📦 Batch size: 32 chunks"
echo ""

# Confirm execution
echo -e "${RED}⚠️  REPLACE MODE - This will:${NC}"
echo "   1. DELETE all $CURRENT_DOCS existing documents from M3-v2"
echo "   2. DELETE all associated chunks and embeddings"
echo "   3. UPLOAD $PDF_COUNT new PDFs"
echo "   4. CREATE new chunks with 10% overlap"
echo "   5. GENERATE new embeddings (batch size 32)"
echo "   6. INDEX in BigQuery us-east4"
echo ""
echo "   Estimated time: 40-70 minutes"
echo "   Estimated cost: ~\$0.03-0.35"
echo ""

read -p "$(echo -e ${RED}Type YES to confirm REPLACE operation: ${NC})" -r
echo
if [[ ! $REPLY == "YES" ]]; then
  echo -e "${RED}❌ Aborted - must type YES to confirm${NC}"
  exit 1
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}🗑️  Step 1: Deleting existing M3-v2 documents...${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Delete existing documents for M3-v2
npx tsx -e "
import { firestore } from './src/lib/firestore.js';

async function deleteExisting() {
  const agentId = 'vStojK73ZKbjNsEnqANJ';
  
  console.log('🔍 Finding documents assigned to M3-v2...');
  
  // Get all documents assigned to this agent
  const sourcesSnapshot = await firestore
    .collection('context_sources')
    .where('assignedToAgents', 'array-contains', agentId)
    .get();
  
  console.log(\`   Found \${sourcesSnapshot.size} documents to delete\`);
  
  if (sourcesSnapshot.size === 0) {
    console.log('   ℹ️  No documents to delete');
    process.exit(0);
  }
  
  // Get all chunk IDs for these sources
  console.log('\\n🔍 Finding associated chunks...');
  const sourceIds = sourcesSnapshot.docs.map(doc => doc.id);
  const allChunkIds = [];
  
  for (const sourceId of sourceIds) {
    const chunksSnapshot = await firestore
      .collection('document_chunks')
      .where('sourceId', '==', sourceId)
      .get();
    
    chunksSnapshot.docs.forEach(doc => allChunkIds.push(doc.id));
  }
  
  console.log(\`   Found \${allChunkIds.length} chunks to delete\`);
  
  // Delete in batches (Firestore limit: 500 operations per batch)
  console.log('\\n🗑️  Deleting chunks...');
  const chunkBatches = [];
  for (let i = 0; i < allChunkIds.length; i += 500) {
    chunkBatches.push(allChunkIds.slice(i, i + 500));
  }
  
  for (let i = 0; i < chunkBatches.length; i++) {
    const batch = firestore.batch();
    const chunkBatch = chunkBatches[i];
    
    chunkBatch.forEach(chunkId => {
      batch.delete(firestore.collection('document_chunks').doc(chunkId));
    });
    
    await batch.commit();
    console.log(\`   ✅ Deleted batch \${i + 1}/\${chunkBatches.length} (\${chunkBatch.length} chunks)\`);
  }
  
  // Delete source documents
  console.log('\\n🗑️  Deleting source documents...');
  const sourceBatches = [];
  for (let i = 0; i < sourcesSnapshot.docs.length; i += 500) {
    sourceBatches.push(sourcesSnapshot.docs.slice(i, i + 500));
  }
  
  for (let i = 0; i < sourceBatches.length; i++) {
    const batch = firestore.batch();
    const sourceBatch = sourceBatches[i];
    
    sourceBatch.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log(\`   ✅ Deleted batch \${i + 1}/\${sourceBatches.length} (\${sourceBatch.length} documents)\`);
  }
  
  console.log(\`\\n✅ Deletion complete: \${sourcesSnapshot.size} documents + \${allChunkIds.length} chunks deleted\`);
  console.log('   ℹ️  Note: BigQuery embeddings will be cleaned up separately if needed\\n');
  
  process.exit(0);
}

deleteExisting().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
"

DELETE_EXIT_CODE=$?

if [ $DELETE_EXIT_CODE -ne 0 ]; then
  echo -e "${RED}❌ Deletion failed - aborting upload${NC}"
  exit 1
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}🚀 Step 2: Uploading new documents...${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Execute upload WITHOUT --skip-existing (upload all)
npx tsx cli/commands/upload.ts \
  --folder="$FOLDER_PATH" \
  --tag="$TAG" \
  --agent="$AGENT_ID" \
  --user="$USER_ID" \
  --email="$USER_EMAIL" \
  --model="$MODEL"

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
  echo -e "${YELLOW}🔍 Comando de verificación:${NC}"
  echo "   ./verify-m3v2-after-upload.sh"
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


