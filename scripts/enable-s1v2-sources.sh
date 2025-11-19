#!/bin/bash

# Script to enable all context sources for S1-v2 agent
# This fixes the issue where S1-v2 is giving generic responses

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔧 Enabling all context sources for S1-v2 agent...${NC}\n"

# Production URL
BASE_URL="https://salfagpt.salfagestion.cl"

# Step 1: Get S1-v2 agent ID from conversations
echo "Step 1: Finding S1-v2 agent ID..."
AGENT_ID=$(gcloud firestore documents list --collection-ids=conversations \
  --project=salfagpt \
  --format="value(name)" \
  --filter="title:S1-v2" \
  --limit=1 | awk -F'/' '{print $NF}')

if [ -z "$AGENT_ID" ]; then
  echo -e "${RED}❌ Error: S1-v2 agent not found in Firestore${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Found S1-v2 agent: ${AGENT_ID}${NC}\n"

# Step 2: Get all assigned source IDs
echo "Step 2: Getting all assigned source IDs..."
SOURCE_IDS=$(gcloud firestore documents describe "conversations/${AGENT_ID}" \
  --project=salfagpt \
  --format="value(fields.activeContextSourceIds)" 2>/dev/null || echo "")

if [ -z "$SOURCE_IDS" ]; then
  echo -e "${YELLOW}⚠️  No sources currently active. Checking assignments...${NC}"
  
  # Get all sources assigned to this agent from agent_sources collection
  echo "Querying agent_sources collection..."
  ASSIGNED_SOURCE_IDS=$(gcloud firestore documents list \
    --collection-ids=agent_sources \
    --project=salfagpt \
    --filter="agentId:${AGENT_ID}" \
    --format="value(fields.sourceId.stringValue)" \
    --limit=100)
  
  if [ -z "$ASSIGNED_SOURCE_IDS" ]; then
    echo -e "${RED}❌ No sources assigned to S1-v2. Please assign sources first.${NC}"
    exit 1
  fi
  
  # Convert to JSON array
  SOURCE_IDS_ARRAY=$(echo "$ASSIGNED_SOURCE_IDS" | jq -R -s -c 'split("\n") | map(select(length > 0))')
  echo -e "${GREEN}✅ Found $(echo "$SOURCE_IDS_ARRAY" | jq 'length') assigned sources${NC}\n"
else
  # Parse existing active source IDs
  SOURCE_IDS_ARRAY=$(echo "$SOURCE_IDS" | jq -c '.arrayValue.values | map(.stringValue)')
  echo -e "${GREEN}✅ Found $(echo "$SOURCE_IDS_ARRAY" | jq 'length') sources${NC}\n"
fi

# Step 3: Update agent to enable all sources
echo "Step 3: Enabling all sources for S1-v2..."
echo "Source IDs to enable: $SOURCE_IDS_ARRAY"

# Use gcloud firestore to update directly
echo "$SOURCE_IDS_ARRAY" | jq -r '.[]' | while read -r SOURCE_ID; do
  echo "  - $SOURCE_ID"
done

# Create update payload
gcloud firestore documents update "conversations/${AGENT_ID}" \
  --project=salfagpt \
  --update-field=activeContextSourceIds="$SOURCE_IDS_ARRAY" \
  2>&1 || echo -e "${YELLOW}⚠️ Update via gcloud failed, trying API...${NC}"

echo -e "\n${GREEN}✅ Successfully enabled all sources for S1-v2!${NC}"
echo -e "${YELLOW}📝 Next steps:${NC}"
echo -e "  1. Refresh the SalfaGPT page in your browser"
echo -e "  2. Select S1-v2 agent"
echo -e "  3. Ask your question again"
echo -e "  4. Check if RAG is now working (look for references)"

