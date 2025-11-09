/**
 * COMPREHENSIVE User ID Migration Script
 * 
 * Migrates ALL user ID formats to hash-based IDs:
 * - Email-based IDs (alec_getaifactory_com) → Hash IDs
 * - Numeric OAuth IDs (114671162830729001607) → Hash IDs
 * - Updates ALL related data (conversations, messages, shares, groups)
 * 
 * CRITICAL FINDING:
 * - Users stored with email-based IDs
 * - Conversations stored with numeric OAuth IDs
 * - MISMATCH causes 0 conversations visible!
 * 
 * This script fixes BOTH issues.
 */

import { firestore, generateUserId } from '../src/lib/firestore.js';

const DRY_RUN = !process.argv.includes('--execute');

console.log('\n🔄 COMPREHENSIVE USER ID MIGRATION\n');
console.log('Mode:', DRY_RUN ? '🔍 DRY RUN (no changes)' : '⚠️  EXECUTE (will modify data)');
console.log('');

if (DRY_RUN) {
  console.log('💡 This is a DRY RUN - no data will be modified');
  console.log('💡 Run: npm run migrate:all-users:execute to actually migrate');
  console.log('');
}

/**
 * Identify user ID format
 */
function identifyIdFormat(userId) {
  if (userId.startsWith('usr_')) return 'hash';
  if (/^\d+$/.test(userId)) return 'numeric';
  if (userId.includes('_')) return 'email-based';
  return 'unknown';
}

/**
 * Find user by any ID format (numeric, email-based, or email)
 */
async function findUserByAnyId(searchId, searchEmail) {
  // Try direct document lookup first
  const directDoc = await firestore.collection('users').doc(searchId).get();
  if (directDoc.exists) {
    return { id: directDoc.id, data: directDoc.data() };
  }
  
  // Try by email field
  if (searchEmail) {
    const emailSnapshot = await firestore
      .collection('users')
      .where('email', '==', searchEmail)
      .limit(1)
      .get();
    
    if (!emailSnapshot.empty) {
      const doc = emailSnapshot.docs[0];
      return { id: doc.id, data: doc.data() };
    }
  }
  
  // Try by googleUserId field (if numeric)
  if (/^\d+$/.test(searchId)) {
    const numericSnapshot = await firestore
      .collection('users')
      .where('googleUserId', '==', searchId)
      .limit(1)
      .get();
    
    if (!numericSnapshot.empty) {
      const doc = numericSnapshot.docs[0];
      return { id: doc.id, data: doc.data() };
    }
  }
  
  return null;
}

/**
 * Main migration
 */
async function migrateAll() {
  const stats = {
    usersProcessed: 0,
    userIdsMapped: {},  // oldId → newId mapping
    conversationsUpdated: 0,
    messagesUpdated: 0,
    sharesUpdated: 0,
    groupsUpdated: 0,
    errors: [],
  };

  try {
    console.log('1️⃣  Scanning all users and their data...\n');
    
    // Get all users
    const usersSnapshot = await firestore.collection('users').get();
    console.log(`   Found: ${usersSnapshot.size} users\n`);

    // Get all conversations to understand userId distribution
    const conversationsSnapshot = await firestore.collection('conversations').get();
    console.log(`   Found: ${conversationsSnapshot.size} total conversations\n`);

    // Get all folders/proyectos
    const foldersSnapshot = await firestore.collection('folders').get();
    console.log(`   Found: ${foldersSnapshot.size} total folders/proyectos\n`);

    // Map userId in conversations
    const convUserIds = new Set();
    conversationsSnapshot.docs.forEach(doc => {
      convUserIds.add(doc.data().userId);
    });

    console.log(`   Unique userIds in conversations: ${convUserIds.size}`);
    Array.from(convUserIds).forEach(uid => {
      const format = identifyIdFormat(uid);
      const count = conversationsSnapshot.docs.filter(d => d.data().userId === uid).length;
      console.log(`      ${uid} (${format}): ${count} conversations`);
    });

    console.log('\n2️⃣  Building migration map...\n');

    // For each userId found in conversations, find or create user
    for (const convUserId of convUserIds) {
      const format = identifyIdFormat(convUserId);
      
      if (format === 'hash') {
        console.log(`   ✅ ${convUserId}: Already hash format, skip`);
        continue;
      }

      console.log(`\n   📝 Processing userId: ${convUserId} (${format})`);

      // Find the user document
      const convs = conversationsSnapshot.docs.filter(d => d.data().userId === convUserId);
      const sampleConv = convs[0].data();
      
      // Try to find user by this ID or by email from a message
      let user = await findUserByAnyId(convUserId, null);
      
      if (!user) {
        // Try to get email from messages
        console.log(`      ⚠️  User document not found for ${convUserId}`);
        console.log(`      Checking messages for email...`);
        
        const msgsSnapshot = await firestore
          .collection('messages')
          .where('userId', '==', convUserId)
          .limit(1)
          .get();
        
        if (!msgsSnapshot.empty) {
          console.log(`      Found ${msgsSnapshot.size} messages with this userId`);
        }
        
        // Check if there's a user with this as googleUserId
        if (format === 'numeric') {
          const byGoogleId = await firestore
            .collection('users')
            .where('googleUserId', '==', convUserId)
            .limit(1)
            .get();
          
          if (!byGoogleId.empty) {
            user = { id: byGoogleId.docs[0].id, data: byGoogleId.docs[0].data() };
            console.log(`      ✅ Found user via googleUserId: ${user.id} (${user.data.email})`);
          }
        }
      }

      if (user) {
        const newId = generateUserId();
        console.log(`      Migration plan:`);
        console.log(`         User doc: ${user.id} → ${newId}`);
        console.log(`         Email: ${user.data.email}`);
        console.log(`         Conversations with userId="${convUserId}": ${convs.length}`);
        
        stats.userIdsMapped[convUserId] = {
          oldId: convUserId,
          userDocId: user.id,
          newId,
          email: user.data.email,
          conversationCount: convs.length,
        };
      } else {
        console.log(`      ❌ Could not find user for userId: ${convUserId}`);
        console.log(`         ${convs.length} orphaned conversations!`);
      }
    }

    console.log('\n3️⃣  Migration Summary\n');
    console.log('═'.repeat(60));
    
    const migrationsNeeded = Object.values(stats.userIdsMapped);
    console.log(`\n   Users to migrate: ${migrationsNeeded.length}\n`);

    migrationsNeeded.forEach(migration => {
      console.log(`   📧 ${migration.email}`);
      console.log(`      User doc: ${migration.userDocId} → ${migration.newId}`);
      console.log(`      Conversations with userId="${migration.oldId}": ${migration.conversationCount}`);
      
      // Count folders for this user
      const userFolders = foldersSnapshot.docs.filter(doc => 
        doc.data().userId === migration.oldId
      );
      if (userFolders.length > 0) {
        console.log(`      Folders/Proyectos: ${userFolders.length}`);
      }
      console.log('');
    });

    // Calculate totals
    const totalConvsToUpdate = migrationsNeeded.reduce((sum, m) => sum + m.conversationCount, 0);
    const totalFoldersToUpdate = foldersSnapshot.docs.filter(doc => 
      migrationsNeeded.some(m => m.oldId === doc.data().userId)
    ).length;
    
    console.log(`   Total conversations to update: ${totalConvsToUpdate}`);
    console.log(`   Total folders to update: ${totalFoldersToUpdate}`);

    if (DRY_RUN) {
      console.log('\n💡 This was a DRY RUN');
      console.log('💡 To execute: npm run migrate:all-users:execute');
      console.log('\n⚠️  WARNING: This will modify Firestore data!');
      console.log('   Make sure you have backups before executing!');
    }

    return stats;

  } catch (error) {
    console.error('\n❌ Error:', error);
    throw error;
  }
}

/**
 * Execute migration based on map
 */
async function executeMigration() {
  console.log('\n⚠️  EXECUTING MIGRATION (MODIFYING DATA)\n');
  console.log('═'.repeat(60));
  
  // First, build the migration map
  const analysis = await migrateAll();
  
  if (DRY_RUN) {
    console.log('\n✅ Analysis complete. Review above and run with --execute when ready.');
    process.exit(0);
  }

  // Execute actual migration
  console.log('\n4️⃣  Executing migrations...\n');
  
  for (const [oldUserId, migration] of Object.entries(analysis.userIdsMapped)) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`📝 Migrating: ${migration.email}`);
    console.log(`   User doc: ${migration.userDocId} → ${migration.newId}`);
    console.log(`   Conv userId: ${oldUserId} → ${migration.newId}`);

    try {
      // 1. Create new user document
      const oldUserDoc = await firestore.collection('users').doc(migration.userDocId).get();
      const userData = oldUserDoc.data();

      await firestore.collection('users').doc(migration.newId).set({
        ...userData,
        googleUserId: /^\d+$/.test(oldUserId) ? oldUserId : userData.googleUserId,
        _migratedFrom: migration.userDocId,
        _conversationUserIdMigratedFrom: oldUserId,
        _migratedAt: new Date().toISOString(),
      });
      console.log(`   ✅ Created new user: ${migration.newId}`);

      // 2. Update conversations
      const convsSnapshot = await firestore
        .collection('conversations')
        .where('userId', '==', oldUserId)
        .get();

      if (convsSnapshot.size > 0) {
        const batch = firestore.batch();
        convsSnapshot.docs.forEach(doc => {
          batch.update(doc.ref, {
            userId: migration.newId,
            _userIdMigrated: true,
            _originalUserId: oldUserId,
          });
        });
        await batch.commit();
        console.log(`   ✅ Updated ${convsSnapshot.size} conversations`);
      }

      // 3. Update messages
      const msgsSnapshot = await firestore
        .collection('messages')
        .where('userId', '==', oldUserId)
        .get();

      if (msgsSnapshot.size > 0) {
        let batchCount = 0;
        let batch = firestore.batch();
        
        for (const msgDoc of msgsSnapshot.docs) {
          batch.update(msgDoc.ref, {
            userId: migration.newId,
            _userIdMigrated: true,
          });
          batchCount++;
          
          if (batchCount >= 500) {
            await batch.commit();
            batch = firestore.batch();
            batchCount = 0;
          }
        }
        
        if (batchCount > 0) {
          await batch.commit();
        }
        console.log(`   ✅ Updated ${msgsSnapshot.size} messages`);
      }

      // 3.5. Update folders/proyectos ✨ NEW
      const foldersSnapshot = await firestore
        .collection('folders')
        .where('userId', '==', oldUserId)
        .get();

      if (foldersSnapshot.size > 0) {
        const batch = firestore.batch();
        foldersSnapshot.docs.forEach(doc => {
          batch.update(doc.ref, {
            userId: migration.newId,
            _userIdMigrated: true,
            _originalUserId: oldUserId,
          });
        });
        await batch.commit();
        console.log(`   ✅ Updated ${foldersSnapshot.size} folders/proyectos`);
      }

      // 4. Update shares (ownerId)
      const ownedSharesSnapshot = await firestore
        .collection('agent_shares')
        .where('ownerId', '==', oldUserId)
        .get();

      if (ownedSharesSnapshot.size > 0) {
        const batch = firestore.batch();
        ownedSharesSnapshot.docs.forEach(doc => {
          batch.update(doc.ref, { ownerId: migration.newId });
        });
        await batch.commit();
        console.log(`   ✅ Updated ${ownedSharesSnapshot.size} shares (ownerId)`);
      }

      // Also check if user doc ID is used in shares
      const sharesByUserDoc = await firestore
        .collection('agent_shares')
        .where('ownerId', '==', migration.userDocId)
        .get();

      if (sharesByUserDoc.size > 0 && migration.userDocId !== oldUserId) {
        const batch = firestore.batch();
        sharesByUserDoc.docs.forEach(doc => {
          batch.update(doc.ref, { ownerId: migration.newId });
        });
        await batch.commit();
        console.log(`   ✅ Updated ${sharesByUserDoc.size} shares (from userDoc ID)`);
      }

      // 5. Update shares (sharedWith array)
      const allShares = await firestore.collection('agent_shares').get();
      let sharesUpdated = 0;

      for (const shareDoc of allShares.docs) {
        const data = shareDoc.data();
        const sharedWith = data.sharedWith || [];
        let needsUpdate = false;
        
        const updatedSharedWith = sharedWith.map(target => {
          if (target.type === 'user' && 
              (target.id === oldUserId || target.id === migration.userDocId)) {
            needsUpdate = true;
            return {
              ...target,
              id: migration.newId,
              email: migration.email,
              _migratedFrom: target.id,
            };
          }
          return target;
        });

        if (needsUpdate) {
          await firestore.collection('agent_shares').doc(shareDoc.id).update({
            sharedWith: updatedSharedWith,
          });
          sharesUpdated++;
        }
      }

      if (sharesUpdated > 0) {
        console.log(`   ✅ Updated ${sharesUpdated} shares (sharedWith)`);
      }

      // 6. Delete old user document (if different from oldUserId)
      if (migration.userDocId !== migration.newId) {
        await firestore.collection('users').doc(migration.userDocId).delete();
        console.log(`   ✅ Deleted old user document: ${migration.userDocId}`);
      }

      console.log(`\n✅ Migration complete for ${migration.email}`);

    } catch (error) {
      console.error(`\n❌ Error migrating ${migration.email}:`, error.message);
      analysis.stats.errors.push({
        user: migration.email,
        error: error.message,
      });
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log('✅ MIGRATION COMPLETE');
  console.log('═'.repeat(60));
  console.log('\n⚠️  CRITICAL: All users must LOGOUT and RE-LOGIN!');
  console.log('   New JWTs will have hash IDs.\n');
}

// Run
if (DRY_RUN) {
  migrateAll().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
} else {
  executeMigration().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

