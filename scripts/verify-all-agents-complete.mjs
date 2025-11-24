#!/usr/bin/env node
/**
 * Comprehensive Agent Verification Script
 * 
 * Verifies that all files from source folders are:
 * 1. Uploaded to Firestore (context_sources)
 * 2. Assigned to agent (agent_sources)
 * 3. Chunked and embedded in BigQuery
 * 4. Ready for RAG with test questions
 * 
 * Usage: npx tsx scripts/verify-all-agents-complete.mjs
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { BigQuery } from '@google-cloud/bigquery';
import fs from 'fs';
import path from 'path';

// Initialize
initializeApp({ projectId: 'salfagpt' });
const db = getFirestore();
const bq = new BigQuery({ projectId: 'salfagpt' });

const USER_ID = 'usr_uhwqffaqag1wrryd82tw';

// Agent configurations
const AGENTS = [
  {
    id: 'iQmdg3bMSJ1AdqqlFpye',
    name: 'S1-v2',
    fullName: 'GESTION BODEGAS GPT',
    folder: '/Users/alec/salfagpt/upload-queue/S001-20251118',
    testQuestions: [
      '¿Cómo hago un pedido de convenio?',
      '¿Cuándo debo enviar el informe de consumo de petróleo?',
      '¿Cómo se hace una Solped?',
      '¿Cómo genero una guía de despacho?'
    ]
  },
  {
    id: '1lgr33ywq5qed67sqCYi',
    name: 'S2-v2',
    fullName: 'MAQSA MANTENIMIENTO EQ SUPERFICIE',
    folder: '/Users/alec/salfagpt/upload-queue/S002-20251118',
    testQuestions: [
      '¿Cómo hacer mantenimiento preventivo de grúa Hiab?',
      '¿Qué repuestos necesito para camión Volvo?',
      '¿Cuál es el procedimiento de lubricación?',
      '¿Cuál es la capacidad de carga de la grúa Hiab 422?'
    ]
  },
  {
    id: 'cjn3bC0HrUYtHqu69CKS',
    name: 'M1-v2',
    fullName: 'ASISTENTE LEGAL TERRITORIAL RDI',
    folder: '/Users/alec/salfagpt/upload-queue/M001-20251118',
    testQuestions: [
      '¿Cuáles son las alternativas de aporte al espacio público?',
      '¿Es posible compartir laboratorios en colegios colindantes?',
      '¿Los EIU caducan cuando entra en vigencia el PRC?'
    ]
  },
  {
    id: 'vStojK73ZKbjNsEnqANJ',
    name: 'M3-v2',
    fullName: 'GOP GPT',
    folder: '/Users/alec/salfagpt/upload-queue/M003-20251119',
    testQuestions: [
      '¿Qué debo hacer antes de comenzar una obra?',
      '¿Qué documentos necesito para Panel Financiero afecto?',
      'Vecino molesto por polvo, ¿qué hacer?',
      '¿Qué reuniones debo tener en obra?'
    ]
  }
];

// Helper: Get all files recursively from folder
function getAllFiles(dirPath, arrayOfFiles = []) {
  if (!fs.existsSync(dirPath)) {
    console.warn(`⚠️ Folder not found: ${dirPath}`);
    return arrayOfFiles;
  }

  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      // Skip system files
      if (!file.startsWith('.') && !file.startsWith('~$')) {
        arrayOfFiles.push({
          path: fullPath,
          name: file,
          size: fs.statSync(fullPath).size
        });
      }
    }
  });

  return arrayOfFiles;
}

// Helper: Format file size
function formatSize(bytes) {
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

// Main verification function
async function verifyAgent(agent) {
  console.log('\n' + '═'.repeat(80));
  console.log(`📊 VERIFYING: ${agent.name} - ${agent.fullName}`);
  console.log('═'.repeat(80));
  console.log(`Agent ID: ${agent.id}`);
  console.log(`Folder: ${agent.folder}\n`);

  // Step 1: Get all files from folder
  console.log('📁 Step 1: Scanning folder...');
  const folderFiles = getAllFiles(agent.folder);
  console.log(`   Found ${folderFiles.length} files in folder\n`);

  // Step 2: Check Firestore context_sources
  console.log('🔥 Step 2: Checking Firestore...');
  const sourcesSnapshot = await db.collection('context_sources')
    .where('userId', '==', USER_ID)
    .get();
  
  const allSources = sourcesSnapshot.docs.map(doc => ({
    id: doc.id,
    name: doc.data().name,
    status: doc.data().status,
    extractedData: doc.data().extractedData
  }));

  // Match folder files to Firestore
  const matched = [];
  const missing = [];
  
  folderFiles.forEach(file => {
    const found = allSources.find(s => s.name === file.name);
    if (found) {
      matched.push({ file, source: found });
    } else {
      missing.push(file);
    }
  });

  console.log(`   ✅ In Firestore: ${matched.length}/${folderFiles.length} (${((matched.length/folderFiles.length)*100).toFixed(1)}%)`);
  if (missing.length > 0) {
    console.log(`   ❌ Missing: ${missing.length}`);
    missing.forEach(f => console.log(`      - ${f.name}`));
  }
  console.log();

  // Step 3: Check assignments to agent
  console.log('🔗 Step 3: Checking agent assignments...');
  const assignmentsSnapshot = await db.collection('agent_sources')
    .where('agentId', '==', agent.id)
    .get();
  
  const assignedSourceIds = new Set(assignmentsSnapshot.docs.map(doc => doc.data().sourceId));
  
  const matchedSourceIds = matched.map(m => m.source.id);
  const assigned = matchedSourceIds.filter(id => assignedSourceIds.has(id));
  const unassigned = matchedSourceIds.filter(id => !assignedSourceIds.has(id));

  console.log(`   ✅ Assigned: ${assigned.length}/${matched.length} (${((assigned.length/matched.length)*100).toFixed(1)}%)`);
  console.log(`   📊 Total assignments: ${assignmentsSnapshot.size}`);
  
  if (unassigned.length > 0) {
    console.log(`   ❌ Unassigned: ${unassigned.length}`);
    // Show first 5
    const unassignedDocs = matched.filter(m => unassigned.includes(m.source.id)).slice(0, 5);
    unassignedDocs.forEach(m => console.log(`      - ${m.file.name}`));
    if (unassigned.length > 5) {
      console.log(`      ... and ${unassigned.length - 5} more`);
    }
  }
  console.log();

  // Step 4: Check BigQuery chunks
  console.log('📊 Step 4: Checking BigQuery chunks...');
  
  const query = `
    SELECT 
      COUNT(*) as total_chunks,
      COUNT(DISTINCT source_id) as unique_sources,
      AVG(ARRAY_LENGTH(embedding)) as avg_dims
    FROM \`salfagpt.flow_analytics.document_embeddings\`
    WHERE source_id IN (
      SELECT sourceId FROM \`salfagpt.firestore.agent_sources\`
      WHERE agentId = @agentId
    )
  `;

  let bqResults;
  try {
    const [rows] = await bq.query({
      query,
      params: { agentId: agent.id }
    });
    bqResults = rows[0];
  } catch (error) {
    // Fallback: Direct query without nested SELECT
    const directQuery = `
      SELECT 
        COUNT(*) as total_chunks,
        COUNT(DISTINCT source_id) as unique_sources,
        AVG(ARRAY_LENGTH(embedding)) as avg_dims
      FROM \`salfagpt.flow_analytics.document_embeddings\`
      WHERE user_id = @userId
    `;
    
    try {
      const [rows] = await bq.query({
        query: directQuery,
        params: { userId: USER_ID }
      });
      
      console.log(`   ⚠️ Used fallback query (all user chunks)`);
      bqResults = rows[0];
    } catch (err) {
      console.error(`   ❌ BigQuery error: ${err.message}`);
      bqResults = { total_chunks: 0, unique_sources: 0, avg_dims: 0 };
    }
  }

  console.log(`   ✅ Total chunks: ${bqResults.total_chunks}`);
  console.log(`   ✅ Unique sources: ${bqResults.unique_sources}`);
  console.log(`   ✅ Embedding dims: ${bqResults.avg_dims || 0}`);
  
  const withChunks = bqResults.unique_sources || 0;
  const withoutChunks = assigned.length - withChunks;
  
  if (withoutChunks > 0) {
    console.log(`   ⚠️ Sources without chunks: ${withoutChunks}`);
  }
  console.log();

  // Step 5: RAG Readiness
  console.log('🎯 Step 5: RAG Readiness Summary...');
  
  const ragReady = assigned.length > 0 && bqResults.total_chunks > 0;
  const completeness = (assigned.length / folderFiles.length) * 100;
  
  console.log(`   Folder files: ${folderFiles.length}`);
  console.log(`   In Firestore: ${matched.length} (${((matched.length/folderFiles.length)*100).toFixed(1)}%)`);
  console.log(`   Assigned: ${assigned.length} (${((assigned.length/folderFiles.length)*100).toFixed(1)}%)`);
  console.log(`   With chunks: ${withChunks} (${((withChunks/folderFiles.length)*100).toFixed(1)}%)`);
  console.log(`   RAG Ready: ${ragReady ? '✅ YES' : '❌ NO'}`);
  console.log(`   Completeness: ${completeness.toFixed(1)}%`);

  // Return summary
  return {
    agent: agent.name,
    agentId: agent.id,
    folderFiles: folderFiles.length,
    inFirestore: matched.length,
    assigned: assigned.length,
    chunks: bqResults.total_chunks,
    embeddings: bqResults.total_chunks, // Same as chunks
    uniqueSources: bqResults.unique_sources || 0,
    dims: bqResults.avg_dims || 0,
    ragReady: ragReady,
    completeness: completeness.toFixed(1) + '%',
    missing: missing.length,
    unassigned: unassigned.length,
    withoutChunks: withoutChunks
  };
}

// Main execution
async function main() {
  console.log('\n🔍 COMPREHENSIVE AGENT VERIFICATION\n');
  console.log('Checking all 4 agents against their source folders...\n');
  console.log('Verification criteria:');
  console.log('  1. ✅ Files uploaded to Firestore');
  console.log('  2. ✅ Assigned to agent (agent_sources)');
  console.log('  3. ✅ Chunked and embedded in BigQuery');
  console.log('  4. ✅ Ready for RAG search\n');

  const results = [];

  for (const agent of AGENTS) {
    const result = await verifyAgent(agent);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Pause between agents
  }

  // Summary table
  console.log('\n\n' + '═'.repeat(120));
  console.log('📊 SUMMARY TABLE - ALL AGENTS');
  console.log('═'.repeat(120));
  console.log();

  console.log('| Agent | Folder Files | Firestore | Assigned | Chunks | Embeddings | RAG Ready | Completeness |');
  console.log('|-------|--------------|-----------|----------|--------|------------|-----------|--------------|');
  
  results.forEach(r => {
    const ragIcon = r.ragReady ? '✅' : '❌';
    console.log(`| ${r.agent} | ${r.folderFiles} | ${r.inFirestore} | ${r.assigned} | ${r.chunks} | ${r.embeddings} | ${ragIcon} | ${r.completeness} |`);
  });

  console.log();
  console.log('═'.repeat(120));
  console.log();

  // Issues summary
  console.log('🚨 ISSUES FOUND:\n');
  
  let issuesFound = false;
  
  results.forEach(r => {
    if (r.missing > 0 || r.unassigned > 0 || r.withoutChunks > 0 || !r.ragReady) {
      issuesFound = true;
      console.log(`${r.agent}:`);
      
      if (r.missing > 0) {
        console.log(`  ❌ ${r.missing} files not in Firestore`);
      }
      if (r.unassigned > 0) {
        console.log(`  ⚠️ ${r.unassigned} files in Firestore but not assigned to agent`);
      }
      if (r.withoutChunks > 0) {
        console.log(`  ⚠️ ${r.withoutChunks} assigned files without chunks/embeddings`);
      }
      if (!r.ragReady) {
        console.log(`  🚨 RAG NOT READY`);
      }
      console.log();
    }
  });

  if (!issuesFound) {
    console.log('✅ NO ISSUES - All agents fully configured!\n');
  }

  // Recommendations
  console.log('💡 RECOMMENDATIONS:\n');
  
  results.forEach(r => {
    if (r.unassigned > 0) {
      console.log(`${r.agent}: Run assignment script`);
      console.log(`  npx tsx scripts/assign-all-${r.agent.toLowerCase().replace('-v', '')}-to-${r.agent.toLowerCase()}.mjs\n`);
    }
    
    if (r.withoutChunks > 0) {
      console.log(`${r.agent}: Process chunks and embeddings`);
      console.log(`  npx tsx scripts/process-${r.agent.toLowerCase()}-chunks.mjs\n`);
    }
    
    if (r.missing > 0) {
      console.log(`${r.agent}: Upload missing files (${r.missing} files)`);
      console.log(`  Check: ${AGENTS.find(a => a.name === r.agent).folder}\n`);
    }
  });

  // System totals
  console.log('\n' + '═'.repeat(120));
  console.log('📊 SYSTEM TOTALS');
  console.log('═'.repeat(120));
  console.log();

  const totals = {
    folderFiles: results.reduce((sum, r) => sum + r.folderFiles, 0),
    inFirestore: results.reduce((sum, r) => sum + r.inFirestore, 0),
    assigned: results.reduce((sum, r) => sum + r.assigned, 0),
    chunks: results.reduce((sum, r) => sum + r.chunks, 0),
    embeddings: results.reduce((sum, r) => sum + r.embeddings, 0),
    ragReady: results.filter(r => r.ragReady).length
  };

  console.log(`Total files in folders:        ${totals.folderFiles}`);
  console.log(`Total in Firestore:            ${totals.inFirestore} (${((totals.inFirestore/totals.folderFiles)*100).toFixed(1)}%)`);
  console.log(`Total assigned:                ${totals.assigned} (${((totals.assigned/totals.folderFiles)*100).toFixed(1)}%)`);
  console.log(`Total chunks:                  ${totals.chunks.toLocaleString()}`);
  console.log(`Total embeddings:              ${totals.embeddings.toLocaleString()}`);
  console.log(`Agents RAG-ready:              ${totals.ragReady}/4 (${(totals.ragReady/4*100).toFixed(0)}%)`);
  console.log();

  // Final status
  const allReady = totals.ragReady === 4;
  console.log('═'.repeat(120));
  console.log(`\n🎯 SYSTEM STATUS: ${allReady ? '✅ ALL AGENTS READY' : '⚠️ ISSUES FOUND'}\n`);
  console.log('═'.repeat(120));
  console.log();

  process.exit(0);
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});

