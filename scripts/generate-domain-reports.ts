#!/usr/bin/env tsx
/**
 * Generate Domain Verification Reports
 * 1. Active domains table
 * 2. User-domain assignments table
 */

import { firestore, COLLECTIONS } from '../src/lib/firestore.js';

async function main() {
  console.log('📊 Domain Verification Reports\n');
  console.log('='.repeat(100));
  
  // Load all organizations
  const orgsSnapshot = await firestore
    .collection(COLLECTIONS.ORGANIZATIONS)
    .get();
  
  const organizations = orgsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
  
  // Load all users
  const usersSnapshot = await firestore
    .collection(COLLECTIONS.USERS)
    .get();
  
  const users = usersSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
  
  // ============================================================================
  // REPORT 1: Active Domains
  // ============================================================================
  console.log('\n📋 REPORT 1: ACTIVE DOMAINS\n');
  console.log('='.repeat(100));
  
  const activeDomains = organizations
    .filter(org => org.isEnabled === true)
    .sort((a, b) => a.id.localeCompare(b.id));
  
  console.log(`Total Active Domains: ${activeDomains.length}\n`);
  console.log('| # | Domain | Name | Created By | Created Date | Users Count |');
  console.log('|---|--------|------|------------|--------------|-------------|');
  
  activeDomains.forEach((org, idx) => {
    const domainUsers = users.filter(u => u.email?.split('@')[1] === org.id);
    const createdDate = org.createdAt?.toDate?.() || new Date();
    const formattedDate = createdDate.toLocaleDateString('en-US', { 
      month: '2-digit', 
      day: '2-digit', 
      year: 'numeric' 
    });
    
    console.log(`| ${idx + 1} | ${org.id} | ${org.name || 'N/A'} | ${org.createdBy || 'unknown'} | ${formattedDate} | ${domainUsers.length} |`);
  });
  
  // ============================================================================
  // REPORT 2: User-Domain Assignments
  // ============================================================================
  console.log('\n\n📋 REPORT 2: USER-DOMAIN ASSIGNMENTS\n');
  console.log('='.repeat(100));
  
  console.log(`Total Users: ${users.length}\n`);
  console.log('| # | Email | Name | Role | Domain | Domain Status |');
  console.log('|---|-------|------|------|--------|---------------|');
  
  users.sort((a, b) => {
    const domainA = a.email?.split('@')[1] || '';
    const domainB = b.email?.split('@')[1] || '';
    return domainA.localeCompare(domainB) || a.email.localeCompare(b.email);
  });
  
  users.forEach((user, idx) => {
    const domain = user.email?.split('@')[1] || 'unknown';
    const domainOrg = organizations.find(org => org.id === domain);
    const domainStatus = domainOrg?.isEnabled === true ? '✅ Active' : '❌ Not Active';
    
    console.log(`| ${idx + 1} | ${user.email} | ${user.name || 'N/A'} | ${user.role || 'user'} | ${domain} | ${domainStatus} |`);
  });
  
  // ============================================================================
  // REPORT 3: Domain Statistics
  // ============================================================================
  console.log('\n\n📋 REPORT 3: DOMAIN STATISTICS\n');
  console.log('='.repeat(100));
  
  const domainStats = new Map<string, { 
    count: number; 
    enabled: boolean; 
    users: string[];
    name: string;
  }>();
  
  users.forEach(user => {
    const domain = user.email?.split('@')[1];
    if (!domain) return;
    
    if (!domainStats.has(domain)) {
      const org = organizations.find(o => o.id === domain);
      domainStats.set(domain, {
        count: 0,
        enabled: org?.isEnabled === true,
        users: [],
        name: org?.name || domain,
      });
    }
    
    const stats = domainStats.get(domain)!;
    stats.count++;
    stats.users.push(user.email);
  });
  
  console.log('| Domain | Name | Status | User Count | Users |');
  console.log('|--------|------|--------|------------|-------|');
  
  Array.from(domainStats.entries())
    .sort((a, b) => b[1].count - a[1].count) // Sort by user count desc
    .forEach(([domain, stats]) => {
      const status = stats.enabled ? '✅ Active' : '❌ Inactive';
      const usersList = stats.users.slice(0, 3).join(', ') + (stats.users.length > 3 ? ` +${stats.users.length - 3} more` : '');
      console.log(`| ${domain} | ${stats.name} | ${status} | ${stats.count} | ${usersList} |`);
    });
  
  // ============================================================================
  // REPORT 4: Issues Found
  // ============================================================================
  console.log('\n\n📋 REPORT 4: POTENTIAL ISSUES\n');
  console.log('='.repeat(100));
  
  const usersWithoutActiveDomain = users.filter(user => {
    const domain = user.email?.split('@')[1];
    const org = organizations.find(o => o.id === domain);
    return !org || org.isEnabled !== true;
  });
  
  if (usersWithoutActiveDomain.length > 0) {
    console.log(`⚠️  Users with inactive/missing domains: ${usersWithoutActiveDomain.length}\n`);
    usersWithoutActiveDomain.forEach(user => {
      const domain = user.email?.split('@')[1];
      console.log(`   - ${user.email} (domain: ${domain})`);
    });
  } else {
    console.log('✅ No issues found - all users have active domains');
  }
  
  // Duplicate users check
  const emailCounts = new Map<string, number>();
  users.forEach(user => {
    const email = user.email?.toLowerCase();
    emailCounts.set(email, (emailCounts.get(email) || 0) + 1);
  });
  
  const duplicates = Array.from(emailCounts.entries()).filter(([_, count]) => count > 1);
  
  if (duplicates.length > 0) {
    console.log(`\n⚠️  Duplicate user emails found: ${duplicates.length}\n`);
    duplicates.forEach(([email, count]) => {
      console.log(`   - ${email} (${count} accounts)`);
    });
  }
  
  console.log('\n' + '='.repeat(100));
  
  process.exit(0);
}

main();








