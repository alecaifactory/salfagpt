import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({
  credential: applicationDefault(),
  projectId: 'salfagpt'
});

const db = getFirestore();

async function listAllSharedAgents() {
  console.log('📋 ALL SHARED AGENTS IN SYSTEM');
  console.log('='.repeat(120));
  
  const allShares = await db.collection('agent_shares').get();
  
  console.log(`\nTotal shared agents: ${allShares.size}\n`);
  console.log('='.repeat(120));
  
  for (const shareDoc of allShares.docs) {
    const shareData = shareDoc.data();
    const agentId = shareData.agentId;
    
    const agentDoc = await db.collection('conversations').doc(agentId).get();
    
    if (agentDoc.exists) {
      const agentData = agentDoc.data();
      
      console.log(`\n📌 Agent: ${agentData.title}`);
      console.log(`   ID: ${agentId}`);
      console.log(`   Messages: ${agentData.messageCount || 0}`);
      console.log(`   Shared with: ${shareData.sharedWith?.length || 0} users`);
      
      console.log(`\n   Users with access:`);
      const users = shareData.sharedWith || [];
      users.forEach((target, idx) => {
        const email = target.email || 'N/A';
        const domain = target.domain || email.split('@')[1] || 'N/A';
        console.log(`      ${(idx + 1).toString().padStart(2)}. ${email.padEnd(40)} (${domain})`);
      });
      
      console.log('\n' + '-'.repeat(120));
    }
  }
  
  // Now analyze which users see multiple agents
  console.log('\n\n👥 USERS SEEING MULTIPLE SHARED AGENTS:');
  console.log('='.repeat(120));
  
  const userAgentsMap = new Map();
  
  for (const shareDoc of allShares.docs) {
    const shareData = shareDoc.data();
    const agentId = shareData.agentId;
    
    const agentDoc = await db.collection('conversations').doc(agentId).get();
    const agentTitle = agentDoc.exists ? agentDoc.data().title : agentId;
    
    shareData.sharedWith?.forEach(target => {
      const email = (target.email || '').toLowerCase();
      if (email) {
        if (!userAgentsMap.has(email)) {
          userAgentsMap.set(email, []);
        }
        userAgentsMap.get(email).push({
          title: agentTitle,
          id: agentId
        });
      }
    });
  }
  
  // Filter users with role 'user' or 'expert' only
  const usersSnapshot = await db.collection('users').get();
  const regularUsers = new Set();
  
  usersSnapshot.forEach(doc => {
    const data = doc.data();
    if (data.email && (data.role === 'user' || data.role === 'expert')) {
      regularUsers.add(data.email.toLowerCase());
    }
  });
  
  console.log(`\n📊 Analyzing ${regularUsers.size} regular users (role: user or expert)...\n`);
  
  const multiAgentRegularUsers = Array.from(userAgentsMap.entries())
    .filter(([email, agents]) => agents.length > 1 && regularUsers.has(email))
    .sort((a, b) => b[1].length - a[1].length);
  
  if (multiAgentRegularUsers.length > 0) {
    console.log('🚨 REGULAR USERS WITH ACCESS TO MULTIPLE AGENTS:');
    console.log('\n| Email | # Agents | Agents |');
    console.log('|-------|----------|--------|');
    
    multiAgentRegularUsers.forEach(([email, agents]) => {
      const agentCodes = agents.map(a => {
        const match = a.title.match(/\(([SM]\d+)\)/);
        return match ? match[1] : a.title.substring(0, 20);
      }).join(', ');
      
      console.log(`| ${email.padEnd(40)} | ${agents.length} | ${agentCodes} |`);
    });
    
    console.log('\n📋 DETAILED BREAKDOWN:');
    multiAgentRegularUsers.forEach(([email, agents]) => {
      console.log(`\n⚠️  ${email}:`);
      console.log(`   Seeing ${agents.length} shared agents:`);
      agents.forEach((agent, idx) => {
        console.log(`   ${idx + 1}. ${agent.title} (${agent.id})`);
      });
    });
  } else {
    console.log('✅ All regular users have access to exactly 1 shared agent');
  }
  
  // Check specific user
  console.log('\n' + '='.repeat(120));
  console.log('\n🎯 SPECIFIC CHECK: iojedaa@maqsa.cl');
  console.log('='.repeat(120));
  
  const iojeAgents = userAgentsMap.get('iojedaa@maqsa.cl');
  
  if (iojeAgents) {
    console.log(`\n✅ Found user: iojedaa@maqsa.cl`);
    console.log(`   Has access to ${iojeAgents.length} shared agent(s):\n`);
    iojeAgents.forEach((agent, idx) => {
      console.log(`   ${idx + 1}. ${agent.title}`);
      console.log(`      ID: ${agent.id}`);
    });
    
    if (iojeAgents.length === 1) {
      console.log(`\n✅ This user has correct access to exactly 1 shared agent.`);
      console.log(`   If they report seeing 2, they may have created a personal conversation.`);
    } else {
      console.log(`\n🚨 This user has access to ${iojeAgents.length} shared agents!`);
    }
  } else {
    console.log('\n❌ User iojedaa@maqsa.cl not found in shared agent access');
  }
}

listAllSharedAgents()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
