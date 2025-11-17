#!/usr/bin/env -S npx tsx
/**
 * Update Existing Ally with SuperPrompt
 * 
 * Finds Alec's Ally conversation and updates it with the new SuperPrompt
 */

import { firestore } from '../src/lib/firestore';

const ALEC_USER_ID = 'usr_uhwqffaqag1wrryd82tw';

async function main() {
  console.log('🔄 Updating existing Ally with SuperPrompt...');
  console.log('');
  
  try {
    // 1. Get active SuperPrompt
    console.log('1️⃣ Loading SuperPrompt...');
    const superPromptSnapshot = await firestore
      .collection('super_prompts')
      .where('isActive', '==', true)
      .limit(1)
      .get();
    
    if (superPromptSnapshot.empty) {
      console.error('❌ No active SuperPrompt found');
      console.log('💡 Run: npx tsx scripts/initialize-ally-prompts.ts first');
      process.exit(1);
    }
    
    const superPromptDoc = superPromptSnapshot.docs[0];
    const superPrompt = superPromptDoc.data().systemPrompt;
    
    console.log(`✅ SuperPrompt found: ${superPromptDoc.id}`);
    console.log(`   Length: ${superPrompt.length} characters`);
    console.log('');
    
    // 2. Find Alec's Ally
    console.log('2️⃣ Finding Alec Ally conversation...');
    const allySnapshot = await firestore
      .collection('conversations')
      .where('userId', '==', ALEC_USER_ID)
      .where('isAlly', '==', true)
      .limit(1)
      .get();
    
    if (allySnapshot.empty) {
      console.error('❌ Ally conversation not found for Alec');
      process.exit(1);
    }
    
    const allyDoc = allySnapshot.docs[0];
    const allyId = allyDoc.id;
    
    console.log(`✅ Ally found: ${allyId}`);
    console.log('');
    
    // 3. Update Ally with SuperPrompt
    console.log('3️⃣ Updating Ally systemPrompt...');
    await firestore
      .collection('conversations')
      .doc(allyId)
      .update({
        systemPrompt: superPrompt,
        updatedAt: new Date(),
      });
    
    console.log('✅ Ally systemPrompt updated in conversations collection');
    console.log('');
    
    // 4. Also update in agent_configs if it exists
    console.log('4️⃣ Updating agent_configs...');
    const configDoc = await firestore
      .collection('agent_configs')
      .doc(allyId)
      .get();
    
    if (configDoc.exists) {
      await firestore
        .collection('agent_configs')
        .doc(allyId)
        .update({
          agentPrompt: superPrompt,
          updatedAt: new Date(),
        });
      console.log('✅ Ally agentPrompt updated in agent_configs collection');
    } else {
      // Create config
      await firestore
        .collection('agent_configs')
        .doc(allyId)
        .set({
          conversationId: allyId,
          userId: ALEC_USER_ID,
          agentPrompt: superPrompt,
          model: 'gemini-2.5-flash',
          createdAt: new Date(),
          updatedAt: new Date(),
          source: 'localhost',
        });
      console.log('✅ Ally agent_configs created with SuperPrompt');
    }
    
    console.log('');
    console.log('🎉 ALLY SUCCESSFULLY UPDATED!');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Refresh page (F5)');
    console.log('  2. Click Ally');
    console.log('  3. Ask: "¿Qué puedo preguntarte?"');
    console.log('  4. Verify response is specific to Flow platform');
    console.log('');
    console.log('Expected: Ally mentions Flow, agents (M001, S001, etc.), and specific features');
    console.log('NOT: Generic "I am an AI model" response');
    console.log('');
    
  } catch (error) {
    console.error('❌ Update failed:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

main();

