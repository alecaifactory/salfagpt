#!/usr/bin/env tsx
/**
 * Complete Statistics Export for SalfaGPT Dashboard
 * 
 * Generates comprehensive CSV files based on RF requirements:
 * - RF-03: KPIs (Messages, Conversations, Active Users)
 * - RF-04: Charts data (Activity, Messages by Assistant, Distribution by Hour, etc.)
 * - RF-05: Tables (Top 10 Active Users)
 * 
 * Usage:
 *   npx tsx scripts/export-complete-statistics.ts [--days=7] [--output-dir=./exports]
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
}

interface MessageData {
  conversationId: string;
  userId: string;
  role: string;
  timestamp: Date;
  content: string;
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

function getDayName(date: Date): string {
  return date.toLocaleDateString('es', { weekday: 'long' });
}

function getHour(date: Date): number {
  return date.getHours();
}

function getDomain(email: string): string {
  const parts = email.split('@');
  return parts.length > 1 ? parts[1] : 'unknown';
}

async function loadData(dateRange: DateRange) {
  console.error('📊 Loading data from Firestore...');
  
  // Load users
  console.error('👥 Loading users...');
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
  
  console.error(`✅ Loaded ${usersMap.size} users`);
  
  // Load conversations (agents)
  console.error('🤖 Loading agents...');
  const conversationsSnapshot = await firestore.collection(COLLECTIONS.CONVERSATIONS).get();
  const agentsMap = new Map<string, AgentInfo>();
  
  for (const doc of conversationsSnapshot.docs) {
    const data = doc.data();
    agentsMap.set(doc.id, {
      title: data.title || 'Sin título',
      userId: data.userId,
    });
  }
  
  console.error(`✅ Loaded ${agentsMap.size} agents`);
  
  // Load messages
  console.error('💬 Loading messages...');
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
        content: typeof data.content === 'string' ? data.content : data.content?.text || '',
      });
    }
  }
  
  console.error(`✅ Loaded ${messages.length} messages in date range`);
  
  return { usersMap, agentsMap, messages };
}

// CSV 1: User Engagement (RF-03, RF-05.1)
function generateUserEngagementCSV(
  messages: MessageData[],
  usersMap: Map<string, UserInfo>,
  dateRange: DateRange
): string {
  const lines: string[] = [];
  
  // Header
  lines.push('User_ID,User_Email,User_Name,Domain,Total_Messages,User_Questions,Assistant_Responses,First_Message,Last_Message,Days_Active');
  
  // Group by user
  const userStats = new Map<string, {
    totalMessages: number;
    userQuestions: number;
    assistantResponses: number;
    firstMessage: Date;
    lastMessage: Date;
    activeDays: Set<string>;
  }>();
  
  for (const msg of messages) {
    if (!userStats.has(msg.userId)) {
      userStats.set(msg.userId, {
        totalMessages: 0,
        userQuestions: 0,
        assistantResponses: 0,
        firstMessage: msg.timestamp,
        lastMessage: msg.timestamp,
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
    
    if (msg.timestamp < stats.firstMessage) {
      stats.firstMessage = msg.timestamp;
    }
    if (msg.timestamp > stats.lastMessage) {
      stats.lastMessage = msg.timestamp;
    }
    
    stats.activeDays.add(formatDate(msg.timestamp));
  }
  
  // Sort by total messages
  const sortedUsers = Array.from(userStats.entries())
    .sort((a, b) => b[1].totalMessages - a[1].totalMessages);
  
  // Generate rows
  for (const [userId, stats] of sortedUsers) {
    const userInfo = usersMap.get(userId) || { email: 'unknown', name: 'Unknown', domain: 'unknown' };
    
    lines.push([
      userId,
      userInfo.email,
      `"${userInfo.name.replace(/"/g, '""')}"`,
      userInfo.domain,
      stats.totalMessages,
      stats.userQuestions,
      stats.assistantResponses,
      formatDateTime(stats.firstMessage),
      formatDateTime(stats.lastMessage),
      stats.activeDays.size,
    ].join(','));
  }
  
  return lines.join('\n');
}

// CSV 2: Agent Performance (RF-04.2)
function generateAgentPerformanceCSV(
  messages: MessageData[],
  agentsMap: Map<string, AgentInfo>,
  usersMap: Map<string, UserInfo>
): string {
  const lines: string[] = [];
  
  // Header
  lines.push('Agent_ID,Agent_Title,Agent_Owner,Owner_Email,Total_Messages,User_Questions,Assistant_Responses,Unique_Users,Conversations_Count,Avg_Messages_Per_User');
  
  // Group by agent
  const agentStats = new Map<string, {
    totalMessages: number;
    userQuestions: number;
    assistantResponses: number;
    uniqueUsers: Set<string>;
  }>();
  
  for (const msg of messages) {
    if (!agentStats.has(msg.conversationId)) {
      agentStats.set(msg.conversationId, {
        totalMessages: 0,
        userQuestions: 0,
        assistantResponses: 0,
        uniqueUsers: new Set(),
      });
    }
    
    const stats = agentStats.get(msg.conversationId)!;
    stats.totalMessages++;
    stats.uniqueUsers.add(msg.userId);
    
    if (msg.role === 'user') {
      stats.userQuestions++;
    } else if (msg.role === 'assistant') {
      stats.assistantResponses++;
    }
  }
  
  // Sort by total messages
  const sortedAgents = Array.from(agentStats.entries())
    .sort((a, b) => b[1].totalMessages - a[1].totalMessages);
  
  // Generate rows
  for (const [agentId, stats] of sortedAgents) {
    const agentInfo = agentsMap.get(agentId) || { title: 'Unknown', userId: 'unknown' };
    const ownerInfo = usersMap.get(agentInfo.userId) || { email: 'unknown', name: 'Unknown', domain: 'unknown' };
    
    const avgMessagesPerUser = stats.uniqueUsers.size > 0 
      ? (stats.totalMessages / stats.uniqueUsers.size).toFixed(2)
      : '0';
    
    lines.push([
      agentId,
      `"${agentInfo.title.replace(/"/g, '""')}"`,
      agentInfo.userId,
      ownerInfo.email,
      stats.totalMessages,
      stats.userQuestions,
      stats.assistantResponses,
      stats.uniqueUsers.size,
      1, // Each agent is 1 conversation
      avgMessagesPerUser,
    ].join(','));
  }
  
  return lines.join('\n');
}

// CSV 3: Daily Activity (RF-04.1)
function generateDailyActivityCSV(
  messages: MessageData[],
  dateRange: DateRange
): string {
  const lines: string[] = [];
  
  // Header
  lines.push('Date,Day_Name,Total_Messages,User_Questions,Assistant_Responses,Unique_Users,Active_Agents');
  
  // Group by date
  const dailyStats = new Map<string, {
    totalMessages: number;
    userQuestions: number;
    assistantResponses: number;
    uniqueUsers: Set<string>;
    activeAgents: Set<string>;
  }>();
  
  // Initialize all dates
  for (const date of dateRange.dates) {
    dailyStats.set(date, {
      totalMessages: 0,
      userQuestions: 0,
      assistantResponses: 0,
      uniqueUsers: new Set(),
      activeAgents: new Set(),
    });
  }
  
  // Populate stats
  for (const msg of messages) {
    const dateKey = formatDate(msg.timestamp);
    const stats = dailyStats.get(dateKey);
    
    if (stats) {
      stats.totalMessages++;
      stats.uniqueUsers.add(msg.userId);
      stats.activeAgents.add(msg.conversationId);
      
      if (msg.role === 'user') {
        stats.userQuestions++;
      } else if (msg.role === 'assistant') {
        stats.assistantResponses++;
      }
    }
  }
  
  // Generate rows
  for (const date of dateRange.dates) {
    const stats = dailyStats.get(date)!;
    const dateObj = new Date(date);
    const dayName = getDayName(dateObj);
    
    lines.push([
      date,
      dayName,
      stats.totalMessages,
      stats.userQuestions,
      stats.assistantResponses,
      stats.uniqueUsers.size,
      stats.activeAgents.size,
    ].join(','));
  }
  
  return lines.join('\n');
}

// CSV 4: Hourly Distribution (RF-04.3)
function generateHourlyDistributionCSV(messages: MessageData[]): string {
  const lines: string[] = [];
  
  // Header
  lines.push('Hour,Total_Messages,User_Questions,Assistant_Responses,Avg_Messages_Per_Day');
  
  // Group by hour (0-23)
  const hourlyStats = new Map<number, {
    totalMessages: number;
    userQuestions: number;
    assistantResponses: number;
    days: Set<string>;
  }>();
  
  // Initialize all hours
  for (let hour = 0; hour < 24; hour++) {
    hourlyStats.set(hour, {
      totalMessages: 0,
      userQuestions: 0,
      assistantResponses: 0,
      days: new Set(),
    });
  }
  
  // Populate stats
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
  
  // Generate rows
  for (let hour = 0; hour < 24; hour++) {
    const stats = hourlyStats.get(hour)!;
    const avgPerDay = stats.days.size > 0 
      ? (stats.totalMessages / stats.days.size).toFixed(2)
      : '0';
    
    lines.push([
      hour.toString().padStart(2, '0'),
      stats.totalMessages,
      stats.userQuestions,
      stats.assistantResponses,
      avgPerDay,
    ].join(','));
  }
  
  return lines.join('\n');
}

// CSV 5: Domain Distribution (RF-04.5)
function generateDomainDistributionCSV(
  messages: MessageData[],
  usersMap: Map<string, UserInfo>
): string {
  const lines: string[] = [];
  
  // Header
  lines.push('Domain,Unique_Users,Total_Messages,User_Questions,Assistant_Responses,Percentage_Of_Users');
  
  // Group by domain
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
  
  // Calculate total unique users
  const totalUniqueUsers = new Set(messages.map(m => m.userId)).size;
  
  // Sort by user count
  const sortedDomains = Array.from(domainStats.entries())
    .sort((a, b) => b[1].uniqueUsers.size - a[1].uniqueUsers.size);
  
  // Generate rows
  for (const [domain, stats] of sortedDomains) {
    const percentage = totalUniqueUsers > 0
      ? ((stats.uniqueUsers.size / totalUniqueUsers) * 100).toFixed(2)
      : '0';
    
    lines.push([
      domain,
      stats.uniqueUsers.size,
      stats.totalMessages,
      stats.userQuestions,
      stats.assistantResponses,
      percentage,
    ].join(','));
  }
  
  return lines.join('\n');
}

// CSV 6: User-Agent-Day Detail (Complete granular data)
function generateUserAgentDayDetailCSV(
  messages: MessageData[],
  usersMap: Map<string, UserInfo>,
  agentsMap: Map<string, AgentInfo>,
  dateRange: DateRange
): string {
  const lines: string[] = [];
  
  // Header
  lines.push('Date,Day_Name,Agent_ID,Agent_Title,User_ID,User_Email,User_Name,Domain,Questions,Responses,Total_Messages');
  
  // Group by date -> agent -> user
  const statsMap = new Map<string, Map<string, Map<string, {
    questions: number;
    responses: number;
    totalMessages: number;
  }>>>();
  
  for (const msg of messages) {
    const dateKey = formatDate(msg.timestamp);
    const agentId = msg.conversationId;
    const userId = msg.userId;
    
    if (!statsMap.has(dateKey)) {
      statsMap.set(dateKey, new Map());
    }
    
    const dateStats = statsMap.get(dateKey)!;
    
    if (!dateStats.has(agentId)) {
      dateStats.set(agentId, new Map());
    }
    
    const agentStats = dateStats.get(agentId)!;
    
    if (!agentStats.has(userId)) {
      agentStats.set(userId, {
        questions: 0,
        responses: 0,
        totalMessages: 0,
      });
    }
    
    const userStats = agentStats.get(userId)!;
    userStats.totalMessages++;
    
    if (msg.role === 'user') {
      userStats.questions++;
    } else if (msg.role === 'assistant') {
      userStats.responses++;
    }
  }
  
  // Generate rows
  for (const date of dateRange.dates) {
    const dateObj = new Date(date);
    const dayName = getDayName(dateObj);
    const dateStats = statsMap.get(date);
    
    if (!dateStats) continue;
    
    for (const [agentId, agentStats] of dateStats.entries()) {
      const agentInfo = agentsMap.get(agentId) || { title: 'Unknown', userId: 'unknown' };
      
      for (const [userId, userStats] of agentStats.entries()) {
        const userInfo = usersMap.get(userId) || { email: 'unknown', name: 'Unknown', domain: 'unknown' };
        
        lines.push([
          date,
          dayName,
          agentId,
          `"${agentInfo.title.replace(/"/g, '""')}"`,
          userId,
          userInfo.email,
          `"${userInfo.name.replace(/"/g, '""')}"`,
          userInfo.domain,
          userStats.questions,
          userStats.responses,
          userStats.totalMessages,
        ].join(','));
      }
    }
  }
  
  return lines.join('\n');
}

// CSV 7: KPIs Summary
function generateKPISummaryCSV(
  messages: MessageData[],
  agentsMap: Map<string, AgentInfo>,
  dateRange: DateRange
): string {
  const lines: string[] = [];
  
  // Header
  lines.push('Metric,Value,Period_Start,Period_End,Days');
  
  // Calculate KPIs
  const totalMessages = messages.length;
  const userQuestions = messages.filter(m => m.role === 'user').length;
  const assistantResponses = messages.filter(m => m.role === 'assistant').length;
  const uniqueUsers = new Set(messages.map(m => m.userId)).size;
  const uniqueAgents = new Set(messages.map(m => m.conversationId)).size;
  const uniqueConversations = uniqueAgents; // Each agent is a conversation
  
  // Calculate average response time (if we had timing data)
  const avgMessagesPerUser = uniqueUsers > 0 ? (totalMessages / uniqueUsers).toFixed(2) : '0';
  const avgMessagesPerAgent = uniqueAgents > 0 ? (totalMessages / uniqueAgents).toFixed(2) : '0';
  
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
      dateRange.dates.length,
    ].join(','));
  }
  
  return lines.join('\n');
}

async function main() {
  try {
    const args = process.argv.slice(2);
    const daysArg = args.find(a => a.startsWith('--days='));
    const outputDirArg = args.find(a => a.startsWith('--output-dir='));
    
    const days = daysArg ? parseInt(daysArg.split('=')[1]) : 7;
    const outputDir = outputDirArg ? outputDirArg.split('=')[1] : './exports';
    
    console.error(`\n📊 Generating Complete Statistics Export`);
    console.error(`📅 Period: Last ${days} days`);
    console.error(`📁 Output: ${outputDir}\n`);
    
    // Create output directory
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.error(`✅ Created directory: ${outputDir}`);
    }
    
    // Get date range
    const dateRange = getDateRange(days);
    console.error(`🗓️  Period: ${formatDate(dateRange.startDate)} → ${formatDate(dateRange.endDate)}\n`);
    
    // Load data
    const { usersMap, agentsMap, messages } = await loadData(dateRange);
    
    // Generate CSVs
    console.error('\n📝 Generating CSV files...\n');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    
    // 1. User Engagement (RF-03, RF-05.1)
    console.error('1️⃣  User Engagement...');
    const userEngagementCSV = generateUserEngagementCSV(messages, usersMap, dateRange);
    const userEngagementPath = path.join(outputDir, `1_user_engagement_${timestamp}.csv`);
    fs.writeFileSync(userEngagementPath, userEngagementCSV);
    console.error(`✅ Saved: ${userEngagementPath}`);
    
    // 2. Agent Performance (RF-04.2)
    console.error('2️⃣  Agent Performance...');
    const agentPerformanceCSV = generateAgentPerformanceCSV(messages, agentsMap, usersMap);
    const agentPerformancePath = path.join(outputDir, `2_agent_performance_${timestamp}.csv`);
    fs.writeFileSync(agentPerformancePath, agentPerformanceCSV);
    console.error(`✅ Saved: ${agentPerformancePath}`);
    
    // 3. Daily Activity (RF-04.1)
    console.error('3️⃣  Daily Activity...');
    const dailyActivityCSV = generateDailyActivityCSV(messages, dateRange);
    const dailyActivityPath = path.join(outputDir, `3_daily_activity_${timestamp}.csv`);
    fs.writeFileSync(dailyActivityPath, dailyActivityCSV);
    console.error(`✅ Saved: ${dailyActivityPath}`);
    
    // 4. Hourly Distribution (RF-04.3)
    console.error('4️⃣  Hourly Distribution...');
    const hourlyDistributionCSV = generateHourlyDistributionCSV(messages);
    const hourlyDistributionPath = path.join(outputDir, `4_hourly_distribution_${timestamp}.csv`);
    fs.writeFileSync(hourlyDistributionPath, hourlyDistributionCSV);
    console.error(`✅ Saved: ${hourlyDistributionPath}`);
    
    // 5. Domain Distribution (RF-04.5)
    console.error('5️⃣  Domain Distribution...');
    const domainDistributionCSV = generateDomainDistributionCSV(messages, usersMap);
    const domainDistributionPath = path.join(outputDir, `5_domain_distribution_${timestamp}.csv`);
    fs.writeFileSync(domainDistributionPath, domainDistributionCSV);
    console.error(`✅ Saved: ${domainDistributionPath}`);
    
    // 6. User-Agent-Day Detail (Complete granular data)
    console.error('6️⃣  User-Agent-Day Detail...');
    const userAgentDayCSV = generateUserAgentDayDetailCSV(messages, usersMap, agentsMap, dateRange);
    const userAgentDayPath = path.join(outputDir, `6_user_agent_day_detail_${timestamp}.csv`);
    fs.writeFileSync(userAgentDayPath, userAgentDayCSV);
    console.error(`✅ Saved: ${userAgentDayPath}`);
    
    // 7. KPIs Summary
    console.error('7️⃣  KPIs Summary...');
    const kpisCSV = generateKPISummaryCSV(messages, agentsMap, dateRange);
    const kpisPath = path.join(outputDir, `7_kpis_summary_${timestamp}.csv`);
    fs.writeFileSync(kpisPath, kpisCSV);
    console.error(`✅ Saved: ${kpisPath}`);
    
    // Generate summary README
    console.error('\n📄 Generating README...');
    const readme = generateReadme(dateRange, messages, usersMap, agentsMap, timestamp);
    const readmePath = path.join(outputDir, 'README.md');
    fs.writeFileSync(readmePath, readme);
    console.error(`✅ Saved: ${readmePath}\n`);
    
    console.error('═'.repeat(60));
    console.error('✅ EXPORT COMPLETE!');
    console.error('═'.repeat(60));
    console.error(`\n📁 All files saved to: ${outputDir}/\n`);
    
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
  agentsMap: Map<string, AgentInfo>,
  timestamp: string
): string {
  const totalMessages = messages.length;
  const userQuestions = messages.filter(m => m.role === 'user').length;
  const uniqueUsers = new Set(messages.map(m => m.userId)).size;
  const uniqueAgents = new Set(messages.map(m => m.conversationId)).size;
  
  return `# 📊 SalfaGPT Statistics Export

**Generated:** ${new Date().toLocaleString('es')}  
**Period:** ${formatDate(dateRange.startDate)} → ${formatDate(dateRange.endDate)} (${dateRange.dates.length} days)  
**Total Messages:** ${totalMessages.toLocaleString()}  
**User Questions:** ${userQuestions.toLocaleString()}  
**Active Users:** ${uniqueUsers}  
**Active Agents:** ${uniqueAgents}

---

## 📁 Files Included

### 1. **1_user_engagement_${timestamp}.csv**
**Purpose:** User-level engagement metrics (RF-03, RF-05.1)  
**Columns:**
- User_ID, User_Email, User_Name, Domain
- Total_Messages, User_Questions, Assistant_Responses
- First_Message, Last_Message, Days_Active

**Use for:**
- RF-05.1: Top 10 Active Users table
- RF-03.3: Active Users KPI
- User engagement analysis

---

### 2. **2_agent_performance_${timestamp}.csv**
**Purpose:** Agent-level performance metrics (RF-04.2)  
**Columns:**
- Agent_ID, Agent_Title, Agent_Owner, Owner_Email
- Total_Messages, User_Questions, Assistant_Responses
- Unique_Users, Conversations_Count, Avg_Messages_Per_User

**Use for:**
- RF-04.2: Messages by Assistant chart
- Agent comparison analysis
- Owner performance tracking

---

### 3. **3_daily_activity_${timestamp}.csv**
**Purpose:** Daily activity trends (RF-04.1)  
**Columns:**
- Date, Day_Name
- Total_Messages, User_Questions, Assistant_Responses
- Unique_Users, Active_Agents

**Use for:**
- RF-04.1: Conversation Activity chart
- Daily trends analysis
- Day-of-week patterns

---

### 4. **4_hourly_distribution_${timestamp}.csv**
**Purpose:** Hour-of-day distribution (RF-04.3)  
**Columns:**
- Hour (00-23)
- Total_Messages, User_Questions, Assistant_Responses
- Avg_Messages_Per_Day

**Use for:**
- RF-04.3: Distribution by Hour chart
- Peak hours identification
- Resource planning

---

### 5. **5_domain_distribution_${timestamp}.csv**
**Purpose:** Domain-level analysis (RF-04.5)  
**Columns:**
- Domain
- Unique_Users, Total_Messages
- User_Questions, Assistant_Responses
- Percentage_Of_Users

**Use for:**
- RF-04.5: Users by Domain chart
- Organization analysis
- Multi-tenant insights

---

### 6. **6_user_agent_day_detail_${timestamp}.csv**
**Purpose:** Complete granular data (all dimensions)  
**Columns:**
- Date, Day_Name, Agent_ID, Agent_Title
- User_ID, User_Email, User_Name, Domain
- Questions, Responses, Total_Messages

**Use for:**
- Custom pivot tables
- Deep-dive analysis
- AI Assistant queries (RF-06)

---

### 7. **7_kpis_summary_${timestamp}.csv**
**Purpose:** Executive summary (RF-03)  
**Columns:**
- Metric, Value, Period_Start, Period_End, Days

**Use for:**
- RF-03: KPIs module
- Executive dashboard
- Quick overview

---

## 📊 How to Use in Excel

### Import Steps:
1. Open Excel
2. **Data** → **Get Data** → **From File** → **From Text/CSV**
3. Select CSV file
4. **Delimiter:** Comma
5. **Encoding:** UTF-8
6. Load

### Recommended Pivot Tables:

**Top 10 Active Users (RF-05.1):**
- Source: 1_user_engagement CSV file
- Rows: User_Email
- Values: SUM(Total_Messages)
- Sort: Descending
- Filter: Top 10

**Messages by Assistant (RF-04.2):**
- Source: 2_agent_performance CSV file
- Rows: Agent_Title
- Values: SUM(Total_Messages)
- Chart: Bar chart

**Daily Activity (RF-04.1):**
- Source: 3_daily_activity CSV file
- Rows: Date
- Values: Total_Messages, Unique_Users
- Chart: Line chart

**Hourly Distribution (RF-04.3):**
- Source: 4_hourly_distribution CSV file
- Rows: Hour
- Values: Total_Messages
- Chart: Area chart

**Domain Distribution (RF-04.5):**
- Source: 5_domain_distribution CSV file
- Rows: Domain
- Values: Unique_Users, Percentage_Of_Users
- Chart: Pie chart

---

## 🎯 Mapping to Requirements

### RF-03: KPIs Module
**Data source:** 7_kpis_summary CSV file
- Total Messages ✅
- Total Conversations ✅
- Active Users ✅

### RF-04: Charts Module
- **RF-04.1** (Activity): 3_daily_activity CSV file ✅
- **RF-04.2** (By Assistant): 2_agent_performance CSV file ✅
- **RF-04.3** (By Hour): 4_hourly_distribution CSV file ✅
- **RF-04.4** (By User): 1_user_engagement CSV file ✅
- **RF-04.5** (By Domain): 5_domain_distribution CSV file ✅

### RF-05: Tables Module
- **RF-05.1** (Top 10 Users): 1_user_engagement CSV file ✅

### RF-06: AI Assistant for Statistics
**Data source:** 6_user_agent_day_detail CSV file (complete granular data)
- Can answer any question about the data
- Full context available

---

## 📈 Next Steps

1. **Import to Excel/Google Sheets** for analysis
2. **Create dashboard** using the mockup as reference
3. **Set up automated exports** (daily/weekly)
4. **Integrate AI Assistant** (RF-06) to query these CSVs

---

**Generated by:** Flow Analytics System  
**Version:** 1.0.0  
**Contact:** alec@getaifactory.com
`;
}

main();

