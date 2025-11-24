#!/usr/bin/env node

/**
 * Check S002-20251118 Documents Status
 * 
 * Creates a comprehensive table showing:
 * 1. All documents in upload-queue/S002-20251118
 * 2. Assignment status to S2-v2 agent in localhost
 * 3. Assignment status to S2-v2 agent in production
 * 4. Chunks, embeddings, and RAG status
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { BigQuery } from '@google-cloud/bigquery';
import { readdirSync, statSync, readFileSync, writeFileSync } from 'fs';
import { join, basename, extname } from 'path';

// Initialize Firebase (Production - salfagpt)
const PRODUCTION_PROJECT = 'salfagpt';
initializeApp({ projectId: PRODUCTION_PROJECT });
const db = getFirestore();

// Initialize BigQuery
const bigquery = new BigQuery({ projectId: PRODUCTION_PROJECT });

// Constants
const S2V2_AGENT_ID = '1lgr33ywq5qed67sqCYi'; // S2-v2 agent ID
const USER_ID = 'usr_uhwqffaqag1wrryd82tw'; // alec@salfacloud.cl
const UPLOAD_FOLDER = '/Users/alec/salfagpt/upload-queue/S002-20251118';

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
 * Check if document is assigned to S2-v2 via agent_sources
 */
async function checkAgentAssignment(sourceId) {
  try {
    const snapshot = await db.collection('agent_sources')
      .where('agentId', '==', S2V2_AGENT_ID)
      .where('sourceId', '==', sourceId)
      .limit(1)
      .get();
    
    return !snapshot.empty;
  } catch (error) {
    return false;
  }
}

/**
 * Check chunks in BigQuery
 */
async function checkBigQueryChunks(sourceId) {
  try {
    const query = `
      SELECT 
        COUNT(*) as chunk_count,
        COUNTIF(embedding IS NOT NULL) as embedding_count
      FROM \`salfagpt.flow_analytics.document_chunks\`
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
    // Simple test: Check if we have chunks with embeddings
    const query = `
      SELECT COUNT(*) as count
      FROM \`salfagpt.flow_analytics.document_chunks\`
      WHERE source_id = @sourceId
        AND user_id = @userId
        AND embedding IS NOT NULL
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
  console.log('🔍 Scanning S002-20251118 folder...\n');
  
  // 1. Find all documents
  const documents = findAllDocuments(UPLOAD_FOLDER);
  console.log(`✅ Found ${documents.length} documents\n`);
  
  // 2. Check status for each
  console.log('📊 Checking status in Firestore and BigQuery...\n');
  
  const results = [];
  
  for (const doc of documents) {
    process.stdout.write(`  Checking: ${doc.name}...`);
    
    // Check Firestore (localhost uses same production DB for now)
    const firestoreStatus = await checkFirestoreStatus(doc.name);
    
    let assignedToS2v2 = false;
    let chunks = 0;
    let embeddings = 0;
    let canProvideRefs = false;
    
    if (firestoreStatus.exists) {
      // Check assignment
      assignedToS2v2 = await checkAgentAssignment(firestoreStatus.id);
      
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
      assignedToS2v2: firestoreStatus.exists ? assignedToS2v2 : false,
      chunks: chunks,
      embeddings: embeddings,
      canProvideRefs: canProvideRefs,
      metadata: firestoreStatus.metadata
    });
  }
  
  console.log('\n✅ Status check complete!\n');
  
  // 3. Generate markdown table
  generateMarkdownTable(results);
  
  // 4. Generate summary
  generateSummary(results);
  
  // 5. Save to file
  const outputFile = 'S002_STATUS_REPORT.md';
  const markdown = generateCompleteReport(results);
  writeFileSync(outputFile, markdown, 'utf-8');
  console.log(`\n📄 Full report saved to: ${outputFile}\n`);
}

function generateMarkdownTable(results) {
  console.log('## 📋 TABLA COMPLETA DE DOCUMENTOS S002-20251118\n');
  console.log('| # | Documento | Tamaño | Tipo | Firestore | Asignado S2-v2 | Chunks | Embeddings | RAG ✓ |');
  console.log('|---|-----------|--------|------|-----------|----------------|--------|------------|-------|');
  
  results.forEach((r, idx) => {
    const status = {
      firestore: r.inFirestore ? '✅' : '❌',
      assigned: r.assignedToS2v2 ? '✅' : '❌',
      chunks: r.chunks > 0 ? `${r.chunks}` : '❌',
      embeddings: r.embeddings > 0 ? `${r.embeddings}` : '❌',
      rag: r.canProvideRefs ? '✅' : '❌'
    };
    
    console.log(
      `| ${idx + 1} | ${r.fileName} | ${r.fileSize} | ${r.fileType.toUpperCase()} | ` +
      `${status.firestore} | ${status.assigned} | ${status.chunks} | ${status.embeddings} | ${status.rag} |`
    );
  });
}

function generateSummary(results) {
  const total = results.length;
  const inFirestore = results.filter(r => r.inFirestore).length;
  const assigned = results.filter(r => r.assignedToS2v2).length;
  const withChunks = results.filter(r => r.chunks > 0).length;
  const withEmbeddings = results.filter(r => r.embeddings > 0).length;
  const ragReady = results.filter(r => r.canProvideRefs).length;
  
  const totalChunks = results.reduce((sum, r) => sum + r.chunks, 0);
  const totalEmbeddings = results.reduce((sum, r) => sum + r.embeddings, 0);
  const totalChars = results.reduce((sum, r) => sum + r.extractedChars, 0);
  
  console.log('\n## 📊 RESUMEN GENERAL\n');
  console.log('| Métrica | Valor | Porcentaje |');
  console.log('|---------|-------|------------|');
  console.log(`| Total documentos | ${total} | 100% |`);
  console.log(`| En Firestore | ${inFirestore} | ${((inFirestore/total)*100).toFixed(1)}% |`);
  console.log(`| Asignados a S2-v2 | ${assigned} | ${((assigned/total)*100).toFixed(1)}% |`);
  console.log(`| Con chunks | ${withChunks} | ${((withChunks/total)*100).toFixed(1)}% |`);
  console.log(`| Con embeddings | ${withEmbeddings} | ${((withEmbeddings/total)*100).toFixed(1)}% |`);
  console.log(`| RAG-Ready | ${ragReady} | ${((ragReady/total)*100).toFixed(1)}% |`);
  console.log(`| **Total chunks** | **${totalChunks.toLocaleString()}** | - |`);
  console.log(`| **Total embeddings** | **${totalEmbeddings.toLocaleString()}** | - |`);
  console.log(`| **Total caracteres** | **${totalChars.toLocaleString()}** | - |`);
  
  // Missing documents
  const missing = results.filter(r => !r.inFirestore);
  if (missing.length > 0) {
    console.log('\n## ⚠️ DOCUMENTOS FALTANTES\n');
    console.log(`${missing.length} documentos NO encontrados en Firestore:\n`);
    missing.forEach((doc, idx) => {
      console.log(`${idx + 1}. ${doc.fileName} (${doc.fileSize})`);
    });
  }
  
  // Without assignments
  const unassigned = results.filter(r => r.inFirestore && !r.assignedToS2v2);
  if (unassigned.length > 0) {
    console.log('\n## ⚠️ DOCUMENTOS SIN ASIGNAR A S2-v2\n');
    console.log(`${unassigned.length} documentos en Firestore pero NO asignados:\n`);
    unassigned.forEach((doc, idx) => {
      console.log(`${idx + 1}. ${doc.fileName} (ID: ${doc.firestoreId})`);
    });
  }
  
  // Without RAG
  const noRAG = results.filter(r => r.assignedToS2v2 && !r.canProvideRefs);
  if (noRAG.length > 0) {
    console.log('\n## ⚠️ DOCUMENTOS ASIGNADOS PERO SIN RAG\n');
    console.log(`${noRAG.length} documentos asignados pero NO pueden proporcionar referencias:\n`);
    noRAG.forEach((doc, idx) => {
      console.log(`${idx + 1}. ${doc.fileName} - Chunks: ${doc.chunks}, Embeddings: ${doc.embeddings}`);
    });
  }
}

function generateFullReport(results) {
  let md = `# 📊 S002-20251118 Documents Status Report\n\n`;
  md += `**Generated:** ${new Date().toISOString()}\n`;
  md += `**Agent:** S2-v2 (${S2V2_AGENT_ID})\n`;
  md += `**User:** ${USER_ID}\n`;
  md += `**Project:** ${PRODUCTION_PROJECT}\n\n`;
  md += `---\n\n`;
  
  // Summary
  const total = results.length;
  const inFirestore = results.filter(r => r.inFirestore).length;
  const assigned = results.filter(r => r.assignedToS2v2).length;
  const ragReady = results.filter(r => r.canProvideRefs).length;
  const totalChunks = results.reduce((sum, r) => sum + r.chunks, 0);
  const totalEmbeddings = results.reduce((sum, r) => sum + r.embeddings, 0);
  
  md += `## 📊 Resumen Ejecutivo\n\n`;
  md += `| Métrica | Valor | Porcentaje |\n`;
  md += `|---------|-------|------------|\n`;
  md += `| Total documentos | ${total} | 100% |\n`;
  md += `| En Firestore | ${inFirestore} | ${((inFirestore/total)*100).toFixed(1)}% |\n`;
  md += `| Asignados a S2-v2 | ${assigned} | ${((assigned/total)*100).toFixed(1)}% |\n`;
  md += `| RAG-Ready (con refs) | ${ragReady} | ${((ragReady/total)*100).toFixed(1)}% |\n`;
  md += `| **Total chunks** | **${totalChunks.toLocaleString()}** | - |\n`;
  md += `| **Total embeddings** | **${totalEmbeddings.toLocaleString()}** | - |\n\n`;
  
  md += `---\n\n`;
  
  // Full table
  md += `## 📋 Tabla Completa de Documentos\n\n`;
  md += `| # | Documento | Tamaño | Tipo | Firestore | Asignado S2-v2 | Chunks | Embeddings | RAG ✓ |\n`;
  md += `|---|-----------|--------|------|-----------|----------------|--------|------------|-------|\n`;
  
  results.forEach((r, idx) => {
    const status = {
      firestore: r.inFirestore ? '✅' : '❌',
      assigned: r.assignedToS2v2 ? '✅' : (r.inFirestore ? '⚠️' : '❌'),
      chunks: r.chunks > 0 ? r.chunks : '❌',
      embeddings: r.embeddings > 0 ? r.embeddings : '❌',
      rag: r.canProvideRefs ? '✅' : '❌'
    };
    
    md += `| ${idx + 1} | ${r.fileName} | ${r.fileSize} | ${r.fileType.toUpperCase()} | `;
    md += `${status.firestore} | ${status.assigned} | ${status.chunks} | ${status.embeddings} | ${status.rag} |\n`;
  });
  
  md += `\n---\n\n`;
  
  // Categories
  md += `## 📂 Por Categoría\n\n`;
  
  const categories = {
    'Manuales Hiab': results.filter(r => r.fileName.toLowerCase().includes('hiab')),
    'Manuales Scania': results.filter(r => r.fileName.toLowerCase().includes('scania')),
    'Manuales International': results.filter(r => r.fileName.toLowerCase().includes('international')),
    'Manuales Volvo': results.filter(r => r.fileName.toLowerCase().includes('volvo')),
    'Manuales Iveco': results.filter(r => r.fileName.toLowerCase().includes('iveco')),
    'Manuales Ford': results.filter(r => r.fileName.toLowerCase().includes('ford')),
    'Manuales Palfinger': results.filter(r => r.fileName.toLowerCase().includes('palfinger')),
    'Tablas de Carga': results.filter(r => r.fileName.toLowerCase().includes('tabla')),
    'Procedimientos': results.filter(r => r.fileName.toLowerCase().includes('procedimiento') || r.fileName.toLowerCase().includes('man-')),
    'Excel/Word': results.filter(r => r.fileType !== 'pdf'),
    'Otros': results.filter(r => 
      !r.fileName.toLowerCase().includes('hiab') &&
      !r.fileName.toLowerCase().includes('scania') &&
      !r.fileName.toLowerCase().includes('international') &&
      !r.fileName.toLowerCase().includes('volvo') &&
      !r.fileName.toLowerCase().includes('iveco') &&
      !r.fileName.toLowerCase().includes('ford') &&
      !r.fileName.toLowerCase().includes('palfinger') &&
      !r.fileName.toLowerCase().includes('tabla') &&
      !r.fileName.toLowerCase().includes('procedimiento') &&
      r.fileType === 'pdf'
    )
  };
  
  for (const [category, docs] of Object.entries(categories)) {
    if (docs.length > 0) {
      const assigned = docs.filter(d => d.assignedToS2v2).length;
      const ragReady = docs.filter(d => d.canProvideRefs).length;
      
      md += `### ${category} (${docs.length} docs)\n`;
      md += `- Asignados: ${assigned}/${docs.length}\n`;
      md += `- RAG-Ready: ${ragReady}/${docs.length}\n\n`;
    }
  }
  
  md += `---\n\n`;
  
  // Issues
  const missing = results.filter(r => !r.inFirestore);
  const unassigned = results.filter(r => r.inFirestore && !r.assignedToS2v2);
  const noRAG = results.filter(r => r.assignedToS2v2 && !r.canProvideRefs);
  
  if (missing.length > 0 || unassigned.length > 0 || noRAG.length > 0) {
    md += `## ⚠️ Problemas Detectados\n\n`;
    
    if (missing.length > 0) {
      md += `### ${missing.length} documentos faltantes en Firestore\n\n`;
      missing.forEach((doc, idx) => {
        md += `${idx + 1}. \`${doc.fileName}\` (${doc.fileSize})\n`;
      });
      md += `\n`;
    }
    
    if (unassigned.length > 0) {
      md += `### ${unassigned.length} documentos sin asignar a S2-v2\n\n`;
      unassigned.forEach((doc, idx) => {
        md += `${idx + 1}. \`${doc.fileName}\` (ID: \`${doc.firestoreId}\`)\n`;
      });
      md += `\n`;
    }
    
    if (noRAG.length > 0) {
      md += `### ${noRAG.length} documentos sin RAG capability\n\n`;
      noRAG.forEach((doc, idx) => {
        md += `${idx + 1}. \`${doc.fileName}\` - Chunks: ${doc.chunks}, Embeddings: ${doc.embeddings}\n`;
      });
      md += `\n`;
    }
    
    md += `---\n\n`;
  }
  
  // Recommendations
  md += `## 🎯 Recomendaciones\n\n`;
  
  if (missing.length > 0) {
    md += `### 1. Subir documentos faltantes\n\n`;
    md += `\`\`\`bash\n`;
    md += `# Upload all missing documents\n`;
    md += `npm run cli:upload upload-queue/S002-20251118\n`;
    md += `\`\`\`\n\n`;
  }
  
  if (unassigned.length > 0) {
    md += `### 2. Asignar documentos a S2-v2\n\n`;
    md += `\`\`\`bash\n`;
    md += `# Use Context Management dashboard\n`;
    md += `# Or run bulk assignment script\n`;
    md += `npx tsx scripts/assign-all-sources-to-s2v2.mjs\n`;
    md += `\`\`\`\n\n`;
  }
  
  if (noRAG.length > 0) {
    md += `### 3. Procesar chunks y embeddings\n\n`;
    md += `\`\`\`bash\n`;
    md += `# Re-process documents to generate chunks\n`;
    md += `npm run reprocess:chunks\n`;
    md += `\`\`\`\n\n`;
  }
  
  md += `---\n\n`;
  md += `**Generado:** ${new Date().toISOString()}\n`;
  md += `**Script:** \`scripts/check-s002-status.mjs\`\n`;
  
  return md;
}

function generateCompleteReport(results) {
  let report = `# 📊 S002-20251118 Documents Status Report\n\n`;
  report += `**Generated:** ${new Date().toISOString()}\n`;
  report += `**Agent:** S2-v2 (${S2V2_AGENT_ID})\n`;
  report += `**User:** ${USER_ID}\n`;
  report += `**Total Documents:** ${results.length}\n\n`;
  report += `---\n\n`;
  
  // Summary first
  const total = results.length;
  const inFirestore = results.filter(r => r.inFirestore).length;
  const assigned = results.filter(r => r.assignedToS2v2).length;
  const ragReady = results.filter(r => r.canProvideRefs).length;
  const totalChunks = results.reduce((sum, r) => sum + r.chunks, 0);
  const totalEmbeddings = results.reduce((sum, r) => sum + r.embeddings, 0);
  
  report += `## 📊 Resumen General\n\n`;
  report += `| Métrica | Valor | Porcentaje |\n`;
  report += `|---------|-------|------------|\n`;
  report += `| Total documentos | ${total} | 100% |\n`;
  report += `| En Firestore | ${inFirestore} | ${((inFirestore/total)*100).toFixed(1)}% |\n`;
  report += `| Asignados a S2-v2 | ${assigned} | ${((assigned/total)*100).toFixed(1)}% |\n`;
  report += `| RAG-Ready | ${ragReady} | ${((ragReady/total)*100).toFixed(1)}% |\n`;
  report += `| Total chunks | ${totalChunks.toLocaleString()} | - |\n`;
  report += `| Total embeddings | ${totalEmbeddings.toLocaleString()} | - |\n\n`;
  
  report += `---\n\n`;
  
  // Full detailed table
  report += `## 📋 Tabla Detallada\n\n`;
  report += `| # | Documento | Tamaño | Tipo | Firestore | Asignado | Chunks | Embeddings | RAG |\n`;
  report += `|---|-----------|--------|------|-----------|----------|--------|------------|-----|\n`;
  
  results.forEach((r, idx) => {
    report += `| ${idx + 1} | ${r.fileName} | ${r.fileSize} | ${r.fileType.toUpperCase()} | `;
    report += `${r.inFirestore ? '✅' : '❌'} | ${r.assignedToS2v2 ? '✅' : '❌'} | `;
    report += `${r.chunks || '❌'} | ${r.embeddings || '❌'} | ${r.canProvideRefs ? '✅' : '❌'} |\n`;
  });
  
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

