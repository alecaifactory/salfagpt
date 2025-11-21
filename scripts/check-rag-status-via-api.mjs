#!/usr/bin/env node

/**
 * RAG Status & BigQuery Chunks Verification via API
 * 
 * Uses production API endpoints to check:
 * 1. RAG enabled status per agent
 * 2. Context sources assigned
 * 3. BigQuery chunks existence
 * 4. Firestore chunks existence
 */

import fetch from 'node-fetch';

const BASE_URL = 'https://cr-salfagpt-ai-ft-prod-kvhq7czbma-uk.a.run.app';

// Known user IDs from system
const TEST_USER_ID = '114671162830729001607'; // alec@getaifactory.com

console.log('🔍 RAG Status & BigQuery Chunks Verification');
console.log('='.repeat(140));
console.log('');

/**
 * Get all conversations
 */
async function getConversations() {
  try {
    const response = await fetch(
      `${BASE_URL}/api/conversations?userId=${TEST_USER_ID}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Extract conversations from groups
    const conversations = [];
    if (data.groups) {
      data.groups.forEach(group => {
        if (group.conversations) {
          conversations.push(...group.conversations);
        }
      });
    }
    
    return conversations;
  } catch (error) {
    console.error('❌ Error fetching conversations:', error.message);
    return [];
  }
}

/**
 * Get context sources for user
 */
async function getContextSources() {
  try {
    const response = await fetch(
      `${BASE_URL}/api/context-sources?userId=${TEST_USER_ID}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.sources || [];
  } catch (error) {
    console.error('❌ Error fetching context sources:', error.message);
    return [];
  }
}

/**
 * Check BigQuery chunks for a source
 */
async function checkBigQueryChunks(sourceId) {
  try {
    const response = await fetch(
      `${BASE_URL}/api/bigquery/chunks-count?sourceId=${sourceId}`
    );
    
    if (!response.ok) {
      return 0;
    }
    
    const data = await response.json();
    return data.count || 0;
  } catch (error) {
    return 0;
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    // Get all conversations
    console.log('📋 Loading agents...');
    const conversations = await getConversations();
    console.log(`✅ Found ${conversations.length} agents`);
    console.log('');
    
    // Get all context sources
    console.log('📚 Loading context sources...');
    const allSources = await getContextSources();
    console.log(`✅ Found ${allSources.length} context sources`);
    console.log('');
    
    // Build results
    const results = [];
    
    for (const conv of conversations) {
      const agentId = conv.id;
      const agentTitle = conv.title || 'Untitled';
      const ragEnabled = conv.ragEnabled || false;
      
      // Find sources assigned to this agent
      const agentSources = allSources.filter(source => 
        source.assignedToAgents && 
        source.assignedToAgents.includes(agentId)
      );
      
      if (agentSources.length === 0) {
        results.push({
          agentId: agentId.substring(0, 12),
          agentTitle: agentTitle.substring(0, 40),
          ragEnabled: ragEnabled ? '✅' : '❌',
          sourceCount: 0,
          sourceName: '-',
          sourceType: '-',
          bigQueryChunks: 0,
          firestoreChunks: '-',
          status: '⚪ No sources',
        });
      } else {
        // Check each source
        for (const source of agentSources) {
          const bqChunks = await checkBigQueryChunks(source.id);
          const fsChunks = source.metadata?.chunksCount > 0;
          
          let status = '⚪ Unknown';
          if (bqChunks > 0 && fsChunks) {
            status = '✅ Both';
          } else if (bqChunks > 0) {
            status = '🟡 BQ only';
          } else if (fsChunks) {
            status = '🟠 FS only';
          } else {
            status = '❌ No chunks';
          }
          
          results.push({
            agentId: agentId.substring(0, 12),
            agentTitle: agentTitle.substring(0, 40),
            ragEnabled: ragEnabled ? '✅' : '❌',
            sourceCount: agentSources.length,
            sourceName: source.name.substring(0, 30),
            sourceType: source.type,
            bigQueryChunks: bqChunks,
            firestoreChunks: fsChunks ? '✅' : '❌',
            status,
          });
        }
      }
    }
    
    // Display results
    console.log('📊 RAG Status & BigQuery Chunks Report');
    console.log('='.repeat(140));
    console.log('');
    
    // Table header
    console.log(
      'Agent ID'.padEnd(15) +
      'Agent Title'.padEnd(42) +
      'RAG'.padEnd(6) +
      'Sources'.padEnd(9) +
      'Source Name'.padEnd(32) +
      'Type'.padEnd(8) +
      'BQ Chunks'.padEnd(12) +
      'FS Chunks'.padEnd(12) +
      'Status'
    );
    console.log('-'.repeat(140));
    
    // Table rows
    results.forEach(row => {
      console.log(
        row.agentId.padEnd(15) +
        row.agentTitle.padEnd(42) +
        row.ragEnabled.padEnd(6) +
        row.sourceCount.toString().padEnd(9) +
        row.sourceName.padEnd(32) +
        row.sourceType.padEnd(8) +
        row.bigQueryChunks.toString().padEnd(12) +
        row.firestoreChunks.padEnd(12) +
        row.status
      );
    });
    
    console.log('');
    console.log('='.repeat(140));
    console.log('');
    
    // Summary statistics
    const totalAgents = conversations.length;
    const ragEnabledCount = conversations.filter(a => a.ragEnabled).length;
    const agentsWithSources = new Set(results.filter(r => r.sourceCount > 0).map(r => r.agentId)).size;
    const sourcesInBQ = results.filter(r => r.bigQueryChunks > 0).length;
    const sourcesInFS = results.filter(r => r.firestoreChunks === '✅').length;
    const totalBQChunks = results.reduce((sum, r) => sum + r.bigQueryChunks, 0);
    const uniqueSources = new Set(results.filter(r => r.sourceName !== '-').map(r => r.sourceName)).size;
    
    console.log('📈 Summary Statistics');
    console.log('-'.repeat(60));
    console.log(`Total Agents:              ${totalAgents}`);
    console.log(`RAG Enabled:               ${ragEnabledCount} (${((ragEnabledCount/totalAgents)*100).toFixed(1)}%)`);
    console.log(`Agents with Sources:       ${agentsWithSources}`);
    console.log(`Unique Sources:            ${uniqueSources}`);
    console.log(`Sources in BigQuery:       ${sourcesInBQ}`);
    console.log(`Sources in Firestore:      ${sourcesInFS}`);
    console.log(`Total BigQuery Chunks:     ${totalBQChunks.toLocaleString()}`);
    console.log('');
    
    // Status breakdown
    const statusCounts = results.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {});
    
    console.log('📊 Storage Status Breakdown');
    console.log('-'.repeat(60));
    Object.entries(statusCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([status, count]) => {
        const pct = ((count / results.length) * 100).toFixed(1);
        console.log(`${status.padEnd(20)} ${count.toString().padEnd(6)} (${pct}%)`);
      });
    console.log('');
    
    // Recommendations
    console.log('💡 Recommendations');
    console.log('-'.repeat(60));
    
    const missingBQ = results.filter(r => r.firestoreChunks === '✅' && r.bigQueryChunks === 0);
    if (missingBQ.length > 0) {
      console.log(`⚠️  ${missingBQ.length} sources need BigQuery sync:`);
      const uniqueMissing = [...new Set(missingBQ.map(r => `${r.sourceName} (${r.sourceType})`))];
      uniqueMissing.slice(0, 5).forEach(source => {
        console.log(`   - ${source}`);
      });
      if (uniqueMissing.length > 5) {
        console.log(`   ... and ${uniqueMissing.length - 5} more`);
      }
      console.log('');
    }
    
    const ragDisabled = conversations.filter(a => !a.ragEnabled);
    if (ragDisabled.length > 0) {
      console.log(`ℹ️  ${ragDisabled.length} agents have RAG disabled`);
      console.log('   Consider enabling RAG for better context retrieval');
      console.log('');
    }
    
    // Export to JSON
    const exportData = {
      timestamp: new Date().toISOString(),
      summary: {
        totalAgents,
        ragEnabledCount,
        agentsWithSources,
        uniqueSources,
        sourcesInBQ,
        sourcesInFS,
        totalBQChunks,
      },
      statusBreakdown: statusCounts,
      details: results,
    };
    
    const fs = await import('fs');
    fs.writeFileSync(
      'RAG_STATUS_REPORT.json',
      JSON.stringify(exportData, null, 2)
    );
    
    console.log('💾 Report exported to: RAG_STATUS_REPORT.json');
    console.log('');
    console.log('✅ Verification complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();


