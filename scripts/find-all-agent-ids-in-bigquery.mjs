import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { BigQuery } from '@google-cloud/bigquery';

initializeApp({
  credential: applicationDefault(),
  projectId: 'salfagpt'
});

const db = getFirestore();
const bigquery = new BigQuery({ projectId: 'salfagpt' });

const CURRENT_AGENTS = [
  { id: 'iQmdg3bMSJ1AdqqlFpye', name: 'S1-v2 (Gestion Bodegas)' },
  { id: '1lgr33ywq5qed67sqCYi', name: 'S2-v2 (Maqsa Mantenimiento)' },
  { id: 'EgXezLcu4O3IUqFUJhUZ', name: 'M1-v2 (Legal Territorial)' },
  { id: 'vStojK73ZKbjNsEnqANJ', name: 'M3-v2 (GOP GPT)' }
];

const OLD_AGENT_IDS_FROM_DOCS = [
  // From CONTEXT_HANDOFF docs
  { id: 'AjtQZEIMQvFnPRJRjl4y', name: 'GESTION BODEGAS GPT (S001) - OLD' },
  { id: 'KfoKcDrb6pMnduAiLlrD', name: 'MAQSA Mantenimiento (S002) - OLD' },
  { id: 'cjn3bC0HrUYtHqu69CKS', name: 'Asistente Legal Territorial (M001) - OLD' },
  { id: 'vStojK73ZKbj', name: 'M3-v2 - INCOMPLETE ID' },
  { id: 'iQmdg3bMSJ1A', name: 'S1-v2 - INCOMPLETE ID' },
  { id: '1lgr33ywq5qe', name: 'S2-v2 - INCOMPLETE ID' },
  { id: 'EgXezLcu4O3I', name: 'M1-v2 - INCOMPLETE ID' }
];

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║    Finding ALL Agent IDs with Chunks in BigQuery            ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  console.log('🔍 Checking which agent IDs have chunks in BigQuery...\n');
  
  // Get all unique source_ids from BigQuery
  console.log('📊 Step 1: Getting all sources with chunks from BigQuery...');
  const allSourcesQuery = `
    SELECT DISTINCT source_id
    FROM \`salfagpt.flow_rag_optimized.document_chunks_vectorized\`
  `;
  
  const [job1] = await bigquery.createQueryJob({ query: allSourcesQuery });
  const [allSourceRows] = await job1.getQueryResults();
  const allBQSourceIds = new Set(allSourceRows.map(r => r.source_id));
  
  console.log(`   ✅ Found ${allBQSourceIds.size} unique sources with chunks in BigQuery\n`);
  
  // Now check which agents these sources belong to
  console.log('📚 Step 2: Checking Firestore to see which agents own these sources...\n');
  
  const agentSourcesMap = new Map(); // agentId -> { sourceIds, chunks }
  
  for (const agent of [...CURRENT_AGENTS, ...OLD_AGENT_IDS_FROM_DOCS]) {
    const sourcesSnapshot = await db
      .collection('context_sources')
      .where('assignedToAgents', 'array-contains', agent.id)
      .get();
    
    if (sourcesSnapshot.empty) {
      continue;
    }
    
    const sourceIds = sourcesSnapshot.docs.map(doc => doc.id);
    const sourcesInBQ = sourceIds.filter(id => allBQSourceIds.has(id));
    
    if (sourcesInBQ.length > 0) {
      // Count total chunks for these sources
      const chunksQuery = `
        SELECT COUNT(*) as total_chunks
        FROM \`salfagpt.flow_rag_optimized.document_chunks_vectorized\`
        WHERE source_id IN UNNEST(@sourceIds)
      `;
      
      const [job] = await bigquery.createQueryJob({
        query: chunksQuery,
        params: { sourceIds: sourcesInBQ }
      });
      const [rows] = await job.getQueryResults();
      const chunkCount = rows[0] ? parseInt(rows[0].total_chunks) : 0;
      
      agentSourcesMap.set(agent.id, {
        name: agent.name,
        totalSources: sourceIds.length,
        sourcesWithChunks: sourcesInBQ.length,
        totalChunks: chunkCount
      });
    }
  }
  
  // Display results
  console.log('╔══════════════════════════════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                        AGENT IDs WITH CHUNKS IN BIGQUERY                                             ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════════════════════════════╝\n');
  
  console.log('┌──────────────────────┬─────────────────────────────────────────┬──────────┬───────────┬─────────────┐');
  console.log('│ Agent ID             │ Agent Name                              │ Sources  │ With BQ   │ Tot Chunks  │');
  console.log('├──────────────────────┼─────────────────────────────────────────┼──────────┼───────────┼─────────────┤');
  
  // Sort by chunk count
  const sortedAgents = Array.from(agentSourcesMap.entries())
    .sort((a, b) => b[1].totalChunks - a[1].totalChunks);
  
  sortedAgents.forEach(([agentId, data]) => {
    const id = agentId.padEnd(20).substring(0, 20);
    const name = data.name.padEnd(41).substring(0, 41);
    const total = String(data.totalSources).padStart(8);
    const withBQ = String(data.sourcesWithChunks).padStart(9);
    const chunks = String(data.totalChunks).padStart(11);
    
    console.log(`│ ${id} │ ${name} │ ${total} │ ${withBQ} │ ${chunks} │`);
  });
  
  console.log('└──────────────────────┴─────────────────────────────────────────┴──────────┴───────────┴─────────────┘\n');
  
  // Now check for the specific current agents
  console.log('\n╔══════════════════════════════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                        CURRENT AGENTS STATUS                                                         ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════════════════════════════╝\n');
  
  console.log('┌──────────────────────┬─────────────────────────────────────────┬──────────┬───────────┬─────────────┐');
  console.log('│ Agent ID             │ Agent Name                              │ Sources  │ With BQ   │ Tot Chunks  │');
  console.log('├──────────────────────┼─────────────────────────────────────────┼──────────┼───────────┼─────────────┤');
  
  CURRENT_AGENTS.forEach(agent => {
    const data = agentSourcesMap.get(agent.id);
    const id = agent.id.padEnd(20).substring(0, 20);
    const name = agent.name.padEnd(41).substring(0, 41);
    const total = data ? String(data.totalSources).padStart(8) : '       0';
    const withBQ = data ? String(data.sourcesWithChunks).padStart(9) : '        0';
    const chunks = data ? String(data.totalChunks).padStart(11) : '          0';
    const status = data ? '✅' : '❌';
    
    console.log(`│ ${id} │ ${name} │ ${total} │ ${withBQ} │ ${chunks} │`);
  });
  
  console.log('└──────────────────────┴─────────────────────────────────────────┴──────────┴───────────┴─────────────┘\n');
  
  // Check if old IDs have chunks
  console.log('\n╔══════════════════════════════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                        OLD/LEGACY AGENT IDs STATUS                                                   ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════════════════════════════╝\n');
  
  const oldAgentsWithChunks = OLD_AGENT_IDS_FROM_DOCS.filter(agent => 
    agentSourcesMap.has(agent.id)
  );
  
  if (oldAgentsWithChunks.length > 0) {
    console.log('⚠️  FOUND OLD AGENT IDs WITH CHUNKS!\n');
    
    console.log('┌──────────────────────┬─────────────────────────────────────────┬──────────┬───────────┬─────────────┐');
    console.log('│ OLD Agent ID         │ Agent Name                              │ Sources  │ With BQ   │ Tot Chunks  │');
    console.log('├──────────────────────┼─────────────────────────────────────────┼──────────┼───────────┼─────────────┤');
    
    oldAgentsWithChunks.forEach(agent => {
      const data = agentSourcesMap.get(agent.id);
      const id = agent.id.padEnd(20).substring(0, 20);
      const name = agent.name.padEnd(41).substring(0, 41);
      const total = String(data.totalSources).padStart(8);
      const withBQ = String(data.sourcesWithChunks).padStart(9);
      const chunks = String(data.totalChunks).padStart(11);
      
      console.log(`│ ${id} │ ${name} │ ${total} │ ${withBQ} │ ${chunks} │`);
    });
    
    console.log('└──────────────────────┴─────────────────────────────────────────┴──────────┴───────────┴─────────────┘\n');
    
    console.log('💡 RECOMMENDATION: These old agent IDs have chunks that should be migrated to new IDs\n');
  } else {
    console.log('✅ No chunks found under old/legacy agent IDs\n');
  }
  
  console.log('✨ Done!\n');
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});




