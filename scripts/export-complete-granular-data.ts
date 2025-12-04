#!/usr/bin/env tsx
/**
 * Export Complete Granular Data for Advanced Analytics
 * 
 * Enables multi-dimensional analysis:
 * - By agent, by user, by day, by hour
 * - By domain, by sharing status
 * - Individual message tracking
 * 
 * Usage:
 *   npx tsx scripts/export-complete-granular-data.ts --days=30
 */

import { firestore, COLLECTIONS } from '../src/lib/firestore';
import * as fs from 'fs';

interface ConsolidatedData {
  metadata: {
    generated: string;
    periodStart: string;
    periodEnd: string;
    totalDays: number;
  };
  
  // Datos maestros para filtros
  agents: Array<{
    agentId: string;
    agentCode: string; // M3-v2, S1-v2, etc.
    agentTitle: string;
    ownerEmail: string;
    ownerName: string;
    isShared: boolean;
    sharedWithCount: number;
    status: 'Producción' | 'Privado';
  }>;
  
  users: Array<{
    userId: string;
    userEmail: string;
    userName: string;
    domain: string;
  }>;
  
  domains: Array<{
    domain: string;
    userCount: number;
  }>;
  
  // Datos granulares por día
  dailyInteractions: Array<{
    date: string;
    dayName: string;
    dayOfWeek: number; // 0=domingo, 1=lunes, etc.
    agentId: string;
    agentCode: string;
    agentTitle: string;
    userId: string;
    userEmail: string;
    userName: string;
    domain: string;
    isShared: boolean;
    status: string;
    questions: number;
    responses: number;
    totalMessages: number;
  }>;
  
  // Datos por hora del día
  hourlyInteractions: Array<{
    date: string;
    hour: number; // 0-23
    hourLabel: string; // "00:00", "01:00", etc.
    agentId: string;
    agentCode: string;
    agentTitle: string;
    userId: string;
    userEmail: string;
    userName: string;
    domain: string;
    isShared: boolean;
    status: string;
    questions: number;
    responses: number;
    totalMessages: number;
  }>;
  
  // Registro de cada conversación (chat session)
  conversations: Array<{
    conversationId: string;
    conversationType: 'agent' | 'chat'; // agent directo o chat derivado
    agentId: string; // El agente padre
    agentCode: string;
    agentTitle: string;
    conversationTitle: string;
    userId: string;
    userEmail: string;
    userName: string;
    domain: string;
    isShared: boolean;
    status: string;
    firstMessage: string;
    lastMessage: string;
    totalMessages: number;
    questions: number;
    responses: number;
    daysActive: number;
  }>;
  
  // Sumarios agregados
  summary: {
    totalMessages: number;
    totalQuestions: number;
    totalResponses: number;
    uniqueUsers: number;
    uniqueAgents: number;
    uniqueConversations: number;
    agentsInProduction: number;
    privateAgents: number;
  };
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatDateTime(date: Date): string {
  return date.toISOString();
}

function getDayName(date: Date): string {
  return date.toLocaleDateString('es', { weekday: 'long' });
}

function getDomain(email: string): string {
  const parts = email.split('@');
  return parts.length > 1 ? parts[1] : 'unknown';
}

function getAgentCode(title: string): string {
  // Extract M3-v2, S1-v2, etc. from title
  const match = title.match(/\b([MS]\d+-v\d+)\b/);
  return match ? match[1] : '';
}

async function main() {
  try {
    const args = process.argv.slice(2);
    const daysArg = args.find(a => a.startsWith('--days='));
    const days = daysArg ? parseInt(daysArg.split('=')[1]) : 30;
    
    console.error('📊 Exportación Granular Completa para Analytics Avanzado\n');
    console.error(`📅 Período: Últimos ${days} días\n`);
    
    // Calculate date range
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);
    
    console.error(`🗓️  Rango: ${formatDate(startDate)} → ${formatDate(endDate)}\n`);
    
    // Load users
    console.error('👥 Cargando usuarios...');
    const usersSnapshot = await firestore.collection(COLLECTIONS.USERS).get();
    const usersMap = new Map();
    
    for (const doc of usersSnapshot.docs) {
      const data = doc.data();
      const email = data.email || 'unknown';
      usersMap.set(doc.id, {
        email,
        name: data.name || email,
        domain: getDomain(email)
      });
      
      if (data.googleUserId) {
        usersMap.set(data.googleUserId, {
          email,
          name: data.name || email,
          domain: getDomain(email)
        });
      }
    }
    
    console.error(`✅ ${usersMap.size} usuarios`);
    
    // Load agent shares
    console.error('🤝 Cargando compartidos...');
    const sharesSnapshot = await firestore.collection(COLLECTIONS.AGENT_SHARES).get();
    const agentSharesMap = new Map();
    
    for (const doc of sharesSnapshot.docs) {
      const data = doc.data();
      const sharedWith = data.sharedWith || [];
      const activeShares = Array.isArray(sharedWith) 
        ? sharedWith.filter((s: any) => s.type === 'user').length
        : 0;
      
      agentSharesMap.set(data.agentId, activeShares);
    }
    
    console.error(`✅ ${sharesSnapshot.size} registros`);
    
    // Load ALL conversations (agents + chats)
    console.error('🤖 Cargando conversaciones...');
    const conversationsSnapshot = await firestore.collection(COLLECTIONS.CONVERSATIONS).get();
    const agentsMap = new Map();
    const conversationsMap = new Map();
    const chatToAgentMap = new Map();
    
    for (const doc of conversationsSnapshot.docs) {
      const data = doc.data();
      const sharedWithCount = agentSharesMap.get(doc.id) || 0;
      const isShared = sharedWithCount > 0;
      
      const info = {
        id: doc.id,
        title: data.title || 'Sin título',
        userId: data.userId,
        isAgent: data.isAgent === true,
        agentId: data.agentId,
        isShared,
        sharedWithCount,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date()
      };
      
      conversationsMap.set(doc.id, info);
      
      if (data.isAgent === true) {
        agentsMap.set(doc.id, info);
      } else if (data.agentId) {
        chatToAgentMap.set(doc.id, data.agentId);
      }
    }
    
    console.error(`✅ ${agentsMap.size} agentes, ${chatToAgentMap.size} chats\n`);
    
    // Load messages
    console.error('💬 Cargando mensajes...');
    const messagesSnapshot = await firestore.collection(COLLECTIONS.MESSAGES).get();
    
    // Process all messages
    const messagesList = [];
    
    for (const doc of messagesSnapshot.docs) {
      const data = doc.data();
      const timestamp = data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp);
      
      if (timestamp >= startDate && timestamp <= endDate) {
        messagesList.push({
          id: doc.id,
          conversationId: data.conversationId,
          userId: data.userId,
          role: data.role,
          timestamp,
          content: typeof data.content === 'string' ? data.content : data.content?.text || ''
        });
      }
    }
    
    console.error(`✅ ${messagesList.length} mensajes en rango\n`);
    
    // Build output structure
    console.error('📝 Construyendo estructuras de datos...\n');
    
    // 1. Agents list
    const agents = Array.from(agentsMap.values()).map(agent => {
      const ownerInfo = usersMap.get(agent.userId) || { email: 'unknown', name: 'Unknown' };
      return {
        agentId: agent.id,
        agentCode: getAgentCode(agent.title),
        agentTitle: agent.title,
        ownerEmail: ownerInfo.email,
        ownerName: ownerInfo.name,
        isShared: agent.isShared,
        sharedWithCount: agent.sharedWithCount,
        status: agent.isShared ? 'Producción' : 'Privado'
      };
    });
    
    // 2. Users list (unique users in period)
    const uniqueUserIds = new Set(messagesList.map(m => m.userId));
    const users = Array.from(uniqueUserIds).map(userId => {
      const userInfo = usersMap.get(userId) || { email: 'unknown', name: 'Unknown', domain: 'unknown' };
      return {
        userId,
        userEmail: userInfo.email,
        userName: userInfo.name,
        domain: userInfo.domain
      };
    });
    
    // 3. Domains list
    const domainStats = new Map();
    for (const user of users) {
      if (!domainStats.has(user.domain)) {
        domainStats.set(user.domain, 0);
      }
      domainStats.set(user.domain, domainStats.get(user.domain) + 1);
    }
    
    const domains = Array.from(domainStats.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([domain, count]) => ({
        domain,
        userCount: count
      }));
    
    // 4. Daily interactions (fecha × agente × usuario)
    console.error('📅 Procesando interacciones diarias...');
    const dailyMap = new Map();
    
    for (const msg of messagesList) {
      const conversationId = msg.conversationId;
      const agentId = chatToAgentMap.get(conversationId) || conversationId;
      const agentInfo = agentsMap.get(agentId);
      
      if (!agentInfo) continue; // Skip if not an agent
      
      const date = formatDate(msg.timestamp);
      const key = `${date}_${agentId}_${msg.userId}`;
      
      if (!dailyMap.has(key)) {
        const userInfo = usersMap.get(msg.userId) || { email: 'unknown', name: 'Unknown', domain: 'unknown' };
        const dateObj = new Date(date);
        
        dailyMap.set(key, {
          date,
          dayName: getDayName(dateObj),
          dayOfWeek: dateObj.getDay(),
          agentId,
          agentCode: getAgentCode(agentInfo.title),
          agentTitle: agentInfo.title,
          userId: msg.userId,
          userEmail: userInfo.email,
          userName: userInfo.name,
          domain: userInfo.domain,
          isShared: agentInfo.isShared,
          status: agentInfo.isShared ? 'Producción' : 'Privado',
          questions: 0,
          responses: 0,
          totalMessages: 0
        });
      }
      
      const stats = dailyMap.get(key);
      stats.totalMessages++;
      if (msg.role === 'user') stats.questions++;
      if (msg.role === 'assistant') stats.responses++;
    }
    
    const dailyInteractions = Array.from(dailyMap.values())
      .sort((a, b) => a.date.localeCompare(b.date) || a.agentTitle.localeCompare(b.agentTitle));
    
    console.error(`✅ ${dailyInteractions.length} registros diarios\n`);
    
    // 5. Hourly interactions (fecha × hora × agente × usuario)
    console.error('⏰ Procesando interacciones por hora...');
    const hourlyMap = new Map();
    
    for (const msg of messagesList) {
      const conversationId = msg.conversationId;
      const agentId = chatToAgentMap.get(conversationId) || conversationId;
      const agentInfo = agentsMap.get(agentId);
      
      if (!agentInfo) continue;
      
      const date = formatDate(msg.timestamp);
      const hour = msg.timestamp.getHours();
      const key = `${date}_${hour}_${agentId}_${msg.userId}`;
      
      if (!hourlyMap.has(key)) {
        const userInfo = usersMap.get(msg.userId) || { email: 'unknown', name: 'Unknown', domain: 'unknown' };
        
        hourlyMap.set(key, {
          date,
          hour,
          hourLabel: hour.toString().padStart(2, '0') + ':00',
          agentId,
          agentCode: getAgentCode(agentInfo.title),
          agentTitle: agentInfo.title,
          userId: msg.userId,
          userEmail: userInfo.email,
          userName: userInfo.name,
          domain: userInfo.domain,
          isShared: agentInfo.isShared,
          status: agentInfo.isShared ? 'Producción' : 'Privado',
          questions: 0,
          responses: 0,
          totalMessages: 0
        });
      }
      
      const stats = hourlyMap.get(key);
      stats.totalMessages++;
      if (msg.role === 'user') stats.questions++;
      if (msg.role === 'assistant') stats.responses++;
    }
    
    const hourlyInteractions = Array.from(hourlyMap.values())
      .sort((a, b) => 
        a.date.localeCompare(b.date) || 
        a.hour - b.hour ||
        a.agentTitle.localeCompare(b.agentTitle)
      );
    
    console.error(`✅ ${hourlyInteractions.length} registros por hora\n`);
    
    // 6. Conversations (cada chat session)
    console.error('💬 Procesando conversaciones...');
    const conversationStats = new Map();
    
    for (const msg of messagesList) {
      const conversationId = msg.conversationId;
      const agentId = chatToAgentMap.get(conversationId) || conversationId;
      const agentInfo = agentsMap.get(agentId);
      const conversationInfo = conversationsMap.get(conversationId);
      
      if (!agentInfo || !conversationInfo) continue;
      
      if (!conversationStats.has(conversationId)) {
        const userInfo = usersMap.get(msg.userId) || { email: 'unknown', name: 'Unknown', domain: 'unknown' };
        
        conversationStats.set(conversationId, {
          conversationId,
          conversationType: conversationInfo.isAgent ? 'agent' : 'chat',
          agentId,
          agentCode: getAgentCode(agentInfo.title),
          agentTitle: agentInfo.title,
          conversationTitle: conversationInfo.title,
          userId: msg.userId,
          userEmail: userInfo.email,
          userName: userInfo.name,
          domain: userInfo.domain,
          isShared: agentInfo.isShared,
          status: agentInfo.isShared ? 'Producción' : 'Privado',
          firstMessage: msg.timestamp,
          lastMessage: msg.timestamp,
          totalMessages: 0,
          questions: 0,
          responses: 0,
          activeDays: new Set()
        });
      }
      
      const stats = conversationStats.get(conversationId);
      stats.totalMessages++;
      if (msg.role === 'user') stats.questions++;
      if (msg.role === 'assistant') stats.responses++;
      
      if (msg.timestamp < stats.firstMessage) stats.firstMessage = msg.timestamp;
      if (msg.timestamp > stats.lastMessage) stats.lastMessage = msg.timestamp;
      
      stats.activeDays.add(formatDate(msg.timestamp));
    }
    
    const conversations = Array.from(conversationStats.values())
      .map(conv => ({
        ...conv,
        firstMessage: formatDateTime(conv.firstMessage),
        lastMessage: formatDateTime(conv.lastMessage),
        daysActive: conv.activeDays.size,
        activeDays: undefined // Remove Set
      }))
      .sort((a, b) => b.totalMessages - a.totalMessages);
    
    console.error(`✅ ${conversations.length} conversaciones únicas\n`);
    
    // Calculate summary
    const totalMessages = messagesList.length;
    const totalQuestions = messagesList.filter(m => m.role === 'user').length;
    const totalResponses = messagesList.filter(m => m.role === 'assistant').length;
    const uniqueUsers = new Set(messagesList.map(m => m.userId)).size;
    const uniqueAgents = agentsMap.size;
    const uniqueConversations = conversations.length;
    const agentsInProduction = agents.filter(a => a.isShared).length;
    const privateAgents = agents.filter(a => !a.isShared).length;
    
    // Build consolidated data
    const consolidatedData: ConsolidatedData = {
      metadata: {
        generated: new Date().toISOString(),
        periodStart: formatDate(startDate),
        periodEnd: formatDate(endDate),
        totalDays: days
      },
      agents,
      users,
      domains,
      dailyInteractions,
      hourlyInteractions,
      conversations,
      summary: {
        totalMessages,
        totalQuestions,
        totalResponses,
        uniqueUsers,
        uniqueAgents,
        uniqueConversations,
        agentsInProduction,
        privateAgents
      }
    };
    
    // Write JSON
    const outputPath = './exports/salfa-analytics/analytics-complete.json';
    console.error('💾 Escribiendo JSON...');
    fs.writeFileSync(outputPath, JSON.stringify(consolidatedData, null, 2));
    
    const stats = fs.statSync(outputPath);
    const fileSizeKB = (stats.size / 1024).toFixed(2);
    
    console.error('\n' + '═'.repeat(70));
    console.error('✅ EXPORTACIÓN GRANULAR COMPLETA!');
    console.error('═'.repeat(70));
    console.error(`\n📁 Archivo: ${outputPath}`);
    console.error(`📏 Tamaño: ${fileSizeKB} KB\n`);
    
    console.error('📊 CONTENIDO:');
    console.error(`   • Agentes: ${agents.length} (${agentsInProduction} en producción)`);
    console.error(`   • Usuarios: ${users.length} únicos`);
    console.error(`   • Dominios: ${domains.length}`);
    console.error(`   • Interacciones diarias: ${dailyInteractions.length} registros (día × agente × usuario)`);
    console.error(`   • Interacciones por hora: ${hourlyInteractions.length} registros (hora × agente × usuario)`);
    console.error(`   • Conversaciones: ${conversations.length} únicas`);
    console.error(`   • Total mensajes: ${totalMessages}\n`);
    
    console.error('🎯 ANÁLISIS POSIBLES:');
    console.error('   ✅ Agrupar por: Agente, Usuario, Día, Hora, Dominio, Status');
    console.error('   ✅ Filtrar por: Email, Dominio, Agente, Fecha, Hora, Compartido');
    console.error('   ✅ Análisis: Tendencias, Patrones, Adopción, Uso por hora\n');
    
    // Print sample for main agents
    console.error('🤖 AGENTES PRINCIPALES EN LOS DATOS:\n');
    const mainAgentCodes = ['M3-v2', 'S1-v2', 'S2-v2', 'M1-v2'];
    
    for (const code of mainAgentCodes) {
      const agent = agents.find(a => a.agentCode === code);
      if (agent) {
        const agentDailyData = dailyInteractions.filter(d => d.agentCode === code);
        const uniqueDays = new Set(agentDailyData.map(d => d.date)).size;
        const uniqueUsersForAgent = new Set(agentDailyData.map(d => d.userId)).size;
        
        console.error(`   ${code}: ${agent.agentTitle}`);
        console.error(`      Días con actividad: ${uniqueDays}`);
        console.error(`      Usuarios únicos: ${uniqueUsersForAgent}`);
        console.error(`      Compartido con: ${agent.sharedWithCount} usuarios`);
        console.error('');
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();


