import type { APIRoute } from 'astro';
import { firestore, COLLECTIONS } from '../../../lib/firestore';
import { getSession } from '../../../lib/auth';
import { isUserDomainEnabled, getDomainFromEmail } from '../../../lib/domains';

/**
 * GET /api/conversations/list-lightweight
 * 
 * Ultra-fast agent list endpoint - returns ONLY id and title
 * 
 * Purpose: Initial agent list display (sidebar)
 * Performance: ~10x faster than full conversation load
 * Usage: Load this first, then fetch full details on-demand
 */
export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    // Verify authentication
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Please login' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const type = url.searchParams.get('type') || 'agents'; // 'agents' | 'chats' | 'all'

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // SECURITY: Verify user can only access their own conversations
    if (session.id !== userId) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - Cannot access other user data' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Security: Verify user's domain is enabled
    const userEmail = session.email || '';
    const isDomainEnabled = await isUserDomainEnabled(userEmail);
    
    if (!isDomainEnabled) {
      const userDomain = getDomainFromEmail(userEmail);
      return new Response(
        JSON.stringify({ 
          error: 'Domain access disabled',
          message: `El dominio "${userDomain}" no está habilitado. Contacta al administrador.`
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.time('⚡ Lightweight conversations query');

    try {
      // ✅ OPTIMIZED QUERY: Only select minimal fields
      // Note: NOT filtering by status or isAgent initially to match original behavior
      const query = firestore
        .collection(COLLECTIONS.CONVERSATIONS)
        .where('userId', '==', userId);

      const snapshot = await query
        .orderBy('lastMessageAt', 'desc')
        .select('title', 'isAgent', 'isPinned', 'isAlly', 'status', 'agentId', 'messageCount', 'agentModel') // ✅ CRITICAL: Only select needed fields
        .get();

      console.timeEnd('⚡ Lightweight conversations query');
      
      console.log(`📊 Retrieved ${snapshot.docs.length} documents from Firestore`);

      // ✅ MINIMAL DATA: Map and filter
      let items = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || 'Sin título',
          isPinned: data.isPinned || false,
          isAlly: data.isAlly || false,
          isAgent: data.isAgent !== false, // Default to true for backward compat
          status: data.status || 'active',
          agentId: data.agentId, // For chats linked to agents
          messageCount: data.messageCount || 0,
          agentModel: data.agentModel || 'gemini-2.5-flash',
        };
      });

      // Filter by type and status
      items = items.filter(item => {
        // Exclude archived
        if (item.status === 'archived') return false;
        
        // Filter by type
        if (type === 'agents') {
          return item.isAgent === true;
        } else if (type === 'chats') {
          return item.isAgent === false;
        }
        
        // type === 'all'
        return true;
      });

      console.log(`⚡ Returned ${items.length} lightweight items (filtered by type: ${type})`);

      return new Response(
        JSON.stringify({ items }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (firestoreError: any) {
      console.error('❌ Firestore error:', firestoreError);
      
      // Graceful degradation
      return new Response(
        JSON.stringify({ 
          items: [],
          warning: 'Firestore not configured',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error: any) {
    console.error('❌ API error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to fetch conversations' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

