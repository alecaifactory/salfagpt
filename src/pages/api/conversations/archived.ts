import type { APIRoute } from 'astro';
import { getArchivedConversations } from '../../../lib/firestore';
import { getSession } from '../../../lib/auth';

// GET /api/conversations/archived - Get user's archived conversations
// Supports filtering by category: ?userId=xxx&category=ally|agents|projects|conversations
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
    const category = url.searchParams.get('category') as 'ally' | 'agents' | 'projects' | 'conversations' | null;

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // SECURITY: Verify user can only access their own archived conversations
    if (session.id !== userId) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - Cannot access other user data' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📦 Loading archived conversations for user: ${userId}${category ? ` (category: ${category})` : ''}`);

    // Get archived conversations (with googleUserId fallback)
    const archived = await getArchivedConversations(userId, category || undefined);
    
    // Group by archive category for organized display
    const groupedByCategory = {
      ally: archived.filter(c => c.archivedFolder === 'ally' || c.isAlly),
      agents: archived.filter(c => c.archivedFolder === 'agents' || (c.isAgent && !c.isAlly)),
      projects: archived.filter(c => c.archivedFolder === 'projects' || c.folderId),
      conversations: archived.filter(c => c.archivedFolder === 'conversations' || (!c.isAlly && !c.isAgent && !c.folderId)),
    };
    
    console.log(`✅ Archived items by category:`, {
      ally: groupedByCategory.ally.length,
      agents: groupedByCategory.agents.length,
      projects: groupedByCategory.projects.length,
      conversations: groupedByCategory.conversations.length,
      total: archived.length,
    });

    return new Response(
      JSON.stringify({
        archived,
        groupedByCategory,
        totalCount: archived.length,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Error loading archived conversations:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to load archived conversations',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

