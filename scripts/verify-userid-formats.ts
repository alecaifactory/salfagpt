#!/usr/bin/env tsx
/**
 * Verify userId Formats Across Collections
 * 
 * Checks all collections for numeric vs hash userId format
 * Identifies which collections need migration
 */

import { firestore, COLLECTIONS } from '../src/lib/firestore.js';

const COLLECTIONS_TO_CHECK = [
  'context_sources',
  'document_chunks',
  'message_feedback',
  'feedback_tickets',
  'message_queue',
  'user_sessions',
  'usage_logs',
  'cli_events',
  'agent_prompt_versions',
  'tool_executions',
  'document_annotations',
  'collaboration_invitations',
  'quality_funnel_events',
  'user_badges',
  'achievement_events',
  'csat_events',
  'nps_events',
];

interface CollectionStats {
  total: number;
  hashFormat: number;
  numericFormat: number;
  noUserId: number;
  sampleNumericId?: string;
  sampleHashId?: string;
}

async function verifyFormats(): Promise<void> {
  console.log('🔍 Verifying userId formats across collections...\n');
  console.log('=' .repeat(80));
  console.log('\n');
  
  const results: Map<string, CollectionStats> = new Map();
  let totalIssues = 0;
  
  for (const collectionName of COLLECTIONS_TO_CHECK) {
    try {
      console.log(`📋 Checking ${collectionName}...`);
      
      const snapshot = await firestore.collection(collectionName).limit(1000).get();
      
      if (snapshot.empty) {
        console.log(`   ℹ️  Empty collection - skipping\n`);
        continue;
      }
      
      const stats: CollectionStats = {
        total: snapshot.size,
        hashFormat: 0,
        numericFormat: 0,
        noUserId: 0,
      };
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const userId = data.userId || data.user_id || data.reportedBy;
        
        if (!userId) {
          stats.noUserId++;
        } else if (/^\d+$/.test(userId)) {
          stats.numericFormat++;
          if (!stats.sampleNumericId) {
            stats.sampleNumericId = userId;
          }
        } else if (/^usr_/.test(userId)) {
          stats.hashFormat++;
          if (!stats.sampleHashId) {
            stats.sampleHashId = userId;
          }
        }
      });
      
      results.set(collectionName, stats);
      
      const status = stats.numericFormat === 0 ? '✅' : '❌';
      console.log(`   ${status} Total: ${stats.total}`);
      console.log(`      Hash format: ${stats.hashFormat}`);
      console.log(`      Numeric format: ${stats.numericFormat}`);
      
      if (stats.noUserId > 0) {
        console.log(`      ⚠️  No userId: ${stats.noUserId}`);
      }
      
      if (stats.numericFormat > 0) {
        console.log(`      Sample numeric: ${stats.sampleNumericId}`);
        totalIssues += stats.numericFormat;
      }
      
      if (stats.hashFormat > 0 && stats.sampleHashId) {
        console.log(`      Sample hash: ${stats.sampleHashId.substring(0, 20)}...`);
      }
      
      console.log('');
    } catch (error) {
      console.error(`   ❌ Error checking ${collectionName}:`, error);
      console.log('');
    }
  }
  
  // Summary
  console.log('=' .repeat(80));
  console.log('\n📊 SUMMARY\n');
  
  const needsMigration: string[] = [];
  const clean: string[] = [];
  
  results.forEach((stats, collection) => {
    if (stats.numericFormat > 0) {
      needsMigration.push(collection);
    } else {
      clean.push(collection);
    }
  });
  
  if (needsMigration.length > 0) {
    console.log('❌ Collections needing migration:');
    needsMigration.forEach(c => {
      const stats = results.get(c)!;
      console.log(`   - ${c}: ${stats.numericFormat} documents`);
    });
    console.log('');
  }
  
  if (clean.length > 0) {
    console.log('✅ Collections already clean:');
    clean.forEach(c => console.log(`   - ${c}`));
    console.log('');
  }
  
  if (totalIssues === 0) {
    console.log('🎉 ALL COLLECTIONS CLEAN - No migration needed!');
  } else {
    console.log(`⚠️  Total documents to migrate: ${totalIssues}`);
    console.log('');
    console.log('Next steps:');
    console.log('1. Run: npm run migrate:userid -- --collection=<name> --dry-run');
    console.log('2. Review changes carefully');
    console.log('3. Run: npm run migrate:userid -- --collection=<name> --execute');
  }
  
  console.log('\n' + '='.repeat(80));
  
  process.exit(totalIssues > 0 ? 1 : 0);
}

verifyFormats().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});






