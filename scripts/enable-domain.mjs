#!/usr/bin/env node
/**
 * Enable Domain Script
 * 
 * Creates and enables a domain in Firestore
 * Usage: node scripts/enable-domain.mjs <domain> <admin-email>
 * Example: node scripts/enable-domain.mjs getaifactory.com alec@getaifactory.com
 */

import { Firestore } from '@google-cloud/firestore';

// Initialize Firestore
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'gen-lang-client-0986191192';
const firestore = new Firestore({
  projectId: PROJECT_ID,
});

async function enableDomain(domainId, createdBy) {
  console.log('🔧 Enabling domain:', domainId);
  console.log('👤 Created by:', createdBy);
  console.log('📦 Project:', PROJECT_ID);
  console.log('');

  try {
    // Check if domain already exists
    const domainDoc = await firestore.collection('domains').doc(domainId).get();
    
    if (domainDoc.exists) {
      const existingData = domainDoc.data();
      console.log('ℹ️  Domain already exists');
      console.log('   Current status:', existingData.enabled ? '✅ Enabled' : '❌ Disabled');
      
      if (existingData.enabled) {
        console.log('');
        console.log('✅ Domain is already enabled. No action needed.');
        return;
      }
      
      // Update to enabled
      await firestore.collection('domains').doc(domainId).update({
        enabled: true,
        updatedAt: new Date(),
      });
      
      console.log('');
      console.log('✅ Domain enabled successfully!');
      console.log('   Domain:', domainId);
      console.log('   Status: ✅ Enabled');
      console.log('   Updated:', new Date().toISOString());
    } else {
      // Create new domain
      const domainData = {
        name: domainId,
        enabled: true,
        createdBy: createdBy,
        createdAt: new Date(),
        updatedAt: new Date(),
        allowedAgents: [],
        allowedContextSources: [],
        userCount: 0,
        description: `Domain created by script on ${new Date().toISOString()}`,
        settings: {},
      };
      
      await firestore.collection('domains').doc(domainId).set(domainData);
      
      console.log('');
      console.log('✅ Domain created and enabled successfully!');
      console.log('   Domain:', domainId);
      console.log('   Status: ✅ Enabled');
      console.log('   Created by:', createdBy);
      console.log('   Created at:', new Date().toISOString());
    }
    
    // Verify the change
    const verifyDoc = await firestore.collection('domains').doc(domainId).get();
    const verifyData = verifyDoc.data();
    
    console.log('');
    console.log('🔍 Verification:');
    console.log('   Exists:', verifyDoc.exists ? '✅' : '❌');
    console.log('   Enabled:', verifyData?.enabled ? '✅' : '❌');
    console.log('   Name:', verifyData?.name || 'N/A');
    console.log('   Created by:', verifyData?.createdBy || 'N/A');
    
    console.log('');
    console.log('🎯 Impact:');
    console.log('   • Users with @' + domainId + ' emails can now login');
    console.log('   • Existing sessions will pass domain verification');
    console.log('   • Domain visible in Domain Management panel');
    
  } catch (error) {
    console.error('');
    console.error('❌ Error enabling domain:', error);
    console.error('');
    console.error('💡 Troubleshooting:');
    console.error('   1. Verify authentication: gcloud auth application-default login');
    console.error('   2. Verify project: echo $GOOGLE_CLOUD_PROJECT');
    console.error('   3. Verify Firestore permissions');
    process.exit(1);
  }
}

// Main execution
const domainId = process.argv[2];
const createdBy = process.argv[3];

if (!domainId || !createdBy) {
  console.error('❌ Usage: node scripts/enable-domain.mjs <domain> <admin-email>');
  console.error('   Example: node scripts/enable-domain.mjs getaifactory.com alec@getaifactory.com');
  process.exit(1);
}

// Validate domain format (basic check)
if (!domainId.includes('.')) {
  console.error('❌ Invalid domain format. Should be like: example.com');
  process.exit(1);
}

// Validate email format (basic check)
if (!createdBy.includes('@') || !createdBy.includes('.')) {
  console.error('❌ Invalid email format. Should be like: admin@example.com');
  process.exit(1);
}

console.log('🚀 Starting domain enablement process...');
console.log('');

enableDomain(domainId, createdBy)
  .then(() => {
    console.log('');
    console.log('✅ Process completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Process failed:', error);
    process.exit(1);
  });

