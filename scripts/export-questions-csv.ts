#!/usr/bin/env tsx
/**
 * Export Questions Report to CSV (Clean Output)
 * 
 * Usage:
 *   npx tsx scripts/export-questions-csv.ts > preguntas-7dias.csv
 */

import { firestore, COLLECTIONS } from '../src/lib/firestore';

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
  startDate.setDate(startDate.getDate() - 6);
  startDate.setHours(0, 0, 0, 0);
  
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    dates.push(formatDate(date));
  }
  
  return { startDate, endDate, dates };
}

async function generateCSV() {
  const { startDate, endDate, dates } = getLast7Days();
  
  // Load all users
  const usersSnapshot = await firestore.collection(COLLECTIONS.USERS).get();
  const usersMap = new Map<string, { email: string; name: string }>();
  
  for (const doc of usersSnapshot.docs) {
    const data = doc.data();
    usersMap.set(doc.id, {
      email: data.email || 'unknown',
      name: data.name || data.email || 'Unknown User',
    });
    
    if (data.googleUserId) {
      usersMap.set(data.googleUserId, {
        email: data.email || 'unknown',
        name: data.name || data.email || 'Unknown User',
      });
    }
  }
  
  // Load all conversations (agents)
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
  
  // Load ALL messages (filter in memory)
  const messagesSnapshot = await firestore
    .collection(COLLECTIONS.MESSAGES)
    .get();
  
  // Filter and organize in memory
  const statsMap = new Map<string, Map<string, Map<string, number>>>();
  
  for (const doc of messagesSnapshot.docs) {
    const data = doc.data();
    
    if (data.role !== 'user') continue;
    
    const timestamp = data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp);
    if (timestamp < startDate || timestamp > endDate) continue;
    
    const agentId = data.conversationId;
    const msgUserId = data.userId;
    const dateKey = formatDate(timestamp);
    
    if (!statsMap.has(agentId)) {
      statsMap.set(agentId, new Map());
    }
    
    const agentStats = statsMap.get(agentId)!;
    
    if (!agentStats.has(msgUserId)) {
      agentStats.set(msgUserId, new Map());
    }
    
    const userStats = agentStats.get(msgUserId)!;
    
    if (!userStats.has(dateKey)) {
      userStats.set(dateKey, 0);
    }
    
    userStats.set(dateKey, userStats.get(dateKey)! + 1);
  }
  
  // Build CSV lines
  const lines: string[] = [];
  
  // Header
  lines.push('Agent_ID,Agent_Title,Agent_Owner,User_ID,User_Email,User_Name,Date,Day_Name,Questions');
  
  // Data rows
  const agents: AgentStats[] = [];
  
  for (const [agentId, userStatsMap] of statsMap.entries()) {
    const agentInfo = agentsMap.get(agentId);
    if (!agentInfo) continue;
    
    const userBreakdown: UserAgentStats[] = [];
    let agentTotalQuestions = 0;
    
    for (const [msgUserId, dateStatsMap] of userStatsMap.entries()) {
      const userInfo = usersMap.get(msgUserId);
      
      const dailyBreakdown: QuestionStats[] = [];
      let userTotalQuestions = 0;
      
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
    
    userBreakdown.sort((a, b) => b.totalQuestions - a.totalQuestions);
    
    agents.push({
      agentId,
      agentTitle: agentInfo.title,
      agentOwner: agentInfo.userId,
      totalQuestions: agentTotalQuestions,
      userBreakdown,
    });
  }
  
  // Sort agents by total questions
  agents.sort((a, b) => b.totalQuestions - a.totalQuestions);
  
  // Generate CSV rows
  for (const agent of agents) {
    for (const user of agent.userBreakdown) {
      for (const day of user.dailyBreakdown) {
        const date = new Date(day.date);
        const dayName = date.toLocaleDateString('es', { weekday: 'long' });
        
        // Escape quotes in strings
        const agentTitle = agent.agentTitle.replace(/"/g, '""');
        const userName = user.userName.replace(/"/g, '""');
        
        lines.push([
          agent.agentId,
          `"${agentTitle}"`,
          agent.agentOwner,
          user.userId,
          user.userEmail,
          `"${userName}"`,
          day.date,
          dayName,
          day.count,
        ].join(','));
      }
    }
  }
  
  return lines.join('\n');
}

async function main() {
  try {
    const csv = await generateCSV();
    console.log(csv);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();

