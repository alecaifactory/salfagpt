import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { firestore, COLLECTIONS } from '../../../lib/firestore';

/**
 * Questions Report API
 * 
 * Returns questions by agent, by user, by day for the last 7 days
 * 
 * POST /api/analytics/questions-report
 * Body: { userId: string, days?: number }
 * 
 * Returns:
 * {
 *   generatedAt: string,
 *   period: { startDate, endDate, days },
 *   totalQuestions: number,
 *   totalAgents: number,
 *   totalUsers: number,
 *   agents: AgentStats[]
 * }
 */

interface QuestionStats {
  date: string;
  count: number;
}

interface UserAgentStats {
  userId: string;
  userEmail: string;
  userName: string;
  totalQuestions: number;
  dailyBreakdown: QuestionStats[];
}

interface AgentStats {
  agentId: string;
  agentTitle: string;
  agentOwner: string;
  totalQuestions: number;
  userBreakdown: UserAgentStats[];
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getLast7Days(): { startDate: Date; endDate: Date; dates: string[] } {
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);
  
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 6); // Last 7 days including today
  startDate.setHours(0, 0, 0, 0);
  
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    dates.push(formatDate(date));
  }
  
  return { startDate, endDate, dates };
}

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
    const { userId, days = 7 } = body;
    
    const { startDate, endDate, dates } = getLast7Days();
    
    console.log('📊 Generating questions report:', {
      userId,
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
    });
    
    // Step 1: Load all users
    const usersSnapshot = await firestore.collection(COLLECTIONS.USERS).get();
    const usersMap = new Map<string, { email: string; name: string }>();
    
    for (const doc of usersSnapshot.docs) {
      const data = doc.data();
      usersMap.set(doc.id, {
        email: data.email || 'unknown',
        name: data.name || data.email || 'Unknown User',
      });
      
      // Also map googleUserId if exists
      if (data.googleUserId) {
        usersMap.set(data.googleUserId, {
          email: data.email || 'unknown',
          name: data.name || data.email || 'Unknown User',
        });
      }
    }
    
    // Step 2: Load all conversations (agents)
    const conversationsSnapshot = await firestore
      .collection(COLLECTIONS.CONVERSATIONS)
      .get();
    
    const agentsMap = new Map<string, { title: string; userId: string }>();
    
    for (const doc of conversationsSnapshot.docs) {
      const data = doc.data();
      agentsMap.set(doc.id, {
        title: data.title || 'Sin título',
        userId: data.userId,
      });
    }
    
    // Step 3: Load messages (only user role = questions)
    const messagesSnapshot = await firestore
      .collection(COLLECTIONS.MESSAGES)
      .where('role', '==', 'user')
      .where('timestamp', '>=', startDate)
      .where('timestamp', '<=', endDate)
      .get();
    
    console.log(`💬 Found ${messagesSnapshot.size} user questions in period`);
    
    // Step 4: Organize data
    // Structure: agentId → userId → date → count
    const statsMap = new Map<string, Map<string, Map<string, number>>>();
    
    for (const doc of messagesSnapshot.docs) {
      const data = doc.data();
      const agentId = data.conversationId;
      const msgUserId = data.userId;
      const timestamp = data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp);
      const dateKey = formatDate(timestamp);
      
      // Initialize nested maps
      if (!statsMap.has(agentId)) {
        statsMap.set(agentId, new Map());
      }
      
      const agentStats = statsMap.get(agentId)!;
      
      if (!agentStats.has(msgUserId)) {
        agentStats.set(msgUserId, new Map());
      }
      
      const userStatsForAgent = agentStats.get(msgUserId)!;
      
      if (!userStatsForAgent.has(dateKey)) {
        userStatsForAgent.set(dateKey, 0);
      }
      
      userStatsForAgent.set(dateKey, userStatsForAgent.get(dateKey)! + 1);
    }
    
    // Step 5: Build report structure
    const agents: AgentStats[] = [];
    let totalQuestions = 0;
    const uniqueUsers = new Set<string>();
    
    for (const [agentId, userStatsMap] of statsMap.entries()) {
      const agentInfo = agentsMap.get(agentId);
      if (!agentInfo) continue;
      
      const userBreakdown: UserAgentStats[] = [];
      let agentTotalQuestions = 0;
      
      for (const [msgUserId, dateStatsMap] of userStatsMap.entries()) {
        const userInfo = usersMap.get(msgUserId);
        uniqueUsers.add(msgUserId);
        
        const dailyBreakdown: QuestionStats[] = [];
        let userTotalQuestions = 0;
        
        // Fill in all 7 days (including zeros)
        for (const date of dates) {
          const count = dateStatsMap.get(date) || 0;
          dailyBreakdown.push({ date, count });
          userTotalQuestions += count;
        }
        
        userBreakdown.push({
          userId: msgUserId,
          userEmail: userInfo?.email || 'unknown',
          userName: userInfo?.name || 'Unknown User',
          totalQuestions: userTotalQuestions,
          dailyBreakdown,
        });
        
        agentTotalQuestions += userTotalQuestions;
      }
      
      // Sort users by total questions (descending)
      userBreakdown.sort((a, b) => b.totalQuestions - a.totalQuestions);
      
      agents.push({
        agentId,
        agentTitle: agentInfo.title,
        agentOwner: agentInfo.userId,
        totalQuestions: agentTotalQuestions,
        userBreakdown,
      });
      
      totalQuestions += agentTotalQuestions;
    }
    
    // Sort agents by total questions (descending)
    agents.sort((a, b) => b.totalQuestions - a.totalQuestions);
    
    const reportData = {
      generatedAt: new Date().toISOString(),
      period: {
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        days: 7,
      },
      totalQuestions,
      totalAgents: agents.length,
      totalUsers: uniqueUsers.size,
      agents,
    };
    
    console.log('✅ Report generated:', {
      totalQuestions,
      totalAgents: agents.length,
      totalUsers: uniqueUsers.size,
    });
    
    return new Response(JSON.stringify(reportData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ Error generating questions report:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Failed to generate report',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

