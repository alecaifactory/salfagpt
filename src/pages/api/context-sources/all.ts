import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { firestore, COLLECTIONS } from '../../../lib/firestore';

/**
 * GET /api/context-sources/all
 * Get ALL context sources from the system (superadmin only)
 * 
 * This endpoint returns all context sources regardless of user,
 * enriched with uploader information and assigned agents.
 * 
 * Security: Only accessible by alec@getaifactory.com
 */
export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    // 1. Verify authentication
    const session = getSession({ cookies });
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Please login' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. SECURITY: Only superadmin can access
    if (session.email !== 'alec@getaifactory.com') {
      console.warn('🚨 Unauthorized access attempt to /api/context-sources/all:', session.email);
      return new Response(
        JSON.stringify({ error: 'Forbidden - Superadmin access only' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('📊 Fetching all context sources for superadmin:', session.email);

    // 3. Fetch ALL context sources
    const sourcesSnapshot = await firestore
      .collection(COLLECTIONS.CONTEXT_SOURCES)
      .orderBy('addedAt', 'desc')
      .get();

    // 4. Fetch all conversations to map agent assignments
    const conversationsSnapshot = await firestore
      .collection(COLLECTIONS.CONVERSATIONS)
      .get();

    const conversationsMap = new Map();
    conversationsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      conversationsMap.set(doc.id, {
        id: doc.id,
        title: data.title,
        userId: data.userId,
      });
    });

    // 5. Fetch users to get uploader emails
    const usersSnapshot = await firestore
      .collection(COLLECTIONS.USERS)
      .get();

    const usersMap = new Map();
    usersSnapshot.docs.forEach(doc => {
      const data = doc.data();
      usersMap.set(doc.id, data.email || doc.id);
    });

    // 6. Enrich sources with uploader and agent info
    const enrichedSources = sourcesSnapshot.docs.map(doc => {
      const source = doc.data();
      const sourceId = doc.id;
      
      // Find uploader email
      const uploaderEmail = usersMap.get(source.userId);
      
      // Find assigned agents
      const assignedAgents = (source.assignedToAgents || [])
        .map((agentId: string) => conversationsMap.get(agentId))
        .filter(Boolean);

      return {
        id: sourceId,
        ...source,
        uploaderEmail,
        assignedAgents,
      };
    });

    console.log('✅ Returning', enrichedSources.length, 'context sources');

    return new Response(
      JSON.stringify({
        sources: enrichedSources,
        total: enrichedSources.length,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Error in /api/context-sources/all:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to fetch context sources',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

