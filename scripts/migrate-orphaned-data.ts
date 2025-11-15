#!/usr/bin/env tsx
/**
 * Migrate Orphaned Data to Hash UserIDs
 * 
 * Finds conversations and context sources with legacy numeric userIds
 * Maps them to current hash format userIds
 * Updates documents in Firestore
 */

import { firestore, COLLECTIONS, getUserById } from '../src/lib/firestore';

// Known mappings (from Google OAuth IDs)
const KNOWN_LEGACY_MAPPINGS: Record<string, string> = {
  '114671162830729001607': 'usr_uhwqffaqag1wrryd82tw', // alec@getaifactory.com
  '107892250687596740790': 'usr_l1fiahiqkuj9i39miwib', // alecdickinson@gmail.com (if exists)
  // Add more as discovered
};

async function migrateOrphanedData(dryRun = true) {
  console.log(`🔄 Starting orphaned data migration (${dryRun ? 'DRY RUN' : 'LIVE'})\n`);
  
  let conversationsMigrated = 0;
  let sourcesMigrated = 0;
  let errors = 0;
  
  // 1. Migrate conversations
  console.log('📝 Checking conversations...');
  const convsSnapshot = await firestore.collection(COLLECTIONS.CONVERSATIONS).get();
  
  for (const doc of convsSnapshot.docs) {
    const data = doc.data();
    const userId = data.userId;
    
    // Skip if already hash format
    if (userId.startsWith('usr_')) continue;
    
    // Check if it's a numeric legacy ID
    if (/^\d+$/.test(userId)) {
      // Try known mapping first
      let newUserId = KNOWN_LEGACY_MAPPINGS[userId];
      
      // If not in known mappings, try getUserById fallback
      if (!newUserId) {
        const user = await getUserById(userId);
        newUserId = user?.id;
      }
      
      if (newUserId) {
        console.log(`  🔄 Conversation ${doc.id}: ${userId} → ${newUserId}`);
        
        if (!dryRun) {
          await doc.ref.update({ userId: newUserId });
        }
        
        conversationsMigrated++;
      } else {
        console.error(`  ❌ No mapping found for userId: ${userId} (conversation: ${doc.id})`);
        errors++;
      }
    }
  }
  
  // 2. Migrate context sources
  console.log('\n📚 Checking context sources...');
  const sourcesSnapshot = await firestore.collection(COLLECTIONS.CONTEXT_SOURCES).get();
  
  for (const doc of sourcesSnapshot.docs) {
    const data = doc.data();
    const userId = data.userId;
    
    // Skip if already hash format
    if (userId?.startsWith('usr_')) continue;
    
    // Check if it's a numeric legacy ID
    if (userId && /^\d+$/.test(userId)) {
      // Try known mapping first
      let newUserId = KNOWN_LEGACY_MAPPINGS[userId];
      
      // If not in known mappings, try getUserById fallback
      if (!newUserId) {
        const user = await getUserById(userId);
        newUserId = user?.id;
      }
      
      if (newUserId) {
        console.log(`  🔄 Source ${doc.id} (${data.name}): ${userId} → ${newUserId}`);
        
        if (!dryRun) {
          await doc.ref.update({ userId: newUserId });
        }
        
        sourcesMigrated++;
      } else {
        console.error(`  ❌ No mapping found for userId: ${userId} (source: ${doc.id})`);
        errors++;
      }
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 MIGRATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes made)' : 'LIVE (changes applied)'}`);
  console.log(`Conversations migrated: ${conversationsMigrated}`);
  console.log(`Context sources migrated: ${sourcesMigrated}`);
  console.log(`Errors: ${errors}`);
  
  if (dryRun) {
    console.log('\n💡 Run with --live flag to apply changes:');
    console.log('   npx tsx scripts/migrate-orphaned-data.ts --live');
  } else {
    console.log('\n✅ Migration complete!');
  }
  
  return { conversationsMigrated, sourcesMigrated, errors };
}

// Main
const isLive = process.argv.includes('--live');
migrateOrphanedData(!isLive)
  .then(result => {
    process.exit(result.errors > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });

