#!/bin/bash
set -e

# Configuration
export PROJECT_ID="gen-lang-client-0986191192"

echo "🔐 Setting up local authentication..."
echo ""
echo "You'll be prompted to log in with your Google account in a browser."
echo ""

# Authenticate locally
gcloud auth application-default login --project=${PROJECT_ID}

# Set default project
gcloud config set project ${PROJECT_ID}

echo ""
echo "📋 Enter your Google email address (used for local development permissions):"
read YOUR_EMAIL

echo ""
echo "Granting permissions to ${YOUR_EMAIL}..."

# Grant BigQuery permissions
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="user:${YOUR_EMAIL}" \
  --role="roles/bigquery.admin"

# Grant Vertex AI permissions
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="user:${YOUR_EMAIL}" \
  --role="roles/aiplatform.user"

# Grant Firestore permissions
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="user:${YOUR_EMAIL}" \
  --role="roles/datastore.user"

echo "✅ Your account has been granted all necessary permissions!"

echo ""
echo "🔍 Verifying your permissions..."
gcloud projects get-iam-policy ${PROJECT_ID} \
  --flatten="bindings[].members" \
  --filter="bindings.members:user:${YOUR_EMAIL}" \
  --format="table(bindings.role)"

echo ""
echo "🧪 Testing authentication..."
gcloud auth list
gcloud bigquery datasets list --project=${PROJECT_ID} 2>/dev/null || echo "Note: No BigQuery datasets exist yet (this is normal)"

echo ""
echo "✅ Local authentication setup complete!"
echo ""
echo "Next steps:"
echo "1. Ensure your .env file has GOOGLE_CLOUD_PROJECT=${PROJECT_ID}"
echo "2. Remove GOOGLE_APPLICATION_CREDENTIALS from .env (not needed!)"
echo "3. Run: npm install"
echo "4. Run: npm run dev"

