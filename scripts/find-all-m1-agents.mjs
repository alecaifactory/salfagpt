#!/usr/bin/env node
/**
 * Find ALL M1 Agents
 * 
 * Check if there are multiple agents with "M1" in the name
 * This could explain why user sees wrong agent
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({ projectId: 'salfagpt' });
const db = getFirestore();

const USER_ID = 'usr_uhwqffaqag1wrryd82tw'; // alec@getaifactory
const EXPECTED_M1_ID = 'cjn3bC0HrUYtHqu69CKS';

async function main() {
  console.log('\n🔍 SEARCHING FOR ALL M1 AGENTS\n');
  console.log(`Expected ID: ${EXPECTED_M1_ID}\n`);
  
  // Get ALL conversations for this user
  const allConvs = await db.collection('conversations')
    .where('userId', '==', USER_ID)
    .get();
  
  console.log(`Total conversations for user: ${allConvs.size}\n`);
  
  // Filter for M1-related
  const m1Agents = [];
  
  allConvs.docs.forEach(doc => {
    const data = doc.data();
    const title = data.title || '';
    
    // Check if title contains M1, Legal, or RDI
    if (title.includes('M1') || 
        title.includes('Legal') || 
        title.includes('RDI') ||
        title.includes('Territorial') ||
        title.includes('M001') ||
        doc.id === EXPECTED_M1_ID) {
      m1Agents.push({
        id: doc.id,
        title: title,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
      });
    }
  });
  
  console.log(`Found ${m1Agents.length} M1-related agents:\n`);
  console.log('═'.repeat(100));
  
  m1Agents.forEach((agent, idx) => {
    const isExpected = agent.id === EXPECTED_M1_ID;
    console.log(`\n${idx + 1}. ${isExpected ? '✅ EXPECTED' : '⚠️  OTHER'}`);
    console.log(`   ID: ${agent.id}`);
    console.log(`   Title: ${agent.title}`);
    console.log(`   Created: ${agent.createdAt}`);
    console.log(`   Updated: ${agent.updatedAt}`);
  });
  
  console.log('\n' + '═'.repeat(100));
  console.log();
  
  if (m1Agents.length > 1) {
    console.log('⚠️ MULTIPLE M1 AGENTS FOUND!');
    console.log(`   This could explain the UI confusion\n`);
    console.log('🎯 The CORRECT agent is:');
    const correct = m1Agents.find(a => a.id === EXPECTED_M1_ID);
    if (correct) {
      console.log(`   ID: ${correct.id}`);
      console.log(`   Title: ${correct.title}\n`);
    }
    
    console.log('💡 Check which agent is showing in the UI');
    console.log('   Look for Agent ID in the configuration section\n');
  } else if (m1Agents.length === 1) {
    console.log('✅ Only ONE M1 agent found');
    console.log('   Not a duplicate issue\n');
  } else {
    console.log('❌ NO M1 agents found!');
    console.log('   This is a problem\n');
  }
  
  // Check shares for each M1 agent
  console.log('📊 Checking shares for each M1 agent:\n');
  
  for (const agent of m1Agents) {
    const shares = await db.collection('agent_shares')
      .where('agentId', '==', agent.id)
      .get();
    
    const shareCount = shares.size > 0 ? shares.docs[0].data().sharedWith?.length || 0 : 0;
    
    console.log(`Agent: ${agent.title}`);
    console.log(`  ID: ${agent.id}`);
    console.log(`  Shares: ${shareCount} users`);
    console.log(`  Expected: ${agent.id === EXPECTED_M1_ID ? 'YES ✅' : 'NO'}`);
    console.log();
  }
  
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});

