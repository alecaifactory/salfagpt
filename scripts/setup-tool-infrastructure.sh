#!/bin/bash
# Setup Tool Manager Infrastructure
# Creates GCS buckets and Cloud Function

set -e

PROJECT_ID="gen-lang-client-0986191192"
REGION="us-central1"

echo "🔧 Setting up Tool Manager infrastructure..."
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo ""

# 1. Create GCS bucket for tool outputs
echo "1️⃣  Creating GCS bucket for tool outputs..."
gsutil mb -p $PROJECT_ID -l $REGION gs://salfagpt-tool-outputs 2>/dev/null || echo "   Bucket already exists"
gsutil lifecycle set /dev/stdin gs://salfagpt-tool-outputs <<EOF
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "Delete"},
        "condition": {"age": 30}
      }
    ]
  }
}
EOF
echo "   ✅ Bucket created with 30-day auto-delete policy"
echo ""

# 2. Grant Cloud Function access to buckets
echo "2️⃣  Configuring IAM permissions..."
SERVICE_ACCOUNT="$PROJECT_ID@appspot.gserviceaccount.com"

gsutil iam ch serviceAccount:$SERVICE_ACCOUNT:objectAdmin gs://salfagpt-uploads
gsutil iam ch serviceAccount:$SERVICE_ACCOUNT:objectAdmin gs://salfagpt-tool-outputs

echo "   ✅ Cloud Function can read/write to buckets"
echo ""

# 3. Deploy Cloud Function
echo "3️⃣  Deploying PDF Splitter Cloud Function..."
cd functions/pdf-splitter

# Install dependencies
npm install

# Build TypeScript
npm run build

# Deploy
gcloud functions deploy pdf-splitter-tool \
  --gen2 \
  --runtime=nodejs20 \
  --region=$REGION \
  --source=. \
  --entry-point=splitPDF \
  --trigger-http \
  --allow-unauthenticated \
  --memory=4GB \
  --timeout=540s \
  --max-instances=10 \
  --project=$PROJECT_ID

echo ""
echo "✅ PDF Splitter Cloud Function deployed!"
echo ""

# 4. Get function URL
FUNCTION_URL=$(gcloud functions describe pdf-splitter-tool \
  --region=$REGION \
  --project=$PROJECT_ID \
  --format='value(serviceConfig.uri)')

echo "📌 Function URL: $FUNCTION_URL"
echo ""
echo "💡 Add to .env:"
echo "PDF_SPLITTER_FUNCTION_URL=$FUNCTION_URL"
echo ""

# 5. Test function
echo "5️⃣  Testing Cloud Function..."
echo "   (Skipping - requires test PDF file)"
echo ""

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Add PDF_SPLITTER_FUNCTION_URL to .env"
echo "2. Restart dev server: npm run dev"
echo "3. Test with large PDF (>50MB)"


