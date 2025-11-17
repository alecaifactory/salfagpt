#!/bin/bash
# Restore Firestore from Backup
# 
# EMERGENCY USE ONLY - Restores Firestore to pre-migration state
# 
# Usage:
#   ./scripts/restore-from-backup.sh <backup-path>
#   ./scripts/restore-from-backup.sh gs://salfagpt-backups/pre-userid-migration-20251115_120000

set -e

PROJECT_ID="salfagpt"

if [ -z "$1" ]; then
    echo "❌ Missing backup path argument"
    echo ""
    echo "Usage:"
    echo "   ./scripts/restore-from-backup.sh <backup-path>"
    echo ""
    echo "Example:"
    echo "   ./scripts/restore-from-backup.sh gs://salfagpt-backups/pre-userid-migration-20251115_120000"
    echo ""
    echo "Available backups:"
    gsutil ls gs://salfagpt-backups/ | grep "pre-userid-migration"
    echo ""
    exit 1
fi

BACKUP_PATH="$1"

echo "⚠️  FIRESTORE RESTORE - EMERGENCY PROCEDURE"
echo "=========================================="
echo ""
echo "This will RESTORE Firestore to a previous backup."
echo "All changes since the backup will be LOST."
echo ""
echo "Project: ${PROJECT_ID}"
echo "Backup: ${BACKUP_PATH}"
echo ""
echo "❌ THIS CANNOT BE UNDONE"
echo ""

# Prompt for confirmation
read -p "Type 'RESTORE' to confirm: " CONFIRM

if [ "${CONFIRM}" != "RESTORE" ]; then
    echo "❌ Restore cancelled"
    exit 1
fi

echo ""
echo "🚀 Starting restore operation..."
echo "This may take 10-15 minutes..."
echo ""

# Start import
gcloud firestore import "${BACKUP_PATH}" \
    --project="${PROJECT_ID}" \
    --async

echo ""
echo "✅ Restore initiated!"
echo ""
echo "📊 Check status:"
echo "   gcloud firestore operations list --project=${PROJECT_ID}"
echo ""
echo "⏳ Wait for restore to complete (10-15 minutes)"
echo ""
echo "🔍 To verify restore completion:"
echo "   ./scripts/verify-restore-complete.sh"
echo ""


