import { bigquery } from './src/lib/gcp.js';

const AGENT_ID = 'vStojK73ZKbjNsEnqANJ';

console.log('🔍 Checking chunks for M3-v2 agent...\n');

const query = `
  SELECT COUNT(*) as chunk_count
  FROM \`salfagpt.document_chunks\`
  WHERE agentId = @agentId
`;

const [rows] = await bigquery.query({
  query,
  params: { agentId: AGENT_ID }
});

console.log('Chunks for M3-v2:', rows[0].chunk_count);

// Get sample chunks
const sampleQuery = `
  SELECT 
    chunkId,
    sourceId,
    LEFT(content, 100) as preview
  FROM \`salfagpt.document_chunks\`
  WHERE agentId = @agentId
  LIMIT 5
`;

const [samples] = await bigquery.query({
  query: sampleQuery,
  params: { agentId: AGENT_ID }
});

console.log('\nSample chunks:');
samples.forEach((s, i) => {
  console.log(`${i+1}. ${s.preview}...`);
});

process.exit(0);

