import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { firestore, getEffectivenessStats } from '../../../lib/firestore';

/**
 * SalfaGPT Analytics Stats API
 * Calculates real-time statistics from Firestore data
 * 
 * Requirements fulfilled:
 * - RF-03: KPIs (Total Messages, Conversations, Active Users, Response Time)
 * - RF-04: Chart data (Activity, Messages by Assistant, By Hour, By User, By Domain)
 * - RF-05: Top Users Table
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
    const conversations = conversationsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        agentModel: data.agentModel,
        createdAt: data.createdAt?.toDate?.(),
        lastMessageAt: data.lastMessageAt?.toDate?.(),
        ...data,
      };
    });

    // Query previous period conversations
    let prevConversationsQuery = firestore
      .collection('conversations')
      .where('lastMessageAt', '>=', previousStartDate)
      .where('lastMessageAt', '<', previousEndDate);

    if (userId) {
      prevConversationsQuery = prevConversationsQuery.where('userId', '==', userId);
    }

    const prevConversationsSnapshot = await prevConversationsQuery.get();

    // ✅ Load all users to map userId → email
    const usersSnapshot = await firestore.collection('users').get();
    const usersMap = new Map<string, { email: string; name: string }>();
    usersSnapshot.docs.forEach(doc => {
      const data = doc.data();
      usersMap.set(doc.id, {
        email: data.email || doc.id,
        name: data.name || 'Unknown'
      });
    });

    console.log(`✅ Loaded ${usersMap.size} users for email mapping`);

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
    // Generate complete date range from startDate to endDate
    const conversationsByDay = new Map<string, number>();
    
    // Initialize all days in range with 0
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0];
      conversationsByDay.set(dateKey, 0);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Count conversations by day
    conversations.forEach(conv => {
      if (!conv.lastMessageAt) return;
      
      const convDate = conv.lastMessageAt instanceof Date 
        ? conv.lastMessageAt 
        : new Date(conv.lastMessageAt);
      
      if (isNaN(convDate.getTime())) return; // Skip invalid dates
      
      const dateKey = convDate.toISOString().split('T')[0];
      if (conversationsByDay.has(dateKey)) {
        conversationsByDay.set(dateKey, (conversationsByDay.get(dateKey) || 0) + 1);
      }
    });

    // Build arrays for chart
    const sortedDays = Array.from(conversationsByDay.keys()).sort();
    const conversationsOverTime = {
      labels: sortedDays.map(d => {
        const date = new Date(d);
        return date.toLocaleDateString('es-ES', { 
          month: 'short', 
          day: 'numeric',
          timeZone: 'UTC' // Prevent timezone issues
        });
      }),
      values: sortedDays.map(d => conversationsByDay.get(d) || 0)
    };

    console.log('📊 Conversations by day:', {
      totalDays: sortedDays.length,
      dateRange: `${sortedDays[0]} to ${sortedDays[sortedDays.length - 1]}`,
      totalConversations: conversationsOverTime.values.reduce((a, b) => a + b, 0)
    });

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
    const userMessageCount = new Map<string, { 
      userId: string;
      email: string; 
      messages: number; 
      conversations: Set<string>;
      lastMessageTime: Date;
    }>();
    
    messagesData.forEach(msg => {
      const conv = conversations.find(c => c.id === msg.conversationId);
      if (!conv) return;
      
      const userKey = conv.userId;
      if (!userMessageCount.has(userKey)) {
        // ✅ Map userId to real email from users collection
        const userInfo = usersMap.get(userKey);
        userMessageCount.set(userKey, {
          userId: userKey,
          email: userInfo?.email || userKey,
          messages: 0,
          conversations: new Set(),
          lastMessageTime: msg.timestamp || new Date()
        });
      }
      
      const userData = userMessageCount.get(userKey)!;
      userData.messages += 1;
      userData.conversations.add(msg.conversationId);
      
      // Track most recent message time
      if (msg.timestamp && msg.timestamp > userData.lastMessageTime) {
        userData.lastMessageTime = msg.timestamp;
      }
    });

    const topUsers = Array.from(userMessageCount.values())
      .sort((a, b) => b.messages - a.messages)
      .slice(0, 10)
      .map(u => ({
        email: u.email, // ✅ Now shows real email
        messages: u.messages,
        conversations: u.conversations.size,
        lastActive: u.lastMessageTime // ✅ Real last message time
      }));

    // RF-04.5: Users by Domain
    const domains = Array.from(uniqueUserIds)
      .map(uid => {
        // ✅ Extract domain from real email in users collection
        const userInfo = usersMap.get(uid);
        if (userInfo?.email && userInfo.email.includes('@')) {
          return '@' + userInfo.email.split('@')[1];
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

    // ✅ NEW: Get effectiveness stats from message_ratings collection
    const effectivenessStats = await getEffectivenessStats(
      startDate,
      endDate,
      userId // Filter by user if not admin
    );

    console.log('✅ Effectiveness stats calculated:', {
      totalRatings: effectivenessStats.totalRatings,
      completeRate: (effectivenessStats.completeRate * 100).toFixed(1) + '%',
      helpfulRate: (effectivenessStats.helpfulRate * 100).toFixed(1) + '%'
    });

    // ✅ Apply effectiveness filter if specified
    let filteredMessageIds: Set<string> | null = null;
    if (filters.effectiveness && filters.effectiveness !== 'all') {
      try {
        const ratingsSnapshot = await firestore
          .collection('message_ratings')
          .where('createdAt', '>=', startDate)
          .where('createdAt', '<=', endDate)
          .get();
        
        filteredMessageIds = new Set(
          ratingsSnapshot.docs
            .filter(doc => {
              const data = doc.data();
              if (filters.effectiveness === 'satisfactory') {
                return data.isComplete === true && data.wasHelpful === true;
              } else if (filters.effectiveness === 'incomplete') {
                return data.isComplete === false || data.wasHelpful === false;
              }
              return true;
            })
            .map(doc => doc.data().messageId)
        );
        
        // Filter messages based on ratings
        if (filteredMessageIds.size > 0) {
          messagesData = messagesData.filter(msg => filteredMessageIds!.has(msg.id));
          console.log(`📊 Filtered by effectiveness: ${messagesData.length} messages remain`);
        } else {
          console.log('⚠️ No messages match effectiveness filter, showing all');
        }
      } catch (error) {
        console.warn('⚠️ Error filtering by effectiveness:', error);
        // Continue without filter if error occurs
      }
    }

    // Return analytics
    return new Response(JSON.stringify({
      kpis,
      conversationsOverTime,
      messagesByAssistant,
      messagesByHour,
      topUsers,
      usersByDomain,
      effectivenessStats, // ✅ NEW: Include effectiveness data
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

