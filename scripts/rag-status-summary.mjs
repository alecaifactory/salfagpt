#!/usr/bin/env node

/**
 * RAG Status Summary - Compact View
 * Shows only agents that have sources, grouped by RAG status
 */

import fs from 'fs';

const reportFile = 'RAG_STATUS_REPORT.json';

if (!fs.existsSync(reportFile)) {
  console.error('❌ Report file not found. Run: node scripts/rag-status-report.mjs');
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(reportFile, 'utf8'));

console.log('📊 RAG Status Summary - Compact View');
console.log('='.repeat(120));
console.log('');

// Group agents by RAG status and whether they have sources
const agentsWithRAG = report.agents.filter(a => a.ragEnabled === '✅' && a.sourceCount > 0);
const agentsWithoutRAG = report.agents.filter(a => a.ragEnabled === '❌' && a.sourceCount > 0);
const agentsNoSources = report.agents.filter(a => a.sourceCount === 0);

// Group by unique agent (many rows are repeated for multiple sources)
const uniqueAgentsWithRAG = [...new Map(
  agentsWithRAG.map(a => [a.agentId, a])
).values()];

const uniqueAgentsWithoutRAG = [...new Map(
  agentsWithoutRAG.map(a => [a.agentId, a])
).values()];

console.log('📈 Executive Summary');
console.log('-'.repeat(70));
console.log(`Total Agents:                      ${report.summary.totalAgents.toLocaleString()}`);
console.log(`RAG Enabled:                       ${report.summary.ragEnabled} (${report.summary.ragEnabledPercentage}%)`);
console.log(`RAG Disabled:                      ${report.summary.ragDisabled} (${((report.summary.ragDisabled/report.summary.totalAgents)*100).toFixed(1)}%)`);
console.log(`Agents with Context Sources:       ${report.summary.agentsWithSources}`);
console.log(`Unique Context Sources:            ${report.summary.uniqueSources}`);
console.log(`Sources with BigQuery Chunks:      ${report.summary.sourcesInBQ.toLocaleString()}`);
console.log(`Total Chunks in BigQuery:          ${report.summary.totalBQChunks.toLocaleString()}`);
console.log('');

console.log('✅ Agents with RAG ENABLED and Sources');
console.log('-'.repeat(120));
if (uniqueAgentsWithRAG.length === 0) {
  console.log('   (none)');
} else {
  console.log(
    'Agent ID'.padEnd(15) +
    'Agent Title'.padEnd(50) +
    'Sources'.padEnd(10) +
    'Total BQ Chunks'
  );
  console.log('-'.repeat(120));
  
  uniqueAgentsWithRAG.forEach(agent => {
    // Count total chunks for this agent
    const agentRows = agentsWithRAG.filter(a => a.agentId === agent.agentId);
    const totalChunks = agentRows.reduce((sum, a) => sum + a.bqChunks, 0);
    
    console.log(
      agent.agentId.padEnd(15) +
      agent.agentTitle.padEnd(50) +
      agent.sourceCount.toString().padEnd(10) +
      totalChunks.toLocaleString()
    );
  });
}
console.log('');

console.log('❌ Agents with RAG DISABLED but have Sources (Top 20)');
console.log('-'.repeat(120));
if (uniqueAgentsWithoutRAG.length === 0) {
  console.log('   (none)');
} else {
  console.log(
    'Agent ID'.padEnd(15) +
    'Agent Title'.padEnd(50) +
    'Sources'.padEnd(10) +
    'Total BQ Chunks'
  );
  console.log('-'.repeat(120));
  
  // Calculate chunks for each unique agent
  const agentsWithChunkCounts = uniqueAgentsWithoutRAG.map(agent => {
    const agentRows = agentsWithoutRAG.filter(a => a.agentId === agent.agentId);
    const totalChunks = agentRows.reduce((sum, a) => sum + a.bqChunks, 0);
    return { ...agent, totalChunks };
  });
  
  // Sort by chunk count descending
  agentsWithChunkCounts.sort((a, b) => b.totalChunks - a.totalChunks);
  
  agentsWithChunkCounts.slice(0, 20).forEach(agent => {
    console.log(
      agent.agentId.padEnd(15) +
      agent.agentTitle.padEnd(50) +
      agent.sourceCount.toString().padEnd(10) +
      agent.totalChunks.toLocaleString()
    );
  });
  
  if (uniqueAgentsWithoutRAG.length > 20) {
    console.log(`\n   ... and ${uniqueAgentsWithoutRAG.length - 20} more agents with RAG disabled`);
  }
}
console.log('');

console.log('⚪ Agents with NO Sources');
console.log('-'.repeat(70));
console.log(`   ${agentsNoSources.length} agents have no context sources assigned`);
console.log('');

console.log('💡 Key Recommendations');
console.log('-'.repeat(70));
console.log(`1. Enable RAG for ${uniqueAgentsWithoutRAG.length} agents that have sources`);
console.log(`   → These agents have ${report.summary.totalBQChunks.toLocaleString()} chunks but RAG is disabled`);
console.log('');
console.log(`2. Investigate ${report.statusBreakdown['❌ No chunks']} sources with no chunks`);
console.log(`   → These sources may need reindexing`);
console.log('');
console.log(`3. Review ${agentsNoSources.length} agents with no sources`);
console.log(`   → Consider assigning context sources or archiving unused agents`);
console.log('');

// Storage distribution
console.log('📊 Storage Distribution');
console.log('-'.repeat(70));
const totalRows = report.agents.length;
Object.entries(report.statusBreakdown)
  .sort((a, b) => b[1] - a[1])
  .forEach(([status, count]) => {
    const pct = ((count / totalRows) * 100).toFixed(1);
    console.log(`${status.padEnd(25)} ${count.toString().padStart(8)} (${pct}%)`);
  });
console.log('');

console.log('✅ Report complete!');
console.log(`   Full details: ${reportFile}`);
console.log('');


