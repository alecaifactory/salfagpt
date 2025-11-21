#!/usr/bin/env tsx
/**
 * Seed LATAMLAB.AI Organization & Initial Domains
 * 
 * Creates:
 * 1. LATAMLAB.AI organization (Community Edition)
 * 2. Initial community groups (domains) for alec@getaifactory.com
 * 3. Sets Alec as admin of all groups
 * 
 * Usage:
 *   npx tsx scripts/seed-latamlab-org.ts
 * 
 * Created: 2025-11-18
 */

import { createOrganization, addDomainToOrganization } from '../src/lib/organizations.js';
import { createCommunityGroup } from '../src/lib/subscriptions.js';
import type { Industry } from '../src/types/subscriptions.js';

// Alec's user ID (from existing data)
const ALEC_USER_ID = '114671162830729001607';
const ALEC_EMAIL = 'alec@getaifactory.com';

// Initial domains for Alec
const INITIAL_GROUPS = [
  // Professional Communities
  { name: 'AI Factory', industry: 'AI' as Industry, description: 'AI Factory team and projects' },
  { name: 'LATAMLAB.AI', industry: 'AI' as Industry, description: 'LATAM AI Innovation Lab' },
  { name: 'El Club de la IA', industry: 'AI' as Industry, description: 'Spanish-speaking AI community' },
  { name: 'Reforge LATAM', industry: 'Growth' as Industry, description: 'Reforge alumni network for Latin America' },
  { name: 'PAME.AI', industry: 'AI' as Industry, description: 'PAME AI platform and community' },
  
  // Personal & Network
  { name: 'Alec', industry: 'Corporate' as Industry, description: 'Personal workspace' },
  { name: 'Dickinson', industry: 'Corporate' as Industry, description: 'Family workspace' },
  { name: 'alecdickinson', industry: 'Corporate' as Industry, description: 'Personal brand' },
  { name: 'alecdickinson.ai', industry: 'AI' as Industry, description: 'Personal AI projects' },
  
  // Communication & Broadcast
  { name: 'Announcements', industry: 'Corporate' as Industry, description: 'Official announcements' },
  { name: 'News', industry: 'Corporate' as Industry, description: 'News and updates' },
  { name: 'Broadcast', industry: 'Corporate' as Industry, description: 'Broadcast communications' },
  
  // Industries - Construction
  { name: 'Construction', industry: 'Construction' as Industry, description: 'Construction industry community' },
  { name: 'Mining', industry: 'Mining' as Industry, description: 'Mining industry community' },
  { name: 'Mobility', industry: 'Mobility' as Industry, description: 'Transportation and mobility' },
  
  // Industries - Finance
  { name: 'Banking', industry: 'Banking' as Industry, description: 'Banking and financial services' },
  { name: 'Finance', industry: 'Finance' as Industry, description: 'Finance professionals' },
  { name: 'Accounting', industry: 'Accounting' as Industry, description: 'Accounting and audit' },
  
  // Industries - Business
  { name: 'Retail', industry: 'Retail' as Industry, description: 'Retail and commerce' },
  { name: 'Agro', industry: 'Agro' as Industry, description: 'Agriculture and food' },
  { name: 'Corporate', industry: 'Corporate' as Industry, description: 'Corporate and enterprise' },
  { name: 'Legal', industry: 'Legal' as Industry, description: 'Legal professionals' },
  
  // Industries - Operations
  { name: 'Operations', industry: 'Operations' as Industry, description: 'Operations and logistics' },
  { name: 'Telecommunications', industry: 'Telecommunications' as Industry, description: 'Telecom industry' },
  { name: 'Sustainability', industry: 'Sustainability' as Industry, description: 'Sustainability and ESG' },
  
  // Industries - Technology
  { name: 'AI', industry: 'AI' as Industry, description: 'Artificial Intelligence' },
  { name: 'LLM', industry: 'LLM' as Industry, description: 'Large Language Models' },
  { name: 'Agents', industry: 'Agents' as Industry, description: 'AI Agents and automation' },
  
  // Industries - Business Functions
  { name: 'Marketing', industry: 'Marketing' as Industry, description: 'Marketing professionals' },
  { name: 'Growth', industry: 'Growth' as Industry, description: 'Growth and scaling' },
  { name: 'Management', industry: 'Management' as Industry, description: 'Management and leadership' },
  { name: 'Business', industry: 'Business' as Industry, description: 'General business' },
  
  // Single-letter domains (for quick access)
  { name: 'A', industry: 'Corporate' as Industry, description: 'Quick workspace A' },
  { name: 'B', industry: 'Corporate' as Industry, description: 'Quick workspace B' },
  { name: 'C', industry: 'Corporate' as Industry, description: 'Quick workspace C' },
  { name: 'X', industry: 'Corporate' as Industry, description: 'Quick workspace X' },
  { name: 'Y', industry: 'Corporate' as Industry, description: 'Quick workspace Y' },
  { name: 'Z', industry: 'Corporate' as Industry, description: 'Quick workspace Z' },
];

async function seedLATAMLABOrganization() {
  console.log('🌱 Seeding LATAMLAB.AI Organization');
  console.log('=====================================');
  console.log('');
  
  try {
    // Step 1: Create LATAMLAB.AI organization
    console.log('📦 Creating LATAMLAB.AI organization...');
    
    const organization = await createOrganization({
      name: 'LATAMLAB.AI',
      domains: ['latamlab.ai', 'getaifactory.com'],
      primaryDomain: 'latamlab.ai',
      ownerUserId: ALEC_USER_ID,
      tenant: {
        type: 'saas',
        gcpProjectId: 'salfagpt',
        region: 'us-east4',
      },
      branding: {
        primaryColor: '#0066CC',
        brandName: 'LATAMLAB.AI',
      },
      evaluationConfig: {
        enabled: false, // Community edition doesn't use evaluation
        globalSettings: {
          priorityStarThreshold: 4,
          autoFlagInaceptable: true,
          requireSupervisorApproval: false,
        },
        domainConfigs: {},
      },
      privacy: {
        dataResidency: 'us-east4',
        encryptionEnabled: false,
        dataRetentionDays: 365,
      },
      limits: {
        maxUsers: 10000,
        maxAgents: 100,
        maxStorageGB: 10,
        maxMonthlyTokens: 10_000_000,
      },
    });
    
    console.log('✅ Organization created:', organization.id);
    console.log('');
    
    // Step 2: Create community groups
    console.log(`📚 Creating ${INITIAL_GROUPS.length} community groups...`);
    console.log('');
    
    let successCount = 0;
    let failCount = 0;
    
    for (const group of INITIAL_GROUPS) {
      try {
        const created = await createCommunityGroup(
          group.name,
          ALEC_USER_ID,
          ALEC_EMAIL,
          {
            description: group.description,
            industry: group.industry,
            inviteOnly: false,
          }
        );
        
        console.log(`  ✅ ${group.name.padEnd(25)} (${group.industry}) → ${created.domain}`);
        successCount++;
        
        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`  ❌ ${group.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        failCount++;
      }
    }
    
    console.log('');
    console.log('=====================================');
    console.log('🎉 Seeding Complete!');
    console.log('');
    console.log(`✅ Success: ${successCount} groups created`);
    if (failCount > 0) {
      console.log(`❌ Failed: ${failCount} groups`);
    }
    console.log('');
    console.log('👤 Alec is now admin of:');
    console.log(`   - Organization: LATAMLAB.AI`);
    console.log(`   - ${successCount} community groups`);
    console.log('');
    console.log('🚀 Next steps:');
    console.log('   1. Users can join groups by selecting from list');
    console.log('   2. Users can create new groups (become admin)');
    console.log('   3. Admins can invite others to their groups');
    console.log('   4. Everyone gets 14-day free trial + $20/month');
    console.log('');
    
  } catch (error) {
    console.error('');
    console.error('❌ Fatal error during seeding:', error);
    console.error('');
    process.exit(1);
  }
}

// Run seeding
seedLATAMLABOrganization()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });


