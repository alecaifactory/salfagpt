#!/usr/bin/env tsx
/**
 * List all organizations in the database
 */

import { firestore, COLLECTIONS } from '../src/lib/firestore.js';

async function main() {
  console.log('📋 All Organizations in Database\n');
  console.log('='.repeat(80));
  
  const snapshot = await firestore
    .collection(COLLECTIONS.ORGANIZATIONS)
    .get();
  
  console.log(`Total: ${snapshot.size} organizations\n`);
  
  const orgs = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
  
  // Sort by domain name
  orgs.sort((a, b) => a.id.localeCompare(b.id));
  
  orgs.forEach((org, idx) => {
    console.log(`${idx + 1}. ${org.id}`);
    console.log(`   Name: ${org.name || 'N/A'}`);
    console.log(`   Enabled: ${org.isEnabled === true ? '✅ YES' : '❌ NO'}`);
    console.log(`   Created: ${org.createdAt?.toDate?.() || 'unknown'}`);
    console.log(`   Created By: ${org.createdBy || 'unknown'}`);
    console.log();
  });
  
  console.log('='.repeat(80));
  
  process.exit(0);
}

main();



