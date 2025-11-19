#!/usr/bin/env node

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({ projectId: 'salfagpt' });
const db = getFirestore();

async function checkUserSources() {
  const userId = 'usr_uhwqffaqag1wrryd82tw';
  const agentId = 'iQmdg3bMSJ1AdqqlFpye';
  
  console.log(`🔍 Checking sources for user: ${userId}\n`);
  
  // Check context_sources
  const sourcesSnapshot = await db.collection('context_sources')
    .where('userId', '==', userId)
    .limit(100)
    .get();
  
  console.log(`📚 Total sources owned by user: ${sourcesSnapshot.size}`);
  
  if (sourcesSnapshot.empty) {
    console.log('❌ No sources found for this user');
    process.exit(1);
  }
  
  console.log('\nSources:');
  sourcesSnapshot.docs.forEach(doc => {
    const data = doc.data();
    const hasData = !!data.extractedData;
    const ragEnabled = data.ragEnabled || false;
    console.log(`  - ${data.name} (${doc.id})`);
    console.log(`    • Extracted: ${hasData ? 'Yes' : 'No'}`);
    console.log(`    • RAG Indexed: ${ragEnabled ? 'Yes' : 'No'}`);
    console.log(`    • Created: ${data.createdAt?.toDate?.()?.toISOString() || 'Unknown'}`);
  });
  
  // Check agent_sources assignments
  console.log(`\n🔗 Checking assignments for agent ${agentId}...`);
  const assignmentsSnapshot = await db.collection('agent_sources')
    .where('agentId', '==', agentId)
    .get();
  
  console.log(`   Assignments found: ${assignmentsSnapshot.size}`);
  
  if (assignmentsSnapshot.empty) {
    console.log('\n⚠️  THE PROBLEM: No sources are assigned to S1-v2!');
    console.log('\n📝 To fix this:');
    console.log('   1. Open SalfaGPT in browser');
    console.log('   2. Click on S1-v2 agent');
    console.log('   3. Click "Gestionar Fuentes" or the context panel');
    console.log('   4. Assign the documents you want to use');
    console.log('   5. Toggle them ON');
  } else {
    assignmentsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(`  - ${data.sourceId}`);
    });
  }
}

checkUserSources().catch(console.error);

