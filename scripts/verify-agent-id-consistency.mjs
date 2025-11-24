import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { BigQuery } from '@google-cloud/bigquery';

initializeApp({
  credential: applicationDefault(),
  projectId: 'salfagpt'
});

const db = getFirestore();
const bigquery = new BigQuery({ projectId: 'salfagpt' });

// Agents to verify
const AGENTS = [
  { id: 'iQmdg3bMSJ1AdqqlFpye', name: 'Gestion Bodegas (S1-v2)' },
  { id: '1lgr33ywq5qed67sqCYi', name: 'Maqsa Mantenimiento (S2-v2)' },
  { id: 'EgXezLcu4O3IUqFUJhUZ', name: 'Asistente Legal Territorial RDI (M1-v2)' },
  { id: 'vStojK73ZKbjNsEnqANJ', name: 'GOP GPT (M3-v2)' }
];

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║    Verificación de Consistencia de IDs de Agentes           ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  for (const agent of AGENTS) {
    console.log(`\n${'═'.repeat(80)}`);
    console.log(`📌 ${agent.name}`);
    console.log(`   ID: ${agent.id}`);
    console.log('─'.repeat(80));
    
    // 1. Check Firestore context_sources
    console.log('\n📚 Step 1: Checking Firestore context_sources...');
    const sourcesSnapshot = await db
      .collection('context_sources')
      .where('assignedToAgents', 'array-contains', agent.id)
      .get();
    
    console.log(`   ✅ Found ${sourcesSnapshot.size} sources assigned to this agent in Firestore`);
    
    const sourceIds = sourcesSnapshot.docs.map(doc => doc.id);
    
    if (sourceIds.length > 0) {
      console.log(`   📋 First 5 source IDs:`);
      sourceIds.slice(0, 5).forEach((id, idx) => {
        const doc = sourcesSnapshot.docs.find(d => d.id === id);
        const data = doc.data();
        console.log(`      ${idx + 1}. ${id} - ${data.name}`);
      });
    }
    
    // 2. Check BigQuery chunks for these sources
    console.log('\n🔍 Step 2: Checking BigQuery chunks for assigned sources...');
    
    if (sourceIds.length === 0) {
      console.log(`   ⚠️  No sources assigned in Firestore, skipping BigQuery check`);
    } else {
      try {
        // Query chunks for these source_ids
        const query = `
          SELECT 
            source_id,
            COUNT(*) as chunk_count,
            MIN(created_at) as first_chunk,
            MAX(created_at) as last_chunk
          FROM \`salfagpt.flow_rag_optimized.document_chunks_vectorized\`
          WHERE source_id IN UNNEST(@sourceIds)
          GROUP BY source_id
          ORDER BY chunk_count DESC
          LIMIT 10
        `;
        
        const [job] = await bigquery.createQueryJob({
          query: query,
          params: { sourceIds: sourceIds }
        });
        const [rows] = await job.getQueryResults();
        
        console.log(`   ✅ Found ${rows.length} sources with chunks in BigQuery`);
        
        if (rows.length > 0) {
          console.log(`   📋 First 5 sources with chunks:`);
          rows.slice(0, 5).forEach((row, idx) => {
            const doc = sourcesSnapshot.docs.find(d => d.id === row.source_id);
            const name = doc ? doc.data().name : 'Unknown';
            console.log(`      ${idx + 1}. ${row.source_id} - ${row.chunk_count} chunks - ${name}`);
          });
        }
        
        // Check consistency
        const bqSourceIds = new Set(rows.map(r => r.source_id));
        const firestoreSourceIds = new Set(sourceIds);
        
        const inFirestoreNotBQ = sourceIds.filter(id => !bqSourceIds.has(id));
        const matchCount = sourceIds.filter(id => bqSourceIds.has(id)).length;
        
        console.log(`\n📊 Consistency Check:`);
        console.log(`   Sources in Firestore (assigned to agent): ${firestoreSourceIds.size}`);
        console.log(`   Sources with chunks in BigQuery: ${bqSourceIds.size}`);
        console.log(`   ✅ Match: ${matchCount}`);
        console.log(`   ⚠️  Missing chunks in BigQuery: ${inFirestoreNotBQ.length}`);
        
        if (inFirestoreNotBQ.length > 0) {
          console.log(`\n   ⚠️  Sources assigned but WITHOUT chunks in BigQuery:`);
          inFirestoreNotBQ.slice(0, 10).forEach((id, idx) => {
            const doc = sourcesSnapshot.docs.find(d => d.id === id);
            const data = doc ? doc.data() : null;
            const name = data ? data.name : 'Unknown';
            const ragEnabled = data?.metadata?.ragEnabled;
            const status = data?.status;
            console.log(`      ${idx + 1}. ${id}`);
            console.log(`         Name: ${name}`);
            console.log(`         Status: ${status || 'unknown'}`);
            console.log(`         RAG Enabled: ${ragEnabled !== undefined ? ragEnabled : 'not set'}`);
          });
          if (inFirestoreNotBQ.length > 10) {
            console.log(`      ... and ${inFirestoreNotBQ.length - 10} more`);
          }
          
          // Check if these documents have extractedData in Firestore
          console.log(`\n   🔍 Checking if missing sources have extractedData...`);
          let withExtractedData = 0;
          let withoutExtractedData = 0;
          
          inFirestoreNotBQ.slice(0, 20).forEach(id => {
            const doc = sourcesSnapshot.docs.find(d => d.id === id);
            const data = doc ? doc.data() : null;
            if (data?.extractedData && data.extractedData.length > 100) {
              withExtractedData++;
            } else {
              withoutExtractedData++;
            }
          });
          
          console.log(`      With extractedData: ${withExtractedData}`);
          console.log(`      Without extractedData: ${withoutExtractedData}`);
          console.log(`\n   💡 Recommendation: Re-index sources without chunks to make them searchable`);
        }
        
      } catch (error) {
        console.error(`   ❌ BigQuery error: ${error.message}`);
      }
    }
  }
  
  console.log('\n' + '═'.repeat(80));
  console.log('\n✨ Verification complete!\n');
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

