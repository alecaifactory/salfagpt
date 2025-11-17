/**
 * Archive Folder Migration Script
 * 
 * Purpose: Organize existing archived conversations into proper categories
 * Categories: ally, agents, projects, conversations
 * 
 * Run: npx tsx scripts/migrate-archive-folders.ts [--dry-run] [--user=userId]
 */

import { firestore } from '../src/lib/firestore.js';

interface LegacyConversation {
  id: string;
  userId: string;
  title: string;
  status?: string;
  isAgent?: boolean;
  isAlly?: boolean;
  folderId?: string;
  archivedFolder?: string;
  archivedAt?: any;
}

// Detect archive category based on conversation properties
function detectArchiveCategory(conv: LegacyConversation): 'ally' | 'agents' | 'projects' | 'conversations' {
  if (conv.isAlly) {
    return 'ally';
  }
  if (conv.isAgent) {
    return 'agents';
  }
  if (conv.folderId) {
    return 'projects';
  }
  return 'conversations';
}

async function migrateArchiveFolders(dryRun: boolean = true, specificUserId?: string) {
  console.log('🗂️  Archive Folder Migration');
  console.log('============================');
  console.log(`Mode: ${dryRun ? '🔍 DRY RUN' : '🚀 EXECUTE'}`);
  if (specificUserId) {
    console.log(`User: ${specificUserId}`);
  }
  console.log('');
  
  try {
    // 1. Get all archived conversations
    let query = firestore
      .collection('conversations')
      .where('status', '==', 'archived');
    
    if (specificUserId) {
      query = query.where('userId', '==', specificUserId);
    }
    
    const snapshot = await query.get();
    console.log(`📊 Found ${snapshot.size} archived conversations`);
    
    if (snapshot.empty) {
      console.log('✅ No archived conversations to migrate');
      return;
    }
    
    // 2. Analyze and categorize
    const categories = {
      ally: [] as LegacyConversation[],
      agents: [] as LegacyConversation[],
      projects: [] as LegacyConversation[],
      conversations: [] as LegacyConversation[],
      needsCategory: [] as LegacyConversation[], // Already has archivedFolder
    };
    
    const conversationsToMigrate: Array<{ id: string; data: LegacyConversation; category: string }> = [];
    
    snapshot.docs.forEach(doc => {
      const data = doc.data() as LegacyConversation;
      const conv = { id: doc.id, ...data };
      
      // Check if already categorized
      if (data.archivedFolder) {
        categories.needsCategory.push(conv);
      } else {
        const category = detectArchiveCategory(conv);
        categories[category].push(conv);
        conversationsToMigrate.push({ id: doc.id, data: conv, category });
      }
    });
    
    // 3. Display statistics
    console.log('\n📊 Archive Distribution:');
    console.log(`   Ally: ${categories.ally.length}`);
    console.log(`   Agents: ${categories.agents.length}`);
    console.log(`   Projects: ${categories.projects.length}`);
    console.log(`   Conversations: ${categories.conversations.length}`);
    console.log(`   Already categorized: ${categories.needsCategory.length}`);
    console.log(`   Need migration: ${conversationsToMigrate.length}`);
    
    if (conversationsToMigrate.length === 0) {
      console.log('\n✅ All archived conversations already have categories!');
      return;
    }
    
    // 4. Show sample data
    console.log('\n📋 Sample migrations:');
    conversationsToMigrate.slice(0, 5).forEach(({ id, data, category }) => {
      console.log(`   ${category}: ${data.title} (${id})`);
    });
    
    if (dryRun) {
      console.log('\n🔍 DRY RUN MODE - No changes made');
      console.log('   To execute migration, run:');
      console.log('   npx tsx scripts/migrate-archive-folders.ts --execute');
      return;
    }
    
    // 5. Execute migration
    console.log('\n🚀 Executing migration...');
    
    const BATCH_SIZE = 500;
    let migrated = 0;
    
    for (let i = 0; i < conversationsToMigrate.length; i += BATCH_SIZE) {
      const batch = firestore.batch();
      const batchItems = conversationsToMigrate.slice(i, Math.min(i + BATCH_SIZE, conversationsToMigrate.length));
      
      for (const { id, category } of batchItems) {
        const ref = firestore.collection('conversations').doc(id);
        batch.update(ref, {
          archivedFolder: category,
          archivedAt: new Date(), // Set if not already set
          updatedAt: new Date(),
        });
        migrated++;
      }
      
      await batch.commit();
      console.log(`✅ Migrated ${migrated}/${conversationsToMigrate.length} conversations`);
    }
    
    console.log('\n🎉 Migration complete!');
    console.log(`   Total migrated: ${migrated}`);
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = !args.includes('--execute');
const userArg = args.find(arg => arg.startsWith('--user='));
const specificUserId = userArg ? userArg.split('=')[1] : undefined;

// Run migration
migrateArchiveFolders(dryRun, specificUserId)
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

