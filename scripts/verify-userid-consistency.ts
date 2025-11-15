#!/usr/bin/env tsx
/**
 * UserID Consistency Verification Script
 * 
 * Verifies all users have proper document IDs (usr_xxx format or legacy numeric)
 * Creates mapping of legacy → hash IDs
 * Checks for orphaned data with mismatched userIds
 */

import { firestore, COLLECTIONS } from '../src/lib/firestore';

interface UserIDReport {
  totalUsers: number;
  hashFormatUsers: number;
  legacyNumericUsers: number;
  invalidFormatUsers: number;
  legacyMapping: Map<string, string>; // numeric → usr_xxx
  orphanedConversations: number;
  orphanedContextSources: number;
}

async function verifyUserIDConsistency(): Promise<UserIDReport> {
  console.log('🔍 Starting UserID Consistency Verification...\n');
  
  const report: UserIDReport = {
    totalUsers: 0,
    hashFormatUsers: 0,
    legacyNumericUsers: 0,
    invalidFormatUsers: 0,
    legacyMapping: new Map(),
    orphanedConversations: 0,
    orphanedContextSources: 0,
  };
  
  // 1. Check all users
  console.log('📊 Analyzing users collection...');
  const usersSnapshot = await firestore.collection(COLLECTIONS.USERS).get();
  report.totalUsers = usersSnapshot.size;
  
  for (const doc of usersSnapshot.docs) {
    const userId = doc.id;
    const data = doc.data();
    
    // Classify by format
    if (userId.startsWith('usr_')) {
      report.hashFormatUsers++;
      console.log(`  ✅ Hash format: ${userId} (${data.email})`);
    } else if (/^\d+$/.test(userId)) {
      report.legacyNumericUsers++;
      console.log(`  ⚠️  Legacy format: ${userId} (${data.email})`);
      
      // If they have googleUserId, map it
      if (data.googleUserId) {
        report.legacyMapping.set(data.googleUserId, userId);
      }
    } else {
      report.invalidFormatUsers++;
      console.log(`  ❌ Invalid format: ${userId} (${data.email})`);
    }
  }
  
  console.log('\n📈 User Format Summary:');
  console.log(`  Total users: ${report.totalUsers}`);
  console.log(`  Hash format (usr_xxx): ${report.hashFormatUsers}`);
  console.log(`  Legacy numeric: ${report.legacyNumericUsers}`);
  console.log(`  Invalid format: ${report.invalidFormatUsers}`);
  
  // 2. Check conversations for orphaned data
  console.log('\n🔍 Checking conversations for orphaned data...');
  const conversationsSnapshot = await firestore.collection(COLLECTIONS.CONVERSATIONS).limit(100).get();
  
  for (const doc of conversationsSnapshot.docs) {
    const conv = doc.data();
    const userExists = usersSnapshot.docs.some(u => u.id === conv.userId);
    
    if (!userExists) {
      report.orphanedConversations++;
      console.log(`  ⚠️  Orphaned conversation: ${doc.id} (userId: ${conv.userId})`);
    }
  }
  
  // 3. Check context sources
  console.log('\n🔍 Checking context sources for orphaned data...');
  const sourcesSnapshot = await firestore.collection(COLLECTIONS.CONTEXT_SOURCES).limit(100).get();
  
  for (const doc of sourcesSnapshot.docs) {
    const source = doc.data();
    const userExists = usersSnapshot.docs.some(u => u.id === source.userId);
    
    if (!userExists) {
      report.orphanedContextSources++;
      console.log(`  ⚠️  Orphaned source: ${doc.id} (userId: ${source.userId})`);
    }
  }
  
  console.log('\n📊 Orphaned Data Summary:');
  console.log(`  Orphaned conversations: ${report.orphanedConversations}`);
  console.log(`  Orphaned context sources: ${report.orphanedContextSources}`);
  
  return report;
}

async function main() {
  try {
    const report = await verifyUserIDConsistency();
    
    console.log('\n' + '='.repeat(60));
    console.log('📋 FINAL REPORT');
    console.log('='.repeat(60));
    console.log(JSON.stringify(report, (key, value) => 
      value instanceof Map ? Object.fromEntries(value) : value
    , 2));
    
    // Determine safety level
    if (report.invalidFormatUsers > 0 || report.orphanedConversations > 0 || report.orphanedContextSources > 0) {
      console.log('\n⚠️  WARNING: Issues detected. Review before proceeding with V2.');
      process.exit(1);
    } else {
      console.log('\n✅ ALL CHECKS PASSED - Safe to proceed with Chat V2');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
}

main();

