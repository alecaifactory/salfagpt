#!/usr/bin/env tsx

/**
 * Check All Configured Domains
 * 
 * Checks both:
 * - Email domains from users
 * - Configured domains in domains collection
 * 
 * Combines both to get complete domain list for Salfa Corp
 */

import { firestore } from '../src/lib/firestore.js';

async function checkConfiguredDomains() {
  console.log('🔍 Checking all configured and active domains...');
  console.log('');
  
  // Check domains collection
  const domainsSnapshot = await firestore.collection('domains').get();
  
  console.log('📊 Configured domains collection:', domainsSnapshot.size);
  console.log('');
  
  const configuredDomains = new Set<string>();
  
  if (!domainsSnapshot.empty) {
    console.log('📋 Configured domains:');
    console.log('');
    
    domainsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const domainId = doc.id;
      const domainName = data.name || data.domain || domainId;
      const isActive = data.isActive !== false;
      
      const exclude = domainName.includes('getaifactory.com') || domainName.includes('gmail.com');
      const marker = exclude ? '❌ EXCLUDE' : '✅ INCLUDE';
      const status = isActive ? '🟢 Active' : '🔴 Inactive';
      
      console.log(`  ${marker} ${status} ${domainName}`);
      console.log(`      ID: ${domainId}`);
      
      if (!exclude && isActive) {
        configuredDomains.add(domainName.toLowerCase());
      }
      console.log('');
    });
  }
  
  // Check email domains from users
  console.log('📧 Checking email domains from users...');
  console.log('');
  
  const users = await firestore.collection('users').get();
  const emailDomains = new Set<string>();
  const domainUserCount = new Map<string, number>();
  
  users.docs.forEach(doc => {
    const email = doc.data().email;
    if (!email) return;
    
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return;
    
    const exclude = domain === 'getaifactory.com' || domain === 'gmail.com';
    if (!exclude) {
      emailDomains.add(domain);
      domainUserCount.set(domain, (domainUserCount.get(domain) || 0) + 1);
    }
  });
  
  console.log('Email domains with users:');
  Array.from(domainUserCount.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([domain, count]) => {
      console.log(`  ✅ ${domain}: ${count} users`);
    });
  console.log('');
  
  // Combine both sets
  const allSalfaDomains = new Set([...configuredDomains, ...emailDomains]);
  
  console.log('════════════════════════════════════════════════════');
  console.log('COMPLETE SALFA CORP DOMAIN LIST:');
  console.log('════════════════════════════════════════════════════');
  console.log('');
  
  const sortedDomains = Array.from(allSalfaDomains).sort();
  
  console.log('All Salfa domains (configured + active):');
  sortedDomains.forEach(d => {
    const userCount = domainUserCount.get(d) || 0;
    const isConfigured = configuredDomains.has(d);
    const source = isConfigured ? '(configured)' : '(from users)';
    console.log(`  - ${d} ${source} - ${userCount} users`);
  });
  console.log('');
  console.log(`Total domains: ${sortedDomains.length}`);
  console.log(`Total users: ${Array.from(domainUserCount.values()).reduce((sum, count) => sum + count, 0)}`);
  console.log('');
  
  console.log('MIGRATION COMMAND (DRY RUN):');
  console.log(`npm run migrate:multi-org:dry-run -- --org=salfa-corp --domains=${sortedDomains.join(',')}`);
  console.log('');
  
  console.log('MIGRATION COMMAND (EXECUTE):');
  console.log(`npm run migrate:multi-org -- --org=salfa-corp --domains=${sortedDomains.join(',')} --env=production`);
  console.log('');
  
  process.exit(0);
}

checkConfiguredDomains().catch(console.error);

