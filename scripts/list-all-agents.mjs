/**
 * List all agents to find the right one
 */

import { Firestore } from '@google-cloud/firestore';

const PROJECT_ID = 'salfagpt';
const firestore = new Firestore({
  projectId: PROJECT_ID,
  databaseId: '(default)',
});

async function listAgents() {
  try {
    console.log('📋 Listing all agents...\n');
    
    const snapshot = await firestore.collection('conversations')
      .orderBy('updatedAt', 'desc')
      .limit(50)
      .get();
    
    console.log(`Total agents found: ${snapshot.size}\n`);
    
    snapshot.docs.forEach((doc, idx) => {
      const data = doc.data();
      console.log(`${idx + 1}. "${data.title || 'Untitled'}"`);
      console.log(`   ID: ${doc.id}`);
      console.log(`   Owner: ${data.userId}`);
      console.log(`   Tags: ${data.tags?.join(', ') || 'none'}`);
      console.log(`   Model: ${data.agentModel || 'unknown'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

listAgents();

