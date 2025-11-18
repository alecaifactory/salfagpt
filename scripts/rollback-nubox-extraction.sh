#!/bin/bash

# Rollback Script for Nubox Extraction
# Use this if the new implementation causes issues

set -e

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║           ROLLBACK NUBOX EXTRACTION                           ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Find the most recent backup
BACKUP_FILE=$(ls -t src/lib/nubox-cartola-extraction.backup-*.ts 2>/dev/null | head -1)

if [ -z "$BACKUP_FILE" ]; then
    echo "❌ ERROR: No backup file found!"
    echo "   Looking for: src/lib/nubox-cartola-extraction.backup-*.ts"
    exit 1
fi

echo "📁 Found backup: $BACKUP_FILE"
echo ""

# Show what will happen
echo "This will:"
echo "  1. Backup current version → src/lib/nubox-cartola-extraction.rollback-$(date +%Y%m%d-%H%M%S).ts"
echo "  2. Restore old version from → $BACKUP_FILE"
echo ""

read -p "Continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "❌ Rollback cancelled"
    exit 0
fi

# Backup current (new) version
echo ""
echo "📦 Backing up current version..."
cp src/lib/nubox-cartola-extraction.ts "src/lib/nubox-cartola-extraction.rollback-$(date +%Y%m%d-%H%M%S).ts"

# Restore old version
echo "⏮️  Restoring old version..."
cp "$BACKUP_FILE" src/lib/nubox-cartola-extraction.ts

echo ""
echo "✅ ROLLBACK COMPLETE!"
echo ""
echo "Changes:"
echo "  ✅ Old version restored"
echo "  ✅ New version saved as rollback file"
echo "  ✅ Original backup preserved"
echo ""
echo "To redo the upgrade, run:"
echo "  bash scripts/apply-nubox-fix.sh"
echo ""

