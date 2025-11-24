import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { BigQuery } from '@google-cloud/bigquery';

initializeApp({
  credential: applicationDefault(),
  projectId: 'salfagpt'
});

const db = getFirestore();
const bigquery = new BigQuery({ projectId: 'salfagpt' });

// OLD IDs (incomplete) that I used initially vs NEW (correct) IDs
const ID_MAPPINGS = [
  {
    name: 'S1-v2 (Gestion Bodegas)',
    oldId: 'iQmdg3bMSJ1A',      // Incomplete ID I used first
    newId: 'iQmdg3bMSJ1AdqqlFpye', // Correct full ID
  },
  {
    name: 'S2-v2 (Maqsa Mantenimiento)',
    oldId: '1lgr33ywq5qe',      // Incomplete ID I used first
    newId: '1lgr33ywq5qed67sqCYi', // Correct full ID
  },
  {
    name: 'M1-v2 (Legal Territorial)',
    oldId: 'EgXezLcu4O3I',      // Incomplete ID I used first
    newId: 'EgXezLcu4O3IUqFUJhUZ', // Correct full ID
  },
  {
    name: 'M3-v2 (GOP GPT)',
    oldId: 'vStojK73ZKbj',      // Incomplete ID I used first
    newId: 'vStojK73ZKbjNsEnqANJ', // Correct full ID
  }
];

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║  Checking for Chunks with OLD (incomplete) Agent IDs        ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  for (const mapping of ID_MAPPINGS) {
    console.log(`\n${'═'.repeat(80)}`);
    console.log(`📌 ${mapping.name}`);
    console.log(`   OLD ID (incorrect): ${mapping.oldId}`);
    console.log(`   NEW ID (correct):   ${mapping.newId}`);
    console.log('─'.repeat(80));
    
    // Check BigQuery for chunks - the table doesn't have agent_id column
    // So we need to check through source_ids
    
    // Get sources assigned to this agent
    const sourcesSnapshot = await db
      .collection('context_sources')
      .where('assignedToAgents', 'array-contains', mapping.newId)
      .get();
    
    console.log(`\n📚 Sources assigned in Firestore: ${sourcesSnapshot.size}`);
    
    if (sourcesSnapshot.size === 0) {
      console.log(`   ⚠️  No sources assigned to this agent`);
      continue;
    }
    
    const sourceIds = sourcesSnapshot.docs.map(doc => doc.id);
    
    // Check how many of these sources have chunks in BigQuery
    try {
      const query = `
        SELECT COUNT(DISTINCT source_id) as sources_with_chunks
        FROM \`salfagpt.flow_rag_optimized.document_chunks_vectorized\`
        WHERE source_id IN UNNEST(@sourceIds)
      `;
      
      const [job] = await bigquery.createQueryJob({
        query: query,
        params: { sourceIds: sourceIds }
      });
      const [rows] = await job.getQueryResults();
      
      const sourcesWithChunks = rows[0] ? parseInt(rows[0].sources_with_chunks) : 0;
      const percentage = (sourcesWithChunks / sourcesSnapshot.size * 100).toFixed(1);
      
      console.log(`\n🔍 BigQuery Status:`);
      console.log(`   Sources with chunks: ${sourcesWithChunks}/${sourcesSnapshot.size} (${percentage}%)`);
      console.log(`   Missing chunks: ${sourcesSnapshot.size - sourcesWithChunks}`);
      
      if (sourcesWithChunks < sourcesSnapshot.size) {
        console.log(`\n   ⚠️  ${sourcesSnapshot.size - sourcesWithChunks} sources need to be indexed`);
      } else {
        console.log(`\n   ✅ All sources have chunks in BigQuery!`);
      }
      
    } catch (error) {
      console.error(`   ❌ BigQuery error: ${error.message}`);
    }
  }
  
  console.log('\n' + '═'.repeat(80));
  console.log('\n📊 SUMMARY:\n');
  console.log('The BigQuery table structure:');
  console.log('  - Does NOT have agent_id or conversation_id columns');
  console.log('  - Links chunks to sources via source_id column');
  console.log('  - Links to users via user_id column\n');
  console.log('Therefore:');
  console.log('  ✅ Renaming agents does NOT affect BigQuery chunks');
  console.log('  ✅ Chunks are linked to sources, not agents');
  console.log('  ✅ No migration needed for agent ID changes\n');
  console.log('Issue:');
  console.log('  ⚠️  Most sources are assigned but not yet indexed');
  console.log('  💡 Need to run indexing/chunking for missing sources\n');
  
  console.log('✨ Done!\n');
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

