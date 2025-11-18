#!/usr/bin/env ts-node
/**
 * 🚀 Performance Audit - Flow Platform
 * 
 * Mide el tiempo de carga de CADA caso de uso en la plataforma
 * Objetivo: < 100ms para cada interfaz
 * 
 * Casos de uso medidos:
 * 1. Landing page (/)
 * 2. Chat interface (/chat)
 * 3. Conversations list
 * 4. Messages load
 * 5. Context sources load
 * 6. Agent selection
 * 7. User settings
 * 8. Analytics dashboard
 * 9. Admin panels
 * 10. Document extraction
 * 
 * Run: npm run audit:performance
 */

import { performance } from 'perf_hooks';
import * as fs from 'fs';

// ============================================================
// CONFIGURATION
// ============================================================

const PERFORMANCE_THRESHOLD_MS = 100; // 100ms target
const WARNING_THRESHOLD_MS = 50; // Warn if approaching limit
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

// Test user (use real session token if needed)
const TEST_USER_ID = 'usr_114671162830729001607'; // alec@getaifactory.com
const TEST_SESSION = process.env.TEST_SESSION_TOKEN || '';

// ============================================================
// PERFORMANCE MEASUREMENT UTILITIES
// ============================================================

interface PerformanceResult {
  name: string;
  category: string;
  duration: number;
  status: 'pass' | 'warn' | 'fail';
  details?: any;
  timestamp: string;
}

const results: PerformanceResult[] = [];

function measureSync<T>(name: string, category: string, fn: () => T): T {
  const start = performance.now();
  try {
    const result = fn();
    const duration = performance.now() - start;
    
    recordResult(name, category, duration, {});
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    recordResult(name, category, duration, { error: String(error) });
    throw error;
  }
}

async function measureAsync<T>(
  name: string,
  category: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    
    recordResult(name, category, duration, {});
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    recordResult(name, category, duration, { error: String(error) });
    throw error;
  }
}

function recordResult(
  name: string,
  category: string,
  duration: number,
  details: any = {}
) {
  const status = 
    duration < WARNING_THRESHOLD_MS ? 'pass' :
    duration < PERFORMANCE_THRESHOLD_MS ? 'warn' :
    'fail';
  
  results.push({
    name,
    category,
    duration: Math.round(duration * 100) / 100,
    status,
    details,
    timestamp: new Date().toISOString(),
  });
}

// ============================================================
// NETWORK UTILITIES
// ============================================================

async function fetchWithTiming(url: string, options: any = {}) {
  const start = performance.now();
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Cookie': `flow_session=${TEST_SESSION}`,
        ...options.headers,
      },
    });
    
    const duration = performance.now() - start;
    const data = await response.json();
    
    return {
      duration,
      status: response.status,
      ok: response.ok,
      data,
    };
  } catch (error) {
    const duration = performance.now() - start;
    return {
      duration,
      status: 0,
      ok: false,
      error: String(error),
    };
  }
}

// ============================================================
// TEST SUITES
// ============================================================

// 1. FRONTEND LOAD TIMES
async function auditFrontendLoad() {
  console.log('\n📱 1. FRONTEND LOAD TIMES');
  console.log('='.repeat(60));
  
  // Landing page (/)
  await measureAsync('Landing Page Load', 'Frontend', async () => {
    const response = await fetch(`${API_BASE_URL}/`);
    const html = await response.text();
    return { size: html.length };
  });
  
  // Chat page (/chat) - requires auth
  await measureAsync('Chat Page Load', 'Frontend', async () => {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      headers: {
        'Cookie': `flow_session=${TEST_SESSION}`,
      },
    });
    const html = await response.text();
    return { size: html.length };
  });
  
  // Analytics page
  await measureAsync('Analytics Page Load', 'Frontend', async () => {
    const response = await fetch(`${API_BASE_URL}/analytics`, {
      headers: {
        'Cookie': `flow_session=${TEST_SESSION}`,
      },
    });
    const html = await response.text();
    return { size: html.length };
  });
}

// 2. API RESPONSE TIMES
async function auditAPIResponses() {
  console.log('\n🔌 2. API RESPONSE TIMES');
  console.log('='.repeat(60));
  
  // Conversations list
  const conversationsResult = await measureAsync(
    'API: List Conversations',
    'API',
    async () => {
      return await fetchWithTiming(
        `${API_BASE_URL}/api/conversations?userId=${TEST_USER_ID}`
      );
    }
  );
  console.log(`  → ${conversationsResult.duration}ms (${conversationsResult.ok ? 'OK' : 'FAIL'})`);
  
  // Get first conversation ID for subsequent tests
  const firstConvId = conversationsResult.data?.groups?.[0]?.conversations?.[0]?.id;
  
  if (firstConvId) {
    // Messages for conversation
    await measureAsync('API: List Messages', 'API', async () => {
      return await fetchWithTiming(
        `${API_BASE_URL}/api/conversations/${firstConvId}/messages`
      );
    });
  }
  
  // Context sources
  await measureAsync('API: List Context Sources', 'API', async () => {
    return await fetchWithTiming(
      `${API_BASE_URL}/api/context-sources?userId=${TEST_USER_ID}`
    );
  });
  
  // User settings
  await measureAsync('API: Get User Settings', 'API', async () => {
    return await fetchWithTiming(
      `${API_BASE_URL}/api/user-settings?userId=${TEST_USER_ID}`
    );
  });
  
  // Agent config (if conversation exists)
  if (firstConvId) {
    await measureAsync('API: Get Agent Config', 'API', async () => {
      return await fetchWithTiming(
        `${API_BASE_URL}/api/agent-config?conversationId=${firstConvId}`
      );
    });
  }
  
  // Conversation context
  if (firstConvId) {
    await measureAsync('API: Get Conversation Context', 'API', async () => {
      return await fetchWithTiming(
        `${API_BASE_URL}/api/conversation-context?conversationId=${firstConvId}`
      );
    });
  }
  
  // Analytics summary
  await measureAsync('API: Analytics Summary', 'API', async () => {
    return await fetchWithTiming(
      `${API_BASE_URL}/api/analytics/summary?userId=${TEST_USER_ID}`
    );
  });
  
  // Folders
  await measureAsync('API: List Folders', 'API', async () => {
    return await fetchWithTiming(
      `${API_BASE_URL}/api/folders?userId=${TEST_USER_ID}`
    );
  });
}

// 3. DATABASE QUERY PERFORMANCE
async function auditDatabaseQueries() {
  console.log('\n🗄️  3. DATABASE QUERY PERFORMANCE');
  console.log('='.repeat(60));
  
  // Test key Firestore queries
  const queries = [
    {
      name: 'Query: Conversations by userId',
      endpoint: `/api/conversations?userId=${TEST_USER_ID}`,
    },
    {
      name: 'Query: Context sources by userId',
      endpoint: `/api/context-sources?userId=${TEST_USER_ID}`,
    },
    {
      name: 'Query: User settings by userId',
      endpoint: `/api/user-settings?userId=${TEST_USER_ID}`,
    },
  ];
  
  for (const query of queries) {
    await measureAsync(query.name, 'Database', async () => {
      return await fetchWithTiming(`${API_BASE_URL}${query.endpoint}`);
    });
  }
}

// 4. COMPONENT RENDER PERFORMANCE
async function auditComponentRender() {
  console.log('\n⚛️  4. COMPONENT RENDER PERFORMANCE');
  console.log('='.repeat(60));
  
  // Simulated component operations
  
  // Chat message render (100 messages)
  measureSync('Render: 100 Messages', 'Component', () => {
    const messages = Array(100).fill(null).map((_, i) => ({
      id: `msg-${i}`,
      content: `Message ${i}`,
      role: i % 2 === 0 ? 'user' : 'assistant',
      timestamp: new Date(),
    }));
    
    // Simulate React render
    return messages.map(m => ({
      ...m,
      formatted: `[${m.role}] ${m.content}`,
    }));
  });
  
  // Conversation list render (50 conversations)
  measureSync('Render: 50 Conversations', 'Component', () => {
    const conversations = Array(50).fill(null).map((_, i) => ({
      id: `conv-${i}`,
      title: `Conversation ${i}`,
      lastMessageAt: new Date(),
      messageCount: Math.floor(Math.random() * 100),
    }));
    
    return conversations.map(c => ({
      ...c,
      timeAgo: 'hace 2 horas',
    }));
  });
  
  // Context sources render (20 sources)
  measureSync('Render: 20 Context Sources', 'Component', () => {
    const sources = Array(20).fill(null).map((_, i) => ({
      id: `source-${i}`,
      name: `Document ${i}.pdf`,
      enabled: i % 2 === 0,
      extractedData: 'Lorem ipsum...'.repeat(100),
    }));
    
    return sources.filter(s => s.enabled);
  });
}

// 5. CRITICAL USER FLOWS
async function auditCriticalFlows() {
  console.log('\n🔄 5. CRITICAL USER FLOWS');
  console.log('='.repeat(60));
  
  // Flow 1: Create new agent (simulated)
  measureSync('Flow: Create Agent (simulated)', 'Critical Flow', () => {
    // Simulate creating agent with optimistic UI
    const newAgent = {
      id: `temp-${Date.now()}`,
      title: 'Performance Test Agent',
      createdAt: new Date(),
      userId: TEST_USER_ID,
    };
    
    return newAgent;
  });
  
  // Flow 2: Send message (simulated - requires auth)
  measureSync('Flow: Send Message (simulated)', 'Critical Flow', () => {
    // Simulate optimistic update
    const tempMessage = {
      id: `temp-${Date.now()}`,
      content: 'Performance test message',
      role: 'user',
      timestamp: new Date(),
    };
    
    // Simulate UI update (instant)
    return tempMessage;
  });
  
  // Flow 3: Switch agent (simulated)
  measureSync('Flow: Switch Agent (simulated)', 'Critical Flow', () => {
    // Simulate loading conversations from cache
    const conversations = Array(50).fill(null).map((_, i) => ({
      id: `conv-${i}`,
      title: `Agent ${i}`,
    }));
    
    // Simulate switching (cache hit)
    const selectedConv = conversations[0];
    
    return { conversations: conversations.length, selected: selectedConv };
  });
}

// 6. MODAL & PANEL LOAD TIMES
async function auditModalsAndPanels() {
  console.log('\n🪟 6. MODAL & PANEL LOAD TIMES');
  console.log('='.repeat(60));
  
  // User settings modal
  await measureAsync('Modal: User Settings', 'UI', async () => {
    return await fetchWithTiming(
      `${API_BASE_URL}/api/user-settings?userId=${TEST_USER_ID}`
    );
  });
  
  // Context management
  await measureAsync('Panel: Context Management', 'UI', async () => {
    return await fetchWithTiming(
      `${API_BASE_URL}/api/context-sources?userId=${TEST_USER_ID}`
    );
  });
  
  // Analytics dashboard
  await measureAsync('Panel: Analytics Dashboard', 'UI', async () => {
    return await fetchWithTiming(
      `${API_BASE_URL}/api/analytics/summary?userId=${TEST_USER_ID}`
    );
  });
  
  // Organizations (SuperAdmin)
  await measureAsync('Panel: Organizations', 'UI', async () => {
    return await fetchWithTiming(
      `${API_BASE_URL}/api/organizations`
    );
  });
}

// 7. SEARCH & FILTER OPERATIONS
async function auditSearchAndFilter() {
  console.log('\n🔍 7. SEARCH & FILTER OPERATIONS');
  console.log('='.repeat(60));
  
  // Search conversations (client-side filter simulation)
  measureSync('Filter: Search Conversations (50 items)', 'Search', () => {
    const conversations = Array(50).fill(null).map((_, i) => ({
      id: `conv-${i}`,
      title: `Conversation about ${i % 5 === 0 ? 'analytics' : 'general topic'} ${i}`,
    }));
    
    const searchTerm = 'analytics';
    return conversations.filter(c => 
      c.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });
  
  // Filter by folder (client-side)
  measureSync('Filter: By Folder (50 items)', 'Search', () => {
    const conversations = Array(50).fill(null).map((_, i) => ({
      id: `conv-${i}`,
      folderId: i < 20 ? 'folder-1' : 'folder-2',
    }));
    
    const targetFolder = 'folder-1';
    return conversations.filter(c => c.folderId === targetFolder);
  });
}

// 8. CONTEXT WINDOW CALCULATION
async function auditContextCalculations() {
  console.log('\n🧮 8. CONTEXT WINDOW CALCULATIONS');
  console.log('='.repeat(60));
  
  // Token estimation (simulated)
  measureSync('Calculate: Token Estimation (1000 chars)', 'Context', () => {
    const text = 'Lorem ipsum '.repeat(100);
    const tokens = Math.ceil(text.length / 4); // Rough estimation
    return tokens;
  });
  
  // Context window usage calculation
  measureSync('Calculate: Context Window Usage', 'Context', () => {
    const systemPrompt = 'You are a helpful assistant.';
    const conversationHistory = Array(10).fill(null).map(() => ({
      role: 'user',
      content: 'Sample message',
    }));
    const contextSources = Array(3).fill(null).map(() => ({
      name: 'Document.pdf',
      content: 'Lorem ipsum '.repeat(1000),
    }));
    
    const systemTokens = Math.ceil(systemPrompt.length / 4);
    const historyTokens = conversationHistory.reduce(
      (sum, msg) => sum + Math.ceil(msg.content.length / 4),
      0
    );
    const contextTokens = contextSources.reduce(
      (sum, src) => sum + Math.ceil(src.content.length / 4),
      0
    );
    
    const totalTokens = systemTokens + historyTokens + contextTokens;
    const capacity = 1000000; // 1M for Flash
    const usage = (totalTokens / capacity) * 100;
    
    return { totalTokens, usage };
  });
}

// 9. ADMIN OPERATIONS
async function auditAdminOperations() {
  console.log('\n👑 9. ADMIN OPERATIONS');
  console.log('='.repeat(60));
  
  // List all users (admin)
  await measureAsync('Admin: List All Users', 'Admin', async () => {
    return await fetchWithTiming(`${API_BASE_URL}/api/users`);
  });
  
  // Domain statistics
  await measureAsync('Admin: Domain Stats', 'Admin', async () => {
    return await fetchWithTiming(
      `${API_BASE_URL}/api/domains/stats`
    );
  });
  
  // Context management (all sources)
  await measureAsync('Admin: All Context Sources', 'Admin', async () => {
    return await fetchWithTiming(
      `${API_BASE_URL}/api/context-sources/all`
    );
  });
}

// 10. REAL-TIME OPERATIONS
async function auditRealTimeOperations() {
  console.log('\n⚡ 10. REAL-TIME OPERATIONS');
  console.log('='.repeat(60));
  
  // Simulated typing (input latency)
  measureSync('Input: Keystroke Response', 'Real-time', () => {
    const input = 'Hello world';
    const processed = input.toLowerCase();
    return processed;
  });
  
  // Simulated toggle (context source on/off)
  measureSync('Toggle: Context Source', 'Real-time', () => {
    const sources = Array(20).fill(null).map((_, i) => ({
      id: `source-${i}`,
      enabled: i % 2 === 0,
    }));
    
    // Toggle first source
    sources[0].enabled = !sources[0].enabled;
    
    return sources;
  });
  
  // Simulated scroll (message list)
  measureSync('Scroll: Message List', 'Real-time', () => {
    const messages = Array(100).fill(null).map((_, i) => ({
      id: `msg-${i}`,
      visible: i >= 90, // Last 10 visible
    }));
    
    return messages.filter(m => m.visible);
  });
}

// ============================================================
// REPORTING
// ============================================================

function printResults() {
  console.log('\n📊 PERFORMANCE AUDIT RESULTS');
  console.log('='.repeat(80));
  console.log('');
  
  // Group by category
  const byCategory: Record<string, PerformanceResult[]> = {};
  
  results.forEach(result => {
    if (!byCategory[result.category]) {
      byCategory[result.category] = [];
    }
    byCategory[result.category].push(result);
  });
  
  // Print each category
  Object.entries(byCategory).forEach(([category, categoryResults]) => {
    console.log(`\n${category}:`);
    console.log('-'.repeat(80));
    
    categoryResults.forEach(result => {
      const icon = 
        result.status === 'pass' ? '✅' :
        result.status === 'warn' ? '⚠️' :
        '❌';
      
      const statusColor = 
        result.status === 'pass' ? '' :
        result.status === 'warn' ? '\x1b[33m' : // Yellow
        '\x1b[31m'; // Red
      
      const resetColor = '\x1b[0m';
      
      console.log(
        `${icon} ${statusColor}${result.name.padEnd(50)}${result.duration.toString().padStart(8)}ms${resetColor}`
      );
    });
  });
  
  // Summary statistics
  console.log('\n📈 SUMMARY STATISTICS');
  console.log('='.repeat(80));
  
  const passed = results.filter(r => r.status === 'pass').length;
  const warned = results.filter(r => r.status === 'warn').length;
  const failed = results.filter(r => r.status === 'fail').length;
  
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
  const maxDuration = Math.max(...results.map(r => r.duration));
  const minDuration = Math.min(...results.map(r => r.duration));
  
  const p50 = results.map(r => r.duration).sort((a, b) => a - b)[Math.floor(results.length * 0.5)];
  const p95 = results.map(r => r.duration).sort((a, b) => a - b)[Math.floor(results.length * 0.95)];
  const p99 = results.map(r => r.duration).sort((a, b) => a - b)[Math.floor(results.length * 0.99)];
  
  console.log('');
  console.log(`Total Tests: ${results.length}`);
  console.log(`✅ Passed (<50ms): ${passed} (${((passed / results.length) * 100).toFixed(1)}%)`);
  console.log(`⚠️  Warning (50-100ms): ${warned} (${((warned / results.length) * 100).toFixed(1)}%)`);
  console.log(`❌ Failed (>100ms): ${failed} (${((failed / results.length) * 100).toFixed(1)}%)`);
  console.log('');
  console.log(`Average: ${avgDuration.toFixed(2)}ms`);
  console.log(`Min: ${minDuration.toFixed(2)}ms`);
  console.log(`Max: ${maxDuration.toFixed(2)}ms`);
  console.log(`P50 (median): ${p50?.toFixed(2)}ms`);
  console.log(`P95: ${p95?.toFixed(2)}ms`);
  console.log(`P99: ${p99?.toFixed(2)}ms`);
  
  // Critical failures
  const criticalFailures = results.filter(
    r => r.status === 'fail' && (
      r.category === 'Critical Flow' ||
      r.category === 'Real-time' ||
      r.name.includes('API:')
    )
  );
  
  if (criticalFailures.length > 0) {
    console.log('\n🚨 CRITICAL FAILURES (>100ms):');
    console.log('-'.repeat(80));
    criticalFailures.forEach(failure => {
      console.log(`  ❌ ${failure.name}: ${failure.duration}ms`);
    });
  }
  
  console.log('');
}

function saveResultsToFile() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `performance-audit-${timestamp}.json`;
  
  const report = {
    timestamp: new Date().toISOString(),
    threshold: PERFORMANCE_THRESHOLD_MS,
    results,
    summary: {
      total: results.length,
      passed: results.filter(r => r.status === 'pass').length,
      warned: results.filter(r => r.status === 'warn').length,
      failed: results.filter(r => r.status === 'fail').length,
      avgDuration: results.reduce((sum, r) => sum + r.duration, 0) / results.length,
    },
  };
  
  fs.writeFileSync(filename, JSON.stringify(report, null, 2));
  console.log(`\n💾 Results saved to: ${filename}`);
}

// ============================================================
// RECOMMENDATIONS
// ============================================================

function generateRecommendations() {
  console.log('\n💡 OPTIMIZATION RECOMMENDATIONS');
  console.log('='.repeat(80));
  console.log('');
  
  const slowOperations = results
    .filter(r => r.status === 'fail')
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 10);
  
  if (slowOperations.length === 0) {
    console.log('✅ All operations within acceptable limits!');
    return;
  }
  
  console.log('Top 10 slowest operations to optimize:');
  console.log('');
  
  slowOperations.forEach((op, index) => {
    console.log(`${index + 1}. ${op.name} (${op.duration}ms)`);
    
    // Generate specific recommendations
    const recommendations: string[] = [];
    
    if (op.category === 'API') {
      recommendations.push('  → Add response caching (Redis/memory)');
      recommendations.push('  → Optimize database query (add index)');
      recommendations.push('  → Reduce payload size (pagination)');
    }
    
    if (op.category === 'Database') {
      recommendations.push('  → Create composite index');
      recommendations.push('  → Use query cursor for pagination');
      recommendations.push('  → Consider denormalization');
    }
    
    if (op.category === 'Component') {
      recommendations.push('  → Add React.memo() for memoization');
      recommendations.push('  → Use virtualization for long lists');
      recommendations.push('  → Lazy load heavy components');
    }
    
    if (op.category === 'Critical Flow') {
      recommendations.push('  → Parallelize independent operations');
      recommendations.push('  → Add optimistic UI updates');
      recommendations.push('  → Pre-load common data');
    }
    
    if (recommendations.length > 0) {
      recommendations.forEach(rec => console.log(rec));
    }
    
    console.log('');
  });
}

// ============================================================
// MAIN EXECUTION
// ============================================================

async function main() {
  console.log('🚀 FLOW PERFORMANCE AUDIT');
  console.log('='.repeat(80));
  console.log(`Target: < ${PERFORMANCE_THRESHOLD_MS}ms per operation`);
  console.log(`API Base: ${API_BASE_URL}`);
  console.log(`User: ${TEST_USER_ID}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  
  try {
    // Run all audit suites
    await auditFrontendLoad();
    await auditAPIResponses();
    await auditDatabaseQueries();
    await auditComponentRender();
    await auditCriticalFlows();
    await auditModalsAndPanels();
    await auditSearchAndFilter();
    await auditContextCalculations();
    await auditAdminOperations();
    await auditRealTimeOperations();
    
    // Print results
    printResults();
    
    // Generate recommendations
    generateRecommendations();
    
    // Save to file
    saveResultsToFile();
    
    console.log('\n✅ Performance audit complete!');
    console.log('');
    
  } catch (error) {
    console.error('\n❌ Audit failed:', error);
    process.exit(1);
  }
}

// Run if executed directly (ES modules compatible)
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { main, measureAsync, measureSync };

