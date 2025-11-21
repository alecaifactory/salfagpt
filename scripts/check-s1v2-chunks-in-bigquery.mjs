#!/usr/bin/env node

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { BigQuery } from '@google-cloud/bigquery';

initializeApp({ projectId: 'salfagpt' });
const db = getFirestore();
const bigquery = new BigQuery({ projectId: 'salfagpt' });

async function checkS1v2ChunksInBigQuery() {
  const agentId = 'iQmdg3bMSJ1AdqqlFpye';
  const ownerUserId = 'usr_uhwqffaqag1wrryd82tw';
  
  console.log('🔍 Checking S1-v2 chunks in BigQuery...\n');
  
  try {
    // 1. Get assigned source IDs
    console.log('1. Getting assigned sources from agent_sources...');
    const agentSourcesSnapshot = await db.collection('agent_sources')
      .where('agentId', '==', agentId)
      .where('userId', '==', ownerUserId)
      .get();
    
    const sourceIds = agentSourcesSnapshot.docs.map(doc => doc.data().sourceId);
    console.log(`   ✅ Found ${sourceIds.length} assigned sources`);
    
    if (sourceIds.length === 0) {
      console.log('   ❌ No sources assigned!');
      return;
    }
    
    // Sample first 5 source IDs
    console.log('\n   Sample source IDs:');
    sourceIds.slice(0, 5).forEach((id, idx) => {
      console.log(`   ${idx + 1}. ${id}`);
    });
    
    // 2. Check if these sources have chunks in BigQuery
    console.log('\n2. Checking BigQuery for chunks...');
    
    const dataset = 'flow_rag_optimized';
    const table = 'document_chunks_vectorized';
    
    // Query for chunks from these sources
    const query = `
      SELECT 
        source_id,
        COUNT(*) as chunk_count
      FROM \`salfagpt.${dataset}.${table}\`
      WHERE source_id IN UNNEST(@sourceIds)
      GROUP BY source_id
      ORDER BY chunk_count DESC
    `;
    
    const options = {
      query: query,
      params: { sourceIds: sourceIds.slice(0, 100) }, // BigQuery has limits on array size
      location: 'us-central1',
    };
    
    console.log('   Running query...');
    const [rows] = await bigquery.query(options);
    
    if (rows.length === 0) {
      console.log('\n   ❌ NO CHUNKS FOUND in BigQuery!');
      console.log('\n   📋 This means:');
      console.log('      - The 75 documents are assigned to S1-v2');
      console.log('      - BUT they are NOT indexed in BigQuery');
      console.log('      - RAG cannot work without indexed chunks');
      console.log('\n   🔧 SOLUTION:');
      console.log('      - Need to trigger indexing for these documents');
      console.log('      - Or check if indexing failed for these sources');
    } else {
      console.log(`\n   ✅ Found chunks for ${rows.length} sources`);
      console.log('\n   Top 10 sources by chunk count:');
      rows.slice(0, 10).forEach((row, idx) => {
        console.log(`   ${idx + 1}. ${row.source_id}: ${row.chunk_count} chunks`);
      });
      
      const totalChunks = rows.reduce((sum, row) => sum + parseInt(row.chunk_count), 0);
      console.log(`\n   📊 Total: ${totalChunks} chunks across ${rows.length} sources`);
      
      // Check missing sources
      const sourcesWithChunks = new Set(rows.map(r => r.source_id));
      const missingChunks = sourceIds.filter(id => !sourcesWithChunks.has(id));
      
      if (missingChunks.length > 0) {
        console.log(`\n   ⚠️  ${missingChunks.length} assigned sources have NO chunks:`);
        missingChunks.slice(0, 5).forEach((id, idx) => {
          console.log(`      ${idx + 1}. ${id}`);
        });
        if (missingChunks.length > 5) {
          console.log(`      ... and ${missingChunks.length - 5} more`);
        }
      }
    }
    
    // 3. Check user_id in BigQuery
    console.log('\n3. Checking user_id in BigQuery chunks...');
    const userQuery = `
      SELECT DISTINCT user_id
      FROM \`salfagpt.${dataset}.${table}\`
      WHERE source_id IN UNNEST(@sourceIds)
      LIMIT 5
    `;
    
    const [userRows] = await bigquery.query({
      query: userQuery,
      params: { sourceIds: sourceIds.slice(0, 100) },
      location: 'us-central1',
    });
    
    if (userRows.length > 0) {
      console.log('   user_id values found in chunks:');
      userRows.forEach((row, idx) => {
        console.log(`   ${idx + 1}. ${row.user_id}`);
      });
      
      if (!userRows.some(r => r.user_id === ownerUserId)) {
        console.log(`\n   ⚠️  Expected user_id ${ownerUserId} NOT found!`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkS1v2ChunksInBigQuery();

