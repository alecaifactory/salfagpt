import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { firestore } from '../../../lib/firestore';

/**
 * User Details Analytics API
 * Returns detailed analytics for a specific user
 */
export const POST: APIRoute = async (context) => {
  // Authenticate
  const session = getSession(context);
  const { request } = context;
  
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Only admin can view user details
  if (session.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Forbidden - Admin access required' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await request.json();
    const { userId, filters } = body;
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const startDate = filters?.startDate ? new Date(filters.startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const endDate = filters?.endDate ? new Date(filters.endDate) : new Date();

    console.log('📊 Loading user details:', {
      userId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    // Get user's conversations in the period
    const conversationsSnapshot = await firestore
      .collection('conversations')
      .where('userId', '==', userId)
      .where('lastMessageAt', '>=', startDate)
      .where('lastMessageAt', '<=', endDate)
      .get();

    const conversations = conversationsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title || 'Sin título',
        messageCount: data.messageCount || 0,
        lastMessageAt: data.lastMessageAt?.toDate() || new Date(),
        agentModel: data.agentModel,
        status: data.status || 'active',
      };
    }).filter(c => c.status !== 'archived');

    // Get messages for these conversations
    const conversationIds = conversations.map(c => c.id);
    let messagesCount = 0;

    if (conversationIds.length > 0) {
      // Batch query
      for (let i = 0; i < conversationIds.length; i += 10) {
        const batch = conversationIds.slice(i, i + 10);
        const messagesSnapshot = await firestore
          .collection('messages')
          .where('conversationId', 'in', batch)
          .where('timestamp', '>=', startDate)
          .where('timestamp', '<=', endDate)
          .get();
        
        messagesCount += messagesSnapshot.size;
      }
    }

    // Calculate login count from distinct days with activity
    const activeDays = conversations
      .map(c => c.lastMessageAt.toISOString().split('T')[0])
      .filter((v, i, arr) => arr.indexOf(v) === i);

    // Build assigned agents list
    const assignedAgents = conversations.map(conv => ({
      id: conv.id,
      title: conv.title,
      messageCount: conv.messageCount,
      lastUsed: conv.lastMessageAt,
    })).sort((a, b) => b.lastUsed.getTime() - a.lastUsed.getTime());

    console.log(`✅ Loaded details for user ${userId}:`, {
      conversations: conversations.length,
      messages: messagesCount,
      activeDays: activeDays.length,
      assignedAgents: assignedAgents.length,
    });

    return new Response(JSON.stringify({
      assignedAgents,
      totalMessages: messagesCount,
      totalConversations: conversations.length,
      loginCount: activeDays.length,
      // Additional metrics can be added here
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error loading user details:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to load user details',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};








