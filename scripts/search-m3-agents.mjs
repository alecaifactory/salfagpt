/**
 * Comprehensive search for M3 agents
 */

import { Firestore } from '@google-cloud/firestore';

const PROJECT_ID = 'salfagpt';
const firestore = new Firestore({
  projectId: PROJECT_ID,
  databaseId: '(default)',
});

async function searchAgents() {
  try {
    console.log('🔍 Comprehensive agent search...\n');
    
    // Get ALL conversations
    const snapshot = await firestore.collection('conversations')
      .get();
    
    console.log(`Total conversations in database: ${snapshot.size}\n`);
    
    // Search patterns
    const patterns = ['M3', 'GOP', 'M003', 'M-3', 'gop'];
    
    for (const pattern of patterns) {
      console.log(`\n🔎 Searching for "${pattern}"...\n`);
      
      const matches = [];
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const title = (data.title || '').toLowerCase();
        const tags = data.tags || [];
        const agentPrompt = (data.agentPrompt || '').toLowerCase();
        
        if (
          title.includes(pattern.toLowerCase()) ||
          tags.some(tag => tag.toLowerCase().includes(pattern.toLowerCase())) ||
          agentPrompt.includes(pattern.toLowerCase())
        ) {
          matches.push({
            id: doc.id,
            title: data.title,
            userId: data.userId,
            tags: tags,
            updatedAt: data.updatedAt?.toDate()
          });
        }
      });
      
      if (matches.length > 0) {
        console.log(`   Found ${matches.length} matches:`);
        matches.forEach(m => {
          console.log(`   - "${m.title}" (ID: ${m.id})`);
          console.log(`     Tags: [${m.tags.join(', ')}]`);
          console.log('');
        });
      } else {
        console.log(`   No matches found`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

searchAgents();

