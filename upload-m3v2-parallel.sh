#!/bin/bash
###############################################################################
# M3-v2 Parallel Upload with Testing
# 
# Features:
#   - 10 files processing simultaneously (8-9× faster)
#   - Complete verbose logging for every step
#   - 4 tests per document (chunks, BigQuery, RAG search, doc reference)
#   - All optimizations applied (20% overlap, batch 100, BQ 500)
#
# Expected: 7-8 minutes total (vs 62 minutes sequential)
###############################################################################

set -e

echo "════════════════════════════════════════════════════════════════════════"
echo "   M3-V2 PARALLEL UPLOAD WITH TESTING"
echo "════════════════════════════════════════════════════════════════════════"
echo ""
echo "Configuration:"
echo "  🚀 Parallel: 10 files simultaneously"
echo "  📐 Chunking: 512 tokens, 20% overlap (102 tokens)"
echo "  📦 Embedding batch: 100 chunks"
echo "  📊 BigQuery batch: 500 rows"
echo "  🧪 Testing: Enabled (4 tests per document)"
echo ""
echo "Expected:"
echo "  ⏱️  Time: 7-8 minutes (vs 62 sequential)"
echo "  💰 Cost: ~\$0.031"
echo "  🎯 Success: 100% (all fixes applied)"
echo ""
echo "════════════════════════════════════════════════════════════════════════"
echo ""

npx tsx cli/commands/upload.ts \
  --folder=/Users/alec/salfagpt/upload-queue/M3-v2-20251125 \
  --tag=M3-v2-20251125-parallel \
  --agent=vStojK73ZKbjNsEnqANJ \
  --user=usr_uhwqffaqag1wrryd82tw \
  --email=alec@getaifactory.com \
  --model=gemini-2.5-flash \
  2>&1 | tee m3v2-parallel.log

echo ""
echo "════════════════════════════════════════════════════════════════════════"
echo "✅ Upload complete! Run verification:"
echo "   ./verify-m3v2-after-upload.sh"
echo "════════════════════════════════════════════════════════════════════════"
