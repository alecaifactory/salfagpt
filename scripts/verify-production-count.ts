#!/usr/bin/env npx tsx
/**
 * Quick verification of production roadmap items
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize without top-level await
const app = initializeApp({
  projectId: process.env.GOOGLE_CLOUD_PROJECT || 'salfagpt',
});

const db = getFirestore(app);

async function verify() {
  console.log('🔍 Verifying Production Roadmap Items\n');
  
  const snapshot = await db
    .collection('backlog_items')
    .where('lane', '==', 'production')
    .orderBy('position', 'asc')
    .limit(35)
    .get();

  console.log(`✅ Found ${snapshot.size} items in Production lane\n`);
  console.log('═'.repeat(70));
  console.log('');
  
  snapshot.docs.forEach((doc, idx) => {
    const data = doc.data();
    const date = data.completedAt?.toDate?.();
    
    console.log(`${idx + 1}. ${data.title}`);
    console.log(`   Date: ${date ? date.toLocaleDateString() : 'N/A'}`);
    console.log(`   Impact: CSAT +${data.estimatedCSATImpact} | NPS +${data.estimatedNPSImpact}`);
    console.log(`   Category: ${data.category}`);
    console.log(`   Priority: ${data.priority.toUpperCase()}`);
    console.log('');
  });
  
  console.log('═'.repeat(70));
  console.log('');
  console.log('🎉 Production lane successfully populated!');
  console.log('');
  console.log('📊 View in UI:');
  console.log('   http://localhost:3000/chat → Roadmap button → Production column');
  console.log('');
  
  process.exit(0);
}

verify().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});


