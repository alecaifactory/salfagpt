#!/usr/bin/env node

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({ projectId: 'salfagpt' });
const db = getFirestore();

const USER_ID = 'usr_uhwqffaqag1wrryd82tw';

async function main() {
  console.log('🔍 Verificando Agent IDs actuales...\n');

  const expectedAgents = {
    'S1-v2': 'iQmdg3bMSJ1AdqqlFpye',
    'S2-v2': '1lgr33ywq5qed67sqCYi',
    'M1-v2': 'EgXezLcu4O3IUqFUJhUZ',
    'M3-v2': 'vStojK73ZKbjNsEnqANJ'
  };

  console.log('📋 IDs Esperados:');
  for (const [name, id] of Object.entries(expectedAgents)) {
    console.log(`  ${name}: ${id}`);
  }
  console.log('');

  const snapshot = await db.collection('conversations')
    .where('userId', '==', USER_ID)
    .get();

  console.log('🔍 IDs en Firestore:\n');

  const found = {
    'S1-v2': null,
    'S2-v2': null,
    'M1-v2': null,
    'M3-v2': null
  };

  snapshot.docs.forEach(doc => {
    const title = doc.data().title || '';
    const id = doc.id;
    const sources = (doc.data().activeContextSourceIds || []).length;
    
    if (title.includes('S1') || title.includes('S001') || title.toLowerCase().includes('bodega')) {
      console.log(`  S1-v2: ${id} - ${title} (${sources} sources)`);
      found['S1-v2'] = id;
    }
    else if (title.includes('S2') || title.includes('S002') || title.toLowerCase().includes('maqsa')) {
      console.log(`  S2-v2: ${id} - ${title} (${sources} sources)`);
      found['S2-v2'] = id;
    }
    else if (title.includes('M1') || title.includes('M001')) {
      console.log(`  M1-v2: ${id} - ${title} (${sources} sources)`);
      found['M1-v2'] = id;
    }
    else if (title.includes('M3') || title.includes('M003') || title.includes('GOP')) {
      console.log(`  M3-v2: ${id} - ${title} (${sources} sources)`);
      found['M3-v2'] = id;
    }
  });

  console.log('\n🔄 Verificación:\n');

  let allMatch = true;
  const mismatches = [];
  
  for (const [name, expectedId] of Object.entries(expectedAgents)) {
    const actualId = found[name];
    const match = actualId === expectedId;
    const status = match ? '✅' : '❌';
    
    console.log(`  ${status} ${name}:`);
    console.log(`     Esperado: ${expectedId}`);
    console.log(`     Actual:   ${actualId || 'NO ENCONTRADO'}`);
    
    if (!match) {
      allMatch = false;
      mismatches.push({
        agent: name,
        expected: expectedId,
        actual: actualId
      });
      console.log(`     ⚠️  MISMATCH!`);
    }
    console.log('');
  }

  if (allMatch) {
    console.log('✅ Todos los IDs coinciden correctamente!\n');
  } else {
    console.log('⚠️  Hay diferencias detectadas:\n');
    
    mismatches.forEach(m => {
      console.log(`  Agent: ${m.agent}`);
      console.log(`    Need to update scripts using: ${m.actual || 'NOT FOUND'}`);
      console.log(`    To use correct ID: ${m.expected}`);
      console.log('');
    });
    
    console.log('📋 Scripts que pueden necesitar actualización:');
    mismatches.forEach(m => {
      const agentCode = m.agent.toLowerCase().replace('-', '');
      console.log(`  - scripts/check-${agentCode.substring(0, 4)}-status.mjs`);
      console.log(`  - scripts/assign-all-${agentCode.substring(0, 4)}-to-${m.agent}.mjs`);
      console.log(`  - scripts/process-${m.agent}-chunks.mjs`);
      console.log(`  - scripts/test-${m.agent}-evaluation.mjs`);
      console.log('');
    });
  }

  process.exit(allMatch ? 0 : 1);
}

main();




