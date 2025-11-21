#!/usr/bin/env tsx
/**
 * Generate Detailed Reports
 * 1. Domains with active status
 * 2. Users with email, name, domain, own agents, shared agents, active status
 */

import { firestore, COLLECTIONS } from '../src/lib/firestore.js';

async function main() {
  console.log('📊 Generating Detailed Reports\n');
  console.log('='.repeat(120));
  
  // Load all data
  console.log('Loading data from Firestore...\n');
  
  const [domainsSnapshot, usersSnapshot, conversationsSnapshot, sharesSnapshot] = await Promise.all([
    firestore.collection(COLLECTIONS.ORGANIZATIONS).get(),
    firestore.collection(COLLECTIONS.USERS).get(),
    firestore.collection(COLLECTIONS.CONVERSATIONS).get(),
    firestore.collection(COLLECTIONS.AGENT_SHARES).get(),
  ]);

  const domains = domainsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Array<any>;

  const users = usersSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Array<any>;

  const conversations = conversationsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Array<any>;

  const shares = sharesSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Array<any>;

  // ============================================================================
  // TABLE 1: DOMAINS WITH ACTIVE STATUS
  // ============================================================================
  console.log('\n📋 TABLE 1: DOMAINS WITH ACTIVE STATUS\n');
  console.log('='.repeat(120));
  
  const sortedDomains = domains.sort((a, b) => {
    if (a.enabled !== b.enabled) return a.enabled ? -1 : 1;
    return a.id.localeCompare(b.id);
  });
  
  console.log('| # | Domain | Name | Status | Created By | Created Date | Users |');
  console.log('|---|--------|------|--------|------------|--------------|-------|');
  
  sortedDomains.forEach((domain, idx) => {
    const domainUsers = users.filter(u => 
      u.email?.split('@')[1]?.toLowerCase() === domain.id.toLowerCase()
    );
    const createdDate = domain.createdAt?.toDate?.() || new Date();
    const formattedDate = createdDate.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
    
    const status = domain.enabled === true ? '✅ Active' : '❌ Disabled';
    
    console.log(`| ${idx + 1} | ${domain.id} | ${domain.name || 'N/A'} | ${status} | ${domain.createdBy || 'unknown'} | ${formattedDate} | ${domainUsers.length} |`);
  });
  
  console.log('\n' + '='.repeat(120));
  console.log(`Total Domains: ${domains.length}`);
  console.log(`Active: ${domains.filter(d => d.enabled === true).length}`);
  console.log(`Disabled: ${domains.filter(d => d.enabled !== true).length}`);
  console.log('='.repeat(120));

  // ============================================================================
  // TABLE 2: USERS DETAILED
  // ============================================================================
  console.log('\n\n📋 TABLE 2: USERS WITH COMPLETE DETAILS\n');
  console.log('='.repeat(120));
  
  // Sort users by domain, then by email
  const sortedUsers = users.sort((a, b) => {
    const domainA = a.email?.split('@')[1] || '';
    const domainB = b.email?.split('@')[1] || '';
    const domainCompare = domainA.localeCompare(domainB);
    if (domainCompare !== 0) return domainCompare;
    return (a.email || '').localeCompare(b.email || '');
  });
  
  console.log('| # | Email | Name | Domain | Domain Status | Own Agents | Shared Agents | User Status |');
  console.log('|---|-------|------|--------|---------------|------------|---------------|-------------|');
  
  sortedUsers.forEach((user, idx) => {
    const domain = user.email?.split('@')[1] || 'unknown';
    const domainObj = domains.find(d => d.id.toLowerCase() === domain.toLowerCase());
    const domainStatus = domainObj?.enabled === true ? '✅ Active' : '❌ Inactive';
    
    // Count own agents (created by this user)
    const ownAgents = conversations.filter(c => c.userId === user.id);
    const ownAgentCount = ownAgents.length;
    
    // Count shared agents (shared with this user)
    const sharedAgentIds = new Set();
    shares.forEach(share => {
      const sharedWith = share.sharedWith || [];
      sharedWith.forEach((target: any) => {
        if (target.type === 'user') {
          if (target.id === user.id || target.email === user.email) {
            sharedAgentIds.add(share.agentId);
          }
        }
      });
    });
    const sharedAgentCount = sharedAgentIds.size;
    
    // User active status
    const userStatus = user.isActive !== false ? '✅ Active' : '❌ Inactive';
    
    console.log(`| ${idx + 1} | ${user.email} | ${user.name || 'N/A'} | ${domain} | ${domainStatus} | ${ownAgentCount} | ${sharedAgentCount} | ${userStatus} |`);
  });
  
  console.log('\n' + '='.repeat(120));
  console.log(`Total Users: ${users.length}`);
  console.log(`Active Users: ${users.filter(u => u.isActive !== false).length}`);
  console.log(`Inactive Users: ${users.filter(u => u.isActive === false).length}`);
  console.log('='.repeat(120));

  // ============================================================================
  // SUMMARY STATISTICS
  // ============================================================================
  console.log('\n\n📊 SUMMARY STATISTICS\n');
  console.log('='.repeat(120));
  
  // Domain stats
  const domainsWithUsers = domains.filter(d => {
    return users.some(u => u.email?.split('@')[1]?.toLowerCase() === d.id.toLowerCase());
  });
  
  console.log('Domains:');
  console.log(`  Total Configured: ${domains.length}`);
  console.log(`  Active: ${domains.filter(d => d.enabled === true).length}`);
  console.log(`  With Users: ${domainsWithUsers.length}`);
  console.log(`  Empty: ${domains.length - domainsWithUsers.length}`);
  
  console.log('\nUsers:');
  console.log(`  Total: ${users.length}`);
  console.log(`  Active: ${users.filter(u => u.isActive !== false).length}`);
  console.log(`  With Active Domains: ${users.filter(u => {
    const domain = u.email?.split('@')[1];
    const domainObj = domains.find(d => d.id.toLowerCase() === domain?.toLowerCase());
    return domainObj?.enabled === true;
  }).length}`);
  
  console.log('\nAgents:');
  console.log(`  Total Created: ${conversations.length}`);
  console.log(`  Total Shares: ${shares.length}`);
  
  const totalSharedAgents = new Set();
  shares.forEach(s => totalSharedAgents.add(s.agentId));
  console.log(`  Unique Shared Agents: ${totalSharedAgents.size}`);
  
  console.log('\n' + '='.repeat(120));
  
  process.exit(0);
}

main();









