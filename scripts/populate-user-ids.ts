/**
 * Script to populate userId field for all existing users
 * Run this ONCE to add Google OAuth numeric IDs to all user documents
 * 
 * Usage: npx tsx scripts/populate-user-ids.ts
 */

import { firestore } from '../src/lib/firestore';

async function populateUserIds() {
  console.log('🔧 Populating userId field for all users...\n');
  
  try {
    // Get all users
    const snapshot = await firestore.collection('users').get();
    console.log(`📋 Found ${snapshot.docs.length} users\n`);
    
    let updated = 0;
    let skipped = 0;
    let needsLogin = 0;
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const email = data.email;
      
      console.log(`\n👤 Processing: ${data.name} (${email})`);
      console.log(`   Document ID: ${doc.id}`);
      console.log(`   Current userId: ${data.userId || 'NOT SET'}`);
      
      if (data.userId) {
        console.log('   ✅ Already has userId - skipping');
        skipped++;
      } else {
        console.log('   ⚠️  Missing userId field');
        console.log('   📝 This user needs to logout and re-login to get their Google ID saved');
        console.log(`   📧 Email: ${email}`);
        needsLogin++;
        
        // We CANNOT populate this automatically because we don't have their Google OAuth ID
        // They must login via OAuth for us to get it
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 Summary:');
    console.log(`   ✅ Already have userId: ${skipped}`);
    console.log(`   ⚠️  Need to re-login: ${needsLogin}`);
    console.log('='.repeat(60));
    
    if (needsLogin > 0) {
      console.log('\n🚨 ACTION REQUIRED:');
      console.log('   The following users need to LOGOUT and RE-LOGIN once:');
      console.log('');
      
      for (const doc of snapshot.docs) {
        const data = doc.data();
        if (!data.userId) {
          console.log(`   📧 ${data.email} (${data.name})`);
        }
      }
      
      console.log('\n💡 When they re-login:');
      console.log('   1. OAuth callback receives their Google numeric ID');
      console.log('   2. upsertUserOnLogin() saves it to the userId field');
      console.log('   3. Agent sharing will work correctly ✅');
    } else {
      console.log('\n✅ All users have userId field - sharing should work!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

populateUserIds();

