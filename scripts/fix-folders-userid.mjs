/**
 * Fix folders that have numeric userId to use proper hash ID
 * 
 * Issue: Some folders created with Google OAuth numeric ID
 * Fix: Update to use user's actual hash-based document ID
 */

import { firestore } from '../src/lib/firestore.js';

const DRY_RUN = !process.argv.includes('--execute');

console.log('\n🔧 Fix Folders userId Migration\n');
console.log('Mode:', DRY_RUN ? '🔍 DRY RUN (preview)' : '⚠️  EXECUTE (will modify)');
console.log('');

async function fixFolders() {
  const stats = {
    foldersChecked: 0,
    foldersToFix: 0,
    foldersFixed: 0,
    errors: [],
  };

  try {
    // 1. Get all folders
    const foldersSnapshot = await firestore.collection('folders').get();
    stats.foldersChecked = foldersSnapshot.size;
    console.log(`1️⃣  Checking ${stats.foldersChecked} folders...\n`);

    // 2. Find folders with numeric userId
    const foldersToFix = [];
    
    for (const folderDoc of foldersSnapshot.docs) {
      const data = folderDoc.data();
      const userId = data.userId;
      
      // Check if numeric
      if (/^\d+$/.test(userId)) {
        // Find the actual user with this googleUserId
        const userSnapshot = await firestore
          .collection('users')
          .where('googleUserId', '==', userId)
          .limit(1)
          .get();
        
        if (!userSnapshot.empty) {
          const user = userSnapshot.docs[0];
          const correctUserId = user.id;  // Hash ID
          
          foldersToFix.push({
            folderId: folderDoc.id,
            folderName: data.name,
            oldUserId: userId,
            newUserId: correctUserId,
            userEmail: user.data().email,
          });
          
          console.log(`   📁 ${data.name}`);
          console.log(`      Current userId: ${userId} (numeric)`);
          console.log(`      User: ${user.data().email}`);
          console.log(`      Correct userId: ${correctUserId} (hash)`);
          console.log('');
        } else {
          console.log(`   ⚠️  ${data.name}: No user found with googleUserId=${userId}`);
          stats.errors.push({
            folder: data.name,
            userId,
            error: 'User not found'
          });
        }
      }
    }
    
    stats.foldersToFix = foldersToFix.length;
    
    console.log(`\n2️⃣  Folders to fix: ${stats.foldersToFix}\n`);
    
    if (stats.foldersToFix === 0) {
      console.log('✅ No folders need fixing! All using correct userId format.');
      return stats;
    }

    // 3. Execute fix
    if (!DRY_RUN) {
      console.log('3️⃣  Executing fixes...\n');
      
      const batch = firestore.batch();
      
      for (const fix of foldersToFix) {
        const folderRef = firestore.collection('folders').doc(fix.folderId);
        batch.update(folderRef, {
          userId: fix.newUserId,
          _userIdMigrated: true,
          _originalUserId: fix.oldUserId,
          _migratedAt: new Date().toISOString(),
        });
        
        console.log(`   ✅ Fixed: ${fix.folderName}`);
        console.log(`      ${fix.oldUserId} → ${fix.newUserId}`);
        console.log(`      User: ${fix.userEmail}\n`);
      }
      
      await batch.commit();
      stats.foldersFixed = foldersToFix.length;
      console.log(`✅ Committed batch: ${stats.foldersFixed} folders updated\n`);
    } else {
      console.log('3️⃣  Preview of fixes:\n');
      foldersToFix.forEach(fix => {
        console.log(`   🔍 [DRY RUN] Would fix: ${fix.folderName}`);
        console.log(`      ${fix.oldUserId} → ${fix.newUserId}`);
        console.log(`      User: ${fix.userEmail}\n`);
      });
    }

    return stats;

  } catch (error) {
    console.error('\n❌ Error:', error);
    throw error;
  }
}

// Run
fixFolders().then(stats => {
  console.log('═'.repeat(70));
  console.log('\n📊 SUMMARY:\n');
  console.log(`   Folders checked: ${stats.foldersChecked}`);
  console.log(`   Folders to fix: ${stats.foldersToFix}`);
  console.log(`   Folders fixed: ${stats.foldersFixed}`);
  console.log(`   Errors: ${stats.errors.length}`);
  
  if (stats.errors.length > 0) {
    console.log('\n❌ Errors:');
    stats.errors.forEach(err => {
      console.log(`   ${err.folder}: ${err.error}`);
    });
  }
  
  if (DRY_RUN) {
    console.log('\n💡 This was a DRY RUN - no data modified');
    console.log('💡 To execute: npm run fix:folders --execute');
  } else {
    console.log('\n✅ Folders fixed! Users must refresh page to see proyectos.');
  }
  
  console.log('\n' + '═'.repeat(70) + '\n');
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});


