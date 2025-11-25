#!/usr/bin/env node
import { firestore, getAgentShares } from '../src/lib/firestore.js';

const AGENT_TITLES = [
  'GOP GPT (M003)',
  'MAQSA Mantenimiento (S002)',
  'GESTION BODEGAS GPT (S001)',
  'Asistente Legal Territorial RDI (M001)'
];

console.log('🔍 Searching for agents with these titles:');
AGENT_TITLES.forEach(title => console.log('  -', title));
console.log('');

async function main() {
  // Search for agents by title
  const conversationsRef = firestore.collection('conversations');
  const promises = AGENT_TITLES.map(async (title) => {
    const snapshot = await conversationsRef
      .where('title', '==', title)
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      console.log(`❌ Agent NOT FOUND: ${title}`);
      return null;
    }
    
    const agentDoc = snapshot.docs[0];
    const agentData = agentDoc.data();
    
    console.log(`✅ Found: ${title}`);
    console.log(`   ID: ${agentDoc.id}`);
    console.log(`   Owner: ${agentData.userId}`);
    
    // Get shares for this agent
    const shares = await getAgentShares(agentDoc.id);
    
    if (shares.length === 0) {
      console.log(`   📋 No shares found`);
    } else {
      console.log(`   📋 Current shares: ${shares.length}`);
      shares.forEach((share, idx) => {
        console.log(`   Share ${idx + 1}:`);
        console.log(`     - Share ID: ${share.id}`);
        console.log(`     - Access Level: ${share.accessLevel}`);
        console.log(`     - Shared With: ${share.sharedWith.length} targets`);
        share.sharedWith.forEach((target, i) => {
          console.log(`       ${i + 1}. Type: ${target.type}, ID: ${target.id}, Email: ${target.email || 'N/A'}`);
        });
      });
    }
    console.log('');
    
    return {
      title,
      id: agentDoc.id,
      owner: agentData.userId,
      shares
    };
  });

  const results = await Promise.all(promises);
  const foundAgents = results.filter(r => r !== null);

  console.log(`\n📊 Summary: Found ${foundAgents.length} of ${AGENT_TITLES.length} agents`);
  
  return foundAgents;
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
  });

