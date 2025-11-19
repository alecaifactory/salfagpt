#!/bin/bash

# Quick upload status checker for S1-v2
LOG="/tmp/upload-s1-v2-complete.log"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 S1-v2 UPLOAD STATUS - $(date '+%H:%M:%S')"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Get latest progress
LATEST=$(grep "📊 PROGRESO ACUMULADO" "$LOG" | tail -1)
echo "$LATEST"

# Extract details
grep -A 4 "📊 PROGRESO ACUMULADO" "$LOG" | tail -5

echo ""
echo "Last 3 completed files:"
grep "✅ ARCHIVO COMPLETADO:" "$LOG" | tail -3 | sed 's/.*: /  ✅ /'

echo ""
echo "Failed files:"
FAILED=$(grep -c "❌.*failed:" "$LOG" 2>/dev/null || echo "0")
echo "  Total failures: $FAILED"

if [ "$FAILED" -gt "0" ]; then
    grep "❌.*failed:" "$LOG" | tail -3 | sed 's/.*❌ /  ❌ /' | cut -d' ' -f1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

