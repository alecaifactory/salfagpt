#!/usr/bin/env node

/**
 * Debug script to check S1-v2 configuration in localhost
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({ projectId: 'salfagpt' });
const db = getFirestore();

async function debugS1v2() {
  const agentId = 'iQmdg3bMSJ1AdqqlFpye';
  const userId = 'usr_uhwqffaqag1wrryd82tw';
  
  console.log('🔍 Debugging S1-v2 in Firestore...\n');
  
  try {
    // 1. Check agent document
    console.log('1. Checking agent document...');
    const agentDoc = await db.collection('conversations').doc(agentId).get();
    
    if (!agentDoc.exists) {
      console.error('❌ Agent document not found!');
      return;
    }
    
    const agentData = agentDoc.data();
    console.log(`   ✅ Agent exists: ${agentData.title}`);
    console.log(`   • userId: ${agentData.userId}`);
    console.log(`   • activeContextSourceIds: ${(agentData.activeContextSourceIds || []).length} IDs`);
    
    if (agentData.activeContextSourceIds && agentData.activeContextSourceIds.length > 0) {
      console.log(`   • First 5 active IDs:`, agentData.activeContextSourceIds.slice(0, 5));
    } else {
      console.log('   ⚠️  NO activeContextSourceIds on agent document!');
    }
    
    // 2. Check agent_sources assignments
    console.log('\n2. Checking agent_sources assignments...');
    const assignmentsSnapshot = await db.collection('agent_sources')
      .where('agentId', '==', agentId)
      .where('userId', '==', userId)
      .get();
    
    console.log(`   • Assignments found: ${assignmentsSnapshot.size}`);
    
    if (assignmentsSnapshot.size > 0) {
      const sourceIds = assignmentsSnapshot.docs.map(d => d.data().sourceId);
      console.log(`   • Source IDs (first 5):`, sourceIds.slice(0, 5));
      
      // Check if these match activeContextSourceIds
      const activeIds = new Set(agentData.activeContextSourceIds || []);
      const matchCount = sourceIds.filter(id => activeIds.has(id)).length;
      console.log(`   • Match with activeContextSourceIds: ${matchCount}/${assignmentsSnapshot.size}`);
      
      if (matchCount < assignmentsSnapshot.size) {
        console.log('   ⚠️  Some assigned sources are NOT in activeContextSourceIds!');
      }
    } else {
      console.log('   ❌ NO assignments in agent_sources collection!');
    }
    
    // 3. Check if sources exist
    console.log('\n3. Checking if sources exist...');
    const activeIds = agentData.activeContextSourceIds || [];
    
    if (activeIds.length > 0) {
      const sampleId = activeIds[0];
      const sourceDoc = await db.collection('context_sources').doc(sampleId).get();
      
      if (sourceDoc.exists) {
        const sourceData = sourceDoc.data();
        console.log(`   ✅ Sample source exists: ${sourceData.name}`);
        console.log(`   • RAG enabled: ${sourceData.ragEnabled || false}`);
        console.log(`   • Has extractedData: ${!!sourceData.extractedData}`);
        console.log(`   • Chunk count: ${sourceData.ragMetadata?.chunkCount || 0}`);
      } else {
        console.log(`   ❌ Sample source ID ${sampleId} does NOT exist!`);
      }
    }
    
    // 4. Test the API endpoints
    console.log('\n4. Summary:');
    console.log('   ════════════════════════════════════════');
    console.log(`   Agent: ${agentData.title}`);
    console.log(`   Active Sources: ${(agentData.activeContextSourceIds || []).length}`);
    console.log(`   Assignments (agent_sources): ${assignmentsSnapshot.size}`);
    
    if ((agentData.activeContextSourceIds || []).length === 0) {
      console.log('\n   ❌ PROBLEM: activeContextSourceIds is empty!');
      console.log('   → Frontend will not load any sources');
      console.log('   → RAG will not work');
      console.log('\n   SOLUTION: Run scripts/assign-exact-75-to-s1v2.mjs again');
    } else if (assignmentsSnapshot.size === 0) {
      console.log('\n   ⚠️  WARNING: No agent_sources assignments!');
      console.log('   → API might not find sources');
    } else {
      console.log('\n   ✅ Configuration looks good!');
      console.log('   → Check frontend console logs');
      console.log('   → Check if /api/agents/[id]/context-stats returns activeSourceIds');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugS1v2();

