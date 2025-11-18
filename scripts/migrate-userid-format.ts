#!/usr/bin/env tsx
/**
 * Migrate userId from Numeric to Hash Format
 * 
 * Updates userId field in specified collection from Google OAuth numeric ID
 * to hash format (usr_xxx), while preserving original ID in googleUserId field.
 * 
 * Usage:
 *   npm run migrate:userid -- --collection=context_sources --dry-run
 *   npm run migrate:userid -- --collection=context_sources --execute
 */

import { firestore } from '../src/lib/firestore.js';

// User ID mapping - discovered from users collection
const USER_MAPPING: Record<string, string> = {
  '114671162830729001607': 'usr_uhwqffaqag1wrryd82tw',
  // Add more mappings as discovered
};

interface MigrationOptions {
  collection: string;
  dryRun: boolean;
  batchSize: number;
}

async function discoverUserMappings(): Promise<Record<string, string>> {
  console.log('🔍 Discovering user ID mappings from users collection...\n');
  
  const usersSnap = await firestore.collection('users').get();
  const mappings: Record<string, string> = {};
  
  usersSnap.docs.forEach(doc => {
    const user = doc.data();
    if (user.googleUserId) {
      mappings[user.googleUserId] = doc.id;
      console.log(`  ✅ ${user.email || 'Unknown'}`);
      console.log(`     ${user.googleUserId} → ${doc.id}`);
    }
  });
  
  console.log(`\n📊 Found ${Object.keys(mappings).length} user mappings\n`);
  return mappings;
}

async function migrateCollection(options: MigrationOptions): Promise<number> {
  const { collection, dryRun, batchSize } = options;
  
  console.log('🔄 Migration Configuration');
  console.log('='.repeat(80));
  console.log(`Collection: ${collection}`);
  console.log(`Mode: ${dryRun ? '🔍 DRY RUN' : '🚀 LIVE EXECUTION'}`);
  console.log(`Batch size: ${batchSize}`);
  console.log('='.repeat(80));
  console.log('');
  
  // Discover mappings
  const mappings = await discoverUserMappings();
  
  if (Object.keys(mappings).length === 0) {
    console.error('❌ No user mappings found! Ensure users have googleUserId field.');
    process.exit(1);
  }
  
  let totalMigrated = 0;
  let totalErrors = 0;
  
  for (const [googleId, hashId] of Object.entries(mappings)) {
    console.log(`\n📝 Migrating userId: ${googleId} → ${hashId}`);
    console.log('-'.repeat(80));
    
    let lastDoc: any = null;
    let batchNumber = 0;
    
    while (true) {
      batchNumber++;
      console.log(`  Batch ${batchNumber}...`);
      
      // Build query
      let query = firestore
        .collection(collection)
        .where('userId', '==', googleId)
        .limit(batchSize);
      
      if (lastDoc) {
        query = query.startAfter(lastDoc);
      }
      
      const snapshot = await query.get();
      
      if (snapshot.empty) {
        console.log(`  ✅ No more documents for this userId`);
        break;
      }
      
      console.log(`    Found ${snapshot.size} documents`);
      
      if (dryRun) {
        // Dry run - just count
        console.log(`    🔍 DRY RUN: Would update ${snapshot.size} documents`);
        
        // Show first 3 as examples
        snapshot.docs.slice(0, 3).forEach((doc, i) => {
          const data = doc.data();
          console.log(`      Example ${i+1}: ${data.name || doc.id}`);
          console.log(`        Current userId: ${data.userId}`);
          console.log(`        New userId: ${hashId}`);
        });
      } else {
        // Live execution
        try {
          const batch = firestore.batch();
          
          snapshot.docs.forEach(doc => {
            batch.update(doc.ref, {
              userId: hashId,
              googleUserId: googleId, // Preserve original
              migratedAt: new Date(),
              migrationVersion: '2025-11-15',
            });
          });
          
          await batch.commit();
          console.log(`    ✅ Migrated ${snapshot.size} documents`);
        } catch (error) {
          console.error(`    ❌ Error migrating batch:`, error);
          totalErrors++;
        }
      }
      
      totalMigrated += snapshot.size;
      lastDoc = snapshot.docs[snapshot.docs.length - 1];
      
      // Progress update
      console.log(`    Progress: ${totalMigrated} total documents processed`);
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 MIGRATION SUMMARY');
  console.log('='.repeat(80));
  console.log(`Collection: ${collection}`);
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Documents processed: ${totalMigrated}`);
  console.log(`Errors: ${totalErrors}`);
  console.log('='.repeat(80));
  
  if (dryRun) {
    console.log('\n💡 To execute migration, run:');
    console.log(`   npm run migrate:userid -- --collection=${collection} --execute`);
  } else {
    console.log('\n✅ Migration complete!');
    console.log('\n📝 Next steps:');
    console.log('1. Verify: npm run verify:userid-formats');
    console.log('2. Test: Manual testing of affected features');
    console.log('3. Deploy: Push changes to production');
  }
  
  return totalMigrated;
}

// Parse command line arguments
const args = process.argv.slice(2);
const collectionArg = args.find(arg => arg.startsWith('--collection='));
const executeFlag = args.includes('--execute');

if (!collectionArg) {
  console.error('❌ Missing required argument: --collection');
  console.error('');
  console.error('Usage:');
  console.error('  npm run migrate:userid -- --collection=<name> --dry-run');
  console.error('  npm run migrate:userid -- --collection=<name> --execute');
  console.error('');
  console.error('Examples:');
  console.error('  npm run migrate:userid -- --collection=context_sources --dry-run');
  console.error('  npm run migrate:userid -- --collection=document_chunks --execute');
  process.exit(1);
}

const collection = collectionArg.split('=')[1];

const options: MigrationOptions = {
  collection,
  dryRun: !executeFlag,
  batchSize: 500,
};

console.log('\n');
migrateCollection(options)
  .then(count => {
    console.log(`\n🎉 Completed: ${count} documents processed\n`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });





