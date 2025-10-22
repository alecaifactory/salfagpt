#!/usr/bin/env node
/**
 * Verify Domains Script
 * 
 * Lists all domains in Firestore and their status
 */

import { Firestore } from '@google-cloud/firestore';

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'gen-lang-client-0986191192';
const firestore = new Firestore({
  projectId: PROJECT_ID,
});

async function verifyDomains() {
  console.log('🔍 Verifying Domains in Firestore');
  console.log('==================================');
  console.log('📦 Project:', PROJECT_ID);
  console.log('');

  try {
    const snapshot = await firestore
      .collection('domains')
      .orderBy('createdAt', 'desc')
      .get();

    if (snapshot.empty) {
      console.log('⚠️  No domains found in Firestore');
      console.log('');
      return;
    }

    console.log(`✅ Found ${snapshot.size} domain(s):`);
    console.log('');

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const enabled = data.enabled ?? true;
      const statusIcon = enabled ? '✅' : '❌';
      
      console.log(`${statusIcon} ${doc.id}`);
      console.log(`   Name: ${data.name || 'N/A'}`);
      console.log(`   Status: ${enabled ? 'ENABLED' : 'DISABLED'}`);
      console.log(`   Created by: ${data.createdBy || 'N/A'}`);
      console.log(`   Created at: ${data.createdAt?.toDate?.()?.toISOString() || 'N/A'}`);
      console.log(`   Users: ${data.userCount || 0}`);
      console.log(`   Agents: ${data.allowedAgents?.length || 0}`);
      console.log(`   Context: ${data.allowedContextSources?.length || 0}`);
      if (data.description) {
        console.log(`   Description: ${data.description}`);
      }
      console.log('');
    });

    // Summary
    const enabledCount = snapshot.docs.filter(doc => doc.data().enabled ?? true).length;
    const disabledCount = snapshot.docs.filter(doc => !(doc.data().enabled ?? true)).length;

    console.log('📊 Summary:');
    console.log(`   Total: ${snapshot.size}`);
    console.log(`   Enabled: ${enabledCount}`);
    console.log(`   Disabled: ${disabledCount}`);
    console.log('');

    console.log('🎯 Security Impact:');
    console.log('   • Users from enabled domains CAN login ✅');
    console.log('   • Users from disabled domains CANNOT login ❌');
    console.log('   • Users without a domain entry CANNOT login ❌');
    console.log('');

  } catch (error) {
    console.error('❌ Error fetching domains:', error);
    console.error('');
    console.error('💡 Troubleshooting:');
    console.error('   1. Verify authentication: gcloud auth application-default login');
    console.error('   2. Verify project: gcloud config get-value project');
    console.error('   3. Check Firestore permissions');
    process.exit(1);
  }
}

verifyDomains()
  .then(() => {
    console.log('✅ Verification complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  });

