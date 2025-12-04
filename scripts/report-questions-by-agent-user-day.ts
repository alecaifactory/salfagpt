#!/usr/bin/env tsx
/**
 * Report: Questions by Agent, by Day, by User (Last 7 Days)
 * 
 * Generates:
 * 1. Table format: Agent → User → Daily breakdown
 * 2. CSV export for Excel/Sheets
 * 3. JSON for charts/graphs
 * 
 * Usage:
 *   npx tsx scripts/report-questions-by-agent-user-day.ts
 *   npx tsx scripts/report-questions-by-agent-user-day.ts --format=csv
 *   npx tsx scripts/report-questions-by-agent-user-day.ts --format=json
 */

import { firestore, COLLECTIONS } from '../src/lib/firestore';

// Types
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

interface ReportData {
  generatedAt: string;
  period: {
    startDate: string;
    endDate: string;
    days: number;
  };
  totalQuestions: number;
  totalAgents: number;
  totalUsers: number;
  agents: AgentStats[];
}

// Helpers
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

async function generateReport(): Promise<ReportData> {
  console.log('📊 Generando reporte de preguntas por agente/usuario/día...\n');
  
  const { startDate, endDate, dates } = getLast7Days();
  
  console.log(`📅 Período: ${formatDate(startDate)} → ${formatDate(endDate)}\n`);
  
  // Step 1: Load all users
  console.log('👥 Cargando usuarios...');
  const usersSnapshot = await firestore.collection(COLLECTIONS.USERS).get();
  const usersMap = new Map<string, { email: string; name: string }>();
  
  for (const doc of usersSnapshot.docs) {
    const data = doc.data();
    usersMap.set(doc.id, {
      email: data.email || 'unknown',
      name: data.name || data.email || 'Unknown User',
    });
  }
  console.log(`✅ ${usersMap.size} usuarios cargados\n`);
  
  // Step 2: Load all conversations (agents)
  console.log('🤖 Cargando agentes...');
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
  console.log(`✅ ${agentsMap.size} agentes cargados\n`);
  
  // Step 3: Load messages (only user role = questions)
  console.log('💬 Cargando mensajes (preguntas de usuarios)...');
  const messagesSnapshot = await firestore
    .collection(COLLECTIONS.MESSAGES)
    .where('role', '==', 'user')
    .where('timestamp', '>=', startDate)
    .where('timestamp', '<=', endDate)
    .get();
  
  console.log(`✅ ${messagesSnapshot.size} preguntas encontradas\n`);
  
  // Step 4: Organize data
  console.log('📊 Organizando datos...\n');
  
  // Structure: agentId → userId → date → count
  const statsMap = new Map<string, Map<string, Map<string, number>>>();
  
  for (const doc of messagesSnapshot.docs) {
    const data = doc.data();
    const agentId = data.conversationId;
    const userId = data.userId;
    const timestamp = data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp);
    const dateKey = formatDate(timestamp);
    
    // Initialize nested maps
    if (!statsMap.has(agentId)) {
      statsMap.set(agentId, new Map());
    }
    
    const agentStats = statsMap.get(agentId)!;
    
    if (!agentStats.has(userId)) {
      agentStats.set(userId, new Map());
    }
    
    const userStats = agentStats.get(userId)!;
    
    if (!userStats.has(dateKey)) {
      userStats.set(dateKey, 0);
    }
    
    userStats.set(dateKey, userStats.get(dateKey)! + 1);
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
    
    for (const [userId, dateStatsMap] of userStatsMap.entries()) {
      const userInfo = usersMap.get(userId);
      uniqueUsers.add(userId);
      
      const dailyBreakdown: QuestionStats[] = [];
      let userTotalQuestions = 0;
      
      // Fill in all 7 days (including zeros)
      for (const date of dates) {
        const count = dateStatsMap.get(date) || 0;
        dailyBreakdown.push({ date, count });
        userTotalQuestions += count;
      }
      
      userBreakdown.push({
        userId,
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
  
  return {
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
}

// Formatters
function printTableReport(data: ReportData): void {
  console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║  📊 REPORTE: PREGUNTAS POR AGENTE/USUARIO/DÍA (ÚLTIMOS 7 DÍAS)      ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝\n');
  
  console.log(`📅 Período: ${data.period.startDate} → ${data.period.endDate}`);
  console.log(`📊 Total Preguntas: ${data.totalQuestions.toLocaleString()}`);
  console.log(`🤖 Total Agentes: ${data.totalAgents}`);
  console.log(`👥 Total Usuarios: ${data.totalUsers}\n`);
  
  if (data.agents.length === 0) {
    console.log('ℹ️  No hay preguntas en el período seleccionado.\n');
    return;
  }
  
  // Print each agent
  for (const agent of data.agents) {
    console.log('─'.repeat(80));
    console.log(`\n🤖 AGENTE: ${agent.agentTitle}`);
    console.log(`   ID: ${agent.agentId}`);
    console.log(`   Owner: ${agent.agentOwner}`);
    console.log(`   Total Preguntas: ${agent.totalQuestions.toLocaleString()}\n`);
    
    if (agent.userBreakdown.length === 0) {
      console.log('   ℹ️  Sin actividad de usuarios\n');
      continue;
    }
    
    // Print user breakdown
    for (const userStats of agent.userBreakdown) {
      console.log(`   👤 ${userStats.userName} (${userStats.userEmail})`);
      console.log(`      Total: ${userStats.totalQuestions} preguntas\n`);
      
      // Print daily breakdown
      console.log('      Desglose diario:');
      console.log('      ┌─────────────┬───────────┐');
      console.log('      │ Fecha       │ Preguntas │');
      console.log('      ├─────────────┼───────────┤');
      
      for (const day of userStats.dailyBreakdown) {
        const countStr = day.count.toString().padStart(9);
        console.log(`      │ ${day.date} │ ${countStr} │`);
      }
      
      console.log('      └─────────────┴───────────┘\n');
    }
  }
  
  console.log('─'.repeat(80) + '\n');
}

function exportToCSV(data: ReportData): string {
  const lines: string[] = [];
  
  // Header
  lines.push('Agent ID,Agent Title,Agent Owner,User ID,User Email,User Name,Date,Questions');
  
  // Data rows
  for (const agent of data.agents) {
    for (const userStats of agent.userBreakdown) {
      for (const day of userStats.dailyBreakdown) {
        lines.push([
          agent.agentId,
          agent.agentTitle,
          agent.agentOwner,
          userStats.userId,
          userStats.userEmail,
          userStats.userName,
          day.date,
          day.count,
        ].join(','));
      }
    }
  }
  
  return lines.join('\n');
}

function exportToJSON(data: ReportData): string {
  return JSON.stringify(data, null, 2);
}

function exportToChartData(data: ReportData): string {
  // Format optimized for charting libraries (Chart.js, Recharts, etc.)
  const chartData = {
    // For time series chart
    timeSeries: data.agents.flatMap(agent =>
      agent.userBreakdown.flatMap(user =>
        user.dailyBreakdown.map(day => ({
          date: day.date,
          agentId: agent.agentId,
          agentTitle: agent.agentTitle,
          userId: user.userId,
          userName: user.userName,
          questions: day.count,
        }))
      )
    ),
    
    // For stacked bar chart (by day)
    byDay: (() => {
      const { dates } = getLast7Days();
      return dates.map(date => {
        const dayData: any = { date };
        
        for (const agent of data.agents) {
          let dayTotal = 0;
          for (const user of agent.userBreakdown) {
            const dayStats = user.dailyBreakdown.find(d => d.date === date);
            dayTotal += dayStats?.count || 0;
          }
          dayData[agent.agentTitle] = dayTotal;
        }
        
        return dayData;
      });
    })(),
    
    // For grouped bar chart (by agent)
    byAgent: data.agents.map(agent => ({
      agentTitle: agent.agentTitle,
      totalQuestions: agent.totalQuestions,
      users: agent.userBreakdown.map(user => ({
        userName: user.userName,
        questions: user.totalQuestions,
      })),
    })),
    
    // For heatmap
    heatmap: (() => {
      const heatmapData: any[] = [];
      
      for (const agent of data.agents) {
        for (const user of agent.userBreakdown) {
          for (const day of user.dailyBreakdown) {
            heatmapData.push({
              agent: agent.agentTitle,
              user: user.userName,
              date: day.date,
              value: day.count,
            });
          }
        }
      }
      
      return heatmapData;
    })(),
    
    // Summary stats
    summary: {
      totalQuestions: data.totalQuestions,
      totalAgents: data.totalAgents,
      totalUsers: data.totalUsers,
      averageQuestionsPerDay: data.totalQuestions / 7,
      averageQuestionsPerAgent: data.totalQuestions / data.totalAgents,
      averageQuestionsPerUser: data.totalQuestions / data.totalUsers,
    },
  };
  
  return JSON.stringify(chartData, null, 2);
}

// Main
async function main() {
  try {
    const args = process.argv.slice(2);
    const format = args.find(arg => arg.startsWith('--format='))?.split('=')[1] || 'table';
    
    console.log('🚀 Iniciando generación de reporte...\n');
    
    const report = await generateReport();
    
    console.log('✅ Reporte generado exitosamente!\n');
    
    // Output based on format
    switch (format) {
      case 'csv':
        console.log('\n📄 FORMATO CSV:\n');
        console.log(exportToCSV(report));
        break;
      
      case 'json':
        console.log('\n📄 FORMATO JSON:\n');
        console.log(exportToJSON(report));
        break;
      
      case 'chart':
        console.log('\n📊 DATOS PARA GRÁFICOS:\n');
        console.log(exportToChartData(report));
        break;
      
      case 'table':
      default:
        printTableReport(report);
        
        // Show available exports
        console.log('💡 TIP: Exportar en otros formatos:');
        console.log('   CSV:   npx tsx scripts/report-questions-by-agent-user-day.ts --format=csv');
        console.log('   JSON:  npx tsx scripts/report-questions-by-agent-user-day.ts --format=json');
        console.log('   Chart: npx tsx scripts/report-questions-by-agent-user-day.ts --format=chart\n');
        break;
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error generando reporte:', error);
    process.exit(1);
  }
}

main();

