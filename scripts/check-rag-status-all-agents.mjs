#!/usr/bin/env node

/**
 * RAG Status & BigQuery Chunks Verification
 * 
 * Checks all agents for:
 * 1. RAG enabled status
 * 2. Context sources assigned
 * 3. BigQuery chunks existence
 * 4. Firestore chunks existence
 * 
 * Outputs: Comprehensive table showing storage location of chunks
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { BigQuery } from '@google-cloud/bigquery';
import fs from 'fs';

// Initialize Firebase Admin
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || 
  '/Users/alec/salfagpt/salfagpt-firebase-adminsdk.json';

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Service account file not found:', serviceAccountPath);
  console.error('   Set GOOGLE_APPLICATION_CREDENTIALS or ensure file exists');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

initializeApp({
  credential: cert(serviceAccount),
  databaseURL: 'https://salfagpt.firebaseio.com',
});

const firestore = getFirestore();
firestore.settings({ databaseId: 'flow-prod' });

const bigquery = new BigQuery({
  projectId: 'salfagpt',
});

const BIGQUERY_DATASET = 'flow_dataset_green';
const BIGQUERY_TABLE = 'document_chunks';

console.log('🔍 RAG Status & BigQuery Chunks Verification');
console.log('='.repeat(120));
console.log('');

/**
 * Get all agents (conversations)
 */
async function getAllAgents() {
  const snapshot = await firestore
    .collection('conversations')
    .orderBy('createdAt', 'desc')
    .get();
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
}

/**
 * Get context sources for an agent
 */
async function getAgentContextSources(agentId) {
  const snapshot = await firestore
    .collection('context_sources')
    .where('assignedToAgents', 'array-contains', agentId)
    .get();
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    name: doc.data().name,
    type: doc.data().type,
    userId: doc.data().userId,
  }));
}

/**
 * Check if chunks exist in BigQuery for a source
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
    return rows[0]?.count > 0 ? parseInt(rows[0].count) : 0;
  } catch (error) {
    return 0;
  }
}

/**
 * Check if chunks exist in Firestore for a source
 */
async function checkFirestoreChunks(sourceId) {
  try {
    const snapshot = await firestore
      .collection('document_chunks')
      .where('sourceId', '==', sourceId)
      .limit(1)
      .get();
    
    return snapshot.size > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    // Get all agents
    console.log('📋 Loading agents...');
    const agents = await getAllAgents();
    console.log(`✅ Found ${agents.length} agents`);
    console.log('');
    
    // Check each agent
    const results = [];
    
    for (const agent of agents) {
      const agentId = agent.id;
      const agentTitle = agent.title || 'Untitled';
      const ragEnabled = agent.ragEnabled || false;
      
      // Get context sources
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
          firestoreChunks: '❌',
          status: '⚪ No sources',
        });
      } else {
        // Check each source
        for (const source of sources) {
          const bqChunks = await checkBigQueryChunks(source.id);
          const fsChunks = await checkFirestoreChunks(source.id);
          
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
            sourceCount: sources.length,
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
    const totalAgents = agents.length;
    const ragEnabledCount = agents.filter(a => a.ragEnabled).length;
    const agentsWithSources = new Set(results.filter(r => r.sourceCount > 0).map(r => r.agentId)).size;
    const sourcesInBQ = results.filter(r => r.bigQueryChunks > 0).length;
    const sourcesInFS = results.filter(r => r.firestoreChunks === '✅').length;
    const totalBQChunks = results.reduce((sum, r) => sum + r.bigQueryChunks, 0);
    
    console.log('📈 Summary Statistics');
    console.log('-'.repeat(60));
    console.log(`Total Agents:              ${totalAgents}`);
    console.log(`RAG Enabled:               ${ragEnabledCount} (${((ragEnabledCount/totalAgents)*100).toFixed(1)}%)`);
    console.log(`Agents with Sources:       ${agentsWithSources}`);
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
      missingBQ.slice(0, 5).forEach(r => {
        console.log(`   - ${r.sourceName} (${r.sourceType})`);
      });
      if (missingBQ.length > 5) {
        console.log(`   ... and ${missingBQ.length - 5} more`);
      }
      console.log('');
    }
    
    const ragDisabled = agents.filter(a => !a.ragEnabled);
    if (ragDisabled.length > 0) {
      console.log(`ℹ️  ${ragDisabled.length} agents have RAG disabled`);
      console.log('   Consider enabling RAG for better context retrieval');
      console.log('');
    }
    
    console.log('✅ Verification complete!');
    
    // Exit cleanly
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
