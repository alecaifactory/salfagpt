#!/usr/bin/env node
/**
 * Find M1-v2 Agent ID
 * Searches for M1/M001/Legal/Territorial agent in Firestore
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase
initializeApp({ projectId: 'salfagpt' });
const db = getFirestore();

const USER_ID = 'usr_uhwqffaqag1wrryd82tw'; // alec@salfacloud.cl

console.log('🔍 Buscando agente M1-v2 (Asistente Legal Territorial RDI)...\n');

async function findM1Agent() {
  try {
    const snapshot = await db.collection('conversations')
      .where('userId', '==', USER_ID)
      .get();

    console.log(`📊 Total agentes del usuario: ${snapshot.size}\n`);

    let found = false;
    const candidates = [];

    snapshot.docs.forEach(doc => {
      const title = doc.data().title || '';
      const created = doc.data().createdAt?.toDate?.();
      const sources = (doc.data().activeContextSourceIds || []).length;
      
      // Buscar keywords M1/M001/Legal/Territorial/RDI/GOP
      if (title.includes('M1') || title.includes('M001') || 
          title.includes('Legal') || title.includes('Territorial') ||
          title.includes('RDI') || title.includes('GOP')) {
        candidates.push({
          id: doc.id,
          title,
          created,
          sources,
          score: calculateScore(title)
        });
        found = true;
      }
    });

    if (candidates.length > 0) {
      // Sort by score (más keywords = mejor match)
      candidates.sort((a, b) => b.score - a.score);

      console.log('✅ Candidatos encontrados:\n');
      candidates.forEach((agent, idx) => {
        console.log(`${idx + 1}. ${agent.title}`);
        console.log(`   ID: ${agent.id}`);
        console.log(`   Created: ${agent.created}`);
        console.log(`   Sources: ${agent.sources}`);
        console.log(`   Match score: ${agent.score}/5`);
        console.log('');
      });

      console.log('\n🎯 MEJOR CANDIDATO (usar este ID):');
      console.log(`   ${candidates[0].id}`);
      console.log(`   "${candidates[0].title}"`);

    } else {
      console.log('⚠️  No encontrado con keywords. Listando últimos 15 agentes:\n');
      
      const recent = snapshot.docs
        .map(doc => ({
          id: doc.id,
          title: doc.data().title,
          created: doc.data().createdAt?.toDate?.()
        }))
        .sort((a, b) => (b.created?.getTime() || 0) - (a.created?.getTime() || 0))
        .slice(0, 15);

      recent.forEach((agent, idx) => {
        console.log(`${idx + 1}. ${agent.title}`);
        console.log(`   ID: ${agent.id}`);
        console.log(`   Created: ${agent.created}`);
        console.log('');
      });

      console.log('\n💡 Si el agente M1-v2 no aparece arriba:');
      console.log('   1. Verifica el título en webapp');
      console.log('   2. Crea el agente si no existe');
      console.log('   3. Proporciona el ID exacto');
    }

  } catch (error) {
    console.error('❌ Error buscando agente:', error.message);
    process.exit(1);
  }

  process.exit(0);
}

function calculateScore(title) {
  let score = 0;
  const keywords = ['M1', 'M001', 'Legal', 'Territorial', 'RDI', 'GOP'];
  
  keywords.forEach(keyword => {
    if (title.includes(keyword)) score++;
  });
  
  return score;
}

// Execute
findM1Agent();

