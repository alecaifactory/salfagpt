#!/usr/bin/env node
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({ projectId: 'salfagpt' });
const db = getFirestore();

const agents = [
  { id: 'iQmdg3bMSJ1AdqqlFpye', name: 'S1-v2', expected: 16 },
  { id: '1lgr33ywq5qed67sqCYi', name: 'S2-v2', expected: 11 },
  { id: 'cjn3bC0HrUYtHqu69CKS', name: 'M1-v2', expected: 14 },
  { id: 'vStojK73ZKbjNsEnqANJ', name: 'M3-v2', expected: 14 }
];

async function main() {
  console.log('\n📊 Checking agent_shares collection:\n');

  for (const agent of agents) {
    const shares = await db.collection('agent_shares')
      .where('agentId', '==', agent.id)
      .get();
    
    console.log(`${agent.name}:`);
    console.log(`  Expected: ${agent.expected} users`);
    console.log(`  agent_shares docs: ${shares.size}`);
    
    if (shares.size > 0) {
      const doc = shares.docs[0];
      const data = doc.data();
      const sharedWithLength = data.sharedWith?.length || 0;
      console.log(`  sharedWith array: ${sharedWithLength} users`);
      console.log(`  Match: ${sharedWithLength === agent.expected ? '✅' : '❌'}`);
      
      if (data.sharedWith && data.sharedWith.length > 0) {
        console.log(`  First 3: ${data.sharedWith.slice(0, 3).map(u => u.email).join(', ')}`);
      }
    } else {
      console.log(`  ❌ NO agent_shares document found!`);
    }
    console.log();
  }

  process.exit(0);
}

main();




