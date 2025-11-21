#!/usr/bin/env node

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({ projectId: 'salfagpt' });
const db = getFirestore();

async function checkIndexingStatus() {
  const agentId = 'iQmdg3bMSJ1AdqqlFpye';
  const ownerUserId = 'usr_uhwqffaqag1wrryd82tw';
  
  console.log('🔍 Checking indexing status of S1-v2 documents...\n');
  
  try {
    // Get assigned source IDs
    const agentSourcesSnapshot = await db.collection('agent_sources')
      .where('agentId', '==', agentId)
      .where('userId', '==', ownerUserId)
      .get();
    
    const sourceIds = agentSourcesSnapshot.docs.map(doc => doc.data().sourceId);
    console.log(`Found ${sourceIds.length} assigned sources\n`);
    
    // Get full details from context_sources
    console.log('Checking indexing status:\n');
    
    const statusCounts = {
      indexed: 0,
      processing: 0,
      failed: 0,
      pending: 0,
      unknown: 0,
    };
    
    const samples = {
      indexed: [],
      processing: [],
      failed: [],
      pending: [],
      unknown: [],
    };
    
    for (const sourceId of sourceIds) {
      const doc = await db.collection('context_sources').doc(sourceId).get();
      
      if (!doc.exists) {
        console.log(`⚠️  Source ${sourceId} not found in context_sources`);
        statusCounts.unknown++;
        continue;
      }
      
      const data = doc.data();
      const status = data.indexingStatus || data.status || 'unknown';
      const hasChunks = data.chunkCount > 0 || data.chunksGenerated > 0;
      
      if (hasChunks || status === 'indexed' || status === 'completed') {
        statusCounts.indexed++;
        if (samples.indexed.length < 3) {
          samples.indexed.push({ id: sourceId, name: data.name, chunks: data.chunkCount || 0 });
        }
      } else if (status === 'processing' || status === 'indexing') {
        statusCounts.processing++;
        if (samples.processing.length < 3) {
          samples.processing.push({ id: sourceId, name: data.name, status });
        }
      } else if (status === 'failed' || status === 'error') {
        statusCounts.failed++;
        if (samples.failed.length < 3) {
          samples.failed.push({ id: sourceId, name: data.name, error: data.error || 'Unknown error' });
        }
      } else if (status === 'pending' || status === 'uploaded') {
        statusCounts.pending++;
        if (samples.pending.length < 3) {
          samples.pending.push({ id: sourceId, name: data.name, status });
        }
      } else {
        statusCounts.unknown++;
        if (samples.unknown.length < 3) {
          samples.unknown.push({ id: sourceId, name: data.name, status });
        }
      }
    }
    
    // Print summary
    console.log('=' . repeat(60));
    console.log('INDEXING STATUS SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Indexed:    ${statusCounts.indexed}/${sourceIds.length}`);
    console.log(`🔄 Processing: ${statusCounts.processing}/${sourceIds.length}`);
    console.log(`⏳ Pending:    ${statusCounts.pending}/${sourceIds.length}`);
    console.log(`❌ Failed:     ${statusCounts.failed}/${sourceIds.length}`);
    console.log(`❓ Unknown:    ${statusCounts.unknown}/${sourceIds.length}`);
    console.log('='.repeat(60));
    
    // Print samples
    if (samples.indexed.length > 0) {
      console.log('\n✅ Sample INDEXED documents:');
      samples.indexed.forEach((s, idx) => {
        console.log(`   ${idx + 1}. ${s.name} (${s.chunks} chunks)`);
      });
    }
    
    if (samples.pending.length > 0) {
      console.log('\n⏳ Sample PENDING documents:');
      samples.pending.forEach((s, idx) => {
        console.log(`   ${idx + 1}. ${s.name} - Status: ${s.status}`);
      });
    }
    
    if (samples.failed.length > 0) {
      console.log('\n❌ Sample FAILED documents:');
      samples.failed.forEach((s, idx) => {
        console.log(`   ${idx + 1}. ${s.name}`);
        console.log(`      Error: ${s.error}`);
      });
    }
    
    if (samples.unknown.length > 0) {
      console.log('\n❓ Sample UNKNOWN status documents:');
      samples.unknown.forEach((s, idx) => {
        console.log(`   ${idx + 1}. ${s.name} - Status: ${s.status}`);
      });
    }
    
    // Recommendation
    console.log('\n' + '='.repeat(60));
    console.log('RECOMMENDATION:');
    console.log('='.repeat(60));
    
    if (statusCounts.indexed === sourceIds.length) {
      console.log('✅ All documents are indexed. RAG should work.');
      console.log('   If RAG still not working, check BigQuery sync.');
    } else if (statusCounts.pending > 0 || statusCounts.unknown > 0) {
      console.log('⚠️  Documents need to be indexed.');
      console.log(`   ${statusCounts.pending + statusCounts.unknown} documents are not indexed yet.`);
      console.log('\n   Options:');
      console.log('   1. Trigger re-indexing via API endpoint');
      console.log('   2. Use admin panel to trigger batch indexing');
      console.log('   3. Check if indexing service is running');
    } else if (statusCounts.failed > 0) {
      console.log('❌ Some documents failed indexing.');
      console.log('   Check the error messages above.');
      console.log('   May need to re-upload or fix document format.');
    } else if (statusCounts.processing > 0) {
      console.log('🔄 Documents are being processed.');
      console.log('   Wait a few minutes and check again.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkIndexingStatus();

