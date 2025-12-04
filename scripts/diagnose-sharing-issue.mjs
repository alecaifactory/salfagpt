#!/usr/bin/env node
/**
 * Diagnose Sharing Display Issue
 * 
 * The UI shows:
 * - S1-v2: Only 1 user (should be 16)
 * - S2-v2: 0 users (should be 11)
 * - M1-v2: 0 users (should be 14)
 * - M3-v2: 1 user as "Unknown" (should be 14 with names)
 * 
 * This script checks:
 * 1. What's actually in Firestore
 * 2. Structure of sharedWith entries
 * 3. Whether userId lookups work
 * 
 * Usage: npx tsx scripts/diagnose-sharing-issue.mjs
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({ projectId: 'salfagpt' });
const db = getFirestore();

const AGENTS = [
  { id: 'iQmdg3bMSJ1AdqqlFpye', name: 'S1-v2', expected: 16 },
  { id: '1lgr33ywq5qed67sqCYi', name: 'S2-v2', expected: 11 },
  { id: 'cjn3bC0HrUYtHqu69CKS', name: 'M1-v2', expected: 14 },
  { id: 'vStojK73ZKbjNsEnqANJ', name: 'M3-v2', expected: 14 }
];

async function diagnoseAgent(agent) {
  console.log(`\n${'═'.repeat(80)}`);
  console.log(`🔍 DIAGNOSING: ${agent.name}`);
  console.log(`${'═'.repeat(80)}`);
  
  const agentDoc = await db.collection('conversations').doc(agent.id).get();
  
  if (!agentDoc.exists) {
    console.log(`❌ Agent not found!\n`);
    return;
  }

  const data = agentDoc.data();
  const sharedWith = data.sharedWith || [];
  
  console.log(`📋 Agent: ${data.title}`);
  console.log(`   Owner: ${data.userId}`);
  console.log(`   Expected shares: ${agent.expected}`);
  console.log(`   Actual shares: ${sharedWith.length}`);
  console.log(`   Match: ${sharedWith.length === agent.expected ? '✅' : '❌'}\n`);

  if (sharedWith.length === 0) {
    console.log(`🚨 PROBLEM: sharedWith array is EMPTY`);
    console.log(`   This means sharing was not persisted to Firestore`);
    console.log(`   Need to re-run sharing script\n`);
    return;
  }

  if (sharedWith.length !== agent.expected) {
    console.log(`⚠️ PROBLEM: Wrong number of shares`);
    console.log(`   Expected: ${agent.expected}`);
    console.log(`   Actual: ${sharedWith.length}`);
    console.log(`   Difference: ${agent.expected - sharedWith.length}\n`);
  }

  // Check structure of first 3 entries
  console.log(`📊 Sample entries (first 3):\n`);
  
  sharedWith.slice(0, 3).forEach((share, idx) => {
    console.log(`Entry ${idx + 1}:`);
    console.log(`  type: ${share.type || 'MISSING'}`);
    console.log(`  email: ${share.email || 'MISSING'}`);
    console.log(`  name: ${share.name || 'MISSING'}`);
    console.log(`  userId: ${share.userId || 'MISSING ❌'}`);
    console.log(`  accessLevel: ${share.accessLevel || 'MISSING'}`);
    
    // Try to look up user
    if (share.userId) {
      console.log(`  ✅ Has userId - UI should display correctly`);
    } else {
      console.log(`  ❌ Missing userId - UI will show "Usuario desconocido"`);
    }
    console.log();
  });

  // Check if any are missing userId
  const missingUserId = sharedWith.filter(s => !s.userId);
  if (missingUserId.length > 0) {
    console.log(`🚨 PROBLEM: ${missingUserId.length} entries missing userId`);
    console.log(`   These will show as "Usuario desconocido"\n`);
    
    console.log(`Missing userId for:`);
    missingUserId.slice(0, 5).forEach(s => {
      console.log(`  - ${s.email} (${s.name})`);
    });
    if (missingUserId.length > 5) {
      console.log(`  ... and ${missingUserId.length - 5} more`);
    }
    console.log();
  } else {
    console.log(`✅ All entries have userId\n`);
  }

  return {
    name: agent.name,
    expected: agent.expected,
    actual: sharedWith.length,
    missingUserId: missingUserId.length
  };
}

async function main() {
  console.log('\n🔍 DIAGNOSING SHARING DISPLAY ISSUE\n');
  console.log('UI shows:');
  console.log('  - S1-v2: Only 1 user visible (should be 16)');
  console.log('  - S2-v2: 0 users (should be 11)');
  console.log('  - M1-v2: 0 users (should be 14)');
  console.log('  - M3-v2: 1 unknown user (should be 14 with names)\n');

  const results = [];

  for (const agent of AGENTS) {
    const result = await diagnoseAgent(agent);
    if (result) results.push(result);
  }

  // Summary
  console.log('═'.repeat(80));
  console.log('📊 DIAGNOSIS SUMMARY');
  console.log('═'.repeat(80));
  console.log();

  console.log('| Agent | Expected | In Database | Missing userId | Issue |');
  console.log('|-------|----------|-------------|----------------|-------|');
  
  results.forEach(r => {
    const issue = r.actual === 0 ? 'NOT SHARED' :
                  r.actual !== r.expected ? 'WRONG COUNT' :
                  r.missingUserId > 0 ? 'MISSING USERID' :
                  'OK';
    console.log(`| ${r.name} | ${r.expected} | ${r.actual} | ${r.missingUserId} | ${issue} |`);
  });

  console.log();
  console.log('═'.repeat(80));
  console.log();

  // Recommendations
  console.log('💡 RECOMMENDATIONS:\n');
  
  const emptyAgents = results.filter(r => r.actual === 0);
  const missingUserIdAgents = results.filter(r => r.missingUserId > 0);
  
  if (emptyAgents.length > 0) {
    console.log('🚨 CRITICAL: Some agents have NO shares in database');
    console.log('   Affected:', emptyAgents.map(r => r.name).join(', '));
    console.log('   Fix: Re-run sharing script');
    console.log('   Command: npx tsx scripts/share-agents-bulk.mjs\n');
  }
  
  if (missingUserIdAgents.length > 0) {
    console.log('⚠️ Some shares missing userId');
    console.log('   Affected:', missingUserIdAgents.map(r => r.name).join(', '));
    console.log('   Fix: Run userId fix script');
    console.log('   Command: npx tsx scripts/fix-sharing-with-userids.mjs\n');
  }

  if (emptyAgents.length === 0 && missingUserIdAgents.length === 0) {
    console.log('✅ DATABASE IS CORRECT');
    console.log('   Problem may be:');
    console.log('   1. Browser cache - Try hard refresh (Cmd+Shift+R)');
    console.log('   2. UI not reading sharedWith correctly - Check frontend code');
    console.log('   3. Session/auth issue - Try logout/login\n');
  }

  process.exit(0);
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});




