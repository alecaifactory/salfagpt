#!/bin/bash
###############################################################################
# Verify M3-v2 Upload Success
# 
# Purpose: Check that all documents were uploaded and indexed correctly
# Run this after upload completes
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
EXPECTED_DOCS=63  # 1 existing + 62 new

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   M3-v2 Upload Verification${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# 1. Check Firestore documents
echo -e "${YELLOW}1️⃣  Checking Firestore documents...${NC}"
FIRESTORE_COUNT=$(curl -s "https://firestore.googleapis.com/v1/projects/salfagpt/databases/(default)/documents/context_sources?pageSize=500" \
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

echo -e "   Firestore documents: ${FIRESTORE_COUNT}"
if [ "$FIRESTORE_COUNT" -ge "$EXPECTED_DOCS" ]; then
  echo -e "   ${GREEN}✅ Expected ${EXPECTED_DOCS}+, found ${FIRESTORE_COUNT}${NC}"
else
  echo -e "   ${YELLOW}⚠️  Expected ${EXPECTED_DOCS}, found ${FIRESTORE_COUNT}${NC}"
fi
echo ""

# 2. Check BigQuery chunks
echo -e "${YELLOW}2️⃣  Checking BigQuery embeddings...${NC}"

# Try flow_analytics_east4 first
BQ_COUNT_EAST4=$(bq query --use_legacy_sql=false --format=csv --project_id=salfagpt \
  "SELECT COUNT(DISTINCT chunk_id) as count FROM \`salfagpt.flow_analytics_east4.document_embeddings\` WHERE user_id = 'usr_uhwqffaqag1wrryd82tw'" 2>/dev/null | tail -1 || echo "0")

# Try flow_rag_optimized as fallback
BQ_COUNT_RAG=$(bq query --use_legacy_sql=false --format=csv --project_id=salfagpt \
  "SELECT COUNT(DISTINCT chunk_id) as count FROM \`salfagpt.flow_rag_optimized.document_chunks_vectorized\` WHERE user_id = 'usr_uhwqffaqag1wrryd82tw'" 2>/dev/null | tail -1 || echo "0")

echo -e "   BigQuery chunks (flow_analytics_east4): ${BQ_COUNT_EAST4}"
echo -e "   BigQuery chunks (flow_rag_optimized): ${BQ_COUNT_RAG}"

TOTAL_BQ=$((BQ_COUNT_EAST4 + BQ_COUNT_RAG))
if [ "$TOTAL_BQ" -gt 300 ]; then
  echo -e "   ${GREEN}✅ Expected 310-620 chunks, found ${TOTAL_BQ}${NC}"
else
  echo -e "   ${YELLOW}⚠️  Expected 310-620 chunks, found ${TOTAL_BQ}${NC}"
fi
echo ""

# 3. Check GCS files
echo -e "${YELLOW}3️⃣  Checking GCS storage...${NC}"
GCS_COUNT=$(gsutil ls -r gs://salfagpt-context-documents/usr_uhwqffaqag1wrryd82tw/vStojK73ZKbjNsEnqANJ/ 2>/dev/null | grep -c "\.pdf$" || echo "0")

echo -e "   GCS PDF files: ${GCS_COUNT}"
if [ "$GCS_COUNT" -ge 62 ]; then
  echo -e "   ${GREEN}✅ Expected 62+, found ${GCS_COUNT}${NC}"
else
  echo -e "   ${YELLOW}⚠️  Expected 62, found ${GCS_COUNT}${NC}"
fi
echo ""

# 4. Test RAG search
echo -e "${YELLOW}4️⃣  Testing RAG search...${NC}"
echo "   Running test query: '¿Cuál es el procedimiento de gestión de construcción?'"

SEARCH_RESULT=$(curl -s -X POST "http://localhost:3000/api/agents/${AGENT_ID}/search" \
  -H "Content-Type: application/json" \
  -d '{"query": "¿Cuál es el procedimiento de gestión de construcción?"}' 2>/dev/null || echo '{"results":[]}')

RESULT_COUNT=$(echo "$SEARCH_RESULT" | python3 -c "import sys, json; data = json.load(sys.stdin); print(len(data.get('results', [])))" 2>/dev/null || echo "0")

echo -e "   Search results found: ${RESULT_COUNT}"
if [ "$RESULT_COUNT" -ge 3 ]; then
  echo -e "   ${GREEN}✅ RAG search working (${RESULT_COUNT} chunks)${NC}"
else
  echo -e "   ${YELLOW}⚠️  Expected 3+ results, found ${RESULT_COUNT}${NC}"
  echo -e "   ${YELLOW}   (Server may not be running on localhost:3000)${NC}"
fi
echo ""

# Summary
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}📊 VERIFICATION SUMMARY${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo "   Firestore documents: ${FIRESTORE_COUNT} / ${EXPECTED_DOCS} expected"
echo "   BigQuery chunks: ${TOTAL_BQ} / 310-620 expected"
echo "   GCS files: ${GCS_COUNT} / 62 expected"
echo "   RAG search: ${RESULT_COUNT} results"
echo ""

# Overall status
ALL_GOOD=1
if [ "$FIRESTORE_COUNT" -lt "$EXPECTED_DOCS" ]; then ALL_GOOD=0; fi
if [ "$TOTAL_BQ" -lt 300 ]; then ALL_GOOD=0; fi
if [ "$GCS_COUNT" -lt 62 ]; then ALL_GOOD=0; fi

if [ "$ALL_GOOD" -eq 1 ]; then
  echo -e "${GREEN}✅ All checks passed! Upload successful.${NC}"
else
  echo -e "${YELLOW}⚠️  Some checks did not meet expectations. Review above.${NC}"
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

exit 0


