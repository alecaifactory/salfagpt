#!/usr/bin/env tsx
/**
 * Simplified Questions Report (No additional indexes required)
 * 
 * Generates questions by agent, by user, by day (last 7 days)
 * Uses existing indexes only
 * 
 * Usage:
 *   npx tsx scripts/report-questions-simplified.ts
 *   npx tsx scripts/report-questions-simplified.ts --format=csv
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

async function generateReport() {
  console.error('📊 Generando reporte de preguntas (versión simplificada)...\n');
  
  const { startDate, endDate, dates } = getLast7Days();
  
  console.error(`📅 Período: ${formatDate(startDate)} → ${formatDate(endDate)}\n`);
  
  // Step 1: Load all users
  console.error('👥 Cargando usuarios...');
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
  console.error(`✅ ${usersMap.size} usuarios cargados\n`);
  
  // Step 2: Load all conversations (agents)
  console.error('🤖 Cargando agentes...');
  const conversationsSnapshot = await firestore
    .collection(COLLECTIONS.CONVERSATIONS)
    .get();
  
  const agentsMap = new Map<string, { title: string; userId: string }>();
  const agentIds: string[] = [];
  
  for (const doc of conversationsSnapshot.docs) {
    const data = doc.data();
    agentsMap.set(doc.id, {
      title: data.title || 'Sin título',
      userId: data.userId,
    });
    agentIds.push(doc.id);
  }
  console.error(`✅ ${agentsMap.size} agentes cargados\n`);
  
  // Step 3: Load ALL messages (filter in memory)
  // This avoids needing the composite index
  console.error('💬 Cargando TODOS los mensajes...');
  const messagesSnapshot = await firestore
    .collection(COLLECTIONS.MESSAGES)
    .get();
  
  console.error(`✅ ${messagesSnapshot.size} mensajes cargados totales\n`);
  
  // Step 4: Filter and organize in memory
  console.error('🔍 Filtrando preguntas del período...\n');
  
  const statsMap = new Map<string, Map<string, Map<string, number>>>();
  let questionsInPeriod = 0;
  
  for (const doc of messagesSnapshot.docs) {
    const data = doc.data();
    
    // Filter: only user role (questions)
    if (data.role !== 'user') continue;
    
    // Filter: timestamp in range
    const timestamp = data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp);
    if (timestamp < startDate || timestamp > endDate) continue;
    
    questionsInPeriod++;
    
    const agentId = data.conversationId;
    const msgUserId = data.userId;
    const dateKey = formatDate(timestamp);
    
    // Initialize nested maps
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
  
  console.error(`✅ ${questionsInPeriod} preguntas en el período\n`);
  
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
    
    totalQuestions += agentTotalQuestions;
  }
  
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

function printTableReport(data: any): void {
  console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║  📊 REPORTE: PREGUNTAS POR AGENTE/USUARIO/DÍA (ÚLTIMOS 7 DÍAS)      ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝\n');
  
  console.log(`📅 Período: ${data.period.startDate} → ${data.period.endDate}`);
  console.log(`📊 Total Preguntas: ${data.totalQuestions.toLocaleString()}`);
  console.log(`🤖 Total Agentes con Actividad: ${data.totalAgents}`);
  console.log(`👥 Total Usuarios Activos: ${data.totalUsers}\n`);
  
  if (data.agents.length === 0) {
    console.log('ℹ️  No hay preguntas en el período seleccionado.\n');
    return;
  }
  
  // Print top 20 agents (most active)
  const topAgents = data.agents.slice(0, 20);
  
  console.log(`📌 Mostrando top ${topAgents.length} agentes más activos:\n`);
  
  for (const agent of topAgents) {
    console.log('═'.repeat(80));
    console.log(`\n🤖 AGENTE: ${agent.agentTitle}`);
    console.log(`   ID: ${agent.agentId.substring(0, 20)}...`);
    console.log(`   Owner: ${agent.agentOwner}`);
    console.log(`   Total Preguntas: ${agent.totalQuestions.toLocaleString()}\n`);
    
    if (agent.userBreakdown.length === 0) {
      console.log('   ℹ️  Sin actividad de usuarios\n');
      continue;
    }
    
    for (const userStats of agent.userBreakdown) {
      console.log(`   👤 ${userStats.userName} (${userStats.userEmail})`);
      console.log(`      Total: ${userStats.totalQuestions} preguntas\n`);
      
      console.log('      Desglose diario:');
      console.log('      ┌──────────────┬───────────┐');
      console.log('      │ Fecha        │ Preguntas │');
      console.log('      ├──────────────┼───────────┤');
      
      for (const day of userStats.dailyBreakdown) {
        const date = new Date(day.date);
        const dayName = date.toLocaleDateString('es', { weekday: 'short' }).toUpperCase();
        const countStr = day.count.toString().padStart(9);
        console.log(`      │ ${day.date} ${dayName} │ ${countStr} │`);
      }
      
      console.log('      └──────────────┴───────────┘\n');
    }
  }
  
  if (data.agents.length > 20) {
    console.log(`\n... y ${data.agents.length - 20} agentes más con actividad\n`);
  }
  
  console.log('═'.repeat(80) + '\n');
}

function exportToCSV(data: any): string {
  const lines: string[] = [];
  
  lines.push('Agent ID,Agent Title,Agent Owner,User ID,User Email,User Name,Date,Day,Questions');
  
  for (const agent of data.agents) {
    for (const userStats of agent.userBreakdown) {
      for (const day of userStats.dailyBreakdown) {
        const date = new Date(day.date);
        const dayName = date.toLocaleDateString('es', { weekday: 'long' });
        
        lines.push([
          agent.agentId,
          `"${agent.agentTitle}"`,
          agent.agentOwner,
          userStats.userId,
          userStats.userEmail,
          `"${userStats.userName}"`,
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
    const args = process.argv.slice(2);
    const format = args.find(arg => arg.startsWith('--format='))?.split('=')[1] || 'table';
    
    console.error('🚀 Iniciando generación de reporte...\n');
    
    const report = await generateReport();
    
    console.error('✅ Reporte generado exitosamente!\n');
    
    switch (format) {
      case 'csv':
        console.log('\n📄 FORMATO CSV:\n');
        console.log(exportToCSV(report));
        break;
      
      case 'json':
        console.log('\n📄 FORMATO JSON:\n');
        console.log(JSON.stringify(report, null, 2));
        break;
      
      case 'table':
      default:
        printTableReport(report);
        
        console.log('💾 EXPORTAR:');
        console.log('   CSV:  npx tsx scripts/report-questions-simplified.ts --format=csv > reporte.csv');
        console.log('   JSON: npx tsx scripts/report-questions-simplified.ts --format=json > reporte.json\n');
        break;
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error generando reporte:', error);
    process.exit(1);
  }
}

main();

