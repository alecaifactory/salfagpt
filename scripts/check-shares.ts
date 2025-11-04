#!/usr/bin/env tsx
/**
 * Check current agent shares
 */

import { firestore, COLLECTIONS } from '../src/lib/firestore.js';

async function main() {
  console.log('🔍 Checking agent_shares collection...\n');
  
  const sharesSnapshot = await firestore
    .collection(COLLECTIONS.AGENT_SHARES)
    .get();
  
  console.log(`Total shares: ${sharesSnapshot.size}\n`);
  
  for (const doc of sharesSnapshot.docs) {
    const data = doc.data();
    console.log(`Share ID: ${doc.id}`);
    console.log(`  Agent: ${data.agentId}`);
    console.log(`  Owner: ${data.ownerId}`);
    console.log(`  Access Level: ${data.accessLevel}`);
    console.log(`  Shared With:`, JSON.stringify(data.sharedWith, null, 2));
    console.log('');
  }
  
  process.exit(0);
}

main();

