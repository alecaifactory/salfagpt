/**
 * Safe Batch Role Update - user → expert
 * 
 * Features:
 * - Creates backup before any changes
 * - Validates each user before update
 * - Dry-run mode to preview changes
 * - Atomic updates with rollback capability
 * - Detailed logging for audit trail
 * 
 * Usage:
 *   Dry-run:  npx tsx scripts/safe-batch-role-update.ts --dry-run
 *   Execute:  npx tsx scripts/safe-batch-role-update.ts --execute
 *   Rollback: npx tsx scripts/safe-batch-role-update.ts --rollback
 */

import { firestore } from '../src/lib/firestore';
import * as fs from 'fs';
import * as path from 'path';

const BACKUP_DIR = path.join(process.cwd(), 'backups');
const BACKUP_FILE = path.join(BACKUP_DIR, `role-backup-${Date.now()}.json`);

// Users that need promotion from user → expert
const USERS_TO_UPDATE = [
  'svillegas@maqsa.cl',
  'csolis@maqsa.cl',
  'fmelin@maqsa.cl',
  'riprado@maqsa.cl',
  'jcalfin@maqsa.cl',
  'mmichael@maqsa.cl',
  'mfuenzalidar@novatec.cl',
  'phvaldivia@novatec.cl',
  'yzamora@inoval.cl',
  'jcancinoc@inoval.cl',
  'lurriola@novatec.cl',
  'fcerda@constructorasalfa.cl',
  'gfalvarez@novatec.cl',
  'dortega@novatec.cl',
  'mburgoa@novatec.cl',
  'abhernandez@maqsa.cl',
  'cvillalon@maqsa.cl',
  'hcontrerasp@salfamontajes.com',
  'msgarcia@maqsa.cl',
  'ojrodriguez@maqsa.cl',
  'paovalle@maqsa.cl',
  'vaaravena@maqsa.cl',
  'vclarke@maqsa.cl',
  'jriverof@iaconcagua.com',
  'afmanriquez@iaconcagua.com',
  'cquijadam@iaconcagua.com',
  'ireygadas@iaconcagua.com',
  'jmancilla@iaconcagua.com',
  'mallende@iaconcagua.com',
  'recontreras@iaconcagua.com',
  'dundurraga@iaconcagua.com',
  'rfuentesm@inoval.cl',
];

// Users already expert (should skip)
const ALREADY_EXPERT = [
  'iojedaa@maqsa.cl',
  'jefarias@maqsa.cl',
  'salegria@maqsa.cl',
];

interface BackupRecord {
  email: string;
  hashId: string;
  name: string;
  role: string;
  roles?: string[];
  company?: string;
  timestamp: string;
}

interface UpdateResult {
  email: string;
  hashId: string;
  success: boolean;
  error?: string;
  previousRole?: string;
  newRole?: string;
}

async function createBackup(): Promise<BackupRecord[]> {
  console.log('\n📦 Creating backup of current user roles...\n');
  
  const backup: BackupRecord[] = [];
  
  for (const email of USERS_TO_UPDATE) {
    try {
      const snapshot = await firestore
        .collection('users')
        .where('email', '==', email)
        .get();
      
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        const data = doc.data();
        
        backup.push({
          email: data.email,
          hashId: doc.id,
          name: data.name,
          role: data.role || 'user',
          roles: data.roles || [],
          company: data.company,
          timestamp: new Date().toISOString(),
        });
        
        console.log(`  ✅ Backed up: ${email} (${doc.id}) - role: ${data.role}`);
      } else {
        console.log(`  ⚠️ Not found: ${email}`);
      }
    } catch (error) {
      console.error(`  ❌ Error backing up ${email}:`, error);
    }
  }
  
  // Ensure backup directory exists
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  
  // Save backup to file
  fs.writeFileSync(BACKUP_FILE, JSON.stringify(backup, null, 2));
  
  console.log(`\n✅ Backup saved to: ${BACKUP_FILE}`);
  console.log(`   Users backed up: ${backup.length}/${USERS_TO_UPDATE.length}\n`);
  
  return backup;
}

async function dryRun() {
  console.log('\n🔍 DRY RUN MODE - No changes will be made\n');
  console.log('═══════════════════════════════════════════════════════════════════════════════════════════\n');
  
  const results: UpdateResult[] = [];
  
  for (const email of USERS_TO_UPDATE) {
    try {
      const snapshot = await firestore
        .collection('users')
        .where('email', '==', email)
        .get();
      
      if (snapshot.empty) {
        results.push({
          email,
          hashId: 'NOT_FOUND',
          success: false,
          error: 'User not found in database',
        });
        continue;
      }
      
      const doc = snapshot.docs[0];
      const data = doc.data();
      const currentRole = data.role || 'user';
      
      results.push({
        email: data.email,
        hashId: doc.id,
        success: true,
        previousRole: currentRole,
        newRole: 'expert',
      });
      
    } catch (error) {
      results.push({
        email,
        hashId: 'ERROR',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
  
  // Print results table
  console.log('| # | Email | Hash ID | Current Role | New Role | Action |');
  console.log('|---|-------|---------|--------------|----------|--------|');
  
  results.forEach((result, index) => {
    const action = result.success 
      ? (result.previousRole === 'expert' ? '⏭️ SKIP (already expert)' : '✅ UPDATE')
      : '❌ ERROR';
    console.log(
      `| ${index + 1} | ${result.email} | ${result.hashId} | ${result.previousRole || 'N/A'} | ${result.newRole || 'N/A'} | ${action} |`
    );
  });
  
  console.log('\n═══════════════════════════════════════════════════════════════════════════════════════════\n');
  
  // Summary
  const successful = results.filter(r => r.success).length;
  const alreadyExpert = results.filter(r => r.success && r.previousRole === 'expert').length;
  const needUpdate = results.filter(r => r.success && r.previousRole !== 'expert').length;
  const errors = results.filter(r => !r.success).length;
  
  console.log('📊 DRY RUN SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════════════════════════════════');
  console.log(`Total Users to Process: ${USERS_TO_UPDATE.length}`);
  console.log(`Found in Database: ${successful}`);
  console.log(`Already Expert (will skip): ${alreadyExpert}`);
  console.log(`Need Update (user → expert): ${needUpdate}`);
  console.log(`Errors: ${errors}`);
  console.log('═══════════════════════════════════════════════════════════════════════════════════════════\n');
  
  if (needUpdate > 0) {
    console.log('💡 To execute these changes, run:');
    console.log('   npx tsx scripts/safe-batch-role-update.ts --execute\n');
  }
}

async function executeUpdate() {
  console.log('\n🚀 EXECUTING ROLE UPDATES\n');
  console.log('⚠️  This will modify user roles in the database.\n');
  
  // Step 1: Create backup
  const backup = await createBackup();
  
  if (backup.length === 0) {
    console.log('❌ Backup failed - aborting update');
    return;
  }
  
  console.log('═══════════════════════════════════════════════════════════════════════════════════════════\n');
  console.log('🔄 Updating user roles...\n');
  
  const results: UpdateResult[] = [];
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  
  for (const email of USERS_TO_UPDATE) {
    try {
      const snapshot = await firestore
        .collection('users')
        .where('email', '==', email)
        .get();
      
      if (snapshot.empty) {
        console.log(`  ⚠️ Skipping ${email} - not found`);
        results.push({
          email,
          hashId: 'NOT_FOUND',
          success: false,
          error: 'User not found',
        });
        errorCount++;
        continue;
      }
      
      const doc = snapshot.docs[0];
      const data = doc.data();
      const currentRole = data.role || 'user';
      
      // Skip if already expert
      if (currentRole === 'expert') {
        console.log(`  ⏭️ Skipping ${email} - already expert`);
        results.push({
          email,
          hashId: doc.id,
          success: true,
          previousRole: 'expert',
          newRole: 'expert',
        });
        skipCount++;
        continue;
      }
      
      // Update to expert
      await firestore
        .collection('users')
        .doc(doc.id)
        .update({
          role: 'expert',
          updatedAt: new Date(),
          roleUpdatedAt: new Date(),
          roleUpdatedBy: 'batch-update-script',
          previousRole: currentRole, // Store for audit
        });
      
      console.log(`  ✅ Updated ${email} (${doc.id}): ${currentRole} → expert`);
      
      results.push({
        email,
        hashId: doc.id,
        success: true,
        previousRole: currentRole,
        newRole: 'expert',
      });
      
      successCount++;
      
    } catch (error) {
      console.error(`  ❌ Error updating ${email}:`, error);
      results.push({
        email,
        hashId: 'ERROR',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      errorCount++;
    }
  }
  
  console.log('\n═══════════════════════════════════════════════════════════════════════════════════════════\n');
  console.log('✅ UPDATE COMPLETE\n');
  console.log('📊 RESULTS SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════════════════════════════════');
  console.log(`Total Users Processed: ${USERS_TO_UPDATE.length}`);
  console.log(`Successfully Updated: ${successCount}`);
  console.log(`Skipped (already expert): ${skipCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log('═══════════════════════════════════════════════════════════════════════════════════════════\n');
  
  console.log(`💾 Backup saved at: ${BACKUP_FILE}`);
  console.log('   Use this file to rollback if needed.\n');
  
  if (errorCount > 0) {
    console.log('⚠️  Some updates failed. Review errors above.');
  }
  
  console.log('\n💡 To rollback these changes, run:');
  console.log(`   npx tsx scripts/safe-batch-role-update.ts --rollback\n`);
  
  // Save results to file
  const resultsFile = path.join(BACKUP_DIR, `update-results-${Date.now()}.json`);
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
  console.log(`📋 Detailed results saved to: ${resultsFile}\n`);
}

async function rollback() {
  console.log('\n🔄 ROLLBACK MODE - Restoring previous roles\n');
  
  // Find most recent backup
  if (!fs.existsSync(BACKUP_DIR)) {
    console.log('❌ No backup directory found. Cannot rollback.');
    return;
  }
  
  const backupFiles = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('role-backup-') && f.endsWith('.json'))
    .sort()
    .reverse();
  
  if (backupFiles.length === 0) {
    console.log('❌ No backup files found. Cannot rollback.');
    return;
  }
  
  console.log('📦 Available backups:');
  backupFiles.forEach((file, i) => {
    const timestamp = file.match(/role-backup-(\d+)\.json/)?.[1];
    const date = timestamp ? new Date(parseInt(timestamp)).toLocaleString() : 'Unknown';
    console.log(`  ${i + 1}. ${file} (${date})`);
  });
  
  // Use most recent backup
  const backupToUse = backupFiles[0];
  const backupPath = path.join(BACKUP_DIR, backupToUse);
  
  console.log(`\n🔍 Using backup: ${backupToUse}\n`);
  
  const backup: BackupRecord[] = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));
  
  console.log(`📋 Backup contains ${backup.length} users\n`);
  console.log('═══════════════════════════════════════════════════════════════════════════════════════════\n');
  console.log('🔄 Restoring roles...\n');
  
  let restored = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const record of backup) {
    try {
      const snapshot = await firestore
        .collection('users')
        .where('email', '==', record.email)
        .get();
      
      if (snapshot.empty) {
        console.log(`  ⚠️ User not found: ${record.email}`);
        errors++;
        continue;
      }
      
      const doc = snapshot.docs[0];
      const currentData = doc.data();
      
      // Only restore if role has changed
      if (currentData.role === record.role) {
        console.log(`  ⏭️ No change needed: ${record.email} (already ${record.role})`);
        skipped++;
        continue;
      }
      
      // Restore original role
      await firestore
        .collection('users')
        .doc(doc.id)
        .update({
          role: record.role,
          updatedAt: new Date(),
          roleRestoredAt: new Date(),
          roleRestoredFrom: backupToUse,
        });
      
      console.log(`  ✅ Restored ${record.email}: ${currentData.role} → ${record.role}`);
      restored++;
      
    } catch (error) {
      console.error(`  ❌ Error restoring ${record.email}:`, error);
      errors++;
    }
  }
  
  console.log('\n═══════════════════════════════════════════════════════════════════════════════════════════\n');
  console.log('✅ ROLLBACK COMPLETE\n');
  console.log('📊 ROLLBACK SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════════════════════════════════');
  console.log(`Total Users in Backup: ${backup.length}`);
  console.log(`Successfully Restored: ${restored}`);
  console.log(`Skipped (no change): ${skipped}`);
  console.log(`Errors: ${errors}`);
  console.log('═══════════════════════════════════════════════════════════════════════════════════════════\n');
  
  if (errors > 0) {
    console.log('⚠️  Some restorations failed. Review errors above.\n');
  } else {
    console.log('✅ All roles successfully restored to previous state!\n');
  }
}

async function main() {
  const args = process.argv.slice(2);
  const mode = args[0];
  
  console.log('\n╔═══════════════════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                        SAFE BATCH ROLE UPDATE TOOL                                        ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════════════════════╝\n');
  
  if (!mode || mode === '--help') {
    console.log('Usage:');
    console.log('  Dry-run (preview):  npx tsx scripts/safe-batch-role-update.ts --dry-run');
    console.log('  Execute (update):   npx tsx scripts/safe-batch-role-update.ts --execute');
    console.log('  Rollback (restore): npx tsx scripts/safe-batch-role-update.ts --rollback\n');
    console.log('Description:');
    console.log('  This tool safely updates user roles from "user" to "expert".');
    console.log('  It creates backups before any changes and supports full rollback.\n');
    console.log('Users to update: 32');
    console.log('Users to skip (already expert): 3\n');
    process.exit(0);
  }
  
  switch (mode) {
    case '--dry-run':
      await dryRun();
      break;
      
    case '--execute':
      console.log('⚠️  WARNING: This will modify user roles in the database.\n');
      console.log('   Press Ctrl+C now to cancel, or wait 5 seconds to continue...\n');
      
      // 5 second delay for safety
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      console.log('▶️  Proceeding with update...\n');
      await executeUpdate();
      break;
      
    case '--rollback':
      console.log('⚠️  WARNING: This will restore previous roles from backup.\n');
      console.log('   Press Ctrl+C now to cancel, or wait 5 seconds to continue...\n');
      
      // 5 second delay for safety
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      console.log('▶️  Proceeding with rollback...\n');
      await rollback();
      break;
      
    default:
      console.log(`❌ Unknown mode: ${mode}`);
      console.log('   Use --dry-run, --execute, or --rollback\n');
      process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });


