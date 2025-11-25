#!/usr/bin/env node

import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (getApps().length === 0) {
  initializeApp({ projectId: 'salfagpt' });
}
const db = getFirestore();

async function getAllTickets() {
  console.log('📋 CONSULTANDO TODOS LOS TICKETS...\n');
  
  // Get all feedback tickets
  const ticketsSnap = await db.collection('feedback_tickets')
    .orderBy('createdAt', 'desc')
    .limit(100)
    .get();

  console.log(`📊 TOTAL: ${ticketsSnap.size} tickets encontrados\n`);
  console.log('═'.repeat(80));

  ticketsSnap.docs.forEach((doc, idx) => {
    const data = doc.data();
    const priority = data.priority?.toUpperCase() || 'MED';
    const status = data.status || 'backlog';
    const category = data.category || 'general';
    
    console.log(`\n${idx + 1}. [${priority}] ${data.title || 'Sin título'}`);
    console.log(`   ID: ${data.ticketId || doc.id}`);
    console.log(`   Tipo: ${category}`);
    console.log(`   Status: ${status}`);
    console.log(`   Lane: ${data.lane || 'backlog'}`);
    console.log(`   Usuario: ${data.reportedByEmail || data.createdByEmail || 'N/A'}`);
    console.log(`   Rol: ${data.reportedByRole || data.createdByRole || 'N/A'}`);
    console.log(`   Domain: ${data.userDomain || 'N/A'}`);
    console.log(`   Fecha: ${data.createdAt?.toDate().toLocaleDateString() || 'N/A'}`);
    
    if (data.description) {
      const desc = data.description.length > 200 
        ? data.description.substring(0, 200) + '...'
        : data.description;
      console.log(`   Descripción: ${desc}`);
    }
    
    if (data.originalFeedback) {
      const fb = data.originalFeedback;
      if (fb.rating) console.log(`   Rating: ${fb.rating}/5 ⭐`);
      if (fb.npsScore) console.log(`   NPS: ${fb.npsScore}/10`);
      if (fb.userComment) {
        const comment = fb.userComment.length > 150
          ? fb.userComment.substring(0, 150) + '...'
          : fb.userComment;
        console.log(`   Comentario: "${comment}"`);
      }
    }
  });

  console.log('\n' + '═'.repeat(80));
  
  // Summary by category
  const byCategory = {};
  const byPriority = {};
  const byStatus = {};
  const byDomain = {};
  
  ticketsSnap.docs.forEach(doc => {
    const data = doc.data();
    
    const cat = data.category || 'uncategorized';
    byCategory[cat] = (byCategory[cat] || 0) + 1;
    
    const pri = data.priority || 'medium';
    byPriority[pri] = (byPriority[pri] || 0) + 1;
    
    const sta = data.status || 'backlog';
    byStatus[sta] = (byStatus[sta] || 0) + 1;
    
    const dom = data.userDomain || 'unknown';
    byDomain[dom] = (byDomain[dom] || 0) + 1;
  });
  
  console.log('\n📊 RESUMEN:\n');
  
  console.log('Por Categoría:');
  Object.entries(byCategory).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
    console.log(`  ${cat}: ${count}`);
  });
  
  console.log('\nPor Prioridad:');
  Object.entries(byPriority).forEach(([pri, count]) => {
    console.log(`  ${pri}: ${count}`);
  });
  
  console.log('\nPor Status:');
  Object.entries(byStatus).forEach(([sta, count]) => {
    console.log(`  ${sta}: ${count}`);
  });
  
  console.log('\nPor Dominio:');
  Object.entries(byDomain).sort((a, b) => b[1] - a[1]).forEach(([dom, count]) => {
    console.log(`  ${dom}: ${count}`);
  });
}

getAllTickets()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });

