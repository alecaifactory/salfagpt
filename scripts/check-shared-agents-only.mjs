import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({
  credential: applicationDefault(),
  projectId: 'salfagpt'
});

const db = getFirestore();

// The 4 official SHARED AGENTS
const OFFICIAL_AGENTS = {
  'S001': 'AjtQZEIMQvFnPRJRjl4y',
  'S002': 'KfoKcDrb6pMnduAiLlrD',
  'M001': 'cjn3bC0HrUYtHqu69CKS',
  'M003': '5aNwSMgff2BRKrrVRypF'
};

async function checkSharedAgentsOnly() {
  console.log('🔍 ANALYZING SHARED AGENTS ACCESS (Not Conversations)');
  console.log('='.repeat(120));
  console.log('\nChecking which users have access to the 4 official shared AGENTS:\n');
  
  // Get info about these agents
  for (const [code, agentId] of Object.entries(OFFICIAL_AGENTS)) {
    const agentDoc = await db.collection('conversations').doc(agentId).get();
    
    if (!agentDoc.exists) {
      console.log(`❌ Agent ${code} not found`);
      continue;
    }
    
    const agentData = agentDoc.data();
    
    console.log(`\n${'▼'.repeat(60)}`);
    console.log(`📋 AGENT: ${code} - ${agentData.title}`);
    console.log(`   ID: ${agentId}`);
    console.log(`   Owner: ${agentData.userId}`);
    console.log(`   Type: ${agentData.isTemplate ? 'TEMPLATE/AGENT' : 'CONVERSATION'}`);
    console.log(`   Shared: ${agentData.isShared ? 'YES' : 'NO'}`);
    console.log('▼'.repeat(60));
    
    // Check if this is actually an agent or a conversation
    console.log(`\n🔍 Document Fields:`);
    console.log(`   - title: ${agentData.title}`);
    console.log(`   - isTemplate: ${agentData.isTemplate}`);
    console.log(`   - isShared: ${agentData.isShared}`);
    console.log(`   - allowedUsers: ${agentData.allowedUsers?.length || 0}`);
    console.log(`   - messageCount: ${agentData.messageCount || 0}`);
    
    // Get shares
    const sharesSnapshot = await db.collection('agent_shares')
      .where('agentId', '==', agentId)
      .get();
    
    console.log(`\n📤 Agent Shares: ${sharesSnapshot.size} document(s)`);
    
    if (sharesSnapshot.size > 0) {
      let totalSharedWith = 0;
      
      sharesSnapshot.forEach(shareDoc => {
        const shareData = shareDoc.data();
        totalSharedWith += shareData.sharedWith?.length || 0;
        
        console.log(`\n   Share Doc: ${shareDoc.id}`);
        console.log(`   Shared with: ${shareData.sharedWith?.length || 0} users`);
        console.log(`   Share type: ${shareData.shareType || 'N/A'}`);
        console.log(`   Access level: ${shareData.accessLevel || 'N/A'}`);
      });
      
      console.log(`\n   📊 Total unique shares: ${totalSharedWith}`);
    }
  }
  
  console.log('\n' + '='.repeat(120));
  
  // Now check if there are OTHER agents/templates being shared
  console.log('\n🔍 CHECKING FOR OTHER SHARED AGENTS...');
  console.log('='.repeat(120));
  
  const allShares = await db.collection('agent_shares').get();
  
  console.log(`\nTotal agent_shares documents: ${allShares.size}`);
  
  const sharedAgentIds = new Set();
  allShares.forEach(doc => {
    const data = doc.data();
    sharedAgentIds.add(data.agentId);
  });
  
  console.log(`Unique agents being shared: ${sharedAgentIds.size}\n`);
  
  // Check each shared agent
  for (const agentId of sharedAgentIds) {
    const isOfficial = Object.values(OFFICIAL_AGENTS).includes(agentId);
    
    if (!isOfficial) {
      const agentDoc = await db.collection('conversations').doc(agentId).get();
      
      if (agentDoc.exists) {
        const data = agentDoc.data();
        console.log(`🚨 UNEXPECTED SHARED AGENT:`);
        console.log(`   ID: ${agentId}`);
        console.log(`   Title: ${data.title}`);
        console.log(`   Owner: ${data.userId}`);
        console.log(`   Is this an agent or conversation?: ${data.isTemplate ? 'AGENT' : 'CONVERSATION'}`);
        
        // Get who it's shared with
        const shares = await db.collection('agent_shares')
          .where('agentId', '==', agentId)
          .get();
        
        shares.forEach(shareDoc => {
          const shareData = shareDoc.data();
          console.log(`   Shared with ${shareData.sharedWith?.length || 0} users`);
        });
        console.log('');
      }
    }
  }
  
  console.log('='.repeat(120));
}

checkSharedAgentsOnly()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
