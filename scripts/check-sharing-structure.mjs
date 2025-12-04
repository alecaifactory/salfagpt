#!/usr/bin/env node
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({ projectId: 'salfagpt' });
const db = getFirestore();

async function main() {
  const agentDoc = await db.collection('conversations').doc('vStojK73ZKbjNsEnqANJ').get();
  const sharedWith = agentDoc.data()?.sharedWith || [];

  console.log('Current sharedWith structure (first 2 entries):');
  console.log(JSON.stringify(sharedWith.slice(0, 2), null, 2));
  console.log(`\nTotal shared: ${sharedWith.length}`);
  
  // Check if userId field exists
  console.log('\nChecking for userId field:');
  sharedWith.slice(0, 3).forEach((share, i) => {
    console.log(`Entry ${i + 1}:`, {
      email: share.email,
      name: share.name,
      userId: share.userId || 'MISSING',
      hasUserId: !!share.userId
    });
  });

  process.exit(0);
}

main();




