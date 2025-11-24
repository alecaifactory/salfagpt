#!/usr/bin/env node

/**
 * Assign ALL M001 context sources to M1-v2 agent
 * 
 * This script:
 * 1. Finds all active context_sources for user
 * 2. Creates agent_sources assignments for M1-v2
 * 3. Enables sources on agent (activeContextSourceIds)
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const PRODUCTION_PROJECT = 'salfagpt';
initializeApp({ projectId: PRODUCTION_PROJECT });
const db = getFirestore();

// M1-v2 Configuration
const AGENT_ID = 'cjn3bC0HrUYtHqu69CKS'; // M1-v2 ASISTENTE LEGAL TERRITORIAL RDI
const USER_ID = 'usr_uhwqffaqag1wrryd82tw'; // alec@salfacloud.cl

async function main() {
  console.log('🔍 M1-v2 Bulk Assignment Script');
  console.log('================================\n');
  console.log(`Agent: M1-v2 (${AGENT_ID})`);
  console.log(`User: ${USER_ID}\n`);
  
  // 1. Get all active context sources for user
  console.log('📚 Finding all context sources...');
  const sourcesSnapshot = await db.collection('context_sources')
    .where('userId', '==', USER_ID)
    .where('status', '==', 'active')
    .get();
  
  const sources = sourcesSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  
  console.log(`✅ Found ${sources.length} active sources\n`);
  
  // 2. Check existing assignments
  console.log('🔍 Checking existing assignments...');
  const existingSnapshot = await db.collection('agent_sources')
    .where('agentId', '==', AGENT_ID)
    .get();
  
  const existingSourceIds = new Set(
    existingSnapshot.docs.map(doc => doc.data().sourceId)
  );
  
  console.log(`✅ Found ${existingSourceIds.size} existing assignments\n`);
  
  // 3. Create missing assignments
  const toAssign = sources.filter(s => !existingSourceIds.has(s.id));
  
  if (toAssign.length === 0) {
    console.log('✅ All sources already assigned!\n');
  } else {
    console.log(`📝 Creating ${toAssign.length} new assignments...\n`);
    
    let count = 0;
    let batchNum = 1;
    
    for (let i = 0; i < toAssign.length; i += 500) {
      const batch = db.batch();
      const chunk = toAssign.slice(i, i + 500);
      
      for (const source of chunk) {
        const assignmentRef = db.collection('agent_sources').doc();
        
        batch.set(assignmentRef, {
          agentId: AGENT_ID,
          sourceId: source.id,
          userId: USER_ID,
          sourceName: source.name,
          assignedAt: FieldValue.serverTimestamp(),
          assignedBy: 'bulk-assign-script',
          source: 'localhost'
        });
        
        count++;
      }
      
      await batch.commit();
      console.log(`  ✅ Committed batch ${batchNum} (${count}/${toAssign.length})`);
      batchNum++;
    }
    
    console.log(`✅ Created ${toAssign.length} agent_sources assignments\n`);
  }
  
  // 4. Update agent's activeContextSourceIds
  console.log('🔄 Updating agent activeContextSourceIds...');
  
  const allSourceIds = sources.map(s => s.id);
  
  await db.collection('conversations').doc(AGENT_ID).update({
    activeContextSourceIds: allSourceIds,
    updatedAt: FieldValue.serverTimestamp()
  });
  
  console.log(`✅ Enabled ${allSourceIds.length} sources on agent\n`);
  
  // 5. Verification
  console.log('🔍 Verifying assignments...');
  
  const verifySnapshot = await db.collection('agent_sources')
    .where('agentId', '==', AGENT_ID)
    .get();
  
  console.log(`✅ Total agent_sources for S1-v2: ${verifySnapshot.size}\n`);
  
  // 6. Summary
  console.log('## 📊 RESUMEN ASIGNACIÓN S1-v2\n');
  console.log('| Métrica | Valor |');
  console.log('|---------|-------|');
  console.log(`| Total sources disponibles | ${sources.length} |`);
  console.log(`| Asignaciones pre-existentes | ${existingSourceIds.size} |`);
  console.log(`| Nuevas asignaciones creadas | ${toAssign.length} |`);
  console.log(`| Total asignaciones S1-v2 | ${verifySnapshot.size} |`);
  console.log(`| Sources habilitados en agent | ${allSourceIds.length} |\n`);
  
  console.log('✅ Assignment complete!\n');
  console.log('📋 Next step: Run check-s001-status.mjs to verify');
}

main()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });

