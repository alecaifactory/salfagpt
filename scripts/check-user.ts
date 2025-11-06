#!/usr/bin/env tsx
/**
 * Check if user exists
 */

import { firestore, COLLECTIONS } from '../src/lib/firestore.js';

const TARGET_EMAIL = process.env.TARGET_EMAIL || 'dortega@novatec.cl';

async function main() {
  console.log(`🔍 Checking for user: ${TARGET_EMAIL}\n`);
  
  const snapshot = await firestore
    .collection(COLLECTIONS.USERS)
    .where('email', '==', TARGET_EMAIL)
    .limit(1)
    .get();
  
  if (snapshot.empty) {
    console.log('❌ User NOT found');
    console.log('   User needs to login first to be created');
  } else {
    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();
    console.log('✅ User found:');
    console.log(`   ID: ${userDoc.id}`);
    console.log(`   Name: ${userData.name}`);
    console.log(`   Email: ${userData.email}`);
    console.log(`   Role: ${userData.role || 'user'}`);
    console.log(`   Created: ${userData.createdAt?.toDate?.() || 'unknown'}`);
  }
  
  process.exit(0);
}

main();



