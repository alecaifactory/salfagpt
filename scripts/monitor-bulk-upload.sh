#!/bin/bash
# Monitor Bulk Upload Progress
# Usage: ./scripts/monitor-bulk-upload.sh

LOG_FILE="/tmp/s2-bulk-upload.log"

echo "📊 Monitoring S2-v2 Bulk Upload Progress"
echo "========================================"
echo ""

# Check if log file exists
if [ ! -f "$LOG_FILE" ]; then
  echo "❌ Log file not found: $LOG_FILE"
  echo "💡 Make sure bulk upload is running: npm run test:s2-bulk"
  exit 1
fi

# Watch mode - update every 10 seconds
watch_mode=${1:-false}

if [ "$watch_mode" = "watch" ]; then
  echo "🔄 Auto-refresh mode (Ctrl+C to exit)"
  echo ""
  
  while true; do
    clear
    bash "$0" single
    sleep 10
  done
else
  # Single snapshot
  
  # Count progress
  total_files=$(grep -c "^\[.*\]" "$LOG_FILE" 2>/dev/null || echo "0")
  completed=$(grep -c "✅ Saved:" "$LOG_FILE" 2>/dev/null || echo "0")
  failed=$(grep -c "❌ FAILED:" "$LOG_FILE" 2>/dev/null || echo "0")
  
  echo "Progress: $completed / 98 files completed"
  
  if [ "$completed" -gt 0 ]; then
    percentage=$((completed * 100 / 98))
    echo "Status: ${percentage}% complete"
  fi
  
  if [ "$failed" -gt 0 ]; then
    echo "⚠️  Failures: $failed files"
  fi
  
  echo ""
  
  # Show last 5 processed files
  echo "📋 Last 5 processed:"
  grep "^\[" "$LOG_FILE" | tail -5 | while read line; do
    if echo "$line" | grep -q "✅"; then
      echo "  ✅ $line"
    elif echo "$line" | grep -q "❌"; then
      echo "  ❌ $line"
    else
      echo "  ⏳ $line"
    fi
  done
  
  echo ""
  
  # Check if still running
  if pgrep -f "test-s2-bulk-upload" > /dev/null; then
    echo "🔄 Status: RUNNING"
    
    # Estimate time remaining
    if [ "$completed" -gt 0 ]; then
      # Get elapsed time from log
      start_time=$(head -1 "$LOG_FILE" | grep -oE "[0-9]{2}:[0-9]{2}:[0-9]{2}" || date +%H:%M:%S)
      current_time=$(date +%H:%M:%S)
      
      # Calculate average time per file
      # (simplified - just show status)
      echo "⏱️  Processing..."
    fi
  else
    echo "✅ Status: COMPLETED"
    
    # Show final summary if available
    if grep -q "BULK UPLOAD SUMMARY" "$LOG_FILE"; then
      echo ""
      echo "📊 Final Summary:"
      grep -A 20 "BULK UPLOAD SUMMARY" "$LOG_FILE" | head -20
    fi
  fi
  
  echo ""
  echo "💡 Commands:"
  echo "   - View full log: tail -f $LOG_FILE"
  echo "   - Auto-refresh: ./scripts/monitor-bulk-upload.sh watch"
  echo "   - Stop upload: pkill -f test-s2-bulk-upload"
fi

