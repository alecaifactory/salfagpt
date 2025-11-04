#!/usr/bin/env tsx
/**
 * Delete User: alec@salfacloud.cl
 * 
 * This script performs a complete cleanup of user data:
 * 1. Deletes all conversations owned by the user
 * 2. Deletes all messages from those conversations
 * 3. Deletes all context sources owned by the user
 * 4. Unassigns user from any shared agents
 * 5. Deletes user settings and configs
 * 6. Deletes the user document
 * 
 * Purpose: Reset user account to test as if new user
 * 
 * Usage: npx tsx scripts/delete-user-alec-salfacloud.ts
 */

import { firestore, COLLECTIONS } from '../src/lib/firestore.js';

const TARGET_EMAIL = process.env.TARGET_EMAIL || 'alec@salfacloud.cl';
const DRY_RUN = process.env.DRY_RUN === 'true'; // Set to false to actually delete

interface DeletionReport {
  userId: string;
  email: string;
  conversations: number;
  messages: number;
  contextSources: number;
  userSettings: number;
  agentConfigs: number;
  conversationContexts: number;
  usageLogs: number;
  agentSharesUnassigned: number;
  userDeleted: boolean;
}

async function main() {
  console.log('🗑️  User Deletion Script');
  console.log('='.repeat(60));
  console.log(`📧 Target User: ${TARGET_EMAIL}`);
  console.log(`🔧 Mode: ${DRY_RUN ? '🧪 DRY RUN (no actual deletion)' : '⚠️  LIVE (will delete data)'}`);
  console.log('='.repeat(60));
  console.log();

  const report: DeletionReport = {
    userId: '',
    email: TARGET_EMAIL,
    conversations: 0,
    messages: 0,
    contextSources: 0,
    userSettings: 0,
    agentConfigs: 0,
    conversationContexts: 0,
    usageLogs: 0,
    agentSharesUnassigned: 0,
    userDeleted: false,
  };

  try {
    // Step 1: Find user by email
    console.log('1️⃣  Finding user...');
    const usersSnapshot = await firestore
      .collection(COLLECTIONS.USERS)
      .where('email', '==', TARGET_EMAIL)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      console.log(`❌ User not found with email: ${TARGET_EMAIL}`);
      console.log('✅ Nothing to clean up!');
      return;
    }

    const userDoc = usersSnapshot.docs[0];
    const userId = userDoc.id;
    const userData = userDoc.data();
    report.userId = userId;

    console.log(`✅ Found user: ${userId}`);
    console.log(`   Name: ${userData.name}`);
    console.log(`   Role: ${userData.role || 'user'}`);
    console.log(`   Created: ${userData.createdAt?.toDate?.() || 'unknown'}`);
    console.log();

    // Step 2: Delete conversations (and their messages)
    console.log('2️⃣  Deleting conversations and messages...');
    const conversationsSnapshot = await firestore
      .collection(COLLECTIONS.CONVERSATIONS)
      .where('userId', '==', userId)
      .get();

    report.conversations = conversationsSnapshot.size;
    console.log(`   Found ${report.conversations} conversations`);

    for (const convDoc of conversationsSnapshot.docs) {
      const conversationId = convDoc.id;
      const convData = convDoc.data();
      console.log(`   📝 Conversation: ${convData.title} (${conversationId})`);

      // Delete all messages for this conversation
      const messagesSnapshot = await firestore
        .collection(COLLECTIONS.MESSAGES)
        .where('conversationId', '==', conversationId)
        .get();

      console.log(`      Messages: ${messagesSnapshot.size}`);
      report.messages += messagesSnapshot.size;

      if (!DRY_RUN) {
        // Delete messages in batches
        const batches = [];
        let currentBatch = firestore.batch();
        let operationCount = 0;

        for (const msgDoc of messagesSnapshot.docs) {
          currentBatch.delete(msgDoc.ref);
          operationCount++;

          if (operationCount === 500) {
            batches.push(currentBatch);
            currentBatch = firestore.batch();
            operationCount = 0;
          }
        }
        if (operationCount > 0) {
          batches.push(currentBatch);
        }

        for (const batch of batches) {
          await batch.commit();
        }

        // Delete conversation
        await convDoc.ref.delete();
      }
    }
    console.log(`   ✅ Deleted ${report.conversations} conversations with ${report.messages} messages`);
    console.log();

    // Step 3: Delete context sources
    console.log('3️⃣  Deleting context sources...');
    const sourcesSnapshot = await firestore
      .collection(COLLECTIONS.CONTEXT_SOURCES)
      .where('userId', '==', userId)
      .get();

    report.contextSources = sourcesSnapshot.size;
    console.log(`   Found ${report.contextSources} context sources`);

    if (!DRY_RUN && report.contextSources > 0) {
      const batch = firestore.batch();
      sourcesSnapshot.docs.forEach(doc => {
        console.log(`      🗂️  ${doc.data().name}`);
        batch.delete(doc.ref);
      });
      await batch.commit();
    } else if (report.contextSources > 0) {
      sourcesSnapshot.docs.forEach(doc => {
        console.log(`      🗂️  ${doc.data().name}`);
      });
    }
    console.log(`   ✅ Deleted ${report.contextSources} context sources`);
    console.log();

    // Step 4: Delete user settings
    console.log('4️⃣  Deleting user settings...');
    const settingsDoc = await firestore
      .collection(COLLECTIONS.USER_SETTINGS)
      .doc(userId)
      .get();

    if (settingsDoc.exists) {
      report.userSettings = 1;
      console.log(`   Found user settings`);
      if (!DRY_RUN) {
        await settingsDoc.ref.delete();
      }
    }
    console.log(`   ✅ Deleted ${report.userSettings} user settings`);
    console.log();

    // Step 5: Delete agent configs
    console.log('5️⃣  Deleting agent configs...');
    const agentConfigsSnapshot = await firestore
      .collection(COLLECTIONS.AGENT_CONFIGS)
      .where('userId', '==', userId)
      .get();

    report.agentConfigs = agentConfigsSnapshot.size;
    console.log(`   Found ${report.agentConfigs} agent configs`);

    if (!DRY_RUN && report.agentConfigs > 0) {
      const batch = firestore.batch();
      agentConfigsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    }
    console.log(`   ✅ Deleted ${report.agentConfigs} agent configs`);
    console.log();

    // Step 6: Delete conversation contexts
    console.log('6️⃣  Deleting conversation contexts...');
    const contextsSnapshot = await firestore
      .collection(COLLECTIONS.CONVERSATION_CONTEXT)
      .where('userId', '==', userId)
      .get();

    report.conversationContexts = contextsSnapshot.size;
    console.log(`   Found ${report.conversationContexts} conversation contexts`);

    if (!DRY_RUN && report.conversationContexts > 0) {
      const batch = firestore.batch();
      contextsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    }
    console.log(`   ✅ Deleted ${report.conversationContexts} conversation contexts`);
    console.log();

    // Step 7: Delete usage logs
    console.log('7️⃣  Deleting usage logs...');
    const logsSnapshot = await firestore
      .collection(COLLECTIONS.USAGE_LOGS)
      .where('userId', '==', userId)
      .get();

    report.usageLogs = logsSnapshot.size;
    console.log(`   Found ${report.usageLogs} usage logs`);

    if (!DRY_RUN && report.usageLogs > 0) {
      // Delete in batches (could be many logs)
      const batches = [];
      let currentBatch = firestore.batch();
      let operationCount = 0;

      for (const logDoc of logsSnapshot.docs) {
        currentBatch.delete(logDoc.ref);
        operationCount++;

        if (operationCount === 500) {
          batches.push(currentBatch);
          currentBatch = firestore.batch();
          operationCount = 0;
        }
      }
      if (operationCount > 0) {
        batches.push(currentBatch);
      }

      for (const batch of batches) {
        await batch.commit();
      }
    }
    console.log(`   ✅ Deleted ${report.usageLogs} usage logs`);
    console.log();

    // Step 8: Unassign from shared agents
    console.log('8️⃣  Unassigning from shared agents...');
    const sharesSnapshot = await firestore
      .collection(COLLECTIONS.AGENT_SHARES)
      .get();

    console.log(`   Examining ${sharesSnapshot.size} agent shares...`);

    let sharesUpdated = 0;

    for (const shareDoc of sharesSnapshot.docs) {
      const shareData = shareDoc.data();
      const sharedWith = shareData.sharedWith || [];

      // Check if this user is in sharedWith (by ID or email)
      const hasUserById = sharedWith.some((target: any) => 
        target.type === 'user' && target.id === userId
      );
      const hasUserByEmail = sharedWith.some((target: any) => 
        target.type === 'user' && target.email === TARGET_EMAIL
      );

      if (hasUserById || hasUserByEmail) {
        console.log(`   🔗 Found in share: ${shareDoc.id} (Agent: ${shareData.agentId})`);
        
        // Remove this user from sharedWith array
        const updatedSharedWith = sharedWith.filter((target: any) => {
          if (target.type !== 'user') return true; // Keep groups
          return target.id !== userId && target.email !== TARGET_EMAIL;
        });

        if (!DRY_RUN) {
          await shareDoc.ref.update({
            sharedWith: updatedSharedWith,
            updatedAt: new Date(),
          });
        }

        sharesUpdated++;
        console.log(`      ✅ Removed from share (${updatedSharedWith.length} targets remaining)`);
      }
    }

    report.agentSharesUnassigned = sharesUpdated;
    console.log(`   ✅ Unassigned from ${sharesUpdated} agent shares`);
    console.log();

    // Step 9: Delete user document
    console.log('9️⃣  Deleting user document...');
    if (!DRY_RUN) {
      await userDoc.ref.delete();
      report.userDeleted = true;
      console.log(`   ✅ User document deleted`);
    } else {
      console.log(`   🧪 Would delete user document (DRY RUN)`);
    }
    console.log();

    // Final Report
    console.log('='.repeat(60));
    console.log('📊 DELETION REPORT');
    console.log('='.repeat(60));
    console.log(`Email:                    ${report.email}`);
    console.log(`User ID:                  ${report.userId}`);
    console.log(`Conversations:            ${report.conversations}`);
    console.log(`Messages:                 ${report.messages}`);
    console.log(`Context Sources:          ${report.contextSources}`);
    console.log(`User Settings:            ${report.userSettings}`);
    console.log(`Agent Configs:            ${report.agentConfigs}`);
    console.log(`Conversation Contexts:    ${report.conversationContexts}`);
    console.log(`Usage Logs:               ${report.usageLogs}`);
    console.log(`Agent Shares Unassigned:  ${report.agentSharesUnassigned}`);
    console.log(`User Deleted:             ${report.userDeleted ? '✅ Yes' : '❌ No'}`);
    console.log('='.repeat(60));
    console.log();

    if (DRY_RUN) {
      console.log('🧪 DRY RUN COMPLETE - No data was actually deleted');
      console.log('💡 To perform actual deletion, run: DRY_RUN=false npx tsx scripts/delete-user-alec-salfacloud.ts');
    } else {
      console.log('✅ USER DELETION COMPLETE');
      console.log('');
      console.log('📝 Next Steps:');
      console.log('1. User can now login as new user');
      console.log('2. No previous data will be visible');
      console.log('3. User will see empty state');
      console.log('4. User can create fresh conversations and upload new context');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error during deletion:', error);
    
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack trace:', error.stack);
    }

    console.log();
    console.log('🔍 Troubleshooting:');
    console.log('1. Verify Firestore authentication: gcloud auth application-default login');
    console.log('2. Verify project ID in .env: GOOGLE_CLOUD_PROJECT=salfagpt');
    console.log('3. Check Firestore permissions for service account');

    process.exit(1);
  }
}

// Run the script
main();

