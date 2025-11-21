import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({
  credential: applicationDefault(),
  projectId: 'salfagpt'
});

const db = getFirestore();

// The 4 official SHARED AGENTS (created and managed by admins)
const OFFICIAL_SHARED_AGENTS = {
  'S001': { id: 'AjtQZEIMQvFnPRJRjl4y', name: 'GESTION BODEGAS GPT (S001)' },
  'S002': { id: 'KfoKcDrb6pMnduAiLlrD', name: 'MAQSA Mantenimiento (S002)' },
  'M001': { id: 'cjn3bC0HrUYtHqu69CKS', name: 'Asistente Legal Territorial RDI (M001)' },
  'M003': { id: '5aNwSMgff2BRKrrVRypF', name: 'GOP GPT (M003)' }
};

// Expected access per agent (ONLY regular users, not admins/superadmins)
const EXPECTED_REGULAR_USER_ACCESS = {
  'S001': [
    'abhernandez@maqsa.cl', 'cvillalon@maqsa.cl', 'hcontrerasp@salfamontajes.com',
    'iojedaa@maqsa.cl', 'jefarias@maqsa.cl', 'msgarcia@maqsa.cl',
    'ojrodriguez@maqsa.cl', 'paovalle@maqsa.cl', 'salegria@maqsa.cl',
    'vaaravena@maqsa.cl', 'vclarke@maqsa.cl'
  ],
  'S002': [
    'svillegas@maqsa.cl', 'csolis@maqsa.cl', 'fmelin@maqsa.cl',
    'riprado@maqsa.cl', 'jcalfin@maqsa.cl', 'mmichael@maqsa.cl'
  ],
  'M001': [
    'jriverof@iaconcagua.com', 'afmanriquez@iaconcagua.com', 'cquijadam@iaconcagua.com',
    'ireygadas@iaconcagua.com', 'jmancilla@iaconcagua.com', 'mallende@iaconcagua.com',
    'recontreras@iaconcagua.com', 'dundurraga@iaconcagua.com', 'rfuentesm@inoval.cl'
  ],
  'M003': [
    'mfuenzalidar@novatec.cl', 'phvaldivia@novatec.cl', 'yzamora@inoval.cl',
    'jcancinoc@inoval.cl', 'lurriola@novatec.cl', 'fcerda@constructorasalfa.cl',
    'gfalvarez@novatec.cl', 'dortega@novatec.cl', 'mburgoa@novatec.cl'
  ]
};

async function analyzeUserAgents(targetEmail) {
  console.log('🔍 ANALYZING SHARED AGENT ACCESS');
  console.log('='.repeat(120));
  
  if (targetEmail) {
    console.log(`\n🎯 Focus User: ${targetEmail}\n`);
  }
  
  // Get all users
  const usersSnapshot = await db.collection('users').get();
  const usersMap = new Map();
  const regularUsers = [];
  
  usersSnapshot.forEach(doc => {
    const data = doc.data();
    if (data.email) {
      const userInfo = {
        id: doc.id,
        email: data.email.toLowerCase(),
        name: data.name,
        role: data.role,
        domain: data.email.split('@')[1]
      };
      usersMap.set(userInfo.email, userInfo);
      
      // Only include regular users (not admins/superadmins)
      if (data.role === 'user' || data.role === 'expert') {
        regularUsers.push(userInfo);
      }
    }
  });
  
  console.log(`📊 Total users in system: ${usersMap.size}`);
  console.log(`👤 Regular users (user/expert role): ${regularUsers.length}\n`);
  
  // For each regular user, check which SHARED AGENTS they have access to
  const userAgentAccess = [];
  
  for (const user of regularUsers) {
    const sharedAgentsWithAccess = [];
    
    // Check each official shared agent
    for (const [code, agent] of Object.entries(OFFICIAL_SHARED_AGENTS)) {
      const sharesSnapshot = await db.collection('agent_shares')
        .where('agentId', '==', agent.id)
        .get();
      
      let hasAccess = false;
      sharesSnapshot.forEach(shareDoc => {
        const shareData = shareDoc.data();
        if (shareData.sharedWith?.some(target => 
          target.email?.toLowerCase() === user.email
        )) {
          hasAccess = true;
        }
      });
      
      if (hasAccess) {
        sharedAgentsWithAccess.push({
          code,
          id: agent.id,
          name: agent.name
        });
      }
    }
    
    // Determine expected agents for this user
    const expectedAgents = [];
    for (const [code, emails] of Object.entries(EXPECTED_REGULAR_USER_ACCESS)) {
      if (emails.includes(user.email)) {
        expectedAgents.push(code);
      }
    }
    
    userAgentAccess.push({
      email: user.email,
      name: user.name,
      role: user.role,
      domain: user.domain,
      expectedAgents,
      actualAgents: sharedAgentsWithAccess,
      expectedCount: expectedAgents.length,
      actualCount: sharedAgentsWithAccess.length,
      hasIssue: sharedAgentsWithAccess.length !== expectedAgents.length ||
                !sharedAgentsWithAccess.every(a => expectedAgents.includes(a.code))
    });
  }
  
  // Sort: issues first, then by expected count
  userAgentAccess.sort((a, b) => {
    if (a.hasIssue !== b.hasIssue) return a.hasIssue ? -1 : 1;
    if (a.expectedCount !== b.expectedCount) return a.expectedCount - b.expectedCount;
    return a.email.localeCompare(b.email);
  });
  
  // Display all regular users
  console.log('📋 REGULAR USERS - SHARED AGENT ACCESS:');
  console.log('='.repeat(120));
  console.log('\n| Email | Name | Expected | Actually Sees | Status |');
  console.log('|-------|------|----------|---------------|--------|');
  
  userAgentAccess.forEach(user => {
    const expectedStr = user.expectedAgents.join(', ') || 'NONE';
    const actualStr = user.actualAgents.map(a => a.code).join(', ') || 'NONE';
    
    let status = '✅ OK';
    if (user.hasIssue) {
      if (user.actualCount > user.expectedCount) {
        const extra = user.actualAgents.filter(a => !user.expectedAgents.includes(a.code));
        status = `🚨 Has ${extra.length} EXTRA: ${extra.map(a => a.code).join(', ')}`;
      } else if (user.actualCount < user.expectedCount) {
        const missing = user.expectedAgents.filter(code => 
          !user.actualAgents.some(a => a.code === code)
        );
        status = `⚠️ Missing ${missing.length}: ${missing.join(', ')}`;
      } else {
        status = '⚠️ Wrong agents';
      }
    }
    
    console.log(`| ${user.email} | ${user.name} | ${expectedStr} (${user.expectedCount}) | ${actualStr} (${user.actualCount}) | ${status} |`);
  });
  
  // Focus on target user if specified
  if (targetEmail) {
    const targetUser = userAgentAccess.find(u => u.email === targetEmail.toLowerCase());
    
    if (targetUser) {
      console.log('\n' + '='.repeat(120));
      console.log(`\n🎯 DETAILED ANALYSIS: ${targetEmail}`);
      console.log('='.repeat(120));
      console.log(`\nUser: ${targetUser.name}`);
      console.log(`Role: ${targetUser.role}`);
      console.log(`Domain: ${targetUser.domain}`);
      
      console.log(`\n📋 EXPECTED SHARED AGENTS (${targetUser.expectedCount}):`);
      targetUser.expectedAgents.forEach(code => {
        console.log(`   ✓ ${code} - ${OFFICIAL_SHARED_AGENTS[code].name}`);
      });
      
      console.log(`\n📋 ACTUALLY HAS ACCESS TO (${targetUser.actualCount}):`);
      targetUser.actualAgents.forEach(agent => {
        const isExpected = targetUser.expectedAgents.includes(agent.code);
        const icon = isExpected ? '✅' : '🚨';
        console.log(`   ${icon} ${agent.code} - ${agent.name} (${agent.id})`);
      });
      
      if (targetUser.hasIssue) {
        console.log(`\n🚨 ISSUE DETECTED:`);
        
        const extra = targetUser.actualAgents.filter(a => 
          !targetUser.expectedAgents.includes(a.code)
        );
        const missing = targetUser.expectedAgents.filter(code => 
          !targetUser.actualAgents.some(a => a.code === code)
        );
        
        if (extra.length > 0) {
          console.log(`\n   ❌ UNAUTHORIZED ACCESS (${extra.length} agents):`);
          extra.forEach(agent => {
            console.log(`      ${agent.code} - ${agent.name}`);
            console.log(`      Fix: node scripts/revoke-access.mjs ${agent.id} ${targetEmail}`);
          });
        }
        
        if (missing.length > 0) {
          console.log(`\n   ⚠️ MISSING ACCESS (${missing.length} agents):`);
          missing.forEach(code => {
            console.log(`      ${code} - ${OFFICIAL_SHARED_AGENTS[code].name}`);
            console.log(`      Fix: node scripts/grant-access.mjs ${OFFICIAL_SHARED_AGENTS[code].id} ${targetEmail}`);
          });
        }
      } else {
        console.log(`\n✅ This user has correct access to all shared agents!`);
      }
    } else {
      console.log(`\n❌ User ${targetEmail} not found or is not a regular user`);
    }
  }
  
  // Summary of issues
  const usersWithIssues = userAgentAccess.filter(u => u.hasIssue);
  
  console.log('\n' + '='.repeat(120));
  console.log('\n📊 FINAL SUMMARY:');
  console.log(`   Regular users (user/expert role): ${regularUsers.length}`);
  console.log(`   Users with correct access: ${regularUsers.length - usersWithIssues.length}`);
  console.log(`   Users with access issues: ${usersWithIssues.length}`);
  
  if (usersWithIssues.length > 0) {
    console.log(`\n🚨 USERS WITH ISSUES:`);
    usersWithIssues.forEach(user => {
      const extra = user.actualAgents.filter(a => !user.expectedAgents.includes(a.code));
      const missing = user.expectedAgents.filter(code => 
        !user.actualAgents.some(a => a.code === code)
      );
      
      console.log(`   ${user.email}:`);
      if (extra.length > 0) {
        console.log(`      ❌ Has unauthorized access to: ${extra.map(a => a.code).join(', ')}`);
      }
      if (missing.length > 0) {
        console.log(`      ⚠️ Missing access to: ${missing.join(', ')}`);
      }
    });
  } else {
    console.log('\n✅✅✅ ALL REGULAR USERS HAVE CORRECT SHARED AGENT ACCESS ✅✅✅');
  }
}

// Get target email from command line if provided
const targetEmail = process.argv[2];

analyzeUserAgents(targetEmail)
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });






