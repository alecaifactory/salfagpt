#!/usr/bin/env node
import admin from 'firebase-admin';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firestore
const PROJECT_ID = 'salfagpt';
admin.initializeApp({
  projectId: PROJECT_ID
});

const firestore = admin.firestore();

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
  const conversationsRef = firestore.collection('conversations');
  
  const results = [];
  
  for (const title of AGENT_TITLES) {
    const snapshot = await conversationsRef
      .where('title', '==', title)
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      console.log(`❌ Agent NOT FOUND: ${title}`);
      results.push({ title, found: false });
      continue;
    }
    
    const agentDoc = snapshot.docs[0];
    const agentData = agentDoc.data();
    
    console.log(`✅ Found: ${title}`);
    console.log(`   ID: ${agentDoc.id}`);
    console.log(`   Owner: ${agentData.userId}`);
    
    // Get shares for this agent
    const sharesSnapshot = await firestore
      .collection('agent_shares')
      .where('agentId', '==', agentDoc.id)
      .get();
    
    const shares = sharesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    if (shares.length === 0) {
      console.log(`   📋 No shares found`);
    } else {
      console.log(`   📋 Current shares: ${shares.length}`);
      shares.forEach((share, idx) => {
        console.log(`   Share ${idx + 1}:`);
        console.log(`     - Share ID: ${share.id}`);
        console.log(`     - Access Level: ${share.accessLevel}`);
        console.log(`     - Shared With: ${share.sharedWith?.length || 0} targets`);
        
        if (share.sharedWith && share.sharedWith.length > 0) {
          share.sharedWith.forEach((target, i) => {
            console.log(`       ${i + 1}. Type: ${target.type}, ID: ${target.id}, Email: ${target.email || 'N/A'}`);
          });
        }
      });
    }
    console.log('');
    
    results.push({
      title,
      found: true,
      id: agentDoc.id,
      owner: agentData.userId,
      shares
    });
  }

  console.log(`\n📊 Summary: Found ${results.filter(r => r.found).length} of ${AGENT_TITLES.length} agents`);
  
  return results;
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
  });




