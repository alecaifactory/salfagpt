#!/bin/bash

# Monitor M3-v2 Processing Progress

echo "🔍 M3-v2 Processing Progress Monitor"
echo "===================================="
echo ""

# Check if processes are running
UPLOAD_PID=$(pgrep -f "upload-m003-documents.mjs" || echo "")
CHUNK_PID=$(pgrep -f "process-m3v2-chunks.mjs" || echo "")

echo "📊 Process Status:"
if [ -n "$UPLOAD_PID" ]; then
  echo "  ✅ Upload running (PID: $UPLOAD_PID)"
else
  echo "  ⏹️  Upload finished or not started"
fi

if [ -n "$CHUNK_PID" ]; then
  echo "  ✅ Chunk processing running (PID: $CHUNK_PID)"
else
  echo "  ⏹️  Chunk processing finished or not started"
fi

echo ""
echo "📈 Upload Progress:"
if [ -f /tmp/m3v2-upload.log ]; then
  UPLOADED=$(grep -c "Firestore ID:" /tmp/m3v2-upload.log 2>/dev/null || echo "0")
  SKIPPED=$(grep -c "Skipped (exists)" /tmp/m3v2-upload.log 2>/dev/null || echo "0")
  FAILED=$(grep -c "Failed:" /tmp/m3v2-upload.log 2>/dev/null || echo "0")
  
  echo "  Uploaded: $UPLOADED"
  echo "  Skipped: $SKIPPED"
  echo "  Failed: $FAILED"
  echo "  Total processed: $((UPLOADED + SKIPPED + FAILED))/93"
  
  if grep -q "UPLOAD COMPLETE" /tmp/m3v2-upload.log 2>/dev/null; then
    echo "  ✅ UPLOAD COMPLETE"
  fi
else
  echo "  ⏳ Log not found"
fi

echo ""
echo "📦 Chunking Progress:"
if [ -f /tmp/m3v2-chunks.log ]; then
  LOADED=$(grep "documents loaded" /tmp/m3v2-chunks.log 2>/dev/null | tail -1 | grep -oE '[0-9]+' | head -1 || echo "0")
  SAVED=$(grep -c "💾 Saved" /tmp/m3v2-chunks.log 2>/dev/null || echo "0")
  
  echo "  Loaded: $LOADED/2188 sources"
  echo "  Processed: $SAVED sources"
  
  # Get last processed
  LAST=$(grep -E "^\[[0-9]+/[0-9]+\]" /tmp/m3v2-chunks.log 2>/dev/null | tail -1 || echo "")
  if [ -n "$LAST" ]; then
    echo "  Current: $LAST"
  fi
  
  if grep -q "PROCESSING COMPLETE" /tmp/m3v2-chunks.log 2>/dev/null; then
    echo "  ✅ PROCESSING COMPLETE"
    
    # Extract final stats
    TOTAL_CHUNKS=$(grep "Total chunks:" /tmp/m3v2-chunks.log 2>/dev/null | grep -oE '[0-9,]+' | tr -d ',' || echo "0")
    SUCCESS=$(grep "Success:" /tmp/m3v2-chunks.log 2>/dev/null | tail -1 | grep -oE '[0-9]+' || echo "0")
    
    echo ""
    echo "  📊 Final Results:"
    echo "     Success: $SUCCESS"
    echo "     Total chunks: $TOTAL_CHUNKS"
  fi
else
  echo "  ⏳ Log not found"
fi

echo ""
echo "⏱️  Estimated completion:"
if [ -n "$CHUNK_PID" ]; then
  echo "  Processing started. Check back in 30-45 minutes."
else
  echo "  Run: npx tsx scripts/check-m003-status.mjs"
fi

echo ""
echo "📋 Next Steps:"
echo "  1. Wait for processing to complete (~45min)"
echo "  2. Run: npx tsx scripts/test-m3v2-evaluation.mjs"
echo "  3. Generate final reports"
echo ""

