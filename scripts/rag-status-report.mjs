#!/usr/bin/env node

/**
 * Comprehensive RAG Status Report
 * Combines Firestore agent/source data with BigQuery chunk data
 */

import { Firestore } from '@google-cloud/firestore';
import { BigQuery } from '@google-cloud/bigquery';
import fs from 'fs';

const firestore = new Firestore({
  projectId: 'salfagpt',
});

const bigquery = new BigQuery({
  projectId: 'salfagpt',
});

console.log('🔍 Comprehensive RAG Status Report');
console.log('='.repeat(150));
console.log('');

async function main() {
  try {
    // Step 1: Get BigQuery chunks
    console.log('📊 Step 1: Querying BigQuery for chunks...');
    const bqQuery = `
      SELECT 
        source_id,
        COUNT(*) as chunk_count,
        MIN(created_at) as first_chunk,
        MAX(created_at) as last_chunk
      FROM \`salfagpt.flow_rag_optimized.document_chunks_vectorized\`
      GROUP BY source_id
      ORDER BY chunk_count DESC
    `;
    
    const [bqJob] = await bigquery.createQueryJob({ query: bqQuery });
    const [bqRows] = await bqJob.getQueryResults();
    
    const bqChunksMap = new Map();
    bqRows.forEach(row => {
      bqChunksMap.set(row.source_id, {
        count: parseInt(row.chunk_count),
        firstChunk: row.first_chunk?.value,
        lastChunk: row.last_chunk?.value,
      });
    });
    
    console.log(`✅ Found ${bqChunksMap.size} sources with chunks in BigQuery`);
    console.log('');
    
    // Step 2: Get all agents
    console.log('📋 Step 2: Loading agents from Firestore...');
    const convSnapshot = await firestore.collection('conversations').get();
    const agents = convSnapshot.docs.map(doc => ({
      id: doc.id,
      title: doc.data().title || 'Untitled',
      ragEnabled: doc.data().ragEnabled || false,
      userId: doc.data().userId,
    }));
    
    console.log(`✅ Found ${agents.length} agents`);
    console.log('');
    
    // Step 3: Get all context sources
    console.log('📚 Step 3: Loading context sources...');
    const sourcesSnapshot = await firestore.collection('context_sources').get();
    const allSources = sourcesSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      type: doc.data().type || 'pdf',
      userId: doc.data().userId,
      assignedToAgents: doc.data().assignedToAgents || [],
      metadata: doc.data().metadata || {},
    }));
    
    console.log(`✅ Found ${allSources.length} context sources`);
    console.log('');
    
    // Step 4: Build comprehensive table
    console.log('🔄 Step 4: Building comprehensive report...');
    const results = [];
    
    for (const agent of agents) {
      // Find sources assigned to this agent
      const agentSources = allSources.filter(s => 
        s.assignedToAgents.includes(agent.id)
      );
      
      if (agentSources.length === 0) {
        results.push({
          agentId: agent.id.substring(0, 12),
          agentTitle: agent.title.substring(0, 35),
          ragEnabled: agent.ragEnabled ? '✅' : '❌',
          sourceCount: 0,
          sourceName: '-',
          sourceType: '-',
          bqChunks: 0,
          hasFS: '-',
          status: '⚪ No sources',
        });
      } else {
        for (const source of agentSources) {
          const bqData = bqChunksMap.get(source.id);
          const bqChunks = bqData ? bqData.count : 0;
          const hasFS = source.metadata?.chunksCount > 0 || 
                       source.metadata?.pageCount > 0;
          
          let status;
          if (bqChunks > 0) {
            status = '✅ In BigQuery';
          } else if (hasFS) {
            status = '🟠 FS metadata only';
          } else {
            status = '❌ No chunks';
          }
          
          results.push({
            agentId: agent.id.substring(0, 12),
            agentTitle: agent.title.substring(0, 35),
            ragEnabled: agent.ragEnabled ? '✅' : '❌',
            sourceCount: agentSources.length,
            sourceName: source.name.substring(0, 28),
            sourceType: source.type,
            bqChunks,
            hasFS: hasFS ? '✅' : '❌',
            status,
          });
        }
      }
    }
    
    console.log('✅ Report complete!');
    console.log('');
    
    // Display table
    console.log('📊 RAG Status & BigQuery Chunks Report');
    console.log('='.repeat(150));
    console.log('');
    console.log(
      'Agent ID'.padEnd(14) +
      'Agent Title'.padEnd(37) +
      'RAG'.padEnd(5) +
      '#Src'.padEnd(6) +
      'Source Name'.padEnd(30) +
      'Type'.padEnd(7) +
      'BQ Chunks'.padEnd(11) +
      'FS Meta'.padEnd(9) +
      'Status'
    );
    console.log('-'.repeat(150));
    
    results.forEach(row => {
      console.log(
        row.agentId.padEnd(14) +
        row.agentTitle.padEnd(37) +
        row.ragEnabled.padEnd(5) +
        row.sourceCount.toString().padEnd(6) +
        row.sourceName.padEnd(30) +
        row.sourceType.padEnd(7) +
        row.bqChunks.toString().padEnd(11) +
        row.hasFS.padEnd(9) +
        row.status
      );
    });
    
    console.log('');
    console.log('='.repeat(150));
    console.log('');
    
    // Summary
    const totalAgents = agents.length;
    const ragEnabled = agents.filter(a => a.ragEnabled).length;
    const agentsWithSources = new Set(results.filter(r => r.sourceCount > 0).map(r => r.agentId)).size;
    const uniqueSources = new Set(results.filter(r => r.sourceName !== '-').map(r => r.sourceName)).size;
    const sourcesInBQ = results.filter(r => r.bqChunks > 0).length;
    const totalBQChunks = results.reduce((sum, r) => sum + r.bqChunks, 0);
    
    console.log('📈 Summary Statistics');
    console.log('-'.repeat(70));
    console.log(`Total Agents:                     ${totalAgents}`);
    console.log(`RAG Enabled:                      ${ragEnabled} (${((ragEnabled/totalAgents)*100).toFixed(1)}%)`);
    console.log(`RAG Disabled:                     ${totalAgents - ragEnabled} (${(((totalAgents - ragEnabled)/totalAgents)*100).toFixed(1)}%)`);
    console.log(`Agents with Context Sources:      ${agentsWithSources}`);
    console.log(`Unique Context Sources:           ${uniqueSources}`);
    console.log(`Sources with BigQuery Chunks:     ${sourcesInBQ}`);
    console.log(`Total BigQuery Chunks:            ${totalBQChunks.toLocaleString()}`);
    console.log('');
    
    // Status breakdown
    const statusCounts = results.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {});
    
    console.log('📊 Storage Status Breakdown');
    console.log('-'.repeat(70));
    Object.entries(statusCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([status, count]) => {
        const pct = ((count / results.length) * 100).toFixed(1);
        console.log(`${status.padEnd(25)} ${count.toString().padEnd(8)} (${pct}%)`);
      });
    console.log('');
    
    // Recommendations
    console.log('💡 Key Insights & Recommendations');
    console.log('-'.repeat(70));
    
    // RAG disabled agents
    if (ragEnabled < totalAgents) {
      console.log(`\n🔧 RAG Configuration:`);
      console.log(`   - ${ragEnabled} agents have RAG enabled`);
      console.log(`   - ${totalAgents - ragEnabled} agents have RAG disabled`);
      console.log(`   → Consider enabling RAG for agents with context sources`);
    }
    
    // Missing BigQuery chunks
    const missingBQ = results.filter(r => 
      r.hasFS === '✅' && r.bqChunks === 0
    );
    
    if (missingBQ.length > 0) {
      console.log(`\n⚠️  Firestore Metadata Without BigQuery Chunks:`);
      console.log(`   - ${missingBQ.length} sources have FS metadata but no BQ chunks`);
      console.log(`   → These may need reindexing or were incompletely processed`);
    }
    
    // No chunks at all
    const noChunks = results.filter(r => 
      r.sourceName !== '-' && r.bqChunks === 0 && r.hasFS === '❌'
    );
    
    if (noChunks.length > 0) {
      console.log(`\n❌ Sources Without Any Chunks:`);
      console.log(`   - ${noChunks.length} sources have no chunks in either location`);
      const uniqueNoChunks = [...new Map(
        noChunks.map(r => [r.sourceName, r])
      ).values()];
      uniqueNoChunks.slice(0, 5).forEach(r => {
        console.log(`     • ${r.sourceName} (${r.sourceType})`);
      });
      if (uniqueNoChunks.length > 5) {
        console.log(`     ... and ${uniqueNoChunks.length - 5} more`);
      }
      console.log(`   → Reindex these sources or check upload logs`);
    }
    
    console.log('');
    
    // Export detailed report
    const exportData = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalAgents,
        ragEnabled,
        ragDisabled: totalAgents - ragEnabled,
        ragEnabledPercentage: ((ragEnabled/totalAgents)*100).toFixed(1),
        agentsWithSources,
        uniqueSources,
        sourcesInBQ,
        totalBQChunks,
      },
      statusBreakdown: statusCounts,
      agents: results,
      bigQuerySources: Array.from(bqChunksMap.entries()).map(([id, data]) => ({
        sourceId: id,
        chunkCount: data.count,
        firstChunk: data.firstChunk,
        lastChunk: data.lastChunk,
      })),
    };
    
    fs.writeFileSync(
      'RAG_STATUS_REPORT.json',
      JSON.stringify(exportData, null, 2)
    );
    
    console.log('💾 Detailed JSON report: RAG_STATUS_REPORT.json');
    console.log('');
    console.log('✅ Verification complete!');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

main();


