import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({
  credential: applicationDefault(),
  projectId: 'salfagpt'
});

const db = getFirestore();

async function findAgents() {
  console.log('🔍 Searching for agents by title...\n');
  
  const targetAgents = [
    'GESTION BODEGAS GPT (S001)',
    'MAQSA Mantenimiento (S002)',
    'Asistente Legal Territorial RDI (M001)',
    'GOP GPT (M003)'
  ];
  
  for (const title of targetAgents) {
    console.log(`Searching for: "${title}"`);
    
    try {
      const snapshot = await db.collection('conversations')
        .where('title', '==', title)
        .limit(5)
        .get();
      
      if (snapshot.empty) {
        // Try partial match
        const allAgents = await db.collection('conversations')
          .orderBy('title')
          .limit(1000)
          .get();
        
        const matches = [];
        allAgents.forEach(doc => {
          const data = doc.data();
          if (data.title?.includes('S001') || 
              data.title?.includes('S002') ||
              data.title?.includes('M001') ||
              data.title?.includes('M003') ||
              data.title?.toLowerCase().includes(title.split('(')[0].trim().toLowerCase())) {
            matches.push({
              id: doc.id,
              title: data.title,
              userId: data.userId,
              allowedUsers: data.allowedUsers?.length || 0
            });
          }
        });
        
        if (matches.length > 0) {
          console.log(`  📍 Similar agents found:`);
          matches.forEach(m => {
            console.log(`     ${m.id}: "${m.title}" (${m.allowedUsers} users)`);
          });
        } else {
          console.log(`  ❌ Not found\n`);
        }
      } else {
        console.log(`  ✅ Found ${snapshot.size} match(es):`);
        snapshot.forEach(doc => {
          const data = doc.data();
          console.log(`     ID: ${doc.id}`);
          console.log(`     Owner: ${data.userId}`);
          console.log(`     AllowedUsers: ${data.allowedUsers?.length || 0}`);
        });
        console.log('');
      }
    } catch (error) {
      console.error(`  ❌ Error: ${error.message}\n`);
    }
  }
}

findAgents()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
