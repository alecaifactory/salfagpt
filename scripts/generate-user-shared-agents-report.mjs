import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({
  credential: applicationDefault(),
  projectId: 'salfagpt'
});

const db = getFirestore();

async function generateUserSharedAgentsReport() {
  console.log('📋 COMPLETE USER REPORT - SHARED AGENTS');
  console.log('='.repeat(140));
  
  // Get all users
  const usersSnapshot = await db.collection('users').get();
  const usersMap = new Map();
  
  usersSnapshot.forEach(doc => {
    const data = doc.data();
    if (data.email) {
      usersMap.set(data.email.toLowerCase(), {
        id: doc.id,
        email: data.email,
        name: data.name,
        role: data.role,
        domain: data.email.split('@')[1]
      });
    }
  });
  
  console.log(`\n📊 Total users in system: ${usersMap.size}\n`);
  
  // Get all agent shares
  const allShares = await db.collection('agent_shares').get();
  
  // Get agent details
  const agentsMap = new Map();
  
  for (const shareDoc of allShares.docs) {
    const shareData = shareDoc.data();
    const agentId = shareData.agentId;
    
    const agentDoc = await db.collection('conversations').doc(agentId).get();
    
    if (agentDoc.exists) {
      const agentData = agentDoc.data();
      const ownerId = agentData.userId;
      const ownerData = Array.from(usersMap.values()).find(u => u.id === ownerId);
      
      agentsMap.set(agentId, {
        id: agentId,
        title: agentData.title,
        ownerId: ownerId,
        ownerEmail: ownerData?.email || ownerId,
        ownerName: ownerData?.name || 'Unknown',
        ownerRole: ownerData?.role || 'Unknown',
        sharedWith: shareData.sharedWith || []
      });
    }
  }
  
  // Build user -> agents mapping
  const userAgentsMap = new Map();
  
  agentsMap.forEach((agent, agentId) => {
    agent.sharedWith.forEach(target => {
      const email = (target.email || '').toLowerCase();
      if (email) {
        if (!userAgentsMap.has(email)) {
          userAgentsMap.set(email, {
            agents: [],
            sharedBy: new Set()
          });
        }
        
        userAgentsMap.get(email).agents.push({
          title: agent.title,
          id: agentId,
          sharedBy: agent.ownerEmail,
          sharedByName: agent.ownerName,
          sharedByRole: agent.ownerRole
        });
        
        userAgentsMap.get(email).sharedBy.add(
          `${agent.ownerName} (${agent.ownerEmail}) - ${agent.ownerRole}`
        );
      }
    });
  });
  
  // Generate comprehensive table
  console.log('='.repeat(140));
  console.log('\n| Email | Name | Role | Organization | # Shared Agents | Agents Shared With Them | Shared By (Admin/SuperAdmin) |');
  console.log('|-------|------|------|--------------|-----------------|-------------------------|------------------------------|');
  
  // Sort users by domain, then email
  const sortedUsers = Array.from(usersMap.values()).sort((a, b) => {
    if (a.domain !== b.domain) return a.domain.localeCompare(b.domain);
    return a.email.localeCompare(b.email);
  });
  
  sortedUsers.forEach(user => {
    const email = user.email.toLowerCase();
    const accessData = userAgentsMap.get(email);
    
    const agentCount = accessData?.agents.length || 0;
    
    let agentsList = '-';
    let sharedByList = '-';
    
    if (accessData) {
      // Get unique agent codes
      const agentCodes = accessData.agents.map(a => {
        const match = a.title.match(/\(([SM]\d+)\)/);
        return match ? match[1] : a.title.substring(0, 15);
      });
      agentsList = agentCodes.join(', ');
      
      // Get unique sharers
      sharedByList = Array.from(accessData.sharedBy).join('; ');
    }
    
    const orgName = getOrgName(user.domain);
    
    console.log(`| ${user.email} | ${user.name} | ${user.role} | ${orgName} | ${agentCount} | ${agentsList} | ${sharedByList} |`);
  });
  
  console.log('\n' + '='.repeat(140));
  
  // Summary by agent count
  console.log('\n📊 SUMMARY BY NUMBER OF SHARED AGENTS:');
  console.log('='.repeat(140));
  
  const byCount = new Map();
  userAgentsMap.forEach((data, email) => {
    const count = data.agents.length;
    if (!byCount.has(count)) {
      byCount.set(count, []);
    }
    byCount.get(count).push(email);
  });
  
  const sortedCounts = Array.from(byCount.entries()).sort((a, b) => b[0] - a[0]);
  
  sortedCounts.forEach(([count, emails]) => {
    console.log(`\n${count} shared agent(s): ${emails.length} users`);
    if (count > 1) {
      emails.forEach(email => {
        const user = usersMap.get(email);
        const agents = userAgentsMap.get(email).agents.map(a => {
          const match = a.title.match(/\(([SM]\d+)\)/);
          return match ? match[1] : a.title;
        }).join(', ');
        console.log(`   - ${email.padEnd(40)} (${user?.role || 'N/A'}) - ${agents}`);
      });
    }
  });
  
  // Users with NO shared agents
  const usersWithNoAgents = sortedUsers.filter(u => {
    return !userAgentsMap.has(u.email.toLowerCase());
  });
  
  if (usersWithNoAgents.length > 0) {
    console.log(`\n0 shared agents: ${usersWithNoAgents.length} users`);
    usersWithNoAgents.forEach(user => {
      console.log(`   - ${user.email.padEnd(40)} (${user.role})`);
    });
  }
}

function getOrgName(domain) {
  const mapping = {
    'maqsa.cl': 'MAQSA',
    'salfamontajes.com': 'Salfa Montajes',
    'salfagestion.cl': 'Salfa Gestión',
    'iaconcagua.com': 'Inaconcagua',
    'inoval.cl': 'Inoval',
    'novatec.cl': 'Novatec',
    'constructorasalfa.cl': 'Constructora Salfa',
    'salfacorp.com': 'Salfa Corp',
    'gmail.com': 'External',
    'getaifactory.com': 'AI Factory',
    'salfacloud.cl': 'Salfa Cloud',
    'practicantecorp.cl': 'Practicante Corp'
  };
  return mapping[domain] || domain;
}

generateUserSharedAgentsReport()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

