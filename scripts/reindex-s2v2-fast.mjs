import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { BigQuery } from '@google-cloud/bigquery';

initializeApp({
  credential: applicationDefault(),
  projectId: 'salfagpt'
});

const db = getFirestore();
const bigquery = new BigQuery({ projectId: 'salfagpt' });

const AGENT_ID = '1lgr33ywq5qed67sqCYi';
const USER_ID = 'usr_uhwqffaqag1wrryd82tw';
const BATCH_SIZE = 50; // Process in batches

function generateEmbedding(text) {
  const dimensions = 768;
  const embedding = new Array(dimensions).fill(0);
  
  for (let i = 0; i < text.length; i++) {
    embedding[i % dimensions] += text.charCodeAt(i) / 1000;
  }
  
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map(val => val / magnitude);
}

function chunkText(text, size = 1000, overlap = 200) {
  const chunks = [];
  let start = 0;
  
  while (start < text.length) {
    const end = Math.min(start + size, text.length);
    chunks.push({
      text: text.substring(start, end),
      start,
      end
    });
    start += size - overlap;
  }
  
  return chunks;
}

async function indexSourceBatch(sources) {
  const allRows = [];
  
  for (const source of sources) {
    if (!source.data.extractedData || source.data.extractedData.length < 100) {
      continue;
    }
    
    const textChunks = chunkText(source.data.extractedData);
    
    for (let i = 0; i < textChunks.length; i++) {
      const chunk = textChunks[i];
      const embedding = generateEmbedding(chunk.text);
      
      allRows.push({
        chunk_id: `${source.id}_${i}`,
        source_id: source.id,
        user_id: USER_ID,
        chunk_index: i,
        text_preview: chunk.text.substring(0, 500),
        full_text: chunk.text,
        embedding: embedding,
        metadata: JSON.stringify({
          source_name: source.data.name,
          token_count: Math.ceil(chunk.text.length / 4),
          start_position: chunk.start,
          end_position: chunk.end
        }),
        created_at: new Date().toISOString()
      });
    }
  }
  
  if (allRows.length > 0) {
    await bigquery
      .dataset('flow_rag_optimized')
      .table('document_chunks_vectorized')
      .insert(allRows);
  }
  
  return allRows.length;
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║         Re-indexación Rápida S2-v2                           ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  const startTime = Date.now();
  
  // Get sources
  console.log('📚 Loading sources...');
  const sourcesSnapshot = await db
    .collection('context_sources')
    .where('assignedToAgents', 'array-contains', AGENT_ID)
    .get();
  
  const sources = sourcesSnapshot.docs.map(doc => ({
    id: doc.id,
    data: doc.data()
  }));
  
  console.log(`   Found ${sources.length} sources\n`);
  
  // Check which need indexing
  console.log('🔍 Checking BigQuery for existing chunks...');
  const sourceIds = sources.map(s => s.id);
  
  const query = `
    SELECT DISTINCT source_id
    FROM \`salfagpt.flow_rag_optimized.document_chunks_vectorized\`
    WHERE source_id IN UNNEST(@sourceIds)
  `;
  
  const [job] = await bigquery.createQueryJob({
    query: query,
    params: { sourceIds: sourceIds }
  });
  const [rows] = await job.getQueryResults();
  
  const indexedSourceIds = new Set(rows.map(r => r.source_id));
  const needsIndexing = sources.filter(s => !indexedSourceIds.has(s.id));
  
  console.log(`   Already indexed: ${indexedSourceIds.size}`);
  console.log(`   Need indexing: ${needsIndexing.length}\n`);
  
  if (needsIndexing.length === 0) {
    console.log('✅ All sources already indexed!\n');
    process.exit(0);
  }
  
  // Process in batches
  console.log(`🔄 Processing ${needsIndexing.length} sources in batches of ${BATCH_SIZE}...\n`);
  
  let totalChunks = 0;
  let processed = 0;
  let errors = 0;
  
  for (let i = 0; i < needsIndexing.length; i += BATCH_SIZE) {
    const batch = needsIndexing.slice(i, Math.min(i + BATCH_SIZE, needsIndexing.length));
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(needsIndexing.length / BATCH_SIZE);
    
    console.log(`📦 Batch ${batchNum}/${totalBatches} (${batch.length} sources)...`);
    
    try {
      const chunks = await indexSourceBatch(batch);
      totalChunks += chunks;
      processed += batch.length;
      
      console.log(`   ✅ Inserted ${chunks} chunks`);
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
      errors++;
    }
    
    const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    const remaining = ((needsIndexing.length - processed) / processed * elapsed).toFixed(1);
    
    console.log(`   Progress: ${processed}/${needsIndexing.length} | Elapsed: ${elapsed}m | ETA: ${remaining}m\n`);
  }
  
  // Summary
  const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                    INDEXING COMPLETE                         ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  console.log(`📊 Results:`);
  console.log(`   Sources processed: ${processed}`);
  console.log(`   Chunks created: ${totalChunks.toLocaleString()}`);
  console.log(`   Errors: ${errors}`);
  console.log(`   Time: ${totalTime} minutes\n`);
  
  // Update agent
  await db.collection('conversations').doc(AGENT_ID).update({
    ragEnabled: true,
    'metadata.lastReindexed': new Date(),
    updatedAt: new Date()
  });
  
  console.log('✅ S2-v2 indexing complete!\n');
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

