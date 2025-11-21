#!/usr/bin/env node

/**
 * Index all 75 documents assigned to S1-v2 for RAG
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({ projectId: 'salfagpt' });
const db = getFirestore();

async function indexS1v2Documents() {
  const agentId = 'iQmdg3bMSJ1AdqqlFpye';
  const ownerUserId = 'usr_uhwqffaqag1wrryd82tw';
  
  console.log('🔄 Starting indexing of S1-v2 documents...\n');
  
  try {
    // Get assigned source IDs
    console.log('1. Getting assigned sources...');
    const agentSourcesSnapshot = await db.collection('agent_sources')
      .where('agentId', '==', agentId)
      .where('userId', '==', ownerUserId)
      .get();
    
    const sourceIds = agentSourcesSnapshot.docs.map(doc => doc.data().sourceId);
    console.log(`   ✅ Found ${sourceIds.length} sources to index\n`);
    
    if (sourceIds.length === 0) {
      console.log('   ❌ No sources to index!');
      return;
    }
    
    // Index each document
    console.log('2. Indexing documents...\n');
    
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    const errors = [];
    
    for (let i = 0; i < sourceIds.length; i++) {
      const sourceId = sourceIds[i];
      
      // Get source name
      const sourceDoc = await db.collection('context_sources').doc(sourceId).get();
      const sourceName = sourceDoc.data()?.name || sourceId;
      
      console.log(`   [${i + 1}/${sourceIds.length}] ${sourceName}`);
      
      // Check if has extracted data
      if (!sourceDoc.data()?.extractedData && !sourceDoc.data()?.extractedDataUrl) {
        console.log(`      ⚠️  No extracted data - skipping`);
        skippedCount++;
        continue;
      }
      
      try {
        // Call enable-rag endpoint
        const response = await fetch(`http://localhost:3000/api/context-sources/${sourceId}/enable-rag`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            forceReindex: true, // Force reindex even if already indexed
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.log(`      ❌ Error ${response.status}: ${errorText.substring(0, 100)}`);
          errorCount++;
          errors.push({ sourceId, sourceName, error: errorText.substring(0, 200) });
          continue;
        }
        
        const data = await response.json();
        
        console.log(`      ✅ Indexed: ${data.chunksCount || 'N/A'} chunks`);
        if (data.chunksFiltered > 0) {
          console.log(`         (Filtered ${data.chunksFiltered} garbage chunks)`);
        }
        
        successCount++;
        
        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.log(`      ❌ Error:`, error.message);
        errorCount++;
        errors.push({ sourceId, sourceName, error: error.message });
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('INDEXING SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Success:  ${successCount}/${sourceIds.length}`);
    console.log(`❌ Errors:   ${errorCount}/${sourceIds.length}`);
    console.log(`⚠️  Skipped:  ${skippedCount}/${sourceIds.length}`);
    console.log('='.repeat(60));
    
    if (errors.length > 0) {
      console.log('\n❌ ERRORS:');
      errors.forEach((err, idx) => {
        console.log(`   ${idx + 1}. ${err.sourceName}`);
        console.log(`      ${err.error}`);
      });
    }
    
    if (successCount > 0) {
      console.log('\n✅ Indexing complete!');
      console.log('   Wait ~30 seconds for BigQuery to update, then test RAG again.');
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

indexS1v2Documents();

