#!/usr/bin/env node
/**
 * Verify Agent Sharing Status
 * 
 * Checks if all expected users have been shared access to their assigned agents
 * 
 * Usage: npx tsx scripts/verify-agent-sharing.mjs
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({ projectId: 'salfagpt' });
const db = getFirestore();

// Expected sharing configuration from user's table
const EXPECTED_SHARING = {
  'iQmdg3bMSJ1AdqqlFpye': { // S1-v2
    name: 'S1-v2 GESTION BODEGAS GPT',
    users: [
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
      // TI users
      'fdiazt@salfagestion.cl',
      'sorellanac@salfagestion.cl',
      'nfarias@salfagestion.cl',
      'alecdickinson@gmail.com',
      'alec@salfacloud.cl'
    ]
  },
  '1lgr33ywq5qed67sqCYi': { // S2-v2
    name: 'S2-v2 MAQSA MANTENIMIENTO',
    users: [
      'svillegas@maqsa.cl',
      'csolis@maqsa.cl',
      'fmelin@maqsa.cl',
      'riprado@maqsa.cl',
      'jcalfin@maqsa.cl',
      'mmichael@maqsa.cl',
      // TI users
      'fdiazt@salfagestion.cl',
      'sorellanac@salfagestion.cl',
      'nfarias@salfagestion.cl',
      'alecdickinson@gmail.com',
      'alec@salfacloud.cl'
    ]
  },
  'cjn3bC0HrUYtHqu69CKS': { // M1-v2
    name: 'M1-v2 ASISTENTE LEGAL',
    users: [
      'jriverof@iaconcagua.com',
      'afmanriquez@iaconcagua.com',
      'cquijadam@iaconcagua.com',
      'ireygadas@iaconcagua.com',
      'jmancilla@iaconcagua.com',
      'mallende@iaconcagua.com',
      'recontreras@iaconcagua.com',
      'dundurraga@iaconcagua.com',
      'rfuentesm@inoval.cl',
      // TI users
      'fdiazt@salfagestion.cl',
      'sorellanac@salfagestion.cl',
      'nfarias@salfagestion.cl',
      'alecdickinson@gmail.com',
      'alec@salfacloud.cl'
    ]
  },
  'vStojK73ZKbjNsEnqANJ': { // M3-v2
    name: 'M3-v2 GOP GPT',
    users: [
      'mfuenzalidar@novatec.cl',
      'phvaldivia@novatec.cl',
      'yzamora@inoval.cl',
      'jcancinoc@inoval.cl',
      'lurriola@novatec.cl',
      'fcerda@constructorasalfa.cl',
      'gfalvarez@novatec.cl',
      'dortega@novatec.cl',
      'mburgoa@novatec.cl',
      // TI users
      'fdiazt@salfagestion.cl',
      'sorellanac@salfagestion.cl',
      'nfarias@salfagestion.cl',
      'alecdickinson@gmail.com',
      'alec@salfacloud.cl'
    ]
  }
};

async function verifyAgentSharing(agentId, expectedConfig) {
  console.log(`\n${'═'.repeat(80)}`);
  console.log(`📊 VERIFYING: ${expectedConfig.name}`);
  console.log(`${'═'.repeat(80)}`);
  console.log(`Agent ID: ${agentId}`);
  console.log(`Expected users: ${expectedConfig.users.length}\n`);

  // Get conversation document
  const agentDoc = await db.collection('conversations').doc(agentId).get();
  
  if (!agentDoc.exists) {
    console.log('❌ Agent not found in Firestore!\n');
    return {
      agentId,
      name: expectedConfig.name,
      found: false,
      expected: expectedConfig.users.length,
      actual: 0,
      missing: expectedConfig.users,
      extra: []
    };
  }

  const agentData = agentDoc.data();
  const sharedWith = agentData.sharedWith || [];

  console.log(`📋 Agent found:`);
  console.log(`   Title: ${agentData.title}`);
  console.log(`   Owner: ${agentData.userId}`);
  console.log(`   Shared with: ${sharedWith.length} users\n`);

  // Extract emails from sharedWith
  const actualEmails = sharedWith
    .filter(share => share.type === 'user')
    .map(share => share.email.toLowerCase());

  const expectedEmails = expectedConfig.users.map(e => e.toLowerCase());

  // Find missing and extra
  const missing = expectedEmails.filter(email => !actualEmails.includes(email));
  const extra = actualEmails.filter(email => !expectedEmails.includes(email));
  const matched = expectedEmails.filter(email => actualEmails.includes(email));

  // Display results
  console.log(`✅ Correctly shared: ${matched.length}/${expectedEmails.length}`);
  
  if (matched.length > 0 && matched.length <= 10) {
    matched.forEach(email => console.log(`   ✓ ${email}`));
  } else if (matched.length > 10) {
    matched.slice(0, 5).forEach(email => console.log(`   ✓ ${email}`));
    console.log(`   ... and ${matched.length - 5} more`);
  }
  console.log();

  if (missing.length > 0) {
    console.log(`❌ Missing (not shared): ${missing.length}`);
    missing.forEach(email => console.log(`   ✗ ${email}`));
    console.log();
  }

  if (extra.length > 0) {
    console.log(`⚠️ Extra (not in expected list): ${extra.length}`);
    extra.forEach(email => console.log(`   ? ${email}`));
    console.log();
  }

  return {
    agentId,
    name: expectedConfig.name,
    found: true,
    expected: expectedEmails.length,
    actual: actualEmails.length,
    matched: matched.length,
    missing: missing,
    extra: extra,
    sharedWith: sharedWith
  };
}

async function main() {
  console.log('\n🔍 AGENT SHARING VERIFICATION\n');
  console.log('Checking if all expected users have access to their assigned agents...\n');

  const results = [];

  for (const [agentId, config] of Object.entries(EXPECTED_SHARING)) {
    const result = await verifyAgentSharing(agentId, config);
    results.push(result);
  }

  // Summary table
  console.log('\n' + '═'.repeat(120));
  console.log('📊 SUMMARY TABLE');
  console.log('═'.repeat(120));
  console.log();

  console.log('| Agent | Expected | Actual | Matched | Missing | Extra | Status |');
  console.log('|-------|----------|--------|---------|---------|-------|--------|');
  
  results.forEach(r => {
    if (!r.found) {
      console.log(`| ${r.name} | ${r.expected} | - | - | ${r.expected} | - | ❌ NOT FOUND |`);
    } else {
      const status = r.missing.length === 0 && r.extra.length === 0 ? '✅ PERFECT' :
                     r.missing.length === 0 ? '⚠️ EXTRA' :
                     r.matched > 0 ? '⚠️ PARTIAL' : '❌ NONE';
      console.log(`| ${r.name} | ${r.expected} | ${r.actual} | ${r.matched} | ${r.missing.length} | ${r.extra.length} | ${status} |`);
    }
  });

  console.log();
  console.log('═'.repeat(120));
  console.log();

  // Issues summary
  const hasIssues = results.some(r => !r.found || r.missing.length > 0);

  if (hasIssues) {
    console.log('🚨 SHARING ISSUES FOUND:\n');
    
    results.forEach(r => {
      if (!r.found) {
        console.log(`${r.name}:`);
        console.log(`  ❌ Agent not found in Firestore`);
        console.log();
      } else if (r.missing.length > 0) {
        console.log(`${r.name}:`);
        console.log(`  ❌ ${r.missing.length} users not shared access`);
        console.log(`  Need to share with:`);
        r.missing.slice(0, 10).forEach(email => console.log(`    - ${email}`));
        if (r.missing.length > 10) {
          console.log(`    ... and ${r.missing.length - 10} more`);
        }
        console.log();
      }
    });

    console.log('💡 RECOMMENDED ACTIONS:\n');
    console.log('For each missing user, run:');
    console.log('  1. Go to webapp UI');
    console.log('  2. Open the agent');
    console.log('  3. Click "Share" button');
    console.log('  4. Enter user email');
    console.log('  5. Set access level: "Expert" for business users, "User" for TI');
    console.log('  6. Click "Share"\n');
    console.log('Or use API:');
    console.log('  POST /api/conversations/{agentId}/share');
    console.log('  Body: { email: "user@domain.com", accessLevel: "expert" }\n');

  } else {
    console.log('✅ NO ISSUES - All users properly shared!\n');
  }

  // Additional stats
  const totalExpected = results.reduce((sum, r) => sum + r.expected, 0);
  const totalMatched = results.reduce((sum, r) => sum + (r.matched || 0), 0);
  const totalMissing = results.reduce((sum, r) => sum + r.missing.length, 0);

  console.log('═'.repeat(120));
  console.log('📊 SYSTEM TOTALS');
  console.log('═'.repeat(120));
  console.log();
  console.log(`Total expected user shares:    ${totalExpected}`);
  console.log(`Total actual shares:           ${totalMatched}`);
  console.log(`Total missing:                 ${totalMissing}`);
  console.log(`Completion rate:               ${((totalMatched/totalExpected)*100).toFixed(1)}%`);
  console.log();

  const allShared = totalMissing === 0;
  console.log('═'.repeat(120));
  console.log(`\n🎯 SHARING STATUS: ${allShared ? '✅ ALL USERS SHARED' : '⚠️ INCOMPLETE'}\n`);
  console.log('═'.repeat(120));
  console.log();

  // Summary by agent
  console.log('📋 BY AGENT SUMMARY:\n');
  results.forEach(r => {
    if (r.found) {
      const percentage = ((r.matched / r.expected) * 100).toFixed(1);
      const status = r.missing.length === 0 ? '✅' : '⚠️';
      console.log(`${status} ${r.name}: ${r.matched}/${r.expected} (${percentage}%)`);
    } else {
      console.log(`❌ ${r.name}: Agent not found`);
    }
  });
  console.log();

  process.exit(hasIssues ? 1 : 0);
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});

