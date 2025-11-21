#!/usr/bin/env node

/**
 * RAG Status & BigQuery Chunks Verification with Authentication
 * 
 * Checks all agents for:
 * 1. RAG enabled status
 * 2. Context sources assigned  
 * 3. BigQuery chunks existence
 * 4. Firestore chunks vs BigQuery comparison
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { BigQuery } from '@google-cloud/bigquery';
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';

initializeApp({ projectId: 'salfagpt' });
const db = getFirestore();
db.settings({ databaseId: 'flow-prod' });

const bigquery = new BigQuery({ projectId: 'salfagpt' });

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const USER_EMAIL = 'alec@getaifactory.com';
const USER_ID = 'usr_uhwqffaqag1wrryd82tw';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const BIGQUERY_DATASET = 'flow_dataset_green';
const BIGQUERY_TABLE = 'document_chunks';

console.log('🔍 RAG Status & BigQuery Chunks Verification');
console.log('='.repeat(140));
console.log('');

/**
 * Create session token
 */
function createSessionToken(userId, email) {
  const payload = {
    id: userId,
    email: email,
    role: 'superadmin',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
  };
  
  return jwt.sign(payload, JWT_SECRET);
}

/**
 * Get all agents directly from Firestore
 */
async function getAllAgents() {
  const snapshot = await db
    .collection('conversations')
    .orderBy('createdAt', 'desc')
    .get();
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    title: doc.data().title,
    ragEnabled: doc.data().ragEnabled || false,
    userId: doc.data().userId,
  }));
}

/**
 * Get context sources assigned to an agent
 */
async function getAgentContextSources(agentId) {
  const snapshot = await db
    .collection('context_sources')
    .where('assignedToAgents', 'array-contains', agentId)
    .get();
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    name: doc.data().name,
    type: doc.data().type,
    userId: doc.data().userId,
    metadata: doc.data().metadata || {},
  }));
}

/**
 * Check BigQuery chunks for a source
 */
async function checkBigQueryChunks(sourceId) {
  try {
    const query = `
      SELECT COUNT(*) as count
      FROM \`salfagpt.${BIGQUERY_DATASET}.${BIGQUERY_TABLE}\`
      WHERE sourceId = @sourceId
    `;
    
    const [job] = await bigquery.createQueryJob({
      query,
      params: { sourceId },
    });
    
    const [rows] = await job.getQueryResults();
    return rows[0]?.count ? parseInt(rows[0].count) : 0;
  } catch (error) {
    console.error(`   ⚠️  BigQuery error for ${sourceId}:`, error.message);
    return 0;
  }
}

/**
 * Check Firestore chunks for a source
 */
async function checkFirestoreChunks(sourceId) {
  try {
    const snapshot = await db
      .collection('document_chunks')
      .where('sourceId', '==', sourceId)
      .limit(1)
      .get();
    
    return snapshot.size;
  } catch (error) {
    return 0;
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    // Get all agents
    console.log('📋 Loading agents from Firestore...');
    const agents = await getAllAgents();
    console.log(`✅ Found ${agents.length} agents`);
    console.log('');
    
    // Process each agent
    console.log('🔄 Checking RAG status and chunks...');
    const results = [];
    
    for (let i = 0; i < agents.length; i++) {
      const agent = agents[i];
      process.stdout.write(`\r   Progress: ${i + 1}/${agents.length} agents`);
      
      const agentId = agent.id;
      const agentTitle = agent.title || 'Untitled';
      const ragEnabled = agent.ragEnabled || false;
      
      // Get context sources for this agent
      const sources = await getAgentContextSources(agentId);
      
      if (sources.length === 0) {
        results.push({
          agentId: agentId.substring(0, 12),
          agentTitle: agentTitle.substring(0, 40),
          ragEnabled: ragEnabled ? '✅' : '❌',
          sourceCount: 0,
          sourceName: '-',
          sourceType: '-',
          bigQueryChunks: 0,
          firestoreChunks: 0,
          status: '⚪ No sources',
        });
      } else {
        // Check each source
        for (const source of sources) {
          const bqChunks = await checkBigQueryChunks(source.id);
          const fsChunks = await checkFirestoreChunks(source.id);
          
          let status = '⚪ Unknown';
          if (bqChunks > 0 && fsChunks > 0) {
            status = '✅ Both';
          } else if (bqChunks > 0 && fsChunks === 0) {
            status = '🟡 BQ only';
          } else if (bqChunks === 0 && fsChunks > 0) {
            status = '🟠 FS only';
          } else {
            status = '❌ No chunks';
          }
          
          results.push({
            agentId: agentId.substring(0, 12),
            agentTitle: agentTitle.substring(0, 40),
            ragEnabled: ragEnabled ? '✅' : '❌',
            sourceCount: sources.length,
            sourceName: source.name.substring(0, 30),
            sourceType: source.type || 'pdf',
            bigQueryChunks: bqChunks,
            firestoreChunks: fsChunks,
            status,
          });
        }
      }
    }
    
    console.log('\r' + ' '.repeat(80)); // Clear progress line
    console.log('✅ Analysis complete!');
    console.log('');
    
    // Display results table
    console.log('📊 RAG Status & BigQuery Chunks Report');
    console.log('='.repeat(140));
    console.log('');
    
    // Table header
    console.log(
      'Agent ID'.padEnd(15) +
      'Agent Title'.padEnd(42) +
      'RAG'.padEnd(6) +
      '#Srcs'.padEnd(8) +
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
        row.sourceCount.toString().padEnd(8) +
        row.sourceName.padEnd(32) +
        row.sourceType.padEnd(8) +
        row.bigQueryChunks.toString().padEnd(12) +
        row.firestoreChunks.toString().padEnd(12) +
        row.status
      );
    });
    
    console.log('');
    console.log('='.repeat(140));
    console.log('');
    
    // Summary statistics
    const totalAgents = agents.length;
    const ragEnabledCount = agents.filter(a => a.ragEnabled).length;
    const agentsWithSources = new Set(
      results.filter(r => r.sourceCount > 0).map(r => r.agentId)
    ).size;
    
    const uniqueSources = new Set(
      results.filter(r => r.sourceName !== '-').map(r => r.sourceName)
    ).size;
    
    const sourcesInBQ = results.filter(r => r.bigQueryChunks > 0).length;
    const sourcesInFS = results.filter(r => r.firestoreChunks > 0).length;
    const totalBQChunks = results.reduce((sum, r) => sum + r.bigQueryChunks, 0);
    const totalFSChunks = results.reduce((sum, r) => sum + r.firestoreChunks, 0);
    
    console.log('📈 Summary Statistics');
    console.log('-'.repeat(60));
    console.log(`Total Agents:              ${totalAgents}`);
    console.log(`RAG Enabled:               ${ragEnabledCount} (${totalAgents > 0 ? ((ragEnabledCount/totalAgents)*100).toFixed(1) : 0}%)`);
    console.log(`Agents with Sources:       ${agentsWithSources}`);
    console.log(`Unique Sources:            ${uniqueSources}`);
    console.log(`Sources in BigQuery:       ${sourcesInBQ}`);
    console.log(`Sources in Firestore:      ${sourcesInFS}`);
    console.log(`Total BigQuery Chunks:     ${totalBQChunks.toLocaleString()}`);
    console.log(`Total Firestore Chunks:    ${totalFSChunks.toLocaleString()}`);
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
        const pct = results.length > 0 ? ((count / results.length) * 100).toFixed(1) : 0;
        console.log(`${status.padEnd(20)} ${count.toString().padEnd(6)} (${pct}%)`);
      });
    console.log('');
    
    // Recommendations
    console.log('💡 Recommendations');
    console.log('-'.repeat(60));
    
    const missingBQ = results.filter(r => r.firestoreChunks > 0 && r.bigQueryChunks === 0);
    if (missingBQ.length > 0) {
      console.log(`⚠️  ${missingBQ.length} sources have Firestore chunks but missing BigQuery:`);
      const uniqueMissing = [...new Map(
        missingBQ.map(r => [`${r.sourceName}|${r.sourceType}`, r])
      ).values()];
      
      uniqueMissing.slice(0, 5).forEach(r => {
        console.log(`   - ${r.sourceName} (${r.sourceType}) - ${r.firestoreChunks} FS chunks`);
      });
      if (uniqueMissing.length > 5) {
        console.log(`   ... and ${uniqueMissing.length - 5} more`);
      }
      console.log('');
      console.log('   Action: Run sync script to migrate to BigQuery');
      console.log('');
    }
    
    const ragDisabled = agents.filter(a => !a.ragEnabled);
    if (ragDisabled.length > 0) {
      console.log(`ℹ️  ${ragDisabled.length} agents have RAG disabled`);
      console.log('   Consider enabling RAG for better context retrieval');
      console.log('');
    }
    
    const noChunks = results.filter(r => 
      r.sourceName !== '-' && r.bigQueryChunks === 0 && r.firestoreChunks === 0
    );
    if (noChunks.length > 0) {
      console.log(`❌ ${noChunks.length} sources have NO chunks in either location:`);
      const uniqueNoChunks = [...new Map(
        noChunks.map(r => [`${r.sourceName}|${r.sourceType}`, r])
      ).values()];
      
      uniqueNoChunks.slice(0, 5).forEach(r => {
        console.log(`   - ${r.sourceName} (${r.sourceType})`);
      });
      if (uniqueNoChunks.length > 5) {
        console.log(`   ... and ${uniqueNoChunks.length - 5} more`);
      }
      console.log('');
      console.log('   Action: Re-index these sources or check indexing logs');
      console.log('');
    }
    
    // Export to JSON
    const exportData = {
      timestamp: new Date().toISOString(),
      summary: {
        totalAgents,
        ragEnabledCount,
        ragEnabledPercentage: totalAgents > 0 ? ((ragEnabledCount/totalAgents)*100).toFixed(1) : 0,
        agentsWithSources,
        uniqueSources,
        sourcesInBQ,
        sourcesInFS,
        totalBQChunks,
        totalFSChunks,
      },
      statusBreakdown: statusCounts,
      details: results,
      recommendations: {
        needBigQuerySync: missingBQ.length,
        ragDisabledAgents: ragDisabled.length,
        sourcesWithNoChunks: noChunks.length,
      },
    };
    
    const fs = await import('fs');
    fs.writeFileSync(
      'RAG_STATUS_REPORT.json',
      JSON.stringify(exportData, null, 2)
    );
    
    console.log('💾 Detailed report exported to: RAG_STATUS_REPORT.json');
    console.log('');
    console.log('✅ Verification complete!');
    
    // Exit cleanly
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();


