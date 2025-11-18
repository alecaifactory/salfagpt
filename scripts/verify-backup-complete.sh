#!/bin/bash
# Verify Firestore Backup Completion
# 
# Checks if the backup operation has completed successfully

set -e

PROJECT_ID="salfagpt"

echo "🔍 Checking Firestore backup operations..."
echo ""

# Get the most recent operation
LATEST_OP=$(gcloud firestore operations list \
    --project="${PROJECT_ID}" \
    --filter="metadata.operationType=EXPORT_DOCUMENTS" \
    --format="value(name)" \
    --limit=1)

if [ -z "$LATEST_OP" ]; then
    echo "❌ No backup operations found"
    echo "Please run: ./scripts/create-firestore-backup.sh"
    exit 1
fi

echo "Latest operation: ${LATEST_OP}"
echo ""

# Check operation status
STATUS=$(gcloud firestore operations describe "${LATEST_OP}" \
    --project="${PROJECT_ID}" \
    --format="value(metadata.state)")

echo "Status: ${STATUS}"
echo ""

if [ "${STATUS}" = "SUCCESSFUL" ]; then
    echo "✅ Backup completed successfully!"
    echo ""
    
    # Get backup location
    OUTPUT=$(gcloud firestore operations describe "${LATEST_OP}" \
        --project="${PROJECT_ID}" \
        --format="value(metadata.outputUriPrefix)")
    
    echo "📍 Backup location:"
    echo "   ${OUTPUT}"
    echo ""
    
    # List backed up collections
    echo "📦 Backed up collections:"
    gsutil ls "${OUTPUT}/" | grep "kind_" | sed 's/.*kind_/  - /' | sed 's/\/.*//'
    echo ""
    
    echo "✅ Safe to proceed with migration!"
    exit 0
    
elif [ "${STATUS}" = "PROCESSING" ]; then
    echo "⏳ Backup still in progress..."
    echo ""
    echo "Please wait a few more minutes and run this script again."
    exit 1
    
else
    echo "❌ Backup failed with status: ${STATUS}"
    echo ""
    echo "Please check the operation details:"
    echo "   gcloud firestore operations describe ${LATEST_OP} --project=${PROJECT_ID}"
    exit 1
fi





