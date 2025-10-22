/**
 * Migration Script: Mark Legacy Conversations as Agents
 * 
 * Purpose: Update all conversations without isAgent field to isAgent: true
 * 
 * Rationale:
 * - Before the agent/chat architecture, all conversations were effectively "agents"
 * - They had their own context, configuration, and were independent
 * - This migration marks them explicitly to maintain backward compatibility
 * 
 * Run: node scripts/migrate-conversations-to-agents.mjs [--dry-run] [--user-id=XXX]
 */

import { Firestore } from '@google-cloud/firestore';

const firestore = new Firestore({
  projectId: process.env.GOOGLE_CLOUD_PROJECT || 'gen-lang-client-0986191192',
});

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const userIdArg = args.find(arg => arg.startsWith('--user-id='));
const targetUserId = userIdArg ? userIdArg.split('=')[1] : null;

console.log('🔄 Conversation to Agent Migration Script');
console.log('═'.repeat(80));
console.log(`Mode: ${isDryRun ? '🔍 DRY RUN (no changes)' : '✍️  WRITE MODE (will update Firestore)'}`);
console.log(`Target: ${targetUserId ? `User ${targetUserId}` : 'ALL users'}`);
console.log('═'.repeat(80));
console.log('');

async function migrateConversations() {
  try {
    // Build query
    let query = firestore.collection('conversations');
    
    if (targetUserId) {
      query = query.where('userId', '==', targetUserId);
    }
    
    const snapshot = await query.get();
    
    console.log(`📊 Found ${snapshot.size} total conversations`);
    console.log('');
    
    // Analyze conversations
    const conversationsToMigrate = [];
    const alreadyMarked = [];
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      
      if (data.isAgent === undefined) {
        // Legacy conversation without isAgent field
        conversationsToMigrate.push({
          id: doc.id,
          title: data.title,
          userId: data.userId,
          messageCount: data.messageCount || 0,
        });
      } else {
        // Already has isAgent field
        alreadyMarked.push({
          id: doc.id,
          title: data.title,
          isAgent: data.isAgent,
        });
      }
    });
    
    console.log('📋 Analysis:');
    console.log(`  ✅ Already marked: ${alreadyMarked.length} conversations`);
    console.log(`     • Explicit agents (isAgent: true): ${alreadyMarked.filter(c => c.isAgent === true).length}`);
    console.log(`     • Explicit chats (isAgent: false): ${alreadyMarked.filter(c => c.isAgent === false).length}`);
    console.log(`  🔄 Need migration: ${conversationsToMigrate.length} conversations`);
    console.log('');
    
    if (conversationsToMigrate.length === 0) {
      console.log('✅ No conversations need migration!');
      return;
    }
    
    // Show conversations that will be migrated
    console.log('🎯 Conversations to migrate (will be marked as isAgent: true):');
    console.log('');
    conversationsToMigrate.slice(0, 10).forEach((conv, index) => {
      console.log(`  ${index + 1}. "${conv.title}" (${conv.messageCount} mensajes)`);
    });
    
    if (conversationsToMigrate.length > 10) {
      console.log(`  ... and ${conversationsToMigrate.length - 10} more`);
    }
    
    console.log('');
    
    if (isDryRun) {
      console.log('🔍 DRY RUN MODE - No changes made');
      console.log('');
      console.log('To apply changes, run:');
      console.log(`  node scripts/migrate-conversations-to-agents.mjs ${targetUserId ? `--user-id=${targetUserId}` : ''}`);
      return;
    }
    
    // Confirm before proceeding
    console.log('⚠️  This will update Firestore documents.');
    console.log('');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Perform migration in batches
    const batchSize = 500; // Firestore batch limit
    let batch = firestore.batch();
    let batchCount = 0;
    let totalUpdated = 0;
    
    for (const conv of conversationsToMigrate) {
      const docRef = firestore.collection('conversations').doc(conv.id);
      
      batch.update(docRef, {
        isAgent: true,
        updatedAt: new Date(),
      });
      
      batchCount++;
      totalUpdated++;
      
      // Commit batch when full
      if (batchCount >= batchSize) {
        await batch.commit();
        console.log(`✅ Migrated ${totalUpdated} conversations...`);
        batch = firestore.batch();
        batchCount = 0;
      }
    }
    
    // Commit remaining
    if (batchCount > 0) {
      await batch.commit();
    }
    
    console.log('');
    console.log('═'.repeat(80));
    console.log(`✅ Migration Complete!`);
    console.log(`   Total conversations migrated: ${totalUpdated}`);
    console.log(`   All marked as: isAgent: true`);
    console.log('═'.repeat(80));
    console.log('');
    console.log('🎯 Next Steps:');
    console.log('  1. Refresh your application');
    console.log('  2. Verify conversations appear correctly');
    console.log('  3. Create new chats using "Nuevo Chat" button');
    console.log('  4. New chats will have isAgent: false automatically');
    
  } catch (error) {
    console.error('❌ Migration Error:', error.message);
    process.exit(1);
  }
}

migrateConversations();

