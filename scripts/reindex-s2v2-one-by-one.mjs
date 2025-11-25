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

function generateEmbedding(text) {
  const dimensions = 768;
  const embedding = new Array(dimensions).fill(0);
  
  for (let i = 0; i < Math.min(text.length, 1000); i++) {
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

async function indexSource(source, index, total) {
  const sourceId = source.id;
  const data = source.data;
  
  if (!data.extractedData || data.extractedData.length < 100) {
    return { status: 'skip', chunks: 0 };
  }
  
  const textChunks = chunkText(data.extractedData);
  let insertedChunks = 0;
  
  // Insert chunks one by one to avoid 413 errors
  for (let i = 0; i < textChunks.length; i++) {
    const chunk = textChunks[i];
    const embedding = generateEmbedding(chunk.text);
    
    const row = {
      chunk_id: `${sourceId}_${i}_${Date.now()}`,
      source_id: sourceId,
      user_id: USER_ID,
      chunk_index: i,
      text_preview: chunk.text.substring(0, 500),
      full_text: chunk.text,
      embedding: embedding,
      metadata: JSON.stringify({
        source_name: data.name,
        token_count: Math.ceil(chunk.text.length / 4),
        start_position: chunk.start,
        end_position: chunk.end
      }),
      created_at: new Date().toISOString()
    };
    
    try {
      await bigquery
        .dataset('flow_rag_optimized')
        .table('document_chunks_vectorized')
        .insert([row]);
      
      insertedChunks++;
    } catch (error) {
      if (!error.message.includes('Already Exists')) {
        console.error(`      ❌ Chunk ${i} error: ${error.message.substring(0, 100)}`);
      }
    }
  }
  
  if (insertedChunks > 0) {
    console.log(`   [${index + 1}/${total}] ${data.name.substring(0, 60)} - ${insertedChunks} chunks`);
  }
  
  return { status: 'success', chunks: insertedChunks };
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║         Re-indexación S2-v2 (One by One)                    ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  const startTime = Date.now();
  
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
  
  // Check existing
  console.log('🔍 Checking existing chunks...');
  const query = `
    SELECT DISTINCT source_id
    FROM \`salfagpt.flow_rag_optimized.document_chunks_vectorized\`
    WHERE source_id IN UNNEST(@sourceIds)
  `;
  
  const [job] = await bigquery.createQueryJob({
    query: query,
    params: { sourceIds: sources.map(s => s.id) }
  });
  const [rows] = await job.getQueryResults();
  
  const indexed = new Set(rows.map(r => r.source_id));
  const needsIndexing = sources.filter(s => !indexed.has(s.id) && s.data.extractedData);
  
  console.log(`   Already indexed: ${indexed.size}`);
  console.log(`   Need indexing: ${needsIndexing.length}\n`);
  
  if (needsIndexing.length === 0) {
    console.log('✅ All sources already indexed!\n');
    process.exit(0);
  }
  
  console.log(`🔄 Indexing ${needsIndexing.length} sources...\n`);
  
  let totalChunks = 0;
  let processed = 0;
  
  for (let i = 0; i < needsIndexing.length; i++) {
    const result = await indexSource(needsIndexing[i], i, needsIndexing.length);
    totalChunks += result.chunks;
    processed++;
    
    if (processed % 10 === 0) {
      const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
      const rate = processed / elapsed;
      const remaining = ((needsIndexing.length - processed) / rate).toFixed(1);
      console.log(`\n   📊 Progress: ${processed}/${needsIndexing.length} | ${elapsed}m elapsed | ~${remaining}m remaining\n`);
    }
  }
  
  const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                    COMPLETE                                  ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  console.log(`✅ Processed: ${processed} sources`);
  console.log(`✅ Created: ${totalChunks.toLocaleString()} chunks`);
  console.log(`⏱️  Time: ${totalTime} minutes\n`);
  
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

