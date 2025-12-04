#!/usr/bin/env tsx
/**
 * Export Consolidated JSON for SalfaGPT Dashboard
 * Single JSON file with all statistics data
 * 
 * Usage:
 *   npx tsx scripts/export-consolidated-json.ts [--days=90] [--output=./exports/salfa-analytics/dashboard-data.json]
 */

import { firestore, COLLECTIONS } from '../src/lib/firestore';
import * as fs from 'fs';

interface DateRange {
  startDate: Date;
  endDate: Date;
  dates: string[];
}

interface UserInfo {
  email: string;
  name: string;
  domain: string;
}

interface AgentInfo {
  title: string;
  userId: string;
  isAgent: boolean;
  agentId?: string;
  isShared: boolean;
  sharedWithCount: number;
}

interface MessageData {
  conversationId: string;
  userId: string;
  role: string;
  timestamp: Date;
}

// Output types
interface UserEngagement {
  userId: string;
  userEmail: string;
  userName: string;
  domain: string;
  totalMessages: number;
  userQuestions: number;
  assistantResponses: number;
  daysActive: number;
  firstMessage: string;
  lastMessage: string;
}

interface AgentPerformance {
  agentId: string;
  agentTitle: string;
  ownerEmail: string;
  totalMessages: number;
  uniqueUsers: number;
  avgMessagesPerUser: number;
  isShared: boolean;
  sharedWithCount: number;
  status: 'Producción' | 'Privado';
}

interface DailyActivity {
  date: string;
  dayName: string;
  totalMessages: number;
  activeAgents: number;
  uniqueUsers: number;
}

interface HourlyDistribution {
  hour: string;
  totalMessages: number;
  userQuestions: number;
  assistantResponses: number;
  avgMessagesPerDay: number;
}

interface DomainDistribution {
  domain: string;
  uniqueUsers: number;
  totalMessages: number;
  userQuestions: number;
  assistantResponses: number;
  percentageOfUsers: number;
}

interface KPI {
  metric: string;
  value: number | string;
}

interface ConsolidatedData {
  metadata: {
    generated: string;
    periodStart: string;
    periodEnd: string;
    totalDays: number;
  };
  kpis: KPI[];
  userEngagement: UserEngagement[];
  agentPerformance: AgentPerformance[];
  dailyActivity: DailyActivity[];
  hourlyDistribution: HourlyDistribution[];
  domainDistribution: DomainDistribution[];
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatDateTime(date: Date): string {
  return date.toISOString();
}

function getDateRange(days: number): DateRange {
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);
  
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - (days - 1));
  startDate.setHours(0, 0, 0, 0);
  
  const dates: string[] = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    dates.push(formatDate(date));
  }
  
  return { startDate, endDate, dates };
}

function getDomain(email: string): string {
  const parts = email.split('@');
  return parts.length > 1 ? parts[1] : 'unknown';
}

function getDayName(date: Date): string {
  return date.toLocaleDateString('es', { weekday: 'long' });
}

function getHour(date: Date): number {
  return date.getHours();
}

async function loadData(dateRange: DateRange) {
  console.error('📊 Cargando datos de Firestore...\n');
  
  // Load users
  console.error('👥 Cargando usuarios...');
  const usersSnapshot = await firestore.collection(COLLECTIONS.USERS).get();
  const usersMap = new Map<string, UserInfo>();
  
  for (const doc of usersSnapshot.docs) {
    const data = doc.data();
    const email = data.email || 'unknown';
    const userInfo: UserInfo = {
      email,
      name: data.name || email,
      domain: getDomain(email),
    };
    
    usersMap.set(doc.id, userInfo);
    if (data.googleUserId) {
      usersMap.set(data.googleUserId, userInfo);
    }
  }
  
  console.error(`✅ ${usersMap.size} usuarios`);
  
  // Load agent shares
  console.error('🤝 Cargando compartidos...');
  const sharesSnapshot = await firestore.collection(COLLECTIONS.AGENT_SHARES).get();
  const agentSharesMap = new Map<string, number>();
  
  for (const doc of sharesSnapshot.docs) {
    const data = doc.data();
    const agentId = data.agentId;
    const sharedWith = data.sharedWith || [];
    const activeShares = Array.isArray(sharedWith) 
      ? sharedWith.filter((s: any) => s.type === 'user').length
      : 0;
    
    agentSharesMap.set(agentId, activeShares);
  }
  
  console.error(`✅ ${sharesSnapshot.size} registros de compartidos`);
  
  // Load conversations
  console.error('🤖 Cargando conversaciones...');
  const conversationsSnapshot = await firestore.collection(COLLECTIONS.CONVERSATIONS).get();
  const agentsMap = new Map<string, AgentInfo>();
  const onlyAgentsMap = new Map<string, AgentInfo>();
  
  for (const doc of conversationsSnapshot.docs) {
    const data = doc.data();
    const sharedWithCount = agentSharesMap.get(doc.id) || 0;
    const isShared = sharedWithCount > 0;
    
    const info: AgentInfo = {
      title: data.title || 'Sin título',
      userId: data.userId,
      isAgent: data.isAgent === true,
      agentId: data.agentId,
      isShared,
      sharedWithCount,
    };
    
    agentsMap.set(doc.id, info);
    
    if (data.isAgent === true) {
      onlyAgentsMap.set(doc.id, info);
    }
  }
  
  console.error(`✅ ${onlyAgentsMap.size} agentes reales\n`);
  
  // Load messages
  console.error('💬 Cargando mensajes...');
  const messagesSnapshot = await firestore.collection(COLLECTIONS.MESSAGES).get();
  const messages: MessageData[] = [];
  
  for (const doc of messagesSnapshot.docs) {
    const data = doc.data();
    const timestamp = data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp);
    
    if (timestamp >= dateRange.startDate && timestamp <= dateRange.endDate) {
      messages.push({
        conversationId: data.conversationId,
        userId: data.userId,
        role: data.role,
        timestamp,
      });
    }
  }
  
  console.error(`✅ ${messages.length} mensajes\n`);
  
  return { usersMap, agentsMap, onlyAgentsMap, messages };
}

function generateUserEngagement(messages: MessageData[], usersMap: Map<string, UserInfo>): UserEngagement[] {
  const userStats = new Map<string, {
    totalMessages: number;
    userQuestions: number;
    assistantResponses: number;
    activeDays: Set<string>;
    firstMessage: Date;
    lastMessage: Date;
  }>();
  
  for (const msg of messages) {
    if (!userStats.has(msg.userId)) {
      userStats.set(msg.userId, {
        totalMessages: 0,
        userQuestions: 0,
        assistantResponses: 0,
        activeDays: new Set(),
        firstMessage: msg.timestamp,
        lastMessage: msg.timestamp,
      });
    }
    
    const stats = userStats.get(msg.userId)!;
    stats.totalMessages++;
    
    if (msg.role === 'user') {
      stats.userQuestions++;
    } else if (msg.role === 'assistant') {
      stats.assistantResponses++;
    }
    
    if (msg.timestamp < stats.firstMessage) stats.firstMessage = msg.timestamp;
    if (msg.timestamp > stats.lastMessage) stats.lastMessage = msg.timestamp;
    
    stats.activeDays.add(formatDate(msg.timestamp));
  }
  
  return Array.from(userStats.entries())
    .sort((a, b) => b[1].totalMessages - a[1].totalMessages)
    .map(([userId, stats]) => {
      const userInfo = usersMap.get(userId) || { email: 'unknown', name: 'Unknown', domain: 'unknown' };
      
      return {
        userId,
        userEmail: userInfo.email,
        userName: userInfo.name,
        domain: userInfo.domain,
        totalMessages: stats.totalMessages,
        userQuestions: stats.userQuestions,
        assistantResponses: stats.assistantResponses,
        daysActive: stats.activeDays.size,
        firstMessage: formatDateTime(stats.firstMessage),
        lastMessage: formatDateTime(stats.lastMessage),
      };
    });
}

function generateAgentPerformance(
  messages: MessageData[],
  onlyAgentsMap: Map<string, AgentInfo>,
  allConversationsMap: Map<string, AgentInfo>,
  usersMap: Map<string, UserInfo>
): AgentPerformance[] {
  const conversationStats = new Map<string, {
    totalMessages: number;
    uniqueUsers: Set<string>;
  }>();
  
  for (const msg of messages) {
    if (!conversationStats.has(msg.conversationId)) {
      conversationStats.set(msg.conversationId, {
        totalMessages: 0,
        uniqueUsers: new Set(),
      });
    }
    
    const stats = conversationStats.get(msg.conversationId)!;
    stats.totalMessages++;
    stats.uniqueUsers.add(msg.userId);
  }
  
  const agentStats = new Map<string, {
    totalMessages: number;
    uniqueUsers: Set<string>;
  }>();
  
  for (const [agentId] of onlyAgentsMap.entries()) {
    agentStats.set(agentId, {
      totalMessages: 0,
      uniqueUsers: new Set(),
    });
  }
  
  for (const [conversationId, stats] of conversationStats.entries()) {
    const conversationInfo = allConversationsMap.get(conversationId);
    if (!conversationInfo) continue;
    
    if (conversationInfo.isAgent) {
      const agentStat = agentStats.get(conversationId);
      if (agentStat) {
        agentStat.totalMessages += stats.totalMessages;
        stats.uniqueUsers.forEach(u => agentStat.uniqueUsers.add(u));
      }
    } else if (conversationInfo.agentId) {
      const parentAgentStat = agentStats.get(conversationInfo.agentId);
      if (parentAgentStat) {
        parentAgentStat.totalMessages += stats.totalMessages;
        stats.uniqueUsers.forEach(u => parentAgentStat.uniqueUsers.add(u));
      }
    }
  }
  
  return Array.from(agentStats.entries())
    .sort((a, b) => b[1].totalMessages - a[1].totalMessages)
    .map(([agentId, stats]) => {
      const agentInfo = onlyAgentsMap.get(agentId)!;
      const ownerInfo = usersMap.get(agentInfo.userId) || { email: 'unknown', name: 'Unknown', domain: 'unknown' };
      
      return {
        agentId,
        agentTitle: agentInfo.title,
        ownerEmail: ownerInfo.email,
        totalMessages: stats.totalMessages,
        uniqueUsers: stats.uniqueUsers.size,
        avgMessagesPerUser: stats.uniqueUsers.size > 0 
          ? parseFloat((stats.totalMessages / stats.uniqueUsers.size).toFixed(2))
          : 0,
        isShared: agentInfo.isShared,
        sharedWithCount: agentInfo.sharedWithCount,
        status: agentInfo.isShared ? 'Producción' : 'Privado',
      };
    });
}

function generateDailyActivity(messages: MessageData[], dateRange: DateRange): DailyActivity[] {
  const dailyStats = new Map<string, {
    totalMessages: number;
    activeAgents: Set<string>;
    uniqueUsers: Set<string>;
  }>();
  
  for (const date of dateRange.dates) {
    dailyStats.set(date, {
      totalMessages: 0,
      activeAgents: new Set(),
      uniqueUsers: new Set(),
    });
  }
  
  for (const msg of messages) {
    const dateKey = formatDate(msg.timestamp);
    const stats = dailyStats.get(dateKey);
    
    if (stats) {
      stats.totalMessages++;
      stats.activeAgents.add(msg.conversationId);
      stats.uniqueUsers.add(msg.userId);
    }
  }
  
  return dateRange.dates.map(date => {
    const stats = dailyStats.get(date)!;
    const dateObj = new Date(date);
    
    return {
      date,
      dayName: getDayName(dateObj),
      totalMessages: stats.totalMessages,
      activeAgents: stats.activeAgents.size,
      uniqueUsers: stats.uniqueUsers.size,
    };
  });
}

function generateHourlyDistribution(messages: MessageData[], dateRange: DateRange): HourlyDistribution[] {
  const hourlyStats = new Map<number, {
    totalMessages: number;
    userQuestions: number;
    assistantResponses: number;
    days: Set<string>;
  }>();
  
  for (let hour = 0; hour < 24; hour++) {
    hourlyStats.set(hour, {
      totalMessages: 0,
      userQuestions: 0,
      assistantResponses: 0,
      days: new Set(),
    });
  }
  
  for (const msg of messages) {
    const hour = getHour(msg.timestamp);
    const stats = hourlyStats.get(hour)!;
    
    stats.totalMessages++;
    stats.days.add(formatDate(msg.timestamp));
    
    if (msg.role === 'user') {
      stats.userQuestions++;
    } else if (msg.role === 'assistant') {
      stats.assistantResponses++;
    }
  }
  
  return Array.from(hourlyStats.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([hour, stats]) => ({
      hour: hour.toString().padStart(2, '0'),
      totalMessages: stats.totalMessages,
      userQuestions: stats.userQuestions,
      assistantResponses: stats.assistantResponses,
      avgMessagesPerDay: stats.days.size > 0 
        ? parseFloat((stats.totalMessages / stats.days.size).toFixed(2))
        : 0,
    }));
}

function generateDomainDistribution(messages: MessageData[], usersMap: Map<string, UserInfo>): DomainDistribution[] {
  const domainStats = new Map<string, {
    uniqueUsers: Set<string>;
    totalMessages: number;
    userQuestions: number;
    assistantResponses: number;
  }>();
  
  for (const msg of messages) {
    const userInfo = usersMap.get(msg.userId);
    const domain = userInfo?.domain || 'unknown';
    
    if (!domainStats.has(domain)) {
      domainStats.set(domain, {
        uniqueUsers: new Set(),
        totalMessages: 0,
        userQuestions: 0,
        assistantResponses: 0,
      });
    }
    
    const stats = domainStats.get(domain)!;
    stats.uniqueUsers.add(msg.userId);
    stats.totalMessages++;
    
    if (msg.role === 'user') {
      stats.userQuestions++;
    } else if (msg.role === 'assistant') {
      stats.assistantResponses++;
    }
  }
  
  const totalUniqueUsers = new Set(messages.map(m => m.userId)).size;
  
  return Array.from(domainStats.entries())
    .sort((a, b) => b[1].uniqueUsers.size - a[1].uniqueUsers.size)
    .map(([domain, stats]) => ({
      domain,
      uniqueUsers: stats.uniqueUsers.size,
      totalMessages: stats.totalMessages,
      userQuestions: stats.userQuestions,
      assistantResponses: stats.assistantResponses,
      percentageOfUsers: totalUniqueUsers > 0
        ? parseFloat(((stats.uniqueUsers.size / totalUniqueUsers) * 100).toFixed(2))
        : 0,
    }));
}

async function main() {
  try {
    const args = process.argv.slice(2);
    const daysArg = args.find(a => a.startsWith('--days='));
    const outputArg = args.find(a => a.startsWith('--output='));
    
    const days = daysArg ? parseInt(daysArg.split('=')[1]) : 90;
    const outputPath = outputArg 
      ? outputArg.split('=')[1] 
      : './exports/salfa-analytics/dashboard-data.json';
    
    console.error('📊 Generando JSON Consolidado para SalfaGPT Dashboard\n');
    console.error(`📅 Período: Últimos ${days} días`);
    console.error(`📁 Output: ${outputPath}\n`);
    
    const dateRange = getDateRange(days);
    const { usersMap, agentsMap, onlyAgentsMap, messages } = await loadData(dateRange);
    
    console.error('📝 Generando estructuras de datos...\n');
    
    // Generate all datasets
    console.error('1️⃣  User engagement...');
    const userEngagement = generateUserEngagement(messages, usersMap);
    
    console.error('2️⃣  Agent performance...');
    const agentPerformance = generateAgentPerformance(messages, onlyAgentsMap, agentsMap, usersMap);
    
    console.error('3️⃣  Daily activity...');
    const dailyActivity = generateDailyActivity(messages, dateRange);
    
    console.error('4️⃣  Hourly distribution...');
    const hourlyDistribution = generateHourlyDistribution(messages, dateRange);
    
    console.error('5️⃣  Domain distribution...');
    const domainDistribution = generateDomainDistribution(messages, usersMap);
    
    // Calculate KPIs
    console.error('6️⃣  KPIs summary...\n');
    const totalMessages = messages.length;
    const userQuestions = messages.filter(m => m.role === 'user').length;
    const assistantResponses = messages.filter(m => m.role === 'assistant').length;
    const uniqueUsers = new Set(messages.map(m => m.userId)).size;
    const uniqueConversations = new Set(messages.map(m => m.conversationId)).size;
    
    const kpis: KPI[] = [
      { metric: 'Total Messages', value: totalMessages },
      { metric: 'User Questions', value: userQuestions },
      { metric: 'Assistant Responses', value: assistantResponses },
      { metric: 'Total Conversations', value: uniqueConversations },
      { metric: 'Active Users', value: uniqueUsers },
      { metric: 'Active Agents', value: onlyAgentsMap.size },
      { metric: 'Avg Messages Per User', value: uniqueUsers > 0 ? parseFloat((totalMessages / uniqueUsers).toFixed(2)) : 0 },
      { metric: 'Avg Messages Per Agent', value: onlyAgentsMap.size > 0 ? parseFloat((totalMessages / onlyAgentsMap.size).toFixed(2)) : 0 },
    ];
    
    // Build consolidated JSON
    const consolidatedData: ConsolidatedData = {
      metadata: {
        generated: new Date().toISOString(),
        periodStart: formatDate(dateRange.startDate),
        periodEnd: formatDate(dateRange.endDate),
        totalDays: dateRange.dates.length,
      },
      kpis,
      userEngagement,
      agentPerformance,
      dailyActivity,
      hourlyDistribution,
      domainDistribution,
    };
    
    // Write JSON file
    console.error('💾 Escribiendo archivo JSON...');
    fs.writeFileSync(outputPath, JSON.stringify(consolidatedData, null, 2));
    
    console.error('✅ Archivo guardado!\n');
    console.error('═'.repeat(60));
    console.error('✅ JSON CONSOLIDADO GENERADO!');
    console.error('═'.repeat(60));
    console.error(`\n📁 Archivo: ${outputPath}`);
    
    // Calculate file size
    const stats = fs.statSync(outputPath);
    const fileSizeKB = (stats.size / 1024).toFixed(2);
    
    console.error(`📏 Tamaño: ${fileSizeKB} KB\n`);
    
    console.error('📊 CONTENIDO:');
    console.error(`   • KPIs: ${kpis.length} métricas`);
    console.error(`   • User Engagement: ${userEngagement.length} usuarios`);
    console.error(`   • Agent Performance: ${agentPerformance.length} agentes`);
    console.error(`   • Daily Activity: ${dailyActivity.length} días`);
    console.error(`   • Hourly Distribution: ${hourlyDistribution.length} horas`);
    console.error(`   • Domain Distribution: ${domainDistribution.length} dominios\n`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();


