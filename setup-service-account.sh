#!/bin/bash
set -e

# Configuration
export PROJECT_ID="gen-lang-client-0986191192"
export SERVICE_ACCOUNT_EMAIL="openflow-service@${PROJECT_ID}.iam.gserviceaccount.com"

echo "🚀 Creating service account (no keys needed)..."

# Create service account
gcloud iam service-accounts create openflow-service \
  --display-name="OpenFlow Service Account" \
  --description="Service account for OpenFlow with BigQuery, Vertex AI, and Firestore access" \
  --project=${PROJECT_ID}

echo "✅ Service account created: ${SERVICE_ACCOUNT_EMAIL}"

echo ""
echo "📋 Granting permissions..."

# Grant BigQuery permissions
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
  --role="roles/bigquery.admin"

# Grant Vertex AI permissions
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
  --role="roles/aiplatform.user"

# Grant Firestore permissions
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
  --role="roles/datastore.user"

# Grant logging permissions
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
  --role="roles/logging.logWriter"

echo "✅ All permissions granted!"

echo ""
echo "🔍 Verifying permissions..."
gcloud projects get-iam-policy ${PROJECT_ID} \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
  --format="table(bindings.role)"

echo ""
echo "✅ Service account setup complete!"
echo ""
echo "Next steps:"
echo "1. Run: ./setup-local-auth.sh"
echo "2. Update your .env file (remove GOOGLE_APPLICATION_CREDENTIALS)"
echo "3. Run: npm run dev"

