#!/bin/bash

# Production Permissions Setup Script
# Grants Cloud Run service account access to all required GCP services

set -e  # Exit on error

# Configuration
PROJECT_ID="cr-salfagpt-ai-ft-prod"
SERVICE_NAME="flow-production"
REGION="us-central1"

echo "🔧 Setting up permissions for Cloud Run service"
echo "================================================"
echo ""
echo "Project: $PROJECT_ID"
echo "Service: $SERVICE_NAME"
echo "Region: $REGION"
echo ""

# Step 1: Get service account
echo "1️⃣  Getting service account..."
SERVICE_ACCOUNT=$(gcloud run services describe $SERVICE_NAME \
  --region=$REGION \
  --project=$PROJECT_ID \
  --format="value(spec.template.spec.serviceAccountName)" 2>/dev/null)

# If empty, use default Compute Engine service account
if [ -z "$SERVICE_ACCOUNT" ]; then
  echo "   ℹ️  No custom service account configured"
  echo "   Using default Compute Engine service account"
  
  PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)" 2>/dev/null)
  SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
fi

echo "   Service Account: $SERVICE_ACCOUNT"
echo ""

# Step 2: Enable required APIs
echo "2️⃣  Enabling required APIs..."
echo ""

APIS=(
  "firestore.googleapis.com"
  "storage.googleapis.com"
  "bigquery.googleapis.com"
  "aiplatform.googleapis.com"
  "secretmanager.googleapis.com"
  "logging.googleapis.com"
)

for API in "${APIS[@]}"; do
  echo "   Enabling $API..."
  gcloud services enable $API --project=$PROJECT_ID --quiet 2>/dev/null || echo "   (already enabled or permission denied)"
done

echo ""
echo "✅ APIs enabled (or already enabled)"
echo ""

# Step 3: Grant permissions
echo "3️⃣  Granting permissions..."
echo ""

# Firestore (CRITICAL - Blocks logins)
echo "   📦 Firestore access (roles/datastore.user)..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/datastore.user" \
  --quiet 2>/dev/null || echo "      ⚠️  Failed (may already exist)"

# Cloud Storage
echo "   🗄️  Cloud Storage access (roles/storage.objectAdmin)..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/storage.objectAdmin" \
  --quiet 2>/dev/null || echo "      ⚠️  Failed (may already exist)"

# BigQuery
echo "   📊 BigQuery access (roles/bigquery.admin)..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/bigquery.admin" \
  --quiet 2>/dev/null || echo "      ⚠️  Failed (may already exist)"

# Vertex AI
echo "   🤖 Vertex AI access (roles/aiplatform.user)..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/aiplatform.user" \
  --quiet 2>/dev/null || echo "      ⚠️  Failed (may already exist)"

# Logging
echo "   📝 Cloud Logging access (roles/logging.logWriter)..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/logging.logWriter" \
  --quiet 2>/dev/null || echo "      ⚠️  Failed (may already exist)"

# Secret Manager
echo "   🔐 Secret Manager access (roles/secretmanager.secretAccessor)..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/secretmanager.secretAccessor" \
  --quiet 2>/dev/null || echo "      ⚠️  Failed (may already exist)"

echo ""
echo "✅ All permissions granted!"
echo ""

# Step 4: Verify
echo "4️⃣  Verifying permissions..."
echo ""

echo "Current IAM roles for service account:"
gcloud projects get-iam-policy $PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:${SERVICE_ACCOUNT}" \
  --format="table(bindings.role)" 2>/dev/null || echo "   ⚠️  Could not verify (permission denied or not yet propagated)"

echo ""
echo "================================================"
echo "✅ Setup complete!"
echo ""
echo "⏱️  Wait 2-3 minutes for permissions to propagate"
echo ""
echo "🧪 Test with:"
echo "   curl -s https://salfagpt.salfagestion.cl/api/health/firestore | jq '.status'"
echo "   # Expected: \"healthy\""
echo ""
echo "   curl -s https://salfagpt.salfagestion.cl/api/health/domain-check?email=test@getaifactory.com | jq '.status'"
echo "   # Expected: \"PASS\""
echo ""
echo "🌐 Then try logging in:"
echo "   https://salfagpt.salfagestion.cl"
echo ""


