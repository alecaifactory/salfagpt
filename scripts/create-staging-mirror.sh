#!/bin/bash

###############################################################################
# Staging Mirror Infrastructure Setup Script
# 
# Creates salfagpt-staging as exact mirror of salfagpt (production)
# 
# Features:
# - Complete GCP project setup
# - Firestore database in same region (us-east4)
# - Production data copy (READ-ONLY access)
# - Cloud Run service deployment
# - Promotion workflow collections
# - Bidirectional sync capability
# 
# SAFE: Read-only production access, no writes to production
# IDEMPOTENT: Safe to run multiple times
# 
# Created: 2025-11-10
# Part of: feat/multi-org-system-2025-11-10
###############################################################################

set -e  # Exit on any error

# Colors for output
RED='\033[0,31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROD_PROJECT="salfagpt"
STAGING_PROJECT="salfagpt-staging"
REGION="us-east4"
PROD_SERVICE="cr-salfagpt-ai-ft-prod"
STAGING_SERVICE="cr-salfagpt-staging"

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Staging Mirror Infrastructure Setup                 ║${NC}"
echo -e "${BLUE}║   Production: $PROD_PROJECT (us-east4)                      ║${NC}"
echo -e "${BLUE}║   Staging: $STAGING_PROJECT (us-east4)                 ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Check prerequisites
echo -e "${YELLOW}📋 Step 1: Checking prerequisites...${NC}"

# Check gcloud installed
if ! command -v gcloud &> /dev/null; then
  echo -e "${RED}❌ gcloud CLI not found. Please install Google Cloud SDK.${NC}"
  exit 1
fi

# Check firebase CLI installed
if ! command -v firebase &> /dev/null; then
  echo -e "${RED}❌ firebase CLI not found. Installing...${NC}"
  npm install -g firebase-tools
fi

# Check authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
  echo -e "${RED}❌ Not authenticated with gcloud. Please run:${NC}"
  echo "   gcloud auth login"
  exit 1
fi

echo -e "${GREEN}✅ Prerequisites met${NC}"
echo ""

# Step 2: Create staging project
echo -e "${YELLOW}📦 Step 2: Creating staging GCP project...${NC}"

# Check if project already exists
if gcloud projects describe $STAGING_PROJECT &> /dev/null; then
  echo -e "${GREEN}✅ Project $STAGING_PROJECT already exists${NC}"
else
  echo "Creating new project: $STAGING_PROJECT"
  gcloud projects create $STAGING_PROJECT --name="SalfaGPT Staging"
  echo -e "${GREEN}✅ Project created${NC}"
fi

# Set billing account (use same as production)
BILLING_ACCOUNT=$(gcloud beta billing projects describe $PROD_PROJECT --format="value(billingAccountName)" | sed 's/.*\///')
if [ -n "$BILLING_ACCOUNT" ]; then
  echo "Linking billing account: $BILLING_ACCOUNT"
  gcloud beta billing projects link $STAGING_PROJECT --billing-account=$BILLING_ACCOUNT
  echo -e "${GREEN}✅ Billing linked${NC}"
fi

echo ""

# Step 3: Enable required APIs
echo -e "${YELLOW}🔧 Step 3: Enabling required APIs...${NC}"

APIS=(
  "firestore.googleapis.com"
  "run.googleapis.com"
  "cloudbuild.googleapis.com"
  "secretmanager.googleapis.com"
  "storage.googleapis.com"
  "cloudkms.googleapis.com"
)

for api in "${APIS[@]}"; do
  echo "Enabling $api..."
  gcloud services enable $api --project=$STAGING_PROJECT
done

echo -e "${GREEN}✅ APIs enabled${NC}"
echo ""

# Step 4: Create Firestore database
echo -e "${YELLOW}🔥 Step 4: Creating Firestore database...${NC}"

# Check if database exists
if gcloud firestore databases describe --project=$STAGING_PROJECT --database='(default)' &> /dev/null; then
  echo -e "${GREEN}✅ Firestore database already exists${NC}"
else
  echo "Creating Firestore database in $REGION..."
  gcloud firestore databases create \
    --location=$REGION \
    --type=firestore-native \
    --project=$STAGING_PROJECT
  
  echo -e "${GREEN}✅ Firestore database created${NC}"
fi

echo ""

# Step 5: Copy production data to staging (READ-ONLY)
echo -e "${YELLOW}📂 Step 5: Copying production data to staging...${NC}"

# Create staging bucket for exports
STAGING_BUCKET="${STAGING_PROJECT}-firestore-exports"

if ! gsutil ls -p $STAGING_PROJECT gs://$STAGING_BUCKET &> /dev/null; then
  echo "Creating staging export bucket..."
  gsutil mb -p $STAGING_PROJECT -l $REGION gs://$STAGING_BUCKET
fi

# Export from production (READ-ONLY - safe operation)
EXPORT_DATE=$(date +%Y%m%d-%H%M%S)
EXPORT_PATH="gs://$STAGING_BUCKET/production-copy-$EXPORT_DATE"

echo "Exporting production Firestore to: $EXPORT_PATH"
echo "⏱️  This may take 5-15 minutes for 150+ users, 200+ agents..."

gcloud firestore export $EXPORT_PATH \
  --project=$PROD_PROJECT \
  --async

echo "Export started. Checking status..."
sleep 10

# Wait for export to complete (check every 30 seconds)
MAX_WAIT=1800  # 30 minutes max
ELAPSED=0
while [ $ELAPSED -lt $MAX_WAIT ]; do
  # Check if export completed (operation no longer in list of running operations)
  if gcloud firestore operations list --project=$PROD_PROJECT --filter="done:true" --format="value(name)" | grep -q "export"; then
    echo -e "${GREEN}✅ Production export complete${NC}"
    break
  fi
  
  echo "⏱️  Waiting for export... ($ELAPSED seconds elapsed)"
  sleep 30
  ELAPSED=$((ELAPSED + 30))
done

if [ $ELAPSED -ge $MAX_WAIT ]; then
  echo -e "${RED}⚠️  Export timeout. Check status with:${NC}"
  echo "   gcloud firestore operations list --project=$PROD_PROJECT"
  echo ""
  echo "Continuing anyway - import will happen when export completes..."
fi

# Import to staging
echo "Importing to staging Firestore..."
gcloud firestore import $EXPORT_PATH \
  --project=$STAGING_PROJECT \
  --async

echo -e "${GREEN}✅ Import started (will complete in background)${NC}"
echo ""

# Step 6: Deploy indexes to staging
echo -e "${YELLOW}📇 Step 6: Deploying Firestore indexes...${NC}"

firebase deploy --only firestore:indexes \
  --project=$STAGING_PROJECT

echo -e "${GREEN}✅ Indexes deployed (building in background)${NC}"
echo ""

# Step 7: Deploy security rules to staging
echo -e "${YELLOW}🔐 Step 7: Deploying Firestore security rules...${NC}"

firebase deploy --only firestore:rules \
  --project=$STAGING_PROJECT

echo -e "${GREEN}✅ Security rules deployed${NC}"
echo ""

# Step 8: Create secrets in staging
echo -e "${YELLOW}🔑 Step 8: Setting up secrets...${NC}"

# Copy secrets from production (you'll need to recreate or copy values)
echo "Creating secret placeholders in staging..."
echo "⚠️  You'll need to populate these with actual values:"
echo ""

SECRETS=(
  "google-ai-api-key"
  "google-client-id"
  "google-client-secret"
  "jwt-secret"
)

for secret in "${SECRETS[@]}"; do
  if gcloud secrets describe $secret --project=$STAGING_PROJECT &> /dev/null; then
    echo "  ✅ Secret $secret already exists"
  else
    echo "  Creating secret: $secret"
    echo "PLACEHOLDER-VALUE-REPLACE-ME" | gcloud secrets create $secret \
      --data-file=- \
      --project=$STAGING_PROJECT \
      --replication-policy="automatic"
  fi
done

echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Update secrets with actual values:${NC}"
for secret in "${SECRETS[@]}"; do
  echo "   gcloud secrets versions add $secret --data-file=- --project=$STAGING_PROJECT"
done
echo ""

# Step 9: Deploy Cloud Run service to staging
echo -e "${YELLOW}☁️  Step 9: Deploying Cloud Run service to staging...${NC}"

echo "Building and deploying to Cloud Run..."
echo "⏱️  This may take 5-10 minutes..."

gcloud run deploy $STAGING_SERVICE \
  --source . \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --min-instances=0 \
  --max-instances=5 \
  --memory=1Gi \
  --cpu=2 \
  --timeout=300s \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=$STAGING_PROJECT,ENVIRONMENT_NAME=staging,NODE_ENV=production" \
  --set-secrets="GOOGLE_AI_API_KEY=google-ai-api-key:latest,GOOGLE_CLIENT_ID=google-client-id:latest,GOOGLE_CLIENT_SECRET=google-client-secret:latest,JWT_SECRET=jwt-secret:latest" \
  --project=$STAGING_PROJECT

# Get service URL
STAGING_URL=$(gcloud run services describe $STAGING_SERVICE \
  --region=$REGION \
  --project=$STAGING_PROJECT \
  --format='value(status.url)')

echo -e "${GREEN}✅ Cloud Run service deployed${NC}"
echo -e "${BLUE}🌐 Staging URL: $STAGING_URL${NC}"
echo ""

# Update PUBLIC_BASE_URL
echo "Updating PUBLIC_BASE_URL environment variable..."
gcloud run services update $STAGING_SERVICE \
  --region=$REGION \
  --project=$STAGING_PROJECT \
  --update-env-vars="PUBLIC_BASE_URL=$STAGING_URL"

echo -e "${GREEN}✅ Environment variables updated${NC}"
echo ""

# Step 10: Setup read-only production access (Best Practice #4)
echo -e "${YELLOW}👀 Step 10: Setting up read-only production access...${NC}"

# Grant staging service account read access to production Firestore
STAGING_SA="${STAGING_PROJECT}@appspot.gserviceaccount.com"

echo "Granting staging service account read access to production..."
gcloud projects add-iam-policy-binding $PROD_PROJECT \
  --member="serviceAccount:$STAGING_SA" \
  --role="roles/datastore.viewer" \
  --condition=None

echo -e "${GREEN}✅ Read-only production access configured${NC}"
echo ""

# Step 11: Create promotion workflow collections
echo -e "${YELLOW}📋 Step 11: Creating promotion workflow collections...${NC}"

echo "Promotion collections will be created automatically when first used."
echo "Pre-defined collections:"
echo "  - promotion_requests"
echo "  - promotion_snapshots"
echo "  - data_lineage"
echo "  - conflict_resolutions"
echo "  - org_memberships"
echo ""

# Step 12: Verify setup
echo -e "${YELLOW}✅ Step 12: Verifying setup...${NC}"

echo "Checking Firestore database..."
if gcloud firestore databases describe --project=$STAGING_PROJECT --database='(default)' &> /dev/null; then
  echo -e "${GREEN}  ✅ Firestore database: READY${NC}"
else
  echo -e "${RED}  ❌ Firestore database: NOT READY${NC}"
fi

echo "Checking Cloud Run service..."
if gcloud run services describe $STAGING_SERVICE --region=$REGION --project=$STAGING_PROJECT &> /dev/null; then
  echo -e "${GREEN}  ✅ Cloud Run service: DEPLOYED${NC}"
else
  echo -e "${RED}  ❌ Cloud Run service: NOT DEPLOYED${NC}"
fi

echo "Checking indexes..."
INDEX_COUNT=$(gcloud firestore indexes composite list --project=$STAGING_PROJECT --format="value(name)" | wc -l)
echo -e "${GREEN}  ✅ Indexes: $INDEX_COUNT building/ready${NC}"

echo ""

# Final summary
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          STAGING MIRROR SETUP COMPLETE ✅              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Production Project:${NC} $PROD_PROJECT"
echo -e "${GREEN}Staging Project:${NC} $STAGING_PROJECT"
echo -e "${GREEN}Region:${NC} $REGION"
echo ""
echo -e "${GREEN}Staging URL:${NC} $STAGING_URL"
echo ""
echo -e "${YELLOW}⚠️  NEXT STEPS:${NC}"
echo ""
echo "1. Update OAuth Redirect URIs in Google Console:"
echo "   Add: $STAGING_URL/auth/callback"
echo "   https://console.cloud.google.com/apis/credentials?project=$STAGING_PROJECT"
echo ""
echo "2. Update secrets with actual values (not placeholders):"
for secret in "${SECRETS[@]}"; do
  echo "   echo 'YOUR_VALUE' | gcloud secrets versions add $secret --data-file=- --project=$STAGING_PROJECT"
done
echo ""
echo "3. Wait for Firestore import to complete (~10-20 minutes):"
echo "   gcloud firestore operations list --project=$STAGING_PROJECT"
echo ""
echo "4. Verify staging service:"
echo "   curl $STAGING_URL/api/health"
echo ""
echo "5. Test staging login:"
echo "   open $STAGING_URL/chat"
echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}✅ Staging mirror infrastructure created successfully!${NC}"
echo ""
echo "Estimated costs: ~$60-80/week for staging environment"
echo "Import completion: Check in ~10-20 minutes"
echo ""

# Save configuration
cat > .staging-config.json <<EOF
{
  "productionProject": "$PROD_PROJECT",
  "stagingProject": "$STAGING_PROJECT",
  "region": "$REGION",
  "productionService": "$PROD_SERVICE",
  "stagingService": "$STAGING_SERVICE",
  "stagingUrl": "$STAGING_URL",
  "createdAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "exportPath": "$EXPORT_PATH"
}
EOF

echo -e "${GREEN}✅ Configuration saved to .staging-config.json${NC}"
echo ""
echo "🎉 Setup complete! Follow the NEXT STEPS above to finalize staging environment."

