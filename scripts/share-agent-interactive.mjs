/**
 * Interactive script to share an agent
 * Allows selecting from found agents
 */

import { Firestore, Timestamp } from '@google-cloud/firestore';

const PROJECT_ID = 'salfagpt';
const firestore = new Firestore({
  projectId: PROJECT_ID,
  databaseId: '(default)',
});

async function shareAgent() {
  try {
    console.log('🔍 Searching for agents containing "GOP" or "M3"...\n');
    
    // Get all conversations
    const snapshot = await firestore.collection('conversations')
      .orderBy('updatedAt', 'desc')
      .get();
    
    const candidates = [];
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const title = (data.title || '').toLowerCase();
      const tags = data.tags || [];
      
      if (
        title.includes('gop') || 
        title.includes('m3') ||
        title.includes('m003') ||
        title.includes('m-3') ||
        tags.some(tag => tag.toLowerCase().includes('m3') || tag.toLowerCase().includes('m003'))
      ) {
        candidates.push({
          id: doc.id,
          title: data.title,
          userId: data.userId,
          tags: tags,
          agentModel: data.agentModel,
          updatedAt: data.updatedAt?.toDate()
        });
      }
    });
    
    if (candidates.length === 0) {
      console.log('❌ No GOP or M3 agents found');
      console.log('\n💡 Suggestion: Please verify the agent name.');
      console.log('   The agent might be named differently or might not exist yet.');
      process.exit(1);
    }
    
    console.log(`📋 Found ${candidates.length} candidate agents:\n`);
    candidates.forEach((agent, idx) => {
      console.log(`${idx + 1}. "${agent.title}"`);
      console.log(`   ID: ${agent.id}`);
      console.log(`   Tags: [${agent.tags.join(', ')}]`);
      console.log(`   Model: ${agent.agentModel}`);
      console.log(`   Updated: ${agent.updatedAt?.toLocaleString()}`);
      console.log('');
    });
    
    // Default to first agent or M3-v2 if found
    let selectedAgent = candidates.find(a => 
      a.title.toLowerCase().includes('m3-v2') ||
      a.title.toLowerCase().includes('m3 v2')
    ) || candidates[0];
    
    console.log('✅ Selecting agent to share:');
    console.log(`   Title: "${selectedAgent.title}"`);
    console.log(`   ID: ${selectedAgent.id}\n`);
    
    console.log('📤 Sharing with alec@salfacloud.cl as User (access level: use)...\n');
    
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
      accessLevel: 'use', // User level
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      expiresAt: null,
    };
    
    const shareRef = await firestore.collection('agent_shares').add(shareData);
    
    console.log('✅ Agent shared successfully!\n');
    console.log('═══════════════════════════════════════════════\n');
    console.log('📋 SHARE DETAILS:\n');
    console.log(`   Share ID: ${shareRef.id}`);
    console.log(`   Agent: "${selectedAgent.title}"`);
    console.log(`   Agent ID: ${selectedAgent.id}`);
    console.log(`   Shared with: alec@salfacloud.cl`);
    console.log(`   Access Level: use (User)`);
    console.log('');
    console.log('   Permissions:');
    console.log('   ✅ Can view agent');
    console.log('   ✅ Can use agent (send messages)');
    console.log('   ✅ Can see agent responses');
    console.log('   ❌ Cannot modify agent configuration');
    console.log('   ❌ Cannot delete agent');
    console.log('   ❌ Cannot re-share agent');
    console.log('');
    console.log('═══════════════════════════════════════════════\n');
    console.log('✨ NEXT STEPS:\n');
    console.log('   1. User alec@salfacloud.cl logs into the platform');
    console.log('   2. Clicks on "Compartidos Conmigo" section');
    console.log(`   3. Sees "${selectedAgent.title}" in shared agents list`);
    console.log('   4. Can click and start using the agent');
    console.log('');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

shareAgent();

