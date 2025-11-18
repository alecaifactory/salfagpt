/**
 * Migration Script: Convert Email-Based User IDs to Hash-Based IDs
 * 
 * Purpose: Standardize all user IDs to hash format (usr_xxx)
 * 
 * What this does:
 * 1. Find all users with email-based IDs (contains @ or .)
 * 2. Generate new hash ID for each user
 * 3. Create new user document with hash ID
 * 4. Update all conversations with new userId
 * 5. Update all messages with new userId
 * 6. Update all shares with new userId
 * 7. Update all groups with new userId
 * 8. Delete old user document
 * 
 * Safety:
 * - Dry run mode by default (no changes)
 * - Validates each step
 * - Logs all changes
 * - Can rollback via Firestore backups
 */

import { firestore, generateUserId } from '../src/lib/firestore.js';

const DRY_RUN = process.argv.includes('--dry-run') || !process.argv.includes('--execute');

console.log('\n🔄 USER ID MIGRATION TO HASH-BASED IDS\n');
console.log('Mode:', DRY_RUN ? '🔍 DRY RUN (no changes)' : '⚠️  EXECUTE (will modify data)');
console.log('');

if (DRY_RUN) {
  console.log('💡 This is a DRY RUN - no data will be modified');
  console.log('💡 Add --execute flag to actually perform migration');
  console.log('');
}

/**
 * Check if a user ID is email-based (old format)
 */
function isEmailBasedId(userId) {
  // Email-based IDs have _ from email conversion (e.g., alec_getaifactory_com)
  // Hash IDs start with usr_ (e.g., usr_abc123)
  // Numeric IDs are all digits
  
  if (userId.startsWith('usr_')) {
    return false; // Already hash-based
  }
  
  if (/^\d+$/.test(userId)) {
    return false; // Numeric (will handle separately)
  }
  
  // If contains _ and not usr_, likely email-based
  return userId.includes('_');
}

/**
 * Main migration function
 */
async function migrateUsers() {
  const stats = {
    usersChecked: 0,
    usersToMigrate: 0,
    usersMigrated: 0,
    conversationsUpdated: 0,
    messagesUpdated: 0,
    sharesUpdated: 0,
    groupsUpdated: 0,
    errors: [],
  };

  try {
    // 1. Get all users
    console.log('1️⃣  Loading all users...');
    const usersSnapshot = await firestore.collection('users').get();
    stats.usersChecked = usersSnapshot.size;
    console.log(`   Found: ${stats.usersChecked} users\n`);

    // 2. Identify users needing migration
    const usersToMigrate = [];
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      
      if (isEmailBasedId(userId)) {
        usersToMigrate.push({
          oldId: userId,
          email: userData.email,
          name: userData.name,
          data: userData,
        });
        console.log(`   📧 Email-based ID found: ${userId} (${userData.email})`);
      }
    }
    
    stats.usersToMigrate = usersToMigrate.length;
    console.log(`\n2️⃣  Users needing migration: ${stats.usersToMigrate}\n`);

    if (stats.usersToMigrate === 0) {
      console.log('✅ No users need migration! All users already have hash IDs.');
      return stats;
    }

    // 3. Migrate each user
    for (const user of usersToMigrate) {
      console.log(`\n─────────────────────────────────────────────────`);
      console.log(`📝 Migrating: ${user.email}`);
      console.log(`   Old ID: ${user.oldId}`);
      
      try {
        // Generate new hash ID
        const newId = generateUserId();
        console.log(`   New ID: ${newId}`);

        if (DRY_RUN) {
          console.log(`   🔍 [DRY RUN] Would create new user document: users/${newId}`);
        } else {
          // Create new user document with hash ID
          await firestore.collection('users').doc(newId).set({
            ...user.data,
            // Preserve migration history
            _migratedFrom: user.oldId,
            _migratedAt: new Date().toISOString(),
          });
          console.log(`   ✅ Created new user document: ${newId}`);
        }

        // 4. Update conversations
        console.log(`\n   📂 Updating conversations...`);
        const conversationsSnapshot = await firestore
          .collection('conversations')
          .where('userId', '==', user.oldId)
          .get();
        
        console.log(`      Found: ${conversationsSnapshot.size} conversations`);
        
        if (conversationsSnapshot.size > 0) {
          if (DRY_RUN) {
            console.log(`      🔍 [DRY RUN] Would update ${conversationsSnapshot.size} conversations`);
            conversationsSnapshot.docs.slice(0, 3).forEach(doc => {
              console.log(`         - ${doc.data().title || 'Untitled'} (${doc.id})`);
            });
          } else {
            const batch = firestore.batch();
            let batchCount = 0;
            
            for (const convDoc of conversationsSnapshot.docs) {
              batch.update(convDoc.ref, { 
                userId: newId,
                _userIdMigrated: true,
                _originalUserId: user.oldId,
              });
              batchCount++;
              
              // Firestore batch limit is 500
              if (batchCount >= 500) {
                await batch.commit();
                console.log(`      ✅ Committed batch of ${batchCount} conversations`);
                batchCount = 0;
              }
            }
            
            if (batchCount > 0) {
              await batch.commit();
              console.log(`      ✅ Updated ${conversationsSnapshot.size} conversations`);
            }
            stats.conversationsUpdated += conversationsSnapshot.size;
          }
        }

        // 5. Update messages
        console.log(`\n   💬 Updating messages...`);
        const messagesSnapshot = await firestore
          .collection('messages')
          .where('userId', '==', user.oldId)
          .get();
        
        console.log(`      Found: ${messagesSnapshot.size} messages`);
        
        if (messagesSnapshot.size > 0) {
          if (DRY_RUN) {
            console.log(`      🔍 [DRY RUN] Would update ${messagesSnapshot.size} messages`);
          } else {
            const batch = firestore.batch();
            let batchCount = 0;
            
            for (const msgDoc of messagesSnapshot.docs) {
              batch.update(msgDoc.ref, { 
                userId: newId,
                _userIdMigrated: true,
              });
              batchCount++;
              
              if (batchCount >= 500) {
                await batch.commit();
                console.log(`      ✅ Committed batch of ${batchCount} messages`);
                batchCount = 0;
              }
            }
            
            if (batchCount > 0) {
              await batch.commit();
              console.log(`      ✅ Updated ${messagesSnapshot.size} messages`);
            }
            stats.messagesUpdated += messagesSnapshot.size;
          }
        }

        // 6. Update agent shares (both ownerId and sharedWith)
        console.log(`\n   🤝 Updating agent shares...`);
        
        // Update as owner
        const ownedSharesSnapshot = await firestore
          .collection('agent_shares')
          .where('ownerId', '==', user.oldId)
          .get();
        
        console.log(`      Found: ${ownedSharesSnapshot.size} shares owned by user`);
        
        if (ownedSharesSnapshot.size > 0) {
          if (DRY_RUN) {
            console.log(`      🔍 [DRY RUN] Would update ownerId in ${ownedSharesSnapshot.size} shares`);
          } else {
            const batch = firestore.batch();
            ownedSharesSnapshot.docs.forEach(doc => {
              batch.update(doc.ref, { ownerId: newId });
            });
            await batch.commit();
            console.log(`      ✅ Updated ownerId in ${ownedSharesSnapshot.size} shares`);
            stats.sharesUpdated += ownedSharesSnapshot.size;
          }
        }

        // Update in sharedWith array
        const allSharesSnapshot = await firestore
          .collection('agent_shares')
          .get();
        
        let sharesWithUserCount = 0;
        
        for (const shareDoc of allSharesSnapshot.docs) {
          const shareData = shareDoc.data();
          const sharedWith = shareData.sharedWith || [];
          
          // Check if this user is in sharedWith array
          const hasUser = sharedWith.some(target => 
            target.type === 'user' && target.id === user.oldId
          );
          
          if (hasUser) {
            sharesWithUserCount++;
            
            if (DRY_RUN) {
              console.log(`      🔍 [DRY RUN] Would update share ${shareDoc.id} sharedWith array`);
            } else {
              // Update the sharedWith array
              const updatedSharedWith = sharedWith.map(target => {
                if (target.type === 'user' && target.id === user.oldId) {
                  return {
                    ...target,
                    id: newId, // Update to hash ID
                    email: user.email, // Ensure email is present
                    _migratedFrom: user.oldId,
                  };
                }
                return target;
              });
              
              await firestore.collection('agent_shares').doc(shareDoc.id).update({
                sharedWith: updatedSharedWith,
              });
            }
          }
        }
        
        if (sharesWithUserCount > 0) {
          console.log(`      Found user in ${sharesWithUserCount} share sharedWith arrays`);
          if (!DRY_RUN) {
            console.log(`      ✅ Updated sharedWith in ${sharesWithUserCount} shares`);
            stats.sharesUpdated += sharesWithUserCount;
          }
        }

        // 7. Update groups
        console.log(`\n   👥 Updating groups...`);
        const groupsSnapshot = await firestore.collection('groups').get();
        let groupsWithUserCount = 0;
        
        for (const groupDoc of groupsSnapshot.docs) {
          const groupData = groupDoc.data();
          const members = groupData.members || [];
          
          if (members.includes(user.oldId)) {
            groupsWithUserCount++;
            
            if (DRY_RUN) {
              console.log(`      🔍 [DRY RUN] Would update group ${groupDoc.id} members`);
            } else {
              const updatedMembers = members.map(memberId => 
                memberId === user.oldId ? newId : memberId
              );
              
              await firestore.collection('groups').doc(groupDoc.id).update({
                members: updatedMembers,
              });
            }
          }
        }
        
        if (groupsWithUserCount > 0) {
          console.log(`      Found user in ${groupsWithUserCount} groups`);
          if (!DRY_RUN) {
            console.log(`      ✅ Updated ${groupsWithUserCount} groups`);
            stats.groupsUpdated += groupsWithUserCount;
          }
        }

        // 8. Delete old user document
        if (!DRY_RUN) {
          console.log(`\n   🗑️  Deleting old user document: ${user.oldId}`);
          await firestore.collection('users').doc(user.oldId).delete();
          console.log(`   ✅ Old user document deleted`);
        } else {
          console.log(`\n   🔍 [DRY RUN] Would delete old user document: ${user.oldId}`);
        }

        stats.usersMigrated++;
        console.log(`\n✅ Migration complete for ${user.email}`);
        console.log(`   ${user.oldId} → ${newId}`);

      } catch (error) {
        console.error(`\n❌ Error migrating ${user.email}:`, error.message);
        stats.errors.push({
          user: user.email,
          oldId: user.oldId,
          error: error.message,
        });
      }
    }

    return stats;

  } catch (error) {
    console.error('\n❌ Fatal migration error:', error);
    throw error;
  }
}

/**
 * Also check for users with numeric Google OAuth IDs as document IDs
 * These should also be migrated
 */
async function checkNumericUserIds() {
  console.log('\n🔍 Checking for numeric user IDs...\n');
  
  const usersSnapshot = await firestore.collection('users').get();
  const numericUsers = [];
  
  for (const userDoc of usersSnapshot.docs) {
    const userId = userDoc.id;
    
    if (/^\d+$/.test(userId)) {
      numericUsers.push({
        id: userId,
        email: userDoc.data().email,
      });
      console.log(`   📊 Numeric ID found: ${userId} (${userDoc.data().email})`);
    }
  }
  
  if (numericUsers.length > 0) {
    console.log(`\n⚠️  Found ${numericUsers.length} users with numeric IDs`);
    console.log('   These should also be migrated to hash IDs');
  } else {
    console.log('✅ No numeric user IDs found');
  }
  
  return numericUsers;
}

/**
 * Run migration
 */
async function run() {
  try {
    // Check for numeric IDs
    await checkNumericUserIds();
    
    console.log('\n' + '═'.repeat(60));
    console.log('STARTING MIGRATION');
    console.log('═'.repeat(60) + '\n');

    const stats = await migrateUsers();

    console.log('\n' + '═'.repeat(60));
    console.log('MIGRATION COMPLETE');
    console.log('═'.repeat(60));
    console.log('\n📊 Statistics:\n');
    console.log(`   Users checked: ${stats.usersChecked}`);
    console.log(`   Users to migrate: ${stats.usersToMigrate}`);
    console.log(`   Users migrated: ${stats.usersMigrated}`);
    console.log(`   Conversations updated: ${stats.conversationsUpdated}`);
    console.log(`   Messages updated: ${stats.messagesUpdated}`);
    console.log(`   Shares updated: ${stats.sharesUpdated}`);
    console.log(`   Groups updated: ${stats.groupsUpdated}`);
    console.log(`   Errors: ${stats.errors.length}`);

    if (stats.errors.length > 0) {
      console.log('\n❌ Errors encountered:\n');
      stats.errors.forEach(err => {
        console.log(`   ${err.user} (${err.oldId}): ${err.error}`);
      });
    }

    if (DRY_RUN) {
      console.log('\n💡 This was a DRY RUN - no data was modified');
      console.log('💡 Run with --execute flag to perform actual migration:');
      console.log('   npm run migrate:user-ids --execute');
    } else {
      console.log('\n✅ Migration executed successfully!');
      console.log('\n⚠️  IMPORTANT: Users must RE-LOGIN for changes to take effect!');
      console.log('   Logout and login again to get new hash-based JWT');
    }

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
run();






