#!/bin/bash
# Pure SQL Benchmark: GREEN vs BLUE BigQuery Performance
# 
# Tests vector search query performance on both tables
# Measures execution time, results, and quality

echo "🔬 BigQuery GREEN vs BLUE SQL Benchmark"
echo "========================================================================"
echo ""

PROJECT="salfagpt"
USER_ID="usr_uhwqffaqag1wrryd82tw"

# Use top 3 sources that have most chunks
SOURCE_IDS="'XwLpY57E92234fYW81rf','BIeJ32pHdUUEh8tfH3wC','Oh1kVS9jElPOB7ZyccLm'"

# Dummy embedding for benchmark (replace with real one for actual test)
QUERY_EMBEDDING="[0.1, 0.2, 0.3]"  # Would be 768 dimensions in reality

echo "Configuration:"
echo "  User: $USER_ID"
echo "  Sources: 3 top sources with most chunks"
echo "  Query: Dummy embedding (for speed test)"
echo ""

# Test GREEN
echo "🟢 Testing GREEN (flow_rag_optimized.document_chunks_vectorized)..."
echo ""

GREEN_START=$(date +%s%3N)

bq query --use_legacy_sql=false --project_id=$PROJECT "
WITH similarities AS (
  SELECT 
    chunk_id,
    source_id,
    chunk_index,
    text_preview,
    full_text,
    -- Cosine similarity
    (
      SELECT SUM(a * b) / (
        SQRT((SELECT SUM(a * a) FROM UNNEST(embedding) AS a)) * 
        SQRT((SELECT SUM(b * b) FROM UNNEST($QUERY_EMBEDDING) AS b))
      )
      FROM UNNEST(embedding) AS a WITH OFFSET pos
      JOIN UNNEST($QUERY_EMBEDDING) AS b WITH OFFSET pos2
        ON pos = pos2
    ) AS similarity
  FROM \`$PROJECT.flow_rag_optimized.document_chunks_vectorized\`
  WHERE user_id = '$USER_ID'
    AND source_id IN UNNEST([$SOURCE_IDS])
)
SELECT 
  chunk_id,
  source_id,
  chunk_index,
  similarity,
  LENGTH(full_text) as text_length
FROM similarities
WHERE similarity >= 0.25
ORDER BY similarity DESC
LIMIT 8
" > /tmp/green_results.txt 2>&1

GREEN_END=$(date +%s%3N)
GREEN_DURATION=$((GREEN_END - GREEN_START))

GREEN_COUNT=$(grep -c "^\|" /tmp/green_results.txt | awk '{print $1-3}')  # Subtract header rows

echo "  ✓ Duration: ${GREEN_DURATION}ms"
echo "  ✓ Results: $GREEN_COUNT chunks"
echo ""

# Test BLUE  
echo "🔵 Testing BLUE (flow_analytics.document_embeddings)..."
echo ""

BLUE_START=$(date +%s%3N)

bq query --use_legacy_sql=false --project_id=$PROJECT "
WITH similarities AS (
  SELECT 
    chunk_id,
    source_id,
    chunk_index,
    text_preview,
    full_text,
    -- Cosine similarity
    (
      SELECT SUM(a * b) / (
        SQRT((SELECT SUM(a * a) FROM UNNEST(embedding) AS a)) * 
        SQRT((SELECT SUM(b * b) FROM UNNEST($QUERY_EMBEDDING) AS b))
      )
      FROM UNNEST(embedding) AS a WITH OFFSET pos
      JOIN UNNEST($QUERY_EMBEDDING) AS b WITH OFFSET pos2
        ON pos = pos2
    ) AS similarity
  FROM \`$PROJECT.flow_analytics.document_embeddings\`
  WHERE user_id = '$USER_ID'
    AND source_id IN UNNEST([$SOURCE_IDS])
)
SELECT 
  chunk_id,
  source_id,
  chunk_index,
  similarity,
  LENGTH(full_text) as text_length
FROM similarities
WHERE similarity >= 0.25
ORDER BY similarity DESC
LIMIT 8
" > /tmp/blue_results.txt 2>&1

BLUE_END=$(date +%s%3N)
BLUE_DURATION=$((BLUE_END - BLUE_START))

BLUE_COUNT=$(grep -c "^\|" /tmp/blue_results.txt | awk '{print $1-3}')

echo "  ✓ Duration: ${BLUE_DURATION}ms"
echo "  ✓ Results: $BLUE_COUNT chunks"
echo ""

# Compare
echo "📊 BENCHMARK RESULTS"
echo "========================================================================"
echo ""
printf "%-25s | %-15s | %-15s\n" "Metric" "🔵 BLUE" "🟢 GREEN"
printf "%-25s-+-%-15s-+-%-15s\n" "-------------------------" "---------------" "---------------"
printf "%-25s | %-15s | %-15s\n" "Query Duration" "${BLUE_DURATION}ms" "${GREEN_DURATION}ms"
printf "%-25s | %-15s | %-15s\n" "Results Found" "$BLUE_COUNT chunks" "$GREEN_COUNT chunks"
echo ""

if [ $GREEN_DURATION -lt $BLUE_DURATION ]; then
    SPEEDUP=$(echo "scale=1; $BLUE_DURATION / $GREEN_DURATION" | bc)
    echo "🏆 Winner: GREEN (${SPEEDUP}x faster)"
elif [ $BLUE_DURATION -lt $GREEN_DURATION ]; then
    SPEEDUP=$(echo "scale=1; $GREEN_DURATION / $BLUE_DURATION" | bc)
    echo "🏆 Winner: BLUE (${SPEEDUP}x faster)"
else
    echo "🤝 Tie: Both perform similarly"
fi

echo ""
echo "🎯 Target Check:"
if [ $GREEN_DURATION -lt 2000 ]; then
    echo "  ✅ GREEN meets <2s target (${GREEN_DURATION}ms)"
else
    echo "  ❌ GREEN exceeds 2s target (${GREEN_DURATION}ms)"
fi

if [ $BLUE_DURATION -lt 2000 ]; then
    echo "  ✅ BLUE meets <2s target (${BLUE_DURATION}ms)"
else
    echo "  ❌ BLUE exceeds 2s target (${BLUE_DURATION}ms)"
fi

echo ""
echo "📁 Full results saved to:"
echo "  GREEN: /tmp/green_results.txt"
echo "  BLUE: /tmp/blue_results.txt"

