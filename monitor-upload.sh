#!/bin/bash

# Monitor upload progress for S1-v2 agent
LOG_FILE="/tmp/upload-s1-v2-continue.log"

echo "=================================================="
echo "   UPLOAD PROGRESS MONITOR - S1-v2 Agent"
echo "=================================================="
echo ""

# Wait for log file to exist
if [ ! -f "$LOG_FILE" ]; then
  echo "⏳ Waiting for upload process to start..."
  sleep 5
fi

# Check if process is still running
PROCESS_RUNNING=$(ps aux | grep "cli/commands/upload.ts" | grep -v grep | wc -l)

if [ $PROCESS_RUNNING -eq 0 ]; then
  echo "⚠️  Upload process not currently running"
  echo ""
fi

# Extract statistics
TOTAL_FILES=75
COMPLETED=$(grep -c "✅ ARCHIVO COMPLETADO:" "$LOG_FILE" 2>/dev/null || echo "0")
FAILED=$(grep -c "❌.*failed:" "$LOG_FILE" 2>/dev/null || echo "0")
RETRIES=$(grep -c "⚠️.*Intento.*falló" "$LOG_FILE" 2>/dev/null || echo "0")

# Calculate percentage
if [ $TOTAL_FILES -gt 0 ]; then
  PERCENT=$(echo "scale=1; ($COMPLETED * 100) / $TOTAL_FILES" | bc 2>/dev/null || echo "0")
else
  PERCENT="0"
fi

REMAINING=$((TOTAL_FILES - COMPLETED - FAILED))

echo "📊 Overall Progress:"
echo "   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   Total Files: $TOTAL_FILES"
echo "   ✅ Completed: $COMPLETED ($PERCENT%)"
echo "   ❌ Failed: $FAILED"
echo "   🔄 Retry Attempts: $RETRIES"
echo "   📝 Remaining: $REMAINING"
echo ""

# Get last progress line
LAST_PROGRESS=$(grep "📊 PROGRESO ACUMULADO" "$LOG_FILE" | tail -1)
if [ ! -z "$LAST_PROGRESS" ]; then
  echo "Last Progress Update:"
  grep -A 5 "📊 PROGRESO ACUMULADO" "$LOG_FILE" | tail -6
  echo ""
fi

# Show recently completed files
echo "Recently Completed Files (last 5):"
echo "   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
grep "✅ ARCHIVO COMPLETADO:" "$LOG_FILE" | tail -5 | while read line; do
  FILE=$(echo "$line" | sed 's/.*: //')
  echo "   ✅ $FILE"
done
echo ""

# Show failed files if any
if [ "$FAILED" -gt "0" ]; then
  echo "❌ Failed Files:"
  echo "   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  grep "❌.*failed:" "$LOG_FILE" | sed 's/.*❌ /   /' | head -10
  echo ""
fi

# Show current activity
echo "Current Activity:"
echo "   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
tail -10 "$LOG_FILE" | grep -v "📤.*%" | grep -E "(📄 ARCHIVO|Paso [0-9]/5|✅|❌|⚠️)" | tail -5
echo ""

echo "=================================================="
echo "Log file: $LOG_FILE"
echo "Last updated: $(date)"
echo "=================================================="

