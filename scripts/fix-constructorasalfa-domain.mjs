#!/usr/bin/env node
/**
 * Fix constructorasalfa.cl Domain Configuration
 * 
 * 1. Delete constructorasalfa.cl organization (wrong - it's a domain, not an org)
 * 2. Add constructorasalfa.cl to salfa-corp organization's domains array
 * 3. Assign user fcerda@constructorasalfa.cl to salfa-corp
 * 
 * Date: 2025-11-13
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
const app = initializeApp({
  projectId: 'salfagpt'
});

const firestore = getFirestore(app);

async function fixConstructoraSalfa() {
  console.log('🔧 Fixing constructorasalfa.cl configuration...\n');
  
  try {
    // Step 1: Check if salfa-corp exists
    console.log('1️⃣  Checking salfa-corp organization...');
    const salfaCorpRef = firestore.collection('organizations').doc('salfa-corp');
    const salfaCorpDoc = await salfaCorpRef.get();
    
    if (!salfaCorpDoc.exists) {
      console.log('❌ salfa-corp organization does not exist yet');
      console.log('   Create it first or run migration');
      process.exit(1);
    }
    
    const salfaCorpData = salfaCorpDoc.data();
    console.log('✅ salfa-corp exists');
    console.log('   Name:', salfaCorpData.name);
    console.log('   Current domains:', salfaCorpData.domains || []);
    
    // Step 2: Delete constructorasalfa.cl organization (if exists)
    console.log('\n2️⃣  Deleting constructorasalfa.cl organization (if exists)...');
    const constructoraOrgRef = firestore.collection('organizations').doc('constructorasalfa.cl');
    const constructoraOrgDoc = await constructoraOrgRef.get();
    
    if (constructoraOrgDoc.exists) {
      await constructoraOrgRef.delete();
      console.log('✅ Deleted constructorasalfa.cl organization');
      console.log('   (It was incorrectly created as an org)');
    } else {
      console.log('ℹ️  constructorasalfa.cl organization does not exist (good)');
    }
    
    // Step 3: Add constructorasalfa.cl to salfa-corp domains
    console.log('\n3️⃣  Adding constructorasalfa.cl to salfa-corp domains...');
    const currentDomains = salfaCorpData.domains || [];
    
    if (!currentDomains.includes('constructorasalfa.cl')) {
      await salfaCorpRef.update({
        domains: [...currentDomains, 'constructorasalfa.cl'],
        updatedAt: new Date(),
        version: (salfaCorpData.version || 1) + 1
      });
      console.log('✅ Added constructorasalfa.cl to salfa-corp domains');
      console.log('   Updated domains:', [...currentDomains, 'constructorasalfa.cl']);
    } else {
      console.log('ℹ️  constructorasalfa.cl already in salfa-corp domains');
    }
    
    // Step 4: Verify and update user
    console.log('\n4️⃣  Checking user fcerda@constructorasalfa.cl...');
    const usersSnapshot = await firestore
      .collection('users')
      .where('email', '==', 'fcerda@constructorasalfa.cl')
      .get();
    
    if (!usersSnapshot.empty) {
      const userDoc = usersSnapshot.docs[0];
      const userData = userDoc.data();
      console.log('✅ User found');
      console.log('   ID:', userDoc.id);
      console.log('   Name:', userData.name);
      console.log('   Email:', userData.email);
      console.log('   Current orgId:', userData.organizationId || 'none');
      console.log('   Current domainId:', userData.domainId || 'none');
      
      // Update user with org assignment
      await firestore.collection('users').doc(userDoc.id).update({
        organizationId: 'salfa-corp',
        domainId: 'constructorasalfa.cl',
        assignedOrganizations: ['salfa-corp'],
        updatedAt: new Date()
      });
      console.log('✅ User updated:');
      console.log('   organizationId: salfa-corp');
      console.log('   domainId: constructorasalfa.cl');
      console.log('   assignedOrganizations: [salfa-corp]');
    } else {
      console.log('ℹ️  User not found - will be created on first login');
    }
    
    // Step 5: Final verification
    console.log('\n5️⃣  Final verification...');
    const updatedSalfaCorp = await salfaCorpRef.get();
    const updatedData = updatedSalfaCorp.data();
    
    console.log('✅ salfa-corp domains:', updatedData.domains);
    console.log('✅ Domain count:', updatedData.domains.length);
    console.log('✅ Includes constructorasalfa.cl:', updatedData.domains.includes('constructorasalfa.cl'));
    
    console.log('\n' + '='.repeat(80));
    console.log('🎉 FIX COMPLETE!');
    console.log('='.repeat(80));
    console.log('\n📝 Results:');
    console.log('   ✅ constructorasalfa.cl is now a DOMAIN (not an organization)');
    console.log('   ✅ constructorasalfa.cl belongs to salfa-corp organization');
    console.log('   ✅ fcerda@constructorasalfa.cl assigned to salfa-corp');
    console.log('   ✅ Felipe Cerda can now login at: https://salfagpt.salfagestion.cl');
    console.log('\n🚀 Next: Tell Felipe to refresh and try logging in!');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error during fix:', error);
    process.exit(1);
  }
}

fixConstructoraSalfa();






