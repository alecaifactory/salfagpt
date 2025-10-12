import type { APIRoute } from 'astro';
import {
  createConversation,
  getConversations,
  groupConversationsByTime,
} from '../../../lib/firestore';

// GET /api/conversations - List user's conversations
export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const folderId = url.searchParams.get('folderId') || undefined;

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
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
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { userId, title, folderId } = body;

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    try {
      const conversation = await createConversation(userId, title, folderId);

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

