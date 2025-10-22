/**
 * Script: Activate All Assigned Sources for All Agents
 * 
 * Purpose: For each agent, activate all sources that are assigned to it
 * 
 * Run: npx tsx scripts/activate-all-assigned-sources.ts
 */

import { firestore, COLLECTIONS } from '../src/lib/firestore.js';

async function activateAllAssignedSources() {
  console.log('🚀 Activating all assigned sources for all agents...\n');

  try {
    // 1. Get all conversations (agents and chats)
    const conversationsSnapshot = await firestore
      .collection(COLLECTIONS.CONVERSATIONS)
      .get();

    console.log(`📋 Found ${conversationsSnapshot.size} conversations (agents + chats)\n`);

    // 2. Get all context sources
    const sourcesSnapshot = await firestore
      .collection(COLLECTIONS.CONTEXT_SOURCES)
      .get();

    const allSources = sourcesSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      assignedToAgents: doc.data().assignedToAgents || []
    }));

    console.log(`📚 Found ${allSources.length} context sources\n`);

    let agentsProcessed = 0;
    let sourcesActivated = 0;

    // 3. For each conversation
    for (const convDoc of conversationsSnapshot.docs) {
      const convId = convDoc.id;
      const convData = convDoc.data();
      const isAgent = convData.isAgent !== false; // Default to true if not specified

      // Find sources assigned to this conversation
      const assignedSources = allSources.filter(source =>
        source.assignedToAgents.includes(convId)
      );

      if (assignedSources.length === 0) {
        continue; // Skip if no sources assigned
      }

      // Get current active source IDs
      const contextRef = firestore
        .collection(COLLECTIONS.CONVERSATION_CONTEXT)
        .doc(convId);

      const contextDoc = await contextRef.get();
      const currentActiveIds = contextDoc.exists
        ? (contextDoc.data()?.activeContextSourceIds || [])
        : [];

      // Activate all assigned sources
      const sourceIdsToActivate = assignedSources.map(s => s.id);
      
      // Merge with existing active IDs (don't remove already active ones)
      const allActiveIds = Array.from(new Set([...currentActiveIds, ...sourceIdsToActivate]));

      // Update or create conversation_context document
      if (contextDoc.exists) {
        await contextRef.update({
          activeContextSourceIds: allActiveIds,
          updatedAt: new Date(),
        });
      } else {
        await contextRef.set({
          conversationId: convId,
          userId: convData.userId,
          activeContextSourceIds: allActiveIds,
          lastUsedAt: new Date(),
          updatedAt: new Date(),
          source: 'localhost'
        });
      }

      const newlyActivated = allActiveIds.length - currentActiveIds.length;

      console.log(`✅ ${isAgent ? 'Agente' : 'Chat'}: ${convData.title || convId}`);
      console.log(`   ID: ${convId}`);
      console.log(`   Fuentes asignadas: ${assignedSources.length}`);
      console.log(`   Ya activas: ${currentActiveIds.length}`);
      console.log(`   Recién activadas: ${newlyActivated}`);
      console.log(`   Total activas ahora: ${allActiveIds.length}\n`);

      agentsProcessed++;
      sourcesActivated += newlyActivated;
    }

    console.log('🎉 COMPLETE!');
    console.log(`   Agentes/Chats procesados: ${agentsProcessed}`);
    console.log(`   Fuentes activadas (nuevas): ${sourcesActivated}`);
    console.log(`   Total operaciones: ${agentsProcessed}`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// Run the script
activateAllAssignedSources()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

