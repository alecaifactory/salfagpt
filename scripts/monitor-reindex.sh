#!/bin/bash
# Monitor re-indexing progress

LOG_FILE="/tmp/reindex-full.log"
PID_FILE="/tmp/reindex.pid"

echo "📊 Monitoring Re-indexing Progress"
echo "==================================="
echo ""

# Check if process is running
if [ -f "$PID_FILE" ]; then
  PID=$(cat "$PID_FILE")
  if ps -p $PID > /dev/null 2>&1; then
    echo "✅ Process running (PID: $PID)"
  else
    echo "❌ Process not running (PID: $PID)"
    rm -f "$PID_FILE"
  fi
else
  # Try to find by grep
  PID=$(ps aux | grep "reindex-with-admin-user.mjs" | grep -v grep | awk '{print $2}' | head -1)
  if [ -n "$PID" ]; then
    echo "✅ Process running (PID: $PID)"
    echo "$PID" > "$PID_FILE"
  else
    echo "❌ No re-indexing process found"
    exit 1
  fi
fi

echo ""
echo "📝 Latest Progress:"
echo ""

# Show latest progress
tail -50 "$LOG_FILE" | grep -E "\[.*\/.*\]|Documentos asignados|Basura:|Útiles:|ERROR" | tail -15

echo ""
echo "📊 Statistics:"
echo ""

# Count total processed
TOTAL_PROCESSED=$(grep "✅ Completado!" "$LOG_FILE" | wc -l | tr -d ' ')
echo "   Documentos procesados: $TOTAL_PROCESSED"

# Count garbage filtered
TOTAL_GARBAGE=$(grep "Basura:" "$LOG_FILE" | awk '{sum+=$3} END {print sum}')
echo "   Total basura filtrada: ${TOTAL_GARBAGE:-0} chunks"

# Current agent
CURRENT_AGENT=$(grep "Re-indexando:" "$LOG_FILE" | tail -1 | cut -d: -f2-)
echo "   Agente actual:$CURRENT_AGENT"

echo ""
echo "🔄 To continue monitoring: watch -n 5 ./scripts/monitor-reindex.sh"
echo "📋 Full log: tail -f $LOG_FILE"

