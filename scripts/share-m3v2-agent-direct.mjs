/**
 * Script to share GOP GPT (M3-v2) agent with alec@salfacloud.cl as User
 * Direct Firestore access (no API needed)
 * 
 * Usage: node scripts/share-m3v2-agent-direct.mjs
 */

import { Firestore, Timestamp } from '@google-cloud/firestore';

// Initialize Firestore
const PROJECT_ID = 'salfagpt';
const firestore = new Firestore({
  projectId: PROJECT_ID,
  databaseId: '(default)',
});

async function shareM3Agent() {
  try {
    console.log('🔍 Step 1: Finding M3-v2 agent...\n');
    
    // Search for M3-v2 agent
    const snapshot = await firestore.collection('conversations')
      .where('title', '>=', 'GOP GPT (M3-v2)')
      .where('title', '<=', 'GOP GPT (M3-v2)\uf8ff')
      .limit(5)
      .get();
    
    let m3Agent = null;
    
    if (snapshot.empty) {
      console.log('No exact match. Searching for M3 in titles...\n');
      
      // Try broader search
      const allSnapshot = await firestore.collection('conversations')
        .orderBy('updatedAt', 'desc')
        .limit(200)
        .get();
      
      const m3Agents = [];
      allSnapshot.docs.forEach(doc => {
        const title = doc.data().title || '';
        if (title.includes('M3-v2') || title.includes('M3')) {
          m3Agents.push({
            id: doc.id,
            ...doc.data()
          });
        }
      });
      
      if (m3Agents.length === 0) {
        console.log('❌ No M3 agent found');
        process.exit(1);
      }
      
      console.log(`📋 Found ${m3Agents.length} M3 agents:\n`);
      m3Agents.forEach((agent, idx) => {
        console.log(`${idx + 1}. ${agent.title}`);
        console.log(`   ID: ${agent.id}`);
        console.log(`   Owner: ${agent.userId}`);
        console.log('');
      });
      
      // Use the first M3-v2 agent found
      m3Agent = m3Agents.find(a => a.title.includes('M3-v2')) || m3Agents[0];
    } else {
      m3Agent = {
        id: snapshot.docs[0].id,
        ...snapshot.docs[0].data()
      };
    }
    
    console.log('✅ Selected agent:');
    console.log(`   ID: ${m3Agent.id}`);
    console.log(`   Title: ${m3Agent.title}`);
    console.log(`   Owner: ${m3Agent.userId}`);
    console.log('');
    
    console.log('📤 Step 2: Creating share record...\n');
    
    // Create share record
    const shareData = {
      agentId: m3Agent.id,
      ownerId: m3Agent.userId,
      sharedWith: [
        {
          type: 'user',
          id: '', // Will be populated when user logs in
          email: 'alec@salfacloud.cl'
        }
      ],
      accessLevel: 'use', // User level access
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      expiresAt: null,
    };
    
    const shareRef = await firestore.collection('agent_shares').add(shareData);
    
    console.log('✅ Share created successfully!');
    console.log('');
    console.log('📋 Share Details:');
    console.log(`   Share ID: ${shareRef.id}`);
    console.log(`   Agent: ${m3Agent.title} (${m3Agent.id})`);
    console.log(`   Shared with: alec@salfacloud.cl`);
    console.log(`   Access Level: use (User - can view and use)`);
    console.log(`   Created: ${new Date().toLocaleString()}`);
    console.log('');
    console.log('✨ Next Steps:');
    console.log('   1. User alec@salfacloud.cl needs to log into the platform');
    console.log('   2. Agent will appear in their "Shared with Me" section');
    console.log('   3. They can use the agent but cannot modify it');
    console.log('');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

shareM3Agent();

