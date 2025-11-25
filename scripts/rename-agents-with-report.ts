#!/usr/bin/env tsx
/**
 * Rename Agents and Generate Report
 * 
 * Renames specified agents and provides comprehensive table with:
 * - Previous name
 * - New name
 * - Agent ID
 * - Number of users with access (shares)
 * - Number of documents available for RAG in BigQuery
 * 
 * Date: 2025-11-24
 */

import { firestore, COLLECTIONS } from '../src/lib/firestore.js';
import { BigQuery } from '@google-cloud/bigquery';

const bigquery = new BigQuery({ projectId: 'salfagpt' });

// Agents to rename (IDs verified from UI screenshots)
const AGENT_RENAMES = [
  {
    id: 'iQmdg3bMSJ1AdqqlFpye',
    oldName: 'S1-v2',
    newName: 'Gestion Bodegas (S1-v2)'
  },
  {
    id: '1lgr33ywq5qed67sqCYi',
    oldName: 'S2-v2',
    newName: 'Maqsa Mantenimiento (S2-v2)'
  },
  {
    id: 'EgXezLcu4O3IUqFUJhUZ',
    oldName: 'M1-v2',
    newName: 'Asistente Legal Territorial RDI (M1-v2)'
  },
  {
    id: 'vStojK73ZKbj',
    oldName: 'M3-v2',
    newName: 'GOP GPT (M3-v2)'
  }
];

/**
 * Get number of users who have access to an agent via shares
 */
async function getSharedUsersCount(agentId: string): Promise<number> {
  try {
    const sharesSnapshot = await firestore
      .collection(COLLECTIONS.AGENT_SHARES)
      .where('agentId', '==', agentId)
      .get();
    
    const uniqueUsers = new Set<string>();
    
    sharesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const sharedWith = data.sharedWith || [];
      
      sharedWith.forEach((target: any) => {
        if (target.type === 'user' && target.id) {
          uniqueUsers.add(target.id);
        }
      });
    });
    
    return uniqueUsers.size;
  } catch (error: any) {
    console.error(`  ❌ Error getting shares for ${agentId}:`, error.message);
    return 0;
  }
}

/**
 * Get number of documents available for RAG in BigQuery for an agent
 */
async function getBigQueryDocumentCount(agentId: string): Promise<number> {
  try {
    // Query chunks table to count unique sources for this agent
    const query = `
      SELECT COUNT(DISTINCT source_id) as doc_count
      FROM \`salfagpt.flow_rag_optimized.document_chunks_vectorized\`
      WHERE agent_id = @agentId
    `;
    
    const options = {
      query: query,
      params: { agentId: agentId }
    };
    
    const [job] = await bigquery.createQueryJob(options);
    const [rows] = await job.getQueryResults();
    
    return rows.length > 0 ? parseInt(rows[0].doc_count as string) : 0;
  } catch (error: any) {
    console.error(`  ❌ Error querying BigQuery for ${agentId}:`, error.message);
    return 0;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║         Rename Agents and Generate Report                   ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  const results: any[] = [];
  
  // Step 1: Gather data for each agent
  console.log('📊 STEP 1: Gathering agent information...\n');
  
  for (const agent of AGENT_RENAMES) {
    console.log(`🔍 Processing: ${agent.id} (${agent.oldName})...`);
    
    // Get current agent data
    const agentDoc = await firestore.collection(COLLECTIONS.CONVERSATIONS).doc(agent.id).get();
    
    if (!agentDoc.exists) {
      console.log(`  ❌ Agent not found: ${agent.id}`);
      results.push({
        ...agent,
        currentName: 'NOT FOUND',
        sharedUsers: 0,
        bqDocuments: 0,
        status: 'ERROR'
      });
      continue;
    }
    
    const agentData = agentDoc.data();
    const currentName = agentData?.title || agentData?.agentName || agentData?.name || 'Unnamed';
    
    console.log(`  ℹ️  Current name: ${currentName}`);
    
    // Get shared users count
    console.log(`  🔍 Checking shared users...`);
    const sharedUsers = await getSharedUsersCount(agent.id);
    console.log(`  ✅ Shared with ${sharedUsers} users`);
    
    // Get BigQuery document count
    console.log(`  🔍 Checking BigQuery documents...`);
    const bqDocuments = await getBigQueryDocumentCount(agent.id);
    console.log(`  ✅ ${bqDocuments} documents in BigQuery`);
    
    results.push({
      ...agent,
      currentName,
      sharedUsers,
      bqDocuments,
      status: 'OK'
    });
    
    console.log(`  ✅ Data collected\n`);
  }
  
  // Step 2: Display table BEFORE renaming
  console.log('\n╔══════════════════════════════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                                  AGENT INFORMATION TABLE                                             ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════════════════════════════╝\n');
  
  console.log('┌─────────────────────┬───────────────────────────────────────┬──────────────────┬─────────────────┬──────────────────────┐');
  console.log('│ Nombre Anterior     │ Nombre Nuevo                          │ ID del Agente    │ Usuarios Comp.  │ Documentos BigQuery  │');
  console.log('├─────────────────────┼───────────────────────────────────────┼──────────────────┼─────────────────┼──────────────────────┤');
  
  results.forEach(result => {
    const oldName = result.currentName.padEnd(19).substring(0, 19);
    const newName = result.newName.padEnd(37).substring(0, 37);
    const agentId = result.id.padEnd(16).substring(0, 16);
    const shared = String(result.sharedUsers).padStart(15);
    const docs = String(result.bqDocuments).padStart(20);
    
    console.log(`│ ${oldName} │ ${newName} │ ${agentId} │ ${shared} │ ${docs} │`);
  });
  
  console.log('└─────────────────────┴───────────────────────────────────────┴──────────────────┴─────────────────┴──────────────────────┘\n');
  
  // Step 3: Perform renames
  console.log('📝 STEP 2: Renaming agents...\n');
  
  for (const result of results) {
    if (result.status !== 'OK') {
      console.log(`⏭️  Skipping ${result.id} (error in data collection)`);
      continue;
    }
    
    console.log(`✏️  Renaming ${result.id}...`);
    console.log(`   From: "${result.currentName}"`);
    console.log(`   To:   "${result.newName}"`);
    
    try {
      await firestore.collection(COLLECTIONS.CONVERSATIONS).doc(result.id).update({
        title: result.newName,
        agentName: result.newName,
        updatedAt: new Date()
      });
      
      console.log(`   ✅ Renamed successfully\n`);
      result.renameStatus = 'SUCCESS';
    } catch (error: any) {
      console.error(`   ❌ Error renaming: ${error.message}\n`);
      result.renameStatus = 'FAILED';
    }
  }
  
  // Step 4: Final summary
  console.log('\n╔══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                                         FINAL SUMMARY                                                                ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝\n');
  
  console.log('┌─────────────────────┬───────────────────────────────────────┬──────────────────┬─────────────────┬──────────────────────┬──────────────┐');
  console.log('│ Nombre Anterior     │ Nombre Nuevo                          │ ID del Agente    │ Usuarios Comp.  │ Documentos BigQuery  │ Estado       │');
  console.log('├─────────────────────┼───────────────────────────────────────┼──────────────────┼─────────────────┼──────────────────────┼──────────────┤');
  
  results.forEach(result => {
    const oldName = result.currentName.padEnd(19).substring(0, 19);
    const newName = result.newName.padEnd(37).substring(0, 37);
    const agentId = result.id.padEnd(16).substring(0, 16);
    const shared = String(result.sharedUsers).padStart(15);
    const docs = String(result.bqDocuments).padStart(20);
    const status = (result.renameStatus || 'N/A').padEnd(12);
    
    console.log(`│ ${oldName} │ ${newName} │ ${agentId} │ ${shared} │ ${docs} │ ${status} │`);
  });
  
  console.log('└─────────────────────┴───────────────────────────────────────┴──────────────────┴─────────────────┴──────────────────────┴──────────────┘\n');
  
  // Success count
  const successCount = results.filter(r => r.renameStatus === 'SUCCESS').length;
  const totalCount = results.length;
  
  console.log(`✅ Successfully renamed: ${successCount}/${totalCount} agents\n`);
  
  // Export data for reference
  const exportData = {
    timestamp: new Date().toISOString(),
    renames: results.map(r => ({
      agentId: r.id,
      oldName: r.currentName,
      newName: r.newName,
      sharedUsersCount: r.sharedUsers,
      bigQueryDocuments: r.bqDocuments,
      renameStatus: r.renameStatus
    }))
  };
  
  console.log('📄 Export data (JSON):');
  console.log(JSON.stringify(exportData, null, 2));
  console.log('\n✨ Done!\n');
}

// Run
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

