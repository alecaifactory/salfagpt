import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { firestore, COLLECTIONS } from '../../../lib/firestore';

/**
 * Agents & Conversations Analytics API
 * 
 * Returns:
 * 1. Conversations per Agent (with user breakdown)
 * 2. Conversations per User (with agent breakdown)
 * 3. Message counts and activity metrics
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
    const { filters } = body;
    
    const startDate = filters?.startDate ? new Date(filters.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = filters?.endDate ? new Date(filters.endDate) : new Date();

    console.log('📊 Loading agents & conversations analytics:', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    // Step 1: Load all users
    const usersSnapshot = await firestore.collection(COLLECTIONS.USERS).get();
    const usersMap = new Map();
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userInfo = {
        id: userDoc.id,
        email: userData.email,
        name: userData.name,
        company: userData.company,
      };
      
      usersMap.set(userDoc.id, userInfo);
      // Also map by googleUserId
      if (userData.googleUserId) {
        usersMap.set(userData.googleUserId, userInfo);
      }
    }

    // Step 2: Load all agents
    const agentsSnapshot = await firestore
      .collection(COLLECTIONS.CONVERSATIONS)
      .where('isAgent', '==', true)
      .get();

    const agents = agentsSnapshot.docs.map(doc => ({
      id: doc.id,
      title: doc.data().title,
      ownerId: doc.data().userId,
      createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(doc.data().createdAt),
    }));

    // Step 3: Load ALL messages
    const messagesSnapshot = await firestore
      .collection(COLLECTIONS.MESSAGES)
      .get();

    // Step 4: Group messages by conversation and user
    const conversationStats = new Map();
    const userStats = new Map();

    for (const msgDoc of messagesSnapshot.docs) {
      const msgData = msgDoc.data();
      const conversationId = msgData.conversationId;
      const userId = msgData.userId;
      const role = msgData.role;
      const timestamp = msgData.timestamp?.toDate ? msgData.timestamp.toDate() : new Date(msgData.timestamp);

      // Filter by date
      if (timestamp < startDate || timestamp > endDate) {
        continue;
      }

      // Track per conversation
      if (!conversationStats.has(conversationId)) {
        conversationStats.set(conversationId, {
          totalMessages: 0,
          userQuestions: 0,
          users: new Set(),
        });
      }
      
      const convStats = conversationStats.get(conversationId);
      convStats.totalMessages++;
      convStats.users.add(userId);
      
      if (role === 'user') {
        convStats.userQuestions++;
      }

      // Track per user
      if (!userStats.has(userId)) {
        userStats.set(userId, {
          totalMessages: 0,
          totalQuestions: 0,
          conversations: new Set(),
          agents: new Map(),
        });
      }
      
      const uStats = userStats.get(userId);
      uStats.totalMessages++;
      uStats.conversations.add(conversationId);
      
      if (role === 'user') {
        uStats.totalQuestions++;
        
        // Track per agent for this user
        if (!uStats.agents.has(conversationId)) {
          uStats.agents.set(conversationId, 0);
        }
        uStats.agents.set(conversationId, uStats.agents.get(conversationId) + 1);
      }
    }

    // Step 5: Load all conversations
    const conversationsSnapshot = await firestore
      .collection(COLLECTIONS.CONVERSATIONS)
      .get();

    // Step 6: Build agent statistics
    const agentStats = agents.map(agent => {
      const convStats = conversationStats.get(agent.id);
      const ownerInfo = usersMap.get(agent.ownerId);
      
      // Find child conversations
      const childConversationsSnapshot = conversationsSnapshot.docs.filter(doc => 
        doc.data().agentId === agent.id && 
        doc.data().isAgent === false
      );
      
      const childConversations = childConversationsSnapshot.map(doc => {
        const data = doc.data();
        const stats = conversationStats.get(doc.id);
        
        return {
          id: doc.id,
          title: data.title,
          userId: data.userId,
          userName: usersMap.get(data.userId)?.name || 'Unknown',
          userEmail: usersMap.get(data.userId)?.email || 'Unknown',
          messageCount: stats?.totalMessages || 0,
          questionCount: stats?.userQuestions || 0,
        };
      }).filter(c => c.messageCount > 0);

      // Get unique users for this agent
      const uniqueUsers = new Set();
      if (convStats) {
        convStats.users.forEach(u => uniqueUsers.add(u));
      }
      childConversations.forEach(c => uniqueUsers.add(c.userId));

      return {
        id: agent.id,
        title: agent.title,
        ownerName: ownerInfo?.name || 'Unknown',
        ownerEmail: ownerInfo?.email || 'Unknown',
        directMessages: convStats?.totalMessages || 0,
        directQuestions: convStats?.userQuestions || 0,
        childConversations: childConversations.length,
        totalMessages: (convStats?.totalMessages || 0) + childConversations.reduce((sum, c) => sum + c.messageCount, 0),
        totalQuestions: (convStats?.userQuestions || 0) + childConversations.reduce((sum, c) => sum + c.questionCount, 0),
        uniqueUsers: uniqueUsers.size,
        conversations: childConversations,
      };
    }).filter(a => a.totalMessages > 0)
      .sort((a, b) => b.totalMessages - a.totalMessages);

    // Step 7: Build user statistics
    const userStatsArray = Array.from(userStats.entries()).map(([userId, stats]) => {
      const userInfo = usersMap.get(userId);
      
      // Get agent breakdown
      const agentBreakdown = Array.from(stats.agents.entries())
        .map(([agentId, questionCount]) => {
          const agent = agents.find(a => a.id === agentId);
          return {
            agentId,
            agentTitle: agent?.title || `Conversation ${agentId.substring(0, 8)}...`,
            questionCount,
          };
        })
        .sort((a, b) => b.questionCount - a.questionCount);

      return {
        userId,
        userName: userInfo?.name || 'Unknown',
        userEmail: userInfo?.email || 'Unknown',
        company: userInfo?.company || 'Unknown',
        totalMessages: stats.totalMessages,
        totalQuestions: stats.totalQuestions,
        conversationsCount: stats.conversations.size,
        agentsUsed: stats.agents.size,
        topAgents: agentBreakdown.slice(0, 10),
      };
    }).filter(u => u.totalQuestions > 0)
      .sort((a, b) => b.totalQuestions - a.totalQuestions);

    // Response
    return new Response(JSON.stringify({
      agentStats,
      userStats: userStatsArray,
      summary: {
        totalAgents: agents.length,
        activeAgents: agentStats.length,
        totalUsers: usersMap.size,
        activeUsers: userStatsArray.length,
        totalMessages: Array.from(conversationStats.values()).reduce((sum, s) => sum + s.totalMessages, 0),
        totalQuestions: Array.from(conversationStats.values()).reduce((sum, s) => sum + s.userQuestions, 0),
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error loading agents & conversations analytics:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

