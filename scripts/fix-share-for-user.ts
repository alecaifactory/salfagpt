#!/usr/bin/env tsx
/**
 * Fix agent share for user after recreation
 * Updates the sharedWith array with the new user ID
 */

import { firestore, COLLECTIONS } from '../src/lib/firestore.js';

const TARGET_EMAIL = process.env.TARGET_EMAIL || 'dortega@novatec.cl';

async function main() {
  console.log(`🔧 Fixing agent shares for: ${TARGET_EMAIL}\n`);
  
  // Step 1: Get current user ID
  const userSnapshot = await firestore
    .collection(COLLECTIONS.USERS)
    .where('email', '==', TARGET_EMAIL)
    .limit(1)
    .get();
  
  if (userSnapshot.empty) {
    console.log(`❌ User not found: ${TARGET_EMAIL}`);
    console.log('   User must login first to be created');
    process.exit(1);
  }
  
  const currentUserId = userSnapshot.docs[0].id;
  console.log(`✅ Current user ID: ${currentUserId}\n`);
  
  // Step 2: Find all shares that reference this email
  const sharesSnapshot = await firestore
    .collection(COLLECTIONS.AGENT_SHARES)
    .get();
  
  console.log(`🔍 Checking ${sharesSnapshot.size} shares...\n`);
  
  let updatedCount = 0;
  
  for (const shareDoc of sharesSnapshot.docs) {
    const shareData = shareDoc.data();
    const sharedWith = shareData.sharedWith || [];
    
    // Check if this share has the target email
    const hasTargetEmail = sharedWith.some((target: any) => 
      target.email === TARGET_EMAIL
    );
    
    if (hasTargetEmail) {
      console.log(`📝 Share ID: ${shareDoc.id}`);
      console.log(`   Agent: ${shareData.agentId}`);
      console.log(`   Current sharedWith:`, sharedWith);
      
      // Update the user ID for this email
      const updatedSharedWith = sharedWith.map((target: any) => {
        if (target.email === TARGET_EMAIL) {
          console.log(`   🔄 Updating user ID from ${target.id} to ${currentUserId}`);
          return {
            ...target,
            id: currentUserId, // Update to new user ID
          };
        }
        return target;
      });
      
      // Update the share
      await shareDoc.ref.update({
        sharedWith: updatedSharedWith,
        updatedAt: new Date(),
      });
      
      updatedCount++;
      console.log(`   ✅ Share updated\n`);
    }
  }
  
  console.log('='.repeat(60));
  console.log(`✅ Updated ${updatedCount} agent shares`);
  console.log(`📝 User ${TARGET_EMAIL} should now see shared agents`);
  console.log('='.repeat(60));
  
  process.exit(0);
}

main();





