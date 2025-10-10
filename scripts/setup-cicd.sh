#!/bin/bash
# Setup script for Cloud Build CI/CD
# Automates the setup of Cloud Build triggers, secrets, and services

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== SalfaGPT Cloud Build CI/CD Setup ===${NC}\n"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI not found. Please install it first:${NC}"
    echo "https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Get project ID
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ]; then
    echo -e "${YELLOW}No project set. Please enter your GCP project ID:${NC}"
    read -p "Project ID: " PROJECT_ID
    gcloud config set project $PROJECT_ID
fi

echo -e "${GREEN}✓ Using project: $PROJECT_ID${NC}\n"

# Get project number
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
echo -e "${GREEN}✓ Project number: $PROJECT_NUMBER${NC}\n"

# Step 1: Enable APIs
echo -e "${YELLOW}Step 1: Enabling required APIs...${NC}"
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  cloudresourcemanager.googleapis.com \
  --quiet

echo -e "${GREEN}✓ APIs enabled${NC}\n"

# Step 2: Create Artifact Registry
echo -e "${YELLOW}Step 2: Creating Artifact Registry repository...${NC}"
if gcloud artifacts repositories describe salfagpt --location=us-central1 &>/dev/null; then
    echo -e "${GREEN}✓ Artifact Registry repository already exists${NC}"
else
    gcloud artifacts repositories create salfagpt \
      --repository-format=docker \
      --location=us-central1 \
      --description="SalfaGPT Docker images" \
      --quiet
    echo -e "${GREEN}✓ Artifact Registry repository created${NC}"
fi
echo ""

# Step 3: Grant Cloud Build permissions
echo -e "${YELLOW}Step 3: Granting Cloud Build service account permissions...${NC}"

CLOUD_BUILD_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${CLOUD_BUILD_SA}" \
  --role="roles/run.admin" \
  --quiet >/dev/null

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${CLOUD_BUILD_SA}" \
  --role="roles/iam.serviceAccountUser" \
  --quiet >/dev/null

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${CLOUD_BUILD_SA}" \
  --role="roles/secretmanager.secretAccessor" \
  --quiet >/dev/null

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${CLOUD_BUILD_SA}" \
  --role="roles/artifactregistry.writer" \
  --quiet >/dev/null

echo -e "${GREEN}✓ Cloud Build permissions granted${NC}\n"

# Step 4: Create runtime service account
echo -e "${YELLOW}Step 4: Creating Cloud Run runtime service account...${NC}"

RUNTIME_SA="salfagpt-runtime@${PROJECT_ID}.iam.gserviceaccount.com"

if gcloud iam service-accounts describe $RUNTIME_SA &>/dev/null; then
    echo -e "${GREEN}✓ Runtime service account already exists${NC}"
else
    gcloud iam service-accounts create salfagpt-runtime \
      --display-name="SalfaGPT Runtime Service Account" \
      --quiet
    echo -e "${GREEN}✓ Runtime service account created${NC}"
fi

# Grant runtime permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${RUNTIME_SA}" \
  --role="roles/secretmanager.secretAccessor" \
  --quiet >/dev/null

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${RUNTIME_SA}" \
  --role="roles/logging.logWriter" \
  --quiet >/dev/null

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${RUNTIME_SA}" \
  --role="roles/cloudtrace.agent" \
  --quiet >/dev/null

echo -e "${GREEN}✓ Runtime service account permissions granted${NC}\n"

# Step 5: Create secrets
echo -e "${YELLOW}Step 5: Setting up secrets...${NC}"

create_secret() {
    SECRET_NAME=$1
    SECRET_PROMPT=$2
    
    if gcloud secrets describe $SECRET_NAME &>/dev/null; then
        echo -e "${GREEN}✓ Secret $SECRET_NAME already exists${NC}"
    else
        echo -e "${YELLOW}Enter $SECRET_PROMPT:${NC}"
        read -s SECRET_VALUE
        echo ""
        echo -n "$SECRET_VALUE" | gcloud secrets create $SECRET_NAME \
          --data-file=- \
          --replication-policy="automatic" \
          --quiet
        echo -e "${GREEN}✓ Secret $SECRET_NAME created${NC}"
    fi
    
    # Grant access to both Cloud Build and Runtime
    gcloud secrets add-iam-policy-binding $SECRET_NAME \
      --member="serviceAccount:${CLOUD_BUILD_SA}" \
      --role="roles/secretmanager.secretAccessor" \
      --quiet >/dev/null 2>&1 || true
    
    gcloud secrets add-iam-policy-binding $SECRET_NAME \
      --member="serviceAccount:${RUNTIME_SA}" \
      --role="roles/secretmanager.secretAccessor" \
      --quiet >/dev/null 2>&1 || true
}

create_secret "ANTHROPIC_API_KEY" "Anthropic API Key"
create_secret "OAUTH_CLIENT_SECRET" "OAuth Client Secret"

# Generate session secret if doesn't exist
if gcloud secrets describe SESSION_SECRET &>/dev/null; then
    echo -e "${GREEN}✓ Secret SESSION_SECRET already exists${NC}"
else
    SESSION_SECRET=$(openssl rand -base64 32)
    echo -n "$SESSION_SECRET" | gcloud secrets create SESSION_SECRET \
      --data-file=- \
      --replication-policy="automatic" \
      --quiet
    echo -e "${GREEN}✓ Secret SESSION_SECRET created (auto-generated)${NC}"
    
    # Grant access
    gcloud secrets add-iam-policy-binding SESSION_SECRET \
      --member="serviceAccount:${CLOUD_BUILD_SA}" \
      --role="roles/secretmanager.secretAccessor" \
      --quiet >/dev/null 2>&1 || true
    
    gcloud secrets add-iam-policy-binding SESSION_SECRET \
      --member="serviceAccount:${RUNTIME_SA}" \
      --role="roles/secretmanager.secretAccessor" \
      --quiet >/dev/null 2>&1 || true
fi

echo ""

# Step 6: Information about Cloud Build Triggers
echo -e "${YELLOW}Step 6: Cloud Build Triggers Setup${NC}"
echo -e "${GREEN}To complete the setup, create Cloud Build triggers:${NC}"
echo ""
echo "1. Go to: https://console.cloud.google.com/cloud-build/triggers?project=$PROJECT_ID"
echo "2. Click 'Connect Repository' and connect your GitHub repo"
echo "3. Create three triggers as documented in docs/CI_CD_SETUP.md"
echo ""

# Summary
echo -e "${GREEN}=== Setup Complete ===${NC}\n"
echo "Next steps:"
echo "1. Create Cloud Build triggers (see docs/CI_CD_SETUP.md)"
echo "2. Create a test PR to verify PR validation works"
echo "3. Merge to main to trigger staging deployment"
echo "4. Manually trigger production deployment when ready"
echo ""
echo -e "${GREEN}Happy deploying! 🚀${NC}"
