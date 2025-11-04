#!/usr/bin/env tsx
/**
 * Check domain status
 */

import { firestore, COLLECTIONS } from '../src/lib/firestore.js';

const TARGET_EMAIL = process.env.TARGET_EMAIL || 'dortega@novatec.cl';

async function main() {
  const domain = TARGET_EMAIL.split('@')[1];
  console.log(`🔍 Checking domain: ${domain}\n`);
  
  const domainDoc = await firestore
    .collection(COLLECTIONS.ORGANIZATIONS)
    .doc(domain)
    .get();
  
  if (!domainDoc.exists) {
    console.log('❌ Domain NOT configured in organizations collection');
    console.log('   User will get 403 Forbidden errors');
    console.log(`\n💡 Solution: Create organization document for ${domain}`);
  } else {
    const domainData = domainDoc.data();
    console.log('✅ Domain found:');
    console.log(`   Name: ${domainData?.name || domain}`);
    console.log(`   Enabled: ${domainData?.isEnabled === true ? '✅ YES' : '❌ NO'}`);
    console.log(`   Created: ${domainData?.createdAt?.toDate?.() || 'unknown'}`);
    
    if (!domainData?.isEnabled) {
      console.log(`\n⚠️  Domain is DISABLED - user will get 403 errors`);
      console.log(`💡 Solution: Enable domain by setting isEnabled: true`);
    }
  }
  
  process.exit(0);
}

main();

