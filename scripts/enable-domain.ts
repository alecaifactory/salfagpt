#!/usr/bin/env tsx
/**
 * Enable a domain in organizations collection
 */

import { firestore, COLLECTIONS } from '../src/lib/firestore.js';

const TARGET_DOMAIN = process.env.TARGET_DOMAIN || 'novatec.cl';
const DOMAIN_NAME = process.env.DOMAIN_NAME || 'Novatec';

async function main() {
  console.log(`🔧 Enabling domain: ${TARGET_DOMAIN}\n`);
  
  const domainRef = firestore
    .collection(COLLECTIONS.ORGANIZATIONS)
    .doc(TARGET_DOMAIN);
  
  const domainDoc = await domainRef.get();
  
  if (domainDoc.exists) {
    const data = domainDoc.data();
    console.log('⚠️  Domain already exists');
    console.log(`   Name: ${data?.name}`);
    console.log(`   Enabled: ${data?.isEnabled}`);
    
    if (!data?.isEnabled) {
      console.log('\n🔄 Enabling domain...');
      await domainRef.update({
        isEnabled: true,
        updatedAt: new Date(),
      });
      console.log('✅ Domain enabled!');
    } else {
      console.log('✅ Domain is already enabled');
    }
  } else {
    console.log('🆕 Creating new domain configuration...');
    
    await domainRef.set({
      id: TARGET_DOMAIN,
      name: DOMAIN_NAME,
      domain: TARGET_DOMAIN,
      isEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'admin-script',
      settings: {
        allowUserSignup: true,
        requireAdminApproval: false,
        maxAgentsPerUser: 50,
        maxContextSourcesPerUser: 100,
      },
      features: {
        aiChat: true,
        contextManagement: true,
        agentSharing: true,
        analytics: true,
      },
    });
    
    console.log('✅ Domain created and enabled!');
  }
  
  console.log(`\n📝 Users from ${TARGET_DOMAIN} can now access the platform`);
  
  process.exit(0);
}

main();



