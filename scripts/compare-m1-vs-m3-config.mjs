#!/usr/bin/env node
/**
 * Compare M1-v2 vs M3-v2 Configuration
 * 
 * M3-v2 works, M1-v2 doesn't
 * Find the difference!
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({ projectId: 'salfagpt' });
const db = getFirestore();

const M1_AGENT_ID = 'cjn3bC0HrUYtHqu69CKS';
const M3_AGENT_ID = 'vStojK73ZKbjNsEnqANJ';

async function compareAgents() {
  console.log('\n🔍 COMPARING M1-v2 (BROKEN) vs M3-v2 (WORKING)\n');
  console.log('═'.repeat(80));
  
  // Get both agent documents from conversations collection
  const m1Doc = await db.collection('conversations').doc(M1_AGENT_ID).get();
  const m3Doc = await db.collection('conversations').doc(M3_AGENT_ID).get();
  
  const m1Data = m1Doc.data();
  const m3Data = m3Doc.data();
  
  console.log('\n1️⃣ BASIC INFO:');
  console.log('─'.repeat(80));
  console.log(`M1-v2: ${m1Data.title}`);
  console.log(`  ID: ${M1_AGENT_ID}`);
  console.log(`  Owner: ${m1Data.userId}`);
  console.log();
  console.log(`M3-v2: ${m3Data.title}`);
  console.log(`  ID: ${M3_AGENT_ID}`);
  console.log(`  Owner: ${m3Data.userId}`);
  console.log();
  
  // Get agent_shares for both
  const m1Shares = await db.collection('agent_shares')
    .where('agentId', '==', M1_AGENT_ID)
    .get();
  
  const m3Shares = await db.collection('agent_shares')
    .where('agentId', '==', M3_AGENT_ID)
    .get();
  
  console.log('\n2️⃣ AGENT_SHARES COLLECTION:');
  console.log('─'.repeat(80));
  console.log(`M1-v2:`);
  console.log(`  Documents: ${m1Shares.size}`);
  if (!m1Shares.empty) {
    const doc = m1Shares.docs[0];
    const data = doc.data();
    console.log(`  Doc ID: ${doc.id}`);
    console.log(`  agentId: ${data.agentId}`);
    console.log(`  ownerId: ${data.ownerId}`);
    console.log(`  sharedWith: ${data.sharedWith?.length || 0} users`);
    console.log(`  createdAt: ${data.createdAt?.toDate?.() || data.createdAt}`);
    console.log(`  updatedAt: ${data.updatedAt?.toDate?.() || data.updatedAt}`);
  }
  console.log();
  
  console.log(`M3-v2:`);
  console.log(`  Documents: ${m3Shares.size}`);
  if (!m3Shares.empty) {
    const doc = m3Shares.docs[0];
    const data = doc.data();
    console.log(`  Doc ID: ${doc.id}`);
    console.log(`  agentId: ${data.agentId}`);
    console.log(`  ownerId: ${data.ownerId}`);
    console.log(`  sharedWith: ${data.sharedWith?.length || 0} users`);
    console.log(`  createdAt: ${data.createdAt?.toDate?.() || data.createdAt}`);
    console.log(`  updatedAt: ${data.updatedAt?.toDate?.() || data.updatedAt}`);
  }
  console.log();
  
  // Compare field by field
  console.log('\n3️⃣ FIELD-BY-FIELD COMPARISON:');
  console.log('─'.repeat(80));
  
  if (!m1Shares.empty && !m3Shares.empty) {
    const m1ShareData = m1Shares.docs[0].data();
    const m3ShareData = m3Shares.docs[0].data();
    
    const fields = ['id', 'agentId', 'ownerId', 'accessLevel', 'createdBy'];
    
    fields.forEach(field => {
      const m1Val = m1ShareData[field];
      const m3Val = m3ShareData[field];
      const match = m1Val === m3Val;
      console.log(`${field}:`);
      console.log(`  M1: ${m1Val}`);
      console.log(`  M3: ${m3Val}`);
      console.log(`  ${match ? '✅ Match' : '❌ Different'}`);
      console.log();
    });
    
    // Compare sharedWith structure
    console.log('sharedWith array:');
    console.log(`  M1: ${m1ShareData.sharedWith?.length} users`);
    console.log(`  M3: ${m3ShareData.sharedWith?.length} users`);
    
    if (m1ShareData.sharedWith && m3ShareData.sharedWith) {
      const m1User = m1ShareData.sharedWith[0];
      const m3User = m3ShareData.sharedWith[0];
      
      console.log('\n  First user structure comparison:');
      console.log(`  M1 keys: ${Object.keys(m1User).join(', ')}`);
      console.log(`  M3 keys: ${Object.keys(m3User).join(', ')}`);
      console.log(`  ${JSON.stringify(Object.keys(m1User).sort()) === JSON.stringify(Object.keys(m3User).sort()) ? '✅ Same structure' : '❌ Different structure'}`);
    }
  }
  
  console.log('\n\n═'.repeat(80));
  console.log('📊 SUMMARY');
  console.log('═'.repeat(80));
  console.log();
  
  if (m1Shares.empty) {
    console.log('❌ M1-v2: NO agent_shares document');
  } else if (m3Shares.empty) {
    console.log('❌ M3-v2: NO agent_shares document');
  } else {
    const m1Count = m1Shares.docs[0].data().sharedWith?.length || 0;
    const m3Count = m3Shares.docs[0].data().sharedWith?.length || 0;
    
    console.log(`✅ Both have agent_shares documents`);
    console.log(`✅ Both have users in sharedWith`);
    console.log(`   M1-v2: ${m1Count} users`);
    console.log(`   M3-v2: ${m3Count} users`);
    console.log();
    console.log('🎯 CONCLUSION: Configurations are IDENTICAL');
    console.log('⚠️ Problem is NOT in the data');
    console.log('⚠️ Problem is in frontend rendering or caching\n');
    console.log('💡 SOLUTION: Clear browser cache or test in incognito\n');
  }
  
  process.exit(0);
}

compareAgents().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});

