/**
 * Check folders/proyectos and their userId formats
 * Identify if they also need migration
 */

import { firestore } from '../src/lib/firestore.js';

async function checkFolders() {
  console.log('\n🔍 Analyzing Folders/Proyectos\n');
  console.log('═'.repeat(60));
  
  try {
    // Get all folders
    const foldersSnapshot = await firestore.collection('folders').get();
    console.log(`\n📊 Total folders in system: ${foldersSnapshot.size}\n`);
    
    if (foldersSnapshot.size === 0) {
      console.log('ℹ️  No folders found in system');
      process.exit(0);
    }
    
    // Analyze userId formats
    const userIdFormats = {
      hash: [],
      numeric: [],
      emailBased: [],
      unknown: [],
    };
    
    foldersSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const userId = data.userId;
      
      if (!userId) {
        console.log(`⚠️  Folder ${doc.id} (${data.name}) has NO userId!`);
        return;
      }
      
      // Classify format
      if (userId.startsWith('usr_')) {
        userIdFormats.hash.push({ id: doc.id, name: data.name, userId });
      } else if (/^\d+$/.test(userId)) {
        userIdFormats.numeric.push({ id: doc.id, name: data.name, userId });
      } else if (userId.includes('_')) {
        userIdFormats.emailBased.push({ id: doc.id, name: data.name, userId });
      } else {
        userIdFormats.unknown.push({ id: doc.id, name: data.name, userId });
      }
    });
    
    console.log('📋 Folders by userId format:\n');
    
    console.log(`Hash-based (usr_xxx): ${userIdFormats.hash.length}`);
    if (userIdFormats.hash.length > 0) {
      userIdFormats.hash.forEach(f => {
        console.log(`   - ${f.name} (${f.id}): userId=${f.userId}`);
      });
    }
    console.log('');
    
    console.log(`Numeric (Google OAuth): ${userIdFormats.numeric.length}`);
    if (userIdFormats.numeric.length > 0) {
      userIdFormats.numeric.forEach(f => {
        console.log(`   - ${f.name} (${f.id}): userId=${f.userId}`);
      });
    }
    console.log('');
    
    console.log(`Email-based (user_company_com): ${userIdFormats.emailBased.length}`);
    if (userIdFormats.emailBased.length > 0) {
      userIdFormats.emailBased.forEach(f => {
        console.log(`   - ${f.name} (${f.id}): userId=${f.userId}`);
      });
    }
    console.log('');
    
    if (userIdFormats.unknown.length > 0) {
      console.log(`Unknown format: ${userIdFormats.unknown.length}`);
      userIdFormats.unknown.forEach(f => {
        console.log(`   - ${f.name} (${f.id}): userId=${f.userId}`);
      });
      console.log('');
    }
    
    // Check for alec's folders specifically
    console.log('═'.repeat(60));
    console.log('\n🔍 Checking alec@getaifactory.com folders...\n');
    
    const alecIds = [
      'alec_getaifactory_com',  // Email-based
      '114671162830729001607',   // Numeric
    ];
    
    for (const userId of alecIds) {
      const alecFolders = foldersSnapshot.docs.filter(doc => 
        doc.data().userId === userId
      );
      
      if (alecFolders.length > 0) {
        console.log(`userId="${userId}": ${alecFolders.length} folders`);
        alecFolders.forEach(doc => {
          console.log(`   - ${doc.data().name} (${doc.id})`);
        });
        console.log('');
      }
    }
    
    // Summary
    console.log('═'.repeat(60));
    console.log('\n📊 SUMMARY:\n');
    
    const needsMigration = userIdFormats.numeric.length + userIdFormats.emailBased.length;
    
    if (needsMigration > 0) {
      console.log(`⚠️  ${needsMigration} folders need userId migration`);
      console.log(`   - Numeric IDs: ${userIdFormats.numeric.length}`);
      console.log(`   - Email-based IDs: ${userIdFormats.emailBased.length}`);
      console.log('');
      console.log('✅ Migration script will handle these automatically!');
      console.log('   The user migration also updates folders.');
    } else {
      console.log('✅ All folders already use hash-based userIds!');
      console.log('   No migration needed for folders.');
    }
    
    console.log('\n' + '═'.repeat(60) + '\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

checkFolders();


