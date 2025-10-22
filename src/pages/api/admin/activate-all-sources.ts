import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { firestore, COLLECTIONS } from '../../../lib/firestore';

/**
 * POST /api/admin/activate-all-sources
 * Activate all assigned sources for all agents
 * 
 * Security: Admin only
 */
export const POST: APIRoute = async (context) => {
  try {
    // 1. Verify authentication
    const session = getSession(context);
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Please login' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Get all conversations for this user
    const conversationsSnapshot = await firestore
      .collection(COLLECTIONS.CONVERSATIONS)
      .where('userId', '==', session.id)
      .get();

    console.log(`📋 Found ${conversationsSnapshot.size} conversations for user ${session.id}\n`);

    // 3. Get all context sources for this user
    const sourcesSnapshot = await firestore
      .collection(COLLECTIONS.CONTEXT_SOURCES)
      .where('userId', '==', session.id)
      .get();

    const allSources = sourcesSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      assignedToAgents: doc.data().assignedToAgents || []
    }));

    console.log(`📚 Found ${allSources.length} context sources\n`);

    let agentsProcessed = 0;
    let sourcesActivated = 0;
    const results = [];

    // 4. For each conversation
    for (const convDoc of conversationsSnapshot.docs) {
      const convId = convDoc.id;
      const convData = convDoc.data();
      const isAgent = convData.isAgent !== false;

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
      
      // Merge with existing active IDs
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
          userId: session.id,
          activeContextSourceIds: allActiveIds,
          lastUsedAt: new Date(),
          updatedAt: new Date(),
          source: 'localhost'
        });
      }

      const newlyActivated = allActiveIds.length - currentActiveIds.length;

      results.push({
        id: convId,
        title: convData.title,
        type: isAgent ? 'agent' : 'chat',
        sourcesAssigned: assignedSources.length,
        previouslyActive: currentActiveIds.length,
        newlyActivated,
        totalActive: allActiveIds.length
      });

      console.log(`✅ ${isAgent ? 'Agente' : 'Chat'}: ${convData.title}`);
      console.log(`   Fuentes asignadas: ${assignedSources.length}`);
      console.log(`   Recién activadas: ${newlyActivated}`);
      console.log(`   Total activas: ${allActiveIds.length}\n`);

      agentsProcessed++;
      sourcesActivated += newlyActivated;
    }

    console.log('🎉 COMPLETE!');
    console.log(`   Agentes/Chats procesados: ${agentsProcessed}`);
    console.log(`   Fuentes activadas (nuevas): ${sourcesActivated}`);

    return new Response(
      JSON.stringify({
        success: true,
        agentsProcessed,
        sourcesActivated,
        results
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

