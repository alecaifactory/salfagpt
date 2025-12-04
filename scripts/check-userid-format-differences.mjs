#!/usr/bin/env node
/**
 * Check userId Format Differences
 * 
 * Compare userId formats between:
 * - M1-v2 users (not showing)
 * - M3-v2 users (showing correctly)
 * 
 * Looking for:
 * - OAuth ID format differences
 * - HashId vs Google ID
 * - Legacy vs new format
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({ projectId: 'salfagpt' });
const db = getFirestore();

const M1_AGENT_ID = 'cjn3bC0HrUYtHqu69CKS';
const M3_AGENT_ID = 'vStojK73ZKbjNsEnqANJ';

async function analyzeUserIds(agentId, agentName) {
  console.log(`\n${'═'.repeat(80)}`);
  console.log(`🔍 ANALYZING: ${agentName}`);
  console.log('═'.repeat(80));
  
  // Get agent_shares
  const sharesSnapshot = await db.collection('agent_shares')
    .where('agentId', '==', agentId)
    .get();
  
  if (sharesSnapshot.empty) {
    console.log(`❌ No agent_shares found\n`);
    return [];
  }
  
  const shareData = sharesSnapshot.docs[0].data();
  const sharedWith = shareData.sharedWith || [];
  
  console.log(`Found ${sharedWith.length} users\n`);
  
  const userAnalysis = [];
  
  for (const target of sharedWith.slice(0, 5)) {
    const analysis = {
      email: target.email,
      name: target.name,
      userId: target.userId,
      userIdFormat: analyzeUserIdFormat(target.userId),
      userIdLength: target.userId?.length || 0
    };
    
    // Check if user exists in users collection
    if (target.userId) {
      const userDoc = await db.collection('users').doc(target.userId).get();
      analysis.existsInDB = userDoc.exists;
      if (userDoc.exists) {
        analysis.userDocEmail = userDoc.data().email;
        analysis.emailMatches = userDoc.data().email === target.email;
      }
    }
    
    userAnalysis.push(analysis);
    
    console.log(`User ${userAnalysis.length}:`);
    console.log(`  Email: ${analysis.email}`);
    console.log(`  Name: ${analysis.name}`);
    console.log(`  userId: ${analysis.userId}`);
    console.log(`  Format: ${analysis.userIdFormat}`);
    console.log(`  Length: ${analysis.userIdLength}`);
    console.log(`  Exists in DB: ${analysis.existsInDB ? '✅' : '❌'}`);
    if (analysis.existsInDB) {
      console.log(`  Email matches: ${analysis.emailMatches ? '✅' : '❌ MISMATCH'}`);
    }
    console.log();
  }
  
  return userAnalysis;
}

function analyzeUserIdFormat(userId) {
  if (!userId) return 'MISSING';
  
  // Check different ID formats
  if (userId.startsWith('usr_')) {
    if (userId.length === 28) return 'Hash ID (Flow format)';
    if (userId.includes('_') && userId.split('_').length > 2) return 'Email-based Hash';
    return 'Custom Hash';
  }
  
  if (/^\d+$/.test(userId)) {
    return 'Google OAuth ID (numeric)';
  }
  
  if (userId.length > 50) {
    return 'Google OAuth ID (long)';
  }
  
  return 'Unknown format';
}

async function main() {
  console.log('\n🔍 USERID FORMAT COMPARISON - M1 vs M3\n');
  console.log('Checking if there are differences in userId formats');
  console.log('that might cause lookup failures\n');
  
  const m1Users = await analyzeUserIds(M1_AGENT_ID, 'M1-v2 (NOT SHOWING)');
  const m3Users = await analyzeUserIds(M3_AGENT_ID, 'M3-v2 (SHOWING)');
  
  // Comparison
  console.log('═'.repeat(80));
  console.log('📊 COMPARISON');
  console.log('═'.repeat(80));
  console.log();
  
  console.log('M1-v2 userId formats:');
  const m1Formats = m1Users.map(u => u.userIdFormat);
  const m1UniqueFormats = [...new Set(m1Formats)];
  m1UniqueFormats.forEach(format => {
    const count = m1Formats.filter(f => f === format).length;
    console.log(`  ${format}: ${count} users`);
  });
  console.log();
  
  console.log('M3-v2 userId formats:');
  const m3Formats = m3Users.map(u => u.userIdFormat);
  const m3UniqueFormats = [...new Set(m3Formats)];
  m3UniqueFormats.forEach(format => {
    const count = m3Formats.filter(f => f === format).length;
    console.log(`  ${format}: ${count} users`);
  });
  console.log();
  
  // Check for mismatches
  const m1Missing = m1Users.filter(u => !u.existsInDB);
  const m3Missing = m3Users.filter(u => !u.existsInDB);
  
  if (m1Missing.length > 0) {
    console.log(`⚠️ M1-v2 has ${m1Missing.length} users NOT in database:`);
    m1Missing.forEach(u => console.log(`  - ${u.email} (userId: ${u.userId})`));
    console.log();
  }
  
  if (m3Missing.length > 0) {
    console.log(`⚠️ M3-v2 has ${m3Missing.length} users NOT in database:`);
    m3Missing.forEach(u => console.log(`  - ${u.email} (userId: ${u.userId})`));
    console.log();
  }
  
  if (m1Missing.length === 0 && m3Missing.length === 0) {
    console.log('✅ All users exist in database for both agents\n');
  }
  
  // Check email mismatches
  const m1Mismatches = m1Users.filter(u => u.existsInDB && !u.emailMatches);
  const m3Mismatches = m3Users.filter(u => u.existsInDB && !u.emailMatches);
  
  if (m1Mismatches.length > 0) {
    console.log(`❌ M1-v2 has ${m1Mismatches.length} EMAIL MISMATCHES:`);
    m1Mismatches.forEach(u => {
      console.log(`  Share: ${u.email}`);
      console.log(`  DB: ${u.userDocEmail}`);
      console.log(`  userId: ${u.userId}`);
      console.log();
    });
  }
  
  if (m3Mismatches.length > 0) {
    console.log(`❌ M3-v2 has ${m3Mismatches.length} EMAIL MISMATCHES:`);
    m3Mismatches.forEach(u => {
      console.log(`  Share: ${u.email}`);
      console.log(`  DB: ${u.userDocEmail}`);
      console.log(`  userId: ${u.userId}`);
      console.log();
    });
  }
  
  // Final diagnosis
  console.log('═'.repeat(80));
  console.log('🎯 DIAGNOSIS');
  console.log('═'.repeat(80));
  console.log();
  
  if (m1Formats.join() !== m3Formats.join()) {
    console.log('⚠️ DIFFERENT userId formats between M1 and M3');
    console.log('   This might cause lookup issues\n');
  } else {
    console.log('✅ Same userId formats\n');
  }
  
  if (m1Missing.length > m3Missing.length) {
    console.log(`❌ M1-v2 has MORE missing users (${m1Missing.length} vs ${m3Missing.length})`);
    console.log('   This could explain why it doesn\'t display\n');
  } else if (m3Missing.length > m1Missing.length) {
    console.log(`⚠️ M3-v2 has MORE missing users but still works`);
    console.log('   Missing users is NOT the issue\n');
  } else {
    console.log('✅ Same number of missing users\n');
  }
  
  if (m1Mismatches.length > 0 || m3Mismatches.length > 0) {
    console.log('❌ EMAIL MISMATCHES FOUND');
    console.log('   userId points to different email than in share');
    console.log('   This will cause UI lookup failures\n');
  }
  
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});




