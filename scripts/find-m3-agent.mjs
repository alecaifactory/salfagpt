import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({
  credential: applicationDefault(),
  projectId: 'salfagpt'
});

const db = getFirestore();

async function findM3() {
  console.log('🔍 Searching for M3-v2 agent...\n');
  
  // Search all agents
  const snapshot = await db
    .collection('conversations')
    .where('isAgent', '==', true)
    .get();
  
  console.log(`Total agents: ${snapshot.size}\n`);
  
  const m3Agents = snapshot.docs.filter(doc => {
    const title = doc.data()?.title || '';
    return title.includes('M3') || title.includes('GOP') || title === 'M3-v2';
  });
  
  console.log(`Found ${m3Agents.length} agents with M3 or GOP:\n`);
  
  m3Agents.forEach(doc => {
    const data = doc.data();
    console.log(`📌 ${data.title}`);
    console.log(`   ID: ${doc.id}`);
    console.log(`   Owner: ${data.userId}`);
    console.log(`   Created: ${data.createdAt?.toDate?.()}\n`);
  });
  
  process.exit(0);
}

findM3();
