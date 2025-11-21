#!/usr/bin/env node

/**
 * Force sync document_chunks from Firestore to BigQuery for multiple agents
 * Syncs: M1-v2, S1-v2, S2-v2
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { BigQuery } from '@google-cloud/bigquery';

initializeApp({ projectId: 'salfagpt' });
const db = getFirestore();
const bigquery = new BigQuery({ projectId: 'salfagpt' });

const DATASET_ID = 'flow_rag_optimized';
const TABLE_ID = 'document_chunks_vectorized';

// Agents to sync
const AGENTS_TO_SYNC = [
  { id: 'EgXezLcu4O3IUqFUJhUZ', name: 'M1-v2', expectedChunks: 696 },
  { id: 'iQmdg3bMSJ1AdqqlFpye', name: 'S1-v2', expectedChunks: 1113 },
  { id: '1lgr33ywq5qed67sqCYi', name: 'S2-v2', expectedChunks: 422 }
];

async function syncAgentChunks(agentId, agentName) {
  console.log(`\n${'━'.repeat(80)}`);
  console.log(`🔄 SYNCING: ${agentName} (${agentId})`);
  console.log('━'.repeat(80));
  
  try {
    // 1. Get ALL chunks for this agent
    console.log(`\n1️⃣  Fetching chunks from Firestore...`);
    const chunksSnapshot = await db.collection('document_chunks')
      .where('agentId', '==', agentId)
      .get();
    
    const allChunks = [];
    
    chunksSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.embedding && Array.isArray(data.embedding) && data.embedding.length === 768) {
        allChunks.push({
          id: doc.id,
          ...data
        });
      }
    });
    
    console.log(`   ✅ Found ${allChunks.length} valid chunks in Firestore`);
    
    if (allChunks.length === 0) {
      console.log(`   ⚠️  No chunks found for ${agentName}. Skipping.`);
      return { success: 0, errors: 0, skipped: true };
    }
    
    // Sample chunk info
    console.log(`   📄 Sample chunk:`, {
      id: allChunks[0]?.id?.substring(0, 20),
      sourceId: allChunks[0]?.sourceId?.substring(0, 20),
      userId: allChunks[0]?.userId,
      agentId: allChunks[0]?.agentId?.substring(0, 20),
      textLength: allChunks[0]?.text?.length,
      embeddingDims: allChunks[0]?.embedding?.length
    });
    
    // 2. Check what's already in BigQuery
    console.log(`\n2️⃣  Checking existing chunks in BigQuery...`);
    
    // Get unique source IDs
    const sourceIds = [...new Set(allChunks.map(c => c.sourceId))];
    console.log(`   📊 Documents: ${sourceIds.length}`);
    
    // Query BigQuery for existing chunks
    const sourceIdsString = sourceIds.map(id => `'${id}'`).join(',');
    const query = `
      SELECT chunk_id
      FROM \`salfagpt.${DATASET_ID}.${TABLE_ID}\`
      WHERE source_id IN (${sourceIdsString})
    `;
    
    const [existingRows] = await bigquery.query(query);
    const existingChunkIds = new Set(existingRows.map(row => row.chunk_id));
    
    console.log(`   📊 Already in BigQuery: ${existingChunkIds.size} chunks`);
    
    // Filter out chunks that already exist
    const chunksToSync = allChunks.filter(chunk => !existingChunkIds.has(chunk.id));
    
    console.log(`   📊 Chunks to sync: ${chunksToSync.length}`);
    
    if (chunksToSync.length === 0) {
      console.log(`   ✅ All chunks already synced for ${agentName}!`);
      return { success: allChunks.length, errors: 0, alreadySynced: true };
    }
    
    // 3. Sync to BigQuery in batches
    console.log(`\n3️⃣  Syncing to BigQuery...`);
    const BATCH_SIZE = 100;
    let successCount = existingChunkIds.size; // Count already synced as success
    let errorCount = 0;
    
    for (let i = 0; i < chunksToSync.length; i += BATCH_SIZE) {
      const batch = chunksToSync.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(chunksToSync.length / BATCH_SIZE);
      
      process.stdout.write(`   [${batchNum}/${totalBatches}] Syncing ${batch.length} chunks...`);
      
      try {
        const rows = batch.map(chunk => {
          const safeMetadata = chunk.metadata ? {
            startChar: chunk.metadata.startChar || 0,
            endChar: chunk.metadata.endChar || chunk.text?.length || 0,
            tokenCount: chunk.metadata.tokenCount || 0,
            startPage: chunk.metadata.startPage,
            endPage: chunk.metadata.endPage
          } : {};
          
          return {
            chunk_id: chunk.id,
            source_id: chunk.sourceId,
            user_id: chunk.userId,
            chunk_index: chunk.chunkIndex || 0,
            text_preview: (chunk.text || '').substring(0, 500),
            full_text: chunk.text || '',
            embedding: chunk.embedding,
            metadata: JSON.stringify(safeMetadata),
            created_at: (chunk.createdAt?._seconds 
              ? new Date(chunk.createdAt._seconds * 1000).toISOString()
              : new Date().toISOString()),
          };
        });
        
        await bigquery
          .dataset(DATASET_ID)
          .table(TABLE_ID)
          .insert(rows, { skipInvalidRows: false, ignoreUnknownValues: false });
        
        console.log(` ✅`);
        successCount += batch.length;
        
      } catch (error) {
        console.log(` ❌`);
        console.error(`      Error: ${error.message}`);
        
        if (error.errors && Array.isArray(error.errors)) {
          error.errors.slice(0, 2).forEach((err, idx) => {
            console.error(`      Detail ${idx + 1}:`, JSON.stringify(err, null, 2));
          });
        }
        
        errorCount += batch.length;
      }
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    console.log(`\n   ✅ Sync complete for ${agentName}`);
    console.log(`      Success: ${successCount}/${allChunks.length}`);
    console.log(`      Errors: ${errorCount}/${allChunks.length}`);
    
    return { success: successCount, errors: errorCount, total: allChunks.length };
    
  } catch (error) {
    console.error(`   ❌ Fatal error syncing ${agentName}:`, error.message);
    return { success: 0, errors: 0, fatalError: true };
  }
}

async function main() {
  console.log('\n╔═══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                  FORCE SYNC MÚLTIPLES AGENTES A BIGQUERY                      ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');
  
  const results = [];
  
  for (const agent of AGENTS_TO_SYNC) {
    const result = await syncAgentChunks(agent.id, agent.name);
    results.push({
      name: agent.name,
      ...result
    });
    
    // Wait between agents
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Final summary
  console.log('\n\n╔═══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                              RESUMEN FINAL                                     ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════════╝\n');
  
  console.log('┌────────────┬──────────┬──────────┬──────────┐');
  console.log('│ Agente     │ Total    │ Success  │ Errors   │');
  console.log('├────────────┼──────────┼──────────┼──────────┤');
  
  results.forEach(r => {
    const name = r.name.padEnd(10, ' ');
    const total = String(r.total || 0).padStart(6, ' ');
    const success = String(r.success || 0).padStart(6, ' ');
    const errors = String(r.errors || 0).padStart(6, ' ');
    const status = r.skipped ? '⚠️' : r.fatalError ? '❌' : r.errors > 0 ? '⚠️' : '✅';
    
    console.log(`│ ${name} │  ${total}  │  ${success}  │  ${errors}  │ ${status}`);
  });
  
  console.log('└────────────┴──────────┴──────────┴──────────┘\n');
  
  const totalSuccess = results.reduce((sum, r) => sum + (r.success || 0), 0);
  const totalErrors = results.reduce((sum, r) => sum + (r.errors || 0), 0);
  const allSuccess = results.every(r => !r.fatalError && r.errors === 0);
  
  if (allSuccess) {
    console.log('✅ TODOS LOS AGENTES SINCRONIZADOS CORRECTAMENTE');
    console.log(`   Total chunks sincronizados: ${totalSuccess}`);
  } else {
    console.log('⚠️  SINCRONIZACIÓN COMPLETADA CON ADVERTENCIAS');
    console.log(`   Success: ${totalSuccess} | Errors: ${totalErrors}`);
  }
  
  console.log('\n💡 Próximos pasos:');
  console.log('   1. Espera ~10 segundos para que BigQuery actualice');
  console.log('   2. Recarga la UI y prueba hacer una pregunta');
  console.log('   3. Deberías ver referencias a documentos en las respuestas\n');
}

main();


