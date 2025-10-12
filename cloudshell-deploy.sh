#!/bin/bash
# Flow - Cloud Shell Deployment Script
# Run this in Google Cloud Shell after uploading flow-deploy.zip

set -e

echo "🚀 Flow Cloud Shell Deployment"
echo "==================================="
echo ""

# Unzip if needed
if [ ! -d "flow" ]; then
  echo "📦 Extracting flow-deploy.zip..."
  unzip -q flow-deploy.zip
fi

cd flow

echo "📋 Project: gen-lang-client-0986191192"
echo "📍 Region: us-central1"
echo ""

# Deploy
echo "🔨 Deploying to Cloud Run..."
gcloud run deploy flow \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "GOOGLE_CLOUD_PROJECT=gen-lang-client-0986191192,NODE_ENV=production,VERTEX_AI_LOCATION=us-central1" \
  --max-instances=10 \
  --memory=512Mi \
  --cpu=1 \
  --port=8080

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. Copy the Service URL from above"
echo "2. Update Google OAuth redirect URIs with this URL"
echo "3. Test your application!"

