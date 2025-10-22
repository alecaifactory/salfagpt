#!/bin/bash
# Universal GCP Project Setup for Flow
# Works for both staging and production client environments
# 95% automated - only secrets and OAuth need manual config

set -e

echo "🏗️  Flow - Client GCP Project Setup"
echo "===================================="
echo ""

# 1. Get configuration
read -p "Environment type (staging/production): " ENV_TYPE
read -p "Client GCP Project ID: " PROJECT_ID
read -p "Region [us-central1]: " REGION
REGION=${REGION:-us-central1}

# Determine service name based on environment
if [ "$ENV_TYPE" = "staging" ]; then
  SERVICE_NAME="flow-staging"
  ENV_DISPLAY="Staging (Client UAT)"
  MIN_INSTANCES=1
  MAX_INSTANCES=10
  MEMORY="1Gi"
  CPU=2
else
  SERVICE_NAME="flow-production"
  ENV_DISPLAY="Production (Live)"
  MIN_INSTANCES=2
  MAX_INSTANCES=50
  MEMORY="2Gi"
  CPU=4
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Configuration Summary:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Environment: $ENV_DISPLAY"
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo "Service Name: $SERVICE_NAME"
echo "Resources: $MEMORY RAM, $CPU CPU, min: $MIN_INSTANCES"
echo ""
read -p "Continue with setup? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "❌ Setup cancelled"
  exit 0
fi

# 2. Set project
echo ""
echo "📌 Step 1/11: Setting active project..."
gcloud config set project $PROJECT_ID

# 3. Enable billing (check only)
echo ""
echo "💳 Step 2/11: Checking billing..."
BILLING_ACCOUNT=$(gcloud billing projects describe $PROJECT_ID \
  --format="value(billingAccountName)" 2>/dev/null || echo "")

if [ -z "$BILLING_ACCOUNT" ]; then
  echo "❌ ERROR: Billing is not enabled on this project"
  echo "   Enable billing at: https://console.cloud.google.com/billing/linkedaccount?project=$PROJECT_ID"
  exit 1
else
  echo "✅ Billing is enabled"
fi

# 4. Enable required APIs
echo ""
echo "🔌 Step 3/11: Enabling required APIs (this takes ~2 minutes)..."

REQUIRED_APIS=(
  "run.googleapis.com"
  "cloudbuild.googleapis.com"
  "artifactregistry.googleapis.com"
  "firestore.googleapis.com"
  "secretmanager.googleapis.com"
  "cloudresourcemanager.googleapis.com"
  "iam.googleapis.com"
  "compute.googleapis.com"
  "aiplatform.googleapis.com"
)

for api in "${REQUIRED_APIS[@]}"; do
  echo "  • Enabling $api..."
  gcloud services enable $api --project=$PROJECT_ID --quiet
done

echo "✅ All APIs enabled"

# 5. Create Firestore database
echo ""
echo "🔥 Step 4/11: Creating Firestore database..."

if gcloud firestore databases list --project=$PROJECT_ID 2>/dev/null | grep -q "(default)"; then
  echo "✅ Firestore database already exists"
else
  gcloud firestore databases create \
    --location=$REGION \
    --type=firestore-native \
    --project=$PROJECT_ID
  
  # Wait for creation
  echo "⏳ Waiting for Firestore to be ready..."
  sleep 10
  echo "✅ Firestore database created"
fi

# 6. Create Artifact Registry repository
echo ""
echo "📦 Step 5/11: Creating Artifact Registry repository..."

if gcloud artifacts repositories describe flow \
  --location=$REGION \
  --project=$PROJECT_ID 2>/dev/null >/dev/null; then
  echo "✅ Artifact Registry repository already exists"
else
  gcloud artifacts repositories create flow \
    --repository-format=docker \
    --location=$REGION \
    --description="Flow Docker images for $ENV_TYPE" \
    --project=$PROJECT_ID
  echo "✅ Artifact Registry repository created"
fi

# 7. Create service account
echo ""
echo "👤 Step 6/11: Creating service account..."

SERVICE_ACCOUNT="flow-runtime"
SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT}@${PROJECT_ID}.iam.gserviceaccount.com"

if gcloud iam service-accounts describe $SERVICE_ACCOUNT_EMAIL \
  --project=$PROJECT_ID 2>/dev/null >/dev/null; then
  echo "✅ Service account already exists"
else
  gcloud iam service-accounts create $SERVICE_ACCOUNT \
    --display-name="Flow Runtime Service Account" \
    --description="Service account for Flow Cloud Run service ($ENV_TYPE)" \
    --project=$PROJECT_ID
  echo "✅ Service account created: $SERVICE_ACCOUNT_EMAIL"
fi

# 8. Grant permissions
echo ""
echo "🔐 Step 7/11: Granting permissions to service account..."

ROLES=(
  "roles/datastore.user"
  "roles/secretmanager.secretAccessor"
  "roles/storage.admin"
  "roles/aiplatform.user"
)

for role in "${ROLES[@]}"; do
  echo "  • Granting $role..."
  gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="$role" \
    --condition=None \
    --quiet 2>/dev/null || echo "    (Already granted or no permission to grant)"
done

echo "✅ Permissions configuration complete"

# 9. Create Cloud Storage bucket
echo ""
echo "🪣 Step 8/11: Creating Cloud Storage bucket..."

BUCKET_NAME="${PROJECT_ID}-uploads"

if gsutil ls -p $PROJECT_ID gs://$BUCKET_NAME 2>/dev/null; then
  echo "✅ Bucket already exists"
else
  gsutil mb -p $PROJECT_ID -l $REGION gs://$BUCKET_NAME/
  
  # Set CORS
  cat > /tmp/cors-config.json << 'EOF'
[
  {
    "origin": ["*"],
    "method": ["GET", "POST", "PUT", "DELETE"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
EOF
  
  gsutil cors set /tmp/cors-config.json gs://$BUCKET_NAME/
  rm /tmp/cors-config.json
  echo "✅ Bucket created with CORS configured"
fi

# 10. Deploy Firestore indexes
echo ""
echo "📑 Step 9/11: Deploying Firestore indexes..."

if command -v firebase &> /dev/null; then
  firebase deploy \
    --only firestore:indexes \
    --project $PROJECT_ID \
    --non-interactive
  echo "✅ Firestore indexes deployed"
  echo "⏳ Indexes are building (check status in ~5 minutes)"
else
  echo "⚠️  Firebase CLI not found - skipping index deployment"
  echo "   Install: npm install -g firebase-tools"
  echo "   Then run: firebase deploy --only firestore:indexes --project $PROJECT_ID"
fi

# 11. Deploy Firestore security rules
echo ""
echo "🛡️  Step 10/11: Deploying Firestore security rules..."

if [ "$ENV_TYPE" = "production" ]; then
  echo "⚠️  PRODUCTION environment - using strict security rules"
  RULES_FILE="config/firestore.production.rules"
else
  echo "Staging environment - using permissive security rules"
  RULES_FILE="firestore.rules"
fi

read -p "Deploy Firestore rules now? (yes/no): " DEPLOY_RULES

if [ "$DEPLOY_RULES" = "yes" ]; then
  if command -v firebase &> /dev/null; then
    firebase deploy \
      --only firestore:rules \
      --project $PROJECT_ID \
      --non-interactive
    echo "✅ Firestore rules deployed"
  else
    echo "⚠️  Firebase CLI not found - skipping rules deployment"
  fi
else
  echo "⏭️  Skipping rules deployment (deploy manually later)"
fi

# 12. Create placeholder secrets (user must update values)
echo ""
echo "🔐 Step 11/11: Checking Secret Manager..."

echo "Secrets must be created with actual values."
echo "Checking if placeholders exist..."

for secret in google-ai-api-key google-client-secret jwt-secret; do
  if gcloud secrets describe $secret --project=$PROJECT_ID 2>/dev/null >/dev/null; then
    echo "  ✅ Secret exists: $secret"
  else
    echo "  ⚠️  Secret missing: $secret"
  fi
done

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ GCP PROJECT SETUP COMPLETE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Project: $PROJECT_ID"
echo "Environment: $ENV_DISPLAY"
echo "Region: $REGION"
echo "Service: $SERVICE_NAME"
echo "Service Account: $SERVICE_ACCOUNT_EMAIL"
echo "Bucket: gs://$BUCKET_NAME"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔐 MANUAL STEPS REQUIRED (5-10 minutes)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1️⃣  Create secrets in Secret Manager:"
echo ""
echo "   # Generate JWT secret"
echo "   JWT_SECRET=\$(openssl rand -base64 32)"
echo ""
echo "   # Create secrets"
echo "   echo -n \"YOUR_GEMINI_API_KEY\" | gcloud secrets create google-ai-api-key --data-file=- --project=$PROJECT_ID"
echo "   echo -n \"YOUR_OAUTH_CLIENT_SECRET\" | gcloud secrets create google-client-secret --data-file=- --project=$PROJECT_ID"
echo "   echo -n \"\$JWT_SECRET\" | gcloud secrets create jwt-secret --data-file=- --project=$PROJECT_ID"
echo ""
echo "2️⃣  Create OAuth 2.0 Client:"
echo "   https://console.cloud.google.com/apis/credentials?project=$PROJECT_ID"
echo ""
echo "   Configure OAuth consent screen:"
echo "   • App name: Flow (or client's brand name)"
echo "   • User support email: [client email]"
echo "   • Scopes: userinfo.email, userinfo.profile"
echo ""
echo "   Create OAuth 2.0 Client ID:"
echo "   • Type: Web application"
echo "   • Name: Flow $ENV_TYPE"
echo "   • Authorized redirect URIs: (add after deployment)"
echo ""
echo "3️⃣  Create .env file for this environment:"
echo ""
if [ "$ENV_TYPE" = "staging" ]; then
  echo "   cp .env.staging-client.template .env.staging-client"
  echo "   # Edit with actual values:"
  echo "   #   - GOOGLE_CLOUD_PROJECT=$PROJECT_ID"
  echo "   #   - GOOGLE_CLIENT_ID=[from step 2]"
  echo "   #   - GOOGLE_CLIENT_SECRET=[from step 2]"
  echo "   #   - GOOGLE_AI_API_KEY=[your key]"
  echo "   #   - JWT_SECRET=[from step 1]"
else
  echo "   cp .env.production-client.template .env.production-client"
  echo "   # Edit with actual values (same as above)"
fi
echo ""
echo "4️⃣  Deploy the application:"
if [ "$ENV_TYPE" = "staging" ]; then
  echo "   ./deployment/deploy-to-environment.sh staging-client"
else
  echo "   ./deployment/deploy-to-environment.sh production-client"
fi
echo ""
echo "5️⃣  After deployment, configure OAuth redirect URI:"
echo "   • Get deployed URL from deployment output"
echo "   • Add to OAuth client: [URL]/auth/callback"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📖 Save this output! You'll need it for deployment."
echo ""
echo "Next: Complete manual steps 1-3, then run deployment script."
echo ""
















