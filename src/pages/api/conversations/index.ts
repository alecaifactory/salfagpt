import type { APIRoute } from 'astro';
import {
  createConversation,
  getConversations,
  groupConversationsByTime,
} from '../../../lib/firestore';
import { getSession } from '../../../lib/auth';
import { isUserDomainEnabled, getDomainFromEmail } from '../../../lib/domains';

// GET /api/conversations - List user's conversations
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
    const folderId = url.searchParams.get('folderId') || undefined;

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

    // 🔒 CRITICAL Security: Verify user's domain is enabled
    const userEmail = session.email || '';
    const isDomainEnabled = await isUserDomainEnabled(userEmail);
    
    if (!isDomainEnabled) {
      const userDomain = getDomainFromEmail(userEmail);
      console.warn('🚨 API access denied - domain disabled:', {
        email: userEmail,
        domain: userDomain,
        endpoint: 'GET /api/conversations',
        timestamp: new Date().toISOString(),
      });
      
      return new Response(
        JSON.stringify({ 
          error: 'Domain access disabled',
          message: `El dominio "${userDomain}" no está habilitado. Contacta al administrador.`
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    try {
      const conversations = await getConversations(userId, folderId);
      const grouped = groupConversationsByTime(conversations);

      // Format for frontend
      const groups = [
        { label: 'Today', conversations: grouped.today },
        { label: 'Yesterday', conversations: grouped.yesterday },
        { label: 'Last 7 Days', conversations: grouped.lastWeek },
        { label: 'Last 30 Days', conversations: grouped.lastMonth },
        { label: 'Older', conversations: grouped.older },
      ].filter(group => group.conversations.length > 0);

      return new Response(
        JSON.stringify({ groups }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (firestoreError: any) {
      // Firestore not available (dev mode) - return empty conversations
      console.warn('⚠️ Firestore unavailable, returning empty conversations');
      console.warn('💡 Ensure you have run: gcloud auth application-default login');
      console.warn('💡 And configured: GOOGLE_CLOUD_PROJECT in .env');
      console.warn(`📝 Error details: ${firestoreError.message || 'Unknown error'}`);
      
      return new Response(
        JSON.stringify({ 
          groups: [],
          warning: 'Firestore not configured. Using temporary storage.',
          hint: 'Run: gcloud auth application-default login'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error: any) {
    console.error('Error in conversations API:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to fetch conversations' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// POST /api/conversations - Create new conversation
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Verify authentication
    const session = getSession({ cookies } as any);
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Please login' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { userId, title, folderId, isAgent, agentId } = body;

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // SECURITY: Verify user can only create conversations for themselves
    if (session.id !== userId) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - Cannot create conversations for other users' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 🔒 CRITICAL Security: Verify user's domain is enabled
    const userEmail = session.email || '';
    const isDomainEnabled = await isUserDomainEnabled(userEmail);
    
    if (!isDomainEnabled) {
      const userDomain = getDomainFromEmail(userEmail);
      console.warn('🚨 API access denied - domain disabled:', {
        email: userEmail,
        domain: userDomain,
        endpoint: 'POST /api/conversations',
        timestamp: new Date().toISOString(),
      });
      
      return new Response(
        JSON.stringify({ 
          error: 'Domain access disabled',
          message: `El dominio "${userDomain}" no está habilitado. Contacta al administrador.`
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    try {
      const conversation = await createConversation(userId, title, folderId, isAgent, agentId);

      return new Response(
        JSON.stringify({ conversation }),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (firestoreError: any) {
      // Firestore not available (dev mode) - return temporary conversation
      console.warn('⚠️ Firestore unavailable, creating temporary conversation');
      console.warn('💡 This conversation will NOT be saved to GCP');
      console.warn('💡 To persist conversations, run: gcloud auth application-default login');
      console.warn('💡 And ensure GOOGLE_CLOUD_PROJECT is set in .env');
      console.warn(`📝 Error details: ${firestoreError.message || 'Unknown error'}`);
      
      const tempConversation = {
        id: `temp-${Date.now()}`,
        userId,
        title: title || 'Nuevo Agente',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastMessageAt: new Date(),
        messageCount: 0,
        contextWindowUsage: 0,
        agentModel: 'gemini-2.5-flash',
        _temporary: true, // Flag to indicate this is not persisted
      };

      return new Response(
        JSON.stringify({ 
          conversation: tempConversation,
          warning: 'Conversation created in memory only (not persisted to GCP)',
          hint: 'Configure Firestore credentials to enable persistence'
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error: any) {
    console.error('Error creating conversation:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to create conversation' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

