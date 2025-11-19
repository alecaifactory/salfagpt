#!/bin/bash

LOG="/tmp/upload-s1-v2-final.log"
TOTAL=75

while true; do
    clear
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📊 S1-v2 UPLOAD MONITOR - $(date '+%H:%M:%S')"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    if [ ! -f "$LOG" ]; then
        echo "⏳ Waiting for upload to start..."
        sleep 5
        continue
    fi
    
    COMPLETED=$(grep -c "✅ ARCHIVO COMPLETADO:" "$LOG" 2>/dev/null || echo "0")
    FAILED=$(grep -c "❌.*failed:" "$LOG" 2>/dev/null || echo "0")
    RETRIES=$(grep -c "⚠️.*Intento.*falló" "$LOG" 2>/dev/null || echo "0")
    REMAINING=$((TOTAL - COMPLETED - FAILED))
    PERCENT=$(echo "scale=1; ($COMPLETED * 100) / $TOTAL" | bc 2>/dev/null || echo "0")
    
    echo "Progress: $COMPLETED / $TOTAL files ($PERCENT%)"
    echo "✅ Completed: $COMPLETED"
    echo "❌ Failed: $FAILED"
    echo "🔄 Retry Attempts: $RETRIES"
    echo "📝 Remaining: $REMAINING"
    echo ""
    
    # Show last progress
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Latest Activity:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    tail -20 "$LOG" | grep -v "📤.*%" | grep -E "(📄 ARCHIVO|✅|❌|⚠️|Paso [0-9]/5)" | tail -10
    echo ""
    
    # Show last 3 completed
    if [ "$COMPLETED" -gt 0 ]; then
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "Last 3 Completed:"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        grep "✅ ARCHIVO COMPLETADO:" "$LOG" | tail -3 | sed 's/.*: /  ✅ /'
        echo ""
    fi
    
    # Check if done
    if [ "$COMPLETED" -ge "$TOTAL" ]; then
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "🎉 UPLOAD COMPLETE!"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        grep "📊 RESUMEN DE CARGA" "$LOG" -A 10 | head -15
        break
    fi
    
    echo "Next update in 30 seconds... (Ctrl+C to stop monitoring)"
    sleep 30
done

