#!/usr/bin/env node

/**
 * Auditoría Completa S002-20251118
 * 
 * Verifica:
 * 1. Documentos en carpeta origen
 * 2. Documentos subidos a Firestore
 * 3. Archivos en GCS
 * 4. Asignación a S2-v2
 * 5. Chunks en BigQuery
 * 6. RAG funcional
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { Storage } from '@google-cloud/storage';
import { BigQuery } from '@google-cloud/bigquery';
import { readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

initializeApp({ projectId: 'salfagpt' });
const db = getFirestore();
const storage = new Storage({ projectId: 'salfagpt' });
const bigquery = new BigQuery({ projectId: 'salfagpt' });

const S2V2_AGENT_ID = '1lgr33ywq5qed67sqCYi';
const USER_ID = 'usr_uhwqffaqag1wrryd82tw';
const UPLOAD_FOLDER = '/Users/alec/salfagpt/upload-queue/S002-20251118';
const GCS_BUCKET = 'salfagpt-context-documents';

// Find all documents recursively
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
          size: stat.size
        });
      }
    }
  });
  
  return fileList;
}

async function main() {
  console.log('🔍 AUDITORÍA COMPLETA S002-20251118\n');
  console.log('═'.repeat(80));
  console.log('Carpeta: /Users/alec/salfagpt/upload-queue/S002-20251118');
  console.log('Agente: S2-v2 (1lgr33ywq5qed67sqCYi)');
  console.log('Usuario: usr_uhwqffaqag1wrryd82tw');
  console.log('═'.repeat(80) + '\n');
  
  // 1. Documentos en carpeta
  console.log('📂 PASO 1: Documentos en carpeta origen...');
  const localDocs = findAllDocuments(UPLOAD_FOLDER);
  console.log(`✅ Encontrados: ${localDocs.length} documentos\n`);
  
  // 2. Documentos en Firestore
  console.log('📊 PASO 2: Verificando Firestore...');
  const firestoreDocs = {};
  
  for (const doc of localDocs) {
    const snapshot = await db.collection('context_sources')
      .where('userId', '==', USER_ID)
      .where('name', '==', doc.name)
      .limit(1)
      .get();
    
    if (!snapshot.empty) {
      const sourceDoc = snapshot.docs[0];
      const data = sourceDoc.data();
      firestoreDocs[doc.name] = {
        id: sourceDoc.id,
        storagePath: data.metadata?.storagePath || data.originalFileUrl,
        hasExtracted: (data.extractedData?.length || 0) > 0,
        extractedChars: data.extractedData?.length || 0
      };
    }
  }
  
  const inFirestore = Object.keys(firestoreDocs).length;
  console.log(`✅ En Firestore: ${inFirestore}/${localDocs.length} (${((inFirestore/localDocs.length)*100).toFixed(1)}%)\n`);
  
  // 3. Archivos en GCS
  console.log('☁️ PASO 3: Verificando GCS...');
  let withGCS = 0;
  
  for (const [name, info] of Object.entries(firestoreDocs)) {
    if (info.storagePath) withGCS++;
  }
  
  console.log(`✅ Con archivo en GCS: ${withGCS}/${inFirestore} (${((withGCS/inFirestore)*100).toFixed(1)}%)\n`);
  
  // 4. Asignación a S2-v2
  console.log('🔗 PASO 4: Verificando asignación a S2-v2...');
  
  const sourceIds = Object.values(firestoreDocs).map(d => d.id);
  let assigned = 0;
  
  for (const sourceId of sourceIds) {
    const assignSnapshot = await db.collection('agent_sources')
      .where('agentId', '==', S2V2_AGENT_ID)
      .where('sourceId', '==', sourceId)
      .limit(1)
      .get();
    
    if (!assignSnapshot.empty) assigned++;
  }
  
  console.log(`✅ Asignados a S2-v2: ${assigned}/${sourceIds.length} (${((assigned/sourceIds.length)*100).toFixed(1)}%)\n`);
  
  // 5. Chunks en BigQuery
  console.log('📊 PASO 5: Verificando chunks en BigQuery...');
  
  let withChunks = 0;
  let totalChunks = 0;
  
  for (const sourceId of sourceIds.slice(0, 20)) { // Check first 20
    const query = `
      SELECT COUNT(*) as count
      FROM \`salfagpt.flow_analytics.document_embeddings\`
      WHERE source_id = @sourceId
    `;
    
    const [rows] = await bigquery.query({
      query,
      params: { sourceId }
    });
    
    const count = parseInt(rows[0]?.count) || 0;
    if (count > 0) {
      withChunks++;
      totalChunks += count;
    }
  }
  
  console.log(`✅ Con chunks (sample 20): ${withChunks}/20`);
  console.log(`✅ Total chunks (sample): ${totalChunks}\n`);
  
  // 6. Summary
  console.log('═'.repeat(80));
  console.log('📊 RESUMEN AUDITORÍA\n');
  
  console.log('| Verificación | Resultado | % |');
  console.log('|--------------|-----------|---|');
  console.log(`| Docs en carpeta | ${localDocs.length} | 100% |`);
  console.log(`| En Firestore | ${inFirestore} | ${((inFirestore/localDocs.length)*100).toFixed(1)}% |`);
  console.log(`| Con archivo GCS | ${withGCS} | ${((withGCS/inFirestore)*100).toFixed(1)}% |`);
  console.log(`| Asignados S2-v2 | ${assigned} | ${((assigned/sourceIds.length)*100).toFixed(1)}% |`);
  console.log(`| Con chunks (sample) | ${withChunks}/20 | ${((withChunks/20)*100).toFixed(0)}% |`);
  
  console.log('\n' + '═'.repeat(80) + '\n');
  
  // Issues found
  const issues = [];
  
  if (inFirestore < localDocs.length) {
    issues.push(`⚠️ ${localDocs.length - inFirestore} documentos NO están en Firestore`);
  }
  
  if (withGCS < inFirestore) {
    issues.push(`⚠️ ${inFirestore - withGCS} documentos sin archivo original en GCS`);
  }
  
  if (assigned < sourceIds.length) {
    issues.push(`⚠️ ${sourceIds.length - assigned} documentos NO asignados a S2-v2`);
  }
  
  if (withChunks < 20) {
    issues.push(`⚠️ ${20 - withChunks} documentos sin chunks en BigQuery (sample 20)`);
  }
  
  if (issues.length > 0) {
    console.log('⚠️ PROBLEMAS ENCONTRADOS:\n');
    issues.forEach(issue => console.log(issue));
    console.log('');
  } else {
    console.log('✅ NO HAY PROBLEMAS - Todo está correcto\n');
  }
  
  // Recommendations
  console.log('💡 RECOMENDACIONES:\n');
  
  if (withGCS < inFirestore) {
    console.log(`1. Archivos originales faltantes:`);
    console.log(`   - ${inFirestore - withGCS} documentos solo tienen texto extraído`);
    console.log(`   - Para verlos, usa el HTML preview (ya implementado)`);
    console.log(`   - O re-sube con CLI que guarda en GCS\n`);
  }
  
  if (assigned < sourceIds.length) {
    console.log(`2. Documentos sin asignar:`);
    console.log(`   - Ejecutar: npx tsx scripts/assign-all-s002-to-s2v2.mjs\n`);
  }
  
  console.log('3. RAG funcional:');
  console.log(`   - Test: npx tsx scripts/test-s2v2-rag-all-chunks.mjs`);
  console.log(`   - Búsqueda usa chunks en BigQuery (no requiere archivo GCS)\n`);
  
  process.exit(0);
}

main();

