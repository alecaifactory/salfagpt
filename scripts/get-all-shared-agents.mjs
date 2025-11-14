import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({
  credential: applicationDefault(),
  projectId: 'salfagpt'
});

const db = getFirestore();

async function getAllSharedAgents() {
  console.log('📋 ALL SHARED AGENTS IN SYSTEM');
  console.log('='.repeat(120));
  
  // Get all agent_shares
  const allShares = await db.collection('agent_shares').get();
  
  console.log(`\nTotal share documents: ${allShares.size}\n`);
  
  const agentsData = [];
  
  for (const shareDoc of allShares.docs) {
    const shareData = shareDoc.data();
    const agentId = shareData.agentId;
    
    // Get agent document
    const agentDoc = await db.collection('conversations').doc(agentId).get();
    
    if (agentDoc.exists) {
      const agentData = agentDoc.data();
      
      // Get all users with access
      const usersWithAccess = [];
      shareData.sharedWith?.forEach(target => {
        usersWithAccess.push({
          email: target.email,
          domain: target.domain
        });
      });
      
      agentsData.push({
        id: agentId,
        title: agentData.title,
        owner: agentData.userId,
        messageCount: agentData.messageCount || 0,
        shareDocId: shareDoc.id,
        usersWithAccess,
        userCount: usersWithAccess.length
      });
    }
  }
  
  // Sort by title
  agentsData.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
  
  // Display
  console.log('| Agent ID | Title | Messages | Users | Share Doc |');
  console.log('|----------|-------|----------|-------|-----------|');
  
  agentsData.forEach(agent => {
    console.log(`| ${agent.id} | ${agent.title} | ${agent.messageCount} | ${agent.userCount} | ${agent.shareDocId} |`);
  });
  
  console.log('\n' + '='.repeat(120));
  console.log('\n📊 DETAILED USER ACCESS PER AGENT:');
  console.log('='.repeat(120));
  
  agentsData.forEach(agent => {
    console.log(`\n📋 ${agent.title} (${agent.id})`);
    console.log(`   Shared with ${agent.userCount} users:\n`);
    
    // Sort by email
    agent.usersWithAccess.sort((a, b) => a.email.localeCompare(b.email));
    
    agent.usersWithAccess.forEach((user, idx) => {
      console.log(`   ${(idx + 1).toString().padStart(2)}. ${user.email.padEnd(35)} (${user.domain})`);
    });
  });
  
  console.log('\n' + '='.repeat(120));
  
  // Check which users have access to multiple agents
  const userAgentMap = new Map();
  
  agentsData.forEach(agent => {
    agent.usersWithAccess.forEach(user => {
      if (!userAgentMap.has(user.email)) {
        userAgentMap.set(user.email, []);
      }
      userAgentMap.get(user.email).push({
        title: agent.title,
        id: agent.id
      });
    });
  });
  
  console.log('\n👥 USERS WITH ACCESS TO MULTIPLE SHARED AGENTS:');
  console.log('='.repeat(120));
  
  const multiAgentUsers = Array.from(userAgentMap.entries())
    .filter(([email, agents]) => agents.length > 1)
    .sort((a, b) => b[1].length - a[1].length);
  
  if (multiAgentUsers.length > 0) {
    console.log('\n| Email | Domain | # Agents | Agent List |');
    console.log('|-------|--------|----------|------------|');
    
    multiAgentUsers.forEach(([email, agents]) => {
      const domain = email.split('@')[1];
      const agentList = agents.map(a => {
        // Extract code from title
        const match = a.title.match(/\(([SM]\d+)\)/);
        return match ? match[1] : a.title;
      }).join(', ');
      
      console.log(`| ${email} | ${domain} | ${agents.length} | ${agentList} |`);
    });
    
    console.log('\n🔍 CHECKING IF MULTIPLE ACCESS IS EXPECTED:');
    
    multiAgentUsers.forEach(([email, agents]) => {
      console.log(`\n   ${email}:`);
      console.log(`      Has access to: ${agents.length} agents`);
      agents.forEach(a => {
        console.log(`         - ${a.title}`);
      });
    });
  } else {
    console.log('\n✅ All users have access to exactly 1 shared agent');
  }
}

getAllSharedAgents()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
