/**
 * Migration Script: Update assignedToAgents field on context_sources
 * 
 * Problem: Agent-based search fails because assignedToAgents field was not being set
 * Solution: For each conversation, update its active sources to include the conversation ID
 * 
 * Run with: npx tsx scripts/migrate-assigned-to-agents.ts
 */

import { firestore, COLLECTIONS } from '../src/lib/firestore';
import { FieldValue } from '@google-cloud/firestore';

async function migrateAssignedToAgents() {
  console.log('🔧 Starting assignedToAgents migration...\n');
  
  try {
    // 1. Get all conversations (agents and chats)
    console.log('📊 Step 1: Loading all conversations...');
    const conversationsSnapshot = await firestore
      .collection(COLLECTIONS.CONVERSATIONS)
      .get();
    
    console.log(`✅ Found ${conversationsSnapshot.size} conversations\n`);
    
    // 2. Process each conversation
    let processed = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const doc of conversationsSnapshot.docs) {
      processed++;
      const conversation = doc.data();
      const conversationId = doc.id;
      const activeSourceIds = conversation.activeContextSourceIds || [];
      
      if (activeSourceIds.length === 0) {
        skipped++;
        if (processed % 10 === 0) {
          console.log(`⏭️  [${processed}/${conversationsSnapshot.size}] Skipped ${conversation.title}: no active sources`);
        }
        continue;
      }
      
      try {
        // Update each source's assignedToAgents field
        const batch = firestore.batch();
        
        for (const sourceId of activeSourceIds) {
          const sourceRef = firestore.collection(COLLECTIONS.CONTEXT_SOURCES).doc(sourceId);
          
          // Use arrayUnion to add conversation ID without duplicates
          batch.update(sourceRef, {
            assignedToAgents: FieldValue.arrayUnion(conversationId),
            updatedAt: new Date(),
          });
        }
        
        await batch.commit();
        updated++;
        
        console.log(`✅ [${processed}/${conversationsSnapshot.size}] Updated ${conversation.title}: ${activeSourceIds.length} sources`);
      } catch (error) {
        errors++;
        console.error(`❌ [${processed}/${conversationsSnapshot.size}] Error for ${conversation.title}:`, error);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary:');
    console.log('='.repeat(60));
    console.log(`Total conversations processed: ${processed}`);
    console.log(`Conversations updated: ${updated}`);
    console.log(`Conversations skipped (no sources): ${skipped}`);
    console.log(`Errors encountered: ${errors}`);
    console.log('='.repeat(60));
    console.log('\n✅ Migration complete!');
    
    if (errors > 0) {
      console.warn(`\n⚠️  ${errors} errors occurred. Check logs above for details.`);
      process.exit(1);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateAssignedToAgents();

