#!/bin/bash
# Real-time verbose status for M3-v2 upload

LOG="m3v2-upload-fixed.log"

clear
echo "════════════════════════════════════════════════════════════════════════"
echo "   M3-v2 UPLOAD - LIVE STATUS"
echo "════════════════════════════════════════════════════════════════════════"
echo ""

# Check if process is running
if ps aux | grep -E "upload.ts.*M3-v2" | grep -v grep > /dev/null; then
  echo "✅ Upload process: RUNNING"
else
  echo "⚠️  Upload process: NOT RUNNING"
fi

echo ""
echo "────────────────────────────────────────────────────────────────────────"
echo "📊 PROGRESS METRICS"
echo "────────────────────────────────────────────────────────────────────────"
echo ""

# Count progress
TOTAL=62
STARTED=$(grep -c "📄 ARCHIVO" "$LOG" 2>/dev/null || echo "0")
COMPLETED=$(grep -c "✅ ARCHIVO COMPLETADO" "$LOG" 2>/dev/null || echo "0")
FAILED=$(grep -c "❌.*failed:" "$LOG" 2>/dev/null || echo "0")
IN_PROGRESS=$((STARTED - COMPLETED - FAILED))

if [ "$IN_PROGRESS" -lt 0 ]; then IN_PROGRESS=0; fi

echo "Total files:       $TOTAL"
echo "Started:           $STARTED"
echo "✅ Completed:      $COMPLETED"
echo "❌ Failed:         $FAILED"
echo "⏳ In progress:    $IN_PROGRESS"
echo "⏸️  Pending:        $((TOTAL - STARTED))"
echo ""

if [ "$STARTED" -gt 0 ]; then
  PERCENT=$((STARTED * 100 / TOTAL))
  echo "Progress:          $PERCENT% ($STARTED/$TOTAL)"
  
  # Progress bar
  FILLED=$((PERCENT / 2))
  EMPTY=$((50 - FILLED))
  printf "["
  printf "%${FILLED}s" | tr ' ' '█'
  printf "%${EMPTY}s" | tr ' ' '░'
  printf "] $PERCENT%%\n"
fi

echo ""
echo "────────────────────────────────────────────────────────────────────────"
echo "📄 CURRENT FILE"
echo "────────────────────────────────────────────────────────────────────────"
echo ""

# Get current file
CURRENT_FILE=$(grep "📄 ARCHIVO" "$LOG" 2>/dev/null | tail -1 | sed 's/.*📁 Archivo: //')
if [ -n "$CURRENT_FILE" ]; then
  echo "File: $CURRENT_FILE"
  
  # Check what step it's on
  if tail -50 "$LOG" | grep -q "🤖 Paso 2/5: Extrayendo"; then
    echo "Step: 2/5 - Gemini extraction (⏳ can take 30-60s for large PDFs)"
  elif tail -50 "$LOG" | grep -q "💾 Paso 3/5: Guardando"; then
    echo "Step: 3/5 - Saving to Firestore"
  elif tail -50 "$LOG" | grep -q "🧬 Paso 4/5: Procesando para RAG"; then
    echo "Step: 4/5 - Chunking & embedding"
  elif tail -50 "$LOG" | grep -q "📝 Paso 5/5: Actualizando"; then
    echo "Step: 5/5 - Updating metadata"
  elif tail -50 "$LOG" | grep -q "📤 Paso 1/5: Subiendo"; then
    echo "Step: 1/5 - Uploading to GCS"
  fi
else
  echo "Initializing..."
fi

echo ""
echo "────────────────────────────────────────────────────────────────────────"
echo "📈 RECENT ACTIVITY (Last 20 lines)"
echo "────────────────────────────────────────────────────────────────────────"
echo ""

tail -20 "$LOG" 2>/dev/null | sed 's/\x1b\[[0-9;]*m//g' | grep -v "^$"

echo ""
echo "────────────────────────────────────────────────────────────────────────"
echo "💰 COST TRACKING"
echo "────────────────────────────────────────────────────────────────────────"
echo ""

# Extract cost info if available
if grep -q "💰 Costo acumulado" "$LOG" 2>/dev/null; then
  LATEST_COST=$(grep "💰 Costo acumulado" "$LOG" | tail -1 | sed 's/.*\$//' | awk '{print $1}')
  echo "Estimated cost so far: \$$LATEST_COST"
fi

# Extract chunk info if available
if grep -q "📐 Total chunks" "$LOG" 2>/dev/null; then
  TOTAL_CHUNKS=$(grep "📐 Total chunks" "$LOG" | tail -1 | sed 's/.*: //')
  echo "Total chunks created: $TOTAL_CHUNKS"
fi

echo ""
echo "════════════════════════════════════════════════════════════════════════"
echo "Monitor live: tail -f $LOG"
echo "Press Ctrl+C to exit this status view"
echo "════════════════════════════════════════════════════════════════════════"
