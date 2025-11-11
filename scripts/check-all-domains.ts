#!/usr/bin/env tsx

/**
 * Check All Email Domains in Database
 * 
 * Lists all email domains and user counts
 * Identifies which domains should be assigned to Salfa Corp
 * 
 * Usage: npx tsx scripts/check-all-domains.ts
 */

import { firestore } from '../src/lib/firestore.js';

async function checkDomains() {
  console.log('🔍 Analyzing all email domains in database...');
  console.log('');

  const users = await firestore.collection('users').get();

  console.log('📊 Total users:', users.size);
  console.log('');

  const domainMap = new Map<string, number>();
  const usersByDomain = new Map<string, any[]>();

  users.docs.forEach(doc => {
    const data = doc.data();
    const email = data.email;
    if (!email) return;
    
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return;
    
    domainMap.set(domain, (domainMap.get(domain) || 0) + 1);
    
    if (!usersByDomain.has(domain)) {
      usersByDomain.set(domain, []);
    }
    usersByDomain.get(domain)!.push({
      email: email,
      role: data.role || 'user',
      name: data.name || 'Unknown'
    });
  });

  console.log('📋 Domains found (sorted by user count):');
  console.log('');

  const sortedDomains = Array.from(domainMap.entries())
    .sort((a, b) => b[1] - a[1]);

  sortedDomains.forEach(([domain, count]) => {
    const exclude = domain === 'getaifactory.com' || domain === 'gmail.com';
    const marker = exclude ? '❌ EXCLUDE' : '✅ INCLUDE';
    console.log(`  ${marker} ${domain}: ${count} users`);
    
    if (!exclude) {
      const users = usersByDomain.get(domain) || [];
      users.slice(0, 3).forEach(u => {
        console.log(`      - ${u.email} (${u.role})`);
      });
      if (users.length > 3) {
        console.log(`      ... and ${users.length - 3} more`);
      }
    }
    console.log('');
  });

  console.log('════════════════════════════════════════════════════');
  console.log('SUMMARY FOR SALFA CORP MIGRATION:');
  console.log('════════════════════════════════════════════════════');
  console.log('');

  const salfaDomains = sortedDomains
    .filter(([domain]) => domain !== 'getaifactory.com' && domain !== 'gmail.com')
    .map(([domain]) => domain);

  const salfaUserCount = sortedDomains
    .filter(([domain]) => domain !== 'getaifactory.com' && domain !== 'gmail.com')
    .reduce((sum, [, count]) => sum + count, 0);

  console.log('Domains to include in Salfa Corp:');
  salfaDomains.forEach(d => console.log(`  - ${d}`));
  console.log('');
  console.log(`Total Salfa users: ${salfaUserCount}`);
  console.log('');
  console.log('Migration command (DRY RUN):');
  console.log(`npm run migrate:multi-org:dry-run -- --org=salfa-corp --domains=${salfaDomains.join(',')}`);
  console.log('');
  console.log('Migration command (EXECUTE):');
  console.log(`npm run migrate:multi-org -- --org=salfa-corp --domains=${salfaDomains.join(',')} --env=production`);
  console.log('');

  process.exit(0);
}

checkDomains().catch(console.error);

