/**
 * Script to find and share GOP agent with alec@salfacloud.cl
 * 
 * Usage: node scripts/find-and-share-gop-agent.mjs
 */

import { Firestore, Timestamp } from '@google-cloud/firestore';

// Initialize Firestore
const PROJECT_ID = 'salfagpt';
const firestore = new Firestore({
  projectId: PROJECT_ID,
  databaseId: '(default)',
});

async function findAndShareAgent() {
  try {
    console.log('🔍 Searching for GOP agents...\n');
    
    // Get recent conversations
    const snapshot = await firestore.collection('conversations')
      .orderBy('updatedAt', 'desc')
      .limit(500)
      .get();
    
    const gopAgents = [];
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const title = data.title || '';
      if (title.toUpperCase().includes('GOP') || title.includes('M3')) {
        gopAgents.push({
          id: doc.id,
          title: data.title,
          userId: data.userId,
          updatedAt: data.updatedAt?.toDate(),
          tags: data.tags || []
        });
      }
    });
    
    if (gopAgents.length === 0) {
      console.log('❌ No GOP agents found');
      process.exit(1);
    }
    
    console.log(`📋 Found ${gopAgents.length} GOP agents:\n`);
    gopAgents.forEach((agent, idx) => {
      console.log(`${idx + 1}. "${agent.title}"`);
      console.log(`   ID: ${agent.id}`);
      console.log(`   Tags: ${agent.tags.join(', ') || 'none'}`);
      console.log(`   Updated: ${agent.updatedAt?.toLocaleString() || 'unknown'}`);
      console.log('');
    });
    
    // Find M3-v2 specifically or use first GOP agent
    let selectedAgent = gopAgents.find(a => 
      a.title.includes('M3-v2') || 
      a.title === 'GOP GPT (M3-v2)'
    );
    
    if (!selectedAgent && gopAgents.length > 0) {
      console.log('⚠️  M3-v2 not found specifically, using first GOP agent\n');
      selectedAgent = gopAgents[0];
    }
    
    console.log('✅ Selected agent for sharing:');
    console.log(`   Title: ${selectedAgent.title}`);
    console.log(`   ID: ${selectedAgent.id}`);
    console.log('');
    
    console.log('📤 Creating share record...\n');
    
    // Create share record
    const shareData = {
      agentId: selectedAgent.id,
      ownerId: selectedAgent.userId,
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
    
    console.log('✅ Share created successfully!\n');
    console.log('📋 Share Details:');
    console.log(`   Share ID: ${shareRef.id}`);
    console.log(`   Agent: ${selectedAgent.title}`);
    console.log(`   Agent ID: ${selectedAgent.id}`);
    console.log(`   Shared with: alec@salfacloud.cl`);
    console.log(`   Access Level: use (User)`);
    console.log(`   Can view: ✅`);
    console.log(`   Can use: ✅`);
    console.log(`   Can edit: ❌`);
    console.log(`   Can admin: ❌`);
    console.log('');
    console.log('✨ Next Steps:');
    console.log('   1. User logs in with alec@salfacloud.cl');
    console.log('   2. Agent appears in "Compartidos Conmigo" section');
    console.log('   3. User can view and interact with the agent');
    console.log('   4. User cannot modify agent configuration');
    console.log('');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

findAndShareAgent();

