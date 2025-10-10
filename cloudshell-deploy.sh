#!/bin/bash
# SalfaGPT - Cloud Shell Deployment Script
# Run this in Google Cloud Shell after uploading salfagpt-deploy.zip

set -e

echo "🚀 SalfaGPT Cloud Shell Deployment"
echo "==================================="
echo ""

# Unzip if needed
if [ ! -d "salfagpt" ]; then
  echo "📦 Extracting salfagpt-deploy.zip..."
  unzip -q salfagpt-deploy.zip
fi

cd salfagpt

echo "📋 Project: gen-lang-client-0986191192"
echo "📍 Region: us-central1"
echo ""

# Deploy
echo "🔨 Deploying to Cloud Run..."
gcloud run deploy salfagpt \
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

