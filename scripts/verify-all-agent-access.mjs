import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin with Application Default Credentials
initializeApp({
  credential: applicationDefault(),
  projectId: 'salfagpt'
});

const db = getFirestore();

// Agent IDs mapping (CORRECT IDs from Firestore)
const AGENT_IDS = {
  'S001': 'AjtQZEIMQvFnPRJRjl4y', // GESTION BODEGAS GPT
  'S002': 'KfoKcDrb6pMnduAiLlrD', // MAQSA Mantenimiento
  'M001': 'cjn3bC0HrUYtHqu69CKS', // Asistente Legal Territorial RDI
  'M003': '5aNwSMgff2BRKrrVRypF'  // GOP GPT
};

const AGENT_NAMES = {
  'S001': 'GESTION BODEGAS GPT',
  'S002': 'MAQSA Mantenimiento',
  'M001': 'Asistente Legal Territorial RDI',
  'M003': 'GOP GPT'
};

// Expected access per agent (UPDATED 2025-11-13)
const EXPECTED_ACCESS = {
  'S001': [
    'abhernandez@maqsa.cl',
    'cvillalon@maqsa.cl',
    'hcontrerasp@salfamontajes.com',
    'iojedaa@maqsa.cl',
    'jefarias@maqsa.cl',
    'msgarcia@maqsa.cl',
    'ojrodriguez@maqsa.cl',
    'paovalle@maqsa.cl',
    'salegria@maqsa.cl',
    'vaaravena@maqsa.cl',
    'vclarke@maqsa.cl',
    'fdiazt@salfagestion.cl',
    'sorellanac@salfagestion.cl',
    'nfarias@salfagestion.cl',
    'alecdickinson@gmail.com',
    'alec@getaifactory.com',
    'alec@salfacloud.cl'  // ADDED
  ],
  'S002': [
    'svillegas@maqsa.cl',
    'csolis@maqsa.cl',
    'fmelin@maqsa.cl',
    'riprado@maqsa.cl',
    'jcalfin@maqsa.cl',
    'mmichael@maqsa.cl',
    'fdiazt@salfagestion.cl',
    'sorellanac@salfagestion.cl',
    'nfarias@salfagestion.cl',
    'alecdickinson@gmail.com',
    'alec@getaifactory.com',
    'alec@salfacloud.cl'  // ADDED
  ],
  'M001': [
    'jriverof@iaconcagua.com',
    'afmanriquez@iaconcagua.com',
    'cquijadam@iaconcagua.com',
    'ireygadas@iaconcagua.com',
    'jmancilla@iaconcagua.com',
    'mallende@iaconcagua.com',
    'recontreras@iaconcagua.com',
    'dundurraga@iaconcagua.com',
    'rfuentesm@inoval.cl',
    'fdiazt@salfagestion.cl',
    'sorellanac@salfagestion.cl',
    'nfarias@salfagestion.cl',
    'alecdickinson@gmail.com',
    'alec@getaifactory.com',
    'alec@salfacloud.cl'  // ADDED
  ],
  'M003': [
    'mfuenzalidar@novatec.cl',
    'phvaldivia@novatec.cl',
    'yzamora@inoval.cl',
    'jcancinoc@inoval.cl',
    'lurriola@novatec.cl',
    'fcerda@constructorasalfa.cl',
    'gfalvarez@novatec.cl',
    'dortega@novatec.cl',
    'mburgoa@novatec.cl',
    'fdiazt@salfagestion.cl',
    'sorellanac@salfagestion.cl',
    'nfarias@salfagestion.cl',
    'alecdickinson@gmail.com',
    'alec@getaifactory.com',
    'alec@salfacloud.cl'  // ADDED
  ]
};

async function verifyAllAccess() {
  console.log('🔍 COMPREHENSIVE AGENT ACCESS VERIFICATION');
  console.log('='.repeat(100));
  console.log(`Date: ${new Date().toISOString()}`);
  console.log('='.repeat(100));
  
  let totalUnauthorized = 0;
  let totalMissing = 0;
  let totalCorrect = 0;
  const issues = [];
  
  // Get all users for reference
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
  
  for (const [agentCode, agentId] of Object.entries(AGENT_IDS)) {
    console.log(`\n${'▼'.repeat(50)}`);
    console.log(`📋 AGENT: ${AGENT_NAMES[agentCode]} (${agentCode})`);
    console.log(`   ID: ${agentId}`);
    console.log('▼'.repeat(50));
    
    try {
      // Get agent document
      const agentDoc = await db.collection('conversations').doc(agentId).get();
      
      if (!agentDoc.exists) {
        console.log(`❌ ERROR: Agent document not found in Firestore`);
        issues.push({
          agent: agentCode,
          type: 'ERROR',
          message: 'Agent document not found'
        });
        continue;
      }
      
      const agentData = agentDoc.data();
      
      // Get allowedUsers from agent document
      const currentAllowedUsers = agentData.allowedUsers || [];
      
      // Get agent shares
      const sharesSnapshot = await db.collection('agent_shares')
        .where('agentId', '==', agentId)
        .get();
      
      // Extract users from shares
      const sharedUsers = new Set();
      sharesSnapshot.forEach(shareDoc => {
        const shareData = shareDoc.data();
        shareData.sharedWith?.forEach(target => {
          const email = (target.email || '').toLowerCase();
          if (email) sharedUsers.add(email);
        });
      });
      
      // Combine both sources
      const currentAccess = Array.from(new Set([...currentAllowedUsers, ...sharedUsers]))
        .map(email => email.toLowerCase());
      
      const expectedAccess = EXPECTED_ACCESS[agentCode].map(email => email.toLowerCase());
      
      console.log(`\n📊 ACCESS SUMMARY:`);
      console.log(`   Current Access:   ${currentAccess.length} users`);
      console.log(`   Expected Access:  ${expectedAccess.length} users`);
      console.log(`   From allowedUsers: ${currentAllowedUsers.length}`);
      console.log(`   From agent_shares: ${sharedUsers.size}`);
      
      // Find discrepancies
      const unauthorized = currentAccess.filter(email => !expectedAccess.includes(email));
      const missing = expectedAccess.filter(email => !currentAccess.includes(email));
      const correct = currentAccess.filter(email => expectedAccess.includes(email));
      
      totalUnauthorized += unauthorized.length;
      totalMissing += missing.length;
      totalCorrect += correct.length;
      
      // Report unauthorized access
      if (unauthorized.length > 0) {
        console.log(`\n🚨 UNAUTHORIZED ACCESS (${unauthorized.length} users - SHOULD BE REMOVED):`);
        unauthorized.forEach(email => {
          const user = usersMap.get(email);
          console.log(`   ❌ ${email} ${user ? `(${user.name}, ${user.role})` : '(user not found)'}`);
          issues.push({
            agent: agentCode,
            type: 'UNAUTHORIZED',
            email: email,
            action: 'REMOVE'
          });
        });
      }
      
      // Report missing access
      if (missing.length > 0) {
        console.log(`\n⚠️  MISSING ACCESS (${missing.length} users - SHOULD BE ADDED):`);
        missing.forEach(email => {
          const user = usersMap.get(email);
          console.log(`   ⭕ ${email} ${user ? `(${user.name}, ${user.role})` : '(user not found in system)'}`);
          issues.push({
            agent: agentCode,
            type: 'MISSING',
            email: email,
            action: 'ADD'
          });
        });
      }
      
      // Report correct access
      if (correct.length > 0) {
        console.log(`\n✅ CORRECT ACCESS (${correct.length} users):`);
        correct.slice(0, 5).forEach(email => {
          const user = usersMap.get(email);
          console.log(`   ✓ ${email} ${user ? `(${user.name})` : ''}`);
        });
        if (correct.length > 5) {
          console.log(`   ... and ${correct.length - 5} more`);
        }
      }
      
      // Overall status
      if (unauthorized.length === 0 && missing.length === 0) {
        console.log(`\n✅✅✅ AGENT ${agentCode}: ALL ACCESS PERMISSIONS CORRECT ✅✅✅`);
      } else {
        console.log(`\n⚠️  AGENT ${agentCode}: ACCESS DISCREPANCIES FOUND`);
        console.log(`   - Unauthorized: ${unauthorized.length}`);
        console.log(`   - Missing: ${missing.length}`);
      }
      
    } catch (error) {
      console.error(`❌ Error verifying agent ${agentCode}:`, error.message);
      issues.push({
        agent: agentCode,
        type: 'ERROR',
        message: error.message
      });
    }
  }
  
  // Final summary
  console.log('\n' + '='.repeat(100));
  console.log('📊 FINAL SUMMARY');
  console.log('='.repeat(100));
  console.log(`✅ Correct Access:      ${totalCorrect} user-agent pairs`);
  console.log(`⚠️  Missing Access:      ${totalMissing} user-agent pairs (need to ADD)`);
  console.log(`🚨 Unauthorized Access: ${totalUnauthorized} user-agent pairs (need to REMOVE)`);
  
  if (issues.length > 0) {
    console.log(`\n⚠️  Total Issues Found: ${issues.length}`);
    console.log('\n📋 ACTIONS REQUIRED:');
    console.log('='.repeat(100));
    
    const missingIssues = issues.filter(i => i.type === 'MISSING');
    const unauthorizedIssues = issues.filter(i => i.type === 'UNAUTHORIZED');
    
    if (missingIssues.length > 0) {
      console.log(`\n🔧 GRANT ACCESS (${missingIssues.length} actions):`);
      missingIssues.forEach(issue => {
        console.log(`   node scripts/grant-access.mjs ${AGENT_IDS[issue.agent]} ${issue.email}`);
      });
    }
    
    if (unauthorizedIssues.length > 0) {
      console.log(`\n🔧 REVOKE ACCESS (${unauthorizedIssues.length} actions):`);
      unauthorizedIssues.forEach(issue => {
        console.log(`   node scripts/revoke-access.mjs ${AGENT_IDS[issue.agent]} ${issue.email}`);
      });
    }
  }
  
  if (totalUnauthorized === 0 && totalMissing === 0) {
    console.log('\n✅✅✅ ALL AGENTS HAVE CORRECT ACCESS PERMISSIONS ✅✅✅');
  } else {
    console.log('\n⚠️  ACTION REQUIRED: Access discrepancies detected above');
  }
  
  console.log('='.repeat(100));
}

verifyAllAccess()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Fatal error:', error);
    console.error(error);
    process.exit(1);
  });
