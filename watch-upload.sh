#!/bin/bash

# Watch upload progress with periodic updates
LOG="/tmp/upload-s1-v2-continue.log"
STATUS_SCRIPT="/Users/alec/salfagpt/upload-status.sh"

echo "🔍 Starting upload monitor..."
echo "Press Ctrl+C to stop monitoring (upload will continue in background)"
echo ""

# Check if upload is running
if ! ps aux | grep "cli/commands/upload.ts" | grep -v grep > /dev/null; then
    echo "⚠️  Upload process not found. It may have completed or stopped."
    echo ""
fi

# Monitor loop
while true; do
    clear
    $STATUS_SCRIPT
    
    # Check if we're done
    COMPLETED=$(grep -c "✅ ARCHIVO COMPLETADO:" "$LOG" 2>/dev/null | head -1 || echo "0")
    if [ "$COMPLETED" -ge 75 ]; then
        echo ""
        echo "🎉 ALL FILES UPLOADED SUCCESSFULLY!"
        echo ""
        echo "📋 Final Summary:"
        grep "📊 PROGRESO ACUMULADO" "$LOG" | tail -1
        grep -A 5 "📊 PROGRESO ACUMULADO" "$LOG" | tail -5
        break
    fi
    
    echo ""
    echo "Next update in 60 seconds..."
    sleep 60
done


