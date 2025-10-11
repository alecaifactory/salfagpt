#!/bin/bash
# Flow - Cloud Run Deployment Script
# Project: gen-lang-client-0986191192

set -e

PROJECT_ID="gen-lang-client-0986191192"
REGION="us-central1"
SERVICE_NAME="flow"

echo "=== Flow Cloud Run Deployment ==="
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo ""

# Step 1: Set project
echo "📋 Step 1: Setting project..."
gcloud config set project $PROJECT_ID

# Step 2: Enable APIs
echo "🔧 Step 2: Enabling required APIs..."
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  containerregistry.googleapis.com

# Step 3: Build and deploy
echo "🚀 Step 3: Building and deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --source . \
  --region $REGION \
  --allow-unauthenticated \
  --platform managed \
  --set-env-vars "GOOGLE_CLOUD_PROJECT=$PROJECT_ID" \
  --set-env-vars "NODE_ENV=production" \
  --set-env-vars "VERTEX_AI_LOCATION=us-central1"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Your app will be available at the URL shown above."
echo ""
echo "⚠️  Important: Update your Google OAuth redirect URIs with the Cloud Run URL!"

