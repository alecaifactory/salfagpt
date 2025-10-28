#!/usr/bin/env tsx
/**
 * Migration Script: Add default agentPrompt to existing conversations
 * 
 * This script adds a default agent prompt to all existing conversations that don't have one.
 * Backward compatible: Preserves existing systemPrompt if it exists.
 * 
 * Usage: npx tsx scripts/migrate-agent-prompts.ts
 */

import { firestore, COLLECTIONS } from '../src/lib/firestore.js';

const DEFAULT_AGENT_PROMPT = 'Eres un asistente de IA útil y profesional que responde en español.';

async function migrateAgentPrompts() {
  console.log('🚀 Starting agent prompt migration...\n');
  
  try {
    // Get all conversations
    const conversationsSnapshot = await firestore
      .collection(COLLECTIONS.CONVERSATIONS)
      .get();
    
    console.log(`📊 Found ${conversationsSnapshot.size} total conversations\n`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const doc of conversationsSnapshot.docs) {
      const conversationId = doc.id;
      const conversationData = doc.data();
      
      try {
        // Check if agent config already exists
        const agentConfigDoc = await firestore
          .collection(COLLECTIONS.AGENT_CONFIGS)
          .doc(conversationId)
          .get();
        
        if (agentConfigDoc.exists) {
          const configData = agentConfigDoc.data();
          
          // Skip if agentPrompt already set
          if (configData?.agentPrompt) {
            console.log(`⏭️  Skipping ${conversationData.title}: Already has agentPrompt`);
            skippedCount++;
            continue;
          }
          
          // If systemPrompt exists but no agentPrompt, copy it
          if (configData?.systemPrompt) {
            await firestore
              .collection(COLLECTIONS.AGENT_CONFIGS)
              .doc(conversationId)
              .update({
                agentPrompt: configData.systemPrompt,
                updatedAt: new Date(),
              });
            
            console.log(`✅ Migrated ${conversationData.title}: Copied systemPrompt to agentPrompt`);
            updatedCount++;
            continue;
          }
        }
        
        // Create new agent config with default prompt
        await firestore
          .collection(COLLECTIONS.AGENT_CONFIGS)
          .doc(conversationId)
          .set({
            conversationId: conversationId,
            userId: conversationData.userId,
            model: conversationData.agentModel || 'gemini-2.5-flash',
            agentPrompt: DEFAULT_AGENT_PROMPT,
            createdAt: new Date(),
            updatedAt: new Date(),
            source: 'localhost', // Migration happened locally
          });
        
        console.log(`✅ Created default config for ${conversationData.title}`);
        updatedCount++;
        
      } catch (error: any) {
        console.error(`❌ Error processing ${conversationData.title}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Updated: ${updatedCount}`);
    console.log(`   ⏭️  Skipped: ${skippedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📄 Total: ${conversationsSnapshot.size}`);
    
    if (errorCount === 0) {
      console.log('\n🎉 Migration completed successfully!');
    } else {
      console.log('\n⚠️  Migration completed with some errors. Review logs above.');
    }
    
  } catch (error: any) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateAgentPrompts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

