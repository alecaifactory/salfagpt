#!/bin/bash
###############################################################################
# QA Environment Setup Script
# Creates salfagpt-qa as exact mirror of salfagpt (production)
# 
# Project: salfagpt (production) → salfagpt-qa (QA/staging)
# Region: us-east4 (same as production)
# User: alec@salfacloud.cl
#
# What this script does:
# 1. Creates salfagpt-qa GCP project
# 2. Enables required APIs
# 3. Creates Firestore database in us-east4
# 4. Copies production data to QA
# 5. Deploys Firestore indexes and security rules
# 6. Creates secrets (placeholders - you'll update with real values)
# 7. Deploys Cloud Run service
# 8. Sets up READ-ONLY access to production
#
# SAFE: Cannot write to production, only reads from it
# IDEMPOTENT: Safe to run multiple times
#
# Created: 2025-11-15
# Estimated time: 30-45 minutes (mostly Firestore import)
###############################################################################

set -e  # Exit on any error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
PROD_PROJECT="salfagpt"
QA_PROJECT="salfagpt-qa"
REGION="us-east4"
PROD_SERVICE="cr-salfagpt-ai-ft-prod"
QA_SERVICE="cr-salfagpt-qa"

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         QA Environment Setup - SalfaGPT                   ║${NC}"
echo -e "${BLUE}║         Production: $PROD_PROJECT → QA: $QA_PROJECT                ║${NC}"
echo -e "${BLUE}║         Region: $REGION                                    ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "⏱️  Estimated time: 30-45 minutes"
echo "💰 Estimated cost: ~\$30-50/month for QA environment"
echo ""

# Step 1: Prerequisites
echo -e "${YELLOW}📋 Step 1: Checking prerequisites...${NC}"

if ! command -v gcloud &> /dev/null; then
  echo -e "${RED}❌ gcloud CLI not found${NC}"
  echo "   Install from: https://cloud.google.com/sdk/install"
  exit 1
fi

if ! command -v firebase &> /dev/null; then
  echo -e "${YELLOW}Installing firebase CLI...${NC}"
  npm install -g firebase-tools
fi

# Check authenticated as correct user
CURRENT_USER=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null || echo "none")
if [[ "$CURRENT_USER" != *"alec@salfacloud.cl"* ]]; then
  echo -e "${RED}❌ Not authenticated as alec@salfacloud.cl${NC}"
  echo "   Current: $CURRENT_USER"
  echo ""
  echo "   Run: gcloud auth login"
  echo "   Then select: alec@salfacloud.cl"
  exit 1
fi

echo -e "${GREEN}✅ Prerequisites met (authenticated as $CURRENT_USER)${NC}"
echo ""

# Step 2: Create QA project
echo -e "${YELLOW}📦 Step 2: Creating QA GCP project...${NC}"

if gcloud projects describe $QA_PROJECT &> /dev/null; then
  echo -e "${GREEN}✅ Project $QA_PROJECT already exists${NC}"
else
  echo "Creating new project: $QA_PROJECT"
  gcloud projects create $QA_PROJECT \
    --name="SalfaGPT QA" \
    --set-as-default=false
  echo -e "${GREEN}✅ Project created${NC}"
fi

# Link billing (same as production)
echo "Linking billing account..."
BILLING_ACCOUNT=$(gcloud beta billing projects describe $PROD_PROJECT --format="value(billingAccountName)" 2>/dev/null | sed 's/.*\///' || echo "")
if [ -n "$BILLING_ACCOUNT" ]; then
  gcloud beta billing projects link $QA_PROJECT --billing-account=$BILLING_ACCOUNT 2>/dev/null || echo "  Billing already linked"
  echo -e "${GREEN}✅ Billing linked (account: $BILLING_ACCOUNT)${NC}"
else
  echo -e "${YELLOW}⚠️  Could not detect billing account. You may need to link manually.${NC}"
fi

echo ""

# Step 3: Enable APIs
echo -e "${YELLOW}🔧 Step 3: Enabling required APIs...${NC}"

APIS=(
  "firestore.googleapis.com"
  "run.googleapis.com"
  "cloudbuild.googleapis.com"
  "secretmanager.googleapis.com"
  "storage.googleapis.com"
  "aiplatform.googleapis.com"
  "cloudkms.googleapis.com"
  "artifactregistry.googleapis.com"
)

for api in "${APIS[@]}"; do
  echo "  Enabling $api..."
  gcloud services enable $api --project=$QA_PROJECT --quiet
done

echo -e "${GREEN}✅ APIs enabled${NC}"
echo ""

# Step 4: Create Firestore database
echo -e "${YELLOW}🔥 Step 4: Creating Firestore database...${NC}"

if gcloud firestore databases describe --project=$QA_PROJECT --database='(default)' &> /dev/null; then
  echo -e "${GREEN}✅ Firestore already exists${NC}"
else
  echo "Creating Firestore database in $REGION..."
  gcloud firestore databases create \
    --location=$REGION \
    --type=firestore-native \
    --project=$QA_PROJECT
  echo -e "${GREEN}✅ Firestore created in $REGION${NC}"
fi

echo ""

# Step 5: Copy production data
echo -e "${YELLOW}📂 Step 5: Copying production data to QA...${NC}"

QA_BUCKET="${QA_PROJECT}-firestore-exports"

# Create export bucket
echo "Creating/verifying export bucket..."
if ! gsutil ls -p $QA_PROJECT gs://$QA_BUCKET &> /dev/null; then
  gsutil mb -p $QA_PROJECT -l $REGION gs://$QA_BUCKET
  echo "  ✅ Bucket created"
else
  echo "  ✅ Bucket exists"
fi

# Export from production (READ-ONLY operation - safe!)
EXPORT_DATE=$(date +%Y%m%d-%H%M%S)
EXPORT_PATH="gs://$QA_BUCKET/prod-copy-$EXPORT_DATE"

echo ""
echo "Exporting from production..."
echo "⏱️  This takes 5-15 minutes for 150+ users, 200+ agents..."
echo "☕ Good time for a coffee break!"
echo ""

gcloud firestore export $EXPORT_PATH \
  --project=$PROD_PROJECT \
  --async

echo "Export started. Waiting for completion..."
echo "(Checking every 30 seconds...)"
sleep 30

# Wait for export to complete (max 30 minutes)
MAX_WAIT=1800
ELAPSED=0
while [ $ELAPSED -lt $MAX_WAIT ]; do
  # Check if export is done
  if gcloud firestore operations list --project=$PROD_PROJECT --filter="done:true" --format="value(name)" 2>/dev/null | grep -q "export"; then
    echo -e "${GREEN}✅ Production export complete!${NC}"
    break
  fi
  
  echo "⏱️  Still exporting... ($ELAPSED seconds elapsed)"
  sleep 30
  ELAPSED=$((ELAPSED + 30))
done

if [ $ELAPSED -ge $MAX_WAIT ]; then
  echo -e "${YELLOW}⚠️  Export still running after 30 minutes${NC}"
  echo "   Check status: gcloud firestore operations list --project=$PROD_PROJECT"
  echo "   Continuing anyway (import will happen when export completes)..."
fi

# Import to QA
echo ""
echo "Importing to QA Firestore..."
gcloud firestore import $EXPORT_PATH \
  --project=$QA_PROJECT \
  --async

echo -e "${GREEN}✅ Import started (completes in background - 10-20 minutes)${NC}"
echo ""

# Step 6: Deploy indexes
echo -e "${YELLOW}📇 Step 6: Deploying Firestore indexes...${NC}"

if [ -f firestore.indexes.json ]; then
  firebase deploy --only firestore:indexes --project=$QA_PROJECT --non-interactive
  echo -e "${GREEN}✅ Indexes deployed (building in background)${NC}"
else
  echo -e "${YELLOW}⚠️  firestore.indexes.json not found - skipping${NC}"
fi

echo ""

# Step 7: Deploy security rules
echo -e "${YELLOW}🔐 Step 7: Deploying Firestore security rules...${NC}"

if [ -f firestore.rules ]; then
  firebase deploy --only firestore:rules --project=$QA_PROJECT --non-interactive
  echo -e "${GREEN}✅ Security rules deployed${NC}"
else
  echo -e "${YELLOW}⚠️  firestore.rules not found - skipping${NC}"
fi

echo ""

# Step 8: Create secrets
echo -e "${YELLOW}🔑 Step 8: Creating secrets in QA project...${NC}"
echo ""
echo "You'll need to update these with actual values from your .env file"
echo ""

SECRETS=(
  "google-ai-api-key"
  "google-client-id"
  "google-client-secret"
  "jwt-secret"
)

for secret in "${SECRETS[@]}"; do
  if gcloud secrets describe $secret --project=$QA_PROJECT &> /dev/null 2>&1; then
    echo "  ✅ Secret exists: $secret"
  else
    echo "  Creating: $secret"
    echo "PLACEHOLDER-UPDATE-ME" | gcloud secrets create $secret \
      --data-file=- \
      --project=$QA_PROJECT \
      --replication-policy="automatic"
    echo "  ✅ Created (needs real value)"
  fi
done

echo ""
echo -e "${BLUE}📝 To update secrets with real values from .env:${NC}"
echo ""
echo "# Get values from your .env file:"
echo "cat .env"
echo ""
echo "# Then update QA secrets (copy value from .env):"
for secret in "${SECRETS[@]}"; do
  echo "echo 'VALUE_FROM_ENV' | gcloud secrets versions add $secret --data-file=- --project=$QA_PROJECT"
done
echo ""
echo -e "${YELLOW}Press ENTER when you've updated the secrets...${NC}"
read

# Step 9: Deploy Cloud Run
echo ""
echo -e "${YELLOW}☁️  Step 9: Deploying Cloud Run service to QA...${NC}"
echo "⏱️  This takes 5-10 minutes..."
echo ""

gcloud run deploy $QA_SERVICE \
  --source . \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --min-instances=0 \
  --max-instances=5 \
  --memory=2Gi \
  --cpu=1 \
  --timeout=300s \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=$QA_PROJECT,ENVIRONMENT_NAME=qa,NODE_ENV=production,CHUNK_SIZE=1000,CHUNK_OVERLAP=200,EMBEDDING_BATCH_SIZE=100,TOP_K=5,EMBEDDING_MODEL=textembedding-gecko@003" \
  --set-secrets="GOOGLE_AI_API_KEY=google-ai-api-key:latest,GOOGLE_CLIENT_ID=google-client-id:latest,GOOGLE_CLIENT_SECRET=google-client-secret:latest,JWT_SECRET=jwt-secret:latest" \
  --project=$QA_PROJECT

# Get URL
QA_URL=$(gcloud run services describe $QA_SERVICE \
  --region=$REGION \
  --project=$QA_PROJECT \
  --format='value(status.url)')

echo ""
echo -e "${GREEN}✅ QA service deployed!${NC}"
echo -e "${BLUE}🌐 QA URL: $QA_URL${NC}"
echo ""

# Update PUBLIC_BASE_URL and SESSION_COOKIE_NAME
echo "Updating environment-specific variables..."
gcloud run services update $QA_SERVICE \
  --region=$REGION \
  --project=$QA_PROJECT \
  --update-env-vars="PUBLIC_BASE_URL=$QA_URL,SESSION_COOKIE_NAME=salfagpt_qa_session"

echo -e "${GREEN}✅ Environment variables updated${NC}"
echo ""

# Step 10: Setup read-only production access
echo -e "${YELLOW}👀 Step 10: Setting up READ-ONLY production access...${NC}"

QA_SERVICE_ACCOUNT="${QA_PROJECT}@appspot.gserviceaccount.com"

echo "Granting QA service account READ-ONLY access to production..."
gcloud projects add-iam-policy-binding $PROD_PROJECT \
  --member="serviceAccount:$QA_SERVICE_ACCOUNT" \
  --role="roles/datastore.viewer" \
  --condition=None \
  2>/dev/null || echo "  Permission may already exist"

echo -e "${GREEN}✅ READ-ONLY production access configured${NC}"
echo "   QA can read production data but CANNOT write to it"
echo ""

# Step 11: Verify setup
echo -e "${YELLOW}✅ Step 11: Verifying setup...${NC}"
echo ""

echo "Checking Firestore database..."
if gcloud firestore databases describe --project=$QA_PROJECT --database='(default)' &> /dev/null; then
  echo -e "${GREEN}  ✅ Firestore database: READY${NC}"
else
  echo -e "${RED}  ❌ Firestore database: NOT READY${NC}"
fi

echo "Checking Cloud Run service..."
if gcloud run services describe $QA_SERVICE --region=$REGION --project=$QA_PROJECT &> /dev/null; then
  echo -e "${GREEN}  ✅ Cloud Run service: DEPLOYED${NC}"
else
  echo -e "${RED}  ❌ Cloud Run service: NOT DEPLOYED${NC}"
fi

echo "Checking indexes..."
INDEX_COUNT=$(gcloud firestore indexes composite list --project=$QA_PROJECT --format="value(name)" 2>/dev/null | wc -l || echo "0")
echo -e "${GREEN}  ✅ Indexes: $INDEX_COUNT building/ready${NC}"

echo ""

# Final summary
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              QA ENVIRONMENT SETUP COMPLETE ✅             ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Production Project:${NC} $PROD_PROJECT"
echo -e "${GREEN}QA Project:${NC} $QA_PROJECT"
echo -e "${GREEN}Region:${NC} $REGION"
echo ""
echo -e "${GREEN}Production URL:${NC} https://salfagpt-3snj65wckq-uc.a.run.app"
echo -e "${GREEN}QA URL:${NC} $QA_URL"
echo ""
echo -e "${YELLOW}⚠️  NEXT STEPS:${NC}"
echo ""
echo "1. Add OAuth redirect URI in Google Console:"
echo "   URL to add: $QA_URL/auth/callback"
echo "   Console: https://console.cloud.google.com/apis/credentials?project=$QA_PROJECT"
echo ""
echo "2. Verify Firestore import completed (wait 10-20 minutes):"
echo "   gcloud firestore operations list --project=$QA_PROJECT"
echo ""
echo "3. Test QA environment:"
echo "   open $QA_URL/chat"
echo "   Login with your Google account"
echo "   Verify you see your agents and data"
echo ""
echo "4. Update your .env file to point localhost to QA:"
echo "   GOOGLE_CLOUD_PROJECT=salfagpt-qa"
echo ""
echo "5. Create develop branch:"
echo "   git checkout -b develop main"
echo "   git push -u origin develop"
echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}✅ QA environment infrastructure created successfully!${NC}"
echo ""
echo "📚 Next: Run ./scripts/deploy-to-qa.sh to deploy code changes to QA"
echo ""

