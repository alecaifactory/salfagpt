#!/bin/bash

# Migración Cloud Storage: us-central1 → us-east4
# Blue-Green deployment para seguridad

set -e

echo "🚀 MIGRACIÓN CLOUD STORAGE: us-central1 → us-east4"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "BLUE: salfagpt-context-documents (us-central1)"
echo "GREEN: salfagpt-context-documents-east4 (us-east4)"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# STEP 1: Create GREEN bucket
echo "📦 STEP 1: Creating GREEN bucket in us-east4..."
gsutil mb -l us-east4 -p salfagpt gs://salfagpt-context-documents-east4 2>&1 || echo "Bucket may already exist"
echo "✅ Bucket created"
echo ""

# STEP 2: Copy permissions
echo "🔐 STEP 2: Copying IAM permissions..."
gsutil iam get gs://salfagpt-context-documents > /tmp/bucket-iam.json
gsutil iam set /tmp/bucket-iam.json gs://salfagpt-context-documents-east4
echo "✅ Permissions copied"
echo ""

# STEP 3: Check size
echo "📊 STEP 3: Checking data size..."
echo ""
echo "BLUE (us-central1):"
gsutil du -sh gs://salfagpt-context-documents
echo ""

# STEP 4: Copy data (rsync for safety)
echo "📥 STEP 4: Copying data (this may take 10-30 minutes)..."
echo "Using gsutil -m rsync for parallel transfer..."
echo ""

gsutil -m rsync -r \
  gs://salfagpt-context-documents \
  gs://salfagpt-context-documents-east4

echo ""
echo "✅ Data copied"
echo ""

# STEP 5: Verify
echo "🔍 STEP 5: Verifying copy..."
echo ""
echo "BLUE (us-central1):"
gsutil du -sh gs://salfagpt-context-documents
echo ""
echo "GREEN (us-east4):"
gsutil du -sh gs://salfagpt-context-documents-east4
echo ""

# STEP 6: Test access
echo "🧪 STEP 6: Testing file access..."
echo "Listing first 5 files in GREEN:"
gsutil ls gs://salfagpt-context-documents-east4/** | head -5
echo ""

echo "═══════════════════════════════════════════════════════════════"
echo "✅ MIGRATION COMPLETE"
echo ""
echo "GREEN bucket ready:"
echo "  Name: salfagpt-context-documents-east4"
echo "  Location: us-east4 ✅"
echo "  Same as: Cloud Run + BigQuery"
echo ""
echo "Next steps:"
echo "  1. Update code: BUCKET_NAME with feature flag"
echo "  2. Test localhost"
echo "  3. Deploy production"
echo "  4. Keep BLUE for 30 days (rollback safety)"
echo "═══════════════════════════════════════════════════════════════"




