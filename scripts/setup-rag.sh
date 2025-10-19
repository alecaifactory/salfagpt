#!/bin/bash
# Setup script for RAG (Retrieval-Augmented Generation)
#
# This script:
# 1. Enables Vertex AI API
# 2. Grants necessary IAM permissions
# 3. Deploys Firestore indexes
# 4. Verifies setup

set -e

PROJECT_ID="gen-lang-client-0986191192"
SERVICE_ACCOUNT="1030147139179-compute@developer.gserviceaccount.com"
REGION="us-central1"

echo "🔍 Setting up RAG for Flow Platform"
echo "===================================="
echo ""
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo ""

# Step 1: Enable Vertex AI API
echo "1️⃣  Enabling Vertex AI API..."
gcloud services enable aiplatform.googleapis.com \
  --project=$PROJECT_ID

echo "   ✅ Vertex AI API enabled"
echo ""

# Step 2: Grant IAM permissions
echo "2️⃣  Granting IAM permissions to service account..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/aiplatform.user" \
  --no-user-output-enabled

echo "   ✅ Service account has aiplatform.user role"
echo ""

# Step 3: Deploy Firestore indexes
echo "3️⃣  Deploying Firestore indexes..."
firebase deploy --only firestore:indexes --project $PROJECT_ID --non-interactive

echo "   ✅ Firestore indexes deployed"
echo ""

# Step 4: Verify setup
echo "4️⃣  Verifying setup..."
echo ""

# Check Vertex AI API is enabled
echo "   Checking Vertex AI API..."
if gcloud services list --enabled --project=$PROJECT_ID | grep -q aiplatform.googleapis.com; then
  echo "   ✅ Vertex AI API is enabled"
else
  echo "   ❌ Vertex AI API not found"
  exit 1
fi

# Check IAM permissions
echo "   Checking IAM permissions..."
if gcloud projects get-iam-policy $PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:$SERVICE_ACCOUNT AND bindings.role:roles/aiplatform.user" \
  --format="value(bindings.role)" | grep -q "roles/aiplatform.user"; then
  echo "   ✅ Service account has correct permissions"
else
  echo "   ⚠️  Service account permissions may not be propagated yet (can take 1-2 minutes)"
fi

# Check Firestore indexes
echo "   Checking Firestore indexes..."
if firebase firestore:indexes --project $PROJECT_ID 2>/dev/null | grep -q document_chunks; then
  echo "   ✅ Firestore indexes include document_chunks"
else
  echo "   ⚠️  Indexes may still be building (check Firebase Console)"
fi

echo ""
echo "════════════════════════════════════════"
echo "✅ RAG Setup Complete!"
echo "════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "1. Start dev server: npm run dev"
echo "2. Upload a test document"
echo "3. Check console for RAG indexing logs"
echo "4. Ask a question and verify RAG search"
echo ""
echo "Console logs to look for:"
echo "  🔍 Starting RAG indexing..."
echo "  📄 Created X chunks..."
echo "  🧮 Generated X embeddings..."
echo "  ✅ RAG indexing complete"
echo ""
echo "Documentation:"
echo "  • RAG_IMPLEMENTATION_PLAN.md"
echo "  • RAG_QUICK_START.md"
echo "  • RAG_VISUAL_GUIDE.md"
echo ""

