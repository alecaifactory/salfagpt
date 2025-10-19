import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { firestore } from '../../../lib/firestore';

/**
 * SalfaGPT Analytics Stats API
 * Calculates real-time statistics from Firestore data
 * 
 * Requirements fulfilled:
 * - RF-03: KPIs (Total Messages, Conversations, Active Users, Response Time)
 * - RF-04: Chart data (Activity, Messages by Assistant, By Hour, By User, By Domain)
 * - RF-05: Top Users Table
 */

export const POST: APIRoute = async ({ request, cookies }) => {
  // Authenticate
  const session = getSession({ cookies });
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await request.json();
    const { userId, filters } = body;
    
    const startDate = filters.startDate ? new Date(filters.startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const endDate = filters.endDate ? new Date(filters.endDate) : new Date();

    // Calculate previous period for comparison
    const periodDuration = endDate.getTime() - startDate.getTime();
    const previousStartDate = new Date(startDate.getTime() - periodDuration);
    const previousEndDate = startDate;

    console.log('📊 Calculating analytics:', {
      userId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      previousPeriod: `${previousStartDate.toISOString()} - ${previousEndDate.toISOString()}`
    });

    // Query conversations in date range
    let conversationsQuery = firestore
      .collection('conversations')
      .where('lastMessageAt', '>=', startDate)
      .where('lastMessageAt', '<=', endDate);

    // Filter by user if not admin
    if (userId) {
      conversationsQuery = conversationsQuery.where('userId', '==', userId);
    }

    const conversationsSnapshot = await conversationsQuery.get();
    const conversations = conversationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.(),
      lastMessageAt: doc.data().lastMessageAt?.toDate?.()
    }));

    // Query previous period conversations
    let prevConversationsQuery = firestore
      .collection('conversations')
      .where('lastMessageAt', '>=', previousStartDate)
      .where('lastMessageAt', '<', previousEndDate);

    if (userId) {
      prevConversationsQuery = prevConversationsQuery.where('userId', '==', userId);
    }

    const prevConversationsSnapshot = await prevConversationsQuery.get();

    // Get all messages for these conversations
    const conversationIds = conversations.map(c => c.id);
    let messagesData: any[] = [];

    if (conversationIds.length > 0) {
      // Firestore 'in' query limit is 10, so batch if needed
      const batches = [];
      for (let i = 0; i < conversationIds.length; i += 10) {
        const batch = conversationIds.slice(i, i + 10);
        const messagesSnapshot = await firestore
          .collection('messages')
          .where('conversationId', 'in', batch)
          .where('timestamp', '>=', startDate)
          .where('timestamp', '<=', endDate)
          .get();
        
        batches.push(...messagesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate?.()
        })));
      }
      messagesData = batches;
    }

    // Get previous period messages count
    let prevMessagesCount = 0;
    if (conversationIds.length > 0) {
      for (let i = 0; i < conversationIds.length; i += 10) {
        const batch = conversationIds.slice(i, i + 10);
        const prevMessagesSnapshot = await firestore
          .collection('messages')
          .where('conversationId', 'in', batch)
          .where('timestamp', '>=', previousStartDate)
          .where('timestamp', '<', previousEndDate)
          .get();
        
        prevMessagesCount += prevMessagesSnapshot.size;
      }
    }

    // Get unique active users
    const uniqueUserIds = new Set(conversations.map(c => c.userId));
    const activeUsersCount = uniqueUserIds.size;

    // Get previous period active users
    const prevUniqueUserIds = new Set(prevConversationsSnapshot.docs.map(doc => doc.data().userId));
    const prevActiveUsersCount = prevUniqueUserIds.size;

    // Calculate response time average (from messages with responseTime)
    const messagesWithResponseTime = messagesData.filter(m => m.responseTime);
    const avgResponseTime = messagesWithResponseTime.length > 0
      ? messagesWithResponseTime.reduce((sum, m) => sum + m.responseTime, 0) / messagesWithResponseTime.length / 1000
      : 0;

    // RF-03: Build KPIs
    const totalMessages = messagesData.length;
    const totalConversations = conversations.length;
    
    const kpis = [
      {
        label: 'Total de Mensajes',
        value: totalMessages,
        change: prevMessagesCount > 0 
          ? Math.round(((totalMessages - prevMessagesCount) / prevMessagesCount) * 100)
          : 0,
        icon: 'MessageSquare'
      },
      {
        label: 'Total de Conversaciones',
        value: totalConversations,
        change: prevConversationsSnapshot.size > 0
          ? Math.round(((totalConversations - prevConversationsSnapshot.size) / prevConversationsSnapshot.size) * 100)
          : 0,
        icon: 'Activity'
      },
      {
        label: 'Usuarios Activos',
        value: activeUsersCount,
        change: prevActiveUsersCount > 0
          ? Math.round(((activeUsersCount - prevActiveUsersCount) / prevActiveUsersCount) * 100)
          : 0,
        icon: 'UsersIcon'
      },
      {
        label: 'Tiempo de Respuesta Prom.',
        value: avgResponseTime,
        change: 0, // Would need historical data
        icon: 'Clock',
        formatValue: (val: number) => `${val.toFixed(2)}s`
      }
    ];

    // RF-04.1: Conversations over time (by day)
    const conversationsByDay = new Map<string, number>();
    conversations.forEach(conv => {
      const date = conv.lastMessageAt?.toISOString?.()?.split('T')[0] || '';
      conversationsByDay.set(date, (conversationsByDay.get(date) || 0) + 1);
    });

    const sortedDays = Array.from(conversationsByDay.keys()).sort();
    const conversationsOverTime = {
      labels: sortedDays.map(d => new Date(d).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })),
      values: sortedDays.map(d => conversationsByDay.get(d) || 0)
    };

    // RF-04.2: Messages by Assistant (model)
    const messagesByModel = messagesData.reduce((acc, msg) => {
      // Get model from parent conversation
      const conv = conversations.find(c => c.id === msg.conversationId);
      const model = conv?.agentModel || 'gemini-2.5-flash';
      const modelName = model.includes('pro') ? 'Pro' : 'Flash';
      acc[modelName] = (acc[modelName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const messagesByAssistant = {
      labels: Object.keys(messagesByModel),
      values: Object.values(messagesByModel)
    };

    // RF-04.3: Messages by Hour
    const messagesByHourMap = new Map<number, number>();
    for (let i = 0; i < 24; i++) {
      messagesByHourMap.set(i, 0);
    }
    
    messagesData.forEach(msg => {
      const hour = msg.timestamp?.getHours?.() || 0;
      messagesByHourMap.set(hour, (messagesByHourMap.get(hour) || 0) + 1);
    });

    const messagesByHour = {
      labels: Array.from(messagesByHourMap.keys()).map(h => `${h.toString().padStart(2, '0')}:00`),
      values: Array.from(messagesByHourMap.values())
    };

    // RF-04.4 & RF-05.1: Top Users
    const userMessageCount = new Map<string, { email: string; messages: number; conversations: Set<string> }>();
    
    messagesData.forEach(msg => {
      const conv = conversations.find(c => c.id === msg.conversationId);
      if (!conv) return;
      
      // We need to get user email - for now use userId
      const userKey = conv.userId;
      if (!userMessageCount.has(userKey)) {
        userMessageCount.set(userKey, {
          email: userKey, // TODO: Map to actual email from users collection
          messages: 0,
          conversations: new Set()
        });
      }
      
      const userData = userMessageCount.get(userKey)!;
      userData.messages += 1;
      userData.conversations.add(msg.conversationId);
    });

    const topUsers = Array.from(userMessageCount.values())
      .sort((a, b) => b.messages - a.messages)
      .slice(0, 10)
      .map(u => ({
        email: u.email,
        messages: u.messages,
        conversations: u.conversations.size,
        lastActive: new Date() // TODO: Get from last message timestamp
      }));

    // RF-04.5: Users by Domain
    const domains = Array.from(uniqueUserIds)
      .map(uid => {
        // Extract domain from userId (assuming format: email_domain_com)
        const parts = uid.split('_');
        if (parts.length >= 2) {
          return `@${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
        }
        return 'other';
      });

    const domainCounts = domains.reduce((acc, domain) => {
      acc[domain] = (acc[domain] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const usersByDomain = {
      labels: Object.keys(domainCounts),
      values: Object.values(domainCounts)
    };

    // Return analytics
    return new Response(JSON.stringify({
      kpis,
      conversationsOverTime,
      messagesByAssistant,
      messagesByHour,
      topUsers,
      usersByDomain,
      metadata: {
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          days: Math.ceil(periodDuration / (1000 * 60 * 60 * 24))
        },
        counts: {
          conversations: totalConversations,
          messages: totalMessages,
          activeUsers: activeUsersCount
        }
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error calculating analytics:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to calculate analytics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

