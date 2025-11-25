#!/usr/bin/env node

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { BigQuery } from '@google-cloud/bigquery';
import { readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

initializeApp({ projectId: 'salfagpt' });
const db = getFirestore();
const bq = new BigQuery({ projectId: 'salfagpt' });

const S2V2_ID = '1lgr33ywq5qed67sqCYi';
const USER_ID = 'usr_uhwqffaqag1wrryd82tw';
const FOLDER = '/Users/alec/salfagpt/upload-queue/S002-20251118';

function findDocs(dir, list = []) {
  const files = readdirSync(dir);
  files.forEach(file => {
    const path = join(dir, file);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      findDocs(path, list);
    } else if (['.pdf', '.xlsx', '.docx'].includes(extname(file).toLowerCase())) {
      list.push(file);
    }
  });
  return list;
}

async function audit() {
  console.log('🔍 AUDITORÍA S002-20251118\n');
  console.log('Agente: Maqsa Mantenimiento (S2-v2)');
  console.log('ID: 1lgr33ywq5qed67sqCYi\n');
  
  // 1. Carpeta
  const localDocs = findDocs(FOLDER);
  console.log(`📂 Carpeta: ${localDocs.length} docs\n`);
  
  // 2. Firestore
  const snapshot = await db.collection('context_sources')
    .where('userId', '==', USER_ID)
    .get();
  
  const allSources = snapshot.docs.map(d => ({
    id: d.id,
    name: d.data().name,
    hasGCS: !!(d.data().metadata?.storagePath || d.data().originalFileUrl),
    extracted: (d.data().extractedData?.length || 0) > 0
  }));
  
  const s002Docs = allSources.filter(s => 
    localDocs.some(local => local === s.name)
  );
  
  console.log(`📊 Firestore: ${s002Docs.length}/${localDocs.length} (${((s002Docs.length/localDocs.length)*100).toFixed(1)}%)`);
  console.log(`   Con GCS: ${s002Docs.filter(d => d.hasGCS).length}`);
  console.log(`   Con texto: ${s002Docs.filter(d => d.extracted).length}\n`);
  
  // 3. Asignación
  const assignSnapshot = await db.collection('agent_sources')
    .where('agentId', '==', S2V2_ID)
    .get();
  
  const assignedIds = new Set(assignSnapshot.docs.map(d => d.data().sourceId));
  const s002Assigned = s002Docs.filter(d => assignedIds.has(d.id));
  
  console.log(`🔗 Asignados S2-v2: ${s002Assigned.length}/${s002Docs.length} (${((s002Assigned.length/s002Docs.length)*100).toFixed(1)}%)\n`);
  
  // 4. Chunks BigQuery
  const query = `
    SELECT 
      source_id,
      COUNT(*) as chunks
    FROM \`salfagpt.flow_analytics.document_embeddings\`
    WHERE user_id = @userId
      AND source_id IN UNNEST(@sourceIds)
    GROUP BY source_id
  `;
  
  const sourceIds = s002Docs.map(d => d.id);
  const [rows] = await bq.query({
    query,
    params: { userId: USER_ID, sourceIds }
  });
  
  const chunksMap = new Map(rows.map(r => [r.source_id, parseInt(r.chunks)]));
  const withChunks = s002Docs.filter(d => chunksMap.has(d.id));
  const totalChunks = Array.from(chunksMap.values()).reduce((a, b) => a + b, 0);
  
  console.log(`📊 BigQuery: ${withChunks.length}/${s002Docs.length} con chunks`);
  console.log(`   Total chunks: ${totalChunks}\n`);
  
  // Summary
  console.log('═'.repeat(80));
  console.log('📊 RESUMEN\n');
  console.log(`✅ Carpeta origen: ${localDocs.length} docs`);
  console.log(`✅ En Firestore: ${s002Docs.length} (${((s002Docs.length/localDocs.length)*100).toFixed(1)}%)`);
  console.log(`✅ Con archivo GCS: ${s002Docs.filter(d => d.hasGCS).length} (${((s002Docs.filter(d => d.hasGCS).length/s002Docs.length)*100).toFixed(1)}%)`);
  console.log(`✅ Asignados S2-v2: ${s002Assigned.length} (${((s002Assigned.length/s002Docs.length)*100).toFixed(1)}%)`);
  console.log(`✅ Con chunks BigQuery: ${withChunks.length} (${((withChunks.length/s002Docs.length)*100).toFixed(1)}%)`);
  console.log(`✅ Total chunks: ${totalChunks}`);
  console.log('═'.repeat(80) + '\n');
  
  // Issues
  if (s002Docs.length < localDocs.length) {
    console.log(`⚠️ Faltantes: ${localDocs.length - s002Docs.length} docs`);
  }
  
  if (s002Assigned.length < s002Docs.length) {
    console.log(`⚠️ Sin asignar: ${s002Docs.length - s002Assigned.length} docs`);
  }
  
  if (withChunks.length < s002Docs.length) {
    console.log(`⚠️ Sin chunks: ${s002Docs.length - withChunks.length} docs`);
  }
  
  console.log('\n✅ Auditoría completa');
  
  process.exit(0);
}

audit();

