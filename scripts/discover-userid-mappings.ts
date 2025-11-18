#!/usr/bin/env tsx
/**
 * Discover User ID Mappings
 * 
 * Scans users collection and builds mapping table from
 * Google OAuth numeric ID → Hash format ID
 */

import { firestore } from '../src/lib/firestore.js';
import * as fs from 'fs';

async function discoverMappings(): Promise<void> {
  console.log('🔍 Discovering userId mappings from users collection...\n');
  console.log('='.repeat(80));
  console.log('');
  
  const usersSnap = await firestore.collection('users').get();
  
  const mappings: Record<string, { hashId: string; email: string; name: string }> = {};
  
  usersSnap.docs.forEach(doc => {
    const user = doc.data();
    
    if (user.googleUserId) {
      mappings[user.googleUserId] = {
        hashId: doc.id,
        email: user.email || 'unknown',
        name: user.name || 'Unknown User',
      };
      
      console.log(`  ✅ ${user.name || 'Unknown'} (${user.email || 'no-email'})`);
      console.log(`     Google ID: ${user.googleUserId}`);
      console.log(`     Hash ID: ${doc.id}`);
      console.log('');
    } else {
      console.log(`  ⚠️  User without googleUserId: ${doc.id} (${user.email || 'no-email'})`);
      console.log('');
    }
  });
  
  console.log('='.repeat(80));
  console.log(`\n📊 Found ${Object.keys(mappings).length} user mappings\n`);
  
  // Generate TypeScript mapping object
  const tsMapping = Object.entries(mappings)
    .map(([googleId, info]) => `  '${googleId}': '${info.hashId}', // ${info.email}`)
    .join('\n');
  
  const mappingCode = `// Auto-generated User ID Mapping - ${new Date().toISOString()}
// Google OAuth numeric ID → Hash format ID

export const USER_ID_MAPPING: Record<string, string> = {
${tsMapping}
};

// Reverse mapping (hash → numeric) for lookups
export const REVERSE_USER_ID_MAPPING: Record<string, string> = {
${Object.entries(mappings)
  .map(([googleId, info]) => `  '${info.hashId}': '${googleId}', // ${info.email}`)
  .join('\n')}
};
`;
  
  // Save to file
  const outputPath = 'src/lib/userid-mappings.ts';
  fs.writeFileSync(outputPath, mappingCode);
  
  console.log(`✅ Mapping saved to: ${outputPath}`);
  console.log('');
  console.log('📝 Use this mapping in migration scripts:');
  console.log('');
  console.log('```typescript');
  console.log('import { USER_ID_MAPPING } from "../src/lib/userid-mappings.js";');
  console.log('');
  console.log('for (const [googleId, hashId] of Object.entries(USER_ID_MAPPING)) {');
  console.log('  // Migrate documents...');
  console.log('}');
  console.log('```');
  console.log('');
  
  // Generate summary table
  console.log('📋 MAPPING TABLE:\n');
  console.log('| Google OAuth ID | Hash ID | User Email |');
  console.log('|-----------------|---------|------------|');
  
  Object.entries(mappings).forEach(([googleId, info]) => {
    console.log(`| \`${googleId}\` | \`${info.hashId}\` | ${info.email} |`);
  });
  
  console.log('\n' + '='.repeat(80));
  
  process.exit(0);
}

discoverMappings().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});





