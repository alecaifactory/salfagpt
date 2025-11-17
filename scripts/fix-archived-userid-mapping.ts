/**
 * Fix Archived Conversations User ID Mapping
 * 
 * Problem: Archived conversations may have googleUserId (numeric) instead of hashId (usr_xxx)
 * Solution: Update all archived conversations to use hashId from users collection
 * 
 * Run: npx tsx scripts/fix-archived-userid-mapping.ts [--dry-run]
 */

import { firestore } from '../src/lib/firestore';

interface UserMapping {
  hashId: string; // usr_xxx (document ID)
  googleId: string; // numeric OAuth ID
  email: string;
}

async function buildUserMappings(): Promise<Map<string, UserMapping>> {
  console.log('🔑 Building user ID mappings...');
  
  const usersSnapshot = await firestore.collection('users').get();
  const mappings = new Map<string, UserMapping>();
  
  usersSnapshot.docs.forEach(doc => {
    const data = doc.data();
    const googleId = data.googleUserId;
    
    if (googleId) {
      mappings.set(googleId, {
        hashId: doc.id,
        googleId,
        email: data.email,
      });
      
      // Also map by email-based ID (e.g., alec_getaifactory_com)
      const emailBasedId = data.email.replace(/@/g, '_').replace(/\./g, '_');
      mappings.set(emailBasedId, {
        hashId: doc.id,
        googleId,
        email: data.email,
      });
    }
  });
  
  console.log(`✅ Built ${mappings.size} user ID mappings\n`);
  return mappings;
}

async function fixArchivedUserIds(dryRun: boolean = true) {
  console.log('🔧 Fix Archived Conversations User ID Mapping');
  console.log('=============================================');
  console.log(`Mode: ${dryRun ? '🔍 DRY RUN' : '🚀 EXECUTE'}`);
  console.log('');
  
  try {
    // 1. Build user mappings
    const userMappings = await buildUserMappings();
    
    // 2. Get all archived conversations
    const archivedSnapshot = await firestore
      .collection('conversations')
      .where('status', '==', 'archived')
      .get();
    
    console.log(`📊 Found ${archivedSnapshot.size} archived conversations\n`);
    
    if (archivedSnapshot.empty) {
      console.log('✅ No archived conversations found');
      return;
    }
    
    // 3. Analyze userId formats
    const analysis = {
      hashFormat: [] as { id: string; userId: string; title: string }[],
      googleFormat: [] as { id: string; userId: string; title: string; mapping?: UserMapping }[],
      emailFormat: [] as { id: string; userId: string; title: string; mapping?: UserMapping }[],
      unknown: [] as { id: string; userId: string; title: string }[],
    };
    
    archivedSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const userId = data.userId;
      const title = data.title || 'Untitled';
      
      if (userId.startsWith('usr_')) {
        // Already in correct format
        analysis.hashFormat.push({ id: doc.id, userId, title });
      } else if (userId.match(/^\d+$/)) {
        // Google numeric ID
        const mapping = userMappings.get(userId);
        analysis.googleFormat.push({ id: doc.id, userId, title, mapping });
      } else if (userId.includes('_')) {
        // Email-based ID
        const mapping = userMappings.get(userId);
        analysis.emailFormat.push({ id: doc.id, userId, title, mapping });
      } else {
        analysis.unknown.push({ id: doc.id, userId, title });
      }
    });
    
    // 4. Display analysis
    console.log('📊 User ID Format Analysis:');
    console.log(`   ✅ Hash format (usr_xxx): ${analysis.hashFormat.length} (correct)`);
    console.log(`   🔧 Google numeric: ${analysis.googleFormat.length} (need fix)`);
    console.log(`   🔧 Email-based: ${analysis.emailFormat.length} (need fix)`);
    console.log(`   ⚠️  Unknown format: ${analysis.unknown.length}`);
    console.log('');
    
    // 5. Show what will be migrated
    const needsFix = [...analysis.googleFormat, ...analysis.emailFormat];
    
    if (needsFix.length === 0) {
      console.log('✅ All archived conversations already use hash format!');
      return;
    }
    
    console.log(`🔧 Conversations needing userId update: ${needsFix.length}\n`);
    
    // Show samples
    console.log('📋 Sample conversions:');
    needsFix.slice(0, 10).forEach(({ id, userId, title, mapping }) => {
      if (mapping) {
        console.log(`   ${userId} → ${mapping.hashId}`);
        console.log(`      ${title} (${mapping.email})`);
      } else {
        console.log(`   ${userId} → ❌ NO MAPPING FOUND`);
        console.log(`      ${title}`);
      }
    });
    
    // Check for missing mappings
    const missingMappings = needsFix.filter(item => !item.mapping);
    if (missingMappings.length > 0) {
      console.log(`\n⚠️  WARNING: ${missingMappings.length} conversations have no user mapping!`);
      console.log('   These will be skipped. Check users collection.');
    }
    
    if (dryRun) {
      console.log('\n🔍 DRY RUN MODE - No changes made');
      console.log('   To execute migration, run:');
      console.log('   npx tsx scripts/fix-archived-userid-mapping.ts --execute');
      return;
    }
    
    // 6. Execute migration
    console.log('\n🚀 Executing migration...');
    
    const BATCH_SIZE = 500;
    let migrated = 0;
    let skipped = 0;
    
    const itemsToMigrate = needsFix.filter(item => item.mapping);
    
    for (let i = 0; i < itemsToMigrate.length; i += BATCH_SIZE) {
      const batch = firestore.batch();
      const batchItems = itemsToMigrate.slice(i, Math.min(i + BATCH_SIZE, itemsToMigrate.length));
      
      for (const { id, userId, mapping } of batchItems) {
        if (!mapping) {
          skipped++;
          continue;
        }
        
        const ref = firestore.collection('conversations').doc(id);
        batch.update(ref, {
          userId: mapping.hashId, // ✅ Update to hash format
          _migratedUserId: true,
          _originalUserId: userId, // Keep for reference
          updatedAt: new Date(),
        });
        migrated++;
      }
      
      await batch.commit();
      console.log(`✅ Migrated ${migrated}/${itemsToMigrate.length} conversations`);
    }
    
    console.log('\n🎉 Migration complete!');
    console.log(`   ✅ Migrated: ${migrated}`);
    console.log(`   ⏭️  Skipped (no mapping): ${skipped}`);
    console.log(`   📊 Already correct: ${analysis.hashFormat.length}`);
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  }
}

// Parse arguments
const args = process.argv.slice(2);
const dryRun = !args.includes('--execute');
const userArg = args.find(arg => arg.startsWith('--user='));
const specificUserId = userArg ? userArg.split('=')[1] : undefined;

// Run migration
fixArchivedUserIds(dryRun, specificUserId)
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

