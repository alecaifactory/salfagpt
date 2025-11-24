#!/usr/bin/env node

/**
 * Check M003-20251119 Documents Status
 * 
 * Creates a comprehensive table showing:
 * 1. All documents in upload-queue/M003-20251119
 * 2. Assignment status to M3-v2 agent (GOP GPT)
 * 3. Chunks, embeddings, and RAG status
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { BigQuery } from '@google-cloud/bigquery';
import { readdirSync, statSync, writeFileSync } from 'fs';
import { join, basename, extname } from 'path';

// Initialize Firebase (Production - salfagpt)
const PRODUCTION_PROJECT = 'salfagpt';
initializeApp({ projectId: PRODUCTION_PROJECT });
const db = getFirestore();

// Initialize BigQuery
const bigquery = new BigQuery({ projectId: PRODUCTION_PROJECT });

// Constants
const M3V2_AGENT_ID = 'vStojK73ZKbjNsEnqANJ'; // M3-v2 agent ID (GOP GPT)
const USER_ID = 'usr_uhwqffaqag1wrryd82tw'; // alec@salfacloud.cl
const UPLOAD_FOLDER = '/Users/alec/salfagpt/upload-queue/M003-20251119';

/**
 * Recursively find all PDF, XLSX, DOCX files
 */
function findAllDocuments(dir, fileList = []) {
  const files = readdirSync(dir);
  
  files.forEach(file => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);
    
    if (stat.isDirectory()) {
      findAllDocuments(filePath, fileList);
    } else {
      const ext = extname(file).toLowerCase();
      if (['.pdf', '.xlsx', '.docx'].includes(ext)) {
        fileList.push({
          name: file,
          path: filePath,
          size: stat.size,
          type: ext.substring(1), // Remove dot
          relativePath: filePath.replace(UPLOAD_FOLDER, '').replace(/^\//, '')
        });
      }
    }
  });
  
  return fileList;
}

/**
 * Check if document is in Firestore context_sources
 */
async function checkFirestoreStatus(documentName) {
  try {
    const snapshot = await db.collection('context_sources')
      .where('userId', '==', USER_ID)
      .where('name', '==', documentName)
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      return { exists: false };
    }
    
    const doc = snapshot.docs[0];
    const data = doc.data();
    
    return {
      exists: true,
      id: doc.id,
      assignedToAgents: data.assignedToAgents || [],
      extractedDataLength: data.extractedData?.length || 0,
      metadata: data.metadata || {}
    };
  } catch (error) {
    console.error(`Error checking ${documentName}:`, error.message);
    return { exists: false, error: error.message };
  }
}

/**
 * Check if document is assigned to M3-v2 via agent_sources
 */
async function checkAgentAssignment(sourceId) {
  try {
    const snapshot = await db.collection('agent_sources')
      .where('agentId', '==', M3V2_AGENT_ID)
      .where('sourceId', '==', sourceId)
      .limit(1)
      .get();
    
    return !snapshot.empty;
  } catch (error) {
    return false;
  }
}

/**
 * Check chunks in BigQuery (using ACTUAL table: document_embeddings)
 */
async function checkBigQueryChunks(sourceId) {
  try {
    const query = `
      SELECT 
        COUNT(*) as chunk_count,
        COUNTIF(embedding IS NOT NULL AND ARRAY_LENGTH(embedding) = 768) as embedding_count
      FROM \`salfagpt.flow_analytics.document_embeddings\`
      WHERE source_id = @sourceId
        AND user_id = @userId
    `;
    
    const [rows] = await bigquery.query({
      query,
      params: { sourceId, userId: USER_ID }
    });
    
    if (rows.length === 0) {
      return { chunks: 0, embeddings: 0 };
    }
    
    return {
      chunks: parseInt(rows[0].chunk_count) || 0,
      embeddings: parseInt(rows[0].embedding_count) || 0
    };
  } catch (error) {
    return { chunks: 0, embeddings: 0, error: error.message };
  }
}

/**
 * Check if source can provide RAG references
 */
async function checkRAGReferences(sourceId) {
  try {
    const query = `
      SELECT COUNT(*) as count
      FROM \`salfagpt.flow_analytics.document_embeddings\`
      WHERE source_id = @sourceId
        AND user_id = @userId
        AND embedding IS NOT NULL
        AND ARRAY_LENGTH(embedding) = 768
      LIMIT 1
    `;
    
    const [rows] = await bigquery.query({
      query,
      params: { sourceId, userId: USER_ID }
    });
    
    return rows.length > 0 && rows[0].count > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🔍 Scanning M003-20251119 folder...\n');
  
  // 1. Find all documents
  const documents = findAllDocuments(UPLOAD_FOLDER);
  console.log(`✅ Found ${documents.length} documents in folder\n`);
  
  // 2. Check status for each
  console.log('📊 Checking status in Firestore and BigQuery...\n');
  
  const results = [];
  
  for (const doc of documents) {
    process.stdout.write(`  Checking: ${doc.name}...`);
    
    // Check Firestore
    const firestoreStatus = await checkFirestoreStatus(doc.name);
    
    let assignedToM3v2 = false;
    let chunks = 0;
    let embeddings = 0;
    let canProvideRefs = false;
    
    if (firestoreStatus.exists) {
      // Check assignment
      assignedToM3v2 = await checkAgentAssignment(firestoreStatus.id);
      
      // Check BigQuery
      const bqStatus = await checkBigQueryChunks(firestoreStatus.id);
      chunks = bqStatus.chunks;
      embeddings = bqStatus.embeddings;
      
      // Check RAG capability
      canProvideRefs = await checkRAGReferences(firestoreStatus.id);
    }
    
    process.stdout.write(' ✓\n');
    
    results.push({
      fileName: doc.name,
      filePath: doc.relativePath,
      fileSize: `${(doc.size / 1024 / 1024).toFixed(2)} MB`,
      fileType: doc.type,
      inFirestore: firestoreStatus.exists,
      firestoreId: firestoreStatus.id || '',
      extractedChars: firestoreStatus.extractedDataLength || 0,
      assignedToM3v2: firestoreStatus.exists ? assignedToM3v2 : false,
      chunks: chunks,
      embeddings: embeddings,
      canProvideRefs: canProvideRefs,
      metadata: firestoreStatus.metadata
    });
  }
  
  console.log('\n✅ Status check complete!\n');
  
  // 3. Generate summary
  generateSummary(results);
  
  // 4. Save to file
  const outputFile = 'M003_STATUS_REPORT.md';
  const markdown = generateCompleteReport(results);
  writeFileSync(outputFile, markdown, 'utf-8');
  console.log(`\n📄 Full report saved to: ${outputFile}\n`);
}

function generateSummary(results) {
  const total = results.length;
  const inFirestore = results.filter(r => r.inFirestore).length;
  const assigned = results.filter(r => r.assignedToM3v2).length;
  const withChunks = results.filter(r => r.chunks > 0).length;
  const withEmbeddings = results.filter(r => r.embeddings > 0).length;
  const ragReady = results.filter(r => r.canProvideRefs).length;
  
  const totalChunks = results.reduce((sum, r) => sum + r.chunks, 0);
  const totalEmbeddings = results.reduce((sum, r) => sum + r.embeddings, 0);
  const totalChars = results.reduce((sum, r) => sum + r.extractedChars, 0);
  
  console.log('## 📊 RESUMEN M3-v2 (GOP GPT - Procedimientos Edificación)\n');
  console.log('| Métrica | Valor | Porcentaje |');
  console.log('|---------|-------|------------|');
  console.log(`| Total documentos en carpeta | ${total} | 100% |`);
  console.log(`| En Firestore | ${inFirestore} | ${((inFirestore/total)*100).toFixed(1)}% |`);
  console.log(`| Asignados a M3-v2 | ${assigned} | ${((assigned/total)*100).toFixed(1)}% |`);
  console.log(`| Con chunks | ${withChunks} | ${((withChunks/total)*100).toFixed(1)}% |`);
  console.log(`| Con embeddings | ${withEmbeddings} | ${((withEmbeddings/total)*100).toFixed(1)}% |`);
  console.log(`| RAG-Ready | ${ragReady} | ${((ragReady/total)*100).toFixed(1)}% |`);
  console.log(`| **Total chunks** | **${totalChunks.toLocaleString()}** | - |`);
  console.log(`| **Total embeddings** | **${totalEmbeddings.toLocaleString()}** | - |`);
  console.log(`| **Total caracteres** | **${totalChars.toLocaleString()}** | - |`);
  
  // Categorization specific to M003 (GOP - Procedimientos Edificación)
  const categories = {
    'GOP-P (Procedimientos)': results.filter(r => r.fileName.includes('GOP-P-')),
    'GOP-D (Documentos)': results.filter(r => r.fileName.includes('GOP-D-')),
    'MAQ-LOG-CBO (Bodega)': results.filter(r => r.fileName.includes('MAQ-LOG-CBO')),
    'Planificación': results.filter(r => r.fileName.toLowerCase().includes('planificacion')),
    'Entorno Vecinos': results.filter(r => r.fileName.toLowerCase().includes('entorno') || r.fileName.toLowerCase().includes('vecin')),
    'Panel Financiero': results.filter(r => r.fileName.toLowerCase().includes('panel') || r.fileName.toLowerCase().includes('financiero')),
    'Anexos': results.filter(r => r.fileName.toLowerCase().includes('anexo')),
    'Excel/Word': results.filter(r => ['xlsx', 'docx'].includes(r.fileType)),
    'Otros PDFs': results.filter(r => 
      r.fileType === 'pdf' &&
      !r.fileName.includes('GOP-') &&
      !r.fileName.includes('MAQ-') &&
      !r.fileName.toLowerCase().includes('anexo')
    )
  };
  
  console.log('\n## 📂 Por Categoría:\n');
  for (const [category, docs] of Object.entries(categories)) {
    if (docs.length > 0) {
      const assigned = docs.filter(d => d.assignedToM3v2).length;
      const ragReady = docs.filter(d => d.canProvideRefs).length;
      console.log(`**${category}** (${docs.length} docs):`);
      console.log(`  - Asignados: ${assigned}/${docs.length}`);
      console.log(`  - RAG-Ready: ${ragReady}/${docs.length}\n`);
    }
  }
  
  // Issues
  const missing = results.filter(r => !r.inFirestore);
  const unassigned = results.filter(r => r.inFirestore && !r.assignedToM3v2);
  const noRAG = results.filter(r => r.assignedToM3v2 && !r.canProvideRefs);
  
  if (missing.length > 0) {
    console.log(`\n⚠️  ${missing.length} documentos faltantes en Firestore`);
  }
  
  if (unassigned.length > 0) {
    console.log(`⚠️  ${unassigned.length} documentos sin asignar a M3-v2`);
  }
  
  if (noRAG.length > 0) {
    console.log(`⚠️  ${noRAG.length} documentos sin RAG capability`);
  }
}

function generateCompleteReport(results) {
  let report = `# 📊 M003-20251119 Documents Status Report\n\n`;
  report += `**Generated:** ${new Date().toISOString()}\n`;
  report += `**Agent:** M3-v2 GOP GPT (${M3V2_AGENT_ID})\n`;
  report += `**User:** ${USER_ID} (alec@salfacloud.cl)\n`;
  report += `**Total Documents:** ${results.length}\n\n`;
  report += `---\n\n`;
  
  // Summary
  const total = results.length;
  const inFirestore = results.filter(r => r.inFirestore).length;
  const assigned = results.filter(r => r.assignedToM3v2).length;
  const ragReady = results.filter(r => r.canProvideRefs).length;
  const totalChunks = results.reduce((sum, r) => sum + r.chunks, 0);
  const totalEmbeddings = results.reduce((sum, r) => sum + r.embeddings, 0);
  
  report += `## 📊 Resumen Ejecutivo\n\n`;
  report += `| Métrica | Valor | Porcentaje |\n`;
  report += `|---------|-------|------------|\n`;
  report += `| Total documentos | ${total} | 100% |\n`;
  report += `| En Firestore | ${inFirestore} | ${((inFirestore/total)*100).toFixed(1)}% |\n`;
  report += `| Asignados a M3-v2 | ${assigned} | ${((assigned/total)*100).toFixed(1)}% |\n`;
  report += `| RAG-Ready | ${ragReady} | ${((ragReady/total)*100).toFixed(1)}% |\n`;
  report += `| Total chunks | ${totalChunks.toLocaleString()} | - |\n`;
  report += `| Total embeddings | ${totalEmbeddings.toLocaleString()} | - |\n\n`;
  
  report += `---\n\n`;
  
  // Full table
  report += `## 📋 Tabla Completa de Documentos\n\n`;
  report += `| # | Documento | Tamaño | Tipo | Firestore | Asignado M3-v2 | Chunks | Embeddings | RAG ✓ |\n`;
  report += `|---|-----------|--------|------|-----------|----------------|--------|------------|-------|\n`;
  
  results.forEach((r, idx) => {
    const status = {
      firestore: r.inFirestore ? '✅' : '❌',
      assigned: r.assignedToM3v2 ? '✅' : (r.inFirestore ? '⚠️' : '❌'),
      chunks: r.chunks > 0 ? r.chunks : '❌',
      embeddings: r.embeddings > 0 ? r.embeddings : '❌',
      rag: r.canProvideRefs ? '✅' : '❌'
    };
    
    report += `| ${idx + 1} | ${r.fileName} | ${r.fileSize} | ${r.fileType.toUpperCase()} | `;
    report += `${status.firestore} | ${status.assigned} | ${status.chunks} | ${status.embeddings} | ${status.rag} |\n`;
  });
  
  report += `\n---\n\n`;
  
  // By category
  report += `## 📂 Por Categoría\n\n`;
  
  const categories = {
    'GOP-P (Procedimientos)': results.filter(r => r.fileName.includes('GOP-P-')),
    'GOP-D (Documentos)': results.filter(r => r.fileName.includes('GOP-D-')),
    'MAQ-LOG-CBO (Bodega)': results.filter(r => r.fileName.includes('MAQ-LOG-CBO')),
    'Planificación': results.filter(r => r.fileName.toLowerCase().includes('planificacion')),
    'Entorno Vecinos': results.filter(r => r.fileName.toLowerCase().includes('entorno') || r.fileName.toLowerCase().includes('vecin')),
    'Panel Financiero': results.filter(r => r.fileName.toLowerCase().includes('panel') || r.fileName.toLowerCase().includes('financiero')),
    'Anexos': results.filter(r => r.fileName.toLowerCase().includes('anexo')),
    'Excel/Word': results.filter(r => ['xlsx', 'docx'].includes(r.fileType)),
    'Otros PDFs': results.filter(r => 
      r.fileType === 'pdf' &&
      !r.fileName.includes('GOP-') &&
      !r.fileName.includes('MAQ-') &&
      !r.fileName.toLowerCase().includes('anexo')
    )
  };
  
  for (const [category, docs] of Object.entries(categories)) {
    if (docs.length > 0) {
      const assigned = docs.filter(d => d.assignedToM3v2).length;
      const ragReady = docs.filter(d => d.canProvideRefs).length;
      
      report += `### ${category} (${docs.length} docs)\n`;
      report += `- En Firestore: ${docs.filter(d => d.inFirestore).length}/${docs.length}\n`;
      report += `- Asignados: ${assigned}/${docs.length}\n`;
      report += `- RAG-Ready: ${ragReady}/${docs.length}\n\n`;
    }
  }
  
  report += `---\n\n`;
  
  // Issues
  const missing = results.filter(r => !r.inFirestore);
  const unassigned = results.filter(r => r.inFirestore && !r.assignedToM3v2);
  const noRAG = results.filter(r => r.assignedToM3v2 && !r.canProvideRefs);
  
  if (missing.length > 0 || unassigned.length > 0 || noRAG.length > 0) {
    report += `## ⚠️ Acciones Requeridas\n\n`;
    
    if (missing.length > 0) {
      report += `### ${missing.length} documentos faltantes en Firestore\n\n`;
      missing.forEach((doc, idx) => {
        report += `${idx + 1}. \`${doc.fileName}\` (${doc.fileSize})\n`;
      });
      report += `\n**Acción:** Subir con CLI o webapp\n\n`;
    }
    
    if (unassigned.length > 0) {
      report += `### ${unassigned.length} documentos sin asignar a M3-v2\n\n`;
      unassigned.forEach((doc, idx) => {
        report += `${idx + 1}. \`${doc.fileName}\` (ID: \`${doc.firestoreId}\`)\n`;
      });
      report += `\n**Acción:** Ejecutar \`assign-all-m003-to-m3v2.mjs\`\n\n`;
    }
    
    if (noRAG.length > 0) {
      report += `### ${noRAG.length} documentos sin chunks/embeddings\n\n`;
      noRAG.forEach((doc, idx) => {
        report += `${idx + 1}. \`${doc.fileName}\` - Chunks: ${doc.chunks}, Embeddings: ${doc.embeddings}\n`;
      });
      report += `\n**Acción:** Ejecutar \`process-m3v2-chunks.mjs\`\n\n`;
    }
  } else {
    report += `## ✅ Estado Óptimo\n\n`;
    report += `Todos los documentos están:\n`;
    report += `- ✅ En Firestore\n`;
    report += `- ✅ Asignados a M3-v2\n`;
    report += `- ✅ Con chunks y embeddings en BigQuery\n`;
    report += `- ✅ RAG-Ready para búsqueda semántica\n\n`;
  }
  
  report += `---\n\n`;
  report += `**Generado:** ${new Date().toISOString()}\n`;
  report += `**Script:** \`scripts/check-m003-status.mjs\`\n`;
  report += `**Agent ID:** ${M3V2_AGENT_ID}\n`;
  
  return report;
}

// Run
main()
  .then(() => {
    console.log('✅ Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });

