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

// Organization mapping
const ORG_MAPPING = {
  'maqsa.cl': 'MAQSA',
  'salfamontajes.com': 'Salfa Montajes',
  'salfagestion.cl': 'Salfa Gestión',
  'iaconcagua.com': 'Inaconcagua',
  'inoval.cl': 'Inoval',
  'novatec.cl': 'Novatec',
  'constructorasalfa.cl': 'Constructora Salfa',
  'gmail.com': 'External',
  'getaifactory.com': 'AI Factory',
  'salfacloud.cl': 'Salfa Cloud'
};

async function generateCompleteTable() {
  console.log('📊 COMPLETE AGENT ACCESS TABLE');
  console.log('='.repeat(180));
  
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
  
  // Sort users by domain, then email
  const sortedUsers = Array.from(allUsers).sort((a, b) => {
    const domainA = a.split('@')[1];
    const domainB = b.split('@')[1];
    if (domainA !== domainB) return domainA.localeCompare(domainB);
    return a.localeCompare(b);
  });
  
  // Generate table header
  console.log('\n| Email | Name | Organization | Domain | S001 (Has/Should) | S002 (Has/Should) | M001 (Has/Should) | M003 (Has/Should) | Status |');
  console.log('|-------|------|--------------|--------|-------------------|-------------------|-------------------|-------------------|--------|');
  
  // Generate table rows
  sortedUsers.forEach(email => {
    const user = usersMap.get(email);
    const name = user?.name || 'N/A';
    const domain = email.split('@')[1];
    const organization = ORG_MAPPING[domain] || domain;
    
    // S001 status
    const hasS001 = actualAccess.S001.has(email);
    const shouldHaveS001 = EXPECTED_ACCESS.S001.includes(email);
    const s001Status = hasS001 === shouldHaveS001 
      ? (hasS001 ? '✅/✅' : '-/-')
      : (hasS001 ? '✅/❌' : '❌/✅');
    
    // S002 status
    const hasS002 = actualAccess.S002.has(email);
    const shouldHaveS002 = EXPECTED_ACCESS.S002.includes(email);
    const s002Status = hasS002 === shouldHaveS002 
      ? (hasS002 ? '✅/✅' : '-/-')
      : (hasS002 ? '✅/❌' : '❌/✅');
    
    // M001 status
    const hasM001 = actualAccess.M001.has(email);
    const shouldHaveM001 = EXPECTED_ACCESS.M001.includes(email);
    const m001Status = hasM001 === shouldHaveM001 
      ? (hasM001 ? '✅/✅' : '-/-')
      : (hasM001 ? '✅/❌' : '❌/✅');
    
    // M003 status
    const hasM003 = actualAccess.M003.has(email);
    const shouldHaveM003 = EXPECTED_ACCESS.M003.includes(email);
    const m003Status = hasM003 === shouldHaveM003 
      ? (hasM003 ? '✅/✅' : '-/-')
      : (hasM003 ? '✅/❌' : '❌/✅');
    
    // Overall status
    let overallStatus = '✅ OK';
    const issues = [];
    
    if (hasS001 !== shouldHaveS001) issues.push(hasS001 ? 'S001: Unauth' : 'S001: Missing');
    if (hasS002 !== shouldHaveS002) issues.push(hasS002 ? 'S002: Unauth' : 'S002: Missing');
    if (hasM001 !== shouldHaveM001) issues.push(hasM001 ? 'M001: Unauth' : 'M001: Missing');
    if (hasM003 !== shouldHaveM003) issues.push(hasM003 ? 'M003: Unauth' : 'M003: Missing');
    
    if (issues.length > 0) {
      overallStatus = '⚠️ ' + issues.join('; ');
    }
    
    console.log(`| ${email} | ${name} | ${organization} | ${domain} | ${s001Status} | ${s002Status} | ${m001Status} | ${m003Status} | ${overallStatus} |`);
  });
  
  console.log('\n' + '='.repeat(180));
  
  // Legend
  console.log('\n**Legend:**');
  console.log('  ✅/✅ = Has access AND should have (CORRECT)');
  console.log('  ❌/✅ = Does NOT have access BUT should have (MISSING ACCESS)');
  console.log('  ✅/❌ = Has access BUT should NOT have (UNAUTHORIZED)');
  console.log('  -/- = Does not have access and should not (CORRECT)');
  
  console.log('\n**Agent Codes:**');
  console.log('  S001 = GESTION BODEGAS GPT');
  console.log('  S002 = MAQSA Mantenimiento');
  console.log('  M001 = Asistente Legal Territorial RDI');
  console.log('  M003 = GOP GPT');
  
  // Summary statistics
  console.log('\n📊 DETAILED SUMMARY:');
  
  const stats = {
    totalUsers: sortedUsers.length,
    usersWithIssues: 0,
    totalIssues: 0,
    byAgent: {
      S001: { expected: 0, actual: 0, correct: 0 },
      S002: { expected: 0, actual: 0, correct: 0 },
      M001: { expected: 0, actual: 0, correct: 0 },
      M003: { expected: 0, actual: 0, correct: 0 }
    }
  };
  
  sortedUsers.forEach(email => {
    let userHasIssues = false;
    
    ['S001', 'S002', 'M001', 'M003'].forEach(agent => {
      const has = actualAccess[agent].has(email);
      const shouldHave = EXPECTED_ACCESS[agent].includes(email);
      
      if (shouldHave) stats.byAgent[agent].expected++;
      if (has) stats.byAgent[agent].actual++;
      if (has === shouldHave) stats.byAgent[agent].correct++;
      
      if (has !== shouldHave) {
        stats.totalIssues++;
        userHasIssues = true;
      }
    });
    
    if (userHasIssues) stats.usersWithIssues++;
  });
  
  console.log(`  Total users: ${stats.totalUsers}`);
  console.log(`  Users with ALL correct access: ${stats.totalUsers - stats.usersWithIssues}`);
  console.log(`  Users with issues: ${stats.usersWithIssues}`);
  console.log(`  Total access issues: ${stats.totalIssues}`);
  
  console.log('\n📊 BY AGENT:');
  Object.entries(stats.byAgent).forEach(([agent, data]) => {
    const accuracy = data.expected > 0 ? ((data.correct / data.expected) * 100).toFixed(1) : 100;
    console.log(`  ${agent}: ${data.actual}/${data.expected} users (${accuracy}% accurate)`);
  });
  
  if (stats.totalIssues === 0) {
    console.log('\n✅✅✅ ALL ACCESS PERMISSIONS ARE CORRECT ✅✅✅');
  } else {
    console.log(`\n⚠️  ${stats.totalIssues} ACCESS ISSUES DETECTED ⚠️`);
  }
}

generateCompleteTable()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });





