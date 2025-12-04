#!/usr/bin/env tsx
/**
 * Export SalfaGPT Data for Dashboard
 * Following exact schema from instrucciones_exportacion_salfagpt.md
 * 
 * Usage:
 *   npx tsx scripts/export-salfagpt-dashboard.ts [--days=90] [--output-dir=./exports]
 */

import { firestore, COLLECTIONS } from '../src/lib/firestore';
import * as fs from 'fs';
import * as path from 'path';

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
  isAgent: boolean; // TRUE = Agente plantilla, FALSE = Conversación derivada
  agentId?: string; // Si es conversación, referencia al agente padre
  isShared: boolean; // TRUE = Compartido (en producción), FALSE = Privado
  sharedWithCount: number; // Número de usuarios con acceso
}

interface MessageData {
  conversationId: string;
  userId: string;
  role: string;
  timestamp: Date;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
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

async function loadData(dateRange: DateRange) {
  console.error('📊 Cargando datos de Firestore...');
  
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
  
  console.error(`✅ ${usersMap.size} usuarios cargados`);
  
  // Load agent shares (para saber cuáles están compartidos)
  console.error('🤝 Cargando información de compartidos...');
  const sharesSnapshot = await firestore.collection(COLLECTIONS.AGENT_SHARES).get();
  const agentSharesMap = new Map<string, number>(); // agentId -> count of shares
  
  for (const doc of sharesSnapshot.docs) {
    const data = doc.data();
    const agentId = data.agentId;
    const sharedWith = data.sharedWith || [];
    
    // Contar usuarios con acceso activo
    const activeShares = Array.isArray(sharedWith) 
      ? sharedWith.filter((s: any) => s.type === 'user').length
      : 0;
    
    agentSharesMap.set(agentId, activeShares);
  }
  
  console.error(`✅ ${sharesSnapshot.size} registros de compartidos cargados`);
  
  // Load conversations (both agents and chats)
  console.error('🤖 Cargando conversaciones...');
  const conversationsSnapshot = await firestore.collection(COLLECTIONS.CONVERSATIONS).get();
  const agentsMap = new Map<string, AgentInfo>();
  const onlyAgentsMap = new Map<string, AgentInfo>(); // Solo agentes (isAgent: true)
  
  let agentCount = 0;
  let chatCount = 0;
  let sharedCount = 0;
  
  for (const doc of conversationsSnapshot.docs) {
    const data = doc.data();
    
    // Verificar si está compartido (tiene registros en agent_shares)
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
    
    // Separar agentes reales de conversaciones
    if (data.isAgent === true) {
      onlyAgentsMap.set(doc.id, info);
      agentCount++;
      if (isShared) sharedCount++;
    } else {
      chatCount++;
    }
  }
  
  console.error(`✅ ${agentsMap.size} conversaciones totales cargadas`);
  console.error(`   └─ ${agentCount} agentes (isAgent: true)`);
  console.error(`   └─ ${sharedCount} compartidos en producción`);
  console.error(`   └─ ${chatCount} conversaciones (isAgent: false)`);
  
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
  
  console.error(`✅ ${messages.length} mensajes en el rango de fechas\n`);
  
  return { usersMap, agentsMap, onlyAgentsMap, messages };
}

// 1. User Engagement (siguiendo esquema exacto)
function generateUserEngagementCSV(
  messages: MessageData[],
  usersMap: Map<string, UserInfo>
): string {
  const lines: string[] = [];
  
  // Header - EXACTO según instrucciones
  lines.push('User_ID,User_Email,User_Name,Domain,Total_Messages,User_Questions,Assistant_Responses,Days_Active');
  
  // Group by user
  const userStats = new Map<string, {
    totalMessages: number;
    userQuestions: number;
    assistantResponses: number;
    activeDays: Set<string>;
  }>();
  
  for (const msg of messages) {
    if (!userStats.has(msg.userId)) {
      userStats.set(msg.userId, {
        totalMessages: 0,
        userQuestions: 0,
        assistantResponses: 0,
        activeDays: new Set(),
      });
    }
    
    const stats = userStats.get(msg.userId)!;
    stats.totalMessages++;
    
    if (msg.role === 'user') {
      stats.userQuestions++;
    } else if (msg.role === 'assistant') {
      stats.assistantResponses++;
    }
    
    stats.activeDays.add(formatDate(msg.timestamp));
  }
  
  // Sort by total messages descending
  const sortedUsers = Array.from(userStats.entries())
    .sort((a, b) => b[1].totalMessages - a[1].totalMessages);
  
  // Generate rows
  for (const [userId, stats] of sortedUsers) {
    const userInfo = usersMap.get(userId) || { 
      email: 'unknown', 
      name: 'Unknown', 
      domain: 'unknown' 
    };
    
    lines.push([
      userId,
      userInfo.email,
      `"${userInfo.name.replace(/"/g, '""')}"`,
      userInfo.domain,
      stats.totalMessages,
      stats.userQuestions,
      stats.assistantResponses,
      stats.activeDays.size,
    ].join(','));
  }
  
  return lines.join('\n');
}

// 2. Agent Performance (siguiendo esquema exacto)
// CRÍTICO: Solo incluir AGENTES (isAgent: true), NO conversaciones
function generateAgentPerformanceCSV(
  messages: MessageData[],
  onlyAgentsMap: Map<string, AgentInfo>, // Solo agentes reales
  allConversationsMap: Map<string, AgentInfo>, // Todas las conversaciones
  usersMap: Map<string, UserInfo>
): string {
  const lines: string[] = [];
  
  // Header - AMPLIADO con información de compartido
  lines.push('Agent_ID,Agent_Title,Owner_Email,Total_Messages,Unique_Users,Avg_Messages_Per_User,Is_Shared,Shared_With_Count,Status');
  
  // Group by conversation (incluye mensajes de agentes Y sus conversaciones hijas)
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
  
  // AGREGAR mensajes de conversaciones hijas a su agente padre
  const agentStats = new Map<string, {
    totalMessages: number;
    uniqueUsers: Set<string>;
  }>();
  
  // Inicializar todos los agentes
  for (const [agentId, agentInfo] of onlyAgentsMap.entries()) {
    agentStats.set(agentId, {
      totalMessages: 0,
      uniqueUsers: new Set(),
    });
  }
  
  // Sumar mensajes: directos del agente + de conversaciones hijas
  for (const [conversationId, stats] of conversationStats.entries()) {
    const conversationInfo = allConversationsMap.get(conversationId);
    
    if (!conversationInfo) continue;
    
    if (conversationInfo.isAgent) {
      // Es un agente: sumar directamente
      const agentStat = agentStats.get(conversationId);
      if (agentStat) {
        agentStat.totalMessages += stats.totalMessages;
        stats.uniqueUsers.forEach(u => agentStat.uniqueUsers.add(u));
      }
    } else if (conversationInfo.agentId) {
      // Es una conversación hija: sumar al agente padre
      const parentAgentStat = agentStats.get(conversationInfo.agentId);
      if (parentAgentStat) {
        parentAgentStat.totalMessages += stats.totalMessages;
        stats.uniqueUsers.forEach(u => parentAgentStat.uniqueUsers.add(u));
      }
    }
  }
  
  // Sort by total messages descending
  const sortedAgents = Array.from(agentStats.entries())
    .sort((a, b) => b[1].totalMessages - a[1].totalMessages);
  
  // Generate rows - SOLO AGENTES, NO CONVERSACIONES
  for (const [agentId, stats] of sortedAgents) {
    const agentInfo = onlyAgentsMap.get(agentId);
    if (!agentInfo) continue; // Solo agentes reales
    
    const ownerInfo = usersMap.get(agentInfo.userId) || { 
      email: 'unknown', 
      name: 'Unknown', 
      domain: 'unknown' 
    };
    
    const avgMessagesPerUser = stats.uniqueUsers.size > 0 
      ? (stats.totalMessages / stats.uniqueUsers.size).toFixed(2)
      : '0';
    
    // Determinar estado
    const status = agentInfo.isShared ? 'Producción' : 'Privado';
    
    lines.push([
      agentId,
      `"${agentInfo.title.replace(/"/g, '""')}"`,
      ownerInfo.email,
      stats.totalMessages,
      stats.uniqueUsers.size,
      avgMessagesPerUser,
      agentInfo.isShared ? 'Sí' : 'No',
      agentInfo.sharedWithCount,
      status,
    ].join(','));
  }
  
  return lines.join('\n');
}

// 3. Daily Activity (siguiendo esquema exacto)
function generateDailyActivityCSV(
  messages: MessageData[],
  dateRange: DateRange
): string {
  const lines: string[] = [];
  
  // Header - EXACTO según instrucciones
  lines.push('Date,Total_Messages,Active_Agents,Unique_Users');
  
  // Group by date
  const dailyStats = new Map<string, {
    totalMessages: number;
    activeAgents: Set<string>;
    uniqueUsers: Set<string>;
  }>();
  
  // Initialize all dates
  for (const date of dateRange.dates) {
    dailyStats.set(date, {
      totalMessages: 0,
      activeAgents: new Set(),
      uniqueUsers: new Set(),
    });
  }
  
  // Populate stats
  for (const msg of messages) {
    const dateKey = formatDate(msg.timestamp);
    const stats = dailyStats.get(dateKey);
    
    if (stats) {
      stats.totalMessages++;
      stats.activeAgents.add(msg.conversationId);
      stats.uniqueUsers.add(msg.userId);
    }
  }
  
  // Generate rows (in chronological order)
  for (const date of dateRange.dates) {
    const stats = dailyStats.get(date)!;
    
    lines.push([
      date,
      stats.totalMessages,
      stats.activeAgents.size,
      stats.uniqueUsers.size,
    ].join(','));
  }
  
  return lines.join('\n');
}

// 4. KPIs Summary (siguiendo esquema exacto)
function generateKPISummaryCSV(
  messages: MessageData[],
  onlyAgentsMap: Map<string, AgentInfo>, // Solo agentes reales para el conteo
  dateRange: DateRange
): string {
  const lines: string[] = [];
  
  // Header - EXACTO según instrucciones
  lines.push('Metric,Value,Period_Start,Period_End');
  
  // Calculate KPIs
  const totalMessages = messages.length;
  const userQuestions = messages.filter(m => m.role === 'user').length;
  const assistantResponses = messages.filter(m => m.role === 'assistant').length;
  const uniqueUsers = new Set(messages.map(m => m.userId)).size;
  
  // CRÍTICO: Contar solo agentes reales (isAgent: true)
  const uniqueAgents = onlyAgentsMap.size;
  
  // Conversaciones = todas (agentes + chats)
  const uniqueConversations = new Set(messages.map(m => m.conversationId)).size;
  
  const avgMessagesPerUser = uniqueUsers > 0 
    ? (totalMessages / uniqueUsers).toFixed(2) 
    : '0';
  const avgMessagesPerAgent = uniqueAgents > 0 
    ? (totalMessages / uniqueAgents).toFixed(2) 
    : '0';
  
  // Generate rows
  const kpis = [
    ['Total Messages', totalMessages],
    ['User Questions', userQuestions],
    ['Assistant Responses', assistantResponses],
    ['Total Conversations', uniqueConversations],
    ['Active Users', uniqueUsers],
    ['Active Agents', uniqueAgents],
    ['Avg Messages Per User', avgMessagesPerUser],
    ['Avg Messages Per Agent', avgMessagesPerAgent],
  ];
  
  for (const [metric, value] of kpis) {
    lines.push([
      `"${metric}"`,
      value,
      formatDate(dateRange.startDate),
      formatDate(dateRange.endDate),
    ].join(','));
  }
  
  return lines.join('\n');
}

async function main() {
  try {
    const args = process.argv.slice(2);
    const daysArg = args.find(a => a.startsWith('--days='));
    const outputDirArg = args.find(a => a.startsWith('--output-dir='));
    
    const days = daysArg ? parseInt(daysArg.split('=')[1]) : 90;
    const outputDir = outputDirArg ? outputDirArg.split('=')[1] : './exports/salfagpt-dashboard';
    
    console.error(`\n📊 Exportación de Datos SalfaGPT para Dashboard`);
    console.error(`📅 Período: Últimos ${days} días`);
    console.error(`📁 Destino: ${outputDir}\n`);
    
    // Create output directory
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.error(`✅ Directorio creado: ${outputDir}`);
    }
    
    // Get date range
    const dateRange = getDateRange(days);
    console.error(`🗓️  Rango: ${formatDate(dateRange.startDate)} → ${formatDate(dateRange.endDate)}\n`);
    
    // Load data
    const { usersMap, agentsMap, onlyAgentsMap, messages } = await loadData(dateRange);
    
    // Generate CSVs siguiendo EXACTAMENTE el esquema de las instrucciones
    console.error('📝 Generando archivos CSV...\n');
    
    // 1. User Engagement
    console.error('1️⃣  user_engagement.csv...');
    const userEngagementCSV = generateUserEngagementCSV(messages, usersMap);
    const userEngagementPath = path.join(outputDir, 'user_engagement.csv');
    fs.writeFileSync(userEngagementPath, userEngagementCSV);
    const userRows = userEngagementCSV.split('\n').length - 1;
    console.error(`   ✅ ${userRows} usuarios exportados`);
    
    // 2. Agent Performance (SOLO AGENTES, NO CONVERSACIONES)
    console.error('2️⃣  agent_performance.csv...');
    const agentPerformanceCSV = generateAgentPerformanceCSV(messages, onlyAgentsMap, agentsMap, usersMap);
    const agentPerformancePath = path.join(outputDir, 'agent_performance.csv');
    fs.writeFileSync(agentPerformancePath, agentPerformanceCSV);
    const agentRows = agentPerformanceCSV.split('\n').length - 1;
    console.error(`   ✅ ${agentRows} agentes exportados (solo isAgent: true)`);
    
    // 3. Daily Activity
    console.error('3️⃣  daily_activity.csv...');
    const dailyActivityCSV = generateDailyActivityCSV(messages, dateRange);
    const dailyActivityPath = path.join(outputDir, 'daily_activity.csv');
    fs.writeFileSync(dailyActivityPath, dailyActivityCSV);
    console.error(`   ✅ ${days} días exportados`);
    
    // 4. KPIs Summary
    console.error('4️⃣  kpis_summary.csv...');
    const kpisCSV = generateKPISummaryCSV(messages, onlyAgentsMap, dateRange);
    const kpisPath = path.join(outputDir, 'kpis_summary.csv');
    fs.writeFileSync(kpisPath, kpisCSV);
    console.error(`   ✅ 8 KPIs exportados`);
    
    // Generate README
    console.error('\n📄 Generando README...');
    const readme = generateReadme(dateRange, messages, usersMap, onlyAgentsMap);
    const readmePath = path.join(outputDir, 'README.md');
    fs.writeFileSync(readmePath, readme);
    console.error(`   ✅ README.md creado\n`);
    
    console.error('═'.repeat(60));
    console.error('✅ EXPORTACIÓN COMPLETA!');
    console.error('═'.repeat(60));
    console.error(`\n📁 Archivos guardados en: ${outputDir}/\n`);
    
    // Print summary
    console.error('📊 RESUMEN:');
    console.error(`   • Período: ${days} días (${formatDate(dateRange.startDate)} → ${formatDate(dateRange.endDate)})`);
    console.error(`   • Total Mensajes: ${messages.length.toLocaleString()}`);
    console.error(`   • Usuarios Activos: ${new Set(messages.map(m => m.userId)).size}`);
    console.error(`   • Agentes Activos: ${new Set(messages.map(m => m.conversationId)).size}`);
    console.error(`   • Archivos Generados: 4 CSVs + README\n`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

function generateReadme(
  dateRange: DateRange,
  messages: MessageData[],
  usersMap: Map<string, UserInfo>,
  onlyAgentsMap: Map<string, AgentInfo>
): string {
  const totalMessages = messages.length;
  const userQuestions = messages.filter(m => m.role === 'user').length;
  const assistantResponses = messages.filter(m => m.role === 'assistant').length;
  const uniqueUsers = new Set(messages.map(m => m.userId)).size;
  const uniqueAgents = onlyAgentsMap.size; // SOLO agentes reales
  
  return `# 📊 Exportación SalfaGPT - Dashboard de Métricas

**Generado:** ${new Date().toLocaleString('es-CL')}  
**Período:** ${formatDate(dateRange.startDate)} → ${formatDate(dateRange.endDate)} (${dateRange.dates.length} días)  
**Total Mensajes:** ${totalMessages.toLocaleString()}  
**Preguntas de Usuarios:** ${userQuestions.toLocaleString()}  
**Respuestas de Asistentes:** ${assistantResponses.toLocaleString()}  
**Usuarios Activos:** ${uniqueUsers}  
**Agentes Activos:** ${uniqueAgents}

---

## 📁 Archivos Incluidos

Siguiendo el esquema exacto de \`instrucciones_exportacion_salfagpt.md\`:

### 1. **user_engagement.csv**
**Propósito:** Actividad de usuarios  
**Columnas:**
- \`User_ID\`: ID único del usuario
- \`User_Email\`: Correo electrónico
- \`User_Name\`: Nombre completo
- \`Domain\`: Dominio del correo (ej: salfagestion.cl)
- \`Total_Messages\`: Cantidad total de mensajes
- \`User_Questions\`: Cantidad de preguntas realizadas
- \`Assistant_Responses\`: Respuestas recibidas
- \`Days_Active\`: Días únicos de actividad

**Registros:** ${new Set(messages.map(m => m.userId)).size} usuarios

---

### 2. **agent_performance.csv**
**Propósito:** Rendimiento de asistentes  
**Columnas:**
- \`Agent_ID\`: ID del agente
- \`Agent_Title\`: Nombre del asistente
- \`Owner_Email\`: Creador del asistente
- \`Total_Messages\`: Total de interacciones
- \`Unique_Users\`: Usuarios únicos que lo han usado
- \`Avg_Messages_Per_User\`: Promedio de uso

**Registros:** ${uniqueAgents} agentes

---

### 3. **daily_activity.csv**
**Propósito:** Actividad diaria  
**Columnas:**
- \`Date\`: Fecha (YYYY-MM-DD)
- \`Total_Messages\`: Total del día
- \`Active_Agents\`: Cantidad de agentes usados
- \`Unique_Users\`: Cantidad de usuarios activos

**Registros:** ${dateRange.dates.length} días

---

### 4. **kpis_summary.csv**
**Propósito:** Resumen ejecutivo  
**Columnas:**
- \`Metric\`: Nombre de la métrica
- \`Value\`: Valor numérico
- \`Period_Start\`: Fecha inicio
- \`Period_End\`: Fecha fin

**Registros:** 8 métricas clave

---

## 📊 Cómo Importar a Excel

1. Abrir Excel
2. **Datos** → **Obtener datos** → **Desde archivo** → **Desde texto/CSV**
3. Seleccionar archivo CSV
4. **Delimitador:** Coma
5. **Codificación:** UTF-8
6. Cargar

---

## 📈 Análisis Recomendados

### Tabla Dinámica 1: Top 10 Usuarios Activos
- **Fuente:** \`user_engagement.csv\`
- **Filas:** User_Email
- **Valores:** SUMA de Total_Messages
- **Ordenar:** Descendente
- **Filtro:** Top 10

### Tabla Dinámica 2: Rendimiento de Asistentes
- **Fuente:** \`agent_performance.csv\`
- **Filas:** Agent_Title
- **Valores:** Total_Messages, Unique_Users
- **Ordenar:** Por Total_Messages descendente

### Gráfico 1: Actividad Diaria
- **Fuente:** \`daily_activity.csv\`
- **Tipo:** Gráfico de líneas
- **Eje X:** Date
- **Eje Y:** Total_Messages
- **Serie 2:** Unique_Users (eje secundario)

### Gráfico 2: Distribución por Hora
- Usar archivo completo de exportación anterior
- Ver \`4_hourly_distribution_2025-11-28.csv\`

---

## 🔄 Re-generar Exportación

Para actualizar los datos:

\`\`\`bash
# Últimos 90 días (default)
npx tsx scripts/export-salfagpt-dashboard.ts

# Últimos 30 días
npx tsx scripts/export-salfagpt-dashboard.ts --days=30

# Últimos 7 días
npx tsx scripts/export-salfagpt-dashboard.ts --days=7

# Directorio personalizado
npx tsx scripts/export-salfagpt-dashboard.ts --output-dir=./mi-carpeta
\`\`\`

---

## 📧 Notas Importantes

- **Esquema:** Sigue exactamente \`instrucciones_exportacion_salfagpt.md\`
- **Formato:** CSV compatible con Excel/Google Sheets
- **Codificación:** UTF-8 con BOM para compatibilidad
- **Separador:** Coma (,)
- **Texto:** Entrecomillado cuando contiene comas o comillas

---

## 📞 Soporte

**Preguntas sobre los datos:**
- Revisar este README
- Contacto: alec@getaifactory.com

**Necesitas otras métricas:**
- Modificar \`scripts/export-salfagpt-dashboard.ts\`
- Agregar nuevas funciones de exportación

---

**Generado por:** SalfaGPT Analytics System  
**Script:** \`scripts/export-salfagpt-dashboard.ts\`  
**Versión:** 1.0.0
`;
}

main();

