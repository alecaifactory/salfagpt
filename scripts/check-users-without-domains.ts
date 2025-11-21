#!/usr/bin/env tsx
/**
 * Check for users whose domains are not configured
 */

import { firestore, COLLECTIONS } from '../src/lib/firestore.js';

async function main() {
  console.log('🔍 Checking for users with unconfigured domains...\n');
  console.log('='.repeat(80));
  
  // Step 1: Get all configured domains
  console.log('1️⃣  Loading configured domains...\n');
  const domainsSnapshot = await firestore
    .collection(COLLECTIONS.ORGANIZATIONS)
    .get();
  
  const configuredDomains = new Set(domainsSnapshot.docs.map(doc => doc.id));
  
  console.log(`✅ Found ${configuredDomains.size} configured domains:`);
  Array.from(configuredDomains).sort().forEach(domain => {
    const domainData = domainsSnapshot.docs.find(d => d.id === domain)?.data();
    const isEnabled = domainData?.isEnabled === true;
    console.log(`   ${isEnabled ? '✅' : '❌'} ${domain}`);
  });
  console.log();
  
  // Step 2: Get all users
  console.log('2️⃣  Loading all users...\n');
  const usersSnapshot = await firestore
    .collection(COLLECTIONS.USERS)
    .get();
  
  console.log(`✅ Found ${usersSnapshot.size} users\n`);
  
  // Step 3: Check each user's domain
  console.log('3️⃣  Checking user domains...\n');
  
  const usersWithoutDomain: Array<{
    email: string;
    domain: string;
    userId: string;
    name: string;
    role: string;
  }> = [];
  
  const usersWithDisabledDomain: Array<{
    email: string;
    domain: string;
    userId: string;
    name: string;
    role: string;
  }> = [];
  
  for (const userDoc of usersSnapshot.docs) {
    const userData = userDoc.data();
    const email = userData.email || '';
    const domain = email.split('@')[1];
    
    if (!domain) {
      console.log(`⚠️  User ${email} has invalid email format`);
      continue;
    }
    
    // Check if domain is configured
    if (!configuredDomains.has(domain)) {
      usersWithoutDomain.push({
        email,
        domain,
        userId: userDoc.id,
        name: userData.name || 'Unknown',
        role: userData.role || 'user',
      });
    } else {
      // Check if domain is enabled
      const domainData = domainsSnapshot.docs.find(d => d.id === domain)?.data();
      if (domainData?.isEnabled !== true) {
        usersWithDisabledDomain.push({
          email,
          domain,
          userId: userDoc.id,
          name: userData.name || 'Unknown',
          role: userData.role || 'user',
        });
      }
    }
  }
  
  // Report users without configured domains
  console.log('='.repeat(80));
  console.log('📊 RESULTS\n');
  
  if (usersWithoutDomain.length > 0) {
    console.log(`❌ Users with UNCONFIGURED domains: ${usersWithoutDomain.length}\n`);
    
    // Group by domain
    const byDomain = new Map<string, typeof usersWithoutDomain>();
    usersWithoutDomain.forEach(user => {
      if (!byDomain.has(user.domain)) {
        byDomain.set(user.domain, []);
      }
      byDomain.get(user.domain)!.push(user);
    });
    
    Array.from(byDomain.entries()).sort().forEach(([domain, users]) => {
      console.log(`   Domain: ${domain} (${users.length} users)`);
      users.forEach(user => {
        console.log(`      - ${user.email} (${user.name}) [${user.role}]`);
      });
      console.log();
    });
    
    console.log('💡 To fix, run:');
    console.log('   TARGET_DOMAIN=<domain> DOMAIN_NAME="Company Name" npx tsx scripts/enable-domain.ts\n');
  } else {
    console.log('✅ All users have configured domains\n');
  }
  
  if (usersWithDisabledDomain.length > 0) {
    console.log(`⚠️  Users with DISABLED domains: ${usersWithDisabledDomain.length}\n`);
    
    usersWithDisabledDomain.forEach(user => {
      console.log(`   - ${user.email} (domain: ${user.domain})`);
    });
    console.log('\n💡 These users will get 403 errors until their domain is enabled\n');
  } else {
    console.log('✅ No users with disabled domains\n');
  }
  
  // Summary
  console.log('='.repeat(80));
  console.log('📋 SUMMARY\n');
  console.log(`Total Users:              ${usersSnapshot.size}`);
  console.log(`Configured Domains:       ${configuredDomains.size}`);
  console.log(`Users without domain:     ${usersWithoutDomain.length}`);
  console.log(`Users with disabled domain: ${usersWithDisabledDomain.length}`);
  console.log('='.repeat(80));
  
  // Create fix script if needed
  if (usersWithoutDomain.length > 0) {
    console.log('\n📝 Missing domains to configure:');
    const missingDomains = Array.from(new Set(usersWithoutDomain.map(u => u.domain))).sort();
    missingDomains.forEach(domain => {
      const userCount = usersWithoutDomain.filter(u => u.domain === domain).length;
      console.log(`   ${domain} (${userCount} users)`);
    });
  }
  
  process.exit(usersWithoutDomain.length > 0 ? 1 : 0);
}

main();









