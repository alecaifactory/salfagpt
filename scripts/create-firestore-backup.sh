#!/bin/bash
# Create Firestore Backup Before Migration
# 
# This script creates a complete backup of the Firestore database
# before executing the userId migration.

set -e  # Exit on error

PROJECT_ID="salfagpt"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="pre-userid-migration-${TIMESTAMP}"
BUCKET_NAME="gs://salfagpt-backups"

echo "🛡️  Creating Firestore Backup"
echo "================================"
echo "Project: ${PROJECT_ID}"
echo "Backup: ${BACKUP_NAME}"
echo "Bucket: ${BUCKET_NAME}"
echo ""

# Check if gcloud is authenticated
echo "🔐 Checking authentication..."
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "❌ Not authenticated with gcloud"
    echo "Please run: gcloud auth login"
    exit 1
fi

echo "✅ Authenticated"
echo ""

# Create backup bucket if it doesn't exist
echo "📦 Checking backup bucket..."
if ! gsutil ls "${BUCKET_NAME}" &> /dev/null; then
    echo "Creating backup bucket..."
    gsutil mb -p "${PROJECT_ID}" -l us-central1 "${BUCKET_NAME}"
    echo "✅ Bucket created"
else
    echo "✅ Bucket exists"
fi
echo ""

# Start Firestore export
echo "🚀 Starting Firestore export..."
echo "This may take 5-10 minutes for ~1000 documents..."
echo ""

gcloud firestore export "${BUCKET_NAME}/${BACKUP_NAME}" \
    --project="${PROJECT_ID}" \
    --async

echo ""
echo "✅ Backup initiated!"
echo ""
echo "📊 Check status:"
echo "   gcloud firestore operations list --project=${PROJECT_ID}"
echo ""
echo "📍 Backup location:"
echo "   ${BUCKET_NAME}/${BACKUP_NAME}"
echo ""
echo "⏳ Wait for backup to complete before running migration!"
echo "   Expected completion: 5-10 minutes"
echo ""
echo "🔍 To verify backup completion:"
echo "   gsutil ls ${BUCKET_NAME}/${BACKUP_NAME}/"
echo ""






