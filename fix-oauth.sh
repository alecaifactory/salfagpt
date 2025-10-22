#!/bin/bash
# OAuth Fix Script for Salfacorp Production
# Run this after verifying the correct Client Secret in Google Console

set -e

echo "🔐 OAuth Configuration Fix for Salfacorp"
echo "========================================"
echo ""

# Check if we're authenticated
if ! gcloud auth list --filter="status:ACTIVE" | grep -q "@"; then
  echo "❌ Not authenticated with gcloud"
  echo "Run: gcloud auth login"
  exit 1
fi

# Check project
CURRENT_PROJECT=$(gcloud config get-value project)
if [ "$CURRENT_PROJECT" != "salfagpt" ]; then
  echo "⚠️  Current project: $CURRENT_PROJECT"
  echo "Setting project to: salfagpt"
  gcloud config set project salfagpt
fi

echo "✅ Project: salfagpt"
echo ""

# Show current OAuth config
echo "📋 Current OAuth Configuration in Cloud Run:"
echo "============================================"
gcloud run services describe salfagpt \
  --region us-central1 \
  --project salfagpt \
  --format="json" | jq -r '.spec.template.spec.containers[0].env[] | select(.name | startswith("GOOGLE_CLIENT") or .name == "PUBLIC_BASE_URL") | "\(.name)=\(.value)"'

echo ""
echo "📋 What Should Be Configured:"
echo "============================="
echo "GOOGLE_CLIENT_ID=82892384200-va003qnnoj9q0jf19j3jf0vects0st9h.apps.googleusercontent.com"
echo "GOOGLE_CLIENT_SECRET=[SECRET from Google Console]"
echo "PUBLIC_BASE_URL=https://salfagpt-3snj65wckq-uc.a.run.app"
echo ""

# Check if user wants to update
read -p "Do you want to update the OAuth Client Secret? (yes/no): " -r
echo
if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
  echo "Cancelled. No changes made."
  exit 0
fi

# Get the correct secret
echo ""
echo "🔑 Enter the CORRECT Client Secret from Google Console:"
echo "   (Go to: https://console.cloud.google.com/apis/credentials?project=salfagpt)"
echo "   (Find OAuth client and click 'SHOW CLIENT SECRET')"
echo ""
read -p "Client Secret (starts with GOCSPX-): " CLIENT_SECRET

if [ -z "$CLIENT_SECRET" ]; then
  echo "❌ No secret provided. Exiting."
  exit 1
fi

# Validate format
if [[ ! $CLIENT_SECRET =~ ^GOCSPX- ]]; then
  echo "⚠️  Warning: Secret doesn't start with GOCSPX-"
  read -p "Continue anyway? (yes/no): " -r
  if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
    exit 1
  fi
fi

# Update Cloud Run
echo ""
echo "🚀 Updating Cloud Run with new Client Secret..."
gcloud run services update salfagpt \
  --region us-central1 \
  --project salfagpt \
  --update-env-vars="GOOGLE_CLIENT_SECRET=$CLIENT_SECRET"

echo ""
echo "✅ Cloud Run updated successfully!"
echo ""
echo "⏳ Waiting 30 seconds for deployment to stabilize..."
sleep 30

echo ""
echo "🧪 Testing OAuth configuration..."
echo ""

# Test health endpoint
echo "1️⃣  Health Check:"
curl -s https://salfagpt-3snj65wckq-uc.a.run.app/api/health/firestore | jq -r '.status'

echo ""
echo "2️⃣  Login Page:"
curl -s -I https://salfagpt-3snj65wckq-uc.a.run.app/auth/login | grep "HTTP"

echo ""
echo "✅ Basic endpoints working!"
echo ""
echo "🎯 Next Steps:"
echo "============="
echo "1. Clear browser cache and cookies for: salfagpt-3snj65wckq-uc.a.run.app"
echo "2. Visit: https://salfagpt-3snj65wckq-uc.a.run.app"
echo "3. Click 'Continue with Google'"
echo "4. Complete login flow"
echo ""
echo "If still failing, check Cloud Run logs:"
echo "gcloud logging read 'resource.type=cloud_run_revision AND resource.labels.service_name=salfagpt AND severity>=ERROR' --limit=10 --project=salfagpt"
echo ""

