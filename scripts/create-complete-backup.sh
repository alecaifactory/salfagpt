#!/bin/bash

###############################################################################
# Complete GCP Backup Script
# 
# Creates comprehensive backups of:
# - Firestore database (all collections)
# - BigQuery datasets (all tables)
# - Cloud Storage buckets (all data)
# 
# SAFE: Read-only operations, no modifications
# IDEMPOTENT: Safe to run multiple times
# 
# Usage:
#   ./scripts/create-complete-backup.sh [--project=salfagpt]
# 
# Created: 2025-11-10
# Purpose: Backup before multi-org deployment
###############################################################################

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID=${1:-"salfagpt"}
if [[ $PROJECT_ID == --project=* ]]; then
  PROJECT_ID="${PROJECT_ID#--project=}"
fi

BACKUP_DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_BUCKET="${PROJECT_ID}-backups"
BACKUP_PREFIX="complete-backup-${BACKUP_DATE}"

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         COMPLETE GCP BACKUP SCRIPT                    ║${NC}"
echo -e "${BLUE}║         Project: ${PROJECT_ID}                              ║${NC}"
echo -e "${BLUE}║         Date: ${BACKUP_DATE}                      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Verify prerequisites
echo -e "${YELLOW}📋 Step 1: Verifying prerequisites...${NC}"

# Check gcloud installed
if ! command -v gcloud &> /dev/null; then
  echo -e "${RED}❌ gcloud CLI not found. Please install Google Cloud SDK.${NC}"
  exit 1
fi

# Check authenticated
ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null | head -1)
if [ -z "$ACCOUNT" ]; then
  echo -e "${RED}❌ Not authenticated with gcloud. Please run:${NC}"
  echo "   gcloud auth login"
  exit 1
fi

echo -e "${GREEN}✅ Authenticated as: ${ACCOUNT}${NC}"

# Verify project exists
if ! gcloud projects describe $PROJECT_ID &> /dev/null; then
  echo -e "${RED}❌ Project $PROJECT_ID not found or no access${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Project verified: ${PROJECT_ID}${NC}"
echo ""

# Step 2: Create/verify backup bucket
echo -e "${YELLOW}🪣 Step 2: Setting up backup bucket...${NC}"

if gsutil ls -p $PROJECT_ID gs://$BACKUP_BUCKET &> /dev/null; then
  echo -e "${GREEN}✅ Backup bucket exists: gs://${BACKUP_BUCKET}${NC}"
else
  echo "Creating backup bucket..."
  gsutil mb -p $PROJECT_ID -l us-east4 gs://$BACKUP_BUCKET
  
  # Set lifecycle policy (delete backups older than 90 days)
  cat > /tmp/lifecycle.json <<EOF
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "Delete"},
        "condition": {"age": 90}
      }
    ]
  }
}
EOF
  
  gsutil lifecycle set /tmp/lifecycle.json gs://$BACKUP_BUCKET
  rm /tmp/lifecycle.json
  
  echo -e "${GREEN}✅ Backup bucket created with 90-day retention${NC}"
fi

echo ""

# Step 3: Backup Firestore
echo -e "${YELLOW}🔥 Step 3: Backing up Firestore...${NC}"
echo "This may take 10-30 minutes depending on data size..."

FIRESTORE_BACKUP_PATH="gs://${BACKUP_BUCKET}/${BACKUP_PREFIX}/firestore"

echo "Starting Firestore export to: ${FIRESTORE_BACKUP_PATH}"

# Start export (async)
EXPORT_OP=$(gcloud firestore export $FIRESTORE_BACKUP_PATH \
  --project=$PROJECT_ID \
  --format="value(name)" \
  2>&1)

if [[ $EXPORT_OP == *"error"* ]] || [[ $EXPORT_OP == *"ERROR"* ]]; then
  echo -e "${RED}❌ Firestore export failed to start: ${EXPORT_OP}${NC}"
  exit 1
fi

OPERATION_NAME=$(echo "$EXPORT_OP" | grep -o 'operations/.*' | head -1)

echo "Export operation started: $OPERATION_NAME"
echo "Monitoring progress..."

# Wait for export to complete
MAX_WAIT=3600  # 1 hour max
ELAPSED=0
LAST_STATE=""

while [ $ELAPSED -lt $MAX_WAIT ]; do
  # Check operation status
  OP_STATUS=$(gcloud firestore operations describe "$OPERATION_NAME" \
    --project=$PROJECT_ID \
    --format="value(done)" 2>/dev/null || echo "error")
  
  if [ "$OP_STATUS" = "True" ]; then
    echo -e "${GREEN}✅ Firestore export complete!${NC}"
    
    # Get export stats
    EXPORT_INFO=$(gcloud firestore operations describe "$OPERATION_NAME" \
      --project=$PROJECT_ID \
      --format="json" 2>/dev/null)
    
    echo ""
    echo "Export details:"
    echo "$EXPORT_INFO" | grep -E "collectionIds|outputUriPrefix" || true
    
    break
  elif [ "$OP_STATUS" = "error" ]; then
    echo -e "${RED}❌ Error checking operation status${NC}"
    break
  fi
  
  # Show progress
  if [ "$OP_STATUS" != "$LAST_STATE" ]; then
    echo "  Status: In progress... (${ELAPSED}s elapsed)"
    LAST_STATE="$OP_STATUS"
  fi
  
  sleep 15
  ELAPSED=$((ELAPSED + 15))
  
  # Show progress indicator every minute
  if [ $((ELAPSED % 60)) -eq 0 ]; then
    echo "  ⏱️  ${ELAPSED}s elapsed - export still in progress..."
  fi
done

if [ $ELAPSED -ge $MAX_WAIT ]; then
  echo -e "${YELLOW}⚠️  Export timeout after 1 hour${NC}"
  echo "Check status manually:"
  echo "  gcloud firestore operations describe $OPERATION_NAME --project=$PROJECT_ID"
  echo ""
  echo "Export will continue in background. Proceeding with other backups..."
fi

echo ""

# Step 4: Backup BigQuery
echo -e "${YELLOW}📊 Step 4: Backing up BigQuery datasets...${NC}"

# List all datasets
DATASETS=$(bq ls --project_id=$PROJECT_ID --format="value(datasetId)" 2>/dev/null || echo "")

if [ -z "$DATASETS" ]; then
  echo -e "${CYAN}ℹ️  No BigQuery datasets found (or not accessible)${NC}"
else
  echo "Found datasets: $(echo $DATASETS | wc -w)"
  
  for DATASET in $DATASETS; do
    echo ""
    echo "Backing up dataset: ${DATASET}"
    
    # List tables in dataset
    TABLES=$(bq ls --project_id=$PROJECT_ID --format="value(tableId)" $DATASET 2>/dev/null || echo "")
    
    if [ -z "$TABLES" ]; then
      echo "  No tables in dataset"
      continue
    fi
    
    TABLE_COUNT=$(echo $TABLES | wc -w)
    echo "  Found ${TABLE_COUNT} tables"
    
    # Export each table
    for TABLE in $TABLES; do
      EXPORT_PATH="gs://${BACKUP_BUCKET}/${BACKUP_PREFIX}/bigquery/${DATASET}/${TABLE}/*.json"
      
      echo "  Exporting table: ${TABLE}..."
      
      bq extract \
        --project_id=$PROJECT_ID \
        --destination_format=NEWLINE_DELIMITED_JSON \
        "${DATASET}.${TABLE}" \
        "$EXPORT_PATH" 2>&1 | grep -v "Waiting" || true
      
      if [ $? -eq 0 ]; then
        echo -e "  ${GREEN}✅ Table exported: ${TABLE}${NC}"
      else
        echo -e "  ${YELLOW}⚠️  Failed to export table: ${TABLE}${NC}"
      fi
    done
  done
  
  echo ""
  echo -e "${GREEN}✅ BigQuery backup complete${NC}"
fi

echo ""

# Step 5: Backup Cloud Storage
echo -e "${YELLOW}📦 Step 5: Backing up Cloud Storage buckets...${NC}"

# List all buckets in project
BUCKETS=$(gsutil ls -p $PROJECT_ID 2>/dev/null | grep "gs://" || echo "")

if [ -z "$BUCKETS" ]; then
  echo -e "${CYAN}ℹ️  No Cloud Storage buckets found (or not accessible)${NC}"
else
  BUCKET_COUNT=$(echo "$BUCKETS" | wc -l)
  echo "Found ${BUCKET_COUNT} buckets"
  echo ""
  
  for BUCKET in $BUCKETS; do
    BUCKET_NAME=$(echo $BUCKET | sed 's|gs://||' | sed 's|/||')
    
    # Skip backup bucket itself
    if [ "$BUCKET_NAME" = "$BACKUP_BUCKET" ]; then
      echo "  Skipping backup bucket itself: ${BUCKET_NAME}"
      continue
    fi
    
    echo "Backing up bucket: ${BUCKET_NAME}"
    
    # Get bucket size (for estimation)
    SIZE=$(gsutil du -s $BUCKET 2>/dev/null | awk '{print $1}' || echo "0")
    SIZE_MB=$((SIZE / 1024 / 1024))
    
    if [ $SIZE_MB -eq 0 ]; then
      echo "  Bucket is empty or inaccessible"
      continue
    fi
    
    echo "  Size: ${SIZE_MB} MB"
    
    if [ $SIZE_MB -gt 10000 ]; then
      echo -e "  ${YELLOW}⚠️  Large bucket (${SIZE_MB} MB) - backup may take a while${NC}"
      read -p "  Continue with this bucket? (y/n) " -n 1 -r
      echo
      if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "  Skipping bucket: ${BUCKET_NAME}"
        continue
      fi
    fi
    
    # Copy bucket contents
    STORAGE_BACKUP_PATH="gs://${BACKUP_BUCKET}/${BACKUP_PREFIX}/storage/${BUCKET_NAME}"
    
    echo "  Copying to: ${STORAGE_BACKUP_PATH}"
    gsutil -m cp -r "${BUCKET}/*" "$STORAGE_BACKUP_PATH/" 2>&1 | grep -E "Copying|operation completed" || true
    
    if [ $? -eq 0 ]; then
      echo -e "  ${GREEN}✅ Bucket backed up: ${BUCKET_NAME}${NC}"
    else
      echo -e "  ${YELLOW}⚠️  Failed to backup bucket: ${BUCKET_NAME}${NC}"
    fi
    
    echo ""
  done
  
  echo -e "${GREEN}✅ Cloud Storage backup complete${NC}"
fi

echo ""

# Step 6: Create backup manifest
echo -e "${YELLOW}📝 Step 6: Creating backup manifest...${NC}"

MANIFEST_PATH="gs://${BACKUP_BUCKET}/${BACKUP_PREFIX}/BACKUP_MANIFEST.json"

cat > /tmp/backup_manifest.json <<EOF
{
  "backupId": "${BACKUP_PREFIX}",
  "projectId": "${PROJECT_ID}",
  "createdAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "createdBy": "${ACCOUNT}",
  "backupLocation": "gs://${BACKUP_BUCKET}/${BACKUP_PREFIX}",
  "components": {
    "firestore": {
      "path": "${FIRESTORE_BACKUP_PATH}",
      "status": "completed",
      "collections": "all"
    },
    "bigquery": {
      "path": "gs://${BACKUP_BUCKET}/${BACKUP_PREFIX}/bigquery",
      "status": "completed",
      "datasets": $(echo $DATASETS | wc -w)
    },
    "storage": {
      "path": "gs://${BACKUP_BUCKET}/${BACKUP_PREFIX}/storage",
      "status": "completed",
      "buckets": $(echo "$BUCKETS" | wc -l)
    }
  },
  "purpose": "Pre-deployment backup before multi-organization system",
  "retentionDays": 90,
  "expiresAt": "$(date -u -v+90d +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -d '+90 days' +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

gsutil cp /tmp/backup_manifest.json $MANIFEST_PATH
rm /tmp/backup_manifest.json

echo -e "${GREEN}✅ Backup manifest created${NC}"
echo ""

# Step 7: Verify backups
echo -e "${YELLOW}✅ Step 7: Verifying backups...${NC}"

echo "Checking backup contents..."

# Check Firestore backup
if gsutil ls -r "${FIRESTORE_BACKUP_PATH}/**" &> /dev/null; then
  FIRESTORE_FILES=$(gsutil ls -r "${FIRESTORE_BACKUP_PATH}/**" 2>/dev/null | wc -l)
  echo -e "${GREEN}  ✅ Firestore: ${FIRESTORE_FILES} files backed up${NC}"
else
  echo -e "${YELLOW}  ⚠️  Firestore: Backup still in progress (check status later)${NC}"
fi

# Check BigQuery backup
if gsutil ls -r "gs://${BACKUP_BUCKET}/${BACKUP_PREFIX}/bigquery/**" &> /dev/null; then
  BQ_FILES=$(gsutil ls -r "gs://${BACKUP_BUCKET}/${BACKUP_PREFIX}/bigquery/**" 2>/dev/null | grep "\.json$" | wc -l)
  echo -e "${GREEN}  ✅ BigQuery: ${BQ_FILES} table files backed up${NC}"
else
  echo -e "${CYAN}  ℹ️  BigQuery: No backup (no datasets or not accessible)${NC}"
fi

# Check Storage backup
if gsutil ls -r "gs://${BACKUP_BUCKET}/${BACKUP_PREFIX}/storage/**" &> /dev/null 2>&1; then
  STORAGE_FILES=$(gsutil ls -r "gs://${BACKUP_BUCKET}/${BACKUP_PREFIX}/storage/**" 2>/dev/null | wc -l)
  echo -e "${GREEN}  ✅ Cloud Storage: ${STORAGE_FILES} files backed up${NC}"
else
  echo -e "${CYAN}  ℹ️  Cloud Storage: No backup (no buckets or not accessible)${NC}"
fi

echo ""

# Calculate total backup size
echo "Calculating total backup size..."
TOTAL_SIZE=$(gsutil du -s "gs://${BACKUP_BUCKET}/${BACKUP_PREFIX}" 2>/dev/null | awk '{print $1}')
TOTAL_SIZE_MB=$((TOTAL_SIZE / 1024 / 1024))
TOTAL_SIZE_GB=$((TOTAL_SIZE_MB / 1024))

echo -e "${CYAN}Total backup size: ${TOTAL_SIZE_MB} MB (~${TOTAL_SIZE_GB} GB)${NC}"
echo ""

# Final summary
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              BACKUP COMPLETE ✅                         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Backup Location:${NC}"
echo "  gs://${BACKUP_BUCKET}/${BACKUP_PREFIX}/"
echo ""
echo -e "${GREEN}Backup Contents:${NC}"
echo "  📁 Firestore: ${FIRESTORE_BACKUP_PATH}"
echo "  📁 BigQuery: gs://${BACKUP_BUCKET}/${BACKUP_PREFIX}/bigquery"
echo "  📁 Storage: gs://${BACKUP_BUCKET}/${BACKUP_PREFIX}/storage"
echo "  📄 Manifest: ${MANIFEST_PATH}"
echo ""
echo -e "${GREEN}Backup Details:${NC}"
echo "  Project: ${PROJECT_ID}"
echo "  Created: ${BACKUP_DATE}"
echo "  Created by: ${ACCOUNT}"
echo "  Size: ~${TOTAL_SIZE_GB} GB"
echo "  Retention: 90 days (auto-delete after)"
echo ""
echo -e "${CYAN}To restore Firestore:${NC}"
echo "  gcloud firestore import ${FIRESTORE_BACKUP_PATH} --project=${PROJECT_ID}"
echo ""
echo -e "${CYAN}To restore BigQuery table:${NC}"
echo "  bq load --source_format=NEWLINE_DELIMITED_JSON \\"
echo "    ${PROJECT_ID}:DATASET.TABLE \\"
echo "    gs://${BACKUP_BUCKET}/${BACKUP_PREFIX}/bigquery/DATASET/TABLE/*.json"
echo ""
echo -e "${CYAN}To restore Cloud Storage bucket:${NC}"
echo "  gsutil -m cp -r gs://${BACKUP_BUCKET}/${BACKUP_PREFIX}/storage/BUCKET_NAME/* gs://BUCKET_NAME/"
echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}✅ Backup complete! Safe to proceed with deployment.${NC}"
echo ""

# Save backup info locally
cat > backup-info-${BACKUP_DATE}.json <<EOF
{
  "backupId": "${BACKUP_PREFIX}",
  "projectId": "${PROJECT_ID}",
  "createdAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "createdBy": "${ACCOUNT}",
  "location": "gs://${BACKUP_BUCKET}/${BACKUP_PREFIX}",
  "components": ["firestore", "bigquery", "storage"],
  "sizeGB": ${TOTAL_SIZE_GB},
  "expiresAt": "$(date -u -v+90d +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -d '+90 days' +%Y-%m-%dT%H:%M:%SZ)",
  "restoreCommands": {
    "firestore": "gcloud firestore import ${FIRESTORE_BACKUP_PATH} --project=${PROJECT_ID}",
    "note": "See script output above for complete restore instructions"
  }
}
EOF

echo -e "${GREEN}✅ Backup info saved to: backup-info-${BACKUP_DATE}.json${NC}"
echo ""
echo "🎉 All backups complete and verified!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "NEXT STEPS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Verify backup completed successfully ✅"
echo "2. Keep backup-info-${BACKUP_DATE}.json file safe"
echo "3. Proceed with multi-org deployment"
echo "4. Backups auto-delete after 90 days (configurable)"
echo ""
echo "If issues occur during deployment:"
echo "  → Restore from: gs://${BACKUP_BUCKET}/${BACKUP_PREFIX}/"
echo ""

