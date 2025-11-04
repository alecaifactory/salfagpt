#!/usr/bin/env tsx
/**
 * Fix domain enabled field
 * Change isEnabled → enabled for consistency
 */

import { firestore, COLLECTIONS } from '../src/lib/firestore.js';

async function main() {
  console.log('🔧 Fixing domain enabled field...\n');
  
  const snapshot = await firestore
    .collection(COLLECTIONS.ORGANIZATIONS)
    .get();
  
  console.log(`Found ${snapshot.size} domains\n`);
  
  let fixed = 0;
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    
    // Check if has isEnabled but not enabled
    if (data.isEnabled !== undefined && data.enabled === undefined) {
      console.log(`Fixing: ${doc.id}`);
      console.log(`  isEnabled: ${data.isEnabled} → enabled: ${data.isEnabled}`);
      
      await doc.ref.update({
        enabled: data.isEnabled,
      });
      
      fixed++;
    } else if (data.enabled !== undefined) {
      console.log(`✅ ${doc.id} already has 'enabled' field: ${data.enabled}`);
    } else {
      console.log(`⚠️  ${doc.id} has neither field, setting enabled: true`);
      await doc.ref.update({ enabled: true });
      fixed++;
    }
  }
  
  console.log(`\n✅ Fixed ${fixed} domains`);
  
  process.exit(0);
}

main();

