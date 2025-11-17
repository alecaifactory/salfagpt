import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({
  credential: applicationDefault(),
  projectId: 'salfagpt'
});

const db = getFirestore();

// Agent IDs mapping
const AGENT_IDS = {
  'S001': 'AjtQZEIMQvFnPRJRjl4y',
  'S002': 'KfoKcDrb6pMnduAiLlrD',
  'M001': 'cjn3bC0HrUYtHqu69CKS',
  'M003': '5aNwSMgff2BRKrrVRypF'
};

const AGENT_NAMES = {
  'S001': 'GESTION BODEGAS GPT (S001)',
  'S002': 'MAQSA Mantenimiento (S002)',
  'M001': 'Asistente Legal Territorial RDI (M001)',
  'M003': 'GOP GPT (M003)'
};

// Expected access per agent
const EXPECTED_ACCESS = {
  'S001': [
    'abhernandez@maqsa.cl', 'cvillalon@maqsa.cl', 'hcontrerasp@salfamontajes.com',
    'iojedaa@maqsa.cl', 'jefarias@maqsa.cl', 'msgarcia@maqsa.cl',
    'ojrodriguez@maqsa.cl', 'paovalle@maqsa.cl', 'salegria@maqsa.cl',
    'vaaravena@maqsa.cl', 'vclarke@maqsa.cl', 'fdiazt@salfagestion.cl',
    'sorellanac@salfagestion.cl', 'nfarias@salfagestion.cl',
    'alecdickinson@gmail.com', 'alec@getaifactory.com', 'alec@salfacloud.cl'
  ],
  'S002': [
    'svillegas@maqsa.cl', 'csolis@maqsa.cl', 'fmelin@maqsa.cl',
    'riprado@maqsa.cl', 'jcalfin@maqsa.cl', 'mmichael@maqsa.cl',
    'fdiazt@salfagestion.cl', 'sorellanac@salfagestion.cl', 'nfarias@salfagestion.cl',
    'alecdickinson@gmail.com', 'alec@getaifactory.com', 'alec@salfacloud.cl'
  ],
  'M001': [
    'jriverof@iaconcagua.com', 'afmanriquez@iaconcagua.com', 'cquijadam@iaconcagua.com',
    'ireygadas@iaconcagua.com', 'jmancilla@iaconcagua.com', 'mallende@iaconcagua.com',
    'recontreras@iaconcagua.com', 'dundurraga@iaconcagua.com', 'rfuentesm@inoval.cl',
    'fdiazt@salfagestion.cl', 'sorellanac@salfagestion.cl', 'nfarias@salfagestion.cl',
    'alecdickinson@gmail.com', 'alec@getaifactory.com', 'alec@salfacloud.cl'
  ],
  'M003': [
    'mfuenzalidar@novatec.cl', 'phvaldivia@novatec.cl', 'yzamora@inoval.cl',
    'jcancinoc@inoval.cl', 'lurriola@novatec.cl', 'fcerda@constructorasalfa.cl',
    'gfalvarez@novatec.cl', 'dortega@novatec.cl', 'mburgoa@novatec.cl',
    'fdiazt@salfagestion.cl', 'sorellanac@salfagestion.cl', 'nfarias@salfagestion.cl',
    'alecdickinson@gmail.com', 'alec@getaifactory.com', 'alec@salfacloud.cl'
  ]
};

async function checkMultiAgentAccess() {
  console.log('🔍 CHECKING FOR USERS WITH UNEXPECTED MULTIPLE AGENT ACCESS');
  console.log('='.repeat(120));
  
  // Get all users
  const usersSnapshot = await db.collection('users').get();
  const usersMap = new Map();
  usersSnapshot.forEach(doc => {
    const data = doc.data();
    if (data.email) {
      usersMap.set(data.email.toLowerCase(), {
        id: doc.id,
        name: data.name,
        role: data.role,
        email: data.email,
        domain: data.email.split('@')[1]
      });
    }
  });
  
  // Get actual access for each agent
  const actualAccess = {};
  
  for (const [agentCode, agentId] of Object.entries(AGENT_IDS)) {
    const sharesSnapshot = await db.collection('agent_shares')
      .where('agentId', '==', agentId)
      .get();
    
    const currentAccess = new Set();
    
    sharesSnapshot.forEach(shareDoc => {
      const shareData = shareDoc.data();
      shareData.sharedWith?.forEach(target => {
        const email = (target.email || '').toLowerCase();
        if (email) currentAccess.add(email);
      });
    });
    
    actualAccess[agentCode] = currentAccess;
  }
  
  // Collect all unique users
  const allUsers = new Set();
  Object.values(EXPECTED_ACCESS).forEach(users => {
    users.forEach(email => allUsers.add(email.toLowerCase()));
  });
  Object.values(actualAccess).forEach(accessSet => {
    accessSet.forEach(email => allUsers.add(email));
  });
  
  // Analyze each user
  const userAnalysis = [];
  
  allUsers.forEach(email => {
    const user = usersMap.get(email);
    
    // Count how many agents they have access to
    const agentsWithAccess = [];
    const agentsShouldHave = [];
    
    ['S001', 'S002', 'M001', 'M003'].forEach(agent => {
      if (actualAccess[agent].has(email)) {
        agentsWithAccess.push(agent);
      }
      if (EXPECTED_ACCESS[agent].includes(email)) {
        agentsShouldHave.push(agent);
      }
    });
    
    userAnalysis.push({
      email,
      name: user?.name || 'N/A',
      domain: email.split('@')[1],
      actualCount: agentsWithAccess.length,
      expectedCount: agentsShouldHave.length,
      actualAgents: agentsWithAccess,
      expectedAgents: agentsShouldHave,
      hasIssue: agentsWithAccess.length !== agentsShouldHave.length ||
                !agentsWithAccess.every(a => agentsShouldHave.includes(a))
    });
  });
  
  // Sort by expected count, then email
  userAnalysis.sort((a, b) => {
    if (a.expectedCount !== b.expectedCount) return a.expectedCount - b.expectedCount;
    return a.email.localeCompare(b.email);
  });
  
  // Display users who should see only ONE agent
  console.log('\n👤 USERS WHO SHOULD SEE ONLY ONE AGENT:');
  console.log('='.repeat(120));
  console.log('\n| Email | Name | Expected Agent | Actual Agents Visible | Status |');
  console.log('|-------|------|----------------|----------------------|--------|');
  
  const singleAgentUsers = userAnalysis.filter(u => u.expectedCount === 1);
  
  singleAgentUsers.forEach(user => {
    const expectedAgent = user.expectedAgents[0];
    const actualAgentsStr = user.actualAgents.length === 0 
      ? 'NONE' 
      : user.actualAgents.join(', ');
    
    let status = '✅ OK';
    if (user.actualCount === 0) {
      status = '❌ NO ACCESS';
    } else if (user.actualCount > 1) {
      status = `⚠️ SEES ${user.actualCount} AGENTS (should see 1)`;
    } else if (user.actualAgents[0] !== expectedAgent) {
      status = '❌ WRONG AGENT';
    }
    
    console.log(`| ${user.email} | ${user.name} | ${expectedAgent} | ${actualAgentsStr} | ${status} |`);
  });
  
  // Display users with issues
  const issueUsers = singleAgentUsers.filter(u => u.hasIssue);
  
  if (issueUsers.length > 0) {
    console.log('\n🚨 USERS WITH ISSUES (Expected 1 agent):');
    console.log('='.repeat(120));
    
    issueUsers.forEach(user => {
      console.log(`\n❌ ${user.email} (${user.name})`);
      console.log(`   Expected: ${user.expectedAgents.join(', ')} (${user.expectedCount} agent)`);
      console.log(`   Actually sees: ${user.actualAgents.join(', ') || 'NONE'} (${user.actualCount} agents)`);
      
      if (user.actualCount > 1) {
        console.log(`   🚨 PROBLEM: Seeing ${user.actualCount} agents when should only see 1`);
        
        // Find which agents to remove
        const toRemove = user.actualAgents.filter(a => !user.expectedAgents.includes(a));
        if (toRemove.length > 0) {
          console.log(`   Fix: Remove access from: ${toRemove.join(', ')}`);
          toRemove.forEach(agent => {
            console.log(`      node scripts/revoke-access.mjs ${AGENT_IDS[agent]} ${user.email}`);
          });
        }
      } else if (user.actualCount === 0) {
        console.log(`   🚨 PROBLEM: No access to any agents`);
        user.expectedAgents.forEach(agent => {
          console.log(`   Fix: node scripts/grant-access.mjs ${AGENT_IDS[agent]} ${user.email}`);
        });
      }
    });
  }
  
  // Display users who SHOULD see multiple agents
  console.log('\n\n👥 USERS WHO SHOULD SEE MULTIPLE AGENTS:');
  console.log('='.repeat(120));
  console.log('\n| Email | Name | Expected Agents | Actual Agents | Status |');
  console.log('|-------|------|-----------------|---------------|--------|');
  
  const multiAgentUsers = userAnalysis.filter(u => u.expectedCount > 1);
  
  multiAgentUsers.forEach(user => {
    const expectedStr = user.expectedAgents.join(', ');
    const actualStr = user.actualAgents.length === 0 ? 'NONE' : user.actualAgents.join(', ');
    
    let status = '✅ OK';
    if (user.hasIssue) {
      if (user.actualCount < user.expectedCount) {
        status = `⚠️ Missing ${user.expectedCount - user.actualCount} agents`;
      } else if (user.actualCount > user.expectedCount) {
        status = `⚠️ Has ${user.actualCount - user.expectedCount} extra agents`;
      } else {
        status = '⚠️ Wrong agents';
      }
    }
    
    console.log(`| ${user.email} | ${user.name} | ${expectedStr} (${user.expectedCount}) | ${actualStr} (${user.actualCount}) | ${status} |`);
  });
  
  // Summary
  console.log('\n' + '='.repeat(120));
  console.log('\n📊 SUMMARY:');
  console.log(`  Users expecting 1 agent: ${singleAgentUsers.length}`);
  console.log(`  - With issues: ${singleAgentUsers.filter(u => u.hasIssue).length}`);
  console.log(`  - Correct: ${singleAgentUsers.filter(u => !u.hasIssue).length}`);
  
  console.log(`\n  Users expecting multiple agents: ${multiAgentUsers.length}`);
  console.log(`  - With issues: ${multiAgentUsers.filter(u => u.hasIssue).length}`);
  console.log(`  - Correct: ${multiAgentUsers.filter(u => !u.hasIssue).length}`);
  
  const totalIssues = userAnalysis.filter(u => u.hasIssue).length;
  
  if (totalIssues === 0) {
    console.log('\n✅✅✅ ALL USERS SEE THE CORRECT NUMBER OF AGENTS ✅✅✅');
  } else {
    console.log(`\n⚠️  ${totalIssues} USERS HAVE ACCESS ISSUES ⚠️`);
  }
}

checkMultiAgentAccess()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });


