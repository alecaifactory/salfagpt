import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { firestore } from '../../../lib/firestore';

/**
 * User Analytics API
 * Returns list of users with engagement metrics
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

  // Only admin can view user analytics
  if (session.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Forbidden - Admin access required' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await request.json();
    const { filters } = body;
    
    const startDate = filters?.startDate ? new Date(filters.startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const endDate = filters?.endDate ? new Date(filters.endDate) : new Date();

    console.log('📊 Loading user analytics:', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    // Get all users
    const usersSnapshot = await firestore.collection('users').get();
    const allUsers = usersSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        email: data.email,
        name: data.name,
        role: data.role,
        roles: data.roles || [data.role],
        company: data.company,
        department: data.department,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        createdBy: data.createdBy,
        lastLoginAt: data.lastLoginAt ? new Date(data.lastLoginAt) : null,
        isActive: data.isActive !== false, // Default to true
        agentAccessCount: data.agentAccessCount || 0,
        contextAccessCount: data.contextAccessCount || 0,
      };
    });

    // Get conversations for the period to calculate engagement
    const conversationsSnapshot = await firestore
      .collection('conversations')
      .where('lastMessageAt', '>=', startDate)
      .where('lastMessageAt', '<=', endDate)
      .get();

    const conversations = conversationsSnapshot.docs.map(doc => ({
      id: doc.id,
      userId: doc.data().userId,
      messageCount: doc.data().messageCount || 0,
      lastMessageAt: doc.data().lastMessageAt?.toDate(),
      title: doc.data().title,
    }));

    // Get messages for the period
    const conversationIds = conversations.map(c => c.id);
    let allMessages: any[] = [];

    if (conversationIds.length > 0) {
      // Batch query (Firestore 'in' limit is 10)
      for (let i = 0; i < conversationIds.length; i += 10) {
        const batch = conversationIds.slice(i, i + 10);
        const messagesSnapshot = await firestore
          .collection('messages')
          .where('conversationId', 'in', batch)
          .where('timestamp', '>=', startDate)
          .where('timestamp', '<=', endDate)
          .get();
        
        allMessages.push(...messagesSnapshot.docs.map(doc => ({
          id: doc.id,
          conversationId: doc.data().conversationId,
          timestamp: doc.data().timestamp?.toDate(),
        })));
      }
    }

    // Calculate metrics per user
    const userMetrics = new Map<string, {
      totalMessages: number;
      totalConversations: number;
      loginCount: number;
    }>();

    // Count messages per user
    allMessages.forEach(msg => {
      const conv = conversations.find(c => c.id === msg.conversationId);
      if (!conv) return;
      
      if (!userMetrics.has(conv.userId)) {
        userMetrics.set(conv.userId, {
          totalMessages: 0,
          totalConversations: 0,
          loginCount: 0,
        });
      }
      
      userMetrics.get(conv.userId)!.totalMessages += 1;
    });

    // Count conversations per user
    conversations.forEach(conv => {
      if (!userMetrics.has(conv.userId)) {
        userMetrics.set(conv.userId, {
          totalMessages: 0,
          totalConversations: 0,
          loginCount: 0,
        });
      }
      
      userMetrics.get(conv.userId)!.totalConversations += 1;
    });

    // TODO: Calculate login count from usage_logs or sessions collection
    // For now, use a placeholder based on activity

    // Combine user data with metrics
    const usersWithMetrics = allUsers.map(user => {
      const metrics = userMetrics.get(user.id) || {
        totalMessages: 0,
        totalConversations: 0,
        loginCount: 0,
      };

      // Estimate login count (rough heuristic: 1 login per day with activity)
      const daysActive = conversations
        .filter(c => c.userId === user.id)
        .map(c => c.lastMessageAt?.toISOString().split('T')[0])
        .filter((v, i, arr) => arr.indexOf(v) === i)
        .length;

      return {
        ...user,
        totalMessages: metrics.totalMessages,
        totalConversations: metrics.totalConversations,
        loginCount: daysActive, // Approximate
        lastLogin: user.lastLoginAt,
        assignedAgents: [], // Will be loaded on detail view
      };
    });

    // Sort by total messages (most active first)
    usersWithMetrics.sort((a, b) => b.totalMessages - a.totalMessages);

    console.log(`✅ Loaded ${usersWithMetrics.length} users with metrics`);

    return new Response(JSON.stringify({
      users: usersWithMetrics,
      metadata: {
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
        totalUsers: usersWithMetrics.length,
        activeUsers: usersWithMetrics.filter(u => u.totalMessages > 0).length,
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error loading user analytics:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to load user analytics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

