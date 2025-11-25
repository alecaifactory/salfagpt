#!/usr/bin/env node

/**
 * Auditoría completa de 4 agentes en nueva arquitectura us-east4
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { BigQuery } from '@google-cloud/bigquery';
import { Storage } from '@google-cloud/storage';
import { readdirSync, statSync, existsSync } from 'fs';
import { join, extname } from 'path';

initializeApp({ projectId: 'salfagpt' });
const db = getFirestore();
const bq = new BigQuery({ projectId: 'salfagpt' });
const storage = new Storage({ projectId: 'salfagpt' });

const AGENTS = [
  {
    name: 'S1-v2',
    title: 'Gestión Bodegas',
    agentId: 'iQmdg3bMSJ1AdqqlFpye',
    folder: '/Users/alec/salfagpt/upload-queue/S001-20251118'
  },
  {
    name: 'S2-v2',
    title: 'Maqsa Mantenimiento',
    agentId: '1lgr33ywq5qed67sqCYi',
    folder: '/Users/alec/salfagpt/upload-queue/S002-20251118'
  },
  {
    name: 'M1-v2',
    title: 'Asistente Legal Territorial RDI',
    agentId: 'EgXezLcu4O3IUqFUJhUZ',
    folder: '/Users/alec/salfagpt/upload-queue/M001-20251118'
  },
  {
    name: 'M3-v2',
    title: 'GOP GPT',
    agentId: 'vStojK73ZKbjNsEnqANJ',
    folder: '/Users/alec/salfagpt/upload-queue/M003-20251119'
  }
];

const USER_ID = 'usr_uhwqffaqag1wrryd82tw';

function findDocs(dir) {
  if (!existsSync(dir)) {
    console.log(\`   ⚠️ Carpeta no existe: \${dir}\`);
    return [];
  }
  
  const docs = [];
  
  function scan(path) {
    const files = readdirSync(path);
    files.forEach(file => {
      const fullPath = join(path, file);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        scan(fullPath);
      } else if (['.pdf', '.xlsx', '.docx'].includes(extname(file).toLowerCase())) {
        docs.push(file);
      }
    });
  }
  
  scan(dir);
  return docs;
}

async function auditAgent(agent) {
  console.log(\`\n${'═'.repeat(80)}\`);
  console.log(\`\${agent.name}: \${agent.title}\`);
  console.log(\`Agent ID: \${agent.agentId}\`);
  console.log(\`Carpeta: \${agent.folder}\`);
  console.log('═'.repeat(80) + '\n');
  
  // 1. Archivos en carpeta
  const localDocs = findDocs(agent.folder);
  console.log(\`📂 CARPETA ORIGEN:\`);
  console.log(\`   Archivos: \${localDocs.length}\`);
  
  if (localDocs.length === 0) {
    console.log('   ⚠️ No hay archivos en carpeta\n');
    return {
      agent: agent.name,
      local: 0,
      firestore: 0,
      gcsEast4: 0,
      bqEast4: 0,
      assigned: 0
    };
  }
  
  // 2. Documentos en Firestore
  const firestoreDocs = [];
  
  for (const docName of localDocs) {
    const snapshot = await db.collection('context_sources')
      .where('userId', '==', USER_ID)
      .where('name', '==', docName)
      .limit(1)
      .get();
    
    if (!snapshot.empty) {
      const data = snapshot.docs[0].data();
      firestoreDocs.push({
        id: snapshot.docs[0].id,
        name: docName,
        storagePath: data.metadata?.storagePath || data.originalFileUrl
      });
    }
  }
  
  console.log(\`\n📊 FIRESTORE:\`);
  console.log(\`   Docs encontrados: \${firestoreDocs.length}/\${localDocs.length} (\${((firestoreDocs.length/localDocs.length)*100).toFixed(1)}%)\`);
  
  // 3. Archivos en GCS us-east4
  let gcsCount = 0;
  
  for (const doc of firestoreDocs) {
    if (doc.storagePath) {
      // Check if exists in east4 bucket
      try {
        const path = doc.storagePath.replace('gs://salfagpt-context-documents/', '');
        const bucket = storage.bucket('salfagpt-context-documents-east4');
        const [exists] = await bucket.file(path).exists();
        if (exists) gcsCount++;
      } catch (e) {}
    }
  }
  
  console.log(\`\n☁️ CLOUD STORAGE (us-east4):\`);
  console.log(\`   Archivos en GCS: \${gcsCount}/\${firestoreDocs.length} (\${((gcsCount/firestoreDocs.length)*100).toFixed(1)}%)\`);
  
  // 4. Asignación al agente
  const assignSnapshot = await db.collection('agent_sources')
    .where('agentId', '==', agent.agentId)
    .get();
  
  const assignedIds = new Set(assignSnapshot.docs.map(d => d.data().sourceId));
  const assignedDocs = firestoreDocs.filter(d => assignedIds.has(d.id));
  
  console.log(\`\n🔗 ASIGNACIÓN AL AGENTE:\`);
  console.log(\`   Asignados: \${assignedDocs.length}/\${firestoreDocs.length} (\${((assignedDocs.length/firestoreDocs.length)*100).toFixed(1)}%)\`);
  
  // 5. Chunks en BigQuery us-east4
  const sourceIds = firestoreDocs.map(d => d.id);
  
  if (sourceIds.length > 0) {
    const query = \`
      SELECT COUNT(*) as count
      FROM \\\`salfagpt.flow_analytics_east4.document_embeddings\\\`
      WHERE user_id = @userId
        AND source_id IN UNNEST(@sourceIds)
    \`;
    
    const [rows] = await bq.query({
      query,
      params: { userId: USER_ID, sourceIds },
      location: 'us-east4'
    });
    
    const bqCount = parseInt(rows[0].count);
    
    console.log(\`\n📊 BIGQUERY (us-east4):\`);
    console.log(\`   Chunks indexados: \${bqCount.toLocaleString()}\`);
  }
  
  // Summary
  console.log(\`\n✅ RESUMEN:\`);
  console.log(\`   Carpeta: \${localDocs.length} archivos\`);
  console.log(\`   Firestore: \${firestoreDocs.length} (\${((firestoreDocs.length/localDocs.length)*100).toFixed(1)}%)\`);
  console.log(\`   GCS us-east4: \${gcsCount} (\${((gcsCount/firestoreDocs.length)*100).toFixed(1)}%)\`);
  console.log(\`   Asignados: \${assignedDocs.length} (\${((assignedDocs.length/firestoreDocs.length)*100).toFixed(1)}%)\`);
  
  return {
    agent: agent.name,
    local: localDocs.length,
    firestore: firestoreDocs.length,
    gcsEast4: gcsCount,
    assigned: assignedDocs.length
  };
}

async function main() {
  console.log('\n🔍 AUDITORÍA COMPLETA - ARQUITECTURA US-EAST4\n');
  console.log('Verificando 4 agentes en nueva infraestructura...\n');
  
  const results = [];
  
  for (const agent of AGENTS) {
    const result = await auditAgent(agent);
    results.push(result);
  }
  
  // Final summary table
  console.log(\`\n\n${'═'.repeat(80)}\`);
  console.log('📊 RESUMEN FINAL - TODOS LOS AGENTES\n');
  console.log('| Agente | Carpeta | Firestore | GCS us-east4 | Asignados |');
  console.log('|--------|---------|-----------|--------------|-----------|');
  
  results.forEach(r => {
    console.log(\`| \${r.agent} | \${r.local} | \${r.firestore} | \${r.gcsEast4} | \${r.assigned} |\`);
  });
  
  console.log(\`\n${'═'.repeat(80)}\`);
  
  const totals = results.reduce((acc, r) => ({
    local: acc.local + r.local,
    firestore: acc.firestore + r.firestore,
    gcsEast4: acc.gcsEast4 + r.gcsEast4,
    assigned: acc.assigned + r.assigned
  }), { local: 0, firestore: 0, gcsEast4: 0, assigned: 0 });
  
  console.log(\`\nTOTALES:\`);
  console.log(\`  Archivos origen: \${totals.local}\`);
  console.log(\`  En Firestore: \${totals.firestore} (\${((totals.firestore/totals.local)*100).toFixed(1)}%)\`);
  console.log(\`  En GCS us-east4: \${totals.gcsEast4} (\${((totals.gcsEast4/totals.firestore)*100).toFixed(1)}%)\`);
  console.log(\`  Asignados: \${totals.assigned} (\${((totals.assigned/totals.firestore)*100).toFixed(1)}%)\`);
  console.log('');
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });

