#!/bin/bash

###############################################################################
# Organization Encryption Setup Script
# 
# Sets up Google Cloud KMS encryption for a specific organization
# Creates key ring and crypto key for data encryption
# 
# Usage:
#   ./scripts/setup-org-encryption.sh --org=salfa-corp --project=salfagpt
# 
# Created: 2025-11-10
# Part of: feat/multi-org-system-2025-11-10
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Parse arguments
ORG_ID=""
PROJECT_ID=""
LOCATION="us-east4"
KEY_RING="organization-keys"

while [[ $# -gt 0 ]]; do
  case $1 in
    --org=*)
      ORG_ID="${1#*=}"
      shift
      ;;
    --project=*)
      PROJECT_ID="${1#*=}"
      shift
      ;;
    --location=*)
      LOCATION="${1#*=}"
      shift
      ;;
    *)
      echo -e "${RED}Unknown argument: $1${NC}"
      exit 1
      ;;
  esac
done

# Validate required arguments
if [ -z "$ORG_ID" ]; then
  echo -e "${RED}❌ Error: --org is required${NC}"
  echo "Usage: $0 --org=<organization-id> --project=<gcp-project-id>"
  exit 1
fi

if [ -z "$PROJECT_ID" ]; then
  PROJECT_ID="${GOOGLE_CLOUD_PROJECT:-salfagpt}"
  echo -e "${YELLOW}Using default project: $PROJECT_ID${NC}"
fi

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Organization Encryption Setup                     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}Organization:${NC} $ORG_ID"
echo -e "${CYAN}Project:${NC} $PROJECT_ID"
echo -e "${CYAN}Location:${NC} $LOCATION"
echo -e "${CYAN}Key Ring:${NC} $KEY_RING"
echo ""

# Step 1: Enable Cloud KMS API
echo -e "${YELLOW}Step 1: Enabling Cloud KMS API...${NC}"

gcloud services enable cloudkms.googleapis.com --project=$PROJECT_ID

echo -e "${GREEN}✅ Cloud KMS API enabled${NC}"
echo ""

# Step 2: Create key ring
echo -e "${YELLOW}Step 2: Creating key ring...${NC}"

if gcloud kms keyrings describe $KEY_RING \
  --location=$LOCATION \
  --project=$PROJECT_ID &> /dev/null; then
  echo -e "${GREEN}✅ Key ring already exists${NC}"
else
  gcloud kms keyrings create $KEY_RING \
    --location=$LOCATION \
    --project=$PROJECT_ID
  
  echo -e "${GREEN}✅ Key ring created${NC}"
fi

echo ""

# Step 3: Create crypto key for organization
echo -e "${YELLOW}Step 3: Creating encryption key for organization...${NC}"

KEY_ID="${ORG_ID}-encryption-key"

if gcloud kms keys describe $KEY_ID \
  --keyring=$KEY_RING \
  --location=$LOCATION \
  --project=$PROJECT_ID &> /dev/null; then
  echo -e "${GREEN}✅ Encryption key already exists${NC}"
else
  gcloud kms keys create $KEY_ID \
    --keyring=$KEY_RING \
    --location=$LOCATION \
    --purpose=encryption \
    --project=$PROJECT_ID
  
  echo -e "${GREEN}✅ Encryption key created${NC}"
fi

echo ""

# Step 4: Grant service account access
echo -e "${YELLOW}Step 4: Granting service account access...${NC}"

# Get the default compute service account
SERVICE_ACCOUNT=$(gcloud iam service-accounts list \
  --project=$PROJECT_ID \
  --filter="email:*@appspot.gserviceaccount.com" \
  --format="value(email)" \
  --limit=1)

if [ -z "$SERVICE_ACCOUNT" ]; then
  echo -e "${RED}❌ Error: Could not find service account${NC}"
  exit 1
fi

echo "Service account: $SERVICE_ACCOUNT"

# Grant encrypt/decrypt permissions
gcloud kms keys add-iam-policy-binding $KEY_ID \
  --keyring=$KEY_RING \
  --location=$LOCATION \
  --project=$PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/cloudkms.cryptoKeyEncrypterDecrypter"

echo -e "${GREEN}✅ Permissions granted${NC}"
echo ""

# Step 5: Get key path for organization config
echo -e "${YELLOW}Step 5: Getting key path...${NC}"

KEY_PATH="projects/$PROJECT_ID/locations/$LOCATION/keyRings/$KEY_RING/cryptoKeys/$KEY_ID"

echo -e "${GREEN}Key Path:${NC} $KEY_PATH"
echo ""

# Step 6: Update organization configuration
echo -e "${YELLOW}Step 6: Organization configuration update needed...${NC}"

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Encryption setup complete!${NC}"
echo ""
echo "Update your organization document in Firestore:"
echo ""
echo "  Document: organizations/$ORG_ID"
echo "  Field: privacy.encryptionEnabled = true"
echo "  Field: privacy.encryptionKeyId = \"$KEY_PATH\""
echo ""
echo "Or via API:"
echo ""
echo "  PUT /api/organizations/$ORG_ID"
echo "  {"
echo "    \"privacy\": {"
echo "      \"encryptionEnabled\": true,"
echo "      \"encryptionKeyId\": \"$KEY_PATH\""
echo "    }"
echo "  }"
echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo ""
echo "Test encryption with:"
echo "  npx tsx -e \"import { testOrganizationEncryption } from './src/lib/encryption.js'; testOrganizationEncryption('$ORG_ID').then(console.log)\""
echo ""

