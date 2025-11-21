#!/bin/bash
# Quick Upload Progress Check
# Usage: ./scripts/check-upload-progress.sh

LOG_FILE="/tmp/s2-bulk-v2.log"

if [ ! -f "$LOG_FILE" ]; then
  echo "❌ Log file not found: $LOG_FILE"
  exit 1
fi

echo "📊 S2-v2 Bulk Upload Progress"
echo "=============================="
echo ""

# Count progress
completed=$(grep -c "✅ Saved:" "$LOG_FILE" 2>/dev/null || echo "0")
failed=$(grep -c "❌ FAILED:" "$LOG_FILE" 2>/dev/null || echo "0")
processing=$(grep -c "^\[" "$LOG_FILE" 2>/dev/null || echo "0")

echo "Progress: $completed completed, $failed failed, $(($processing - $completed - $failed)) in progress"
echo "Total: $processing / 98 files seen"
echo ""

if [ "$completed" -gt 0 ]; then
  percentage=$((completed * 100 / 98))
  echo "Status: ${percentage}% complete"
  echo ""
fi

# Show last processed
echo "📋 Last 5 files:"
tail -200 "$LOG_FILE" | grep "^\[" | tail -5
echo ""

# Show recent saves
echo "✅ Recent saves:"
grep "✅ Saved:" "$LOG_FILE" | tail -3
echo ""

# Show any failures
if [ "$failed" -gt 0 ]; then
  echo "❌ Failures:"
  grep "❌ FAILED:" "$LOG_FILE" | tail -3
  echo ""
fi

# Check if running
if pgrep -q -f "test-s2-bulk"; then
  echo "🔄 Status: RUNNING"
else
  echo "✅ Status: COMPLETED or STOPPED"
fi

echo ""
echo "💡 View full log: tail -f $LOG_FILE"

