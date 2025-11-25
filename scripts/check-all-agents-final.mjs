#!/usr/bin/env node

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({ projectId: 'salfagpt' });
const db = getFirestore();

const AGENTS = {
  'S1-v2': 'iQmdg3bMSJ1AdqqlFpye',
  'S2-v2': '1lgr33ywq5qed67sqCYi',
  'M1-v2': 'EgXezLcu4O3IUqFUJhUZ',
  'M3-v2': 'vStojK73ZKbjNsEnqANJ'
};

async function checkAgent(name, agentId) {
  const assignSnapshot = await db.collection('agent_sources')
    .where('agentId', '==', agentId)
    .get();
  
  const agentDoc = await db.collection('conversations').doc(agentId).get();
  const agentData = agentDoc.data();
  
  return {
    name,
    agentId,
    title: agentData?.title || 'Unknown',
    assigned: assignSnapshot.size,
    active: agentData?.activeContextSourceIds?.length || 0
  };
}

async function main() {
  console.log('📊 ESTADO FINAL - 4 AGENTES\n');
  console.log('═'.repeat(80));
  console.log('Usuario: usr_uhwqffaqag1wrryd82tw (alec@salfacloud.cl)');
  console.log('Proyecto: salfagpt');
  console.log('═'.repeat(80) + '\n');
  
  const results = [];
  
  for (const [name, agentId] of Object.entries(AGENTS)) {
    const result = await checkAgent(name, agentId);
    results.push(result);
  }
  
  console.log('| Agente | Title | Sources Asignados | Active Sources | Status |');
  console.log('|--------|-------|-------------------|----------------|--------|');
  
  results.forEach(r => {
    const status = r.assigned > 0 && r.active > 0 ? '✅' : '⚠️';
    console.log(`| ${r.name} | ${r.title} | ${r.assigned} | ${r.active} | ${status} |`);
  });
  
  console.log('\n' + '═'.repeat(80));
  
  const totalAssigned = results.reduce((sum, r) => sum + r.assigned, 0);
  const totalActive = results.reduce((sum, r) => sum + r.active, 0);
  
  console.log(`\nTOTAL SOURCES: ${totalAssigned}`);
  console.log(`TOTAL ACTIVE: ${totalActive}`);
  console.log(`AGENTS READY: ${results.filter(r => r.assigned > 0).length}/4\n`);
  
  // Check processing logs
  console.log('📋 PROCESSING LOGS:\n');
  
  const logs = {
    'S1-v2': '/tmp/s1v2-chunks.log',
    'M1-v2': '/tmp/m1v2-chunks.log',
    'M3-v2': '/tmp/m3v2-chunks.log'
  };
  
  for (const [name, logPath] of Object.entries(logs)) {
    try {
      const { readFileSync } = await import('fs');
      const log = readFileSync(logPath, 'utf-8');
      const match = log.match(/Success: (\d+)/);
      const success = match ? match[1] : '?';
      console.log(`${name}: ${success} docs processed`);
    } catch (e) {
      console.log(`${name}: Log not found`);
    }
  }
  
  process.exit(0);
}

main();

