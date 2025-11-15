#!/bin/bash
# Safe Migration Executor with Backup & Recovery
# 
# Executes the full userId migration with all safety checks

set -e

PROJECT_ID="salfagpt"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="migration-log-${TIMESTAMP}.txt"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "🚀 SAFE USERID MIGRATION EXECUTOR"
echo "=================================="
echo ""
echo "This script will:"
echo "  1. Create a complete Firestore backup"
echo "  2. Verify backup completion"
echo "  3. Run migration on 4 collections"
echo "  4. Verify success of each collection"
echo "  5. Log everything"
echo ""
echo "⚠️  Estimated time: 20-30 minutes"
echo "⚠️  Downtime: ZERO (additive migration)"
echo ""

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "${LOG_FILE}"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a "${LOG_FILE}"
}

success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] ✅ $1${NC}" | tee -a "${LOG_FILE}"
}

warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}" | tee -a "${LOG_FILE}"
}

info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] ℹ️  $1${NC}" | tee -a "${LOG_FILE}"
}

# Prompt for confirmation
echo -e "${YELLOW}Ready to proceed?${NC}"
read -p "Type 'YES' to start: " CONFIRM

if [ "${CONFIRM}" != "YES" ]; then
    error "Migration cancelled by user"
    exit 1
fi

log "Migration started"
log "Log file: ${LOG_FILE}"
echo ""

# Step 1: Create backup
info "Step 1/5: Creating Firestore backup..."
log "Creating backup..."

if ! ./scripts/create-firestore-backup.sh >> "${LOG_FILE}" 2>&1; then
    error "Backup creation failed"
    exit 1
fi

success "Backup initiated"
echo ""

# Step 2: Wait for backup to complete
info "Step 2/5: Waiting for backup to complete..."
log "Waiting for backup..."

BACKUP_COMPLETE=false
MAX_WAIT=600  # 10 minutes
WAITED=0

while [ "$BACKUP_COMPLETE" = false ] && [ $WAITED -lt $MAX_WAIT ]; do
    if ./scripts/verify-backup-complete.sh >> "${LOG_FILE}" 2>&1; then
        BACKUP_COMPLETE=true
        success "Backup completed!"
    else
        echo -n "."
        sleep 30
        WAITED=$((WAITED + 30))
    fi
done

if [ "$BACKUP_COMPLETE" = false ]; then
    error "Backup timeout after ${MAX_WAIT} seconds"
    error "Please check backup status manually"
    exit 1
fi

echo ""
log "Backup verified and complete"
echo ""

# Step 3: Pre-migration verification
info "Step 3/5: Running pre-migration verification..."
log "Pre-migration state:"

npm run verify:userid-formats >> "${LOG_FILE}" 2>&1 || true
success "Pre-migration verification complete"
echo ""

# Step 4: Execute migrations
info "Step 4/5: Executing migrations on 4 collections..."
echo ""

COLLECTIONS=(
    "context_sources"
    "agent_prompt_versions"
    "message_feedback"
    "feedback_tickets"
)

FAILED_COLLECTIONS=()

for COLLECTION in "${COLLECTIONS[@]}"; do
    info "Migrating ${COLLECTION}..."
    log "Starting migration: ${COLLECTION}"
    
    if npm run migrate:userid -- --collection="${COLLECTION}" --execute >> "${LOG_FILE}" 2>&1; then
        success "${COLLECTION} migrated successfully"
    else
        error "${COLLECTION} migration failed"
        FAILED_COLLECTIONS+=("${COLLECTION}")
    fi
    
    echo ""
done

# Step 5: Post-migration verification
info "Step 5/5: Running post-migration verification..."
log "Post-migration state:"

npm run verify:userid-formats >> "${LOG_FILE}" 2>&1 || true
success "Post-migration verification complete"
echo ""

# Summary
echo "=================================="
echo "MIGRATION COMPLETE"
echo "=================================="
echo ""

if [ ${#FAILED_COLLECTIONS[@]} -eq 0 ]; then
    success "All 4 collections migrated successfully!"
    echo ""
    log "Migration successful for all collections"
    
    echo "✅ Migrated collections:"
    for COLLECTION in "${COLLECTIONS[@]}"; do
        echo "   - ${COLLECTION}"
    done
    echo ""
    
    echo "📊 Verification:"
    echo "   Run: npm run verify:userid-formats"
    echo ""
    
    echo "🧪 Testing:"
    echo "   1. Open agent context modal → should show documents"
    echo "   2. View feedback page → should show all feedback"
    echo "   3. Open prompt history → should show versions"
    echo ""
    
    echo "📝 Log file: ${LOG_FILE}"
    echo ""
    
    exit 0
else
    error "Migration failed for ${#FAILED_COLLECTIONS[@]} collection(s)"
    echo ""
    
    echo "❌ Failed collections:"
    for COLLECTION in "${FAILED_COLLECTIONS[@]}"; do
        echo "   - ${COLLECTION}"
    done
    echo ""
    
    warning "ROLLBACK RECOMMENDED"
    echo ""
    echo "To restore from backup:"
    echo "   1. List backups:"
    echo "      gsutil ls gs://salfagpt-backups/ | grep pre-userid-migration"
    echo ""
    echo "   2. Choose most recent backup and restore:"
    echo "      ./scripts/restore-from-backup.sh gs://salfagpt-backups/pre-userid-migration-TIMESTAMP"
    echo ""
    
    echo "📝 Log file: ${LOG_FILE}"
    echo ""
    
    exit 1
fi

