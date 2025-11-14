import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({
  credential: applicationDefault(),
  projectId: 'salfagpt'
});

const db = getFirestore();

const SHARED_AGENT_IDS = {
  'S001': 'AjtQZEIMQvFnPRJRjl4y',
  'S002': 'KfoKcDrb6pMnduAiLlrD',
  'M001': 'cjn3bC0HrUYtHqu69CKS',
  'M003': '5aNwSMgff2BRKrrVRypF'
};

async function checkOwnedVsShared() {
  console.log('🔍 CHECKING FOR USERS SEEING BOTH OWNED + SHARED AGENTS');
  console.log('='.repeat(120));
  
  // Get all users
  const usersSnapshot = await db.collection('users').get();
  const usersMap = new Map();
  usersSnapshot.forEach(doc => {
    const data = doc.data();
    if (data.email) {
      usersMap.set(doc.id, {
        id: doc.id,
        email: data.email,
        name: data.name,
        role: data.role
      });
    }
  });
  
  console.log(`\n📊 Total users in system: ${usersMap.size}\n`);
  
  // For each user, check owned vs shared agents
  const usersWithIssues = [];
  
  for (const [userId, user] of usersMap) {
    // Get owned agents
    const ownedAgentsSnapshot = await db.collection('conversations')
      .where('userId', '==', userId)
      .get();
    
    const ownedAgents = ownedAgentsSnapshot.docs
      .filter(doc => !Object.values(SHARED_AGENT_IDS).includes(doc.id))
      .map(doc => ({
        id: doc.id,
        title: doc.data().title
      }));
    
    // Get shared agents
    const sharedAgents = [];
    for (const [code, agentId] of Object.entries(SHARED_AGENT_IDS)) {
      const sharesSnapshot = await db.collection('agent_shares')
        .where('agentId', '==', agentId)
        .get();
      
      let hasAccess = false;
      sharesSnapshot.forEach(shareDoc => {
        const shareData = shareDoc.data();
        if (shareData.sharedWith?.some(target => 
          target.id === userId || 
          target.email?.toLowerCase() === user.email.toLowerCase()
        )) {
          hasAccess = true;
        }
      });
      
      if (hasAccess) {
        sharedAgents.push({ code, id: agentId });
      }
    }
    
    const totalVisible = ownedAgents.length + sharedAgents.length;
    
    // Flag users who see more than expected
    if (sharedAgents.length === 1 && ownedAgents.length > 0) {
      usersWithIssues.push({
        email: user.email,
        name: user.name,
        role: user.role,
        ownedCount: ownedAgents.length,
        sharedCount: sharedAgents.length,
        totalVisible,
        ownedAgents,
        sharedAgents
      });
    }
  }
  
  if (usersWithIssues.length > 0) {
    console.log('🚨 USERS SEEING BOTH OWNED + SHARED AGENTS:');
    console.log('='.repeat(120));
    console.log('\n| Email | Name | Shared Agents | Owned Agents | Total Visible | Details |');
    console.log('|-------|------|---------------|--------------|---------------|---------|');
    
    usersWithIssues.forEach(user => {
      const sharedStr = user.sharedAgents.map(a => a.code).join(', ');
      
      console.log(`| ${user.email} | ${user.name} | ${sharedStr} (${user.sharedCount}) | ${user.ownedCount} | ${user.totalVisible} | ⚠️ Seeing ${user.totalVisible} total |`);
    });
    
    console.log('\n📋 DETAILED BREAKDOWN:');
    console.log('='.repeat(120));
    
    usersWithIssues.forEach(user => {
      console.log(`\n👤 ${user.email} (${user.name})`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Total agents visible: ${user.totalVisible}`);
      
      console.log(`\n   📤 SHARED AGENTS (${user.sharedCount}):`);
      user.sharedAgents.forEach(a => {
        console.log(`      ✅ ${a.code} (${a.id})`);
      });
      
      console.log(`\n   👤 OWNED AGENTS (${user.ownedCount}):`);
      user.ownedAgents.forEach(a => {
        console.log(`      📝 ${a.title} (${a.id})`);
      });
      
      console.log(`\n   💡 This user is seeing:`);
      console.log(`      - 1 shared agent (expected)`);
      console.log(`      - ${user.ownedCount} owned agent(s) they created`);
      console.log(`      - Total: ${user.totalVisible} agents`);
      console.log(`\n   ℹ️  This is NORMAL if the user created their own agents for testing.`);
      console.log(`   ⚠️  If they should NOT see their owned agents, those need to be deleted.`);
    });
    
  } else {
    console.log('✅ No users are seeing unexpected combinations of owned + shared agents');
  }
  
  console.log('\n' + '='.repeat(120));
  console.log('\n📊 ANALYSIS COMPLETE');
  console.log(`   Users checked: ${usersMap.size}`);
  console.log(`   Users with owned + shared agents: ${usersWithIssues.length}`);
  
  if (usersWithIssues.length > 0) {
    console.log('\n💡 EXPLANATION:');
    console.log('   Users seeing more agents than expected may have created their own test agents.');
    console.log('   This is normal behavior - users can create unlimited personal agents.');
    console.log('   Shared agents (S001, S002, M001, M003) appear alongside their personal agents.');
    console.log('\n   If users should ONLY see shared agents:');
    console.log('   - Delete their owned agents');
    console.log('   - Or move owned agents to a different folder for organization');
  }
}

checkOwnedVsShared()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

