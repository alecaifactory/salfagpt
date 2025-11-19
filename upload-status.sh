#!/bin/bash

# Simple upload status checker
LOG="/tmp/upload-s1-v2-continue.log"

COMPLETED=$(grep -c "✅ ARCHIVO COMPLETADO:" "$LOG" 2>/dev/null | head -1 || echo "0")
FAILED=$(grep -c "❌.*failed:" "$LOG" 2>/dev/null | head -1 || echo "0")
RETRIES=$(grep -c "⚠️.*Intento.*falló" "$LOG" 2>/dev/null | head -1 || echo "0")

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 UPLOAD STATUS - S1-v2 Agent"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⏰ $(date '+%Y-%m-%d %H:%M:%S')"
echo ""
echo "Progress: $COMPLETED / 75 files ($(echo "scale=1; $COMPLETED*100/75" | bc)%)"
echo "✅ Successful: $COMPLETED"
echo "❌ Failed: $FAILED"
echo "🔄 Retries: $RETRIES"
echo "📝 Remaining: $((75 - COMPLETED - FAILED))"
echo ""

# Show last progress from log
echo "Latest Progress:"
grep "📊 PROGRESO ACUMULADO" "$LOG" | tail -1 | head -1
grep -A 4 "📊 PROGRESO ACUMULADO" "$LOG" | tail -5 | head -4

echo ""
echo "Last 3 completed files:"
grep "✅ ARCHIVO COMPLETADO:" "$LOG" | tail -3 | sed 's/.*: /  /'

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

