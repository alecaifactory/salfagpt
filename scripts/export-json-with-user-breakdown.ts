#!/usr/bin/env tsx
/**
 * Export JSON with User Breakdown per Agent
 * Shows which users interacted with each agent and how much
 * 
 * Usage:
 *   npx tsx scripts/export-json-with-user-breakdown.ts --days=90
 */

import { firestore, COLLECTIONS } from '../src/lib/firestore';
import * as fs from 'fs';

async function main() {
  const args = process.argv.slice(2);
  const daysArg = args.find(a => a.startsWith('--days='));
  const days = daysArg ? parseInt(daysArg.split('=')[1]) : 90;
  
  console.error('📊 Generando JSON con Desglose por Usuario\n');
  
  // Calculate date range
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - (days - 1));
  startDate.setHours(0, 0, 0, 0);
  
  console.error(`📅 Período: ${startDate.toISOString().split('T')[0]} → ${endDate.toISOString().split('T')[0]}\n`);
  
  // Load users
  console.error('👥 Cargando usuarios...');
  const usersSnapshot = await firestore.collection(COLLECTIONS.USERS).get();
  const usersMap = new Map();
  
  for (const doc of usersSnapshot.docs) {
    const data = doc.data();
    usersMap.set(doc.id, {
      email: data.email || 'unknown',
      name: data.name || data.email || 'Unknown',
      domain: data.email ? data.email.split('@')[1] : 'unknown'
    });
    
    if (data.googleUserId) {
      usersMap.set(data.googleUserId, {
        email: data.email || 'unknown',
        name: data.name || data.email || 'Unknown',
        domain: data.email ? data.email.split('@')[1] : 'unknown'
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
  
  // Load conversations (agents + chats)
  console.error('🤖 Cargando conversaciones...');
  const conversationsSnapshot = await firestore.collection(COLLECTIONS.CONVERSATIONS).get();
  const agentsMap = new Map();
  const conversationToAgentMap = new Map(); // Map chat → parent agent
  
  for (const doc of conversationsSnapshot.docs) {
    const data = doc.data();
    if (data.isAgent === true) {
      const sharedWithCount = agentSharesMap.get(doc.id) || 0;
      agentsMap.set(doc.id, {
        title: data.title || 'Sin título',
        userId: data.userId,
        isShared: sharedWithCount > 0,
        sharedWithCount
      });
    } else if (data.agentId) {
      // Es un chat derivado - mapear al agente padre
      conversationToAgentMap.set(doc.id, data.agentId);
    }
  }
  
  console.error(`✅ ${agentsMap.size} agentes reales`);
  console.error(`✅ ${conversationToAgentMap.size} chats derivados\n`);
  
  // Load messages
  console.error('💬 Cargando mensajes...');
  const messagesSnapshot = await firestore.collection(COLLECTIONS.MESSAGES).get();
  
  // Group messages by agent, then by user
  const agentUserStats = new Map();
  
  for (const doc of messagesSnapshot.docs) {
    const data = doc.data();
    const timestamp = data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp);
    
    if (timestamp < startDate || timestamp > endDate) continue;
    
    const conversationId = data.conversationId;
    const userId = data.userId;
    
    // Determinar el agentId real (si es un chat, usar el padre)
    const agentId = conversationToAgentMap.get(conversationId) || conversationId;
    
    if (!agentUserStats.has(agentId)) {
      agentUserStats.set(agentId, new Map());
    }
    
    const agentStats = agentUserStats.get(agentId);
    
    if (!agentStats.has(userId)) {
      agentStats.set(userId, {
        questions: 0,
        responses: 0,
        total: 0
      });
    }
    
    const userStats = agentStats.get(userId);
    userStats.total++;
    
    if (data.role === 'user') userStats.questions++;
    if (data.role === 'assistant') userStats.responses++;
  }
  
  console.error(`✅ ${messagesSnapshot.docs.length} mensajes procesados\n`);
  
  // Build result for main agents
  const mainAgentIds = {
    'M3-v2': 'vStojK73ZKbjNsEnqANJ',
    'S1-v2': 'iQmdg3bMSJ1AdqqlFpye',
    'S2-v2': '1lgr33ywq5qed67sqCYi',
    'M1-v2': 'EgXezLcu4O3IUqFUJhUZ'
  };
  
  const result = [];
  
  for (const [code, agentId] of Object.entries(mainAgentIds)) {
    const agentInfo = agentsMap.get(agentId);
    if (!agentInfo) continue;
    
    const ownerInfo = usersMap.get(agentInfo.userId) || { email: 'unknown', name: 'Unknown' };
    const userStats = agentUserStats.get(agentId) || new Map();
    
    const userBreakdown = Array.from(userStats.entries())
      .sort((a, b) => b[1].total - a[1].total)
      .map(([userId, stats]) => {
        const userInfo = usersMap.get(userId) || { email: 'unknown', name: 'Unknown', domain: 'unknown' };
        return {
          userId,
          userEmail: userInfo.email,
          userName: userInfo.name,
          domain: userInfo.domain,
          questions: stats.questions,
          responses: stats.responses,
          totalMessages: stats.total
        };
      });
    
    result.push({
      agentCode: code,
      agentId,
      agentTitle: agentInfo.title,
      ownerEmail: ownerInfo.email,
      isShared: agentInfo.isShared,
      sharedWithCount: agentInfo.sharedWithCount,
      status: agentInfo.isShared ? 'Producción' : 'Privado',
      totalMessages: Array.from(userStats.values()).reduce((sum, s) => sum + s.total, 0),
      uniqueUsers: userStats.size,
      userBreakdown
    });
  }
  
  // Write JSON
  const outputPath = './exports/salfa-analytics/main-agents-detailed.json';
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  
  console.error('✅ Archivo creado: main-agents-detailed.json\n');
  
  // Print summary
  console.log(JSON.stringify(result, null, 2));
  
  process.exit(0);
}

main();

