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
  'S001': 'GESTION BODEGAS GPT',
  'S002': 'MAQSA Mantenimiento',
  'M001': 'Asistente Legal Territorial RDI',
  'M003': 'GOP GPT'
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

async function generateAccessTable() {
  console.log('📊 AGENT ACCESS TABLE');
  console.log('='.repeat(140));
  
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
        domain: data.email.split('@')[1]
      });
    }
  });
  
  // Get actual access for each agent
  const actualAccess = {};
  
  for (const [agentCode, agentId] of Object.entries(AGENT_IDS)) {
    const agentDoc = await db.collection('conversations').doc(agentId).get();
    const sharesSnapshot = await db.collection('agent_shares')
      .where('agentId', '==', agentId)
      .get();
    
    const currentAccess = new Set();
    
    // From allowedUsers
    if (agentDoc.exists) {
      const allowedUsers = agentDoc.data().allowedUsers || [];
      allowedUsers.forEach(email => currentAccess.add(email.toLowerCase()));
    }
    
    // From agent_shares
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
  
  // Sort users
  const sortedUsers = Array.from(allUsers).sort();
  
  // Generate table
  console.log('\n| Email | Name | S001 | S002 | M001 | M003 | Issues |');
  console.log('|-------|------|------|------|------|------|--------|');
  
  sortedUsers.forEach(email => {
    const user = usersMap.get(email);
    const name = user?.name || 'N/A';
    
    let s001Status = '';
    let s002Status = '';
    let m001Status = '';
    let m003Status = '';
    let issues = [];
    
    // Check S001
    const hasS001 = actualAccess.S001.has(email);
    const shouldHaveS001 = EXPECTED_ACCESS.S001.includes(email);
    if (hasS001 && shouldHaveS001) s001Status = '✅';
    else if (hasS001 && !shouldHaveS001) { s001Status = '❌'; issues.push('S001: Unauthorized'); }
    else if (!hasS001 && shouldHaveS001) { s001Status = '⚠️'; issues.push('S001: Missing'); }
    else s001Status = '-';
    
    // Check S002
    const hasS002 = actualAccess.S002.has(email);
    const shouldHaveS002 = EXPECTED_ACCESS.S002.includes(email);
    if (hasS002 && shouldHaveS002) s002Status = '✅';
    else if (hasS002 && !shouldHaveS002) { s002Status = '❌'; issues.push('S002: Unauthorized'); }
    else if (!hasS002 && shouldHaveS002) { s002Status = '⚠️'; issues.push('S002: Missing'); }
    else s002Status = '-';
    
    // Check M001
    const hasM001 = actualAccess.M001.has(email);
    const shouldHaveM001 = EXPECTED_ACCESS.M001.includes(email);
    if (hasM001 && shouldHaveM001) m001Status = '✅';
    else if (hasM001 && !shouldHaveM001) { m001Status = '❌'; issues.push('M001: Unauthorized'); }
    else if (!hasM001 && shouldHaveM001) { m001Status = '⚠️'; issues.push('M001: Missing'); }
    else m001Status = '-';
    
    // Check M003
    const hasM003 = actualAccess.M003.has(email);
    const shouldHaveM003 = EXPECTED_ACCESS.M003.includes(email);
    if (hasM003 && shouldHaveM003) m003Status = '✅';
    else if (hasM003 && !shouldHaveM003) { m003Status = '❌'; issues.push('M003: Unauthorized'); }
    else if (!hasM003 && shouldHaveM003) { m003Status = '⚠️'; issues.push('M003: Missing'); }
    else m003Status = '-';
    
    const issuesStr = issues.length > 0 ? issues.join('; ') : '✅ OK';
    
    console.log(`| ${email} | ${name} | ${s001Status} | ${s002Status} | ${m001Status} | ${m003Status} | ${issuesStr} |`);
  });
  
  console.log('\n' + '='.repeat(140));
  console.log('\n**Legend:**');
  console.log('  ✅ = Has access (correct)');
  console.log('  ⚠️ = Missing access (should have but doesn\'t)');
  console.log('  ❌ = Unauthorized access (has but shouldn\'t)');
  console.log('  - = Not expected to have access');
  console.log('\n**Agent Codes:**');
  console.log('  S001 = GESTION BODEGAS GPT');
  console.log('  S002 = MAQSA Mantenimiento');
  console.log('  M001 = Asistente Legal Territorial RDI');
  console.log('  M003 = GOP GPT');
  
  // Summary statistics
  console.log('\n📊 SUMMARY:');
  const totalIssues = sortedUsers.reduce((sum, email) => {
    let count = 0;
    ['S001', 'S002', 'M001', 'M003'].forEach(agent => {
      const has = actualAccess[agent].has(email);
      const shouldHave = EXPECTED_ACCESS[agent].includes(email);
      if (has !== shouldHave) count++;
    });
    return sum + count;
  }, 0);
  
  console.log(`  Total users: ${sortedUsers.length}`);
  console.log(`  Users with issues: ${sortedUsers.filter(email => {
    return ['S001', 'S002', 'M001', 'M003'].some(agent => {
      const has = actualAccess[agent].has(email);
      const shouldHave = EXPECTED_ACCESS[agent].includes(email);
      return has !== shouldHave;
    });
  }).length}`);
  console.log(`  Total access issues: ${totalIssues}`);
}

generateAccessTable()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
