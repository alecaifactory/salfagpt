#!/usr/bin/env tsx
/**
 * Analyze Agent Access by User, Organization, and Domain
 * 
 * This script queries Firestore to get all agents (conversations) with their
 * creators, shared users, domains, and access details.
 */

import { firestore } from '../src/lib/firestore.js';

interface AgentAccess {
  id: string;
  title: string;
  createdBy: string;
  creatorEmail: string;
  creatorName: string;
  creatorRole: string;
  domain: string;
  organizationId?: string;
  sharedWith: Array<{
    type: string;
    id: string;
    email: string;
  }>;
  createdAt: Date;
}

async function analyzeAgentAccess() {
  console.log('🔍 Analyzing Agent Access by User, Organization, and Domain\n');
  console.log('='.repeat(80));
  
  try {
    // Get all conversations (agents)
    console.log('📥 Loading agents from Firestore...');
    const conversationsSnapshot = await firestore
      .collection('conversations')
      .orderBy('createdAt', 'desc')
      .get();
    
    // Get all users
    console.log('👥 Loading users from Firestore...');
    const usersSnapshot = await firestore
      .collection('users')
      .get();
    
    const users = new Map();
    usersSnapshot.docs.forEach(doc => {
      const data = doc.data();
      users.set(doc.id, {
        id: doc.id,
        email: data.email,
        name: data.name,
        role: data.role
      });
    });
    
    console.log(`\n📊 Total Agents Found: ${conversationsSnapshot.size}`);
    console.log(`👥 Total Users Found: ${users.size}\n`);
    
    // Group agents by title for analysis
    const agentsByTitle = new Map<string, AgentAccess[]>();
    
    conversationsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const title = data.title || 'Untitled';
      const userId = data.userId;
      const sharedWith = data.sharedWith || [];
      
      const user = users.get(userId);
      const domain = user?.email ? user.email.split('@')[1] : 'unknown';
      
      if (!agentsByTitle.has(title)) {
        agentsByTitle.set(title, []);
      }
      
      agentsByTitle.get(title)!.push({
        id: doc.id,
        title,
        createdBy: userId,
        creatorEmail: user?.email || 'Unknown',
        creatorName: user?.name || 'Unknown',
        creatorRole: user?.role || 'Unknown',
        domain,
        organizationId: data.organizationId,
        sharedWith: sharedWith.map((share: any) => ({
          type: share.type,
          id: share.id,
          email: share.email || share.domain || share.id
        })),
        createdAt: data.createdAt?.toDate() || new Date()
      });
    });
    
    // Print detailed agent access info
    console.log('\n📋 AGENT ACCESS DETAILS BY AGENT TYPE\n');
    console.log('='.repeat(80));
    
    const expectedAgents = [
      'Asistente Legal Territorial RDI (M1-v2)',
      'GOP GPT (M3-v2)',
      'Gestion Bodegas (S1-v2)',
      'Maqsa Mantenimiento (S2-v2)'
    ];
    
    for (const expectedTitle of expectedAgents) {
      const agents = agentsByTitle.get(expectedTitle) || [];
      
      console.log(`\n🤖 Agent: ${expectedTitle}`);
      console.log(`   Total instances: ${agents.length}`);
      
      if (agents.length === 0) {
        console.log('   ⚠️  WARNING: No instances found in database!\n');
        continue;
      }
      
      agents.forEach((agent, idx) => {
        console.log(`\n   Instance #${idx + 1}:`);
        console.log(`   - Created by: ${agent.creatorName} (${agent.creatorEmail})`);
        console.log(`   - Domain: ${agent.domain}`);
        console.log(`   - Role: ${agent.creatorRole}`);
        console.log(`   - Created: ${agent.createdAt.toLocaleDateString()}`);
        
        if (agent.organizationId) {
          console.log(`   - Organization: ${agent.organizationId}`);
        }
        
        if (agent.sharedWith && agent.sharedWith.length > 0) {
          console.log(`   - Shared with (${agent.sharedWith.length}):`);
          agent.sharedWith.forEach(share => {
            console.log(`     • Type: ${share.type}, Email/Domain: ${share.email}`);
          });
        } else {
          console.log(`   - Shared with: None (private)`);
        }
      });
      
      console.log('');
    }
    
    // Summary by domain
    console.log('\n📊 SUMMARY BY DOMAIN\n');
    console.log('='.repeat(80));
    
    const domainStats = new Map<string, { count: number; users: Set<string>; agents: Set<string> }>();
    conversationsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const user = users.get(data.userId);
      const domain = user?.email ? user.email.split('@')[1] : 'unknown';
      const title = data.title || 'Untitled';
      
      if (!domainStats.has(domain)) {
        domainStats.set(domain, { count: 0, users: new Set(), agents: new Set() });
      }
      
      const stats = domainStats.get(domain)!;
      stats.count++;
      stats.users.add(user?.email || 'Unknown');
      stats.agents.add(title);
    });
    
    for (const [domain, stats] of domainStats.entries()) {
      console.log(`\n🌐 Domain: ${domain}`);
      console.log(`   - Agents created: ${stats.count}`);
      console.log(`   - Unique users: ${stats.users.size}`);
      console.log(`   - Agent types: ${stats.agents.size}`);
      console.log(`   - Users: ${Array.from(stats.users).slice(0, 5).join(', ')}${stats.users.size > 5 ? '...' : ''}`);
    }
    
    // Export CSV for comparison
    console.log('\n\n📋 EXPORT FOR COMPARISON (CSV FORMAT)\n');
    console.log('='.repeat(80));
    console.log('Email\tName\tDomain\tRole\tAgent\tAccess Type\tOrganization');
    console.log('-'.repeat(80));
    
    // Build assignment list
    const assignments: any[] = [];
    
    for (const [title, agents] of agentsByTitle.entries()) {
      agents.forEach(agent => {
        // Creator
        assignments.push({
          email: agent.creatorEmail,
          name: agent.creatorName,
          domain: agent.domain,
          role: agent.creatorRole,
          agent: title,
          accessType: 'Created',
          organization: agent.organizationId || '-'
        });
        
        // Shared users
        agent.sharedWith.forEach(share => {
          if (share.type === 'user') {
            const sharedUser = Array.from(users.values()).find(u => u.email === share.email);
            assignments.push({
              email: share.email,
              name: sharedUser?.name || '-',
              domain: share.email.split('@')[1] || '-',
              role: sharedUser?.role || '-',
              agent: title,
              accessType: 'Shared',
              organization: agent.organizationId || '-'
            });
          } else if (share.type === 'domain') {
            assignments.push({
              email: `All @${share.email}`,
              name: 'Domain-wide',
              domain: share.email,
              role: '-',
              agent: title,
              accessType: 'Shared (Domain)',
              organization: agent.organizationId || '-'
            });
          }
        });
      });
    }
    
    // Sort by email then agent
    assignments.sort((a, b) => {
      if (a.email !== b.email) return a.email.localeCompare(b.email);
      return a.agent.localeCompare(b.agent);
    });
    
    assignments.forEach(a => {
      console.log(`${a.email}\t${a.name}\t${a.domain}\t${a.role}\t${a.agent}\t${a.accessType}\t${a.organization}`);
    });
    
    console.log('\n✅ Analysis complete!\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the analysis
analyzeAgentAccess()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });



