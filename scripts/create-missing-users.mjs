#!/usr/bin/env node
/**
 * Create Missing Users
 * 
 * Creates user documents for the 2 missing users:
 * - iojedaa@maqsa.cl (INGRID OJEDA ALVARADO)
 * - salegria@maqsa.cl (Sebastian ALEGRIA LEIVA)
 * 
 * Usage: npx tsx scripts/create-missing-users.mjs
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ projectId: 'salfagpt' });
const db = getFirestore();

const MISSING_USERS = [
  {
    email: 'iojedaa@maqsa.cl',
    name: 'INGRID OJEDA ALVARADO',
    company: 'Maqsa',
    role: 'expert',
    domain: 'maqsa.cl'
  },
  {
    email: 'salegria@maqsa.cl',
    name: 'Sebastian ALEGRIA LEIVA',
    company: 'Maqsa',
    role: 'expert',
    domain: 'maqsa.cl'
  }
];

function createHashId(email) {
  return 'usr_' + email.toLowerCase()
    .replace('@', '_')
    .replace(/\./g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

async function createUser(userData) {
  const userId = createHashId(userData.email);
  
  console.log(`\n📝 Creating: ${userData.email}`);
  console.log(`   User ID: ${userId}`);
  console.log(`   Name: ${userData.name}`);
  
  // Check if already exists
  const existing = await db.collection('users').doc(userId).get();
  if (existing.exists) {
    console.log(`   ⚠️ User already exists, skipping`);
    return { created: false, userId };
  }

  // Create user document
  await db.collection('users').doc(userId).set({
    email: userData.email.toLowerCase(),
    name: userData.name,
    company: userData.company,
    role: userData.role,
    domain: userData.domain,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    createdBy: 'usr_uhwqffaqag1wrryd82tw', // alec@getaifactory
    source: 'script',
    isActive: true
  });

  console.log(`   ✅ Created successfully`);
  return { created: true, userId };
}

async function main() {
  console.log('\n🔧 CREATING MISSING USERS\n');
  console.log(`Creating ${MISSING_USERS.length} missing users...\n`);

  let created = 0;
  let skipped = 0;

  for (const userData of MISSING_USERS) {
    const result = await createUser(userData);
    if (result.created) {
      created++;
    } else {
      skipped++;
    }
  }

  console.log('\n' + '═'.repeat(80));
  console.log('📊 SUMMARY');
  console.log('═'.repeat(80));
  console.log();
  console.log(`Users created:  ${created}`);
  console.log(`Already existed: ${skipped}`);
  console.log(`Total processed: ${created + skipped}`);
  console.log();

  console.log('═'.repeat(80));
  console.log(`\n✅ USERS CREATED\n`);
  console.log('═'.repeat(80));
  console.log();

  console.log('Next steps:');
  console.log('  1. Re-run: npx tsx scripts/fix-sharing-with-userids.mjs');
  console.log('  2. Verify: npx tsx scripts/verify-agent-sharing.mjs');
  console.log('  3. Refresh UI to see user names\n');

  process.exit(0);
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});




