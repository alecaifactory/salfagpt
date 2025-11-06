#!/usr/bin/env tsx
/**
 * Remove Duplicate Users
 * Keeps the most recently created user, deletes older duplicates
 */

import { firestore, COLLECTIONS } from '../src/lib/firestore.js';

const DRY_RUN = process.env.DRY_RUN === 'true';

async function main() {
  console.log('🔍 Finding Duplicate Users\n');
  console.log('='.repeat(80));
  console.log(`Mode: ${DRY_RUN ? '🧪 DRY RUN (no deletions)' : '⚠️  LIVE (will delete duplicates)'}\n`);
  
  // Load all users
  const usersSnapshot = await firestore
    .collection(COLLECTIONS.USERS)
    .get();
  
  console.log(`Total users in database: ${usersSnapshot.size}\n`);
  
  // Group users by email (case-insensitive)
  const usersByEmail = new Map<string, Array<{
    id: string;
    data: any;
    doc: any;
  }>>();
  
  usersSnapshot.docs.forEach(doc => {
    const data = doc.data();
    const email = data.email?.toLowerCase();
    
    if (!email) {
      console.warn(`⚠️  User ${doc.id} has no email, skipping`);
      return;
    }
    
    if (!usersByEmail.has(email)) {
      usersByEmail.set(email, []);
    }
    
    usersByEmail.get(email)!.push({
      id: doc.id,
      data,
      doc,
    });
  });
  
  // Find duplicates
  const duplicates = Array.from(usersByEmail.entries())
    .filter(([_, users]) => users.length > 1);
  
  console.log(`Duplicate emails found: ${duplicates.length}\n`);
  
  if (duplicates.length === 0) {
    console.log('✅ No duplicate users found!');
    process.exit(0);
  }
  
  // Process each duplicate
  let totalDeleted = 0;
  
  for (const [email, users] of duplicates) {
    console.log(`\n📧 Email: ${email} (${users.length} accounts)`);
    console.log('─'.repeat(80));
    
    // Sort by createdAt (newest first)
    users.sort((a, b) => {
      const dateA = a.data.createdAt?.toDate?.() || new Date(0);
      const dateB = b.data.createdAt?.toDate?.() || new Date(0);
      return dateB.getTime() - dateA.getTime();
    });
    
    // Keep the first one (newest), delete the rest
    const toKeep = users[0];
    const toDelete = users.slice(1);
    
    console.log(`\n✅ KEEPING (newest):`);
    console.log(`   ID: ${toKeep.id}`);
    console.log(`   Name: ${toKeep.data.name}`);
    console.log(`   Email: ${toKeep.data.email}`);
    console.log(`   Created: ${toKeep.data.createdAt?.toDate?.() || 'unknown'}`);
    
    console.log(`\n❌ DELETING (${toDelete.length} older ${toDelete.length === 1 ? 'account' : 'accounts'}):`);
    
    for (const user of toDelete) {
      console.log(`   • ID: ${user.id}`);
      console.log(`     Name: ${user.data.name}`);
      console.log(`     Email: ${user.data.email}`);
      console.log(`     Created: ${user.data.createdAt?.toDate?.() || 'unknown'}`);
      
      if (!DRY_RUN) {
        // Delete the user
        await user.doc.ref.delete();
        console.log(`     ✅ Deleted`);
      } else {
        console.log(`     🧪 Would delete (DRY RUN)`);
      }
      
      totalDeleted++;
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 SUMMARY');
  console.log('='.repeat(80));
  console.log(`Duplicate email addresses: ${duplicates.length}`);
  console.log(`Accounts deleted: ${totalDeleted}`);
  console.log(`Accounts kept: ${duplicates.length}`);
  console.log('='.repeat(80));
  
  if (DRY_RUN) {
    console.log('\n🧪 DRY RUN COMPLETE - No data was actually deleted');
    console.log('💡 To perform actual deletion, run: DRY_RUN=false npx tsx scripts/remove-duplicate-users.ts');
  } else {
    console.log('\n✅ DUPLICATE REMOVAL COMPLETE');
    console.log('\nRemaining users should now have unique emails.');
  }
  
  process.exit(0);
}

main();



