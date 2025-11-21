#!/bin/bash

# RAG Status & BigQuery Chunks Verification
# Quick check using gcloud and bq commands

echo "🔍 RAG Status & BigQuery Chunks Verification"
echo "============================================================================================================================================"
echo ""

# Check BigQuery chunks
echo "📊 Querying BigQuery for chunk counts by source..."
bq query --use_legacy_sql=false --format=prettyjson --project_id=salfagpt '
SELECT 
  sourceId,
  COUNT(*) as chunk_count,
  MIN(createdAt) as first_chunk,
  MAX(createdAt) as last_chunk
FROM `salfagpt.flow_dataset_green.document_chunks`
GROUP BY sourceId
ORDER BY chunk_count DESC
' > /tmp/bq_chunks.json 2>/dev/null

if [ $? -eq 0 ]; then
  echo "✅ BigQuery query complete"
  echo ""
  
  # Parse and display
  echo "📈 BigQuery Chunks Summary"
  echo "============================================================================================================================================"
  echo ""
  echo "Source ID                          Chunks    First Chunk               Last Chunk"
  echo "------------------------------------------------------------------------------------------------------------------------------------"
  
  cat /tmp/bq_chunks.json | jq -r '.[] | "\(.sourceId[0:32])  \(.chunk_count)  \(.first_chunk[0:19])  \(.last_chunk[0:19])"' | column -t
  
  echo ""
  echo "============================================================================================================================================"
  echo ""
  
  # Total summary
  TOTAL_CHUNKS=$(cat /tmp/bq_chunks.json | jq '[.[].chunk_count | tonumber] | add')
  TOTAL_SOURCES=$(cat /tmp/bq_chunks.json | jq 'length')
  
  echo "📊 Summary"
  echo "------------------------------------------------------------"
  echo "Total Sources in BigQuery:  $TOTAL_SOURCES"
  echo "Total Chunks in BigQuery:   $TOTAL_CHUNKS"
  echo ""
  
else
  echo "❌ BigQuery query failed"
  echo "   Make sure you're authenticated: gcloud auth login --project=salfagpt"
  echo ""
fi

# Check if we can query Firestore
echo "🔍 Checking Firestore collections..."
echo ""

# Get conversations with RAG info using gcloud firestore export would be complex
# Instead, let's create a simple TypeScript query

cat > /tmp/check_rag_simple.mjs << 'EOF'
import { Firestore } from '@google-cloud/firestore';

const firestore = new Firestore({
  projectId: 'salfagpt',
});

async function check() {
  try {
    // Get all conversations
    const convSnapshot = await firestore.collection('conversations').get();
    console.log(`✅ Conversations found: ${convSnapshot.size}`);
    
    let ragEnabled = 0;
    convSnapshot.docs.forEach(doc => {
      if (doc.data().ragEnabled) {
        ragEnabled++;
      }
    });
    
    console.log(`   RAG enabled: ${ragEnabled} (${((ragEnabled/convSnapshot.size)*100).toFixed(1)}%)`);
    console.log('');
    
    // Get context sources
    const sourcesSnapshot = await firestore.collection('context_sources').get();
    console.log(`✅ Context sources found: ${sourcesSnapshot.size}`);
    
    // Count assigned sources
    let assignedCount = 0;
    sourcesSnapshot.docs.forEach(doc => {
      if (doc.data().assignedToAgents && doc.data().assignedToAgents.length > 0) {
        assignedCount++;
      }
    });
    
    console.log(`   Sources assigned to agents: ${assignedCount}`);
    console.log('');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

check();
EOF

echo "📝 Running Firestore check..."
node /tmp/check_rag_simple.mjs

echo ""
echo "💡 For detailed analysis, use the TypeScript script:"
echo "   node scripts/check-rag-status-authenticated.mjs"
echo ""
echo "✅ Quick check complete!"


