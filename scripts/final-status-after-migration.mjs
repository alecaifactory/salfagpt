import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { BigQuery } from '@google-cloud/bigquery';

initializeApp({
  credential: applicationDefault(),
  projectId: 'salfagpt'
});

const db = getFirestore();
const bigquery = new BigQuery({ projectId: 'salfagpt' });

const AGENTS = [
  { id: 'iQmdg3bMSJ1AdqqlFpye', name: 'Gestion Bodegas (S1-v2)' },
  { id: '1lgr33ywq5qed67sqCYi', name: 'Maqsa Mantenimiento (S2-v2)' },
  { id: 'EgXezLcu4O3IUqFUJhUZ', name: 'Asistente Legal Territorial RDI (M1-v2)' },
  { id: 'vStojK73ZKbjNsEnqANJ', name: 'GOP GPT (M3-v2)' }
];

async function getAgentStats(agentId) {
  // Get sources from Firestore
  const sourcesSnapshot = await db
    .collection('context_sources')
    .where('assignedToAgents', 'array-contains', agentId)
    .get();
  
  const totalSources = sourcesSnapshot.size;
  const sourceIds = sourcesSnapshot.docs.map(doc => doc.id);
  
  // Count sources with GCS files
  let withGCSFiles = 0;
  let withExtractedData = 0;
  
  sourcesSnapshot.docs.forEach(doc => {
    const data = doc.data();
    if (data.metadata?.gcsPath || data.gcsPath) {
      withGCSFiles++;
    }
    if (data.extractedData && data.extractedData.length > 100) {
      withExtractedData++;
    }
  });
  
  // Get chunks from BigQuery
  let chunksInBQ = 0;
  let sourcesWithChunks = 0;
  
  if (sourceIds.length > 0) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_chunks,
          COUNT(DISTINCT source_id) as sources_with_chunks
        FROM \`salfagpt.flow_rag_optimized.document_chunks_vectorized\`
        WHERE source_id IN UNNEST(@sourceIds)
      `;
      
      const [job] = await bigquery.createQueryJob({
        query: query,
        params: { sourceIds: sourceIds }
      });
      const [rows] = await job.getQueryResults();
      
      if (rows.length > 0) {
        chunksInBQ = parseInt(rows[0].total_chunks) || 0;
        sourcesWithChunks = parseInt(rows[0].sources_with_chunks) || 0;
      }
    } catch (error) {
      console.error(`   ❌ BigQuery error for ${agentId}: ${error.message}`);
    }
  }
  
  // Get share count
  const sharesSnapshot = await db
    .collection('agent_shares')
    .where('agentId', '==', agentId)
    .get();
  
  const uniqueUsers = new Set();
  sharesSnapshot.docs.forEach(doc => {
    const sharedWith = doc.data().sharedWith || [];
    sharedWith.forEach(target => {
      if (target.type === 'user' && target.id) {
        uniqueUsers.add(target.id);
      }
    });
  });
  
  return {
    totalSources,
    withGCSFiles,
    withExtractedData,
    sourcesWithChunks,
    chunksInBQ,
    usersShared: uniqueUsers.size
  };
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║         ESTADO FINAL - Después de Migración                 ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  const results = [];
  
  for (const agent of AGENTS) {
    console.log(`🔍 Analyzing: ${agent.name}...`);
    const stats = await getAgentStats(agent.id);
    results.push({
      ...agent,
      ...stats
    });
  }
  
  console.log('\n╔══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                                         TABLA FINAL COMPLETA                                                                             ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝\n');
  
  console.log('┌────────────────────────────────────────┬──────────────────┬─────────┬──────────┬──────────────┬─────────────┬──────────────┬──────────┐');
  console.log('│ Nombre del Agente                      │ ID del Agente    │ Sources │ Con GCS  │ Con Extract  │ Con Chunks  │ Total Chunks │ Usuarios │');
  console.log('├────────────────────────────────────────┼──────────────────┼─────────┼──────────┼──────────────┼─────────────┼──────────────┼──────────┤');
  
  results.forEach(r => {
    const name = r.name.padEnd(38).substring(0, 38);
    const id = r.id.padEnd(16).substring(0, 16);
    const sources = String(r.totalSources).padStart(7);
    const gcs = String(r.withGCSFiles).padStart(8);
    const extract = String(r.withExtractedData).padStart(12);
    const srcChunks = String(r.sourcesWithChunks).padStart(11);
    const chunks = String(r.chunksInBQ).padStart(12);
    const users = String(r.usersShared).padStart(8);
    
    console.log(`│ ${name} │ ${id} │ ${sources} │ ${gcs} │ ${extract} │ ${srcChunks} │ ${chunks} │ ${users} │`);
  });
  
  console.log('└────────────────────────────────────────┴──────────────────┴─────────┴──────────┴──────────────┴─────────────┴──────────────┴──────────┘\n');
  
  // Summary statistics
  const totals = results.reduce((acc, r) => ({
    sources: acc.sources + r.totalSources,
    gcs: acc.gcs + r.withGCSFiles,
    extract: acc.extract + r.withExtractedData,
    srcChunks: acc.srcChunks + r.sourcesWithChunks,
    chunks: acc.chunks + r.chunksInBQ,
    users: acc.users + r.usersShared
  }), { sources: 0, gcs: 0, extract: 0, srcChunks: 0, chunks: 0, users: 0 });
  
  console.log('📊 TOTALES:');
  console.log(`   Total sources asignados: ${totals.sources}`);
  console.log(`   Con archivos en GCS: ${totals.gcs} (${(totals.gcs/totals.sources*100).toFixed(1)}%)`);
  console.log(`   Con texto extraído: ${totals.extract} (${(totals.extract/totals.sources*100).toFixed(1)}%)`);
  console.log(`   Con chunks en BigQuery: ${totals.srcChunks} (${(totals.srcChunks/totals.sources*100).toFixed(1)}%)`);
  console.log(`   Total chunks indexados: ${totals.chunks.toLocaleString()}`);
  console.log(`   Total usuarios compartidos: ${totals.users}\n`);
  
  // Health check
  console.log('🏥 HEALTH CHECK:\n');
  
  results.forEach(r => {
    const coverageGCS = (r.withGCSFiles / r.totalSources * 100).toFixed(1);
    const coverageExtract = (r.withExtractedData / r.totalSources * 100).toFixed(1);
    const coverageChunks = (r.sourcesWithChunks / r.totalSources * 100).toFixed(1);
    
    console.log(`📌 ${r.name}`);
    console.log(`   Archivos GCS: ${coverageGCS}% (${r.withGCSFiles}/${r.totalSources})`);
    console.log(`   Texto extraído: ${coverageExtract}% (${r.withExtractedData}/${r.totalSources})`);
    console.log(`   Chunks para RAG: ${coverageChunks}% (${r.sourcesWithChunks}/${r.totalSources})`);
    console.log(`   Usuarios compartidos: ${r.usersShared}`);
    
    const health = coverageChunks >= 90 ? '✅ EXCELENTE' : 
                   coverageChunks >= 70 ? '🟡 BUENO' :
                   coverageChunks >= 50 ? '🟠 REGULAR' : '🔴 NECESITA INDEXAR';
    console.log(`   Estado: ${health}\n`);
  });
  
  console.log('✨ Done!\n');
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});




