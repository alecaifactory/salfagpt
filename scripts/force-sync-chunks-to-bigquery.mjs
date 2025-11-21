#!/usr/bin/env node

/**
 * Force sync document_chunks from Firestore to BigQuery
 * For S1-v2 documents that were indexed today but didn't sync to BigQuery
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { BigQuery } from '@google-cloud/bigquery';

initializeApp({ projectId: 'salfagpt' });
const db = getFirestore();
const bigquery = new BigQuery({ projectId: 'salfagpt' });

const DATASET_ID = 'flow_rag_optimized';
const TABLE_ID = 'document_chunks_vectorized';

async function forceSyncChunksToBigQuery() {
  const agentId = 'vStojK73ZKbjNsEnqANJ'; // M3-v2 (changed from S1-v2)
  const ownerUserId = 'usr_uhwqffaqag1wrryd82tw';
  
  console.log('🔄 Force syncing chunks from Firestore to BigQuery...\n');
  
  try {
    // 1. Get ALL chunks for this agent directly
    console.log('1. Getting chunks from Firestore for agent:', agentId);
    const chunksSnapshot = await db.collection('document_chunks')
      .where('agentId', '==', agentId)
      .get();
    
    const allChunks = [];
    
    chunksSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.embedding && Array.isArray(data.embedding)) {
        allChunks.push({
          id: doc.id,
          ...data
        });
      }
    });
    
    console.log(`   ✅ Found ${allChunks.length} chunks in Firestore\n`);
    
    if (allChunks.length === 0) {
      console.log('   ❌ No chunks found to sync!');
      console.log('   Verify that document_chunks have agentId field set.');
      return;
    }
    
    console.log(`   Sample chunk:`, {
      id: allChunks[0]?.id,
      sourceId: allChunks[0]?.sourceId,
      userId: allChunks[0]?.userId,
      agentId: allChunks[0]?.agentId,
      hasEmbedding: !!allChunks[0]?.embedding
    });
    
    // 3. Sync to BigQuery in batches
    console.log('3. Syncing to BigQuery...');
    const BATCH_SIZE = 100; // BigQuery insert limit
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < allChunks.length; i += BATCH_SIZE) {
      const batch = allChunks.slice(i, i + BATCH_SIZE);
      
      console.log(`   Syncing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(allChunks.length / BATCH_SIZE)} (${batch.length} chunks)...`);
      
      try {
        const rows = batch.map(chunk => {
          const safeMetadata = chunk.metadata ? {
            startChar: chunk.metadata.startChar || 0,
            endChar: chunk.metadata.endChar || chunk.text.length,
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
        
        console.log(`      ✅ Synced ${batch.length} chunks`);
        successCount += batch.length;
        
      } catch (error) {
        console.error(`      ❌ Error:`, error.message);
        
        // Try to get more details
        if (error.errors && Array.isArray(error.errors)) {
          error.errors.slice(0, 3).forEach((err, idx) => {
            console.error(`         Error ${idx + 1}:`, JSON.stringify(err, null, 2));
          });
        }
        
        errorCount += batch.length;
      }
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('SYNC SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Success:  ${successCount}/${allChunks.length}`);
    console.log(`❌ Errors:   ${errorCount}/${allChunks.length}`);
    console.log('='.repeat(60));
    
    if (successCount > 0) {
      console.log('\n✅ Sync complete!');
      console.log('   Wait ~10 seconds for BigQuery to update, then test RAG.');
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

forceSyncChunksToBigQuery();

