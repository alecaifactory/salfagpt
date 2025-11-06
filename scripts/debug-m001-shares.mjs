#!/usr/bin/env node

import { Firestore } from '@google-cloud/firestore';

const firestore = new Firestore({
  projectId: 'salfagpt',
});

const AGENT_ID = 'cjn3bC0HrUYtHqu69CKS';

async function debugShares() {
  console.log('🔍 Debugging Agent Shares for M001');
  console.log('===================================\n');

  // Query 1: All shares for this agent (no status filter)
  console.log('1️⃣  Querying ALL shares (no status filter)...');
  const allSharesSnapshot = await firestore
    .collection('agent_shares')
    .where('agentId', '==', AGENT_ID)
    .get();

  console.log(`   Found ${allSharesSnapshot.size} total shares\n`);

  if (allSharesSnapshot.size > 0) {
    allSharesSnapshot.docs.forEach((doc, idx) => {
      const data = doc.data();
      console.log(`${idx + 1}. Share ID: ${doc.id}`);
      console.log(`   Status: ${data.status || 'NOT SET'}`);
      console.log(`   Access Level: ${data.accessLevel}`);
      console.log(`   Shared With: ${data.sharedWith?.length || 0} targets`);
      console.log(`   Created: ${data.createdAt?.toDate?.()?.toISOString() || 'Unknown'}`);
      
      if (data.sharedWith) {
        data.sharedWith.forEach((target, i) => {
          console.log(`      ${i + 1}. Type: ${target.type}, ID: ${target.id}`);
          if (target.email) console.log(`         Email: ${target.email}`);
        });
      }
      console.log();
    });
  }

  // Query 2: Active shares only
  console.log('2️⃣  Querying ACTIVE shares only...');
  const activeSharesSnapshot = await firestore
    .collection('agent_shares')
    .where('agentId', '==', AGENT_ID)
    .where('status', '==', 'active')
    .get();

  console.log(`   Found ${activeSharesSnapshot.size} active shares\n`);

  // Query 3: Check if status field exists
  console.log('3️⃣  Checking status field existence...');
  if (allSharesSnapshot.size > 0) {
    const firstDoc = allSharesSnapshot.docs[0];
    const data = firstDoc.data();
    console.log(`   Status field exists: ${data.hasOwnProperty('status')}`);
    console.log(`   Status value: ${data.status}`);
    console.log(`   All fields:`, Object.keys(data).join(', '));
  }
}

debugShares().catch(console.error);

