/**
 * RECOVERY SCRIPT: Migrate Conversations with Numeric Google OAuth UserIds
 * 
 * CRITICAL FIX for lost conversations after hash ID migration
 * 
 * Problem:
 * - Original migration only handled email-based user document IDs
 * - Skipped conversations with numeric Google OAuth userIds
 * - Result: 93 conversations "lost" (not visible to users)
 * 
 * This script:
 * 1. Finds ALL conversations with numeric userId
 * 2. Maps numeric userId → hash userId (via googleUserId field)
 * 3. Updates conversation.userId to hash format
 * 4. Updates related messages
 * 5. Adds organizationId (if user has one)
 * 
 * Run:
 *   node scripts/recover-numeric-userid-conversations.mjs           (dry-run)
 *   node scripts/recover-numeric-userid-conversations.mjs --execute (actual)
 */

import { Firestore, FieldValue } from '@google-cloud/firestore';

const firestore = new Firestore({ projectId: 'salfagpt' });
const DRY_RUN = !process.argv.includes('--execute');

console.log('\n🔧 RECOVERY: Migrate Numeric UserIds to Hash UserIds\n');
console.log('Mode:', DRY_RUN ? '🔍 DRY RUN (no changes)' : '⚠️  EXECUTE (will modify data)');
console.log('');

if (DRY_RUN) {
  console.log('💡 This is a DRY RUN - no data will be modified');
  console.log('💡 Add --execute flag to actually perform recovery');
  console.log('');
}

/**
 * Find user by googleUserId field
 */
async function findUserByGoogleId(googleUserId) {
  const usersSnapshot = await firestore
    .collection('users')
    .where('googleUserId', '==', googleUserId)
    .limit(1)
    .get();
  
  if (usersSnapshot.empty) return null;
  
  const userDoc = usersSnapshot.docs[0];
  return {
    id: userDoc.id,
    ...userDoc.data()
  };
}

/**
 * Main recovery function
 */
async function recoverConversations() {
  const stats = {
    conversationsChecked: 0,
    conversationsToRecover: 0,
    conversationsRecovered: 0,
    messagesUpdated: 0,
    usersAffected: new Set(),
    errors: [],
  };

  try {
    // 1. Get ALL conversations
    console.log('1️⃣  Loading all conversations...');
    const conversationsSnapshot = await firestore.collection('conversations').get();
    stats.conversationsChecked = conversationsSnapshot.size;
    console.log(`   Found: ${stats.conversationsChecked} conversations\n`);

    // 2. Identify conversations with numeric userIds
    const numericConversations = [];
    
    for (const convDoc of conversationsSnapshot.docs) {
      const userId = convDoc.data().userId;
      
      // Check if numeric (all digits)
      if (userId && /^\d+$/.test(userId)) {
        numericConversations.push({
          id: convDoc.id,
          userId: userId,
          title: convDoc.data().title || 'Untitled',
          data: convDoc.data(),
          ref: convDoc.ref,
        });
      }
    }
    
    stats.conversationsToRecover = numericConversations.length;
    console.log(`2️⃣  Conversations with numeric userIds: ${stats.conversationsToRecover}\n`);

    if (stats.conversationsToRecover === 0) {
      console.log('✅ No conversations need recovery! All use hash userIds.');
      return stats;
    }

    // 3. Build numeric → hash mapping
    console.log('3️⃣  Building user ID mapping...');
    const usersSnapshot = await firestore.collection('users').get();
    const numericToHash = new Map();
    const userOrgs = new Map(); // Store organizationId for each hash user
    
    for (const userDoc of usersSnapshot.docs) {
      const googleUserId = userDoc.data().googleUserId;
      const hashUserId = userDoc.id;
      const organizationId = userDoc.data().organizationId;
      
      if (googleUserId) {
        numericToHash.set(googleUserId, hashUserId);
        if (organizationId) {
          userOrgs.set(hashUserId, organizationId);
        }
      }
    }
    
    console.log(`   Mapped ${numericToHash.size} numeric → hash IDs\n`);

    // 4. Group conversations by numeric userId for better logging
    const conversationsByUser = new Map();
    numericConversations.forEach(conv => {
      if (!conversationsByUser.has(conv.userId)) {
        conversationsByUser.set(conv.userId, []);
      }
      conversationsByUser.get(conv.userId).push(conv);
    });

    console.log(`4️⃣  Grouped into ${conversationsByUser.size} users\n`);

    // 5. Recover each user's conversations
    for (const [numericUserId, conversations] of conversationsByUser) {
      console.log(`\n${'─'.repeat(80)}`);
      
      const hashUserId = numericToHash.get(numericUserId);
      
      if (!hashUserId) {
        console.log(`⚠️  Numeric userId: ${numericUserId}`);
        console.log(`   No matching user found (user may have been deleted)`);
        console.log(`   Conversations: ${conversations.length}`);
        
        stats.errors.push({
          numericUserId,
          reason: 'No matching user found',
          conversations: conversations.length,
        });
        continue;
      }

      // Find user info
      const user = await firestore.collection('users').doc(hashUserId).get();
      const userData = user.data();
      const organizationId = userOrgs.get(hashUserId);

      console.log(`📝 Recovering for: ${userData.email}`);
      console.log(`   Numeric ID: ${numericUserId}`);
      console.log(`   Hash ID: ${hashUserId}`);
      console.log(`   Organization: ${organizationId || 'none'}`);
      console.log(`   Conversations to recover: ${conversations.length}`);

      stats.usersAffected.add(userData.email);

      // 6. Update each conversation
      let userConvsRecovered = 0;
      let userMessagesUpdated = 0;

      for (const conv of conversations) {
        try {
          if (DRY_RUN) {
            console.log(`   🔍 [DRY RUN] Would update conversation: ${conv.title} (${conv.id})`);
          } else {
            // Update conversation
            const updateData = {
              userId: hashUserId,
              _userIdMigrated: true,
              _originalUserId: numericUserId,
              _recoveredAt: new Date().toISOString(),
              updatedAt: new Date(),
            };
            
            // Add organizationId if user has one
            if (organizationId) {
              updateData.organizationId = organizationId;
            }
            
            await conv.ref.update(updateData);
            userConvsRecovered++;

            // Update related messages
            const messagesSnapshot = await firestore
              .collection('messages')
              .where('conversationId', '==', conv.id)
              .where('userId', '==', numericUserId)
              .get();

            if (messagesSnapshot.size > 0) {
              const messageBatch = firestore.batch();
              
              messagesSnapshot.docs.forEach(msgDoc => {
                const msgUpdate = {
                  userId: hashUserId,
                  _userIdMigrated: true,
                };
                
                if (organizationId) {
                  msgUpdate.organizationId = organizationId;
                }
                
                messageBatch.update(msgDoc.ref, msgUpdate);
              });
              
              await messageBatch.commit();
              userMessagesUpdated += messagesSnapshot.size;
            }
          }
        } catch (error) {
          console.error(`   ❌ Error recovering conversation ${conv.id}:`, error.message);
          stats.errors.push({
            conversationId: conv.id,
            numericUserId,
            error: error.message,
          });
        }
      }

      if (!DRY_RUN) {
        console.log(`   ✅ Recovered ${userConvsRecovered} conversations`);
        console.log(`   ✅ Updated ${userMessagesUpdated} messages`);
        stats.conversationsRecovered += userConvsRecovered;
        stats.messagesUpdated += userMessagesUpdated;
      } else {
        console.log(`   🔍 [DRY RUN] Would recover ${conversations.length} conversations`);
      }
    }

    return stats;

  } catch (error) {
    console.error('\n❌ Fatal recovery error:', error);
    throw error;
  }
}

/**
 * Run recovery
 */
async function run() {
  try {
    console.log('═'.repeat(80));
    console.log('STARTING RECOVERY');
    console.log('═'.repeat(80) + '\n');

    const stats = await recoverConversations();

    console.log('\n' + '═'.repeat(80));
    console.log('RECOVERY COMPLETE');
    console.log('═'.repeat(80));
    console.log('\n📊 Statistics:\n');
    console.log(`   Conversations checked: ${stats.conversationsChecked}`);
    console.log(`   Conversations to recover: ${stats.conversationsToRecover}`);
    console.log(`   Conversations recovered: ${stats.conversationsRecovered}`);
    console.log(`   Messages updated: ${stats.messagesUpdated}`);
    console.log(`   Users affected: ${stats.usersAffected.size}`);
    console.log(`   Errors: ${stats.errors.length}`);

    if (stats.errors.length > 0) {
      console.log('\n⚠️  Errors encountered:\n');
      stats.errors.forEach(err => {
        console.log(`   ${err.numericUserId || err.conversationId}: ${err.reason || err.error}`);
      });
    }

    if (stats.usersAffected.size > 0) {
      console.log('\n👥 Affected users:\n');
      stats.usersAffected.forEach(email => {
        console.log(`   - ${email}`);
      });
    }

    if (DRY_RUN) {
      console.log('\n💡 This was a DRY RUN - no data was modified');
      console.log('💡 Run with --execute flag to perform actual recovery:');
      console.log('   node scripts/recover-numeric-userid-conversations.mjs --execute');
    } else {
      console.log('\n✅ Recovery executed successfully!');
      console.log('\n⚠️  IMPORTANT: Affected users should:');
      console.log('   1. Logout and login again (to refresh session)');
      console.log('   2. Verify all conversations are now visible');
      console.log('   3. Report any remaining issues');
      console.log('\n📧 Send notification to affected users (see list above)');
    }

    console.log('');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Recovery failed:', error);
    process.exit(1);
  }
}

// Run recovery
run();





